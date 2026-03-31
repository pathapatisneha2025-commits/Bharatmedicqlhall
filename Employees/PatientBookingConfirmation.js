import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
  Alert,
  useWindowDimensions,
  StatusBar,
  Platform
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function PatientBookingConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  
  const isDesktop = SCREEN_WIDTH > 768;
  const containerWidth = isDesktop ? 800 : SCREEN_WIDTH - 30;

  useEffect(() => {
    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: "EmpSideBar" }],
      });
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  const appointmentData = route.params?.appointmentData;

  if (!appointmentData) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="alert-circle" size={60} color="#ff4444" />
        <Text style={styles.errorText}>Appointment data missing.</Text>
        <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate("DoctorAppointment")}>
          <Text style={styles.mainBtnText}>Back to Doctors</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = appointmentData.appointment_date
    ? new Date(appointmentData.appointment_date).toISOString().split("T")[0]
    : "N/A";

  const generatePDF = async () => {
    try {
      const html = `
        <html>
          <body style="font-family: Arial; padding: 40px; color: #333;">
            <h1 style="color: #0D6EFD; text-align: center;">Bharat Medical Hall</h1>
            <h3 style="text-align: center; color: #666;">Booking Confirmation Receipt</h3>
            <hr/>
            <div style="margin-top: 20px; font-size: 18px;">
              <p><b>Appointment ID:</b> ${appointmentData.daily_id}</p>
              <p><b>Patient:</b> ${appointmentData.patient_name}</p>
              <p><b>Doctor:</b> ${appointmentData.doctor_name}</p>
              <p><b>Date:</b> ${formattedDate}</p>
              <p><b>Time:</b> ${appointmentData.appointment_time}</p>
              <p><b>Fee Paid:</b> ₹${appointmentData.doctor_consultant_fee}</p>
            </div>
            <p style="margin-top: 40px; text-align: center; color: #888;">Thank you for choosing Bharat Medical Hall.</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER */}
      <View style={styles.topNav}>
        <View>
          <Text style={styles.pageTitle}>Confirmation</Text>
          <Text style={styles.pageSubtitle}>Booking successfully processed</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.iconBtn}>
          <Ionicons name="home-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, { width: containerWidth }]}>
          
          {/* SUCCESS ICON & ID CARD */}
          <View style={styles.successHeader}>
             <View style={styles.checkCircle}>
                <Ionicons name="checkmark-sharp" size={40} color="#fff" />
             </View>
             <Text style={styles.successText}>Appointment Booked!</Text>
             
             <View style={styles.idCard}>
                <Text style={styles.idLabel}>APPOINTMENT ID</Text>
                <Text style={styles.idValue}>{appointmentData.daily_id}</Text>
             </View>
          </View>

          {/* DETAILS GRID */}
          <View style={styles.infoSection}>
             <Text style={styles.sectionTitle}>Patient & Visit Details</Text>
             
             <View style={styles.detailGrid}>
                <DetailItem icon="person-outline" label="Patient" value={appointmentData.patient_name} />
                <DetailItem icon="call-outline" label="Phone" value={appointmentData.patient_phone} />
                <DetailItem icon="medkit-outline" label="Doctor" value={appointmentData.doctor_name} />
                <DetailItem icon="calendar-outline" label="Date" value={formattedDate} />
                <DetailItem icon="time-outline" label="Time" value={appointmentData.appointment_time} />
                <DetailItem icon="card-outline" label="Payment" value={appointmentData.payment_type} />
             </View>

             <View style={styles.feeFooter}>
                <Text style={styles.feeLabel}>Total Consultation Fee</Text>
                <Text style={styles.feeValue}>₹{appointmentData.doctor_consultant_fee}</Text>
             </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF}>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.pdfBtnText}>Download Receipt (PDF)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bookMoreBtn} onPress={() => navigation.navigate("DoctorAppointment")}>
              <Text style={styles.bookMoreText}>Book Another Appointment</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// Sub-component for clean detail rows
const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={18} color="#0D6EFD" style={styles.detailIcon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "N/A"}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  topNav: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 20, backgroundColor: '#fff' 
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
  pageSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },

  scrollContent: { paddingVertical: 20, alignItems: 'center' },
  mainWrapper: { alignSelf: 'center' },

  successHeader: { alignItems: 'center', marginBottom: 30 },
  checkCircle: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#28A745', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    elevation: 4, shadowColor: '#28A745', shadowOpacity: 0.3, shadowRadius: 10
  },
  successText: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  
  idCard: { 
    backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 30, 
    borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center'
  },
  idLabel: { fontSize: 10, fontWeight: '800', color: '#999', letterSpacing: 1 },
  idValue: { fontSize: 24, fontWeight: '800', color: '#0D6EFD', marginTop: 4 },

  infoSection: { backgroundColor: '#fff', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#F0F0F0' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 20 },
  
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailItem: { width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailIcon: { marginRight: 10 },
  detailLabel: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase' },
  detailValue: { fontSize: 15, color: '#333', fontWeight: '600', marginTop: 2 },

  feeFooter: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F5F5F5' 
  },
  feeLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  feeValue: { fontSize: 22, fontWeight: '800', color: '#28A745' },

  actionContainer: { marginTop: 30 },
  pdfBtn: { 
    backgroundColor: '#0D6EFD', borderRadius: 14, padding: 18, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15
  },
  pdfBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 10 },
  
  bookMoreBtn: { padding: 15, alignItems: 'center' },
  bookMoreText: { color: '#0D6EFD', fontWeight: '700', fontSize: 15 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#666', marginTop: 15, marginBottom: 20 },
  mainBtn: { backgroundColor: '#0D6EFD', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  mainBtnText: { color: '#fff', fontWeight: '700' }
});