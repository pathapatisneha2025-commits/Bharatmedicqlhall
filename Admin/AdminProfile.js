// AdminProfileScreen.js

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getAdminId, clearStorage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

const API_BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const AdminProfileScreen = () => {
  const navigation = useNavigation();
  const [editable, setEditable] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [adminId, setAdminId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const { width: windowWidth } = useWindowDimensions();
 // Desktop Responsive Logic
  const isDesktop = windowWidth > 768;
  const contentWidth = isDesktop ? 600 : "100%";

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };
  useEffect(() => {
    const fetchAdminId = async () => {
      try {
        const id = await getAdminId();
        if (id) {
          setAdminId(id);
          fetchAdminProfile(id);
        } else {
          showAlert("Error", "Admin ID not found.");
        }
      } catch (error) {
        console.log("Error fetching Admin ID:", error);
      }
    };
    fetchAdminId();
  }, []);

  const fetchAdminProfile = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/adminlogin/${id}`);
      const data = await res.json();
      if (data.success && data.admin) {
        setFormData({
          name: data.admin.name,
          email: data.admin.email,
          phone: data.admin.phone,
          joining_date: data.admin.joining_date,
          password: "",
          confirm_password: "",
        });
      } else {
        showAlert("Error", "Admin profile not found.");
      }
    } catch (error) {
      console.log("Error fetching admin:", error);
      showAlert("Error", "Failed to fetch profile.");
    }
  };

  const handleChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleEdit = () => {
    setEditable(true);
    slideAnim.setValue(300);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

 const handleUpdate = async () => {
  if (formData.password && formData.password !== formData.confirm_password) {
    showAlert("Error", "Passwords do not match.");
    return;
  }

  // Prepare payload
  const payload = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    joining_date: formData.joining_date, // include joining_date if needed
    ...(formData.password && {
      password: formData.password,
      confirm_password: formData.confirm_password,
    }),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/adminlogin/update/${adminId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json", // ⬅️ must set this
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      showAlert("Success", "Profile updated successfully!");
      setEditable(false);
      // Clear password fields after update
      setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
    } else {
      showAlert("Error", data.error || "Failed to update profile."); // backend sends 'error'
    }
  } catch (error) {
    console.log("Error updating admin:", error);
    showAlert("Error", "Something went wrong while updating profile.");
  }
};


  const handleLogout = async () => {
    await clearStorage();
    navigation.reset({ index: 0, routes: [{ name: "SelectRole" }] });
  };
return (
    <View style={styles.webContainer}>
   

      {/* RIGHT MAIN CONTENT */}
      <View style={styles.mainContent}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.contentHeader}>
              <Text style={styles.mainTitle}>Admin Account</Text>
              <Text style={styles.subTitle}>View and manage your personal administrative information</Text>
            </View>

            {/* Profile Info Card */}
            <View style={styles.profileInfoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarText}>{formData.name ? formData.name.charAt(0).toUpperCase() : "A"}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text style={styles.displayName}>{formData.name}</Text>
                  <Text style={styles.displayRole}>System Administrator</Text>
                </View>
                {!editable && (
                  <TouchableOpacity style={styles.editHeaderBtn} onPress={handleEdit}>
                    <MaterialIcons name="edit" size={18} color="#2563EB" />
                    <Text style={styles.editHeaderText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>{formData.email}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{formData.phone}</Text>
                </View>

                {/* Logout Section */}
<TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
  <Ionicons name="log-out-outline" size={20} color="#fff" />
  <Text style={styles.logoutBtnText}>Logout</Text>
</TouchableOpacity>



              </View>
            </View>

            {/* Editable Form Modal Section */}
            {editable && (
              <Animated.View style={[styles.formCard, { transform: [{ translateY: slideAnim }] }]}>
                <Text style={styles.formTitle}>Update Information</Text>
                
                <View style={styles.inputGrid}>
                  <View style={styles.inputField}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={formData.name} onChangeText={(v) => handleChange("name", v)} />
                  </View>
                  <View style={styles.inputField}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} value={formData.email} onChangeText={(v) => handleChange("email", v)} />
                  </View>
                  <View style={styles.inputField}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput style={styles.input} value={formData.phone} keyboardType="numeric" onChangeText={(v) => handleChange("phone", v)} />
                  </View>
                </View>

                <View style={styles.divider} />
                <Text style={styles.formTitle}>Change Password</Text>
                
                <View style={styles.inputGrid}>
                  <View style={styles.inputField}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput style={styles.input} secureTextEntry={!showPassword} value={formData.password} onChangeText={(v) => handleChange("password", v)} />
                  </View>
                  <View style={styles.inputField}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput style={styles.input} secureTextEntry={!showConfirmPassword} value={formData.confirm_password} onChangeText={(v) => handleChange("confirm_password", v)} />
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditable(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default AdminProfileScreen;

const styles = StyleSheet.create({
  webContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  
  // Sidebar Styles
  sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 24 },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: '#2563EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandLetter: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  brandSub: { fontSize: 12, color: '#64748b', marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: '#2563EB' },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: '#64748b', fontWeight: '600' },
  sidebarLabelActive: { color: '#fff' },
  logoutBtnSide: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutTextSide: { marginLeft: 12, color: '#ef4444', fontWeight: '700' },

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  scrollContainer: { paddingBottom: 50 },
  contentHeader: { marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subTitle: { color: '#64748b', marginTop: 4, fontSize: 15 },

  // Info Card
  profileInfoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 24 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DBEAFE' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#2563EB' },
  displayName: { fontSize: 22, fontWeight: '700', color: '#1e293b' },
  displayRole: { color: '#64748b', fontSize: 14, marginTop: 2 },
  editHeaderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  editHeaderText: { color: '#2563EB', fontWeight: '700', marginLeft: 8 },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: 10 },
  detailLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  detailValue: { fontSize: 16, color: '#334155', marginTop: 4, fontWeight: '600' },

  // Form Card
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  inputField: { width: '31%', minWidth: 200, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 15 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 24 },
  
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  logoutSection: {
  marginTop: 40,
  paddingTop: 24,
  borderTopWidth: 1,
  borderTopColor: "#e5e7eb",
},
logoutBtn: {
  marginTop: 30,
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#ef4444",
  paddingHorizontal: 22,
  paddingVertical: 12,
  borderRadius: 8,
},

logoutBtnText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 15,
  marginLeft: 8,
},


});