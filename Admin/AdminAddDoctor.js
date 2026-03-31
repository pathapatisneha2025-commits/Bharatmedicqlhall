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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient"; // ✅ Gradient support

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
  const [focusedInput, setFocusedInput] = useState(""); // For input glow
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

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

  const renderInputField = (icon, placeholder, key, props = {}) => {
    const isFocused = focusedInput === key;
    return (
      <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]}>
        <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
          <Ionicons name={icon} size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={form[key]}
            onChangeText={(v) => handleChange(key, v)}
            onFocus={() => setFocusedInput(key)}
            onBlur={() => setFocusedInput("")}
            {...props}
          />
          {key.includes("password") && (
            <TouchableOpacity
              onPress={() =>
                key === "password"
                  ? setShowPassword(!showPassword)
                  : setShowConfirmPassword(!showConfirmPassword)
              }
            >
              <Ionicons
                name={
                  key === "password"
                    ? showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                    : showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={20}
                color="#555"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e86de" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f0f4fc" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainCard, { width: isDesktop ? "70%" : "95%" }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Doctor Registration</Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Input Grid */}
          <View style={styles.grid}>
            {renderInputField("person-outline", "Doctor Name", "name")}
            {renderInputField("mail-outline", "Email", "email", {
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}
            {renderInputField("lock-closed-outline", "Password", "password", {
              secureTextEntry: !showPassword,
            })}
            {renderInputField("lock-open-outline", "Confirm Password", "confirmPassword", {
              secureTextEntry: !showConfirmPassword,
            })}
            <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]}>
              <View style={[styles.inputContainer, focusedInput === "phoneNumber" && styles.inputFocused]}>
                <Ionicons name="call-outline" size={20} color="#555" />
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10 digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.phoneNumber}
                  onChangeText={(v) => handleChange("phoneNumber", v.replace(/[^0-9]/g, ""))}
                  onFocus={() => setFocusedInput("phoneNumber")}
                  onBlur={() => setFocusedInput("")}
                />
              </View>
            </View>
            {renderInputField("medkit-outline", "Department", "department")}
            {renderInputField("briefcase-outline", "Role", "role")}
            {renderInputField("school-outline", "Experience (years)", "experience", {
              keyboardType: "numeric",
            })}
          </View>

          {/* Gender */}
          <View style={styles.fullWidthSection}>
            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.radioGroup}>
              {["Male", "Female", "Other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.radioOption}
                  onPress={() => handleChange("gender", g)}
                >
                  <View style={styles.radioCircle}>
                    {form.gender === g && <View style={styles.radioSelected} />}
                  </View>
                  <Text style={styles.radioLabel}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.grid}>
            {["scheduleIn", "scheduleOut"].map((field, idx) => (
              <View style={[styles.inputWrapper, isDesktop && styles.halfWidth]} key={field}>
                <Text style={styles.sectionLabel}>
                  {field === "scheduleIn" ? "Schedule In" : "Schedule Out"}
                </Text>
                {Platform.OS === "web" ? (
                  <input
                    type="time"
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    style={styles.webTimeInput}
                  />
                ) : (
                  <TouchableOpacity
                    style={[styles.inputContainer, focusedInput === field && styles.inputFocused]}
                    onPress={() => setShowTimePicker({ field, visible: true })}
                  >
                    <Ionicons name="time-outline" size={20} color="#555" />
                    <Text style={{ flex: 1, marginLeft: 10 }}>
                      {form[field] || "Select time"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.fullWidthSection}>
            <View style={[styles.inputContainer, { height: 120, alignItems: "flex-start" }]}>
              <Ionicons name="document-text-outline" size={20} color="#555" style={{ marginTop: 10 }} />
              <TextInput
                style={[styles.input, { height: "100%" }]}
                placeholder="Description"
                multiline
                value={form.description}
                onChangeText={(v) => handleChange("description", v)}
              />
            </View>
          </View>

          {/* Gradient Button */}
          <TouchableOpacity activeOpacity={0.8} onPress={handleRegister} disabled={loading}>
            <LinearGradient
              colors={["#4c8bf5", "#2e86de"]}
              start={[0, 0]}
              end={[1, 0]}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Add Doctor</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

         
         


        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingVertical: 20, alignItems: "center", backgroundColor: "#f0f4fc" },
  mainCard: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#333" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  inputWrapper: { width: "100%", marginBottom: 18 },
  halfWidth: { width: "48%" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d4d9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#f9f9f9",
  },
  inputFocused: {
    borderColor: "#2e86de",
    shadowColor: "#2e86de",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: "#333",outlineStyle: "none" },
  sectionLabel: { marginBottom: 6, fontSize: 15, fontWeight: "600", color: "#333" },
  fullWidthSection: { width: "100%", marginBottom: 20 },
  radioGroup: { flexDirection: "row", marginVertical: 10 },
  radioOption: { flexDirection: "row", alignItems: "center", marginRight: 25 },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: "#2e86de", alignItems: "center", justifyContent: "center" },
  radioSelected: { height: 10, width: 10, backgroundColor: "#2e86de", borderRadius: 5 },
  radioLabel: { marginLeft: 8, fontSize: 15, color: "#333" },
  gradientButton: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  loginContainer: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  loginText: { fontSize: 16, color: "#555" },
  loginLink: { color: "#2e86de", fontWeight: "bold", fontSize: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  countryCode: { marginLeft: 10, fontSize: 16, color: "#555" },
  webTimeInput: { flex: 1, padding: 14, fontSize: 16, borderRadius: 12, border: "1px solid #d0d4d9", backgroundColor: "#f9f9f9", outlineStyle: "none" },
});
