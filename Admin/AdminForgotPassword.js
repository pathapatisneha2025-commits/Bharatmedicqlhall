import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const AdminForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { width } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = width > MAX_WIDTH ? MAX_WIDTH : width - 20;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const validate = () => {
    let temp = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) temp.email = "Email is required";
    else if (!emailRegex.test(email)) temp.email = "Invalid email address";

    if (!newPassword || newPassword.length < 6)
      temp.newPassword = "Password must be at least 6 characters";

    if (newPassword !== confirmPassword)
      temp.confirmPassword = "Passwords do not match";

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        showAlert("Success", "Password updated successfully");
        navigation.goBack();
      } else {
        showAlert("Error", data.error || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      showAlert("Network Error", "Please try again later");
      console.error(err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ width: containerWidth, alignSelf: "center" }}>
        <Text style={styles.title}>Forgot Password</Text>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={20} color="#4a90e2" />
          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        {/* New Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#4a90e2" />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>
        {errors.newPassword && (
          <Text style={styles.error}>{errors.newPassword}</Text>
        )}

        {/* Confirm Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#4a90e2" />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#4a90e2"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.error}>{errors.confirmPassword}</Text>
        )}

        {/* Reset Button */}
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        {/* Back to login */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AdminForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#ffff",
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 35,
    color: "#1e1e1e",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 55,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 14,
    marginLeft: 10,
  },
  error: {
    color: "#e53935",
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 5,
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#4a90e2",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backText: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 15,
    color: "#4a90e2",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});

