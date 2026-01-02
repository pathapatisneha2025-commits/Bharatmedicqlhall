// screens/MyAppointmentsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorId } from "../utils/storage";

export default function MyAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState(null);

  // ✅ DIRECT STEP 1: Load doctorId directly from storage
  const loadDoctorId = async () => {
    try {
      const storedDoctorId = await getDoctorId();
      if (!storedDoctorId) {
        console.log("❌ No doctor ID found in storage");
        return;
      }

      setDoctorId(storedDoctorId);
      fetchDoctorAppointments(storedDoctorId);
    } catch (err) {
      console.error("❌ Error loading doctor ID:", err);
    }
  };

  // STEP 2A: Fetch booked appointments (patient app)
  const fetchBookedAppointments = async (doctorId) => {
    try {
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/book-appointment/doctor/${doctorId}`
      );
      const data = await res.json();

      return (data || []).map((item, index) => ({
        id: item.tokenid || `${index + 1}`,
        doctor: item.doctorname || "Unknown",
        specialization: item.department || "-",
        date: item.date ? new Date(item.date).toLocaleDateString() : "-",
        time: item.timeslot || "N/A",
        fee: item.consultantfees ? `₹${item.consultantfees}` : "-",
        payment: item.paymentstatus?.toLowerCase() || "pending",
        source: "bookAppointment",

        // Patient info
        name: item.patient_name || item.name || "Unknown",
        age: item.patient_age || item.age || "-",
        gender: item.gender || "-",
        bloodgroup: item.bloodgroup || "-",
        reason: item.reason || "General Checkup",
        status: item.status || "Pending",
      }));
    } catch (err) {
      console.error("❌ Error fetching booked appointments:", err);
      return [];
    }
  };

  // STEP 2B: Fetch doctor's own bookings (direct booking)
  const fetchDoctorBookings = async (doctorId) => {
    try {
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/doctorbooking/doctor/${doctorId}`
      );
      const data = await res.json();

      return (data || []).map((item, index) => ({
        id: item.daily_id || `${index + 1}`,
        doctor: item.doctor_name || "Unknown",
        specialization: item.specialization || "-",
        date: item.appointment_date
          ? new Date(item.appointment_date).toLocaleDateString()
          : "-",
        time: item.appointment_time || "N/A",
        fee: item.doctor_consultant_fee ? `₹${item.doctor_consultant_fee}` : "-",
        payment: item.paymentStatus?.toLowerCase() || "pending",
        source: "doctorBooking",

        // Patient info
        name: item.patient_name || item.name || "Unknown",
        age: item.patient_age || item.age || "-",
        gender: item.patient_gender || "-",
        bloodgroup: item.patient_blood_group || "-",
        reason: item.reason || "Consultation",
        status: item.status || "Pending",
      }));
    } catch (err) {
      console.error("❌ Error fetching doctor bookings:", err);
      return [];
    }
  };

  // STEP 3: Combine both bookings
  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const [bookedAppointments, doctorBookings] = await Promise.all([
        fetchBookedAppointments(doctorId),
        fetchDoctorBookings(doctorId),
      ]);

      setAppointments([...bookedAppointments, ...doctorBookings]);
    } catch (err) {
      console.error("❌ Error combining doctor appointments:", err);
    }
  };

  // Load doctorId on mount
  useEffect(() => {
    loadDoctorId();
  }, []);

  // STEP 4: Update status
  const handleStatusChange = async (id, status, source) => {
    try {
      const body =
        source === "bookAppointment"
          ? { tokenid: id, status }
          : { daily_id: id, status };

      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/book-appointment/update-status",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Status updated:", data.message);
        fetchDoctorAppointments(doctorId);
      } else {
        console.warn("⚠️ Failed status update:", data.error);
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
    }
  };

  // STEP 5: Render UI
  const renderAppointment = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.doctorName}>{item.doctor}</Text>
          <Text style={styles.specialization}>{item.specialization}</Text>
        </View>
      </View>

      {/* Appointment Details */}
      <View style={styles.detailRow}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{item.date}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Time:</Text>
        <Text style={styles.value}>{item.time}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Fee:</Text>
        <Text style={styles.value}>{item.fee}</Text>
      </View>

      {/* Patient */}
      <View style={styles.separator} />
      <Text style={styles.sectionTitle}>Patient Details</Text>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{item.name}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Age:</Text>
        <Text style={styles.value}>{item.age}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Gender:</Text>
        <Text style={styles.value}>{item.gender}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Blood Group:</Text>
        <Text style={styles.value}>{item.bloodgroup}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Reason:</Text>
        <Text style={styles.value}>{item.reason}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Status:</Text>
        <Text
          style={[
            styles.value,
            { color: item.status === "Pending" ? "#FF9800" : "#4CAF50" },
          ]}
        >
          {item.status}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Payment:</Text>
        <Text
          style={[
            styles.value,
            { color: item.payment === "pending" ? "red" : "green" },
          ]}
        >
          {item.payment}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Appointment ID:</Text>
        <Text style={[styles.value, styles.appointmentId]}>{item.id}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#ff4d4d" }]}
          onPress={() => handleStatusChange(item.id, "Cancelled", item.source)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#ffcc00" }]}
          onPress={() => handleStatusChange(item.id, "Pending", item.source)}
        >
          <Text style={styles.buttonText}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
          onPress={() => handleStatusChange(item.id, "Completed", item.source)}
        >
          <Text style={styles.buttonText}>Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={22} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      {appointments.length > 0 ? (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <Text style={styles.emptyText}>No appointments found</Text>
      )}
    </View>
  );
}

// ------------------------------
// STYLES (unchanged)
// ------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB", paddingHorizontal: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#007BFF" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  doctorName: { fontSize: 16, fontWeight: "600", color: "#003366" },
  specialization: { color: "gray", fontSize: 13 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007BFF",
    marginTop: 8,
    marginBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  label: { color: "#333", fontWeight: "500" },
  value: { color: "#333", textTransform: "capitalize" },
  appointmentId: { color: "#007BFF", fontWeight: "600" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
});
