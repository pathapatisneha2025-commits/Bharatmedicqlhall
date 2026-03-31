// screens/EmployeeUpdateScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
   Platform,
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { getEmployeeId } from "../utils/storage"; 

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function PickerUpdateScreen({ navigation }) {
  const [employeeId, setEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [image, setImage] = useState(null);

  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "", mobile: "", familyNumber: "",
    age: "", experience: "", bloodGroup: "", aadhar: "", pan: "", esiNumber: "", reportingManager: "",
    department: "", role: "", dob: new Date(), scheduleIn: "", scheduleOut: "", breakIn: "", breakOut: "",
    monthlySalary: "", jobDescription: "", employmentType: "", category: "", ifsc: "", branchName: "",
    bankName: "", accountNumber: "", temporaryAddresses: [{ street: "", state: "", pincode: "", city: "" }],
    permanentAddresses: [{ street: "", state: "", pincode: "", city: "" }], dateOfJoining: new Date(),
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showDojPicker, setShowDojPicker] = useState(false);
  const [showScheduleInPicker, setShowScheduleInPicker] = useState(false);
  const [showScheduleOutPicker, setShowScheduleOutPicker] = useState(false);
  const [showBreakInPicker, setShowBreakInPicker] = useState(false);
  const [showBreakOutPicker, setShowBreakOutPicker] = useState(false);
const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 1000;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };
  // Fetch employee ID
  useEffect(() => {
    const fetchStoredEmployeeId = async () => {
      const storedId = await getEmployeeId();
      if (storedId) setEmployeeId(storedId);
      else {
        showAlert("Error", "No employee ID found. Please log in again.");
        navigation.goBack();
      }
    };
    fetchStoredEmployeeId();
  }, []);

  // Fetch department & role options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          fetch(`${BASE_URL}/department/all`),
          fetch(`${BASE_URL}/role/all`),
        ]);
        const deptData = await deptRes.json();
        const roleData = await roleRes.json();
        if (deptRes.ok && Array.isArray(deptData)) setDepartmentOptions(deptData);
        if (roleRes.ok && Array.isArray(roleData)) setRoleOptions(roleData);
      } catch (error) { console.log("Dropdown fetch error", error); }
    };
    fetchOptions();
  }, []);

  // Fetch existing employee details
  useEffect(() => {
    if (!employeeId) return;
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/employee/${employeeId}`);
        const data = await response.json();
        if (response.ok && data.success && data.employee) {
          const emp = data.employee;
          setForm({
            ...form,
            fullName: emp.full_name || "", email: emp.email || "", mobile: emp.mobile || "",
            familyNumber: emp.family_number || "", age: emp.age ? String(emp.age) : "",
            experience: emp.experience ? String(emp.experience) : "", bloodGroup: emp.blood_group || "",
            aadhar: emp.aadhar || "", pan: emp.pan || "", esiNumber: emp.esi_number || "",
            reportingManager: emp.reporting_manager || "", department: emp.department || "",
            role: emp.role || "", dob: emp.dob ? new Date(emp.dob) : new Date(),
            scheduleIn: emp.schedule_in || "", scheduleOut: emp.schedule_out || "",
            breakIn: emp.break_in || "", breakOut: emp.break_out || "",
            monthlySalary: emp.monthly_salary ? String(emp.monthly_salary) : "",
            jobDescription: emp.job_description || "", employmentType: emp.employment_type || "",
            category: emp.category || "", ifsc: emp.ifsc || "", branchName: emp.branch_name || "",
            bankName: emp.bank_name || "", accountNumber: emp.account_number || "",
            temporaryAddresses: emp.temporary_addresses || [{ street: "", state: "", pincode: "", city: "" }],
            permanentAddresses: emp.permanent_addresses || [{ street: "", state: "", pincode: "", city: "" }],
            dateOfJoining: emp.date_of_joining ? new Date(emp.date_of_joining) : new Date(),
          });
          setImage(emp.image ? { uri: emp.image } : null);
        } else { showAlert("Error", data.message || "Failed to fetch employee details"); }
      } catch (error) { showAlert("Error", "Failed to fetch employee details"); }
      finally { setLoading(false); }
    };
    fetchEmployee();
  }, [employeeId]);

  // Pick image
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert("Permission Denied", "Camera roll access is required.");
      return;
    }
    const galleryResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!galleryResult.canceled) setImage(galleryResult.assets[0]);
  };

  // Handle update
  const handleUpdateEmployee = async () => {
    if (!employeeId) { showAlert("Error", "Employee ID not found."); return; }
    if (form.password && form.password !== form.confirmPassword) { Alert.alert("Validation Error", "Passwords do not match."); return; }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (["dob", "dateOfJoining"].includes(key)) formData.append(key, value.toISOString().split("T")[0]);
      else if (["temporaryAddresses", "permanentAddresses"].includes(key)) formData.append(key, JSON.stringify(value));
      else formData.append(key, value);
    });

    if (image && image.uri && !image.uri.startsWith("http")) {
      const uriParts = image.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("image", { uri: image.uri, name: `profile.${fileType}`, type: `image/${fileType}` });
    }

    try {
      setLoading(true);
const response = await fetch(`${BASE_URL}/employee/update/${employeeId}`, {
  method: "PUT",
  body: formData,
});
      const result = await response.json();
      if (response.ok && result.success) {
       showAlert("Success", "Employee updated successfully");
        navigation.navigate("ProfileScreen", { refresh: true });
      } else { showAlert("Update Failed", result.message || "Something went wrong"); }
    } catch (error) { showAlert("Error", "Failed to update employee"); }
    finally { setLoading(false); }
  };

  if (loading && !form.fullName) return (
    <View style={styles.loader}><ActivityIndicator size="large" color="#007BFF" /></View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* <View
              style={{
                width: containerWidth,
                alignSelf: "center",
                flex: 1,
              }}
            > */}
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007BFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Update Picker Employee</Text>

      {/* Profile Image */}
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? <Image source={{ uri: image.uri }} style={styles.image} /> : <Ionicons name="camera" size={50} color="#777" />}
      </TouchableOpacity>

      {/* Form Inputs */}
      {[
        { placeholder: "Full Name", value: form.fullName, key: "fullName", icon: "person-outline" },
        { placeholder: "Email", value: form.email, key: "email", keyboardType: "email-address", icon: "mail-outline" },
        { placeholder: "Password", value: form.password, key: "password", secureTextEntry: true, icon: "lock-closed-outline" },
        { placeholder: "Confirm Password", value: form.confirmPassword, key: "confirmPassword", secureTextEntry: true, icon: "lock-closed-outline" },
        { placeholder: "Mobile", value: form.mobile, key: "mobile", keyboardType: "phone-pad", icon: "call-outline" },
        { placeholder: "Family Contact", value: form.familyNumber, key: "familyNumber", keyboardType: "phone-pad", icon: "call-outline" },
        { placeholder: "Age", value: form.age, key: "age", keyboardType: "numeric", icon: "calendar-outline" },
        { placeholder: "Experience", value: form.experience, key: "experience", icon: "school-outline" },
        { placeholder: "Aadhar Number", value: form.aadhar, key: "aadhar", keyboardType: "numeric", icon: "card-outline" },
        { placeholder: "PAN Number", value: form.pan, key: "pan", icon: "document-text-outline" },
        { placeholder: "ESI Number", value: form.esiNumber, key: "esiNumber", icon: "barcode-outline" },
        { placeholder: "Reporting Manager", value: form.reportingManager, key: "reportingManager", icon: "people-outline" },
        { placeholder: "IFSC", value: form.ifsc, key: "ifsc", icon: "key-outline" },
        { placeholder: "Bank Name", value: form.bankName, key: "bankName", icon: "card-outline" },
        { placeholder: "Branch Name", value: form.branchName, key: "branchName", icon: "location-outline" },
        { placeholder: "Account Number", value: form.accountNumber, key: "accountNumber", keyboardType: "numeric", icon: "card-outline" },
        { placeholder: "Monthly Salary", value: form.monthlySalary, key: "monthlySalary", keyboardType: "numeric", icon: "cash-outline" },
        { placeholder: "Job Description", value: form.jobDescription, key: "jobDescription", icon: "document-text-outline" },
      ].map((item, idx) => (
        <View key={idx} style={styles.inputWrapper}>
          <Ionicons name={item.icon} size={20} color="#007BFF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder={item.placeholder}
            value={item.value}
            secureTextEntry={item.secureTextEntry || false}
            keyboardType={item.keyboardType || "default"}
            onChangeText={(text) => setForm({ ...form, [item.key]: text })}
          />
        </View>
      ))}

      {/* Dropdowns, date pickers, addresses etc. (similar styling) */}

      {/* Update Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEmployee} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>Update Picker Employee</Text>}
      </TouchableOpacity>
      {/* </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f4f6f9" },
  backButton: { position: "absolute", top: 25, left: 20, zIndex: 10, backgroundColor: "#fff", padding: 8, borderRadius: 20, elevation: 5 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", marginTop: 40 },
  imageContainer: { alignSelf: "center", width: 120, height: 120, borderRadius: 60, backgroundColor: "#e1e4e8", justifyContent: "center", alignItems: "center", marginBottom: 20, overflow: "hidden", elevation: 3 },
  image: { width: "100%", height: "100%" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 10, marginBottom: 15, borderWidth: 1, borderColor: "#d1d5db" },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  picker: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, height: 50, marginBottom: 15, paddingHorizontal: 10 },
  datePicker: { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#d1d5db", marginBottom: 15 },
  updateButton: { backgroundColor: "#007BFF", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 10 },
  updateButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
