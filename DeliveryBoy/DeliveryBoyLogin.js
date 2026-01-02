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
import { storeEmployeeId } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DeliveryBoyLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const validateFields = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 4) {
      setPasswordError("Password must be at least 4 characters.");
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
  if (!validateFields()) return;

  setLoading(true);
  try {
    const res = await fetch(`${BASE_URL}/employee/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      const employee = data.employee;

      await storeEmployeeId(employee.id); // store employee ID

      Alert.alert("Login successful!", `Welcome ${employee.full_name}`);

      // Redirect based on role
      const role = employee.role?.toLowerCase();
      if (role === "hd delivery") {
        navigation.navigate("DeliverBoyTabs");
      } else if (role === "picker") {
        navigation.navigate("PickerTabs");
      
      } else {
        Alert.alert("Access Denied", "You do not have access to any dashboard.");
      }

    } else {
      setPasswordError(data.error || "Invalid credentials. Try again.");
    }
  } catch (error) {
    console.error("Login error:", error);
    Alert.alert("Error", "Something went wrong. Please try again later.");
  } finally {
    setLoading(false);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="bicycle" size={70} color="#2196F3" style={{ marginBottom: 10 }} />
      <Text style={styles.title}>Delivery Boy Login</Text>

      <View style={{ width: "100%" }}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#888" style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Enter Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError("");
            }}
            keyboardType="email-address"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Enter Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* Forgot Password Link */}
        <TouchableOpacity
          style={{ alignSelf: "flex-end", marginVertical: 5 }}
          onPress={() => navigation.navigate("EmpResetPasswordScreen")}
        >
          <Text style={{ color: "#2196F3", fontWeight: "500" }}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.button, (!email || !password || emailError || passwordError) && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  input: {
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 5,
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
