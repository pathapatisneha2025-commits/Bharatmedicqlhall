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
    Platform,

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
const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
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
      showAlert("Error", "Failed to load employees");
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
      showAlert("Error", "Failed to load deductions");
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
        showAlert("Success", "Deduction added");
        fetchDeductions();
      } else {
        showAlert("Error", json.message ?? "Something went wrong");
      }
    } catch (err) {
      showAlert("Error", "Failed to submit");
    }
  };

  // ---------------------------------------------
  // Delete Deduction
  // ---------------------------------------------
  const deleteItem = (id) => {
   showAlert("Confirm", "Delete this item?", [
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
           showAlert("Error", "Failed to delete");
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
       showAlert("Updated", "Data updated successfully");
        setModalVisible(false);
        fetchDeductions();
      } else {
        showAlert("Error", json.message);
      }
    } catch (err) {
      showAlert("Error", "Failed to update");
    }
  };

 return (
    <View style={styles.mainContainer}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Employee Salary Dashboard</Text>
      </View>

      <View style={styles.splitLayout}>
        {/* LEFT COLUMN: FORM */}
        <ScrollView style={styles.leftColumn} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Add Deduction</Text>
          
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

          <TextInput style={[styles.input, styles.disabledInput]} placeholder="Employee Email" value={formData.email} editable={false} />
          <TextInput style={[styles.input, styles.disabledInput]} placeholder="Salary" value={formData.salary} editable={false} />
          <TextInput style={[styles.input, styles.disabledInput]} placeholder="Employee Type" value={formData.employee_type} editable={false} />

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
            <Text style={styles.submitText}>Submit Deduction</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* RIGHT COLUMN: LIST */}
        <View style={styles.rightColumn}>
          <Text style={styles.sectionTitle}>Deduction History</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {deductions.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardEmpName}>{item.employee_name}</Text>
                    <Text style={styles.cardDate}>{new Date().toLocaleDateString()}</Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardLabel}>Late Penalty: <Text style={styles.cardValue}>{item.late_penalty}</Text></Text>
                    <Text style={styles.cardLabel}>Break Penalty: <Text style={styles.cardValue}>{item.break_penalty}</Text></Text>
                    {/* <Text style={styles.cardLabel}>Salary Deduction: <Text style={[styles.cardValue, {color: '#dc3545'}]}>{item.salary_deduction}</Text></Text> */}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Text style={styles.edit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.actionBtn}>
                    <Text style={styles.delete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Edit Modal (Logic Unchanged) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBox}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Deduction</Text>
            <ScrollView>
                {editData &&
                Object.keys(editData).map((key) => {
                    if (["id", "created_at", "updated_at"].includes(key)) return null;
                    return (
                    <TextInput
                        key={key}
                        style={styles.input}
                        value={String(editData[key])}
                        onChangeText={(v) => setEditData({ ...editData, [key]: v })}
                        placeholder={key}
                    />
                    );
                })}
            </ScrollView>
            <TouchableOpacity style={styles.submitBtn} onPress={updateData}>
              <Text style={styles.submitText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: "#6c757d", marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.submitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: Platform.OS === 'web' ? 0 : 30
  },
  backArrow: { fontSize: 24, marginRight: 15, color: "#1e90ff" },
  title: { fontSize: 20, fontWeight: "bold", color: "#2d3436" },
  
  splitLayout: {
    flex: 1,
    flexDirection: Platform.OS === "web" ? "row" : "column",
    padding: 20,
    gap: 20,
  },
  
  // Left side - Form
  leftColumn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    ...Platform.select({
        web: { maxHeight: 'calc(100vh - 120px)' }
    })
  },

  // Right side - List
  rightColumn: {
    flex: 1.5,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1e90ff",
    borderBottomWidth: 2,
    borderBottomColor: "#1e90ff",
    paddingBottom: 5,
    alignSelf: 'flex-start'
  },

  label: { fontWeight: "600", marginBottom: 8, color: "#495057" },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fcfcfc",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    fontSize: 14,
  },
  disabledInput: {
    backgroundColor: "#f1f3f5",
    color: "#6c757d",
  },
  submitBtn: {
    backgroundColor: "#1e90ff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold" },

  // List Cards
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: "#1e90ff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardEmpName: { fontWeight: 'bold', fontSize: 16, color: '#2d3436' },
  cardDate: { fontSize: 12, color: '#636e72' },
  cardBody: { marginBottom: 10 },
  cardLabel: { fontSize: 14, color: '#636e72', marginBottom: 2 },
  cardValue: { fontWeight: '600', color: '#2d3436' },
  
  cardActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingTop: 10 },
  actionBtn: { marginRight: 20 },
  edit: { color: "#28a745", fontWeight: "600" },
  delete: { color: "#dc3545", fontWeight: "600" },

  modalBox: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", padding: 40 },
  modalContent: { backgroundColor: "#fff", padding: 30, borderRadius: 15, width: Platform.OS === 'web' ? '40%' : '100%', alignSelf: 'center' },
});