// screens/AdminManageCustomerScreen.js
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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com/patient";

const AdminManageCustomerScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Password toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit Modal
  const [editModalVisible, setEditModalVisible] = useState(false);

  // View Modal
  const [viewModalVisible, setViewModalVisible] = useState(false);

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

  const filteredPatients = patients.filter(
    (item) =>
      item.first_name.toLowerCase().includes(search.toLowerCase()) ||
      item.last_name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone_number.includes(search)
  );

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

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setViewModalVisible(true);
  };

  const updatePatient = async () => {
    const { first_name, last_name, gender, phone_number, email } = formData;
    if (!first_name || !last_name || !gender || !phone_number || !email) {
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
        Alert.alert("Error", data.message || "Failed to update patient");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while updating");
    }
  };

  const deletePatient = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this patient?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (response.ok) {
              Alert.alert("Deleted", data.message);
              fetchPatients();
            } else {
              Alert.alert("Error", data.message || "Failed to delete patient");
            }
          } catch (error) {
            Alert.alert("Error", "Something went wrong");
          }
        },
      },
    ]);
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading patient...</Text>
      </View>
    );
  }
  // Render Table Row
  const renderRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.colSNo]}>{index + 1}</Text>
      <Text style={[styles.cell, styles.colName]}>{item.first_name}</Text>
      <Text style={[styles.cell, styles.colName]}>{item.last_name}</Text>
      <Text style={[styles.cell, styles.colGender]}>{item.gender}</Text>
      <Text style={[styles.cell, styles.colPhone]}>{item.phone_number}</Text>
      <Text style={[styles.cell, styles.colEmail]}>{item.email}</Text>

      <View style={[styles.cell, styles.colAction]}>
        {/* 👁 VIEW BUTTON */}
        <TouchableOpacity onPress={() => handleView(item)}>
          <Ionicons name="eye-outline" size={22} color="#0ea5e9" />
        </TouchableOpacity>

        {/* ✏ EDIT */}
        <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={22} color="#2563eb" />
        </TouchableOpacity>

        {/* 🗑 DELETE */}
        <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => deletePatient(item.id)}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Patients</Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* TABLE */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView horizontal>
          <View>
            {/* Header Row */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.colSNo, styles.headerText]}>S.No</Text>
              <Text style={[styles.cell, styles.colName, styles.headerText]}>First Name</Text>
              <Text style={[styles.cell, styles.colName, styles.headerText]}>Last Name</Text>
              <Text style={[styles.cell, styles.colGender, styles.headerText]}>Gender</Text>
              <Text style={[styles.cell, styles.colPhone, styles.headerText]}>Phone</Text>
              <Text style={[styles.cell, styles.colEmail, styles.headerText]}>Email</Text>
              <Text style={[styles.cell, styles.colAction, styles.headerText]}>Actions</Text>
            </View>

            <FlatList
              data={filteredPatients}
              renderItem={renderRow}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        </ScrollView>
      )}

      {/* 👁 VIEW MODAL */}
      <Modal visible={viewModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {selectedPatient && (
              <ScrollView>
                {[
                  { label: "First Name", value: selectedPatient.first_name },
                  { label: "Last Name", value: selectedPatient.last_name },
                  { label: "Gender", value: selectedPatient.gender },
                  { label: "Phone Number", value: selectedPatient.phone_number },
                  { label: "Email", value: selectedPatient.email },
                  { label: "Created At", value: selectedPatient.createdAt },
                  { label: "Updated At", value: selectedPatient.updatedAt },
                ].map((item, index) => (
                  <View key={index} style={styles.viewItem}>
                    <Text style={styles.viewLabel}>{item.label}</Text>
                    <Text style={styles.viewValue}>{item.value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ✏ EDIT MODAL (your existing one unchanged) */}
      <Modal visible={editModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Patient Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* INPUT FIELDS */}
              {[ 
                { icon: "person-outline", key: "first_name", placeholder: "First Name" },
                { icon: "person-circle-outline", key: "last_name", placeholder: "Last Name" },
                { icon: "male-female-outline", key: "gender", placeholder: "Gender" },
                { icon: "call-outline", key: "phone_number", placeholder: "Phone Number" },
                { icon: "mail-outline", key: "email", placeholder: "Email" },
              ].map((field) => (
                <View style={styles.inputWrapper} key={field.key}>
                  <Ionicons name={field.icon} size={20} color="#2563eb" />
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    value={formData[field.key]}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, [field.key]: text }))
                    }
                  />
                </View>
              ))}

              {/* PASSWORD */}
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#2563eb" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} />
                </TouchableOpacity>
              </View>

              {/* CONFIRM PASSWORD */}
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#2563eb" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirm_password}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, confirm_password: text }))
                  }
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                  />
                </TouchableOpacity>
              </View>

              {/* SAVE / CANCEL BUTTONS */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.updateBtn]} onPress={updatePatient}>
                  <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>Update</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Ionicons name="close-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminManageCustomerScreen;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc", marginTop: 30 },

  headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: { padding: 6, borderRadius: 8, backgroundColor: "#e0e7ff" },
  title: { fontSize: 22, fontWeight: "bold", marginLeft: 12, color: "#2563eb" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#000" },

  tableHeader: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cell: { textAlign: "center", fontSize: 15, paddingVertical: 14 },

  colSNo: { width: 60 },
  colName: { width: 140 },
  colGender: { width: 100 },
  colPhone: { width: 140 },
  colEmail: { width: 220 },
  colAction: { width: 150, flexDirection: "row", justifyContent: "center" },

  headerText: { fontWeight: "bold", fontSize: 15, color: "#fff" },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  modalTitle: { fontSize: 22, fontWeight: "700", color: "#2563eb" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  input: { flex: 1, fontSize: 16 },

  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },

  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  updateBtn: { backgroundColor: "#2563eb" },
  cancelBtn: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 6 },

  viewItem: { marginBottom: 12, backgroundColor: "#f1f5f9", padding: 10, borderRadius: 8 },
  viewLabel: { fontWeight: "bold", color: "#2563eb", fontSize: 15 },
  viewValue: { fontSize: 16, color: "#000" },
});
