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
  useWindowDimensions,
  StatusBar,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { storeSubadminId } from '../utils/storage'; 

const SubAdminLoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isLargeScreen = SCREEN_WIDTH > 768;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert("Validation Error", "Please fill in both fields.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/subadmin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await response.json();
      setLoading(false);

      if (response.ok && data.user) {
        const subadminId = data.user;
        if (subadminId) {
          await storeSubadminId(subadminId.id.toString());
        }
        showAlert("Login Successful", data.message || "Welcome!");
        navigation.navigate("DeptDashboard", { user: data.user.name });
      } else {
        showAlert("Login Failed", data.message || "Invalid credentials.");
      }
    } catch (error) {
      setLoading(false);
      showAlert("Network Error", "Please try again later.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isLargeScreen ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.mainSplit, { flexDirection: isLargeScreen ? 'row' : 'column-reverse' }]}>
          
          {/* LEFT SECTION: LOGIN FORM */}
          <ScrollView contentContainerStyle={styles.leftSideScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formContent}>
              <View style={styles.brandHeader}>
                <View style={styles.miniLogo}><Text style={styles.miniLogoText}>BM</Text></View>
                <Text style={styles.brandNameText}>Bharat Medical Hall</Text>
              </View>

              <Text style={styles.title}>Sub-Admin Login</Text>
              <Text style={styles.subtitle}>Welcome back! Please enter your details.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Email"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate("DeptResetPasswordScreen")}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                <LinearGradient colors={['#0ea5e9', '#22d3ee']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.gradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.loginBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.registerLinkRow}>
                <Text style={styles.grayText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("SubAdminRegisterScreen")}>
                  <Text style={styles.blueLink}> Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* RIGHT SECTION: BRANDING */}
          <LinearGradient colors={['#0369a1', '#0ea5e9']} style={styles.rightSide}>
            <View style={styles.brandingContent}>
              <View style={styles.largeLogoBox}>
                <Text style={styles.largeLogoText}>BM</Text>
              </View>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeDesc}>
                Access your healthcare management dashboard and stay connected with your medical records.
              </Text>
            </View>
          </LinearGradient>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SubAdminLoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  mainSplit: { flex: 1 },
  
  // Left Side (Form)
  leftSideScroll: { flexGrow: 1, justifyContent: 'center' },
  formContent: { padding: 40, width: '100%', maxWidth: 450, alignSelf: 'center' },
  brandHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  miniLogo: { width: 32, height: 32, backgroundColor: '#0ea5e9', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  miniLogoText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  brandNameText: { marginLeft: 12, fontSize: 18, fontWeight: '700', color: '#0369a1' },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 30 },

  inputGroup: { gap: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: -5 },
  inputWrapper: { height: 55, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  textInput: { flex: 1, color: '#1e293b', fontSize: 15,  outlineStyle: "none",   // ✅ removes web rectangle
 },
  eyeIcon: { padding: 5 },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { color: '#0ea5e9', fontSize: 13, fontWeight: '600' },

  loginBtn: { marginTop: 20, borderRadius: 12, overflow: 'hidden', elevation: 3 },
  gradient: { height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  registerLinkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  grayText: { color: '#64748b', fontSize: 14 },
  blueLink: { color: '#0ea5e9', fontWeight: '700', fontSize: 14 },

  // Right Side (Branding)
  rightSide: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  brandingContent: { alignItems: 'center', maxWidth: 350 },
  largeLogoBox: { width: 90, height: 90, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  largeLogoText: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  welcomeTitle: { color: '#FFF', fontSize: 30, fontWeight: '800', textAlign: 'center' },
  welcomeDesc: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 15, marginTop: 15, lineHeight: 22 },
});