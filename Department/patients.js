// screens/ManageCustomerScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com/patient";

const ManageCustomerScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  // ✅ Fetch Patients
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/all`);
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search filter
  const filteredData = patients.filter(
    (item) =>
      item.first_name.toLowerCase().includes(search.toLowerCase()) ||
      item.last_name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone_number.includes(search)
  );

  // ✅ Open Edit Modal
  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      gender: patient.gender,
      phone_number: patient.phone_number,
      email: patient.email,
      password: "",
      confirm_password: "",
    });
    setEditModalVisible(true);
  };

  // ✅ Update API
  const updatePatient = async () => {
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.gender ||
      !formData.phone_number ||
      !formData.email
    ) {
      Alert.alert("Validation", "All fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/update/${selectedPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", data.message);
        setEditModalVisible(false);
        fetchPatients();
      } else {
        Alert.alert("Error", data.message || "Failed to update");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ✅ Delete API
  const deletePatient = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE}/delete/${id}`, {
              method: "DELETE",
            });
            const data = await response.json();
            if (response.ok) {
              Alert.alert("Deleted", data.message);
              fetchPatients();
            } else {
              Alert.alert("Error", data.message || "Delete failed");
            }
          } catch (error) {
            Alert.alert("Error", "Something went wrong");
          }
        },
      },
    ]);
  };

  // ✅ Render Each Row
  const renderRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.colSNo]}>{index + 1}</Text>
      <Text style={[styles.cell, styles.colName]}>{item.first_name}</Text>
      <Text style={[styles.cell, styles.colName]}>{item.last_name}</Text>
      <Text style={[styles.cell, styles.colGender]}>{item.gender}</Text>
      <Text style={[styles.cell, styles.colPhone]}>{item.phone_number}</Text>
      <Text style={[styles.cell, styles.colEmail]}>{item.email}</Text>
      <View style={[styles.cell, styles.colAction]}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={20} color="green" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginLeft: 16 }}
          onPress={() => deletePatient(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Patients</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBox}
          placeholder="Search by name or phone..."
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch("")}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Table */}
      {loading ? (
        <ActivityIndicator size="large" color="black" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView horizontal>
          <View>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.colSNo, styles.headerText]}>S.No</Text>
              <Text style={[styles.cell, styles.colName, styles.headerText]}>First Name</Text>
              <Text style={[styles.cell, styles.colName, styles.headerText]}>Last Name</Text>
              <Text style={[styles.cell, styles.colGender, styles.headerText]}>Gender</Text>
              <Text style={[styles.cell, styles.colPhone, styles.headerText]}>Phone</Text>
              <Text style={[styles.cell, styles.colEmail, styles.headerText]}>Email</Text>
              <Text style={[styles.cell, styles.colAction, styles.headerText]}>Action</Text>
            </View>

            {/* Table Rows */}
            <FlatList
              data={filteredData}
              renderItem={renderRow}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        </ScrollView>
      )}

      {/* ✅ Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Patient</Text>

            {Object.keys(formData).map((key) => (
              <TextInput
                key={key}
                style={styles.input}
                placeholder={key.replace("_", " ").toUpperCase()}
                value={formData[key]}
                secureTextEntry={key.includes("password")}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, [key]: text }))
                }
              />
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "green" }]}
                onPress={updatePatient}
              >
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "red" }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManageCustomerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff",marginTop:30 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "bold", marginLeft: 16 },
  searchContainer: { marginBottom: 10 },
  searchBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearBtn: {
    backgroundColor: "#000",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  clearText: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  // Table
  tableHeader: { backgroundColor: "#f1f1f1" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    alignItems: "center",
  },
  cell: { textAlign: "center", fontSize: 14, paddingHorizontal: 6 },
  colSNo: { width: 50 },
  colName: { width: 140 },
  colGender: { width: 100 },
  colPhone: { width: 140 },
  colEmail: { width: 220 },
  colAction: { width: 120, flexDirection: "row", justifyContent: "center" },
  headerText: { fontWeight: "bold", fontSize: 15 },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
