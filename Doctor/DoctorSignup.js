import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";

const DOCTOR_REGISTER_API = "https://hospitaldatabasemanagement.onrender.com/doctor/register";

export default function DoctorRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phoneNumber: "", department: "", role: "", gender: "",
    experience: "", description: "", scheduleIn: "", scheduleOut: "",
  });

  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState({ field: "", visible: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState("");
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      handleChange(showTimePicker.field, `${hours}:${minutes}`);
    }
    setShowTimePicker({ field: "", visible: false });
  };

  const handleRegister = async () => {
    if (Object.values(form).some(value => !value)) {
      showAlert("Error", "Please fill all the fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      showAlert("Error", "Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(DOCTOR_REGISTER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        showAlert("Success", "Doctor registered successfully!");
        navigation.navigate("DoctorLogin");
      } else {
        showAlert("Error", data.message || "Registration failed!");
      }
    } catch (error) {
      showAlert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (label, icon, placeholder, key, props = {}) => {
    const isFocused = focusedInput === key;
    return (
      <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#A0AEC0"
            value={form[key]}
            onChangeText={(v) => handleChange(key, v)}
            onFocus={() => setFocusedInput(key)}
            onBlur={() => setFocusedInput("")}
            {...props}
          />
          {key.includes("password") && (
            <TouchableOpacity
              onPress={() => key === "password" ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={key === "password" ? (showPassword ? "eye-off-outline" : "eye-outline") : (showConfirmPassword ? "eye-off-outline" : "eye-outline")} size={20} color="#718096" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.mainContainer}>
        
        {/* LEFT SIDE: FORM */}
        <ScrollView contentContainerStyle={styles.leftScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={16} color="#718096" />
              <Text style={styles.backText}>Back to role selection</Text>
            </TouchableOpacity>

            <View style={styles.brandContainer}>
              <View style={styles.brandIcon}><Text style={styles.brandIconText}>BM</Text></View>
              <Text style={styles.brandName}>Bharat Medical Hall</Text>
            </View>

            <Text style={styles.title}>Doctor Registration</Text>
            <Text style={styles.subtitle}>Enter your details to create your healthcare account</Text>

            <View style={styles.grid}>
              {renderInputField("Full Name", "person-outline", "Enter your name", "name")}
              {renderInputField("Email Address", "mail-outline", "Enter your email", "email", { keyboardType: "email-address", autoCapitalize: "none" })}
              {renderInputField("Password", "lock-closed-outline", "Create password", "password", { secureTextEntry: !showPassword })}
              {renderInputField("Confirm Password", "lock-open-outline", "Confirm password", "confirmPassword", { secureTextEntry: !showConfirmPassword })}
              
              <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={[styles.inputContainer, focusedInput === "phoneNumber" && styles.inputFocused]}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={form.phoneNumber}
                    onChangeText={(v) => handleChange("phoneNumber", v.replace(/[^0-9]/g, ""))}
                    onFocus={() => setFocusedInput("phoneNumber")}
                    onBlur={() => setFocusedInput("")}
                  />
                </View>
              </View>

              {renderInputField("Department", "medkit-outline", "e.g. Cardiology", "department")}
              {renderInputField("Role", "briefcase-outline", "e.g. Senior Surgeon", "role")}
              {renderInputField("Experience", "school-outline", "Years of experience", "experience", { keyboardType: "numeric" })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Gender</Text>
            <View style={styles.radioGroup}>
              {["Male", "Female", "Other"].map((g) => (
                <TouchableOpacity key={g} style={styles.radioOption} onPress={() => handleChange("gender", g)}>
                  <View style={[styles.radioCircle, form.gender === g && styles.radioActive]}>
                    {form.gender === g && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.grid}>
                {["scheduleIn", "scheduleOut"].map((field) => (
                  <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]} key={field}>
                    <Text style={styles.fieldLabel}>{field === "scheduleIn" ? "Schedule In" : "Schedule Out"}</Text>
                    {Platform.OS === "web" ? (
                      <input type="time" value={form[field]} onChange={(e) => handleChange(field, e.target.value)} style={styles.webTime} />
                    ) : (
                      <TouchableOpacity style={styles.inputContainer} onPress={() => setShowTimePicker({ field, visible: true })}>
                        <Text style={{ color: form[field] ? "#333" : "#A0AEC0" }}>{form[field] || "Select time"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Description</Text>
              <View style={[styles.inputContainer, { height: 100, alignItems: "flex-start", paddingTop: 10 }]}>
                <TextInput style={[styles.input, { height: "100%" }]} placeholder="Tell us about yourself..." multiline value={form.description} onChangeText={(v) => handleChange("description", v)} />
              </View>
            </View>

            <TouchableOpacity onPress={handleRegister} disabled={loading}>
              <LinearGradient colors={["#0095FF", "#00D1D1"]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.signInBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signInText}>Register Doctor →</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("DoctorLogin")}>
                <Text style={styles.footerLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* RIGHT SIDE: BRANDING PANEL */}
        {isDesktop && (
          <View style={styles.bluePanel}>
            <View style={styles.bigIcon}><Text style={styles.bigIconText}>BM</Text></View>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSub}>Access your healthcare management dashboard and stay connected with your medical records.</Text>
          </View>
        )}

        {showTimePicker.visible && Platform.OS !== "web" && (
          <DateTimePicker value={new Date()} mode="time" display="spinner" onChange={handleTimeChange} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: "row" },
  leftScroll: { flexGrow: 1, backgroundColor: "#fff", paddingVertical: 40 },
  formContent: { width: "90%", maxWidth: 600, alignSelf: "center" },
  
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  backText: { color: "#718096", fontSize: 13, marginLeft: 5 },
  
  brandContainer: { flexDirection: "row", alignItems: "center", marginBottom: 35 },
  brandIcon: { backgroundColor: "#007BFF", width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 },
  brandIconText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  brandName: { color: "#007BFF", fontWeight: "bold", fontSize: 18 },

  title: { fontSize: 26, fontWeight: "bold", color: "#1A202C" },
  subtitle: { fontSize: 14, color: "#718096", marginBottom: 25, marginTop: 5 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  inputWrapper: { width: "100%", marginBottom: 15 },
  halfWidth: { width: "48%" },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#2D3748", marginBottom: 8 },
  
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 15, height: 48 },
  inputFocused: { borderColor: "#007BFF", backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 14, color: "#333" ,outlineStyle: "none"},
  prefix: { marginRight: 10, fontWeight: "600", color: "#4A5568" },

  radioGroup: { flexDirection: "row", marginBottom: 15 },
  radioOption: { flexDirection: "row", alignItems: "center", marginRight: 20 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#CBD5E0", justifyContent: "center", alignItems: "center" },
  radioActive: { borderColor: "#007BFF" },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#007BFF" },
  radioLabel: { marginLeft: 8, color: "#4A5568", fontSize: 14 },

  webTime: { width: "100%", height: 48, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "0 15px", outline: "none" },
  
  signInBtn: { height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 20 },
  signInText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#718096" },
  footerLink: { color: "#007BFF", fontWeight: "bold" },

  bluePanel: { flex: 0.8, backgroundColor: "#007BFF", justifyContent: "center", alignItems: "center", padding: 60 },
  bigIcon: { backgroundColor: "rgba(255,255,255,0.15)", width: 100, height: 100, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 30 },
  bigIconText: { color: "#fff", fontWeight: "bold", fontSize: 32 },
  welcomeTitle: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 15 },
  welcomeSub: { color: "rgba(255,255,255,0.8)", textAlign: "center", fontSize: 15, lineHeight: 22 },
});