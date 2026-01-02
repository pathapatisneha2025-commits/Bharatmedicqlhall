// LeavePolicyScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitalmanagement-gfgx.onrender.com";

const LeavePolicyScreen = () => {
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [numberOfLeaves, setNumberOfLeaves] = useState("");
  const [yearlyTotalLeaves, setYearlyTotalLeaves] = useState("");
  const [policies, setPolicies] = useState([]);
  const [employees, setEmployees] = useState([]); // Store employees
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  // Fetch all leave policies
  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/leavepolicies/all`);
      const data = await response.json();
      if (response.ok) {
        setPolicies(data.data || []);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch leave policies");
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      Alert.alert("Error", "Something went wrong while fetching policies");
    }
    setLoading(false);
  };

  // Fetch all employees (to populate dropdowns)
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employee/all`);
      const data = await response.json();
      if (response.ok && data.employees) {
        setEmployees(data.employees);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      Alert.alert("Error", "Something went wrong while fetching employees");
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchEmployees();
  }, []);

  const handleSaveOrUpdate = async () => {
    if (!employeeEmail || !employeeName || !numberOfLeaves || !yearlyTotalLeaves) {
      Alert.alert("Error", "Please select employee and fill all fields");
      return;
    }

    const requestBody = {
      number_of_leaves: parseInt(numberOfLeaves),
      yearly_totalleaves: parseInt(yearlyTotalLeaves),
      employee_name: employeeName.trim(),
      employee_email: employeeEmail.trim(),
    };

    setLoading(true);

    try {
      const url = editingId
        ? `${BASE_URL}/leavepolicies/update/${editingId}`
        : `${BASE_URL}/leavepolicies/add`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", data.message || "Operation successful");
        fetchPolicies();
        setEditingId(null);
        resetForm();
      } else {
        Alert.alert("Error", data.message || "Failed to save policy");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error saving policy:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const resetForm = () => {
    setEmployeeEmail("");
    setEmployeeName("");
    setNumberOfLeaves("");
    setYearlyTotalLeaves("");
  };

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/leavepolicies/${id}`);
      const data = await response.json();
      if (response.ok) {
        const policy = data.data;
        setEmployeeEmail(policy.employee_email || "");
        setEmployeeName(policy.employee_name || "");
        setNumberOfLeaves(policy.number_of_leaves?.toString() || "");
        setYearlyTotalLeaves(policy.yearly_totalleaves?.toString() || "");
        setEditingId(policy.id);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch policy details");
      }
    } catch (error) {
      console.error("Error fetching policy by ID:", error);
      Alert.alert("Error", "Something went wrong while fetching policy");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/leavepolicies/delete/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Deleted", data.message || "Policy deleted successfully");
        setPolicies((prev) => prev.filter((item) => item.id !== id));
      } else {
        Alert.alert("Error", data.message || "Failed to delete policy");
      }
    } catch (error) {
      console.error("Error deleting policy:", error);
      Alert.alert("Error", "Something went wrong while deleting policy");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.policyRow}>
      <Text style={styles.cell}>
        {item.employee_name} ({item.employee_email})
      </Text>
      <Text style={styles.cell}>{item.number_of_leaves} / month</Text>
      <Text style={styles.cell}>{item.yearly_totalleaves} / year</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(item.id)}>
          <Ionicons name="pencil" size={20} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Policy</Text>
      </View>

      <Text style={styles.heading}>
        {editingId ? "Update Policy" : "Add Policy"}
      </Text>

      {/* Employee Name Picker */}
      <Text style={styles.label}>Select Employee Name</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={employeeName}
          onValueChange={(value) => {
            setEmployeeName(value);
            const selectedEmp = employees.find((emp) => emp.full_name === value);
            if (selectedEmp) {
              setEmployeeEmail(selectedEmp.email);
            }
          }}
        >
          <Picker.Item label="-- Select Name --" value="" />
          {employees.map((emp) => (
            <Picker.Item key={emp.id} label={emp.full_name} value={emp.full_name} />
          ))}
        </Picker>
      </View>

      {/* Employee Email Picker */}
      <Text style={styles.label}>Select Employee Email</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={employeeEmail}
          onValueChange={(value) => {
            setEmployeeEmail(value);
            const selectedEmp = employees.find((emp) => emp.email === value);
            if (selectedEmp) {
              setEmployeeName(selectedEmp.full_name);
            }
          }}
        >
          <Picker.Item label="-- Select Email --" value="" />
          {employees.map((emp) => (
            <Picker.Item key={emp.id} label={emp.email} value={emp.email} />
          ))}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter leaves per month"
        keyboardType="numeric"
        value={numberOfLeaves}
        onChangeText={setNumberOfLeaves}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter yearly total leaves"
        keyboardType="numeric"
        value={yearlyTotalLeaves}
        onChangeText={setYearlyTotalLeaves}
      />

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSaveOrUpdate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>
            {editingId ? "Update Policy" : "Save Policy"}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.heading}>Employee Leave Policies</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={policies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" ,marginTop: 30},
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 45,
    marginBottom: 40,
  },
  backBtn: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#000" },
  heading: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  policyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cell: { flex: 1, fontSize: 14 },
  actions: { flexDirection: "row" },
  iconBtn: { marginHorizontal: 5 },
});

export default LeavePolicyScreen;
