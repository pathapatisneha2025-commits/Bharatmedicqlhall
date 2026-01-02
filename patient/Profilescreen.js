// ProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/patient";

const ProfileScreen = ({ navigation }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
  });
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔑 Get patientId from AsyncStorage
  const getPatientId = async () => {
    return await AsyncStorage.getItem("patientId");
  };

  // 📡 Fetch patient profile by ID
  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      const patientId = await getPatientId();

      if (!patientId) {
        Alert.alert("Error", "No patient ID found.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/${patientId}`);
      const data = await response.json();

      if (response.ok && data.patient) {
        setPatient(data.patient);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch profile.");
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  // 🔐 Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("patientId");
      navigation.replace("SelectRole");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  // ✏️ Open edit modal
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


// ✅ Update profile via API
const handleUpdateProfile = async () => {
  if (!editData.first_name || !editData.last_name || !editData.email) {
    Alert.alert("Error", "Please fill all required fields.");
    return;
  }
  if (editData.password && editData.password !== editData.confirm_password) {
    Alert.alert("Error", "Passwords do not match.");
    return;
  }

  try {
    const patientId = await getPatientId();
    if (!patientId) {
      Alert.alert("Error", "No patient ID found.");
      return;
    }

    const response = await fetch(`${BASE_URL}/update/${patientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });

    const data = await response.json();

    if (response.ok) {
      setPatient(data.patient); // Update local state with API response
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } else {
      Alert.alert("Error", data.message || "Failed to update profile.");
    }
  } catch (error) {
    console.error("Update Profile Error:", error);
    Alert.alert("Error", "Something went wrong. Please try again.");
  }
};


  // 🌀 Loader while fetching
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: "red" }}>No patient data found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 150 : 120 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* 🔝 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 👤 Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={50} color="#fff" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>
            {patient.first_name} {patient.last_name}
          </Text>
          <Text style={styles.phone}>{patient.phone_number}</Text>
          <Text style={styles.email}>{patient.email}</Text>
          <Text style={styles.gender}>{patient.gender}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* 📁 My Account */}
      <Text style={styles.sectionTitle}>My Account</Text>
      <View style={styles.accountList}>
        <AccountItem
          icon={<Ionicons name="calendar-outline" size={22} color="#0A66C2" />}
          title="My Appointments"
          onPress={() =>
            navigation.navigate("PatientAppointmentsScreen", {
              patientId: patient.id,
            })
          }
        />
        <AccountItem
          icon={<Ionicons name="bag-handle-outline" size={22} color="green" />}
          title="My Orders"
          onPress={() => navigation.navigate("patientorders")}
        />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ✏️ Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <View style={styles.modalContainer}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Profile</Text>

                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={editData.first_name}
                  onChangeText={(text) =>
                    setEditData({ ...editData, first_name: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={editData.last_name}
                  onChangeText={(text) =>
                    setEditData({ ...editData, last_name: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Gender"
                  value={editData.gender}
                  onChangeText={(text) =>
                    setEditData({ ...editData, gender: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={editData.phone_number}
                  onChangeText={(text) =>
                    setEditData({ ...editData, phone_number: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  value={editData.email}
                  onChangeText={(text) =>
                    setEditData({ ...editData, email: text })
                  }
                />
 {/* Password Field */}
<View style={styles.passwordContainer}>
  <TextInput
    style={[styles.input, { flex: 1 }]}
    placeholder="Password"
    secureTextEntry={!showPassword}
    value={editData.password}
    onChangeText={(text) =>
      setEditData({ ...editData, password: text })
    }
  />
  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    style={styles.eyeIcon}
  >
    <Ionicons
      name={showPassword ? "eye-off" : "eye"}
      size={22}
      color="#555"
    />
  </TouchableOpacity>
</View>

{/* Confirm Password Field */}
<View style={styles.passwordContainer}>
  <TextInput
    style={[styles.input, { flex: 1 }]}
    placeholder="Confirm Password"
    secureTextEntry={!showConfirmPassword}
    value={editData.confirm_password}
    onChangeText={(text) =>
      setEditData({ ...editData, confirm_password: text })
    }
  />
  <TouchableOpacity
    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
    style={styles.eyeIcon}
  >
    <Ionicons
      name={showConfirmPassword ? "eye-off" : "eye"}
      size={22}
      color="#555"
    />
  </TouchableOpacity>
</View>



                <TouchableOpacity
                  style={styles.updateBtn}
                  onPress={handleUpdateProfile}
                >
                  <Text style={styles.updateText}>Update Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

// 📦 Account Item Component
const AccountItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.accountItem} onPress={onPress}>
    <View style={styles.icon}>{icon}</View>
    <Text style={styles.accountText}>{title}</Text>
    <Ionicons name="chevron-forward" size={20} color="#aaa" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9",marginTop:20, },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop:10,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop:10,
  },
  profileCard: {
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 50,
    padding: 10,
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  phone: { fontSize: 14, color: "#E0E0E0", marginTop: 2 },
  email: { fontSize: 14, color: "#E0E0E0", marginTop: 2 },
  gender: { fontSize: 14, color: "#E0E0E0", marginTop: 2 },
  editBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  editText: { color: "#fff", fontWeight: "600" },
  sectionTitle: {
    marginLeft: 16,
    marginTop: 16,
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  accountList: { margin: 10 },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 2,
  },
  icon: { marginRight: 12 },
  accountText: { flex: 1, fontSize: 15, color: "#333" },
  logoutBtn: {
    backgroundColor: "#FF4D4D",
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  updateBtn: {
    backgroundColor: "#4A90E2",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  updateText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: {
    backgroundColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  cancelText: { color: "#333", fontWeight: "bold", fontSize: 16 },
  passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  paddingHorizontal: 10,
  marginVertical: 6,
  backgroundColor: "#fff",
},
eyeIcon: {
  padding: 6,
},

  
});

export default ProfileScreen;
