import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from 'expo-linear-gradient';

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function SubAdminRegisterScreen() {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isLargeScreen = SCREEN_WIDTH > 768;

  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Required", "Camera access is needed.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleRegister = async () => {
    // Basic validation check
    if (!name || !email || !password) {
        showAlert("Error", "Please fill required fields");
        return;
    }
    setLoading(true);
    // ... logic remains same as your original provided function
    setTimeout(() => setLoading(false), 2000); // Dummy loading for UI test
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loaderText}>Creating Account... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.mainSplit, { flexDirection: isLargeScreen ? 'row' : 'column-reverse' }]}>
          
          {/* LEFT SECTION: THE FORM */}
          <ScrollView contentContainerStyle={styles.leftSideScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formContent}>
              <View style={styles.brandHeader}>
                <View style={styles.miniLogo}><Text style={styles.miniLogoText}>BM</Text></View>
                <Text style={styles.brandName}>Bharat Medical Hall</Text>
              </View>

              <Text style={styles.title}>Sub Admin Register</Text>
              <Text style={styles.subtitle}>Fill in the details to create your administrative account.</Text>

              {/* Photo Upload */}
              <TouchableOpacity onPress={takePhoto} style={styles.imagePicker}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={24} color="#0ea5e9" />
                    <Text style={styles.uploadText}>PHOTO</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputGrid}>
                <InputField label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
                <InputField label="Email Address" placeholder="name@hospital.com" value={email} onChangeText={setEmail} />
                <InputField label="Phone Number" placeholder="10-digit number" keyboardType="numeric" value={phone} onChangeText={setPhone} />
                <InputField 
                    label="Password" 
                    placeholder="••••••••" 
                    secureTextEntry={!showPassword} 
                    value={password} 
                    onChangeText={setPassword}
                    rightIcon={showPassword ? "eye" : "eye-off"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                />
                
                <Text style={styles.label}>Joining Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
                  <Text style={styles.dateText}>{joiningDate.toDateString()}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
                <LinearGradient colors={['#0ea5e9', '#22d3ee']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.gradient}>
                  <Text style={styles.submitBtnText}>Register Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginLinkRow}>
                <Text style={styles.grayText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("SubAdminLoginScreen")}>
                  <Text style={styles.blueLink}> Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* RIGHT SECTION: BRANDING (The Blue Area) */}
          <LinearGradient colors={['#0369a1', '#0ea5e9']} style={styles.rightSide}>
            <View style={styles.brandingContent}>
              <View style={styles.largeLogoBox}>
                <Text style={styles.largeLogoText}>BM</Text>
              </View>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeDesc}>
                Access your healthcare management dashboard and stay connected with your medical records and hospital staff.
              </Text>
              <View style={styles.decorationCircle} />
            </View>
          </LinearGradient>

        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={joiningDate} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setJoiningDate(d); }} />
      )}
    </View>
  );
}

const InputField = ({ label, rightIcon, onRightIconPress, ...props }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput style={styles.textInput} placeholderTextColor="#94a3b8" {...props} />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress}><Ionicons name={rightIcon} size={20} color="#94a3b8" /></TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  mainSplit: { flex: 1 },
  
  // Left Side Styling
  leftSideScroll: { flexGrow: 1, justifyContent: 'center' },
  formContent: { padding: 40, width: '100%', maxWidth: 500, alignSelf: 'center' },
  brandHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  miniLogo: { width: 32, height: 32, backgroundColor: '#0ea5e9', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  miniLogoText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  brandName: { marginLeft: 12, fontSize: 18, fontWeight: '700', color: '#0369a1' },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 25 },

  imagePicker: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f9ff', borderStyle: 'dashed', borderWidth: 1, borderColor: '#bae6fd', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 80, height: 80, borderRadius: 40 },
  uploadText: { fontSize: 10, color: '#0ea5e9', fontWeight: 'bold', marginTop: 4 },

  inputGrid: { gap: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
  inputWrapper: { height: 50, backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  textInput: { flex: 1, color: '#1e293b', fontSize: 15,  outlineStyle: "none",   // ✅ removes web rectangle
 },
  dateInput: { height: 50, backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f5f9' },
  dateText: { color: '#1e293b', fontSize: 15 },

  submitBtn: { marginTop: 30, borderRadius: 12, overflow: 'hidden', elevation: 4 },
  gradient: { height: 55, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  loginLinkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  grayText: { color: '#64748b' },
  blueLink: { color: '#0ea5e9', fontWeight: '700' },

  // Right Side Styling (Branding)
  rightSide: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  brandingContent: { alignItems: 'center', maxWidth: 400 },
  largeLogoBox: { width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  largeLogoText: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  welcomeTitle: { color: '#FFF', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  welcomeDesc: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 16, marginTop: 15, lineHeight: 24 },
  decorationCircle: { position: 'absolute', bottom: -100, right: -100, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 10, color: '#0ea5e9', fontWeight: '600' }
});