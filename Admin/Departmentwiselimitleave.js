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
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/leavelimit";

export default function AdminDepartmentLimitScreen() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [department, setDepartment] = useState("");
  const [maxLeaves, setMaxLeaves] = useState("");
  const [maxBreaks, setMaxBreaks] = useState("");
  const [editDept, setEditDept] = useState(null);
  const [searchText, setSearchText] = useState("");

  /* ================= FETCH ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/all`);
      const result = await res.json();
      setData(result);
      setFilteredData(result);
    } catch {
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async () => {
    if (!department.trim() || maxLeaves === "" || maxBreaks === "") {
      Alert.alert("Validation", "All fields are required!");
      return;
    }

    // ✅ FIXED PAYLOAD
    const payload = {
      department: department.trim(),
      maxLeavesPerDay: Number(maxLeaves),
      maxBreaksPerDay: Number(maxBreaks),
    };

    const url = editDept
      ? `${BASE_URL}/update/${editDept}`
      : `${BASE_URL}/add`;

    const method = editDept ? "PUT" : "POST";

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        Alert.alert("Success", editDept ? "Updated" : "Added");
        resetForm();
        fetchData();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch {
      Alert.alert("Error", "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDepartment("");
    setMaxLeaves("");
    setMaxBreaks("");
    setEditDept(null);
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setDepartment(item.department);
    setMaxLeaves(item.max_leaves_per_day.toString());
    setMaxBreaks(item.max_breaks_per_day.toString()); // ✅ FIXED
    setEditDept(item.department);
  };

  /* ================= DELETE ================= */
  const handleDelete = (dept) => {
    Alert.alert("Delete", `Delete ${dept}?`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(`${BASE_URL}/delete/${dept}`, { method: "DELETE" });
          fetchData();
        },
      },
    ]);
  };

  /* ================= SEARCH ================= */
  const handleSearch = () => {
    const filtered = data.filter((d) =>
      d.department.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredData(filtered);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredData}
      keyExtractor={(item) => item.department}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <Text style={styles.header}>Department Limits</Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#007BFF" />
            <TextInput
              placeholder="Search department"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Go</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="apartment" size={20} color="#007BFF" />
              <TextInput
                style={styles.input}
                placeholder="Department"
                value={department}
                onChangeText={setDepartment}
              />
            </View>

            <Input icon="calendar-outline" value={maxLeaves} setValue={setMaxLeaves} placeholder="Max Leaves / Day" numeric />
            <Input icon="time-outline" value={maxBreaks} setValue={setMaxBreaks} placeholder="Max Breaks / Day" numeric />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{editDept ? "Update" : "Add"}</Text>
            </TouchableOpacity>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bold}>{item.department}</Text>
            <Text>Leaves / Day: {item.max_leaves_per_day}</Text>
            <Text>Breaks / Day: {item.max_breaks_per_day}</Text>
          </View>

          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={() => handleEdit(item)}>
              <Ionicons name="create-outline" size={22} color="orange" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.department)} style={{ marginLeft: 12 }}>
              <Ionicons name="trash-outline" size={22} color="red" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

/* ================= INPUT ================= */
const Input = ({ icon, value, setValue, placeholder, numeric }) => (
  <View style={styles.inputWrapper}>
    <Ionicons name={icon} size={20} color="#007BFF" />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      keyboardType={numeric ? "numeric" : "default"}
      onChangeText={setValue}
    />
  </View>
);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F0F4F8", paddingBottom: 30 },
  header: { fontSize: 24, fontWeight: "bold", color: "#007BFF", textAlign: "center", marginBottom: 15 },
  searchContainer: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 10, padding: 8, marginBottom: 15 },
  searchInput: { flex: 1, marginHorizontal: 8 },
  searchButton: { backgroundColor: "#007BFF", padding: 8, borderRadius: 6 },
  searchButtonText: { color: "#fff", fontWeight: "bold" },
  form: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 15 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, marginBottom: 10 },
  input: { flex: 1, padding: 8 },
  button: { backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10 },
  bold: { fontWeight: "bold", fontSize: 16 },
  iconContainer: { flexDirection: "row", alignItems: "center" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
