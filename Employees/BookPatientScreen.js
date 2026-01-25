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
    Alert.alert(
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
    Alert.alert("⚠️ Missing Fields", "Please fill all patient details.");
    return false;
  }

  if (isNaN(age) || parseInt(age) <= 0) {
    Alert.alert("⚠️ Invalid Age", "Please enter a valid age.");
    return false;
  }

  if (!/^\d{10}$/.test(phone)) {
    Alert.alert("⚠️ Invalid Phone", "Enter a valid 10-digit number.");
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
    Alert.alert(
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
      Alert.alert("⚠️ Error", "Employee, Patient, or Doctor ID not found.");
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
        Alert.alert("⚠️ Limit Reached", result.message);
        return;
      }
      if (response.ok && result.appointment) {
        Alert.alert("✅ Success", "Appointment created successfully!");
        navigation.navigate("PatientBookingConfirmationScreen", {
          appointmentData: result.appointment,
        });
      } else {
        Alert.alert("❌ Error", result.message || "Booking failed");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("❌ Error", "Failed to book appointment.");
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
  
// if (loading)
//       return (
//         <View style={styles.loader}>
//           <ActivityIndicator size="large" color="#007bff" />
//           <Text>Loading...</Text>
//         </View>
//       );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 👨‍⚕️ Doctor Info */}
        <View style={styles.card}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorDetails}>🏥 {doctor.department}</Text>
          <Text style={styles.doctorDetails}>
            🩺 Experience: {doctor.experience} yrs
          </Text>
          <Text style={styles.doctorDetails}>
            ⭐ Rating: {doctor.rating || 4.5}
          </Text>
          <Text style={styles.doctorFee}>
            💰 Consultation Fee: ₹{doctorFee}
          </Text>
        </View>

        {/* 👤 Patient Details */}
        <Text style={styles.sectionTitle}>👤 Patient Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Gender (Male/Female/Other)"
          value={gender}
          onChangeText={setGender}
        />
        <TextInput
          style={styles.input}
          placeholder="Blood Group (e.g., A+, B-, O+)"
          value={bloodGroup}
          onChangeText={setBloodGroup}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />

        {/* 📅 Date Picker */}
        <Text style={styles.sectionTitle}>📅 Select Date</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowDate(true)}
        >
          <Text style={styles.dateText}>📆 {date.toDateString()}</Text>
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(e, selectedDate) => {
              setShowDate(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* ⏰ Time Picker */}
        <Text style={styles.sectionTitle}>⏰ Select Time</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateText}>
            🕒{" "}
            {selectedTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={onChangeTime}
          />
        )}

        {/* 💳 Payment Mode */}
        <Text style={styles.sectionTitle}>💳 Payment Mode</Text>
        <View style={styles.paymentContainer}>
          {["Cash", "UPI", "Card"].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.paymentOption,
                paymentMode === mode && styles.selectedPayment,
              ]}
              onPress={() => setPaymentMode(mode)}
            >
              <Text
                style={[
                  styles.paymentTextOption,
                  paymentMode === mode && { color: "#fff" },
                ]}
              >
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Confirm Button */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={onBookAppointment}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "⏳ Booking..."
              : `📅 Confirm Appointment - ₹${doctorFee}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    elevation: 4,
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#007BFF" },
  card: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#f0f8ff",
    marginBottom: 20,
    elevation: 3,
  },
  doctorName: { fontSize: 24, fontWeight: "bold", color: "#007BFF" },
  doctorDetails: { fontSize: 16, marginTop: 6, color: "#333" },
  doctorFee: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: "bold",
    color: "#28a745",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  datePicker: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    borderColor: "#ccc",
  },
  dateText: { fontSize: 16 },
  paymentContainer: { flexDirection: "row", justifyContent: "space-between" },
  paymentOption: {
    flex: 1,
    borderWidth: 1,
    padding: 15,
    margin: 5,
    borderRadius: 10,
    alignItems: "center",
    borderColor: "#ccc",
  },
  selectedPayment: { backgroundColor: "#007BFF", borderColor: "#007BFF" },
  paymentTextOption: { fontSize: 16, color: "#333" },
  button: {
    backgroundColor: "#007BFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
