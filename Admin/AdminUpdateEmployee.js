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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRoute, useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminUpdateEmployeeScreen({ navigation }) {
  const [employeeId, setEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
const route = useRoute();
    const { id } = route.params; // 👈 coming from navigation.navigate("AdminUpdateEmployeeScreen", { id })

  // API-driven dropdowns
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);

  // Form state
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

  // ⏰ Timing pickers
  const [showScheduleInPicker, setShowScheduleInPicker] = useState(false);
  const [showScheduleOutPicker, setShowScheduleOutPicker] = useState(false);
  const [showBreakInPicker, setShowBreakInPicker] = useState(false);
  const [showBreakOutPicker, setShowBreakOutPicker] = useState(false);

  const [image, setImage] = useState(null);

  

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

        if (deptRes.ok && deptData.success) {
          setDepartmentOptions(deptData.departments || []);
        }
        if (roleRes.ok && roleData.success) {
          setRoleOptions(roleData.roles || []);
        }
      } catch (error) {
        console.log("Dropdown fetch error", error);
      }
    };
    fetchOptions();
  }, []);

  // Fetch existing employee details
  useEffect(() => {
    if (!id) return;
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/employee/${id}`);
        const data = await response.json();
        if (response.ok && data.success && data.employee) {
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
            temporaryAddresses:
              emp.temporary_addresses || [
                { street: "", state: "", pincode: "", city: "" },
              ],
            permanentAddresses:
              emp.permanent_addresses || [
                { street: "", state: "", pincode: "", city: "" },
              ],
            dateOfJoining: emp.date_of_joining
              ? new Date(emp.date_of_joining)
              : new Date(),
          });
          setImage(emp.image ? { uri: emp.image } : null);
        } else {
          Alert.alert("Error", data.message || "Failed to fetch employee details");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch employee details");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  // Pick image
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "Camera roll access is required.");
      return;
    }

    const galleryResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!galleryResult.canceled) {
      setImage(galleryResult.assets[0]);
    }
  };

  // Handle update
  const handleUpdateEmployee = async () => {
    if (!id) {
      Alert.alert("Error", "Employee ID not found.");
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "dob" || key === "dateOfJoining") {
        formData.append(key, value.toISOString().split("T")[0]);
      } else if (
        key === "temporaryAddresses" ||
        key === "permanentAddresses"
      ) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });

    if (image && image.uri && !image.uri.startsWith("http")) {
      const uriParts = image.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("image", {
        uri: image.uri,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/employee/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const result = await response.json();
      if (response.ok && result.success) {
        Alert.alert("Success", "Employee updated successfully");
      } else {
        Alert.alert("Update Failed", result.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.fullName) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#007BFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Update Employee</Text>

      {/* Profile Image */}
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} />
        ) : (
          <Ionicons name="camera" size={50} color="#777" />
        )}
      </TouchableOpacity>

      {/* Full Name */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.fullName}
        onChangeText={(text) => setForm({ ...form, fullName: text })}
      />

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => setForm({ ...form, email: text })}
        keyboardType="email-address"
      />

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={form.password}
        onChangeText={(text) => setForm({ ...form, password: text })}
      />

      {/* Confirm Password */}
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={form.confirmPassword}
        onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
      />

      {/* Mobile */}
      <TextInput
        style={styles.input}
        placeholder="Mobile"
        value={form.mobile}
        onChangeText={(text) => setForm({ ...form, mobile: text })}
        keyboardType="phone-pad"
      />

      {/* Family Contact */}
      <TextInput
        style={styles.input}
        placeholder="Family Contact"
        value={form.familyNumber}
        onChangeText={(text) => setForm({ ...form, familyNumber: text })}
        keyboardType="phone-pad"
      />

      {/* Age */}
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={form.age}
        onChangeText={(text) => setForm({ ...form, age: text })}
        keyboardType="numeric"
      />

      {/* Experience */}
      <TextInput
        style={styles.input}
        placeholder="Experience"
        value={form.experience}
        onChangeText={(text) => setForm({ ...form, experience: text })}
      />

      {/* Blood Group */}
      <Picker
        selectedValue={form.bloodGroup}
        style={styles.picker}
        onValueChange={(value) => setForm({ ...form, bloodGroup: value })}
      >
        <Picker.Item label="Select Blood Group" value="" />
        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg, idx) => (
          <Picker.Item key={idx} label={bg} value={bg} />
        ))}
      </Picker>

      {/* Aadhar Number */}
      <TextInput
        style={styles.input}
        placeholder="Aadhar Number"
        value={form.aadhar}
        onChangeText={(text) => setForm({ ...form, aadhar: text })}
        keyboardType="numeric"
      />

      {/* PAN Number */}
      <TextInput
        style={styles.input}
        placeholder="PAN Number"
        value={form.pan}
        onChangeText={(text) => setForm({ ...form, pan: text })}
      />

      {/* ESI Number */}
      <TextInput
        style={styles.input}
        placeholder="ESI Number"
        value={form.esiNumber}
        onChangeText={(text) => setForm({ ...form, esiNumber: text })}
      />

      {/* Reporting Manager */}
      <TextInput
        style={styles.input}
        placeholder="Reporting Manager"
        value={form.reportingManager}
        onChangeText={(text) => setForm({ ...form, reportingManager: text })}
      />

      {/* Department */}
      <Picker
        selectedValue={form.department}
        style={styles.picker}
        onValueChange={(value) => setForm({ ...form, department: value })}
      >
        <Picker.Item label="Select Department" value="" />
        {departmentOptions.map((dept, idx) => (
          <Picker.Item
            key={idx}
            label={dept.department_name}
            value={dept.department_name}
          />
        ))}
      </Picker>

      {/* Role */}
      <Picker
        selectedValue={form.role}
        style={styles.picker}
        onValueChange={(value) => setForm({ ...form, role: value })}
      >
        <Picker.Item label="Select Role" value="" />
        {roleOptions.map((roleItem, idx) => (
          <Picker.Item
            key={idx}
            label={roleItem.role_name}
            value={roleItem.role_name}
          />
        ))}
      </Picker>

      {/* Date of Birth */}
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => setShowDobPicker(true)}
      >
        <Text>Date of Birth: {form.dob.toISOString().split("T")[0]}</Text>
      </TouchableOpacity>
      {showDobPicker && (
        <DateTimePicker
          value={form.dob}
          mode="date"
          display="default"
          onChange={(e, selectedDate) => {
            setShowDobPicker(false);
            if (selectedDate) setForm({ ...form, dob: selectedDate });
          }}
        />
      )}

      {/* Date of Joining */}
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => setShowDojPicker(true)}
      >
        <Text>
          Date of Joining: {form.dateOfJoining.toISOString().split("T")[0]}
        </Text>
      </TouchableOpacity>
      {showDojPicker && (
        <DateTimePicker
          value={form.dateOfJoining}
          mode="date"
          display="default"
          onChange={(e, selectedDate) => {
            setShowDojPicker(false);
            if (selectedDate) setForm({ ...form, dateOfJoining: selectedDate });
          }}
        />
      )}

      {/* Schedule In */}
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => setShowScheduleInPicker(true)}
      >
        <Text>
          Schedule In: {form.scheduleIn ? form.scheduleIn : "Select Time"}
        </Text>
      </TouchableOpacity>
      {showScheduleInPicker && (
        <DateTimePicker
          value={form.scheduleIn ? new Date(`1970-01-01T${form.scheduleIn}:00`) : new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(e, selectedDate) => {
            setShowScheduleInPicker(false);
            if (selectedDate) {
              const timeStr = selectedDate.toTimeString().slice(0, 5);
              setForm({ ...form, scheduleIn: timeStr });
            }
          }}
        />
      )}

      {/* Schedule Out */}
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => setShowScheduleOutPicker(true)}
      >
        <Text>
          Schedule Out: {form.scheduleOut ? form.scheduleOut : "Select Time"}
        </Text>
      </TouchableOpacity>
      {showScheduleOutPicker && (
        <DateTimePicker
          value={form.scheduleOut ? new Date(`1970-01-01T${form.scheduleOut}:00`) : new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(e, selectedDate) => {
            setShowScheduleOutPicker(false);
            if (selectedDate) {
              const timeStr = selectedDate.toTimeString().slice(0, 5);
              setForm({ ...form, scheduleOut: timeStr });
            }
          }}
        />
      )}

      {/* Break In */}
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => setShowBreakInPicker(true)}
      >
        <Text>Break In: {form.breakIn ? form.breakIn : "Select Time"}</Text>
      </TouchableOpacity>
      {showBreakInPicker && (
        <DateTimePicker
          value={form.breakIn ? new Date(`1970-01-01T${form.breakIn}:00`) : new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(e, selectedDate) => {
            setShowBreakInPicker(false);
            if (selectedDate) {
              const timeStr = selectedDate.toTimeString().slice(0, 5);
              setForm({ ...form, breakIn: timeStr });
            }
          }}
        />
      )}

      {/* Break Out */}
      <TouchableOpacity
        style={styles.datePicker}
        onPress={() => setShowBreakOutPicker(true)}
      >
        <Text>Break Out: {form.breakOut ? form.breakOut : "Select Time"}</Text>
      </TouchableOpacity>
      {showBreakOutPicker && (
        <DateTimePicker
          value={form.breakOut ? new Date(`1970-01-01T${form.breakOut}:00`) : new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(e, selectedDate) => {
            setShowBreakOutPicker(false);
            if (selectedDate) {
              const timeStr = selectedDate.toTimeString().slice(0, 5);
              setForm({ ...form, breakOut: timeStr });
            }
          }}
        />
      )}

      {/* Monthly Salary */}
      <TextInput
        style={styles.input}
        placeholder="Monthly Salary"
        value={form.monthlySalary}
        onChangeText={(text) => setForm({ ...form, monthlySalary: text })}
        keyboardType="numeric"
      />

      {/* Job Description */}
      <TextInput
        style={styles.input}
        placeholder="Job Description"
        value={form.jobDescription}
        onChangeText={(text) => setForm({ ...form, jobDescription: text })}
      />

      {/* Employment Type */}
      <Picker
        selectedValue={form.employmentType}
        style={styles.picker}
        onValueChange={(value) => setForm({ ...form, employmentType: value })}
      >
        <Picker.Item label="Select Employment Type" value="" />
        {["Full-time", "Part-time", "Contract", "Apprentice"].map(
          (type, idx) => (
            <Picker.Item key={idx} label={type} value={type} />
          )
        )}
      </Picker>

      {/* Category */}
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

      {/* IFSC */}
      <TextInput
        style={styles.input}
        placeholder="IFSC"
        value={form.ifsc}
        onChangeText={(text) => setForm({ ...form, ifsc: text })}
      />

      {/* Bank Name */}
      <TextInput
        style={styles.input}
        placeholder="Bank Name"
        value={form.bankName}
        onChangeText={(text) => setForm({ ...form, bankName: text })}
      />

      {/* Branch Name */}
      <TextInput
        style={styles.input}
        placeholder="Branch Name"
        value={form.branchName}
        onChangeText={(text) => setForm({ ...form, branchName: text })}
      />

      {/* Account Number */}
      <TextInput
        style={styles.input}
        placeholder="Account Number"
        value={form.accountNumber}
        onChangeText={(text) => setForm({ ...form, accountNumber: text })}
        keyboardType="numeric"
      />

      {/* Temporary Address */}
      <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
        Temporary Address
      </Text>
      {form.temporaryAddresses.map((addr, idx) => (
        <View key={idx}>
          <TextInput
            style={styles.input}
            placeholder="Street"
            value={addr.street}
            onChangeText={(text) => {
              const updated = [...form.temporaryAddresses];
              updated[idx].street = text;
              setForm({ ...form, temporaryAddresses: updated });
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={addr.city}
            onChangeText={(text) => {
              const updated = [...form.temporaryAddresses];
              updated[idx].city = text;
              setForm({ ...form, temporaryAddresses: updated });
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="State"
            value={addr.state}
            onChangeText={(text) => {
              const updated = [...form.temporaryAddresses];
              updated[idx].state = text;
              setForm({ ...form, temporaryAddresses: updated });
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Pincode"
            keyboardType="numeric"
            value={addr.pincode}
            onChangeText={(text) => {
              const updated = [...form.temporaryAddresses];
              updated[idx].pincode = text;
              setForm({ ...form, temporaryAddresses: updated });
            }}
          />
        </View>
      ))}

      {/* Permanent Address */}
      <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
        Permanent Address
      </Text>
      {form.permanentAddresses.map((addr, idx) => (
        <View key={idx}>
          <TextInput
            style={styles.input}
            placeholder="Street"
            value={addr.street}
            onChangeText={(text) => {
              const updated = [...form.permanentAddresses];
              updated[idx].street = text;
              setForm({ ...form, permanentAddresses: updated });
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            value={addr.city}
            onChangeText={(text) => {
              const updated = [...form.permanentAddresses];
              updated[idx].city = text;
              setForm({ ...form, permanentAddresses: updated });
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="State"
            value={addr.state}
            onChangeText={(text) => {
              const updated = [...form.permanentAddresses];
              updated[idx].state = text;
              setForm({ ...form, permanentAddresses: updated });
            }}
          />
          <TextInput
            style={styles.input}
            placeholder="Pincode"
            keyboardType="numeric"
            value={addr.pincode}
            onChangeText={(text) => {
              const updated = [...form.permanentAddresses];
              updated[idx].pincode = text;
              setForm({ ...form, permanentAddresses: updated });
            }}
          />
        </View>
      ))}

      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleUpdateEmployee}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.updateButtonText}>Update Employee Details</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
    marginTop: 30
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 50,
  },
  imageContainer: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
  },
  picker: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 50,
    marginBottom: 15,
  },
  datePicker: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
  },
  updateButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
