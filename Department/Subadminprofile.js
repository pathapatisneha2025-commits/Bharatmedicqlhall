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
  joining_date: "",
  status: "",
  password: "",
  confirm_password: "",
    image: "",

});
 const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

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
  joining_date: profile.joining_date
    ? profile.joining_date.split("T")[0]
    : "",
  status: profile.status || "",
  password: "",
  confirm_password: "",
  image: profile.image || "",
});
        } else {
          showAlert("Error", "Failed to load profile");
        }
      } catch (error) {
        console.log(error);
       showAlert("Error", "Something went wrong while fetching profile.");
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
   showAlert("Error", "Passwords do not match.");
    return;
  }

  try {
    setLoading(true);

   const payload = {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  joining_date: formData.joining_date || null,
  status: formData.status || null,
};
    // ✅ Only add password if user entered it
    if (formData.password && formData.confirm_password) {
      payload.password = formData.password;
      payload.confirm_password = formData.confirm_password;
    }

    const res = await fetch(`${BASE_URL}/subadmin/update/${subadminId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
    showAlert("Success", "Profile updated successfully!");
      setModalVisible(false);
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirm_password: "",
      }));
    } else {
     showAlert("Error", data.message || "Update failed.");
    }
  } catch (error) {
    console.log(error);
   showAlert("Error", "Something went wrong during update.");
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f3f4f6" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.dashboardHeader}>
          
               <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
    >
      <Ionicons name="arrow-back" size={24} color="#1e293b" />
    </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Account Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your profile and security</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtnTop} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Card */}
        <View style={styles.mainCard}>
          {/* Profile Identity Section */}
          <View style={styles.profileHeader}>

            <View style={styles.avatarContainer}>
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={50} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.profileTextInfo}>
              <Text style={styles.profileName}>{formData.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Sub-Admin</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtnLarge} onPress={() => setModalVisible(true)}>
              <Ionicons name="pencil" size={16} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{formData.email}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>{formData.phone}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Account Status</Text>
              <Text style={[styles.detailValue, {color: '#16a34a'}]}>Active</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>User ID</Text>
<Text
  style={[
    styles.detailValue,
    { color: formData.status === "approved" ? "#16a34a" : "#ef4444" },
  ]}
>
  {formData.status || "Not Set"}
</Text>            </View>
          </View>
        </View>

        {/* Edit Modal */}
      <Modal
  animationType="fade"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.modalKeyboardContainer}
    >
      <View style={styles.modalContent}>
        
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Update Information</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Body */}
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(val) => handleChange("name", val)}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(val) => handleChange("email", val)}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.phone}
            onChangeText={(val) => handleChange("phone", val)}
          />

          <Text style={styles.label}>Joining Date</Text>
          <TextInput
            style={styles.input}
            value={formData.joining_date}
            onChangeText={(val) => handleChange("joining_date", val)}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Status</Text>
          <TextInput
            style={styles.input}
            value={formData.status}
            onChangeText={(val) => handleChange("status", val)}
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={formData.password}
            onChangeText={(val) => handleChange("password", val)}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={formData.confirm_password}
            onChangeText={(val) => handleChange("confirm_password", val)}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={styles.saveBtnText}>
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </View>
</Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 30, flexGrow: 1, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  backButton: {
  padding: 6,
  borderRadius: 8,
  backgroundColor: "#e2e8f0",
},

  // Dashboard Header Style
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#1e293b" },
  headerSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  logoutBtnTop: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  logoutBtnText: { color: '#ef4444', fontWeight: '600', marginLeft: 8 },

  // Main Card Style
  mainCard: { backgroundColor: "#fff", borderRadius: 16, padding: 30, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', backgroundColor: '#3b82f6', elevation: 4 },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileTextInfo: { flex: 1, marginLeft: 25 },
  profileName: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  roleBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  roleText: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
  editBtnLarge: { backgroundColor: '#2563eb', flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '600' },
  
  separator: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10, marginBottom: 25 },

  // Details Grid
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -10 },
  detailBox: { width: '50%', padding: 10, marginBottom: 15 },
  detailLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: '#334155', fontWeight: '500', marginTop: 5 },

  // Modal Styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: 500, borderRadius: 16, overflow: 'hidden' },
  modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  modalKeyboardContainer: {
  width: "100%",
  alignItems: "center",
},

modalContent: {
  backgroundColor: "#fff",
  width: "90%",
  maxWidth: 500,
  maxHeight: "85%", // 🔥 important for scrolling
  borderRadius: 16,
  overflow: "hidden",
},

modalScroll: {
  flexGrow: 1,
},
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, color: '#1e293b' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30, marginBottom: 10, gap: 12 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600' }
});

export default SubAdminProfileScreen;