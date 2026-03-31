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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { getEmployeeId } from "../utils/storage"; // AsyncStorage helper

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function EmployeeUpdateScreen({ navigation }) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
  const isDesktop = SCREEN_WIDTH >= 768; // Desktop breakpoint

  const [employeeId, setEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);

  const [clickedAfterApproved, setClickedAfterApproved] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    familyNumber: "",
    age: "",
    experience: "",
    bloodGroup: "",
    aadhar: "",
    pan: "",
    esiNumber: "",
    reportingManager: "",
    department: "",
    role: "",
    dob: new Date(),
    scheduleIn: "",
    scheduleOut: "",
    breakIn: "",
    breakOut: "",
    monthlySalary: "",
    jobDescription: "",
    employmentType: "",
    category: "",
    ifsc: "",
    branchName: "",
    bankName: "",
    accountNumber: "",
    temporaryAddresses: [{ street: "", state: "", pincode: "", city: "" }],
    permanentAddresses: [{ street: "", state: "", pincode: "", city: "" }],
    dateOfJoining: new Date(),
  });

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showDojPicker, setShowDojPicker] = useState(false);
  const [showScheduleInPicker, setShowScheduleInPicker] = useState(false);
  const [showScheduleOutPicker, setShowScheduleOutPicker] = useState(false);
  const [showBreakInPicker, setShowBreakInPicker] = useState(false);
  const [showBreakOutPicker, setShowBreakOutPicker] = useState(false);

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  // -------------------- FETCH EMPLOYEE ID --------------------
  useEffect(() => {
    const fetchStoredEmployeeId = async () => {
      const storedId = await getEmployeeId();
      if (storedId) setEmployeeId(storedId);
      else {
        Alert.alert("Error", "No employee ID found. Please log in again.");
        navigation.goBack();
      }
    };
    fetchStoredEmployeeId();
  }, []);

  // -------------------- FETCH DEPARTMENT & ROLE OPTIONS --------------------
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          fetch(`${BASE_URL}/department/all`),
          fetch(`${BASE_URL}/role/all`),
        ]);

        const deptData = await deptRes.json();
        const roleData = await roleRes.json();

        if (deptRes.ok && deptData.success) setDepartmentOptions(deptData.departments || []);
        if (roleRes.ok && roleData.success) setRoleOptions(roleData.roles || []);
      } catch (error) {
        console.log("Dropdown fetch error", error);
      }
    };
    fetchOptions();
  }, []);

  // -------------------- FETCH EMPLOYEE DETAILS --------------------
  useEffect(() => {
    if (!employeeId) return;

    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/employee/${employeeId}`);
        const data = await res.json();

        if (res.ok && data.success && data.employee) {
          const emp = data.employee;
          setForm({
            ...form,
            fullName: emp.full_name || "",
            email: emp.email || "",
            mobile: emp.mobile || "",
            familyNumber: emp.family_number || "",
            age: emp.age ? String(emp.age) : "",
            experience: emp.experience ? String(emp.experience) : "",
            bloodGroup: emp.blood_group || "",
            aadhar: emp.aadhar || "",
            pan: emp.pan || "",
            esiNumber: emp.esi_number || "",
            reportingManager: emp.reporting_manager || "",
            department: emp.department || "",
            role: emp.role || "",
            dob: emp.dob ? new Date(emp.dob) : new Date(),
            scheduleIn: emp.schedule_in || "",
            scheduleOut: emp.schedule_out || "",
            breakIn: emp.break_in || "",
            breakOut: emp.break_out || "",
            monthlySalary: emp.monthly_salary ? String(emp.monthly_salary) : "",
            jobDescription: emp.job_description || "",
            employmentType: emp.employment_type || "",
            category: emp.category || "",
            ifsc: emp.ifsc || "",
            branchName: emp.branch_name || "",
            bankName: emp.bank_name || "",
            accountNumber: emp.account_number || "",
            temporaryAddresses: emp.temporary_addresses || [{ street: "", state: "", pincode: "", city: "" }],
            permanentAddresses: emp.permanent_addresses || [{ street: "", state: "", pincode: "", city: "" }],
            dateOfJoining: emp.date_of_joining ? new Date(emp.date_of_joining) : new Date(),
          });
          setImage(emp.image ? { uri: emp.image } : null);
        } else {
          showAlert("Error", data.message || "Failed to fetch employee details");
        }
      } catch (error) {
        showAlert("Error", "Failed to fetch employee details");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [employeeId]);

  // -------------------- IMAGE PICKER --------------------
  const pickImage = async () => {
    Alert.alert("Update Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return showAlert("Permission Denied", "Camera access is required.");
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
          if (!result.canceled) setImage(result.assets[0]);
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) return showAlert("Permission Denied", "Gallery access is required.");
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
          if (!result.canceled) setImage(result.assets[0]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // -------------------- HANDLE EMPLOYEE UPDATE --------------------
  const handleUpdateEmployee = async () => {
    if (!employeeId) return showAlert("Error", "Employee ID not found.");
    setLoading(true);

    try {
      const statusRes = await fetch(`${BASE_URL}/employee/${employeeId}`);
      const statusData = await statusRes.json();
      if (!statusData.success || !statusData.employee) return showAlert("Error", "Unable to fetch employee status");

      const currentStatus = statusData.employee.pending_approve_update;
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof Date) formData.append(key, value.toISOString());
        else if (typeof value === "object" && value !== null) formData.append(key, JSON.stringify(value));
        else formData.append(key, value);
      });

      if (image && !image.uri.startsWith("http")) {
        const ext = image.uri.split(".").pop();
        formData.append("image", { uri: image.uri, name: `profile.${ext}`, type: `image/${ext}` });
      }

      if (currentStatus === "approved") {
        if (!clickedAfterApproved) {
          const updateRes = await fetch(`${BASE_URL}/employee/update/${employeeId}`, { method: "PUT", body: formData });
          const updateData = await updateRes.json();
          if (!updateData.success) return showAlert("Error", updateData.message || "Update failed");
          showAlert("Updated", "Your profile was updated successfully.");
          setClickedAfterApproved(true);
          return;
        } else {
          const pendingRes = await fetch(`${BASE_URL}/employee/pending-update/${employeeId}`, { method: "PUT" });
          const pendingData = await pendingRes.json();
          if (!pendingData.success) return showAlert("Error", pendingData.message || "Failed to set pending");
          showAlert("Pending", "Your profile is now pending admin approval.");
          setClickedAfterApproved(false);
          return;
        }
      }

      const pendingRes = await fetch(`${BASE_URL}/employee/pending-update/${employeeId}`, { method: "PUT" });
      const pendingData = await pendingRes.json();
      if (!pendingData.success) return showAlert("Error", pendingData.message || "Failed to set pending");
      showAlert("Update Sent", "Your profile changes have been sent to admin for approval.");
    } catch (err) {
      console.error(err);
      showAlert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- RENDER HELPERS --------------------
  const renderInput = (label, key, keyboardType = "default", secure = false) => (
    <TextInput
      style={styles.input}
      placeholder={label}
      value={form[key]}
      onChangeText={(text) => setForm({ ...form, [key]: text })}
      keyboardType={keyboardType}
      secureTextEntry={secure}
    />
  );

  const renderAddress = (type) => {
    const addresses = type === "temp" ? form.temporaryAddresses : form.permanentAddresses;
    return addresses.map((addr, idx) => (
      <View key={idx} style={{ marginBottom: 15 }}>
        {["street", "city", "state", "pincode"].map((field) => (
          <TextInput
            key={field}
            style={styles.input}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={addr[field]}
            onChangeText={(text) => {
              const newAddresses = [...addresses];
              newAddresses[idx][field] = text;
              setForm({ ...form, [type === "temp" ? "temporaryAddresses" : "permanentAddresses"]: newAddresses });
            }}
          />
        ))}
      </View>
    ));
  };

  if (loading && !form.fullName)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );

  // -------------------- MAIN RETURN --------------------
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
  <View style={styles.desktopContainer}>
    {/* LEFT COLUMN: FORM */}
  <ScrollView contentContainerStyle={[styles.leftColumn]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#007BFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Update Employee Profile</Text>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? <Image source={{ uri: image.uri }} style={styles.image} /> : <Ionicons name="camera" size={50} color="#777" />}
      </TouchableOpacity>

            {/* Basic Info */}
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={isDesktop ? styles.gridContainer : null}>
              {renderInput("Full Name", "fullName")}
              {renderInput("Email", "email", "email-address")}
              {renderInput("Password", "password", "default", true)}
              {renderInput("Confirm Password", "confirmPassword", "default", true)}
              {renderInput("Mobile", "mobile", "phone-pad")}
              {renderInput("Family Contact", "familyNumber", "phone-pad")}
              {renderInput("Age", "age", "numeric")}
              {renderInput("Experience", "experience")}
              <View style={[styles.pickerWrapper, isDesktop && styles.halfInput]}>
                <Picker selectedValue={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                  <Picker.Item label="Blood Group" value="" />
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <Picker.Item key={bg} label={bg} value={bg} />
                  ))}
                </Picker>
              </View>
             {isDesktop ? (
  // Web / Desktop: native HTML date input
  <input
    type="date"
    value={form.dob.toISOString().split("T")[0]}
    onChange={(e) => setForm({ ...form, dob: new Date(e.target.value) })}
    style={{
      width: "48%",
      padding: 12,
      marginBottom: 15,
      borderRadius: 8,
      border: "1px solid #ddd",
      fontSize: 15,
    }}
  />
) : (
  // Mobile: TouchableOpacity opens DateTimePicker
  <TouchableOpacity
    style={[styles.datePicker, isDesktop && styles.halfInput]}
    onPress={() => setShowDobPicker(true)}
  >
    <Text style={styles.datePickerText}>
      DOB: {form.dob.toISOString().split("T")[0]}
    </Text>
  </TouchableOpacity>
)}

            </View>

            {/* Professional Details */}
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <View style={isDesktop ? styles.gridContainer : null}>
              {renderInput("Aadhar Number", "aadhar", "numeric")}
              {renderInput("PAN Number", "pan")}
              {renderInput("ESI Number", "esiNumber")}
              {renderInput("Reporting Manager", "reportingManager")}
              <View style={[styles.pickerWrapper, isDesktop && styles.halfInput]}>
                <Picker selectedValue={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <Picker.Item label="Select Department" value="" />
                  {departmentOptions.map((d) => (
                    <Picker.Item key={d._id} label={d.department_name} value={d.department_name} />
                  ))}
                </Picker>
              </View>
              <View style={[styles.pickerWrapper, isDesktop && styles.halfInput]}>
                <Picker selectedValue={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <Picker.Item label="Select Role" value="" />
                  {roleOptions.map((r) => (
                    <Picker.Item key={r._id} label={r.role_name} value={r.role_name} />
                  ))}
                </Picker>
              </View>
            {isDesktop ? (
  // Web / Desktop: native HTML date input
  <input
    type="date"
    value={form.dateOfJoining.toISOString().split("T")[0]}
    onChange={(e) =>
      setForm({ ...form, dateOfJoining: new Date(e.target.value) })
    }
    style={{
      width: "48%",
      padding: 12,
      marginBottom: 15,
      borderRadius: 8,
      border: "1px solid #ddd",
      fontSize: 15,
    }}
  />
) : (
  // Mobile: TouchableOpacity opens DateTimePicker
  <TouchableOpacity
    style={[styles.datePicker, isDesktop && styles.halfInput]}
    onPress={() => setShowDojPicker(true)}
  >
    <Text style={styles.datePickerText}>
      DOJ: {form.dateOfJoining.toISOString().split("T")[0]}
    </Text>
  </TouchableOpacity>
)}

            </View>

          {/* Shift & Break */}
<Text style={styles.sectionTitle}>Shift & Break Timing</Text>
<View style={isDesktop ? styles.gridContainer : null}>
  {["Schedule In", "Schedule Out", "Break In", "Break Out"].map((label, idx) => {
    const value =
      idx === 0 ? form.scheduleIn :
      idx === 1 ? form.scheduleOut :
      idx === 2 ? form.breakIn :
      form.breakOut;

    // Handler for web input
    const handleWebChange = (e) => {
      const newValue = e.target.value;
      if (idx === 0) setForm({ ...form, scheduleIn: newValue });
      else if (idx === 1) setForm({ ...form, scheduleOut: newValue });
      else if (idx === 2) setForm({ ...form, breakIn: newValue });
      else setForm({ ...form, breakOut: newValue });
    };

    return isDesktop ? (
      // Desktop / Web: use native HTML time input
      <input
        key={idx}
        type="time"
        value={value}
        onChange={handleWebChange}
        style={{
          width: "48%",
          padding: 12,
          marginBottom: 15,
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 15,
        }}
      />
    ) : (
      // Mobile: use TouchableOpacity to open native time picker
      <TouchableOpacity
        key={idx}
        style={[styles.datePicker, isDesktop && styles.halfInput]}
        onPress={() => {
          if (idx === 0) setShowScheduleInPicker(true);
          else if (idx === 1) setShowScheduleOutPicker(true);
          else if (idx === 2) setShowBreakInPicker(true);
          else setShowBreakOutPicker(true);
        }}
      >
        <Text style={styles.datePickerText}>
          {label}: {value || "Set Time"}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>


{/* Job Description */}
{isDesktop ? (
  <textarea
    placeholder="Job Description"
    value={form.jobDescription}
    onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
    style={{
      width: "100%",
      padding: 12,
      borderRadius: 8,
      border: "1px solid #ddd",
      fontSize: 15,
      marginBottom: 15,
      resize: "vertical",
      minHeight: 80,
    }}
  />
) : (
  <TextInput
    style={styles.input}
    placeholder="Job Description"
    value={form.jobDescription}
    onChangeText={(text) => setForm({ ...form, jobDescription: text })}
  />
)}

{/* Employment Type */}
{isDesktop ? (
  <select
    value={form.employmentType}
    onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
    style={{
      width: "100%",
      padding: 12,
      borderRadius: 8,
      border: "1px solid #ddd",
      fontSize: 15,
      marginBottom: 15,
    }}
  >
    <option value="">Select Employment Type</option>
    {["Full-time", "Part-time", "Contract", "Apprentice"].map((type, idx) => (
      <option key={idx} value={type}>{type}</option>
    ))}
  </select>
) : (
  <Picker
    selectedValue={form.employmentType}
    style={styles.picker}
    onValueChange={(value) => setForm({ ...form, employmentType: value })}
  >
    <Picker.Item label="Select Employment Type" value="" />
    {["Full-time", "Part-time", "Contract", "Apprentice"].map((type, idx) => (
      <Picker.Item key={idx} label={type} value={type} />
    ))}
  </Picker>
)}

{/* Category */}
{isDesktop ? (
  <select
    value={form.category}
    onChange={(e) => setForm({ ...form, category: e.target.value })}
    style={{
      width: "100%",
      padding: 12,
      borderRadius: 8,
      border: "1px solid #ddd",
      fontSize: 15,
      marginBottom: 15,
    }}
  >
    <option value="">Select Category</option>
    {["Permanent", "Temporary", "Intern"].map((cat, idx) => (
      <option key={idx} value={cat}>{cat}</option>
    ))}
  </select>
) : (
  <Picker
    selectedValue={form.category}
    style={styles.picker}
    onValueChange={(value) => setForm({ ...form, category: value })}
  >
    <Picker.Item label="Select Category" value="" />
    {["Permanent", "Temporary", "Intern"].map((cat, idx) => (
      <Picker.Item key={idx} label={cat} value={cat} />
    ))}
  </Picker>
)}

{/* Bank & Salary */}
<Text style={styles.sectionTitle}>Bank & Salary</Text>
<View style={isDesktop ? styles.gridContainer : null}>
  {isDesktop ? (
    <>
      <input
        type="number"
        placeholder="Monthly Salary"
        value={form.monthlySalary}
        onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })}
        style={{ ...styles.input, width: "48%" }}
      />
      <input
        type="text"
        placeholder="IFSC"
        value={form.ifsc}
        onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
        style={{ ...styles.input, width: "48%" }}
      />
      <input
        type="text"
        placeholder="Bank Name"
        value={form.bankName}
        onChange={(e) => setForm({ ...form, bankName: e.target.value })}
        style={{ ...styles.input, width: "48%" }}
      />
      <input
        type="number"
        placeholder="Account Number"
        value={form.accountNumber}
        onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
        style={{ ...styles.input, width: "48%" }}
      />
    </>
  ) : (
    <>
      {renderInput("Monthly Salary", "monthlySalary", "numeric")}
      {renderInput("IFSC", "ifsc")}
      {renderInput("Bank Name", "bankName")}
      {renderInput("Account Number", "accountNumber", "numeric")}
    </>
  )}
</View>


            {/* Addresses */}
            <Text style={styles.sectionTitle}>Temporary Address</Text>
            {renderAddress("temp")}
            <Text style={styles.sectionTitle}>Permanent Address</Text>
            {renderAddress("perm")}

            {/* Pickers */}
            {showScheduleInPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour
                onChange={(e, d) => {
                  setShowScheduleInPicker(false);
                  if (d) setForm({ ...form, scheduleIn: d.toTimeString().slice(0, 5) });
                }}
              />
            )}
            {showScheduleOutPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour
                onChange={(e, d) => {
                  setShowScheduleOutPicker(false);
                  if (d) setForm({ ...form, scheduleOut: d.toTimeString().slice(0, 5) });
                }}
              />
            )}
            {showBreakInPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour
                onChange={(e, d) => {
                  setShowBreakInPicker(false);
                  if (d) setForm({ ...form, breakIn: d.toTimeString().slice(0, 5) });
                }}
              />
            )}
            {showBreakOutPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour
                onChange={(e, d) => {
                  setShowBreakOutPicker(false);
                  if (d) setForm({ ...form, breakOut: d.toTimeString().slice(0, 5) });
                }}
              />
            )}
            {showDobPicker && <DateTimePicker value={form.dob} mode="date" onChange={(e, d) => { setShowDobPicker(false); if(d) setForm({ ...form, dob: d }); }} />}
            {showDojPicker && <DateTimePicker value={form.dateOfJoining} mode="date" onChange={(e, d) => { setShowDojPicker(false); if(d) setForm({ ...form, dateOfJoining: d }); }} />}
               <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEmployee} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>Save All Changes</Text>}
            </TouchableOpacity>
                    </ScrollView>

     {isDesktop && (
      <View style={styles.rightColumn}>
        <Text style={styles.brandTitle}>Welcome to Employee Portal</Text>
        <Text style={styles.brandSubtitle}>Manage your profile, shifts, and bank info from here.</Text>
      </View>
    )}
           
          </View>
    </KeyboardAvoidingView>
  );
}

// -------------------- STYLES --------------------
const styles = StyleSheet.create({
 desktopContainer: { flex: 1, flexDirection: "row", backgroundColor: "#f8f9fa" },
leftColumn: { flex: 3, padding: 20, backgroundColor: "#fff" },
rightColumn: { flex: 2, minWidth: 400, backgroundColor: "#0077B6", justifyContent: "center", alignItems: "center", padding: 40 },


  scrollContainer: { paddingBottom: 50, backgroundColor: "#f8f9fa" },
  mainWrapper: { alignSelf: "center", backgroundColor: "#fff", padding: 25, marginVertical: 20, borderRadius: 12, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  halfInput: { width: "48%" },
  title: { fontSize: 26, fontWeight: "800", color: "#333", textAlign: "center", marginBottom: 20, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 20, marginBottom: 12, color: "#007BFF", borderLeftWidth: 4, borderLeftColor: "#007BFF", paddingLeft: 10 },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", marginBottom: 15, fontSize: 15 },
  pickerWrapper: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 15, height: 50, justifyContent: "center" },
  datePicker: { backgroundColor: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", marginBottom: 15, height: 50, justifyContent: "center" },
  datePickerText: { fontSize: 15, color: "#555" },
  imageContainer: { alignSelf: "center", width: 110, height: 110, borderRadius: 55, backgroundColor: "#e9ecef", justifyContent: "center", alignItems: "center", marginBottom: 20, borderWidth: 2, borderColor: "#007BFF" },
  image: { width: "100%", height: "100%", borderRadius: 55 },
  updateButton: { backgroundColor: "#007BFF", padding: 18, borderRadius: 8, alignItems: "center", marginTop: 30 },
  updateButtonText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  backButton: { marginBottom: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  brandTitle: { color: "#fff", fontSize: 36, fontWeight: "700", marginBottom: 20 },
  brandSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 18, textAlign: "center" },
  backButton: { marginBottom: 15 },
   webInput: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
    marginBottom: 15,
    fontFamily: "sans-serif",
  },
  webTextArea: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
    marginBottom: 15,
    fontFamily: "sans-serif",
    minHeight: 80,
    resize: "vertical",
  },
  webSelect: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 15,
    marginBottom: 15,
    fontFamily: "sans-serif",
    backgroundColor: "#fff",
  },
  webHalfInput: {
    width: "48%",
  },

});
