import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storeEmployeeId } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
const isDesktop = width >= 1024;

  // --- Responsive Scaling ---
  const headingSize = Math.min(Math.max(width * 0.06, 22), 32); // 22-32px
  const descSize = Math.min(Math.max(width * 0.035, 14), 18);
  const inputHeight = Math.min(Math.max(height * 0.06, 45), 60);
  const buttonHeight = Math.min(Math.max(height * 0.065, 50), 65);
  const buttonFontSize = Math.min(Math.max(width * 0.045, 16), 20);
  const containerPadding = Math.min(Math.max(width * 0.05, 20), 60);

  // --- Limit input/button width for web ---
  const maxInputWidth = isDesktop ? 420 : Math.min(width * 0.9, 400);
const maxButtonWidth = isDesktop ? 420 : Math.min(width * 0.85, 400);


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
           const [loadingCount, setLoadingCount] = useState(0);
  useEffect(() => {
                  let interval;
                  if (loading) {
                    setLoadingCount(0);
                    interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
                  } else clearInterval(interval);
                  return () => clearInterval(interval);
                }, [loading]);
 const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
    };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Missing Fields', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/employee/login",
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.employee) {
        const employee = data.employee;

        if (employee.status !== "approved") {
         showAlert(
            "⏳ Pending Approval",
            "Admin has not approved your credentials yet."
          );
          return;
        }

        await storeEmployeeId(employee.id);

        // ROLE BASED NAVIGATION
        if (employee.role === "pune") {
          navigation.reset({
            index: 0,
            routes: [{ name: "NurseDashboard", params: { employee } }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Dashboard", params: { employee } }],
          });
        }
      } else {
        showAlert('❌ Login Failed', data.message || 'Invalid email or password.');
      }
    } catch (error) {
      setLoading(false);
      showAlert('❌ Error', error.message || 'Something went wrong');
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading{loadingCount}s</Text>
      </View>
    );

 return (
    <View style={styles.mainContainer}>
      {/* LEFT SIDE: LOGIN FORM */}
      <View style={[styles.loginSection, { paddingHorizontal: isDesktop ? width * 0.05 : 20 }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={18} color="#666" />
            <Text style={styles.backText}>Back to role selection</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>BM</Text></View>
            <Text style={styles.brandName}>Bharat Medical Hall</Text>
          </View>

          <Text style={styles.title}>Employee Login</Text>
          <Text style={styles.subtitle}>Enter your credentials to access your dashboard</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.rowBetween}>
              {/* <TouchableOpacity style={styles.checkboxRow} onPress={() => setRememberMe(!rememberMe)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity> */}
              <TouchableOpacity onPress={() => navigation.navigate("EmpResetPasswordScreen")}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.signInButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* RIGHT SIDE: BRANDING (Visible only on Desktop) */}
      {isDesktop && (
        <View style={styles.brandingSection}>
          <View style={styles.brandingContent}>
            <View style={styles.largeLogoBadge}><Text style={styles.largeLogoText}>BM</Text></View>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Access your healthcare management dashboard and stay connected with your medical records.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF' },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  loginSection: { flex: 1, justifyContent: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, maxWidth: 500, alignSelf: 'center', width: '100%' },
  
  // Header styles
  backLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backText: { color: '#666', marginLeft: 4, fontSize: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  logoBadge: { backgroundColor: '#1E88E5', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  brandName: { fontSize: 20, fontWeight: '700', color: '#1E88E5' },
  
  // Typography
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#777', marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
  
  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
  },
  input: { flex: 1, fontSize: 15, color: '#000', outlineStyle: "none", },
  
  // Controls
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB', marginRight: 8 },
  checkboxChecked: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  checkboxLabel: { color: '#666', fontSize: 14 },
  forgotText: { color: '#1E88E5', fontSize: 14, fontWeight: '600' },
  
  // Button
  signInButton: {
    backgroundColor: '#00B4D8', // Cyan-blue gradient feel from your image
    height: 55,
    borderRadius: 30,
    marginTop: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B4D8',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  signInButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600', marginRight: 8 },

  // Branding Side
  brandingSection: { flex: 1, backgroundColor: '#0077B6', justifyContent: 'center', alignItems: 'center' },
  brandingContent: { width: '70%', alignItems: 'center' },
  largeLogoBadge: { backgroundColor: 'rgba(255,255,255,0.2)', width: 120, height: 120, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  largeLogoText: { color: '#FFF', fontSize: 48, fontWeight: '800' },
  welcomeTitle: { color: '#FFF', fontSize: 42, fontWeight: '700', marginBottom: 20 },
  welcomeSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 18, textAlign: 'center', lineHeight: 26 },
});