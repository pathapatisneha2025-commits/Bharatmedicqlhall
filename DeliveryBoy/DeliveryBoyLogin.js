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
  const [loadingCount, setLoadingCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isLargeScreen = SCREEN_WIDTH > 800;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
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
        await storeEmployeeId(employee.id);
        showAlert("Login successful!", `Welcome ${employee.full_name}`);
        const role = employee.role?.toLowerCase();
        if (role === "hd delivery") navigation.navigate("DeliverBoyDashboard");
        else if (role === "picker") navigation.navigate("PickerDashboardScreen");
        else showAlert("Access Denied", "You do not have access.");
      } else {
        setPasswordError(data.error || "Invalid credentials.");
      }
    } catch (error) {
      showAlert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={{ marginTop: 10 }}>Loading {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, isLargeScreen && styles.row]}>
        
        {/* LEFT SECTION (Form) */}
        <View style={[styles.formSection, isLargeScreen ? { width: '50%' } : { width: '100%' }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={18} color="#64748b" />
            <Text style={styles.backText}>Back to role selection</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>BM</Text>
            </View>
            <Text style={styles.brandTitle}>Bharat Medical Hall</Text>
          </View>

          <Text style={styles.title}>Delivery Login</Text>
          <Text style={styles.subtitle}>Enter your credentials to access your dashboard</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => { setEmail(text); setEmailError(""); }}
              keyboardType="email-address"
              placeholderTextColor="#94a3b8"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1, borderBottomWidth: 0, backgroundColor: 'transparent', height: '100%' }]}
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => { setPassword(text); setPasswordError(""); }}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <View style={styles.optionsRow}>
            {/* <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
              </View> */}
              {/* <Text style={styles.rememberText}>Remember me</Text> */}
            {/* </TouchableOpacity> */}
            <TouchableOpacity onPress={() => navigation.navigate("EmpResetPasswordScreen")}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
            <Text style={styles.signInText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* RIGHT SECTION (Hero) - Only visible on large screens */}
        {isLargeScreen && (
          <View style={styles.heroSection}>
            <View style={styles.heroLogoBox}>
               <Text style={styles.heroLogoText}>BM</Text>
            </View>
            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>
              Access your healthcare management dashboard and stay connected with your medical records.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: '100%',
    maxWidth: 1000,
    minHeight: 600,
    backgroundColor: "#fff",
    flexDirection: "column",
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  row: {
    flexDirection: "row",
  },
  formSection: {
    padding: 40,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backText: {
    color: '#64748b',
    fontSize: 14,
    marginLeft: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBox: {
    backgroundColor: '#0ea5e9',
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1e293b",
    outlineStyle: "none"
    
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingRight: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  rememberText: {
    color: '#64748b',
    fontSize: 14,
  },
  forgotText: {
    color: "#0ea5e9",
    fontWeight: "600",
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: "#06b6d4",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  heroSection: {
    width: '50%',
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  heroLogoBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 30,
    borderRadius: 20,
    marginBottom: 40,
  },
  heroLogoText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
});