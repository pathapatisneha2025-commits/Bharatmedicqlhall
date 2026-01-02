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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/salarydeduction";

export default function SalaryDeductionsScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [deductionPerDay, setDeductionPerDay] = useState("");
  const [unauthorizedPenalty, setUnauthorizedPenalty] = useState("");
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
const navigation = useNavigation();

  // ------------------ FETCH ALL ------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/all`);
      const result = await res.json();
      setData(result);
      setFilteredData(result);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ------------------ ADD / UPDATE ------------------
  const handleSubmit = async () => {
    if (!minSalary || !deductionPerDay || !unauthorizedPenalty) {
      Alert.alert("Validation Error", "Min Salary, Deduction, and Penalty are required!");
      return;
    }

    const payload = {
      min_salary: parseInt(minSalary),
      max_salary: maxSalary ? parseInt(maxSalary) : null,
      deduction_per_day: parseInt(deductionPerDay),
      unauthorized_penalty: parseInt(unauthorizedPenalty),
    };

    try {
      setLoading(true);
      const url = editId ? `${BASE_URL}/update/${editId}` : `${BASE_URL}/add`;
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
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMinSalary("");
    setMaxSalary("");
    setDeductionPerDay("");
    setUnauthorizedPenalty("");
    setEditId(null);
  };

  // ------------------ EDIT ------------------
  const handleEdit = (item) => {
    setMinSalary(item.min_salary.toString());
    setMaxSalary(item.max_salary ? item.max_salary.toString() : "");
    setDeductionPerDay(item.deduction_per_day.toString());
    setUnauthorizedPenalty(item.unauthorized_penalty.toString());
    setEditId(item.id);
  };

  // ------------------ DELETE ------------------
  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/delete/${id}`, { method: "DELETE" });
            const result = await response.json();
            if (response.ok) {
              Alert.alert("Success", "Record deleted successfully");
              fetchData();
            } else Alert.alert("Error", result.message || "Failed to delete");
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete record");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // ------------------ SEARCH ------------------
  const handleSearch = () => {
    const filtered = data.filter(
      (item) =>
        item.min_salary.toString().includes(searchText) ||
        (item.max_salary ? item.max_salary.toString().includes(searchText) : false) ||
        item.deduction_per_day.toString().includes(searchText) ||
        item.unauthorized_penalty.toString().includes(searchText)
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

  // ------------------ RENDER ITEM ------------------
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardText}><Text style={styles.bold}>Min:</Text> {item.min_salary}</Text>
        <Text style={styles.cardText}><Text style={styles.bold}>Max:</Text> {item.max_salary || "∞"}</Text>
        <Text style={styles.cardText}><Text style={styles.bold}>Deduction/Day:</Text> {item.deduction_per_day}</Text>
        <Text style={styles.cardText}><Text style={styles.bold}>Penalty:</Text> {item.unauthorized_penalty}</Text>
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
  );

  return (
    <ScrollView style={styles.container}>
<View style={styles.headerContainer}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={24} color="#007BFF" />
  </TouchableOpacity>
  <Text style={styles.header}>Salary Deductions</Text>
</View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#007BFF" style={{ marginLeft: 8 }} />
        <TextInput
          placeholder="Search by value"
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
        <TextInput
          placeholder="Min Salary"
          keyboardType="numeric"
          value={minSalary}
          onChangeText={setMinSalary}
          style={styles.input}
        />
        <TextInput
          placeholder="Max Salary (leave empty for no max)"
          keyboardType="numeric"
          value={maxSalary}
          onChangeText={setMaxSalary}
          style={styles.input}
        />
        <TextInput
          placeholder="Deduction per day"
          keyboardType="numeric"
          value={deductionPerDay}
          onChangeText={setDeductionPerDay}
          style={styles.input}
        />
        <TextInput
          placeholder="Unauthorized Penalty"
          keyboardType="numeric"
          value={unauthorizedPenalty}
          onChangeText={setUnauthorizedPenalty}
          style={styles.input}
        />

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
          renderItem={renderItem}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 15,
},
backButton: {
  marginRight: 10,
  padding: 4,
},
header: {
  fontSize: 24,
  fontWeight: "bold",
  color: "#007BFF",
  textAlign: "left", // aligns text next to arrow
},

  container: { flex: 1, padding: 16, backgroundColor: "#F0F4F8" },
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
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 15 },
  button: { backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  subHeader: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, elevation: 2 },
  cardText: { fontSize: 15, color: "#333", marginBottom: 4 },
  bold: { fontWeight: "bold" },
  iconContainer: { flexDirection: "row", alignItems: "center" },
});
