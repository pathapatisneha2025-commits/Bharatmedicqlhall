import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const AppointmentConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const passedAppointment = route.params?.appointment;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    if (passedAppointment) {
      console.log("✅ Appointment Received:", passedAppointment);
      setAppointment(passedAppointment);
      setLoading(false);
    } else {
      Alert.alert("Error", "No appointment details found.");
      setLoading(false);
    }
  }, [passedAppointment]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#333" }}>Appointment not found.</Text>
      </View>
    );
  }
 if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );

  // ✅ Handle missing tokenid (fallback to id if needed)
  const appointmentId = appointment.tokenid ?? appointment.id;

  // 📄 Generate PDF and share
  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; }
              h1 { text-align: center; color: #007bff; }
              .card {
                border: 2px solid #007bff;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                background: #fff;
              }
              .row { margin-bottom: 10px; }
              .label { font-weight: bold; color: #333; }
              .value { color: #555; }
              .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>Appointment Confirmation</h1>
            <div class="card">
              <div class="row"><span class="label">Doctor:</span> <span class="value">${appointment.doctorname}</span></div>
              <div class="row"><span class="label">Department:</span> <span class="value">${appointment.department}</span></div>
              <div class="row"><span class="label">Date:</span> <span class="value">${new Date(
                appointment.date
              ).toLocaleDateString("en-IN")}</span></div>
              <div class="row"><span class="label">Time:</span> <span class="value">${appointment.timeslot}</span></div>
              <div class="row"><span class="label">Patient:</span> <span class="value">${appointment.name}</span></div>
              <div class="row"><span class="label">Age:</span> <span class="value">${appointment.age}</span></div>
              <div class="row"><span class="label">Gender:</span> <span class="value">${appointment.gender}</span></div>
              <div class="row"><span class="label">Blood Group:</span> <span class="value">${appointment.bloodgroup}</span></div>
              <div class="row"><span class="label">Reason:</span> <span class="value">${appointment.reason}</span></div>
              <div class="row"><span class="label">Payment:</span> <span class="value">₹${appointment.consultantfees} (${appointment.paymentstatus})</span></div>
              <div class="row"><span class="label">Appointment ID:</span> <span class="value">${appointmentId}</span></div>
            </div>
            <div class="footer">Please keep this receipt for your records.</div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF: " + error.message);
    }
  };

  return (
<ScrollView
  contentContainerStyle={[styles.container, { minHeight: 900 }]}
>
      {/* ✅ Success Icon */}
      <View style={styles.circle}>
        <Ionicons name="checkmark-circle" size={80} color="#28a745" />
      </View>

      <Text style={styles.title}>Appointment Confirmed!</Text>
      <Text style={styles.subtitle}>
        Your appointment has been successfully booked at Bharat Medical Hall
      </Text>

      {/* 📋 Appointment Card */}
      <View style={styles.card}>
        <Text style={styles.doctor}>{appointment.doctorname}</Text>
        <Text style={styles.speciality}>{appointment.department}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(appointment.date).toLocaleDateString("en-IN")}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{appointment.timeslot}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Patient:</Text>
          <Text style={styles.value}>{appointment.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Age:</Text>
          <Text style={styles.value}>{appointment.age}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Gender:</Text>
          <Text style={styles.value}>{appointment.gender}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Blood Group:</Text>
          <Text style={styles.value}>{appointment.bloodgroup}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Reason:</Text>
          <Text style={styles.value}>{appointment.reason}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment:</Text>
          <Text style={styles.value}>
            ₹{appointment.consultantfees} ({appointment.paymentstatus})
          </Text>
        </View>
      </View>

      {/* 📌 Appointment ID Box */}
      <View style={styles.idBox}>
        <Text style={styles.idLabel}>Appointment ID</Text>
        <Text style={styles.id}>{appointmentId}</Text>
        <Text style={styles.smallText}>
          Please save this ID for future reference
        </Text>
      </View>

      {/* 📤 PDF Download Button */}
      <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
        <Ionicons
          name="download"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>Download as PDF</Text>
      </TouchableOpacity>

      {/* 📅 View My Appointments Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate("PatientAppointmentsScreen", {
            patientId: appointment.patientid,
          })
        }
      >
        <Text style={styles.buttonText}>View My Appointments</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AppointmentConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  circle: { marginTop: 20, marginBottom: 15 },
  title: { fontSize: 22, fontWeight: "bold", color: "#000", marginBottom: 5 },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  doctor: { fontSize: 18, fontWeight: "bold", marginBottom: 4, color: "#000" },
  speciality: { fontSize: 14, marginBottom: 15, color: "#666" },
  row: { flexDirection: "row", marginBottom: 8 },
  label: { fontWeight: "600", color: "#333", width: 120 },
  value: { color: "#555", flexShrink: 1 },
  idBox: {
    backgroundColor: "#e8f0fe",
    width: "100%",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  idLabel: { fontSize: 14, color: "#444" },
  id: { fontSize: 20, fontWeight: "bold", color: "#004aad", marginVertical: 5 },
  smallText: { fontSize: 12, color: "#666", textAlign: "center" },
  pdfButton: {
    flexDirection: "row",
    backgroundColor: "#28a745",
    padding: 15,
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    width: "100%",
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
