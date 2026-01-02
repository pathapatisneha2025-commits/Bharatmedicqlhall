import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native"; // ✅ Add this import

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function EmployeedeductionsScreen() {
  const [employees, setEmployees] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const navigation = useNavigation(); // ✅ Initialize navigation
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    employee_name: "",
    email: "",
    salary: "",
    late_penalty: "",
    break_penalty: "",
    salary_deduction: "",
    unauthorized_leave: "",
    working_days: "",
    working_hours: "",
      employee_type: "",     // ADD THIS

  });

  const [editData, setEditData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Generic input change handler
  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ---------------------------------------------
  // Fetch employees
  // ---------------------------------------------
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/employee/all`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.employees ?? [];
      setEmployees(list);

      if (list.length > 0) {
        const emp = list[0];
        setFormData((prev) => ({
          ...prev,
          employee_name: emp.full_name || emp.name,
          email: emp.email,
          salary: String(emp.monthly_salary || emp.salary || ""),
              employee_type: emp.employment_type || "",     // ADD THIS

        }));
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load employees");
    }
  };

  // ---------------------------------------------
  // Fetch all deductions
  // ---------------------------------------------
  const fetchDeductions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/employeededuction/all`);
      const json = await res.json();
      setDeductions(json);
    } catch (err) {
      Alert.alert("Error", "Failed to load deductions");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDeductions();
  }, []);

  // ---------------------------------------------
  // Handle dropdown change
  // ---------------------------------------------
  const handleEmployeeChange = (name) => {
    const emp = employees.find(
      (item) => item.full_name === name || item.name === name
    );

    if (emp) {
      setFormData({
        ...formData,
        employee_name: emp.full_name || emp.name,
        email: emp.email,
        salary: String(emp.monthly_salary || emp.salary),
              employee_type: emp.employment_type || "",    // ADD THIS

      });
    }
  };

  // ---------------------------------------------
  // Submit New Deduction
  // ---------------------------------------------
  const handleSubmit = async () => {
    try {
      let res = await fetch(`${BASE_URL}/employeededuction/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let json = await res.json();
      if (json.success) {
        Alert.alert("Success", "Deduction added");
        fetchDeductions();
      } else {
        Alert.alert("Error", json.message ?? "Something went wrong");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to submit");
    }
  };

  // ---------------------------------------------
  // Delete Deduction
  // ---------------------------------------------
  const deleteItem = (id) => {
    Alert.alert("Confirm", "Delete this item?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await fetch(`${BASE_URL}/employeededuction/delete/${id}`, {
              method: "DELETE",
            });
            fetchDeductions();
          } catch (err) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  // ---------------------------------------------
  // Open edit modal
  // ---------------------------------------------
  const openEdit = (item) => {
    setEditData(item);
    setModalVisible(true);
  };

  // ---------------------------------------------
  // Update deduction
  // ---------------------------------------------
  const updateData = async () => {
    try {
      let res = await fetch(
        `${BASE_URL}/employeededuction/update/${editData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        }
      );

      let json = await res.json();
      if (json.success) {
        Alert.alert("Updated", "Data updated successfully");
        setModalVisible(false);
        fetchDeductions();
      } else {
        Alert.alert("Error", json.message);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update");
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
    <ScrollView contentContainerStyle={styles.container}>
<View style={styles.headerRow}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Text style={styles.backArrow}>←</Text>
  </TouchableOpacity>

  <Text style={styles.title}>Employee Salary Form</Text>
</View>

      {/* Dropdown for Employee Name */}
      <Text style={styles.label}>Select Employee</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.employee_name}
          onValueChange={handleEmployeeChange}
        >
          {employees.length > 0 ? (
            employees.map((emp) => (
              <Picker.Item
                key={emp.id}
                label={emp.full_name || emp.name}
                value={emp.full_name || emp.name}
              />
            ))
          ) : (
            <Picker.Item label="No employees found" value="" />
          )}
        </Picker>
      </View>

      {/* Email (auto-populated) */}
      <TextInput
        style={styles.input}
        placeholder="Employee Email"
        value={formData.email}
        editable={false}
      />

      {/* Salary (auto-populated) */}
      <TextInput
        style={styles.input}
        placeholder="Salary"
        value={formData.salary}
        editable={false}
      />

      {/* Other Fields */}
      <TextInput
        style={styles.input}
        placeholder="Late Penalty"
        value={formData.late_penalty}
        onChangeText={(text) => handleChange("late_penalty", text)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Break Penalty"
        value={formData.break_penalty}
        onChangeText={(text) => handleChange("break_penalty", text)}
        keyboardType="numeric"
      />

    <TextInput
  style={styles.input}
  placeholder="Employee Type"
  value={formData.employee_type}
  editable={false}
/>


  
      <TextInput
        style={styles.input}
        placeholder="Working Days"
        value={formData.working_days}
        onChangeText={(text) => handleChange("working_days", text)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Working Hours"
        value={formData.working_hours}
        onChangeText={(text) => handleChange("working_hours", text)}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      {/* Display Deduction List */}
      <Text style={styles.title}>All Deductions</Text>

      {deductions.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={{ fontWeight: "bold" }}>{item.employee_name}</Text>
          <Text>Late: {item.late_penalty}</Text>
          <Text>Break: {item.break_penalty}</Text>
          <Text>Salary Deduction: {item.salary_deduction}</Text>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => openEdit(item)}>
              <Text style={styles.edit}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteItem(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBox}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Deduction</Text>

            {editData &&
              Object.keys(editData).map((key) => {
                if (["id", "created_at", "updated_at"].includes(key)) return null;

                return (
                  <TextInput
                    key={key}
                    style={styles.input}
                    value={String(editData[key])}
                    onChangeText={(v) =>
                      setEditData({ ...editData, [key]: v })
                    }
                    placeholder={key}
                  />
                );
              })}

            <TouchableOpacity style={styles.submitBtn} onPress={updateData}>
              <Text style={styles.submitText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: "gray" }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.submitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ----------------- Styles -----------------
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f4f6f8", flexGrow: 1 },
  title: { fontSize: 22, fontWeight: "bold", marginVertical: 15 },
  label: { fontWeight: "bold", marginBottom: 8 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#1e90ff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  edit: { color: "green", fontWeight: "bold" },
  delete: { color: "red", fontWeight: "bold" },

  modalBox: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 15,
},

backArrow: {
  fontSize: 26,
  marginRight: 10,
  fontWeight: "bold",
},

});
