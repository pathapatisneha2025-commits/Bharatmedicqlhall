import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Image, // Added Image import
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* =======================
    PREMIUM COUNTING LOADER
======================= */
const CountingLoader = ({ text = "Loading..." }) => {
  const [loadingCount, setLoadingCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingCount((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderCircle}>
         <Text style={styles.loaderNumber}>{loadingCount}%</Text>
         <Text style={styles.loaderSubText}>{text}</Text>
      </View>
    </View>
  );
};

/* =======================
    MAIN LOGIN SCREEN
======================= */
export default function PatientLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrors({ 
        email: !email ? "Required" : "", 
        password: !password ? "Required" : "" 
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.patient) {
        await AsyncStorage.setItem("patientId", data.patient.id.toString());
        navigation.replace("patienthomescreen");
      } else {
        showAlert("Login Failed", data.message || "Invalid credentials");
      }
    } catch {
      showAlert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CountingLoader text="Verifying credentials..." />;

  return (
    <View style={styles.mainScreen}>
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        
        {/* LEFT COLUMN: LOGIN FORM */}
        <View style={styles.formContainer}>
          <ScrollView contentContainerStyle={styles.formSide} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
               {/* MINI LOGO REPLACED WITH IMAGE */}
               <Image 
                 source={require('../assets/Logo.jpg')} 
                 style={styles.miniLogoImage}
                 resizeMode="contain" 
               />
               <Text style={styles.brandTitle}>
                 <Text style={{color: '#0080FF'}}>Bharat Medical</Text> Hall
               </Text>
            </View>

            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subtext}>Enter your credentials to access your patient dashboard</Text>

            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="john@example.com" 
                  value={email} 
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="••••••••" 
                  secureTextEntry={!showPassword} 
                  value={password} 
                  onChangeText={setPassword} 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => navigation.navigate("PatientForgotPasswordScreen")}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login to Dashboard →</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('PatientSignUp')}>
              <Text style={styles.signupLink}>New here? <Text style={styles.signupLinkBold}>Create an account</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* RIGHT COLUMN: HERO (Desktop Only) */}
        {isDesktop && (
          <View style={styles.heroSide}>
            <View style={styles.heroContent}>
                {/* LARGE HERO LOGO REPLACED WITH IMAGE */}
                <Image 
                  source={require('../assets/Logo.jpg')} 
                  style={styles.heroLogoImage}
                  resizeMode="contain"
                />
                <Text style={styles.heroTitle}>Manage Your Health{'\n'}On the Go.</Text>
                <Text style={styles.heroSubtitle}>
                  View prescriptions, track appointments, and stay in touch with your doctors 24/7.
                </Text>
                
                <View style={styles.featureBox}>
                   <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={22} color="#2DD4BF" />
                      <Text style={styles.featureText}>Secure Health Records</Text>
                   </View>
                   <View style={styles.featureItem}>
                      <MaterialCommunityIcons name="check-circle" size={22} color="#2DD4BF" />
                      <Text style={styles.featureText}>Instant Doctor Connectivity</Text>
                   </View>
                </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, flexDirection: 'row' },
  desktopContainer: { width: '100%', height: '100%' },

  // Form Side
  formContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  formSide: { padding: 40, width: '100%', maxWidth: 500 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 50 },
  
  // Adjusted for Actual Logo Image
  miniLogoImage: { 
    width: 50, 
    height: 50, 
    marginRight: 15 
  },
  
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  heading: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtext: { fontSize: 16, color: '#64748B', marginBottom: 40 },
  
  label: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8, marginTop: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9',      outlineStyle: "none",   // ✅ removes web rectangle
 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, padding: 16, fontSize: 16, color: '#1E293B' ,outlineStyle: "none"},
  inputError: { borderColor: '#EF4444' },
  eyeIcon: { marginRight: 16 },
  
  forgotBtn: { alignSelf: 'flex-end', marginTop: 12 },
  forgotText: { color: '#0080FF', fontWeight: '600', fontSize: 14 },

  button: { 
    backgroundColor: '#00C2FF', 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 40,
    ...Platform.select({ web: { boxShadow: '0px 10px 20px rgba(0, 194, 255, 0.3)' } })
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '800' },
  signupLink: { textAlign: 'center', marginTop: 30, color: '#64748B' },
  signupLinkBold: { color: '#0080FF', fontWeight: '800' },

  // Hero Side
  heroSide: { flex: 1.2, backgroundColor: '#0080FF', justifyContent: 'center', alignItems: 'center' },
  heroContent: { alignItems: 'center', padding: 40 },
  
  // Hero Logo Style
  heroLogoImage: {
    width: 140,
    height: 140,
    marginBottom: 30,
    // Adds a soft glow behind the logo on the blue side
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },

  heroTitle: { color: 'white', fontSize: 48, fontWeight: '900', textAlign: 'center', lineHeight: 56, marginBottom: 20 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 18, textAlign: 'center', lineHeight: 28, maxWidth: 400, marginBottom: 40 },
  
  featureBox: { gap: 15 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, paddingHorizontal: 20, borderRadius: 12 },
  featureText: { color: 'white', fontWeight: '600' },

  // Loader Styles
  loaderContainer: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  loaderCircle: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', borderWidth: 8, borderColor: '#0080FF' },
  loaderNumber: { fontSize: 48, fontWeight: '900', color: '#0080FF' },
  loaderSubText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 5 },
});