import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
    Image, // 👈 ADD THIS LINE
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getSubadminId, clearStorage } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const SubAdminProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [subadminId, setSubadminId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  // Fetch Subadmin ID
  useEffect(() => {
    const fetchSubadminId = async () => {
      const id = await getSubadminId();
      if (id) setSubadminId(id);
      else Alert.alert("Error", "Subadmin ID not found.");
    };
    fetchSubadminId();
  }, []);

  // Fetch Profile
  useEffect(() => {
    if (!subadminId) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${BASE_URL}/subadmin/${subadminId}`);
        const data = await res.json();
        if (data.success) {
          const profile = data.data;
          setFormData({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            password: "",
            confirm_password: "",
              image: profile.image || "", // 👈 include image from backend

          });
        } else {
          Alert.alert("Error", "Failed to load profile");
        }
      } catch (error) {
        console.log(error);
        Alert.alert("Error", "Something went wrong while fetching profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [subadminId]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    if (formData.password && formData.password !== formData.confirm_password) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || "default123",
        confirm_password: formData.confirm_password || "default123",
      };

      const res = await fetch(`${BASE_URL}/subadmin/update/${subadminId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert("Success", "Profile updated successfully!");
        setModalVisible(false);
        setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
      } else {
        Alert.alert("Error", data.message || "Update failed.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong during update.");
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
         <View style={styles.avatarContainer}>
  {formData.image ? (
    <Image
      source={{ uri: formData.image }}
      style={styles.avatarImage}
    />
  ) : (
    <View style={styles.avatarPlaceholder}>
      <Ionicons name="person-outline" size={50} color="#fff" />
    </View>
  )}
</View>

          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.profileName}>{formData.name}</Text>
            <Text style={styles.profilePhone}>{formData.phone}</Text>
            <Text style={styles.profileEmail}>{formData.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtnSmall}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>My Account</Text>

          <TouchableOpacity style={styles.accountItem}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#2563eb"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.accountText}>My Appointments</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#777"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.accountItem}>
            <Ionicons
              name="bag-outline"
              size={22}
              color="#16a34a"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.accountText}>My Orders</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color="#777"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Modal for Edit */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={(val) => handleChange("name", val)}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(val) => handleChange("email", val)}
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone"
                keyboardType="numeric"
                value={formData.phone}
                onChangeText={(val) => handleChange("phone", val)}
              />

              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={formData.password}
                onChangeText={(val) => handleChange("password", val)}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry
                value={formData.confirm_password}
                onChangeText={(val) => handleChange("confirm_password", val)}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.saveButton, { flex: 1, marginRight: 5 }]}
                  onPress={handleUpdate}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.logoutButton, { flex: 1, marginLeft: 5, backgroundColor: "#9ca3af" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.logoutText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SubAdminProfileScreen;

const styles = StyleSheet.create({
  container: { backgroundColor: "#f9fafb", flexGrow: 1, paddingBottom: 40,marginTop:30 },
  headerBar: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  profileCard: {
    backgroundColor: "#3b82f6",
    margin: 15,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#60a5fa",
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  profilePhone: { color: "#fff", marginTop: 4, fontSize: 14 },
  profileEmail: { color: "#fff", fontSize: 14, marginTop: 2 },
  editBtnSmall: {
    backgroundColor: "#93c5fd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editText: { color: "#fff", fontWeight: "600" },
  accountSection: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontWeight: "600", fontSize: 16, marginBottom: 10, color: "#111" },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
  },
  accountText: { fontSize: 15, color: "#111" },
  label: { fontSize: 14, marginTop: 10, marginBottom: 5, color: "#333" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, textAlign: "center" },

  avatarContainer: {
  width: 80,
  height: 80,
  borderRadius: 40,
  overflow: "hidden",
  backgroundColor: "#60a5fa",
  alignItems: "center",
  justifyContent: "center",
},
avatarImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},
avatarPlaceholder: {
  width: "100%",
  height: "100%",
  alignItems: "center",
  justifyContent: "center",
},

});
