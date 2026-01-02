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
import { storeAdminId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateFields = () => {
    let tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      tempErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email)) {
      tempErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      tempErrors.password = "Password is required.";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;

    setLoading(true);
    const payload = { email: email.trim(), password };

    try {
      const response = await fetch(`${BASE_URL}/adminlogin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.admin) {
        await storeAdminId(data.admin.id);
        navigation.navigate("AdminDashboard", { admin: data.admin });
        setEmail("");
        setPassword("");
        setErrors({});
      } else {
        Alert.alert("Login Failed", data.message || "Invalid email or password.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Network Error", "Unable to connect. Please try again later.");
      console.error(error);
    }
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading admin...</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Login</Text>

      {/* Email Input with Icon */}
      <View style={styles.inputWrapper}>
        <Ionicons name="mail" size={20} color="#4a90e2" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      {/* Password Input with Icon and Eye Toggle */}
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed" size={20} color="#4a90e2" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#4a90e2"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity onPress={() => navigation.navigate("AdminRegisterScreen")}>
        <Text style={styles.registerLink}>
          Don’t have an account? Sign up here
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AdminLoginScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
    marginTop: 30
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    marginLeft: 5,
    fontSize: 14,
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
});
