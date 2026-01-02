import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function EmpResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 👁️ For toggling password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigation = useNavigation();

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/employee/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            newPassword,
            confirmNewPassword: confirmPassword,
          }),
        }
      );

      const data = await res.json();
      console.log("Response status:", res.status);
      console.log("Response data:", data);

      if (res.ok) {
        Alert.alert("Success", data.message || "Password reset successfully!");
        navigation.navigate("EmpLogin");
      } else {
        Alert.alert("Error", data.message || data.error || "Failed to reset password.");
      }
    } catch (error) {
      console.log("Fetch error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
          </View>
          <Text style={styles.subtitle}>
            Enter your registered email and set a new password below.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#555" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* New Password Input with eye icon */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#555" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#888"
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <MaterialIcons
                name={showNewPassword ? "visibility" : "visibility-off"}
                size={22}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input with eye icon */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#555" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#888"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={22}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate("EmpLogin")}
          >
            <Text style={styles.backToLoginText}>
              <MaterialIcons name="login" size={16} color="#007bff" /> Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  card: {
    backgroundColor: "#fff",
    width: "92%",
    borderRadius: 16,
    padding: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E88E5",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  submitBtn: {
    backgroundColor: "#1E88E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    elevation: 2,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backToLogin: {
    marginTop: 20,
    alignItems: "center",
  },
  backToLoginText: {
    color: "#1E88E5",
    fontSize: 14,
    fontWeight: "500",
  },
});
