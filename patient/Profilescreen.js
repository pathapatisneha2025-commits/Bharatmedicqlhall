import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/patient";

const ProfileScreen = ({ navigation }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const getPatientId = async () => await AsyncStorage.getItem("patientId");

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      const patientId = await getPatientId();
      if (!patientId) {
        showAlert("Error", "No patient ID found.");
        return;
      }
      const response = await fetch(`${BASE_URL}/${patientId}`);
      const data = await response.json();
      if (response.ok && data.patient) setPatient(data.patient);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatientProfile(); }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("patientId");
      navigation.replace("SelectRole");
    } catch (error) {
      showAlert("Error", "Failed to logout.");
    }
  };

  const openEditModal = () => {
    setEditData({
      first_name: patient?.first_name || "",
      last_name: patient?.last_name || "",
      gender: patient?.gender || "",
      phone_number: patient?.phone_number || "",
      email: patient?.email || "",
      password: "",
      confirm_password: "",
    });
    setEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!editData.first_name || !editData.last_name || !editData.email) {
      showAlert("Error", "Please fill required fields.");
      return;
    }
    if (editData.password && editData.password !== editData.confirm_password) {
      showAlert("Error", "Passwords do not match.");
      return;
    }

    try {
      const patientId = await getPatientId();
      const response = await fetch(`${BASE_URL}/update/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await response.json();
      if (response.ok) {
        setPatient(data.patient);
        setEditModalVisible(false);
        showAlert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      showAlert("Error", "Update failed.");
    }
  };

  const SidebarItem = ({ icon, label, screen, active = false }) => (
    <TouchableOpacity
      style={[styles.sidebarItem, active && styles.sidebarItemActive]}
      onPress={() => navigation.navigate(screen)}
    >
      <Icon name={icon} size={22} color={active ? "#fff" : "#BFDBFE"} />
      <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#3B82F6" /></View>;

  return (
    <View style={styles.mainContainer}>
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Image source={require("../assets/Logo.jpg")} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.brandMain}>Bharat Medical</Text>
            <Text style={styles.brandSub}>Dashboard</Text>
          </View>
        </View>
        <View style={styles.sidebarMenu}>
          <SidebarItem icon="grid-outline" label="Dashboard" screen="patienthomescreen" />
          <SidebarItem icon="people-outline" label="Find Doctor" screen="DoctorScreen" />
          <SidebarItem icon="calendar-outline" label="Appointments" screen="PatientAppointmentsScreen" />
          <SidebarItem icon="cart-outline" label="Medicine Store" screen="MedicineScreen" />
          <SidebarItem icon="bag-handle-outline" label="My Orders" screen="patientorders" />
          <SidebarItem icon="person-outline" label="My Profile" screen="PatientProfile" active />
        </View>
      </View>

      <View style={styles.contentArea}>
        {/* NAVBAR */}
        <View style={styles.navbar}>
          <Text style={styles.navTitle}>My Account Profile</Text>
          <TouchableOpacity style={styles.logoutBtnTop} onPress={handleLogout}>
            <Text style={styles.logoutBtnTextTop}>Logout</Text>
            <Icon name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollPadding}>
          {/* PROFILE CARD */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{patient?.first_name?.[0]}{patient?.last_name?.[0]}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{patient?.first_name} {patient?.last_name}</Text>
              <Text style={styles.profileEmail}>{patient?.email}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.dot} />
                <Text style={styles.statusText}>Active Patient Account</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editMainBtn} onPress={openEditModal}>
              <Icon name="pencil" size={18} color="#fff" />
              <Text style={styles.editMainBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.desktopGrid}>
            {/* LEFT COLUMN: DETAILS */}
            <View style={styles.detailsColumn}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              <View style={styles.infoGrid}>
                <DetailItem label="First Name" value={patient?.first_name} icon="person-outline" />
                <DetailItem label="Last Name" value={patient?.last_name} icon="person-outline" />
                <DetailItem label="Gender" value={patient?.gender} icon="transgender-outline" />
                <DetailItem label="Phone Number" value={patient?.phone_number} icon="call-outline" />
              </View>
            </View>

            {/* RIGHT COLUMN: ACCOUNT NAVIGATION */}
            <View style={styles.actionsColumn}>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate("PatientAppointmentsScreen")}>
                <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Icon name="calendar-outline" size={22} color="#0284C7" />
                </View>
                <Text style={styles.actionLabel}>My Appointments</Text>
                <Icon name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate("patientorders")}>
                <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Icon name="bag-handle-outline" size={22} color="#16A34A" />
                </View>
                <Text style={styles.actionLabel}>Order History</Text>
                <Icon name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* EDIT MODAL */}
      <Modal animationType="fade" transparent visible={editModalVisible}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile Information</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <TextInput style={styles.input} placeholder="First Name" value={editData.first_name} onChangeText={(t)=>setEditData({...editData, first_name:t})} />
                <TextInput style={styles.input} placeholder="Last Name" value={editData.last_name} onChangeText={(t)=>setEditData({...editData, last_name:t})} />
              </View>
              <TextInput style={styles.input} placeholder="Gender" value={editData.gender} onChangeText={(t)=>setEditData({...editData, gender:t})} />
              <TextInput style={styles.input} placeholder="Phone Number" value={editData.phone_number} onChangeText={(t)=>setEditData({...editData, phone_number:t})} />
              <TextInput style={styles.input} placeholder="Email" value={editData.email} onChangeText={(t)=>setEditData({...editData, email:t})} />
              
              <View style={styles.passWrapper}>
                <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="New Password" secureTextEntry={!showPassword} value={editData.password} onChangeText={(t)=>setEditData({...editData, password:t})} />
                <TouchableOpacity onPress={()=>setShowPassword(!showPassword)} style={styles.eye}><Icon name={showPassword?"eye-off":"eye"} size={20} color="#64748B"/></TouchableOpacity>
              </View>

              <View style={styles.passWrapper}>
                <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Confirm Password" secureTextEntry={!showConfirmPassword} value={editData.confirm_password} onChangeText={(t)=>setEditData({...editData, confirm_password:t})} />
                <TouchableOpacity onPress={()=>setShowConfirmPassword(!showConfirmPassword)} style={styles.eye}><Icon name={showConfirmPassword?"eye-off":"eye"} size={20} color="#64748B"/></TouchableOpacity>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={()=>setEditModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile}><Text style={styles.saveText}>Save Changes</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const DetailItem = ({ label, value, icon }) => (
  <View style={styles.detailItem}>
    <Icon name={icon} size={20} color="#3B82F6" style={styles.detailIcon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  sidebar: { width: 280, backgroundColor: "#3B82F6", padding: 25, height: "100%" },
  sidebarHeader: { flexDirection: "row", alignItems: "center", marginBottom: 40, gap: 12 },
  logo: { width: 45, height: 45, borderRadius: 10, backgroundColor: "#fff" },
  brandMain: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  brandSub: { fontSize: 12, color: "#BFDBFE" },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 12, marginBottom: 10 },
  sidebarItemActive: { backgroundColor: "#1E40AF" },
  sidebarLabel: { marginLeft: 15, fontSize: 15, fontWeight: "600", color: "#BFDBFE" },
  sidebarLabelActive: { color: "#fff" },

  contentArea: { flex: 1 },
  navbar: { height: 80, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 40, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  navTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  logoutBtnTop: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10 },
  logoutBtnTextTop: { color: '#EF4444', fontWeight: '700', fontSize: 15 },

  scrollPadding: { padding: 40 },
  profileHeaderCard: { backgroundColor: "#fff", borderRadius: 24, padding: 30, flexDirection: 'row', alignItems: 'center', elevation: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#3B82F6", justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "800" },
  profileMeta: { flex: 1, marginLeft: 30 },
  profileName: { fontSize: 28, fontWeight: "800", color: "#1E293B" },
  profileEmail: { fontSize: 16, color: "#64748B", marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  statusText: { color: '#16A34A', fontSize: 12, fontWeight: '700' },
  editMainBtn: { backgroundColor: "#3B82F6", flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  editMainBtnText: { color: "#fff", fontWeight: "700" },

  desktopGrid: { flexDirection: 'row', gap: 30, marginTop: 40 },
  detailsColumn: { flex: 2, backgroundColor: "#fff", borderRadius: 24, padding: 30, borderWidth: 1, borderColor: '#F1F5F9' },
  actionsColumn: { flex: 1, backgroundColor: "#fff", borderRadius: 24, padding: 30, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 25 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 30 },
  detailItem: { width: '45%', flexDirection: 'row', alignItems: 'center', gap: 15 },
  detailLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "700", textTransform: 'uppercase' },
  detailValue: { fontSize: 16, color: "#1E293B", fontWeight: "600", marginTop: 2 },
  
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, backgroundColor: '#F8FAFC', marginBottom: 15 },
  actionIcon: { padding: 12, borderRadius: 12, marginRight: 15 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#475569" },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 550, borderRadius: 24, padding: 35, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B", marginBottom: 25 },
  inputGroup: { flexDirection: 'row', gap: 15 },
  input: { backgroundColor: "#F1F5F9", padding: 15, borderRadius: 12, fontSize: 15, color: "#1E293B", marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  passWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#F1F5F9", borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', paddingRight: 15 },
  eye: { padding: 5 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 20 },
  cancelBtn: { padding: 15 },
  cancelText: { color: "#64748B", fontWeight: "700" },
  saveBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 25, paddingVertical: 15, borderRadius: 12 },
  saveText: { color: "#fff", fontWeight: "700" },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default ProfileScreen;