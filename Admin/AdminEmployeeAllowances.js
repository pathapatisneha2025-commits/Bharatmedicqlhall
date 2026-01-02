import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminEmpAllowanceScreen() {
  const navigation = useNavigation();

  const [employees, setEmployees] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [allowanceAmount, setAllowanceAmount] = useState("");
  const [editId, setEditId] = useState(null);

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employee/all`);
      const result = await response.json();
      const employeeArray = Array.isArray(result) ? result : result.employees ? result.employees : [];
      setEmployees(employeeArray);

      if (employeeArray.length > 0) {
        const firstEmp = employeeArray[0];
        setSelectedEmployeeName(firstEmp.full_name || firstEmp.name || "");
        setEmployeeEmail(firstEmp.email || "");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch employees");
    }
  };

  // Fetch all allowances
  const fetchAllowances = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/employeeallowances/all`);
      const result = await response.json();
      setAllowances(result);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch allowances");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAllowances();
  }, []);

  // Auto-fill email when employee name changes
  const handleEmployeeChange = (name) => {
    setSelectedEmployeeName(name);
    const emp = employees.find((e) => e.full_name === name || e.name === name);
    setEmployeeEmail(emp ? emp.email : "");
  };

  const resetForm = () => {
    if (employees.length > 0) {
      const firstEmp = employees[0];
      setSelectedEmployeeName(firstEmp.full_name || firstEmp.name || "");
      setEmployeeEmail(firstEmp.email || "");
    } else {
      setSelectedEmployeeName("");
      setEmployeeEmail("");
    }
    setAllowanceAmount("");
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!selectedEmployeeName || !employeeEmail || !allowanceAmount) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    const payload = {
      emp_name: selectedEmployeeName,
      emp_email: employeeEmail,
      allowance_amount: parseInt(allowanceAmount),
    };

    try {
      setLoading(true);
      const url = editId ? `${BASE_URL}/employeeallowances/update/${editId}` : `${BASE_URL}/employeeallowances/add`;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", editId ? "Updated successfully" : "Added successfully");
        resetForm();
        fetchAllowances();
      } else {
        Alert.alert("Error", result.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedEmployeeName(item.emp_name);
    setEmployeeEmail(item.emp_email);
    setAllowanceAmount(item.allowance_amount.toString());
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/employeeallowances/delete/${id}`, { method: "DELETE" });
            const result = await response.json();
            if (response.ok) {
              Alert.alert("Success", "Record deleted successfully");
              fetchAllowances();
            } else Alert.alert("Error", result.message || "Failed to delete");
          } catch (error) {
            Alert.alert("Error", "Failed to delete data");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading employee allowance...</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.header}>Employee Allowances</Text>
        <View style={{ width: 28 }} /> {/* Spacer */}
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Select Employee</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedEmployeeName} onValueChange={handleEmployeeChange}>
            {employees.length > 0
              ? employees.map((emp) => (
                  <Picker.Item
                    key={emp.id}
                    label={emp.full_name || emp.name}
                    value={emp.full_name || emp.name}
                  />
                ))
              : <Picker.Item label="No employees found" value="" />}
          </Picker>
        </View>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="email" size={20} color="#007BFF" style={{ marginRight: 8 }} />
          <TextInput style={styles.input} placeholder="Email" value={employeeEmail} editable={false} />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="cash-outline" size={20} color="#007BFF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Allowance Amount"
            keyboardType="numeric"
            value={allowanceAmount}
            onChangeText={setAllowanceAmount}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{editId ? "Update" : "Add"}</Text>}
        </TouchableOpacity>
      </View>

      {/* Records List */}
      <Text style={styles.subHeader}>All Records</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 10 }} />
      ) : (
        <FlatList
          data={allowances}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardText}><Text style={styles.bold}>Name:</Text> {item.emp_name}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Email:</Text> {item.emp_email}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Amount:</Text> ₹{item.allowance_amount}</Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={24} color="orange" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 10 }}>
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F0F4F8" ,marginTop: 30},
  headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  header: { flex: 1, fontSize: 24, fontWeight: "bold", color: "#007BFF", textAlign: "center" },
  form: { backgroundColor: "#fff", padding: 16, borderRadius: 12, elevation: 3, marginBottom: 15 },
  label: { fontWeight: "bold", marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, marginBottom: 10, backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 15, paddingVertical: 8 },
  button: { backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  subHeader: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, elevation: 2 },
  cardText: { fontSize: 15, color: "#333", marginBottom: 4 },
  bold: { fontWeight: "bold" },
  iconContainer: { flexDirection: "row", alignItems: "center" },
});
