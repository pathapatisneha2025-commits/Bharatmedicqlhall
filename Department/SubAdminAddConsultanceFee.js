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

export default function SubAdminConsultantFeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [feesData, setFeesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [fees, setFees] = useState("");
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const navigation = useNavigation();

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/doctorconsultancefee/all`);
      const result = await response.json();
      setFeesData(result);
      setFilteredData(result);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch data");
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
    const selectedEmp = employees.find((emp) => emp.full_name === name || emp.name === name);
    setEmployeeEmail(selectedEmp ? selectedEmp.email : "");
  };

  const handleSubmit = async () => {
    if (!selectedEmployeeName || !employeeEmail || !fees) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    const payload = {
      employee_name: selectedEmployeeName,
      email: employeeEmail,
      fees: parseInt(fees),
    };

    try {
      setLoading(true);
      const url = editId
        ? `${BASE_URL}/doctorconsultancefee/update/${editId}`
        : `${BASE_URL}/doctorconsultancefee/add`;
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
        fetchData();
      } else Alert.alert("Error", result.message || "Something went wrong");
    } catch (error) {
      Alert.alert("Error", "Failed to save data");
    } finally {
      setLoading(false);
    }
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
    setFees("");
    setEditId(null);
  };

  const handleEdit = (item) => {
    setSelectedEmployeeName(item.employee_name);
    setEmployeeEmail(item.employee_email);
    setFees(item.fees.toString());
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
            const response = await fetch(`${BASE_URL}/doctorconsultancefee/delete/${id}`, {
              method: "DELETE",
            });
            const result = await response.json();
            if (response.ok) {
              Alert.alert("Success", "Record deleted successfully");
              fetchData();
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

  const handleSearch = () => {
    const filtered = feesData.filter(
      (item) =>
        item.employee_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.employee_email.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredData(filtered);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.header}>Doctor Consultant Fees</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#007BFF" style={{ marginLeft: 8 }} />
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
            placeholder="Fees"
            keyboardType="numeric"
            value={fees}
            onChangeText={setFees}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{editId ? "Update" : "Add"}</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <Text style={styles.subHeader}>All Records</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 10 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardText}><Text style={styles.bold}>Name:</Text> {item.employee_name}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Email:</Text> {item.employee_email}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Fees:</Text> ₹{item.fees}</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: "#F0F4F8" },
  headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  header: { fontSize: 24, fontWeight: "bold", color: "#007BFF", textAlign: "center", flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 15,
    elevation: 2,
  },
  searchInput: { flex: 1, padding: 8, fontSize: 15 },
  searchButton: { backgroundColor: "#007BFF", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, marginLeft: 5 },
  searchButtonText: { color: "#fff", fontWeight: "bold" },
  form: { backgroundColor: "#fff", padding: 16, borderRadius: 12, elevation: 3, marginBottom: 15 },
  label: { fontWeight: "bold", marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, marginBottom: 10, backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 15, paddingVertical: 8 },
  button: { backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  subHeader: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardText: { fontSize: 15, color: "#333", marginBottom: 4 },
  bold: { fontWeight: "bold" },
  iconContainer: { flexDirection: "row", alignItems: "center" },
});
