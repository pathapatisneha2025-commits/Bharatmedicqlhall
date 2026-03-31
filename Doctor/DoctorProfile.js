import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getDoctorId, clearStorage } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DoctorUpdateScreen() {
  const navigation = useNavigation();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  // Basic fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [scheduleIn, setScheduleIn] = useState("");
  const [scheduleOut, setScheduleOut] = useState("");

  // New fields
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [showPickerIn, setShowPickerIn] = useState(false);
  const [showPickerOut, setShowPickerOut] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;

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

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const doctorId = await getDoctorId();
        if (!doctorId) throw new Error("Doctor ID not found");

        const response = await fetch(`${BASE_URL}/doctor/${doctorId}`);
        const data = await response.json();

        if (response.ok) {
          setDoctor(data);
          // Basic fields
          setName(data.name);
          setEmail(data.email);
          setPhoneNumber(data.phone_number);
          setDepartment(data.department);
          setScheduleIn(data.schedule_in);
          setScheduleOut(data.schedule_out);

          // New fields
          setRole(data.role || "");
          setGender(data.gender || "");
          setExperience(data.experience || "");
          setDescription(data.description || "");
          setStatus(data.status || "");
        } else {
          showAlert("Error", data.message || "Failed to fetch doctor info");
        }
      } catch (err) {
        showAlert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, []);

  const handleUpdate = async () => {
    if (!name || !email || !phoneNumber || !department) {
      showAlert("Validation Error", "All fields are required!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/doctor/update/${doctor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          department,
          scheduleIn,
          scheduleOut,
          role,
          gender,
          experience,
          description,
          status
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert("Success", data.message);
        setModalVisible(false);
        navigation.goBack();
      } else {
        showAlert("Error", data.message || "Update failed");
      }
    } catch (error) {
      showAlert("Network Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearStorage();
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }],
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading{loadingCount}s</Text>
      </View>
    );
  }

  if (!doctor) return <Text style={{ textAlign: "center", marginTop: 20 }}>Doctor not found</Text>;

  return (
    <View style={styles.mainScreenWrapper}>
      <View style={styles.contentArea}>
        {/* Header */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeftBtn}>
            <Ionicons name="arrow-back" size={28} color="#007BFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.pageTitle}>Account Settings</Text>
            <Text style={styles.pageSub}>Update your personal and professional availability</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.headerRightBtn}>
            <Ionicons name="log-out-outline" size={26} color="#E53E3E" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.profileCard, isDesktop && { maxWidth: 800 }]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarText}>{name.charAt(0)}</Text>
              </View>
              <View style={{ marginLeft: 20 }}>
                <Text style={styles.doctorNameMain}>{name}</Text>
                <Text style={styles.doctorDeptMain}>{department}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValueText}>{email}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValueText}>{phoneNumber || "Not Set"}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Duty Start Time</Text>
                <View style={styles.timeBadge}><Text style={styles.timeBadgeText}>{scheduleIn}</Text></View>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Duty End Time</Text>
                <View style={[styles.timeBadge, { backgroundColor: '#FFF5F5' }]}><Text style={[styles.timeBadgeText, { color: '#E53E3E' }]}>{scheduleOut}</Text></View>
              </View>
            </View>

            <View style={styles.buttonActionRow}>
              <TouchableOpacity style={styles.primaryEditBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.primaryEditBtnText}>Edit Details</Text>
              </TouchableOpacity>
              {!isDesktop && (
                <TouchableOpacity style={styles.mobileLogoutBtn} onPress={handleLogout}>
                  <Text style={styles.mobileLogoutText}>Logout Account</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDesktop && { width: 500 }]}>
            <Text style={styles.modalHeaderTitle}>Update Information</Text>
            <ScrollView>
              {/* Basic fields */}
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.modalInput} value={name} onChangeText={setName} placeholder="Enter name" />

              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput style={styles.modalInput} value={email} onChangeText={setEmail} keyboardType="email-address" />

              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput style={styles.modalInput} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

              <Text style={styles.fieldLabel}>Department</Text>
              <TextInput style={styles.modalInput} value={department} onChangeText={setDepartment} />

              {/* New fields */}
              <Text style={styles.fieldLabel}>Role</Text>
              <TextInput style={styles.modalInput} value={role} onChangeText={setRole} placeholder="Enter role" />

              <Text style={styles.fieldLabel}>Gender</Text>
              <TextInput style={styles.modalInput} value={gender} onChangeText={setGender} placeholder="Enter gender" />

              <Text style={styles.fieldLabel}>Experience (Years)</Text>
              <TextInput style={styles.modalInput} value={experience} onChangeText={setExperience} keyboardType="numeric" placeholder="Enter experience" />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.modalInput, { height: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="Enter description" />

              {/* <Text style={styles.fieldLabel}>Status</Text>
              <TextInput style={styles.modalInput} value={status} onChangeText={setStatus} placeholder="Enter status" /> */}

              {/* Time pickers */}
              <View style={styles.modalTimeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>In Time</Text>
                  {Platform.OS === 'web' ? (
                    <input type="time" value={scheduleIn} onChange={(e) => setScheduleIn(e.target.value)} style={styles.webInputTime} />
                  ) : (
                    <TouchableOpacity style={styles.mobileTimeBtn} onPress={() => setShowPickerIn(true)}>
                      <Text>{scheduleIn || "Set"}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.fieldLabel}>Out Time</Text>
                  {Platform.OS === 'web' ? (
                    <input type="time" value={scheduleOut} onChange={(e) => setScheduleOut(e.target.value)} style={styles.webInputTime} />
                  ) : (
                    <TouchableOpacity style={styles.mobileTimeBtn} onPress={() => setShowPickerOut(true)}>
                      <Text>{scheduleOut || "Set"}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Buttons */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Dismiss</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Keep your styles as they were (no changes needed)
const styles = StyleSheet.create({
  mainScreenWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F7FAFC" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  contentArea: { flex: 1, padding: Platform.OS === 'web' ? 40 : 20 },
  headerNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  headerLeftBtn: { padding: 5 },
  headerRightBtn: { padding: 5 },
  headerTitleContainer: { flex: 1, marginHorizontal: 15 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#1A202C" },
  pageSub: { color: "#718096", fontSize: 14, marginTop: 4 },
  profileCard: { backgroundColor: "#fff", borderRadius: 20, padding: 30, borderWidth: 1, borderColor: "#EDF2F7", alignSelf: 'center', width: '100%' },
  profileHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EBF8FF", justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#fff" },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#007BFF" },
  doctorNameMain: { fontSize: 22, fontWeight: "bold", color: "#2D3748" },
  doctorDeptMain: { fontSize: 16, color: "#718096" },
  divider: { height: 1, backgroundColor: "#F7FAFC", marginVertical: 20 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  infoBox: { width: "45%", marginBottom: 10 },
  infoLabel: { fontSize: 12, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  infoValueText: { fontSize: 16, color: "#2D3748", fontWeight: "500" },
  timeBadge: { backgroundColor: "#E6FFFA", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  timeBadgeText: { color: "#319795", fontWeight: "bold" },
  buttonActionRow: { marginTop: 40, flexDirection: 'row', gap: 15 },
  primaryEditBtn: { backgroundColor: "#007BFF", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center" },
  primaryEditBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 10 },
  mobileLogoutBtn: { borderSize: 1, borderColor: "#FED7D7", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#FFF5F5' },
  mobileLogoutText: { color: "#E53E3E", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, padding: 25, width: "90%", maxHeight: '80%' },
  modalHeaderTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20, color: "#1A202C" },
  fieldLabel: { fontSize: 14, color: "#4A5568", marginBottom: 8, fontWeight: "600", marginTop: 15 },
  modalInput: { backgroundColor: "#F7FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, padding: 12, fontSize: 16 },
  modalTimeRow: { flexDirection: "row", marginTop: 5 },
  webInputTime: { padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#F7FAFC' },
  mobileTimeBtn: { backgroundColor: "#F7FAFC", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  saveBtn: { backgroundColor: "#007BFF", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 25 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalCloseBtn: { marginTop: 15, alignItems: "center" },
  modalCloseText: { color: "#A0AEC0", fontWeight: "500" },
});