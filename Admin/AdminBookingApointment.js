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
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

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
        Alert.alert("Error", "Failed to load appointments");
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
              ? { ...appt, paymentstatus: data.appointment.status || status }
              : appt
          )
        );
        Alert.alert("Success", `Status updated to "${status}"`);
      } else {
        Alert.alert("Error", data.error || "Failed to update status");
      }
    } catch {
      Alert.alert("Error", "Failed to update status");
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
        Alert.alert("Error", "Invalid appointment ID");
        return;
      }

      Alert.alert(
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
                Alert.alert("Success", "Appointment deleted successfully!");
              } else {
                Alert.alert("Error", data.error || "Failed to delete appointment");
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete appointment");
    }
  };

  const exportAppointments = () => {
  const url = "https://hospitaldatabasemanagement.onrender.com/book-appointment/export";

  Alert.alert(
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
        <Text style={{ marginTop: 10 }}>Loading appointment...</Text>
      </View>
    );
  }
  const renderRow = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, { width: columnWidths.serial }]}>
        {item.serial}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.type }]}>{item.type}</Text>
      <Text
        style={[
          styles.cell,
          { width: columnWidths.status },
          getStatusStyle(item.paymentstatus),
        ]}
      >
        {item.paymentstatus}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.patient }]}>
        {item.name}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.doctor }]}>
        {item.doctorname}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.department }]}>
        {item.department}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.date }]}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.time }]}>
        {item.timeslot}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.fees }]}>
        ₹{item.consultantfees}
      </Text>
      <Text
        style={[styles.cell, { width: columnWidths.reason }]}
        numberOfLines={1}
      >
        {item.reason}
      </Text>
      <Text style={[styles.cell, { width: columnWidths.phone }]}>
        {item.patientphone}
      </Text>

      <View style={[styles.actionsContainer, { width: columnWidths.actions }]}>
        <TouchableOpacity onPress={() => previewDetails(item)}>
          <FontAwesome name="eye" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => updateStatus(item.id, "progress")}>
          <Text style={styles.statusButtonProgress}>Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => updateStatus(item.id, "completed")}>
          <Text style={styles.statusButtonCompleted}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteAppointment(item.id)}>
          <Icon name="delete" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booked Appointments</Text>

        <TouchableOpacity
  onPress={exportAppointments}
  style={{ marginLeft: "auto", marginRight: 10 }}
>
  <Icon name="file-download" size={26} color="#fff" />Export
</TouchableOpacity>

      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>📋 Appointment Details</Text>
            {selectedAppointment && (
              <ScrollView>
                {Object.entries({
                  "Booking Type": selectedAppointment.type,
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
              </ScrollView>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={{ flex: 1, padding: 10 }}>
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
          <ActivityIndicator size="large" color="#2196F3" />
        ) : (
          <ScrollView horizontal>
            <View>
              <View style={[styles.tableRow, styles.tableHeader]}>
                {[
                  "S.No",
                  "Type",
                  "Status",
                  "Patient",
                  "Doctor",
                  "Department",
                  "Date",
                  "Time",
                  "Fees",
                  "Reason",
                  "Phone",
                  "Actions",
                ].map((title, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.headerCell,
                      { width: Object.values(columnWidths)[i] },
                    ]}
                  >
                    {title}
                  </Text>
                ))}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 30
  },
  backButton: { marginRight: 10 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginVertical: 5,
  },
  clearButton: {
    backgroundColor: "#000",
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    marginVertical: 10,
  },
  clearText: { color: "#fff", fontWeight: "bold" },
  tableHeader: {
    backgroundColor: "#f4f4f4",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  headerCell: {
    padding: 8,
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
  },
  cell: {
    padding: 8,
    fontSize: 12,
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statusButtonProgress: {
    backgroundColor: "orange",
    padding: 5,
    borderRadius: 5,
    color: "#fff",
    fontWeight: "bold",
  },
  statusButtonCompleted: {
    backgroundColor: "green",
    padding: 5,
    borderRadius: 5,
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  detailText: { fontSize: 16, marginVertical: 5 },
  detailLabel: { fontWeight: "bold", color: "#333" },
closeButton: {
  backgroundColor: "#2196F3",
  paddingVertical: 16,
  borderRadius: 10,
  alignItems: "center",
  marginBottom: 16,  // 👈 keeps distance from gesture bar
},

  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default AdminBookedAppointmentsScreen;
