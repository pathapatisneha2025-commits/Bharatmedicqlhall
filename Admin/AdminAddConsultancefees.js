import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DoctorConsultantFeesScreen() {
  const navigation = useNavigation();

  const [doctors, setDoctors] = useState([]);
  const [feesData, setFeesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [fees, setFees] = useState("");
  const [editId, setEditId] = useState(null);

  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.style !== "cancel");
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

  // Fetch doctors for dropdown
  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/all`);
      const result = await response.json();
      setDoctors(result);

      if (result.length > 0) {
        const firstDoc = result[0];
        setSelectedDoctorName(firstDoc.name);
        setDoctorEmail(firstDoc.email);
      }
    } catch (error) {
      showAlert("Error", "Failed to fetch doctors");
    }
  };

  // Fetch all fees records
  const fetchFeesData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/doctorconsultancefee/all`);
      const result = await response.json();
      setFeesData(result);
    } catch (error) {
      showAlert("Error", "Failed to fetch fees data");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchFeesData();
  }, []);

  const handleDoctorChange = (name) => {
    setSelectedDoctorName(name);
    const doc = doctors.find((d) => d.name === name);
    setDoctorEmail(doc ? doc.email : "");
  };

  const resetForm = () => {
    if (doctors.length > 0) {
      const firstDoc = doctors[0];
      setSelectedDoctorName(firstDoc.name);
      setDoctorEmail(firstDoc.email);
    } else {
      setSelectedDoctorName("");
      setDoctorEmail("");
    }
    setFees("");
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!selectedDoctorName || !doctorEmail || !fees) {
      showAlert("Validation Error", "All fields are required!");
      return;
    }

    const payload = {
      doctor_name: selectedDoctorName,
      email: doctorEmail,
      fees: parseInt(fees),
    };

    try {
      setLoading(true);
      const url = editId 
        ? `${BASE_URL}/doctorconsultancefee/update/${editId}` 
        : `${BASE_URL}/doctorconsultancefee/add`;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showAlert("Success", editId ? "Fees updated successfully" : "Fees added successfully");
        resetForm();
        fetchFeesData();
      } else {
        showAlert("Error", result.message || "Something went wrong");
      }
    } catch (error) {
      showAlert("Error", "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedDoctorName(item.doctor_name);
    setDoctorEmail(item.doctor_email);
    setFees(item.fees.toString());
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    showAlert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/doctorconsultancefee/delete/${id}`, { method: "DELETE" });
            if (response.ok) {
              showAlert("Success", "Record deleted successfully");
              fetchFeesData();
            } else {
              showAlert("Error", "Failed to delete record");
            }
          } catch (error) {
            showAlert("Error", "Failed to delete data");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderTableRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { width: 60 }]}>#{index + 1}</Text>
      <Text style={[styles.tableCell, { width: 180, fontWeight: '600' }]}>{item.doctor_name}</Text>
      <Text style={[styles.tableCell, { width: 220 }]}>{item.doctor_email}</Text>
      <Text style={[styles.tableCell, { width: 120, color: '#2563eb', fontWeight: 'bold' }]}>₹{item.fees}</Text>
      <View style={styles.actionCell}>
        <TouchableOpacity style={styles.actionIcon} onPress={() => handleEdit(item)}>
          <Feather name="edit-2" size={16} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]} onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10 }}>Processing... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.webWrapper}>
      <View style={styles.mainContent}>
        
        {/* CONTENT HEADER */}
        <View style={styles.contentHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.mainTitle}>Consultant Fees</Text>
              <Text style={styles.subTitle}>Manage specialist consultation charges and profiles</Text>
            </View>
          </View>
        </View>

        <View style={styles.flexRow}>
          {/* FORM CARD */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>{editId ? "Update Consultant Fee" : "Configure Fee Rate"}</Text>
            
            <Text style={styles.fieldLabel}>Specialist Name</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={selectedDoctorName} onValueChange={handleDoctorChange}>
                {doctors.map((doc) => (
                  <Picker.Item key={doc.id} label={doc.name} value={doc.name} />
                ))}
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Doctor Email</Text>
            <View style={styles.disabledInput}>
              <Feather name="mail" size={18} color="#94a3b8" />
              <TextInput style={styles.inputStyle} value={doctorEmail} editable={false} />
            </View>

            <Text style={styles.fieldLabel}>Consultation Fee (INR)</Text>
            <View style={styles.activeInput}>
              <Feather name="tag" size={18} color="#2563eb" />
              <TextInput 
                style={styles.inputStyle} 
                placeholder="0.00" 
                keyboardType="numeric" 
                value={fees} 
                onChangeText={setFees} 
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{editId ? "Update Pricing" : "Save Pricing"}</Text>
            </TouchableOpacity>
            
            {editId && (
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancel Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* TABLE CARD */}
          <View style={styles.tableCard}>
            <View style={styles.tableCardHeader}>
              <Text style={styles.cardTitle}>Fee Directory</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 60 }]}>S.No</Text>
                  <Text style={[styles.headerCell, { width: 180 }]}>Doctor</Text>
                  <Text style={[styles.headerCell, { width: 220 }]}>Email</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Fees</Text>
                  <Text style={[styles.headerCell, { width: 100, textAlign: 'center' }]}>Actions</Text>
                </View>
                <FlatList
                  data={feesData}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderTableRow}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  mainContent: { flex: 1, padding: 32 },
  contentHeader: { marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4 },

  flexRow: { flexDirection: "row", gap: 24, flex: 1 },
  formCard: { width: 350, backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", alignSelf: 'flex-start' },
  tableCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: 'hidden' },
  tableCardHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, marginTop: 16 },
  pickerWrapper: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, backgroundColor: "#f8fafc", overflow: 'hidden' },
  disabledInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12 },
  activeInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#2563eb", borderRadius: 10, paddingHorizontal: 12 },
  inputStyle: { flex: 1, height: 45, marginLeft: 10, color: "#1e293b" },

  submitBtn: { backgroundColor: "#2563eb", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 24 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { marginTop: 12, padding: 10, alignItems: "center" },
  cancelBtnText: { color: "#ef4444", fontWeight: "600" },

  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  tableCell: { fontSize: 14, color: "#334155" },
  actionCell: { width: 100, flexDirection: "row", justifyContent: "center", gap: 8 },
  actionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" }
});