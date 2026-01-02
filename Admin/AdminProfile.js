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

  useEffect(() => {
    const fetchAdminId = async () => {
      try {
        const id = await getAdminId();
        if (id) {
          setAdminId(id);
          fetchAdminProfile(id);
        } else {
          Alert.alert("Error", "Admin ID not found.");
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
        Alert.alert("Error", "Admin profile not found.");
      }
    } catch (error) {
      console.log("Error fetching admin:", error);
      Alert.alert("Error", "Failed to fetch profile.");
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
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      ...(formData.password && {
        password: formData.password,
        confirm_password: formData.confirm_password,
      }),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/adminlogin/update/${adminId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        setEditable(false);
        setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.log("Error updating admin:", error);
      Alert.alert("Error", "Something went wrong while updating profile.");
    }
  };

  const handleLogout = async () => {
    await clearStorage();
    navigation.reset({ index: 0, routes: [{ name: "SelectRole" }] });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="person-circle-outline" size={28} color="#fff" />
            <Text style={styles.headerTitle}>Admin Profile</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={50} color="#fff" />
          </View>
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.profileName}>{formData.name}</Text>
            <Text style={styles.profilePhone}>{formData.phone}</Text>
            <Text style={styles.profileEmail}>{formData.email}</Text>
          </View>

          {!editable && (
            <TouchableOpacity style={styles.editBtnSmall} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Editable Fields */}
        {editable && (
          <Animated.View
            style={[
              styles.editContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {[
              { key: "name", label: "Full Name", icon: "person" },
              { key: "email", label: "Email", icon: "email" },
              { key: "phone", label: "Phone", icon: "call" },
            ].map((field) => (
              <View key={field.key} style={styles.inputWrapper}>
                <MaterialIcons
                  name={field.icon}
                  size={22}
                  color="#2563eb"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={field.label}
                  value={formData[field.key]}
                  editable={editable}
                  keyboardType={field.key === "phone" ? "numeric" : "default"}
                  onChangeText={(val) => handleChange(field.key, val)}
                />
              </View>
            ))}

            {/* Password */}
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock"
                size={22}
                color="#2563eb"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={formData.password}
                editable={editable}
                secureTextEntry={!showPassword}
                onChangeText={(val) => handleChange("password", val)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#2563eb"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="lock"
                size={22}
                color="#2563eb"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={formData.confirm_password}
                editable={editable}
                secureTextEntry={!showConfirmPassword}
                onChangeText={(val) => handleChange("confirm_password", val)}
              />
              <TouchableOpacity
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#2563eb"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              <Text style={styles.buttonText}>Update Changes</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AdminProfileScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 170, // ⬅️ MUCH MORE SCROLL SPACE
    paddingTop: 20,
    backgroundColor: "#f5f7fb",
  },

  headerBar: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },

  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 6 },

  profileCard: {
    backgroundColor: "#3b82f6",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },

  avatar: {
    backgroundColor: "#60a5fa",
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  profileName: { color: "#fff", fontSize: 19, fontWeight: "700" },
  profilePhone: { color: "#e0e7ff", marginTop: 3, fontSize: 14 },
  profileEmail: { color: "#e0e7ff", fontSize: 14, marginTop: 1 },

  editBtnSmall: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  editContainer: { marginTop: 25, paddingHorizontal: 25 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14 },

  saveButton: {
    backgroundColor: "#16a34a",
    marginTop: 20,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },

  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ef4444",
    marginTop: 30,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },

  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
});
