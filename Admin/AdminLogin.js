import React, { useState, useEffect } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { storeAdminId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Desktop check
  const isDesktop = SCREEN_WIDTH > 800;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  const validateFields = () => {
    let tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) tempErrors.email = "Email address is required.";
    else if (!emailRegex.test(email)) tempErrors.email = "Enter a valid email.";
    if (!password) tempErrors.password = "Password is required.";
    else if (password.length < 6) tempErrors.password = "Must be at least 6 characters.";
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
        setEmail(""); setPassword(""); setErrors({});
      } else {
        showAlert("Login Failed", data.message || "Invalid credentials.");
      }
    } catch (error) {
      setLoading(false);
      showAlert("Network Error", "Unable to connect.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10, color: "#fff" }}>Loading admin {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainWrapper}>
      <View style={[styles.contentWrapper, { flexDirection: isDesktop ? "row" : "column" }]}>
        
        {/* LEFT SECTION: BRANDING (Visible on Desktop) */}
        {isDesktop && (
          <View style={styles.brandingSection}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>BM</Text>
            </View>
            <Text style={styles.heroTitle}>Manage Your{"\n"}Hospital Better.</Text>
            <Text style={styles.heroSubtitle}>
              Streamline operations, manage staff, and track patient data efficiently with our all-in-one admin portal.
            </Text>
          </View>
        )}

        {/* RIGHT SECTION: LOGIN FORM */}
        <View style={styles.loginSection}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Enter your details to manage your dashboard</Text>
              </View>

              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputErrorBorder]}>
                <Ionicons name="mail-outline" size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputErrorBorder]}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="........"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <TouchableOpacity 
                style={styles.forgotBtn} 
                onPress={() => navigation.navigate("AdminForgotPasswordScreen")}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login →</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("AdminRegisterScreen")}>
                  <Text style={styles.linkText}>Sign up here</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

      </View>
    </View>
  );
};

export default AdminLoginScreen;

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentWrapper: {
    flex: 1,
  },
  brandingSection: {
    flex: 1,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    padding: 60,
  },
  loginSection: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  formContainer: {
    padding: 40,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  logoBox: {
    backgroundColor: "#fff",
    width: 80,
    height: 80,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#007AFF",
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 56,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#D1E9FF",
    lineHeight: 28,
  },
  formHeader: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
    marginTop: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
      outlineStyle: "none",   // ✅ removes web rectangle

  },
  inputErrorBorder: {
    borderColor: "#FF4D4D",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    marginLeft: 10,
    outlineStyle: "none",   // ✅ removes web rectangle
  },
  errorText: {
    color: "#FF4D4D",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  forgotText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#00CCFF",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#00CCFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#666",
    fontSize: 15,
  },
  linkText: {
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});