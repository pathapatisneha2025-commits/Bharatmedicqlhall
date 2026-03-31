import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  BackHandler,
  useWindowDimensions,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;

  const passedAppointment = route.params?.appointment;
  const [appointment, setAppointment] = useState(passedAppointment || null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi"); 
  const [upiApp, setUpiApp] = useState("Google Pay");
  const [loadingCount, setLoadingCount] = useState(5);

  const [form, setForm] = useState({
    name: "", age: "", gender: "", bloodGroup: "",
    reason: "", date: "", timeSlot: "",
    consultantFees: "", patientPhone: "",
  });

  useEffect(() => {
    if (passedAppointment) {
      setAppointment(passedAppointment);
      setForm({
        name: passedAppointment.name || passedAppointment.doctorname || "",
        age: String(passedAppointment.age || ""),
        gender: passedAppointment.gender || "",
        bloodGroup: passedAppointment.bloodgroup || "",
        reason: passedAppointment.reason || "",
        date: passedAppointment.date?.split("T")[0] || "",
        timeSlot: passedAppointment.timeslot || passedAppointment.timeSlot || "",
        consultantFees: passedAppointment.consultantfees || passedAppointment.consultantFees || 0,
        patientPhone: passedAppointment.patientphone || passedAppointment.patientPhone || "",
      });
    }
  }, [passedAppointment]);

  const updateAppointment = async () => {
    if (!appointment?.id) return Alert.alert("Error", "ID not found");
    setLoading(true);
    try {
      const response = await fetch(`https://hospitaldatabasemanagement.onrender.com/book-appointment/update/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consultantFees: parseFloat(form.consultantFees), age: parseInt(form.age) }),
      });
      const data = await response.json();
      if (response.ok) {
        setAppointment(data.appointment);
        setIsEditing(false);
        Alert.alert("Success", "Details updated.");
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const platformFee = 25;
  const totalAmount = parseFloat(form.consultantFees || 0) + platformFee;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Securing Payment Gateway... {loadingCount}s</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("bottomtab")} style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Checkout</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
          <Icon name={isEditing ? "close" : "pencil-outline"} size={20} color={isEditing ? "#EF4444" : "#3B82F6"} />
          <Text style={[styles.editBtnText, isEditing && {color: "#EF4444"}]}>{isEditing ? "Cancel" : "Edit Details"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.layoutWrapper, isDesktop && styles.desktopRow]}>
          
          {/* LEFT: FORM & PAYMENT */}
          <View style={{ flex: isDesktop ? 1.4 : 1 }}>
            
            {/* APPOINTMENT SUMMARY CARD */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="clipboard-text-outline" size={22} color="#3B82F6" />
                <Text style={styles.cardTitle}>Patient & Appointment Details</Text>
              </View>

              {isEditing ? (
                <View style={styles.editGrid}>
                  <TextInput style={styles.input} placeholder="Patient Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
                  <View style={styles.row}>
                    <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Age" keyboardType="numeric" value={form.age} onChangeText={(t) => setForm({ ...form, age: t })} />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Blood Group" value={form.bloodGroup} onChangeText={(t) => setForm({ ...form, bloodGroup: t })} />
                  </View>
                  <TextInput style={styles.input} placeholder="Reason" value={form.reason} onChangeText={(t) => setForm({ ...form, reason: t })} />
                  <TouchableOpacity style={styles.saveBtn} onPress={updateAppointment}>
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.detailsDisplay}>
                  <View style={styles.displayRow}>
                    <Text style={styles.displayLabel}>Doctor</Text>
                    <Text style={styles.displayValue}>{appointment.doctorname}</Text>
                  </View>
                  <View style={styles.displayRow}>
                    <Text style={styles.displayLabel}>Patient</Text>
                    <Text style={styles.displayValue}>{form.name}</Text>
                  </View>
                  <View style={styles.displayRow}>
                    <Text style={styles.displayLabel}>Schedule</Text>
                    <Text style={styles.displayValue}>{form.date} • {form.timeSlot}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* PAYMENT METHOD SELECTION */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="credit-card-outline" size={22} color="#3B82F6" />
                <Text style={styles.cardTitle}>Payment Method</Text>
              </View>

              <View style={styles.methodGrid}>
                <TouchableOpacity 
                  style={[styles.methodTile, paymentMethod === 'upi' && styles.methodTileActive]} 
                  onPress={() => setPaymentMethod('upi')}
                >
                  <Icon name="qrcode-scan" size={24} color={paymentMethod === 'upi' ? "#3B82F6" : "#64748B"} />
                  <Text style={[styles.methodText, paymentMethod === 'upi' && styles.methodTextActive]}>UPI / QR</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.methodTile, paymentMethod === 'cash' && styles.methodTileActive]} 
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Icon name="hospital-building" size={24} color={paymentMethod === 'cash' ? "#3B82F6" : "#64748B"} />
                  <Text style={[styles.methodText, paymentMethod === 'cash' && styles.methodTextActive]}>Pay at Hospital</Text>
                </TouchableOpacity>
              </View>

              {paymentMethod === "upi" && (
                <View style={styles.upiContainer}>
                  <Text style={styles.subLabel}>Popular UPI Apps</Text>
                  <View style={styles.upiGrid}>
                    {["Google Pay", "PhonePe", "Paytm", "Amazon Pay"].map((app) => (
                      <TouchableOpacity 
                        key={app} 
                        style={[styles.upiChip, upiApp === app && styles.upiChipActive]} 
                        onPress={() => setUpiApp(app)}
                      >
                        <Text style={[styles.upiChipText, upiApp === app && styles.upiChipTextActive]}>{app}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* RIGHT: BILL SUMMARY */}
          <View style={{ flex: isDesktop ? 0.6 : 1 }}>
            <View style={styles.billCard}>
              <Text style={styles.billTitle}>Bill Summary</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Consultation Fee</Text>
                <Text style={styles.billValue}>₹{form.consultantFees}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Platform Service Fee</Text>
                <Text style={styles.billValue}>₹{platformFee}</Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>₹{totalAmount}</Text>
              </View>

              <TouchableOpacity 
                style={styles.payBtn} 
                onPress={() => navigation.navigate("bookconfimationop", { appointment, paymentMethod })}
              >
                <Text style={styles.payBtnText}>
                  {paymentMethod === 'cash' ? "Confirm Booking" : "Proceed to Pay"}
                </Text>
                <Icon name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.secureNotice}>
                <Icon name="shield-check" size={16} color="#10B981" />
                <Text style={styles.secureNoticeText}>100% Secure Transaction</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  loadingText: { marginTop: 15, fontSize: 16, color: "#3B82F6", fontWeight: '600' },
  
  header: {
    height: 80, backgroundColor: "#fff", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, borderBottomWidth: 1, borderColor: "#E2E8F0",
    paddingTop: Platform.OS === 'ios' ? 40 : 0
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B", flex: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  editBtnText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#3B82F6' },

  scrollContent: { padding: 20 },
  layoutWrapper: { gap: 20 },
  desktopRow: { flexDirection: "row", alignItems: "flex-start" },

  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#1E293B" },

  detailsDisplay: { gap: 12 },
  displayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  displayLabel: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  displayValue: { color: '#1E293B', fontSize: 15, fontWeight: '700' },

  methodGrid: { flexDirection: 'row', gap: 15 },
  methodTile: { flex: 1, height: 90, borderRadius: 16, borderWidth: 2, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC' },
  methodTileActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  methodText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  methodTextActive: { color: '#3B82F6' },

  upiContainer: { marginTop: 25 },
  subLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' },
  upiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  upiChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  upiChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  upiChipText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  upiChipTextActive: { color: '#fff' },

  billCard: { backgroundColor: "#1E293B", borderRadius: 24, padding: 25, shadowColor: "#000", shadowOpacity: 0.2, elevation: 10 },
  billTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 20 },
  billRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  billLabel: { fontSize: 14, color: "#94A3B8" },
  billValue: { fontSize: 15, color: "#fff", fontWeight: "600" },
  billDivider: { height: 1, backgroundColor: "#334155", marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#fff" },
  totalValue: { fontSize: 22, fontWeight: "900", color: "#3B82F6" },
  
  payBtn: { backgroundColor: "#3B82F6", borderRadius: 16, padding: 18, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 25 },
  payBtnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  secureNotice: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 15 },
  secureNoticeText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },

  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 14, marginBottom: 15, fontSize: 15 },
  saveBtn: { backgroundColor: "#10B981", padding: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800' }
});