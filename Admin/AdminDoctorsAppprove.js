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
   useWindowDimensions,
  Platform,
  SafeAreaView
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const API = "https://hospitaldatabasemanagement.onrender.com/doctor";

export default function DoctorApprovalScreen() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
   const [loadingCount, setLoadingCount] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const navigation = useNavigation();
const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
    const isWeb = Platform.OS === "web";
  
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
  useEffect(() => {
            let interval;
            if (loading) {
              setLoadingCount(0);
              interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
            } else clearInterval(interval);
            return () => clearInterval(interval);
          }, [loading]);
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
    showAlert("Delete", "Are you sure?", [
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

     showAlert("Success", "Doctor updated successfully");
      fetchDoctors();
      setModalVisible(false);
    } catch (err) {
      showAlert("Error", "Failed to update doctor");
    }
  };
  const getStatusStyle = (status) => {
  switch (status) {
    case "approved":
      return { bg: "#dcfce7", text: "#166534" };
    case "rejected":
      return { bg: "#fee2e2", text: "#991b1b" };
    default:
      return { bg: "#fef3c7", text: "#78350f" }; // pending
  }
};

 
return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Approval Panel</Text>
            <Text style={styles.subTitle}>Manage specialist credentials and access</Text>
          </View>
        </View>

        {/* SEARCH & ADD BAR */}
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#64748b" />
            <TextInput
              placeholder="Filter by name or email..."
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AdnminAddDoctor")}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Doctor</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loaderText}>Syncing... {loadingCount}s</Text>
          </View>
        )}

        {/* DATA TABLE */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={!isWeb}>
            <View style={{ minWidth: isWeb ? "100%" : 950 }}>
              {/* TABLE HEADER */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { width: 220 }]}>Doctor Name</Text>
                <Text style={[styles.headerCell, { width: 180 }]}>Specialization</Text>
                <Text style={[styles.headerCell, { width: 140 }]}>Status</Text>
                <Text style={[styles.headerCell, { width: 220, textAlign: "center" }]}>Control Actions</Text>
              </View>

              {/* TABLE ROWS */}
              {filteredDoctors.map((doc, idx) => {
                const colors = getStatusStyle(doc.status);
                return (
                  <View
                    key={doc.id}
                    style={[
                      styles.tableRow,
                      { backgroundColor: idx % 2 === 0 ? "#fff" : "#f8fafc" },
                    ]}
                  >
                    <Text style={[styles.cell, { width: 220, fontWeight: "600" }]}>{doc.name}</Text>
                    <Text style={[styles.cell, { width: 180, color: "#64748b" }]}>{doc.department}</Text>
                    <View style={{ width: 140 }}>
                      <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>
                          {doc.status || "Pending"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionGroup}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: "#e0f2fe" }]} 
                        onPress={() => { setSelectedDoctor(doc); setModalVisible(true); }}
                      >
                        <Feather name="edit-3" size={16} color="#0369a1" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: "#dcfce7" }]} 
                        onPress={() => updateStatus(doc.id, "approved")}
                      >
                        <Ionicons name="checkmark-sharp" size={18} color="#166534" />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: "#fee2e2" }]} 
                        onPress={() => updateStatus(doc.id, "rejected")}
                      >
                        <Ionicons name="close-sharp" size={18} color="#991b1b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </ScrollView>

        {/* EDIT MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Credentials</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                {selectedDoctor &&
                  ["name", "email", "phone_number", "department", "experience"].map((field) => (
                    <View key={field} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{field.replace("_", " ").toUpperCase()}</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={String(selectedDoctor[field] || "")}
                        onChangeText={(t) =>
                          setSelectedDoctor({ ...selectedDoctor, [field]: t })
                        }
                        placeholder={`Enter ${field}`}
                      />
                    </View>
                  ))}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.footerBtn, { backgroundColor: "#2563eb" }]}
                  onPress={updateDoctorDetails}
                >
                  <Text style={styles.footerBtnText}>Save Changes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.footerBtn, { backgroundColor: "#ef4444" }]}
                  onPress={() => deleteDoctor(selectedDoctor.id)}
                >
                  <Text style={styles.footerBtnText}>Remove Doctor</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 16,
  },
  circleBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  subTitle: { fontSize: 13, color: "#64748b", fontWeight: "500" },

  toolbar: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1e293b",outlineStyle: "none" },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    elevation: 2,
  },
  addButtonText: { color: "#fff", fontWeight: "700" },

  loaderOverlay: {
    position: "absolute",
    zIndex: 100,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: { marginTop: 12, fontWeight: "600", color: "#2563eb" },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerCell: { fontWeight: "800", color: "#475569", fontSize: 12, textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cell: { fontSize: 14, color: "#334155" },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  actionGroup: { width: 220, flexDirection: "row", justifyContent: "center", gap: 12 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: "#64748b", marginBottom: 6 },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  footerBtnText: { color: "#fff", fontWeight: "700" },
});