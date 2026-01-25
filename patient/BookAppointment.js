// screens/BookAppointmentScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
        BackHandler,

} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getPatientId } from "../utils/storage"; // Make sure the path is correct

export default function BookAppointmentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const appointmentData = route.params?.appointment;

  // ------------------ Patient Fields ------------------
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [patientId, setPatientId] = useState(null);


 // ------------------ Fetch Patient ID ------------------
  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const storedId = await getPatientId();
        setPatientId(
          appointmentData?.patientId ??
          appointmentData?.patientid ??
          storedId ??
          1
        );
      } catch (e) {
        console.error("❌ Failed to get patient ID:", e);
        setPatientId(appointmentData?.patientId ?? appointmentData?.patientid ?? 1);
      }
    };
    fetchPatientId();
  }, []);
   useEffect(() => {
          const backAction = () => {
            // Instead of going back step by step, reset navigation to Sidebar/Home
            navigation.reset({
              index: 0,
              routes: [{ name: "bottomtab" }], // <-- replace with your sidebar/home screen name
            });
            return true; // prevents default back behavior
          };
        
          const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
          );
        
          return () => backHandler.remove(); // clean up on unmount
        }, []);
  if (!appointmentData) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#555" }}>
          ⚠️ No appointment details found. Please go back and select a doctor.
        </Text>
        <TouchableOpacity
          style={[styles.submitBtn, { marginTop: 20 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.submitText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const doctorId =
    appointmentData.doctorId ??
    appointmentData.doctorid ??
    appointmentData.doctor?.id ??
    null;

  const doctorName =
    appointmentData.doctorName ??
    appointmentData.doctorname ??
    appointmentData.doctor?.name ??
    "";
    
 const doctoremail =
    appointmentData.doctoremail ??
    appointmentData.doctoremail ??
    appointmentData.doctor?.doctoremail ??
    "";
    
  const experience =
    appointmentData.experience ??
    appointmentData.yearsOfExperience ??
    appointmentData.yearsofexperience ??
    0;

  const department =
    appointmentData.department ?? appointmentData.dept ?? appointmentData.hospital ?? "";

  const consultantFees =
    appointmentData.consultantFees ??
    appointmentData.consultantfees ??
    appointmentData.consultationFee ??
    0;

  const rawDate =
    appointmentData.date ??
    appointmentData.datetime ??
    new Date().toISOString().split("T")[0];

  const date = String(rawDate).includes("T") ? String(rawDate).split("T")[0] : String(rawDate);

  const timeSlot =
    appointmentData.timeSlot ?? appointmentData.timeslot ?? appointmentData.time ?? "";


  // ------------------ Handle Booking ------------------
  const handleBooking = async () => {
    setErrorMsg(""); // reset error message

    if (!fullName || !age || !phone || !bloodGroup || !reason) {
      setErrorMsg("Please fill all the required details.");
      return;
    }
    if (!doctorId) {
      setErrorMsg("Doctor ID is missing from appointment data.");
      return;
    }

    const payload = {
      doctorId: doctorId,
      doctorName: doctorName,
      experience: Number(experience),
      yearsOfExperience: Number(experience),
      department: department,
      consultantFees: Number(consultantFees),
      date: date,
      timeSlot: timeSlot,
      patientId: patientId,
      name: fullName,
      age: parseInt(age, 10),
      gender: gender,
      bloodGroup: bloodGroup,
      reason: reason,
      patientPhone: phone,
     doctorEmail: doctoremail

    };

    try {
      setLoading(true);
      console.log("Booking payload:", payload);

      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/book-appointment/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { message: text || "No response body" };
      }

      setLoading(false);
    if (data.alert && data.message) {
      alert(data.message); // or Alert.alert("⚠️ Notice", data.message);
      return; // stop further navigation
    }

      if (response.ok) {
        console.log("Booking success:", data);
        navigation.navigate("paymentscreen", {
          appointment: data.appointment
            ? {
                ...data.appointment,
                consultantFees: data.appointment.consultantfees ?? payload.consultantFees,
                doctorName: data.appointment.doctorname ?? payload.doctorName,
                department: data.appointment.department ?? payload.department,
                date: data.appointment.date ? data.appointment.date.split("T")[0] : payload.date,
                timeSlot: data.appointment.timeslot ?? payload.timeSlot,
              }
            : {
                ...payload,
              },
        });
      } else {
        console.error("API Error status:", response.status, data);
        setErrorMsg(
          data.message
            ? `Server: ${data.message}`
            : `Status ${response.status} — ${JSON.stringify(data)}`
        );
      }
    } catch (error) {
      setLoading(false);
      console.error("Booking Exception:", error);
      setErrorMsg("Network Error: Failed to book appointment. Please try again.");
    }
  };
 if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ---------- Header ---------- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Book Appointment</Text>
      </View>

      {/* ---------- Doctor Info ---------- */}
      <View style={styles.doctorCard}>
        <Text style={styles.doctorName}>{doctorName}</Text>
        <Text style={styles.doctorDetailText}>
          Dept: {department} | Experience: {experience} yrs
        </Text>
        <View style={styles.doctorDetails}>
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.doctorDetailText}>Date: {date}</Text>
          <Ionicons name="time-outline" size={16} color="#fff" style={{ marginLeft: 10 }} />
          <Text style={styles.doctorDetailText}>Time: {timeSlot}</Text>
        </View>
        <Text style={styles.doctorDetailText}>Consultation Fees: ₹{consultantFees}</Text>
      </View>

      {/* ---------- Patient Form ---------- */}
      <Text style={styles.sectionTitle}>Patient Details</Text>

      {errorMsg ? <Text style={{ color: "red", marginBottom: 10 }}>{errorMsg}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Enter full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={[styles.input, { width: 80, marginLeft: 10 }]}
          placeholder="Age"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter email address (optional)"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* ---------- Gender Selection ---------- */}
      <View style={styles.genderContainer}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.radioGroup}>
          {["Male", "Female", "Other"].map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.radioOption}
              onPress={() => setGender(item)}
            >
              <View style={[styles.radioCircle, gender === item && styles.selectedCircle]} />
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ---------- Blood Group ---------- */}
      <TextInput
        style={styles.input}
        placeholder="Enter Blood Group (e.g. A+)"
        value={bloodGroup}
        onChangeText={setBloodGroup}
      />

      {/* ---------- Reason ---------- */}
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Reason for Appointment"
        multiline
        value={reason}
        onChangeText={setReason}
      />

      {/* ---------- Submit Button ---------- */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleBooking} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirm Appointment</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16, marginTop: 30 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backBtn: { marginRight: 8 },
  headerText: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  doctorCard: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  doctorName: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 6 },
  doctorDetails: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  doctorDetailText: { color: "#fff", marginLeft: 4, fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: "#111827" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  inputRow: { flexDirection: "row", marginBottom: 12 },
  genderContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  radioGroup: { flexDirection: "row", justifyContent: "space-between" },
  radioOption: { flexDirection: "row", alignItems: "center" },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6B7280",
    marginRight: 6,
  },
  selectedCircle: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  submitBtn: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
