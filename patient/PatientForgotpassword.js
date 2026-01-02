import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PatientForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/patient/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", data.message, [
          { text: "OK", onPress: () => navigation.navigate("PatientLogin") },
        ]);
      } else {
        Alert.alert("Failed", data.message || "Password reset failed");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };
   if (loading)
          return (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text>Loading...</Text>
            </View>
          );
  

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 🔙 Back Button */}
          <TouchableOpacity
            style={styles.backIconContainer}
            onPress={() => navigation.navigate("PatientLogin")}
          >
            <Ionicons name="arrow-back" size={28} color="#007BFF" />
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>

            {/* ✉️ Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#007BFF" style={styles.icon} />
              <TextInput
                style={styles.inputField}
                placeholder="Enter Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            {/* 🔒 New Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Enter New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#007BFF"
                />
              </TouchableOpacity>
            </View>

            {/* 🔒 Confirm Password */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={22}
                  color="#007BFF"
                />
              </TouchableOpacity>
            </View>

            {/* 🔘 Reset Button */}
            <TouchableOpacity
              style={[styles.resetBtn, loading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf2ff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  backIconContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#1f2937",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  icon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  resetBtn: {
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#007BFF",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  resetText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
