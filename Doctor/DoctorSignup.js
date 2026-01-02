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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const DOCTOR_REGISTER_API =
  "https://hospitaldatabasemanagement.onrender.com/doctor/register";

export default function DoctorRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    department: "",
    role: "",
    gender: "",
    experience: "", 
     description: "",   // ✅ NEW FIELD ADDED
     scheduleIn: "",
    scheduleOut: "",
  });

  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState({ field: "", visible: false });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      handleChange(showTimePicker.field, timeString);
    }
    setShowTimePicker({ field: "", visible: false });
  };

  const handleRegister = async () => {
    const {
      name,
      email,
      password,
      confirmPassword,
      phoneNumber,
      department,
      role,
      gender,
      experience,
     description  , // ✅ NEW
      scheduleIn,
      scheduleOut,
    } = form;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber ||
      !department ||
      !role ||
      !gender ||
      !experience ||
        !description ||   // ✅ NEW
         !scheduleIn ||
      !scheduleOut
    ) {
      Alert.alert("Error", "Please fill all the fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
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
        Alert.alert("Success", "Doctor registered successfully!");
        navigation.navigate("DoctorLogin");
      } else {
        Alert.alert("Error", data.message || "Registration failed!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Registration</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Name */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Doctor Name"
            value={form.name}
            onChangeText={(v) => handleChange("name", v)}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => handleChange("email", v)}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(v) => handleChange("password", v)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-open-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={form.confirmPassword}
            onChangeText={(v) => handleChange("confirmPassword", v)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Phone */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={form.phoneNumber}
            onChangeText={(v) => handleChange("phoneNumber", v)}
          />
        </View>

        {/* Department */}
        <View style={styles.inputContainer}>
          <Ionicons name="medkit-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Department"
            value={form.department}
            onChangeText={(v) => handleChange("department", v)}
          />
        </View>

        {/* Role */}
        <View style={styles.inputContainer}>
          <Ionicons name="briefcase-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Role (ex: Cardiologist)"
            value={form.role}
            onChangeText={(v) => handleChange("role", v)}
          />
        </View>

        {/* Experience */}
        <View style={styles.inputContainer}>
          <Ionicons name="school-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            placeholder="Experience (years)"
            keyboardType="numeric"
            value={form.experience}
            onChangeText={(v) => handleChange("experience", v)}
          />
        </View>

        {/* Gender Radio Buttons */}
        <Text style={{ marginTop: 10, fontSize: 16, fontWeight: "600", color: "#333" }}>
          Gender
        </Text>

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
{/* Description */}
<View style={styles.inputContainer}>
  <Ionicons name="document-text-outline" size={20} color="#555" />
  <TextInput
    style={[styles.input, { height: 100, textAlignVertical: "top" }]}
    placeholder="Description "
    multiline
    value={form.description}
    onChangeText={(v) => handleChange("description", v)}
  />
</View>

        {/* Schedule In */}
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowTimePicker({ field: "scheduleIn", visible: true })}
        >
          <Ionicons name="time-outline" size={20} color="#555" />
          <Text style={{ flex: 1, marginLeft: 10, color: form.scheduleIn ? "#000" : "#999" }}>
            {form.scheduleIn || "Schedule In (HH:MM)"}
          </Text>
        </TouchableOpacity>

        {/* Schedule Out */}
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowTimePicker({ field: "scheduleOut", visible: true })}
        >
          <Ionicons name="time-outline" size={20} color="#555" />
          <Text style={{ flex: 1, marginLeft: 10, color: form.scheduleOut ? "#000" : "#999" }}>
            {form.scheduleOut || "Schedule Out (HH:MM)"}
          </Text>
        </TouchableOpacity>

        {showTimePicker.visible && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
          />
        )}

        {/* Register */}
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register Doctor</Text>}
        </TouchableOpacity>

        {/* Login */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("DoctorLogin")}>
            <Text style={styles.loginLink}> Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f9f9f9",
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  container: {
    padding: 20,
    backgroundColor: "#fff",
    paddingBottom: 60,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "100%",
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },

  radioGroup: {
    flexDirection: "row",
    marginVertical: 10,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2e86de",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    height: 10,
    width: 10,
    backgroundColor: "#2e86de",
    borderRadius: 5,
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },

  button: {
    backgroundColor: "#2e86de",
    borderRadius: 10,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  loginText: {
    color: "#333",
    fontSize: 15,
  },
  loginLink: {
    color: "#2e86de",
    fontWeight: "bold",
    fontSize: 15,
  },
});
