// screens/BookedAppointmentsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
   useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons"; // Added for modern iconography
const API_URL_1 =
  "https://hospitaldatabasemanagement.onrender.com/book-appointment/all";
const API_URL_2 =
  "https://hospitaldatabasemanagement.onrender.com/doctorbooking/all";
const STATUS_UPDATE_URL =
  "https://hospitaldatabasemanagement.onrender.com/book-appointment/update-status";

const columnWidths = {
  serial: 60,
  type: 80,
  status: 110,
  patient: 140,
  doctor: 140,
  department: 140,
  date: 100,
  time: 100,
  fees: 100,
  reason: 180,
  phone: 120,
  actions: 240,
};

const AdminBookedAppointmentsScreen = () => {
  const navigation = useNavigation();

  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
          const [loadingCount, setLoadingCount] = useState(0);

const isWeb = Platform.OS === "web";

  const { width: SCREEN_WIDTH } = useWindowDimensions();
    const MAX_WIDTH = 420;
    const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
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
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(API_URL_1),
          fetch(API_URL_2),
        ]);
        const data1 = await res1.json();
        const data2 = await res2.json();

        const combinedData = [
          ...data1.map((item, i) => ({
            serial: i + 1,
            id: `A1-${item.tokenid}`,
            type: "Online",
            name: item.name,
            age: item.age,
            gender: item.gender,
            bloodgroup: item.bloodgroup,
            doctorname: item.doctorname,
            department: item.department,
            date: item.date,
            timeslot: item.timeslot,
            consultantfees: item.consultantfees,
            reason: item.reason,
            patientphone: item.patientphone,
            paymentstatus: item.paymentstatus,
          })),
          ...data2.map((item, i) => ({
            serial: data1.length + i + 1,
            id: `A2-${item.daily_id}`,
            type: "Offline",
            name: item.patient_name,
            age: item.patient_age,
            gender: item.patient_gender,
            bloodgroup: item.patient_blood_group,
            doctorname: item.doctor_name,
            department: item.specialization,
            date: item.appointment_date,
            timeslot: item.appointment_time,
            consultantfees: item.doctor_consultant_fee,
            reason: item.doctor_description,
            patientphone: item.patient_phone,
            paymentstatus: item.status,
          })),
        ];

        setAppointments(combinedData);
      } catch (e) {
         showAlert("Error", "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

 const updateStatus = async (id, status) => {
  try {
    let tokenid = null;
    let daily_id = null;

    if (id.startsWith("A1-")) tokenid = id.replace("A1-", "");
    else if (id.startsWith("A2-")) daily_id = id.replace("A2-", "");

    console.log("Updating status:", { tokenid, daily_id, status });

    const response = await fetch(STATUS_UPDATE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenid, daily_id, status }),
    });

    const data = await response.json();

    if (response.ok && data.appointment) {
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id
            ? { ...appt, paymentstatus: data.appointment.status } // use backend status
            : appt
        )
      );
      showAlert("Success", `Status updated to "${data.appointment.status}"`);
    } else {
       showAlert("Error", data.error || "Failed to update status");
    }
  } catch (error) {
    console.log(error);
     showAlert("Error", "Failed to update status");
  }
};


  // ✅ Updated Delete API integration
  const deleteAppointment = async (id) => {
    try {
      let deleteUrl = "";
      if (id.startsWith("A1-")) {
        const tokenid = id.replace("A1-", "");
        deleteUrl = `https://hospitaldatabasemanagement.onrender.com/book-appointment/delete/${tokenid}`;
      } else if (id.startsWith("A2-")) {
        const daily_id = id.replace("A2-", "");
        deleteUrl = `https://hospitaldatabasemanagement.onrender.com/doctorbooking/delete/${daily_id}`;
      } else {
        showAlert("Error", "Invalid appointment ID");
        return;
      }

       showAlert(
        "Confirm Delete",
        "Are you sure you want to delete this appointment?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const response = await fetch(deleteUrl, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
              });

              const data = await response.json();

              if (response.ok) {
                setAppointments((prev) =>
                  prev.filter((appt) => appt.id !== id)
                );
                 showAlert("Success", "Appointment deleted successfully!");
              } else {
                 showAlert("Error", data.error || "Failed to delete appointment");
              }
            },
          },
        ]
      );
    } catch (error) {
      showAlert("Error", "Failed to delete appointment");
    }
  };

  const exportAppointments = () => {
  const url = "https://hospitaldatabasemanagement.onrender.com/book-appointment/export";

   showAlert(
    "Export Appointments",
    "Your appointment records will download in your browser.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) },
    ]
  );
};


  const previewDetails = (item) => {
    setSelectedAppointment(item);
    setModalVisible(true);
  };

  const filteredAppointments = appointments.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.doctorname?.toLowerCase().includes(term)
    );
  });

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return { color: "green", fontWeight: "bold" };
      case "pending":
      case "progress":
        return { color: "orange", fontWeight: "bold" };
      case "failed":
        return { color: "red", fontWeight: "bold" };
      case "conformed":
        return { color: "#2196F3", fontWeight: "bold" };
      default:
        return { color: "#000", fontWeight: "bold" };
    }
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading appointment{loadingCount}s</Text>
      </View>
    );
  }

  const renderRow = ({ item }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.cell, { width: columnWidths.serial }]}>{item.serial}</Text>
    <Text style={[styles.cell, { width: columnWidths.type }]}>{item.type}</Text>
    <Text style={[styles.cell, { width: columnWidths.status }, getStatusStyle(item.paymentstatus)]}>
      {item.paymentstatus}
    </Text>
    <Text style={[styles.cell, { width: columnWidths.patient }]}>{item.name}</Text>
    <Text style={[styles.cell, { width: columnWidths.doctor }]}>{item.doctorname}</Text>
    <Text style={[styles.cell, { width: columnWidths.department }]}>{item.department}</Text>
    <Text style={[styles.cell, { width: columnWidths.date }]}>{item.date}</Text>
    <Text style={[styles.cell, { width: columnWidths.time }]}>{item.timeslot}</Text>
    <Text style={[styles.cell, { width: columnWidths.fees }]}>₹{item.consultantfees}</Text>
    <Text style={[styles.cell, { width: columnWidths.reason }]} numberOfLines={1}>
      {item.reason}
    </Text>
    <Text style={[styles.cell, { width: columnWidths.phone }]}>{item.patientphone}</Text>

    <View style={[styles.actionsContainer, { width: columnWidths.actions }]}>
      <TouchableOpacity style={styles.btnIcon} onPress={() => previewDetails(item)}>
        <Feather name="eye" size={16} color="#2563eb" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnIcon}
        onPress={() => deleteAppointment(item.id)}
      >
        <Feather name="trash" size={16} color="#dc2626" />
      </TouchableOpacity>
    </View>
  </View>
);

 return (
    <SafeAreaView style={styles.mainContainer}>
      {/* HEADER AREA */}
      <View style={styles.headerArea}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Appointments</Text>
            <Text style={styles.headerSub}>Manage all patient bookings</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnExport} onPress={exportAppointments}>
          <Feather name="file-text" size={18} color="#fff" />
          <Text style={styles.btnExportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* FILTER BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Search by patient or doctor..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={() => setSearch("")}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* TABLE CARD */}
     <View style={styles.cardTable}>
  <ScrollView horizontal showsHorizontalScrollIndicator={!isWeb}>
    <View>
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        {[
          "S.No", "Type", "Status", "Patient", "Doctor", "Dept.", "Date", "Time", "Fees", "Reason", "Phone", "Action"
        ].map((title, i) => (
          <Text key={i} style={[styles.headerCell, { width: Object.values(columnWidths)[i] }]}>
            {title}
          </Text>
        ))}
      </View>

      {/* Table Rows */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderRow}
        keyExtractor={(item) => item.id.toString()}
        extraData={search}   // forces re-render on search change
        ListEmptyComponent={() => (
          <Text style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
            No appointments found
          </Text>
        )}
      />
    </View>
  </ScrollView>
</View>


      {/* DETAILS MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: SCREEN_WIDTH > 420 ? 420 : SCREEN_WIDTH - 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Appointment Info</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {selectedAppointment && (
              <ScrollView style={{ maxHeight: 400 }}>
                {[
                  { label: "Patient Name", value: selectedAppointment.name },
                  { label: "Doctor", value: selectedAppointment.doctorname },
                  { label: "Date & Time", value: `${new Date(selectedAppointment.date).toDateString()} at ${selectedAppointment.timeslot}` },
                  { label: "Department", value: selectedAppointment.department },
                  { label: "Fees", value: `₹${selectedAppointment.consultantfees}` },
                  { label: "Contact", value: selectedAppointment.patientphone },
                  { label: "Reason", value: selectedAppointment.reason },
                  { label: "Status", value: selectedAppointment.paymentstatus },
                ].map((item, idx) => (
                  <View key={idx} style={styles.infoCard}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F1F5F9", padding: 16 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: Platform.OS === 'ios' ? 10 : 0 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  circleBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  headerSub: { color: "#64748b", fontSize: 13 },
  btnExport: { flexDirection: "row", alignItems: "center", backgroundColor: "#334155", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnExportText: { color: "#fff", fontWeight: "600", marginLeft: 8 },

  searchContainer: { flexDirection: "row", gap: 10, marginBottom: 15 },
  inputWrapper: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  input: { flex: 1, paddingVertical: 10, marginLeft: 8, fontSize: 14,outlineStyle: "none" },
  clearButton: { backgroundColor: "#fff", paddingHorizontal: 15, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  clearText: { color: "#64748b", fontWeight: "600" },

  cardTable: { backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: "#e2e8f0", flex: 1, overflow: "hidden", elevation: 3 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", textAlign: "center" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center", paddingVertical: 12 },
  cell: { fontSize: 13, color: "#475569", textAlign: "center" },

  actionsContainer: { flexDirection: "row", justifyContent: "center", gap: 12 },
  btnIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  infoCard: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  infoLabel: { fontSize: 10, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  infoValue: { fontSize: 15, color: "#1e293b", fontWeight: "600", marginTop: 2 },
  closeButton: { backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 12, marginTop: 15, alignItems: "center" },
  closeButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default AdminBookedAppointmentsScreen;