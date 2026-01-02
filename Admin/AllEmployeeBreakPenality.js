// screens/BreakPenaltyScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function BreakPenaltyScreen() {
  const navigation = useNavigation();
  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [breakPenalty, setBreakPenalty] = useState("");
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/employee/all`);
      const result = await res.json();
      const empList = Array.isArray(result)
        ? result
        : result.employees
        ? result.employees
        : [];
      const cleaned = empList.map(emp => ({
        id: emp.id,
        full_name:
          emp.full_name ||
          `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
          emp.name ||
          "Unnamed Employee",
        email: emp.email?.trim() || "",
      }));
      setEmployees(cleaned);
      if (cleaned.length > 0) {
        setSelectedEmployeeName(cleaned[0].full_name);
        setEmployeeEmail(cleaned[0].email);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch employees");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/breakpenality/all`);
      const result = await res.json();
      setData(result);
      setFilteredData(result);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch break penalty data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchData();
  }, []);

  const handleEmployeeChange = (name) => {
    setSelectedEmployeeName(name);
    const emp = employees.find(e => e.full_name === name || e.name === name);
    setEmployeeEmail(emp ? emp.email : "");
  };

  const handleSubmit = async () => {
    if (!selectedEmployeeName || !employeeEmail || !breakPenalty) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    const payload = editId
      ? {
          employee_id: data.find(d => d.id === editId).employee_id,
          employee_name: selectedEmployeeName,
          break_penalty: parseFloat(breakPenalty),
        }
      : {
          employee_name: selectedEmployeeName,
          employee_email: employeeEmail,
          break_penalty: parseFloat(breakPenalty),
        };

    try {
      setLoading(true);
      const url = editId
        ? `${BASE_URL}/breakpenality/update/${editId}`
        : `${BASE_URL}/breakpenality/add`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        Alert.alert(
          "Success",
          editId ? "Break penalty updated successfully" : "Break penalty added successfully"
        );
        resetForm();
        fetchData();
      } else {
        Alert.alert("Error", result.message || "Something went wrong");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (employees.length > 0) {
      setSelectedEmployeeName(employees[0].full_name);
      setEmployeeEmail(employees[0].email);
    } else {
      setSelectedEmployeeName("");
      setEmployeeEmail("");
    }
    setBreakPenalty("");
    setEditId(null);
  };

  const handleEdit = (item) => {
    setSelectedEmployeeName(item.employee_name);
    setEmployeeEmail(item.employee_email);
    setBreakPenalty(item.break_penalty.toString());
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
            const res = await fetch(`${BASE_URL}/breakpenality/delete/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (res.ok) {
              Alert.alert("Success", "Record deleted successfully");
              fetchData();
            } else {
              Alert.alert("Error", result.message || "Failed to delete");
            }
          } catch (err) {
            Alert.alert("Error", "Failed to delete data");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSearch = () => {
    const filtered = data.filter(
      item =>
        item.employee_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.employee_email.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredData(filtered);
  };
   if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading employee...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("AdminDashboard")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Break Penalty Management</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#555" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by name or email"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Select Employee</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedEmployeeName} onValueChange={handleEmployeeChange}>
            {employees.length > 0
              ? employees.map(emp => (
                  <Picker.Item key={emp.id} label={emp.full_name} value={emp.full_name} />
                ))
              : <Picker.Item label="No employees found" value="" />}
          </Picker>
        </View>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="email" size={20} color="#007BFF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            value={employeeEmail}
            editable={false}
            placeholder="Email"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="cash-outline" size={20} color="#007BFF" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Break Penalty"
            keyboardType="numeric"
            value={breakPenalty}
            onChangeText={setBreakPenalty}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{editId ? "Update Penalty" : "Add Penalty"}</Text>
        </TouchableOpacity>
      </View>

      {/* Records List */}
      <Text style={styles.subHeader}>All Records</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 10 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardText}><Text style={styles.bold}>Name:</Text> {item.employee_name}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Email:</Text> {item.employee_email}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Penalty:</Text> ₹{item.break_penalty}</Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={22} color="#FFA500" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 12 }}>
                  <Ionicons name="trash-outline" size={22} color="red" />
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
  container: { flex: 1, padding: 16, backgroundColor: "#F4F7FC",marginTop: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 3,
  },
  backButton: { marginRight: 10 },
  headerText: { color: "#fff", fontSize: 16, fontWeight: "bold", flex: 1, textAlign: "center" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    elevation: 2,
  },
  searchInput: { flex: 1, height: 40, fontSize: 15 },
  searchButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 6,
  },
  searchButtonText: { color: "#fff", fontWeight: "bold" },
  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  label: { fontWeight: "bold", marginBottom: 8, color: "#333" },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 12, overflow: "hidden" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  input: { flex: 1, height: 45, fontSize: 15 },
  button: { backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  subHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#007BFF" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },
  cardText: { fontSize: 15, color: "#333", marginBottom: 4 },
  bold: { fontWeight: "bold" },
  iconContainer: { flexDirection: "row", alignItems: "center" },
});
