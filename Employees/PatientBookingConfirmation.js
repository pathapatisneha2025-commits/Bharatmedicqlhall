import React, {  useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
   BackHandler,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function PatientBookingConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();

useEffect(() => {
  const backAction = () => {
    // Instead of going back step by step, reset navigation to Sidebar/Home
    navigation.reset({
      index: 0,
      routes: [{ name: "EmpSideBar" }], // <-- replace with your sidebar/home screen name
    });
    return true; // prevents default back behavior
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove(); // clean up on unmount
}, []);

  // ✅ The appointment object from the API
  const appointmentData = route.params?.appointmentData;

  if (!appointmentData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Appointment could not be created.</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("DoctorAppointment")}
        >
          <Text style={styles.homeButtonText}>🏥 Back to Doctors List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Format date (remove time part)
  const formattedDate = appointmentData.appointment_date
    ? new Date(appointmentData.appointment_date).toISOString().split("T")[0]
    : "N/A";

  // 📄 Generate and share PDF
  const generatePDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; color: #00796b; font-size: 40px; margin-bottom: 10px; }
              h2 { text-align: center; color: #ff5722; font-size: 28px; margin-bottom: 20px; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              td {
                padding: 8px 12px;
                border-bottom: 1px solid #ccc;
              }
              th {
                text-align: left;
                color: #333;
                font-size: 16px;
              }
              p {
                text-align: center;
                margin-top: 30px;
                font-size: 16px;
              }
            </style>
          </head>
          
          <body>
            <h1>🏥 Bharat Medical Hall</h1>
            <h2>Appointment ID: ${appointmentData.daily_id || "N/A"}</h2>

            <table>
              <tr><th>Patient Name:</th><td>${appointmentData.patient_name || "N/A"}</td></tr>
              <tr><th>Patient Phone:</th><td>${appointmentData.patient_phone || "N/A"}</td></tr>
              <tr><th>Doctor Name:</th><td>${appointmentData.doctor_name || "N/A"}</td></tr>
              <tr><th>Specialization:</th><td>${appointmentData.specialization || "N/A"}</td></tr>
              <tr><th>Appointment Date & Time:</th><td>${formattedDate} at ${
        appointmentData.appointment_time || "N/A"
      }</td></tr>
              <tr><th>Payment Mode:</th><td>${appointmentData.payment_type || "N/A"}</td></tr>
              <tr><th>Fee:</th><td>₹${appointmentData.doctor_consultant_fee || "0"}</td></tr>
              <tr><th>Status:</th><td>${appointmentData.status || "PENDING"}</td></tr>
              <tr><th>Doctor Description:</th><td>${appointmentData.doctor_description || "N/A"}</td></tr>
            </table>

            <p>✅ Thank you for booking with Bharat Medical Hall. Please bring this confirmation on the day of your appointment.</p>
          </body>
        </html>
      `;

      // 📄 Generate the PDF
      const { uri } = await Print.printToFileAsync({ html });

      // 📤 Share the PDF
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF: " + error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 🏥 Bharat Medical Hall Header */}
      <Text style={styles.headerTitle}>🏥 Bharat Medical Hall</Text>

      <Text style={styles.successTitle}>✅ Appointment Confirmed!</Text>

      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>📌 Appointment ID</Text>
        <Text style={[styles.detailValue, styles.bigId]}>
          {appointmentData.daily_id  || "N/A"}
        </Text>

        <Text style={styles.detailLabel}>👤 Patient Name</Text>
        <Text style={styles.detailValue}>{appointmentData.patient_name || "N/A"}</Text>

        <Text style={styles.detailLabel}>📞 Patient Phone</Text>
        <Text style={styles.detailValue}>{appointmentData.patient_phone || "N/A"}</Text>

        <Text style={styles.detailLabel}>🩺 Doctor Name</Text>
        <Text style={styles.detailValue}>{appointmentData.doctor_name || "N/A"}</Text>

        <Text style={styles.detailLabel}>🏥 Specialization</Text>
        <Text style={styles.detailValue}>{appointmentData.specialization || "N/A"}</Text>

        <Text style={styles.detailLabel}>📅 Appointment Date & Time</Text>
        <Text style={styles.detailValue}>
          {formattedDate} at {appointmentData.appointment_time || "N/A"}
        </Text>

        <Text style={styles.detailLabel}>💳 Payment Mode</Text>
        <Text style={styles.detailValue}>{appointmentData.payment_type || "N/A"}</Text>

        <Text style={styles.detailLabel}>💰 Fee</Text>
        <Text style={styles.detailValue}>₹{appointmentData.doctor_consultant_fee || "0"}</Text>

        <Text style={styles.detailLabel}>📌 Status</Text>
        <Text style={[styles.detailValue, { color: "#00796b", fontWeight: "bold" }]}>
          {appointmentData.status || "PENDING"}
        </Text>

        <Text style={styles.detailLabel}>📄 Doctor Description</Text>
        <Text style={styles.detailValue}>{appointmentData.doctor_description || "N/A"}</Text>
      </View>

      {/* ✅ Generate PDF Button */}
      <TouchableOpacity
        style={[styles.homeButton, { backgroundColor: "#ff5722" }]}
        onPress={generatePDF}
      >
        <Text style={styles.homeButtonText}>📄 Download PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("DoctorAppointment")}
      >
        <Text style={styles.homeButtonText}>🏥 Back to Doctors List</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.homeButton, { backgroundColor: "#004d40", marginTop: 10 }]}
        onPress={() => navigation.navigate("DoctorAppointment")}
      >
        <Text style={styles.homeButtonText}>📋 Book Another Appointment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00796b",
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#00796b",
    textAlign: "center",
  },
  detailCard: {
    width: "100%",
    backgroundColor: "#e0f7fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  detailValue: {
    fontSize: 16,
    marginTop: 3,
  },
  bigId: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ff5722",
  },
  homeButton: {
    backgroundColor: "#00796b",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
    marginBottom: 20,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
});
