import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
    BackHandler,
 KeyboardAvoidingView,
  Platform,
    useWindowDimensions,
    StatusBar

} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId, getPatientId } from "../utils/storage";

export default function AppointmentPatientScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const doctor = route.params?.doctor;

  if (!doctor) {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 18, textAlign: "center", marginTop: 50 }}>
          ❌ No doctor data available.
        </Text>
      </View>
    );
  }

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [patientId, setPatientId] = useState(null);

  const doctorId = doctor.id || doctor.doctorid;
  const doctoremail = doctor.email;
  const doctorFee = doctor.consultance_fee || doctor.consultantfees || 800;
const { width: SCREEN_WIDTH } = useWindowDimensions();

  const isDesktop = SCREEN_WIDTH > 768;
  const MAX_CONTENT_WIDTH = 1000;
  
    const showAlert = (title, message) => {
      if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
      else Alert.alert(title, message);
    };
  useEffect(() => {
    const fetchIds = async () => {
      try {
        const empId = await getEmployeeId();
        const patId = await getPatientId();
        setEmployeeId(empId ? empId.toString() : null);
        setPatientId(patId ? patId.toString() : "1");
      } catch (err) {
        console.log("❌ Error fetching IDs:", err);
      }
    };
    fetchIds();
  }, []);

  // 🕒 Validate allowed time on picker change
const onChangeTime = (event, selected) => {
  setShowTimePicker(false);
  if (!selected) return;

  // Convert Local Time → IST
  const localOffset = selected.getTimezoneOffset(); // local offset in minutes
  const istOffset = -330; // IST = UTC+5:30 = -330 minutes

  const istDate = new Date(
    selected.getTime() + (istOffset - localOffset) * 60000
  );

  const hour = istDate.getHours();
  const minute = istDate.getMinutes();

  // Validate allowed IST time window (9 AM – 6 PM)
  if (hour < 9 || hour > 18 || (hour === 18 && minute > 0)) {
    showAlert(
      "⚠️ No Bookings Available",
      "Bookings are allowed only between 9:00 AM and 6:00 PM (IST)."
    );
    return;
  }

  setSelectedTime(selected);
};



const validateInputs = () => {
  if (
    !name ||
    !age ||
    !gender ||
    !bloodGroup ||
    !phone ||
    !paymentMode ||
    !selectedTime
  ) {
    showAlert("⚠️ Missing Fields", "Please fill all patient details.");
    return false;
  }

  if (isNaN(age) || parseInt(age) <= 0) {
   showAlert("⚠️ Invalid Age", "Please enter a valid age.");
    return false;
  }

  if (!/^\d{10}$/.test(phone)) {
    showAlert("⚠️ Invalid Phone", "Enter a valid 10-digit number.");
    return false;
  }

  // Convert Local Time → IST for validation
  const localOffset = selectedTime.getTimezoneOffset();
  const istOffset = -330;
  const istDate = new Date(
    selectedTime.getTime() + (istOffset - localOffset) * 60000
  );

  const hour = istDate.getHours();
  const minute = istDate.getMinutes();

  if (hour < 9 || hour > 18 || (hour === 18 && minute > 0)) {
    showAlert(
      "⚠️ No Bookings Available",
      "No bookings available for this time — only available between 9:00 AM and 6:00 PM (IST)."
    );
    return false;
  }

  return true;
};


  const onBookAppointment = async () => {
    if (!validateInputs()) return;

    if (!employeeId || !patientId || !doctorId) {
      showAlert("⚠️ Error", "Employee, Patient, or Doctor ID not found.");
      return;
    }

    setLoading(true);

    const payload = {
      employeeId,
      patientId,
      doctorId,
      patientName: name,
      patientAge: parseInt(age),
      patientGender: gender,
      patientBloodGroup: bloodGroup,
      patientPhone: phone,
      doctorName: doctor.name || doctor.doctorname,
      specialization: doctor.department,
      experience: doctor.experience || doctor.yearsofexperience,
      rating: doctor.rating || 4.5,
      availableDays: doctor.availableDays || "Mon-Fri",
      availableTime: doctor.availableTime || "10:00-16:00",
      appointmentDate: date.toISOString().split("T")[0],
      appointmentTime: selectedTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      doctorDescription: doctor.description,
      paymentType: paymentMode,
      doctorConsultantFee: doctorFee,
      doctorEmail: doctoremail,
    };

    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/doctorbooking/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.alert) {
        showAlert("⚠️ Limit Reached", result.message);
        return;
      }
      if (response.ok && result.appointment) {
        showAlert("✅ Success", "Appointment created successfully!");
        navigation.navigate("PatientBookingConfirmationScreen", {
          appointmentData: result.appointment,
        });
      } else {
        showAlert("❌ Error", result.message || "Booking failed");
      }
    } catch (error) {
      console.error(error);
      showAlert("❌ Error", "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

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

  // Add this inside your component

useEffect(() => {
  const fetchPatientByPhone = async () => {
    if (phone.length !== 10) return; // wait for full number

    try {
      // Fetch both APIs in parallel
      const [onlineRes, offlineRes] = await Promise.all([
        fetch("https://hospitaldatabasemanagement.onrender.com/book-appointment/all"),
        fetch("https://hospitaldatabasemanagement.onrender.com/doctorbooking/all")
      ]);

      const [onlineData, offlineData] = await Promise.all([
        onlineRes.json(),
        offlineRes.json()
      ]);

      // Combine both datasets
      const combined = [
        ...onlineData.map(item => ({
          name: item.name,
          age: item.age,
          gender: item.gender,
          bloodgroup: item.bloodgroup,
          patientid: item.patientid,
          phone: item.patientphone,
          createdat: item.createdat
        })),
        ...offlineData.map(item => ({
          name: item.patient_name,
          age: item.patient_age,
          gender: item.patient_gender,
          bloodgroup: item.patient_blood_group,
          patientid: item.patientid || item.id,
          phone: item.patient_phone,
          createdat: item.created_at || item.createdat
        }))
      ];

      // Find latest record with this phone number
      const patientRecord = combined
        .filter(item => item.phone === phone)
        .sort((a, b) => new Date(b.createdat) - new Date(a.createdat))[0];

      if (patientRecord) {
        setName(patientRecord.name || "");
        setAge(patientRecord.age?.toString() || "");
        setGender(patientRecord.gender || "");
        setBloodGroup(patientRecord.bloodgroup || "");
        setPatientId(patientRecord.patientid?.toString() || null);
      }
    } catch (error) {
      console.error("❌ Error fetching patient data:", error);
    }
  };

  fetchPatientByPhone();
}, [phone]);
return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER: Dashboard Style */}
      <View style={styles.topNav}>
        <View style={styles.headerLeft}>
          <Text style={styles.pageTitle}>Bharat Medical Hall</Text>
          <Text style={styles.pageSubtitle}>Appointment Scheduling Desk</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainWrapper, { width: isDesktop ? MAX_CONTENT_WIDTH : '100%' }]}>
          
          {/* DOCTOR STAT CARD */}
          <View style={styles.doctorCard}>
            <View style={styles.drRow}>
              <View style={styles.iconCircle}>
                <Icon name="doctor" size={28} color="#0D6EFD" />
              </View>
              <View style={styles.drInfo}>
                <Text style={styles.drName}>Dr. {doctor.name || doctor.doctorname}</Text>
                <Text style={styles.drSub}>{doctor.department} • {doctor.experience || doctor.yearsofexperience} Yrs Exp</Text>
              </View>
              <View style={styles.feeBadge}>
                <Text style={styles.feeLabel}>CONSULTATION FEE</Text>
                <Text style={styles.feeValue}>₹{doctorFee}</Text>
              </View>
            </View>
          </View>

          {/* FORM SECTION */}
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Patient Registration</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="Enter full name" value={name} onChangeText={setName} placeholderTextColor="#999" />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 12 }]}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput style={styles.input} placeholder="10-digit mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} placeholderTextColor="#999" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Age</Text>
                <TextInput style={styles.input} placeholder="Years" value={age} onChangeText={setAge} keyboardType="numeric" placeholderTextColor="#999" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Gender</Text>
                <TextInput style={styles.input} placeholder="M / F / O" value={gender} onChangeText={setGender} placeholderTextColor="#999" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Blood Group</Text>
                <TextInput style={styles.input} placeholder="e.g. O+" value={bloodGroup} onChangeText={setBloodGroup} placeholderTextColor="#999" />
              </View>
            </View>

            <Text style={styles.formHeading}>Scheduling & Payment</Text>
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.label}>Visit Date</Text>
                {Platform.OS === 'web' ? (
                  <input type="date" value={date.toISOString().split("T")[0]} onChange={(e) => setDate(new Date(e.target.value))} style={webStyles.input} />
                ) : (
                  <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowDate(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#0D6EFD" />
                    <Text style={styles.pickerText}>{date.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Time Slot</Text>
                {Platform.OS === 'web' ? (
                  <input type="time" value={selectedTime.toTimeString().slice(0, 5)} onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    const nt = new Date(selectedTime); nt.setHours(h, m); onChangeTime(null, nt);
                  }} style={webStyles.input} />
                ) : (
                  <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowTimePicker(true)}>
                    <Ionicons name="time-outline" size={20} color="#0D6EFD" />
                    <Text style={styles.pickerText}>{selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.label}>Payment Mode</Text>
              <View style={styles.payToggle}>
                {["Cash", "UPI", "Card"].map((mode) => (
                  <TouchableOpacity key={mode} style={[styles.payBtn, paymentMode === mode && styles.payBtnActive]} onPress={() => setPaymentMode(mode)}>
                    <Text style={[styles.payBtnText, paymentMode === mode && styles.payBtnTextActive]}>{mode}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={onBookAppointment} disabled={loading}>
              <Text style={styles.confirmBtnText}>{loading ? "PROCESSING..." : "CONFIRM APPOINTMENT"}</Text>
              <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {showDate && <DateTimePicker value={date} mode="date" display="calendar" minimumDate={new Date()} onChange={(e, d) => { setShowDate(false); if(d) setDate(d); }} />}
          {showTimePicker && <DateTimePicker value={selectedTime} mode="time" display="spinner" onChange={onChangeTime} />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const webStyles = {
  input: {
    padding: '12px', border: '1px solid #E9ECEF', borderRadius: '12px',
    fontSize: '14px', outline: 'none', backgroundColor: '#F8F9FA',
    marginTop: 5, color: '#333', fontFamily: 'sans-serif'
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FA" },
  topNav: { 
    flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", 
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 20, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E9ECEF'
  },
  headerLeft: { alignItems: 'flex-end' },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#1A1A1A" },
  pageSubtitle: { fontSize: 13, color: "#6c757d", fontWeight: '500' },
  backCircle: { backgroundColor: '#F1F3F5', padding: 8, borderRadius: 12 },

  scrollContent: { paddingBottom: 60 },
  mainWrapper: { alignSelf: 'center', padding: 20 },

  doctorCard: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#E9ECEF', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10,
  },
  drRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#E7F0FF', justifyContent: 'center', alignItems: 'center' },
  drInfo: { flex: 1, marginLeft: 16 },
  drName: { fontSize: 19, fontWeight: '800', color: '#212529' },
  drSub: { fontSize: 13, color: '#6c757d', marginTop: 4, fontWeight: '500' },
  feeBadge: { alignItems: 'flex-end', backgroundColor: '#F8F9FA', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E9ECEF' },
  feeLabel: { fontSize: 9, color: '#adb5bd', fontWeight: '800', marginBottom: 2 },
  feeValue: { color: '#0D6EFD', fontWeight: '800', fontSize: 18 },

  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E9ECEF' },
  formHeading: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginTop: 15, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#0D6EFD', paddingLeft: 12 },
  
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#495057', marginBottom: 8, marginLeft: 4 },
  input: { 
    backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', 
    borderRadius: 14, padding: 14, fontSize: 15, color: '#212529', fontWeight: '500',outlineStyle: "none"
  },
  row: { flexDirection: 'row', marginBottom: 18 },
  
  pickerTrigger: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', 
    borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 14, padding: 14 
  },
  pickerText: { marginLeft: 10, fontSize: 15, color: '#212529', fontWeight: '600' },

  paymentSection: { marginTop: 10, marginBottom: 30 },
  payToggle: { flexDirection: 'row', backgroundColor: '#F1F3F5', borderRadius: 14, padding: 5 },
  payBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  payBtnActive: { backgroundColor: '#fff', elevation: 2, shadowOpacity: 0.1 },
  payBtnText: { fontSize: 14, fontWeight: '700', color: '#6c757d' },
  payBtnTextActive: { color: '#0D6EFD' },

  confirmBtn: { 
    backgroundColor: '#0D6EFD', borderRadius: 16, padding: 18, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0D6EFD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 10 },
});