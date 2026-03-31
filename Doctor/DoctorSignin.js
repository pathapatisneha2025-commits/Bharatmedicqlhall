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
import { LinearGradient } from "expo-linear-gradient"; // Added for the exact button look
import { storeDoctorId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const DoctorLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Missing Fields", "Please enter both email and password.");
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
        if (doctor.status !== "approved") {
          showAlert("Access Denied", `Your account is not approved.\nPlease contact admin.`);
          return;
        }
        await storeDoctorId(doctor.id);
        navigation.navigate("DoctorDashboard", { doctor });
        setEmail("");
        setPassword("");
      } else {
        showAlert("Login Failed", data.message || "Invalid credentials.");
      }
    } catch (error) {
      setLoading(false);
      showAlert("Network Error", "Please check your connection and try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mainContainer, { flexDirection: isDesktop ? "row" : "column" }]}>
        
        {/* LEFT SIDE - FORM */}
        <View style={[styles.formSection, { width: isDesktop ? "55%" : "100%" }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={16} color="#718096" />
              <Text style={styles.backText}>Back to role selection</Text>
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.logoBox}><Text style={styles.logoText}>BM</Text></View>
              <Text style={styles.brandName}>Bharat Medical Hall</Text>
            </View>

            <Text style={styles.title}>Doctor Login</Text>
            <Text style={styles.subtitle}>Enter your credentials to access your dashboard</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#718096" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("DoctorForgotPasswordScreen")}>
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={["#0095FF", "#00D1D1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don’t have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("DoctorRegister")}>
                <Text style={styles.footerLink}> Sign up here</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* RIGHT SIDE - BRANDING */}
        {isDesktop && (
          <View style={styles.bluePanel}>
            <View style={styles.bigLogo}><Text style={styles.bigLogoText}>BM</Text></View>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Access your healthcare management dashboard and stay connected with your medical records.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default DoctorLoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainContainer: { flex: 1 },
  formSection: { padding: 40, justifyContent: "center" },
  scrollContent: { maxWidth: 450, alignSelf: "center", width: "100%" },
  
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  backText: { color: "#718096", fontSize: 13, marginLeft: 5 },

  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  logoBox: { backgroundColor: "#007BFF", width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 },
  logoText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  brandName: { fontSize: 18, fontWeight: "bold", color: "#007BFF" },

  title: { fontSize: 28, fontWeight: "bold", color: "#1A202C", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#718096", marginBottom: 35 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#2D3748", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
  },
  input: { flex: 1, fontSize: 14, color: "#333" ,outlineStyle: "none"},

  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  checkboxRow: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: "#CBD5E0", borderRadius: 4, marginRight: 8, justifyContent: "center", alignItems: "center" },
  checkboxActive: { backgroundColor: "#007BFF", borderColor: "#007BFF" },
  checkboxLabel: { fontSize: 14, color: "#4A5568" },
  forgotLink: { fontSize: 14, color: "#3182CE", fontWeight: "600" },

  loginBtn: { height: 55, borderRadius: 15, justifyContent: "center", alignItems: "center", marginTop: 10 },
  btnContent: { flexDirection: "row", alignItems: "center" },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 25 },
  footerText: { color: "#718096", fontSize: 14 },
  footerLink: { color: "#007BFF", fontWeight: "bold", fontSize: 14 },

  bluePanel: { flex: 0.8, backgroundColor: "#007BFF", justifyContent: "center", alignItems: "center", padding: 60 },
  bigLogo: { backgroundColor: "rgba(255,255,255,0.15)", width: 100, height: 100, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 40 },
  bigLogoText: { color: "#fff", fontWeight: "bold", fontSize: 32 },
  welcomeTitle: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 15 },
  welcomeSubtitle: { color: "rgba(255,255,255,0.8)", textAlign: "center", fontSize: 15, lineHeight: 24 },
});