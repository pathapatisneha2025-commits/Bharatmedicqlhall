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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const API_URL1 = "https://hospitaldatabasemanagement.onrender.com/book-appointment/all";
const API_URL2 = "https://hospitaldatabasemanagement.onrender.com/doctorbooking/all";

const BookedAppointmentsScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Preview Modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch all booked appointments from both APIs
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response1 = await fetch(API_URL1);
        const data1 = await response1.json();

        const response2 = await fetch(API_URL2);
        const data2 = await response2.json();

        // Normalize doctorbooking API to match book-appointment fields
        const normalizedData2 = data2.map((item) => ({
          id: item.id,
          name: item.patient_name,
          age: item.patient_age,
          gender: item.patient_gender || "N/A",
          bloodgroup: item.patient_bloodgroup || "N/A",
          doctorname: item.doctor_name,
          department: item.specialization,
          date: item.appointment_date,
          timeslot: item.appointment_time,
          consultantfees: item.doctor_consultant_fee || 0,
          reason: item.doctor_description,
          patientphone: item.patient_phone,
          paymentstatus: item.payment_type?.toLowerCase() === "cash" ? "Pending" : "Paid",
        }));

        setAppointments([...data1, ...normalizedData2]);
      } catch (error) {
        alert("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.doctorname?.toLowerCase().includes(search.toLowerCase());
    const matchesDoctor = selectedDoctor ? item.doctorname === selectedDoctor : true;
    return matchesSearch && matchesDoctor;
  });

  const previewDetails = (item) => {
    setSelectedAppointment(item);
    setModalVisible(true);
  };

  const deleteAppointment = (id) => {
    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
    alert("Appointment deleted successfully!");
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return styles.statusPaid;
      case "pending":
        return styles.statusPending;
      case "failed":
        return styles.statusFailed;
      default:
        return styles.statusDefault;
    }
  };

  const doctorCounts = appointments.reduce((acc, curr) => {
    if (curr.doctorname) {
      acc[curr.doctorname] = (acc[curr.doctorname] || 0) + 1;
    }
    return acc;
  }, {});

  const renderRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, { minWidth: 50 }]}>{index + 1}</Text>
      <Text style={[styles.cell, { minWidth: 80 }, getStatusStyle(item.paymentstatus)]}>
        {item.paymentstatus}
      </Text>
      <Text style={[styles.cell, { minWidth: 120 }]}>{item.name}</Text>
      <Text style={[styles.cell, { minWidth: 120 }]}>{item.doctorname}</Text>
      <Text style={[styles.cell, { minWidth: 120 }]}>{item.department}</Text>
      <Text style={[styles.cell, { minWidth: 100 }]}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      <Text style={[styles.cell, { minWidth: 80 }]}>{item.timeslot}</Text>
      <Text style={[styles.cell, { minWidth: 80 }]}>₹{item.consultantfees}</Text>
      <Text style={[styles.cell, { minWidth: 150 }]}>{item.reason}</Text>
      <Text style={[styles.cell, { minWidth: 120 }]}>{item.patientphone}</Text>
      <View style={[styles.cell, { minWidth: 100, flexDirection: "row", justifyContent: "space-around" }]}>
        <TouchableOpacity onPress={() => previewDetails(item)}>
          <FontAwesome name="eye" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteAppointment(item.id)}>
          <Icon name="delete" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booked Appointments</Text>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>📄 Appointment Details</Text>
            {selectedAppointment && (
              <ScrollView>
                <View style={styles.modalContent}>
                  {Object.entries({
                    "Patient Name": selectedAppointment.name,
                    Age: selectedAppointment.age,
                    Gender: selectedAppointment.gender,
                    "Blood Group": selectedAppointment.bloodgroup,
                    Doctor: selectedAppointment.doctorname,
                    Department: selectedAppointment.department,
                    Date: new Date(selectedAppointment.date).toDateString(),
                    "Time Slot": selectedAppointment.timeslot,
                    "Consultant Fees": `₹${selectedAppointment.consultantfees}`,
                    Reason: selectedAppointment.reason,
                    Phone: selectedAppointment.patientphone,
                    "Payment Status": selectedAppointment.paymentstatus,
                  }).map(([label, value]) => (
                    <Text key={label} style={styles.detailText}>
                      <Text style={styles.detailLabel}>{label}:</Text> {value}
                    </Text>
                  ))}
                </View>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}>
        {/* Doctor Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
          <TouchableOpacity
            style={[styles.summaryCard, selectedDoctor === null && styles.selectedCard]}
            onPress={() => setSelectedDoctor(null)}
          >
            <Text style={styles.summaryTitle}>Total Appointments</Text>
            <Text style={styles.summaryText}>{appointments.length}</Text>
          </TouchableOpacity>

          {Object.entries(doctorCounts).map(([doctor, count]) => (
            <TouchableOpacity
              key={doctor}
              style={[styles.summaryCard, selectedDoctor === doctor && styles.selectedCard]}
              onPress={() => setSelectedDoctor(doctor)}
            >
              <Text style={styles.summaryTitle}>Dr. {doctor}</Text>
              <Text style={styles.summaryText}>{count} appointment{count > 1 ? "s" : ""}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Input */}
        <TextInput
          style={styles.input}
          placeholder="Search by patient or doctor"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.clearButton} onPress={() => setSearch("")}>
          <Text style={styles.clearText}>Clear Filters</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <ScrollView horizontal>
            <View>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.headerCell, { minWidth: 50 }]}>S.No</Text>
                <Text style={[styles.headerCell, { minWidth: 80 }]}>Payment</Text>
                <Text style={[styles.headerCell, { minWidth: 120 }]}>Patient</Text>
                <Text style={[styles.headerCell, { minWidth: 120 }]}>Doctor</Text>
                <Text style={[styles.headerCell, { minWidth: 120 }]}>Dept</Text>
                <Text style={[styles.headerCell, { minWidth: 100 }]}>Date</Text>
                <Text style={[styles.headerCell, { minWidth: 80 }]}>Time</Text>
                <Text style={[styles.headerCell, { minWidth: 80 }]}>Fees</Text>
                <Text style={[styles.headerCell, { minWidth: 150 }]}>Reason</Text>
                <Text style={[styles.headerCell, { minWidth: 120 }]}>Phone</Text>
                <Text style={[styles.headerCell, { minWidth: 100 }]}>Actions</Text>
              </View>
              <FlatList
                data={filteredAppointments}
                renderItem={renderRow}
                keyExtractor={(item) => item.id.toString()}
              />
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Header
  headerContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#2196F3", padding: 12, borderRadius: 10, margin: 10, elevation: 3,marginTop:30 },
  backButton: { backgroundColor: "#1976D2", padding: 8, borderRadius: 50, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },

  // Summary Card
  summaryCard: { backgroundColor: "#2196F3", padding: 15, borderRadius: 12, marginRight: 10, minWidth: 150, alignItems: "center", elevation: 3 },
  selectedCard: { backgroundColor: "#1976D2" },
  summaryTitle: { color: "#fff", fontWeight: "bold", fontSize: 16, marginBottom: 5, textAlign: "center" },
  summaryText: { color: "#fff", fontSize: 14, textAlign: "center" },

  // Search
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginVertical: 5, backgroundColor: "#fff" },
  clearButton: { backgroundColor: "#1976D2", padding: 10, alignItems: "center", borderRadius: 8, marginVertical: 5 },
  clearText: { color: "#fff", fontWeight: "bold" },

  // Table
  tableHeader: { backgroundColor: "#f4f4f4" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", alignItems: "center" },
  headerCell: { padding: 8, fontWeight: "bold", fontSize: 12, textAlign: "center" },
  cell: { padding: 8, fontSize: 12, textAlign: "center" },

  // Payment Status
  statusPaid: { color: "green", fontWeight: "bold" },
  statusPending: { color: "orange", fontWeight: "bold" },
  statusFailed: { color: "red", fontWeight: "bold" },
  statusDefault: { color: "#000", fontWeight: "bold" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalContent: { marginBottom: 20 },
  detailText: { fontSize: 16, marginVertical: 5 },
  detailLabel: { fontWeight: "bold", color: "#333" },
  closeButton: { backgroundColor: "#2196F3", padding: 12, borderRadius: 8, alignItems: "center" },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default BookedAppointmentsScreen;
