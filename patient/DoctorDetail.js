import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  BackHandler,
  useWindowDimensions,
} from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const DoctorDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
const [availableSlots, setAvailableSlots] = useState([]);
const [selectedSlot, setSelectedSlot] = useState("");
const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => { loadDoctorDetails(); }, []);

  const loadDoctorDetails = async () => {
    try {
      let doctorId = route?.params?.id;
      if (!doctorId) return Alert.alert("Error", "No doctor ID found");
      
      const [res1, res2] = await Promise.all([
        fetch(`${API_BASE_URL}/doctor/${doctorId}`),
        fetch(`${API_BASE_URL}/doctorconsultancefee/all`)
      ]);
      
      const doctorData = await res1.json();
      const fees = await res2.json();
      const feeObj = fees.find(f => f.doctor_id === doctorId);

      setDoctor({
        id: doctorData.id,
        name: doctorData.name,
        designation: doctorData.role || "Specialist",
        department: doctorData.department,
        experience: doctorData.experience || "8",
        consultationFee: feeObj ? feeObj.fees : 500,
        email: doctorData.email,
        description:doctorData.description,
        // rating: "4.9",
        // patients: "1.2k+"
      });
    } catch (e) {
      console.log('Error loading doctor:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!doctor?.id || !selectedDate) return;

  const fetchSlots = async () => {
    try {
      setSlotsLoading(true);

      const formattedDate = selectedDate.toISOString().split("T")[0];

      const res = await fetch(
        `${API_BASE_URL}/doctorslots/${doctor.id}?date=${formattedDate}`
      );

      const data = await res.json();

      if (data.slots) {
        // Optional sorting
        const sorted = data.slots.sort();
        setAvailableSlots(sorted);
      } else {
        setAvailableSlots([]);
      }

    } catch (err) {
      console.log("Slot fetch error:", err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  fetchSlots();
}, [selectedDate, doctor]);

const onChangeDate = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const onChangeTime = (event, pickedTime) => {
    setShowTimePicker(false);
    if (event.type === "dismissed" || !pickedTime) return;

    const hour = pickedTime.getHours();
    const minute = pickedTime.getMinutes();

    if (hour < 9 || hour > 18 || (hour === 18 && minute > 0)) {
      showAlert(
        "⚠️ No Bookings Available",
        "Only available between 9:00 AM and 6:00 PM."
      );
      return;
    }

    const newDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hour,
      minute,
      0,
      0
    );

    setSelectedTime(newDateTime);
  };
  const goToBookingScreen = () => {
    navigation.navigate("bookappointment", {
      appointment: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        experience: doctor.experience,
        department: doctor.department,
        consultantFees: doctor.consultationFee,
        description:doctor.description,
        date: selectedDate.toISOString().split("T")[0],
timeSlot: selectedSlot,
        doctoremail: doctor.email,
      },
    });
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Fetching Specialist Profile...</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Scheduling</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.contentWrapper, isDesktop && styles.desktopRow]}>
          
          {/* LEFT COLUMN: DOCTOR INFO */}
          <View style={[styles.leftColumn, isDesktop && { flex: 1.2 }]}>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarText}>{doctor.name.split(' ').map(n=>n[0]).join('')}</Text>
                </View>
                <View style={styles.profileText}>
                  <Text style={styles.docName}>{doctor.name}</Text>
                  <Text style={styles.docDept}>{doctor.department} Specialist</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.verifiedBadge}>
                      <Icon name="checkmark-circle" size={14} color="#3B82F6" />
                      <Text style={styles.verifiedText}>Verified Profile</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Experience</Text>
                  <Text style={styles.statValue}>{doctor.experience} Years</Text>
                </View>
                {/* <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Rating</Text>
                  <Text style={styles.statValue}>{doctor.rating} ⭐</Text>
                </View> */}
                {/* <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Patients</Text>
                  <Text style={styles.statValue}>{doctor.patients}</Text>
                </View> */}
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.sectionTitle}>Professional Bio</Text>
                <Text style={styles.aboutText}>
                  {doctor.description} is a leading expert in {doctor.department} with extensive clinical experience. 
                  Focused on patient-centered care and modern diagnostic techniques.
                </Text>
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN: BOOKING FORM */}
          <View style={[styles.rightColumn, isDesktop && { flex: 0.8 }]}>
            <View style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>Schedule Appointment</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Choose Date</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    style={styles.webInput}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  />
                ) : (
                  <TouchableOpacity style={styles.mobileInput} onPress={() => setShowDatePicker(true)}>
                    <Icon name="calendar-outline" size={20} color="#64748B" />
                    <Text style={styles.inputText}>{selectedDate.toDateString()}</Text>
                  </TouchableOpacity>
                )}
              </View>
<View style={styles.formGroup}>
  <Text style={styles.label}>Choose Time Slot</Text>

  {slotsLoading ? (
    <ActivityIndicator size="small" color="#3B82F6" />
  ) : availableSlots.length > 0 ? (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {availableSlots.map((slot, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.slotChip,
            selectedSlot === slot && styles.activeSlotChip
          ]}
          onPress={() => setSelectedSlot(slot)}
        >
          <Text
            style={[
              styles.slotTextChip,
              selectedSlot === slot && styles.activeSlotText
            ]}
          >
            {slot}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : (
    <Text style={{ color: "#94A3B8" }}>
      No slots available for selected date
    </Text>
  )}
</View>


              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Consultation Fee</Text>
                  <Text style={styles.summaryValue}>₹{doctor.consultationFee}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service Charge</Text>
                  <Text style={styles.summaryValue}>₹50</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalValue}>₹{parseInt(doctor.consultationFee) + 50}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={goToBookingScreen}>
                <Text style={styles.primaryBtnText}>Confirm and Continue</Text>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.secureText}>
                <Icon name="lock-closed" size={12} color="#94A3B8" /> Secure payment and data encryption
              </Text>
            </View>
          </View>
          
        </View>
      </ScrollView>
    </View>
  );
};

export default DoctorDetailsScreen;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 80, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 25, borderBottomWidth: 1, borderColor: '#E2E8F0',
    paddingTop: Platform.OS === 'ios' ? 40 : 0
  },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  
  scrollContent: { padding: 25 },
  contentWrapper: { gap: 25 },
  desktopRow: { flexDirection: 'row', alignItems: 'flex-start' },

  // LEFT COLUMN - PROFILE
  profileCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatarLarge: { width: 90, height: 90, borderRadius: 25, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#3B82F6' },
  profileText: { marginLeft: 20 },
  docName: { fontSize: 26, fontWeight: '800', color: '#1E293B' },
  docDept: { fontSize: 16, color: '#64748B', fontWeight: '500', marginTop: 4 },
  badgeRow: { marginTop: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 },
  verifiedText: { fontSize: 12, color: '#0284C7', fontWeight: '700' },

  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16, alignItems: 'center', borderWeight: 1, borderColor: '#F1F5F9' },
  statLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 5 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  aboutSection: { borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  aboutText: { fontSize: 15, color: '#64748B', lineHeight: 24 },

  // RIGHT COLUMN - BOOKING
  bookingCard: { backgroundColor: '#fff', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: '#E2E8F0', elevation: 4 },
  bookingTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 25 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  webInput: { width: '100%', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 15, color: '#1E293B' },
  mobileInput: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  inputText: { fontSize: 15, color: '#1E293B' },

  summaryBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20, marginVertical: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: '#64748B', fontSize: 14 },
  summaryValue: { color: '#1E293B', fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#3B82F6' },

  primaryBtn: { backgroundColor: '#3B82F6', borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secureText: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 15 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#64748B' },
  slotChip: {
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E2E8F0",
  backgroundColor: "#fff",
},

activeSlotChip: {
  backgroundColor: "#3B82F6",
  borderColor: "#3B82F6",
},

slotTextChip: {
  fontSize: 14,
  fontWeight: "600",
  color: "#475569",
},

activeSlotText: {
  color: "#fff",
},

});