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
} from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { getDoctorId } from '../utils/storage';
import DoctorCard from '../components/DoctorCardScreen';

const API_BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const DoctorDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadDoctorDetails();
  }, []);

  const loadDoctorDetails = async () => {
    try {
      let doctorId = route?.params?.id;

      // If not passed via navigation → get from storage
      if (!doctorId) {
        doctorId = await getDoctorId();
      }

      if (!doctorId) {
        Alert.alert("Error", "No doctor ID found");
        return;
      }

      await fetchDoctor(doctorId);
    } catch (e) {
      console.log('Error loading doctor:', e);
    }
  };

  const fetchDoctor = async (doctorId) => {
    try {
      // 1️⃣ Fetch doctor details
      const res1 = await fetch(`${API_BASE_URL}/doctor/${doctorId}`);
      const doctorData = await res1.json();

      // 2️⃣ Fetch all fees
      const res2 = await fetch(`${API_BASE_URL}/doctorconsultancefee/all`);
      const fees = await res2.json();

      // Match fee
      const feeObj = fees.find((f) => f.doctor_id === doctorId);

      setDoctor({
        id: doctorData.id,
        name: doctorData.name,
        designation: doctorData.role,
        qualification: doctorData.department + " Specialist",
        experience: doctorData.experience,
        hospital: doctorData.department,
        consultationFee: feeObj ? feeObj.fees : 0,
        email: doctorData.email,
      });
    } catch (error) {
      console.log("FetchDoctor error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const onChangeTime = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      const hour = time.getHours();
      if (hour < 9 || hour > 18) {
        Alert.alert("Invalid Time", "Bookings available only between 9 AM - 6 PM");
        return;
      }
      setSelectedTime(time);
    }
  };

  const goToBookingScreen = () => {
    navigation.navigate("bookappointment", {
      appointment: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        experience: doctor.experience,
        department: doctor.hospital,
        consultantFees: doctor.consultationFee,
        date: selectedDate.toISOString().split("T")[0],
        timeSlot: selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        doctoremail: doctor.email,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#444", fontSize: 16 }}>No doctor details found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <DoctorCard doctor={doctor} />

        {/* Date picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: "#34D399" }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={20} color="#fff" />
            <Text style={styles.dateButtonText}>{selectedDate.toDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker value={selectedDate} mode="date" onChange={onChangeDate} minimumDate={new Date()} />
          )}
        </View>

        {/* Time picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: "#34D399" }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Icon name="clock-outline" size={20} color="#fff" />
            <Text style={styles.dateButtonText}>
              {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker value={selectedTime} mode="time" onChange={onChangeTime} />
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.fee}>₹{doctor.consultationFee}</Text>
        <TouchableOpacity style={styles.button} onPress={goToBookingScreen}>
          <Text style={styles.buttonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default DoctorDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', marginTop: Platform.OS === 'ios' ? 50 : 0 },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#3B82F6',
  paddingVertical: 14,
  paddingHorizontal: 16,
  paddingTop: Platform.OS === 'android' ? 40 : 60, // 👈 add this
  borderBottomLeftRadius: 16,
  borderBottomRightRadius: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 5,
},

  backBtn: { padding: 6, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#111' },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  dateButtonText: { color: '#fff', marginLeft: 8, fontSize: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F2FE',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  fee: { fontSize: 20, fontWeight: '700', color: '#111' },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
