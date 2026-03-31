import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const AppointmentConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;

  const passedAppointment = route.params?.appointment;
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    if (passedAppointment) {
      setAppointment(passedAppointment);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [passedAppointment]);

  const appointmentId = appointment?.tokenid ?? appointment?.id ?? "N/A";

  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html>
          <body style="font-family: sans-serif; padding: 40px; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin-bottom: 5px;">Appointment Confirmed</h1>
              <p style="color: #64748b;">Bharat Medical Hall Receipt</p>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px;">
              <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Details</h3>
              <p><b>Appointment ID:</b> ${appointmentId}</p>
              <p><b>Doctor:</b> ${appointment.doctorname}</p>
              <p><b>Department:</b> ${appointment.department}</p>
              <p><b>Date:</b> ${new Date(appointment.date).toLocaleDateString("en-IN")}</p>
              <p><b>Time Slot:</b> ${appointment.timeslot}</p>
              <p><b>Patient:</b> ${appointment.name}</p>
              <p><b>Total Paid:</b> ₹${appointment.consultantfees}</p>
            </div>
            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">This is a computer-generated receipt.</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF");
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
  );

  return (
    <ScrollView style={styles.mainContainer} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.contentWrapper, isDesktop && styles.desktopWidth]}>
        
        {/* SUCCESS HEADER */}
        <View style={styles.successHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-sharp" size={40} color="#fff" />
          </View>
          <Text style={styles.title}>Booking Successful!</Text>
          <Text style={styles.subtitle}>Your appointment at Bharat Medical Hall is confirmed.</Text>
        </View>

        {/* RECEIPT CARD */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptTop}>
            <Text style={styles.receiptBrand}>BHARAT MEDICAL HALL</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idLabel}>ID: {appointmentId}</Text>
            </View>
          </View>

          <View style={styles.dottedLine} />

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.label}>DOCTOR</Text>
                <Text style={styles.value}>{appointment.doctorname}</Text>
                <Text style={styles.subValue}>{appointment.department}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>SCHEDULE</Text>
                <Text style={styles.value}>{new Date(appointment.date).toLocaleDateString("en-IN")}</Text>
                <Text style={styles.subValue}>{appointment.timeslot}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View>
                <Text style={styles.label}>PATIENT</Text>
                <Text style={styles.value}>{appointment.name}</Text>
                <Text style={styles.subValue}>{appointment.gender}, {appointment.age} yrs</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>PAYMENT</Text>
                <Text style={styles.value}>₹{appointment.consultantfees}</Text>
                <Text style={[styles.statusBadge, { color: '#10B981' }]}>{appointment.paymentstatus}</Text>
              </View>
            </View>
          </View>

          <View style={styles.dottedLine} />

          <View style={styles.receiptFooter}>
            <Ionicons name="information-circle-outline" size={16} color="#94A3B8" />
            <Text style={styles.footerText}>Show this digital receipt at the reception desk upon arrival.</Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
            <Ionicons name="cloud-download-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Download Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.outlineButton} 
            onPress={() => navigation.navigate("PatientAppointmentsScreen", { patientId: appointment.patientid })}
          >
            <Text style={styles.outlineButtonText}>View My Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.textButton} 
            onPress={() => navigation.navigate("bottomtab")}
          >
            <Text style={styles.textButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20, alignItems: 'center' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  contentWrapper: { width: '100%' },
  desktopWidth: { width: 500, alignSelf: 'center' },

  successHeader: { alignItems: 'center', marginVertical: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#10B981", justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 10, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10 },
  title: { fontSize: 24, fontWeight: "800", color: "#1E293B", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: 'center', paddingHorizontal: 20 },

  receiptCard: { backgroundColor: "#fff", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', width: '100%', elevation: 2 },
  receiptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  receiptBrand: { fontSize: 12, fontWeight: '800', color: '#3B82F6', letterSpacing: 1 },
  idBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  idLabel: { fontSize: 11, fontWeight: '700', color: '#475569' },

  dottedLine: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 1, marginVertical: 20 },
  
  infoSection: { gap: 25 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  subValue: { fontSize: 13, color: '#64748B' },
  statusBadge: { fontSize: 12, fontWeight: '900', marginTop: 4 },

  receiptFooter: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 5 },
  footerText: { fontSize: 11, color: '#94A3B8', flex: 1, lineHeight: 16 },

  actionContainer: { marginTop: 30, width: '100%', gap: 12 },
  pdfButton: { backgroundColor: "#3B82F6", padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  
  outlineButton: { borderWeight: 1, borderWidth: 1.5, borderColor: '#3B82F6', padding: 18, borderRadius: 16, alignItems: 'center' },
  outlineButtonText: { color: '#3B82F6', fontWeight: '800', fontSize: 16 },

  textButton: { padding: 10, alignItems: 'center' },
  textButtonText: { color: '#64748B', fontWeight: '600' }
});

export default AppointmentConfirmationScreen;