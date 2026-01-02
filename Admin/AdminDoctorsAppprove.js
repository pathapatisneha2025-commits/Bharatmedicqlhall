import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const API = "https://hospitaldatabasemanagement.onrender.com/doctor";

export default function DoctorApprovalScreen() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const navigation = useNavigation();

  // ============================
  // FETCH DOCTORS
  // ============================
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/all`);
      setDoctors(res.data);
      setFilteredDoctors(res.data);
    } catch (err) {
      console.log("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ============================
  // SEARCH FILTER
  // ============================
  useEffect(() => {
    if (search.trim() === "") return setFilteredDoctors(doctors);

    const s = search.toLowerCase();
    setFilteredDoctors(
      doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(s) ||
          d.email?.toLowerCase().includes(s)
      )
    );
  }, [search, doctors]);

  // ============================
  // UPDATE STATUS (APPROVE / REJECT)
  // ============================
  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/update-status/${id}`, { status });
      fetchDoctors();
    } catch (err) {
      console.log(err);
    }
  };

  // ============================
  // DELETE DOCTOR
  // ============================
  const deleteDoctor = async (id) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API}/delete/${id}`);
            fetchDoctors();
            setModalVisible(false);
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  // ============================
  // UPDATE DOCTOR DETAILS
  // ============================
  const updateDoctorDetails = async () => {
    try {
      await axios.put(`${API}/update/${selectedDoctor.id}`, selectedDoctor);

      Alert.alert("Success", "Doctor updated successfully");
      fetchDoctors();
      setModalVisible(false);
    } catch (err) {
      Alert.alert("Error", "Failed to update doctor");
    }
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading Doctors...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Doctor Approval Panel</Text>
      </View>

  {/* SEARCH + ADD DOCTOR ROW */}
<View style={styles.searchRow}>
  {/* SEARCH BAR */}
  <View style={styles.searchBar}>
    <Ionicons name="search-outline" size={20} color="#2563eb" />
    <TextInput
      placeholder="Search by name or email..."
      placeholderTextColor="#000"
      style={styles.searchInput}
      value={search}
      onChangeText={setSearch}
    />
    {search.length > 0 && (
      <TouchableOpacity onPress={() => setSearch("")}>
        <Ionicons name="close-circle" size={20} color="#2563eb" />
      </TouchableOpacity>
    )}
  </View>

  {/* ADD DOCTOR BUTTON */}
  <TouchableOpacity
    style={styles.addDoctorBtn}
    onPress={() => navigation.navigate("AdminAddDoctor")}
    activeOpacity={0.85}
  >
    <Ionicons name="add" size={20} color="#fff" />
    <Text style={styles.addDoctorText}>Add Doctor</Text>
  </TouchableOpacity>
</View>



      {loading && <ActivityIndicator size="large" color="#2563eb" />}

      {/* TABLE */}
      <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            
            {/* TABLE HEADER */}
            <View style={styles.tableHeader}>
              
              <Text style={[styles.headerCell, { width: 150 }]}>Name</Text>
              <Text style={[styles.headerCell, { width: 150 }]}>Department</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Status</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>Actions</Text>
            </View>

            {/* TABLE ROWS */}
            {filteredDoctors.map((doc) => (
              <View key={doc.id} style={styles.tableRow}>
                <Text style={[styles.cell, { width: 150 }]}>{doc.name}</Text>
                <Text style={[styles.cell, { width: 150 }]}>{doc.department}</Text>

                <Text
                  style={[
                    styles.cell,
                    { width: 120, color: statusColor(doc.status) },
                  ]}
                >
                  {doc.status}
                </Text>

                <View style={{ width: 200, flexDirection: "row", justifyContent: "space-around" }}>
                  {/* VIEW */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDoctor(doc);
                      setModalVisible(true);
                    }}
                  >
                    <Ionicons name="eye-outline" size={22} color="#0ea5e9" />
                  </TouchableOpacity>

                  {/* APPROVE */}
                  <TouchableOpacity onPress={() => updateStatus(doc.id, "approved")}>
                    <Ionicons name="checkmark-circle" size={22} color="green" />
                  </TouchableOpacity>

                  {/* REJECT */}
                  <TouchableOpacity onPress={() => updateStatus(doc.id, "rejected")}>
                    <Ionicons name="close-circle" size={22} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* VIEW + EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Doctor Details</Text>

            {selectedDoctor && (
              <>
                {/* EDIT FIELDS */}
                <TextInput
                  style={styles.input}
                  value={selectedDoctor.name}
                  onChangeText={(t) =>
                    setSelectedDoctor({ ...selectedDoctor, name: t })
                  }
                  placeholder="Name"
                />

                <TextInput
                  style={styles.input}
                  value={selectedDoctor.email}
                  onChangeText={(t) =>
                    setSelectedDoctor({ ...selectedDoctor, email: t })
                  }
                  placeholder="Email"
                />

                <TextInput
                  style={styles.input}
                  value={selectedDoctor.phone_number}
                  onChangeText={(t) =>
                    setSelectedDoctor({ ...selectedDoctor, phone_number: t })
                  }
                  placeholder="Phone Number"
                />

                <TextInput
                  style={styles.input}
                  value={selectedDoctor.department}
                  onChangeText={(t) =>
                    setSelectedDoctor({ ...selectedDoctor, department: t })
                  }
                  placeholder="Department"
                />

                <TextInput
                  style={styles.input}
                  value={selectedDoctor.experience}
                  onChangeText={(t) =>
                    setSelectedDoctor({ ...selectedDoctor, experience: t })
                  }
                  placeholder="Experience"
                />

                {/* UPDATE BUTTON */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
                  onPress={updateDoctorDetails}
                >
                  <Text style={styles.btnText}>Update</Text>
                </TouchableOpacity>

                {/* DELETE BUTTON */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#d9534f" }]}
                  onPress={() => deleteDoctor(selectedDoctor.id)}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>

                {/* CLOSE */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const statusColor = (status) => {
  switch (status) {
    case "approved":
      return "green";
    case "rejected":
      return "red";
    default:
      return "#555";
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingTop: 30 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  title: { fontSize: 22, fontWeight: "700", color: "#fff", marginLeft: 10 },

searchRow: {
  flexDirection: "row",
  alignItems: "center",
  marginHorizontal: 16,
  marginTop: 14,
},

searchBar: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  elevation: 3,
},

searchInput: {
  flex: 1,
  fontSize: 15,
  marginLeft: 8,
  color: "#000",
},

addDoctorBtn: {
  flexDirection: "row",
  alignItems: "center",
  marginLeft: 10,
  backgroundColor: "#2563eb", // 🔵 BLUE
  paddingHorizontal: 14,
  height: 46,              // SAME HEIGHT AS SEARCH BAR
  borderRadius: 12,
  elevation: 4,
},

addDoctorText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "700",
  marginLeft: 6,
},



  tableHeader: { flexDirection: "row", backgroundColor: "#2563eb", paddingVertical: 12 },

  headerCell: { fontWeight: "700", color: "#fff", textAlign: "center", fontSize: 14 },

  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 10, backgroundColor: "#fff" },

  cell: { fontSize: 14, color: "#000", textAlign: "center" },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },

  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 15,
    color: "#000",
  },

  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },

  btnText: { color: "#fff", fontWeight: "700", textAlign: "center" },

  cancelButton: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },

  cancelText: { fontSize: 16, color: "#333" },
});
