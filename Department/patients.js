// screens/AdminManageCustomerScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const API_BASE = "https://hospitaldatabasemanagement.onrender.com/patient";

const ManageCustomerScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const modalWidth = 500;

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/all`);
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      showAlert("Error", "Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (item) =>
      item.first_name.toLowerCase().includes(search.toLowerCase()) ||
      item.last_name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone_number.includes(search)
  );

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      gender: patient.gender,
      phone_number: patient.phone_number,
      email: patient.email,
      password: "",
      confirm_password: "",
    });
    setEditModalVisible(true);
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setViewModalVisible(true);
  };

  const updatePatient = async () => {
    const { first_name, last_name, gender, phone_number, email } = formData;
    if (!first_name || !last_name || !gender || !phone_number || !email) {
      showAlert("Validation", "All fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/update/${selectedPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        showAlert("Success", data.message);
        setEditModalVisible(false);
        fetchPatients();
      } else {
        showAlert("Error", data.message || "Failed to update patient");
      }
    } catch (error) {
      showAlert("Error", "Something went wrong while updating");
    }
  };

  const deletePatient = async (id) => {
    showAlert("Confirm Delete", "Are you sure you want to delete this patient?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (response.ok) {
              showAlert("Deleted", data.message);
              fetchPatients();
            } else {
              showAlert("Error", data.message || "Failed to delete patient");
            }
          } catch (error) {
            showAlert("Error", "Something went wrong");
          }
        },
      },
    ]);
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const downloadCSV = async () => {
    if (!patients.length) {
      alert('No patient data to download');
      return;
    }
    const header = ['First Name', 'Last Name', 'Gender', 'Phone', 'Email'];
    const rows = patients.map(p => [p.first_name, p.last_name, p.gender, formatPhone(p.phone_number), p.email]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patients.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const fileUri = FileSystem.cacheDirectory + 'patients.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    }
  };

 

  const renderRow = ({ item, index }) => (
    <View style={styles.tableBodyRow}>
      <Text style={[styles.bodyCell, { width: 60 }]}>#{index + 1}</Text>
      <Text style={[styles.bodyCell, { width: 140, fontWeight: "600" }]}>{item.first_name}</Text>
      <Text style={[styles.bodyCell, { width: 140, fontWeight: "600" }]}>{item.last_name}</Text>
      <Text style={[styles.bodyCell, { width: 100 }]}>{item.gender}</Text>
      <Text style={[styles.bodyCell, { width: 140 }]}>{item.phone_number}</Text>
      <Text style={[styles.bodyCell, { width: 220 }]} numberOfLines={1}>{item.email}</Text>
      <View style={[styles.actionCellWeb, { width: 160 }]}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => handleView(item)}>
          <Feather name="eye" size={16} color="#0ea5e9" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]} onPress={() => handleEdit(item)}>
          <Feather name="edit-2" size={16} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]} onPress={() => deletePatient(item.id)}>
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.webWrapper}>
    

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
   <View style={styles.contentHeader}>
  {/* LEFT: Back + Title */}
  <View style={styles.headerLeft}>
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={22} color="#1e293b" />
    </TouchableOpacity>

    <View>
      <Text style={styles.mainTitle}>Patient Management</Text>
      <Text style={styles.subTitle}>
        View and manage all registered patient records
      </Text>
    </View>
  </View>

  {/* RIGHT: Export */}
  {/* <TouchableOpacity onPress={downloadCSV} style={styles.exportBtn}>
    <Feather name="download" size={20} color="#fff" />
    <Text style={styles.exportBtnText}>Export CSV</Text>
  </TouchableOpacity> */}
</View>



        <View style={styles.tableCard}>
          <View style={styles.cardTop}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInputWeb}
                placeholder="Search by name or phone..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loaderText}>Loading ({loadingCount}s)...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.headerCell, { width: 60 }]}>S.No</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>First Name</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Last Name</Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>Gender</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Phone</Text>
                  <Text style={[styles.headerCell, { width: 220 }]}>Email</Text>
                  <Text style={[styles.headerCell, { width: 160, textAlign: 'center' }]}>Actions</Text>
                </View>
                <FlatList
                  data={filteredPatients}
                  renderItem={renderRow}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* VIEW MODAL */}
      <Modal visible={viewModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: modalWidth }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Record</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedPatient && (
              <ScrollView style={styles.modalScroll}>
                {[
                  { label: "First Name", value: selectedPatient.first_name, icon: "user" },
                  { label: "Last Name", value: selectedPatient.last_name, icon: "user" },
                  { label: "Gender", value: selectedPatient.gender, icon: "users" },
                  { label: "Phone", value: selectedPatient.phone_number, icon: "phone" },
                  { label: "Email", value: selectedPatient.email, icon: "mail" },
                ].map((item, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Feather name={item.icon} size={16} color="#2563eb" style={{ marginRight: 12 }} />
                    <View>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setViewModalVisible(false)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: modalWidth }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Patient</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Feather name="user" size={18} color="#2563eb" />
                <TextInput style={styles.inputWeb} placeholder="First Name" value={formData.first_name} onChangeText={(t)=>setFormData({...formData, first_name:t})} />
              </View>
              <View style={styles.inputGroup}>
                <Feather name="user" size={18} color="#2563eb" />
                <TextInput style={styles.inputWeb} placeholder="Last Name" value={formData.last_name} onChangeText={(t)=>setFormData({...formData, last_name:t})} />
              </View>
              <View style={styles.inputGroup}>
                <Feather name="users" size={18} color="#2563eb" />
                <TextInput style={styles.inputWeb} placeholder="Gender" value={formData.gender} onChangeText={(t)=>setFormData({...formData, gender:t})} />
              </View>
              <View style={styles.inputGroup}>
                <Feather name="phone" size={18} color="#2563eb" />
                <TextInput style={styles.inputWeb} placeholder="Phone" value={formData.phone_number} onChangeText={(t)=>setFormData({...formData, phone_number:t})} />
              </View>
              <View style={styles.inputGroup}>
                <Feather name="mail" size={18} color="#2563eb" />
                <TextInput style={styles.inputWeb} placeholder="Email" value={formData.email} onChangeText={(t)=>setFormData({...formData, email:t})} />
              </View>
              <View style={styles.inputGroup}>
                <Feather name="lock" size={18} color="#2563eb" />
                <TextInput style={styles.inputWeb} placeholder="New Password" secureTextEntry={!showPassword} value={formData.password} onChangeText={(t)=>setFormData({...formData, password:t})} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={updatePatient}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtnWeb} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  webWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  sidebar: { width: 260, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 24 },
  sidebarBrand: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  headerLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
},

backBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#f1f5f9",
  justifyContent: "center",
  alignItems: "center",
},

  brandIcon: { width: 38, height: 38, backgroundColor: "#2563EB", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  brandLetter: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  brandSub: { fontSize: 12, color: "#64748b", marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: "#2563EB" },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: "#64748b", fontWeight: "600" },
  sidebarLabelActive: { color: "#fff" },
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 12 },
  logoutText: { marginLeft: 12, color: "#ef4444", fontWeight: "700" },

  mainContent: { flex: 1, padding: 32 },
  contentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4 },
  exportBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#10b981", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  exportBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8 },

  tableCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", flex: 1, overflow: "hidden" },
  cardTop: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 16, width: 350 },
  searchInputWeb: { paddingVertical: 10, marginLeft: 10, flex: 1, outlineStyle: 'none' },
  
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableBodyRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  bodyCell: { fontSize: 14, color: "#334155" },
  actionCellWeb: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0f9ff", justifyContent: "center", alignItems: "center" },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#64748b" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: "90%", borderRadius: 16, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  modalScroll: { marginBottom: 20 },
  
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, backgroundColor: "#f8fafc", padding: 12, borderRadius: 8 },
  detailLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  detailValue: { fontSize: 15, color: "#1e293b", fontWeight: "600" },
  
  inputGroup: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: "#f8fafc" },
  inputWeb: { flex: 1, height: 45, marginLeft: 10, outlineStyle: 'none' },
  
  modalActions: { flexDirection: "row", gap: 12 },
  saveBtn: { flex: 2, backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtnWeb: { flex: 1, backgroundColor: "#f1f5f9", padding: 14, borderRadius: 10, alignItems: "center" },
  cancelBtnText: { color: "#475569", fontWeight: "700" },
  closeBtn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center" },
  closeBtnText: { color: "#fff", fontWeight: "700" }
});

export default ManageCustomerScreen;