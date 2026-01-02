// DoctorLoginScreen.js
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { storeDoctorId } from "../utils/storage"; // ✅ Ensure this utility works properly

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const DoctorLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔐 Handle Doctor Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    const payload = { email: email.trim(), password };

    try {
      const response = await fetch(`${BASE_URL}/doctor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

     if (response.ok && data.doctor) {
  const doctor = data.doctor;

  // ✅ ALLOW ONLY APPROVED DOCTOR TO LOGIN
  if (doctor.status !== "approved") {
    Alert.alert(
      "Access Denied",
      `Your account is not approved".\nPlease contact admin.`
    );
    return;
  }

  // ✅ IF approved → Login success
  await storeDoctorId(doctor.id);
  navigation.navigate("DoctorsHome", { doctor });

  setEmail("");
  setPassword("");
} else {
  Alert.alert("Login Failed", data.message || "Invalid credentials.");
}

    } catch (error) {
      setLoading(false);
      console.error("Login Error:", error);
      Alert.alert("Network Error", "Please check your connection and try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Doctor Login</Text>

      {/* 📧 Email Input with Icon */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* 🔑 Password Input */}
      <View style={styles.passwordContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={{ marginRight: 10 }} />

        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* 🔑 Forgot Password Link */}
      <TouchableOpacity
        onPress={() => navigation.navigate("DoctorForgotPasswordScreen")}
        style={{ marginBottom: 20 }}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* 🔘 Login Button */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* 🔁 Go to Register */}
      <TouchableOpacity onPress={() => navigation.navigate("DoctorRegister")}>
        <Text style={styles.registerLink}>
          Don’t have an account? Sign up here
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DoctorLoginScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  eyeIcon: {
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: "#4a90e2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  registerLink: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    color: "#4a90e2",
    textDecorationLine: "underline",
  },
  forgotPasswordText: {
    color: "#4a90e2",
    textAlign: "right",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
