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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PatientLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Store patient ID in AsyncStorage
  const storePatientId = async (patientId) => {
    try {
      await AsyncStorage.setItem("patientId", patientId.toString());
    } catch (error) {
      console.error("AsyncStorage Error:", error);
    }
  };

  // Validation
  const validateFields = () => {
    const newErrors = {};

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";

    if (!password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;

    try {
      setLoading(true);

      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/patient/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.patient) {
        Alert.alert("Success", data.message || "Login successful");
        await storePatientId(data.patient.id);
        navigation.replace("bottomtab");
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
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
      <Text style={styles.title}>Patient Login</Text>

      {/* Email Input with Icon */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.textInput}
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#6FA0D7"
        />
      </View>
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      {/* Password Input with Icons */}
      <View style={styles.passwordContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#6FA0D7"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#1A4C8C"
          />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      {/* Forgot Password */}
      <TouchableOpacity
        onPress={() => navigation.navigate("PatientForgotPasswordScreen")}
        style={styles.forgotPasswordContainer}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F4F9FF",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#1A4C8C",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A4C8C",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A4C8C",
  },
  eyeIcon: {
    paddingLeft: 6,
  },
  error: {
    color: "red",
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
  },
  forgotPasswordContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "500",
  },
  loginBtn: {
    backgroundColor: "#1A4C8C",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
