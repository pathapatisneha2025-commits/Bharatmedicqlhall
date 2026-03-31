import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getPatientId } from "../utils/storage";

export default function BookAppointmentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const appointmentData = route.params?.appointment;
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
  const [parentName, setParentName] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [patientId, setPatientId] = useState(null);
  const [showAddPatientForm, setShowAddPatientForm] = useState(false);
  const [existingPatients, setExistingPatients] = useState([]);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(null);

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const fetchId = async () => {
      const storedId = await getPatientId();
      setPatientId(appointmentData?.patientId ?? storedId ?? 1);
    };
    fetchId();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const storedPatientId = await getPatientId();
        const currentPatientId = patientId ?? storedPatientId ?? 1;
        const response = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/book-appointment/patientdetailed/${currentPatientId}`
        );
        const data = await response.json();
        if (response.ok && data.patient) {
          setExistingPatients(data.allAppointments || [data.patient]);
        }
      } catch (err) {
        console.error("Failed to fetch existing patients:", err);
      }
    };
    fetchPatients();
  }, [patientId]);

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
    appointmentData.doctoremail ?? appointmentData.doctor?.doctoremail ?? "";

  const experience =
    appointmentData.experience ??
    appointmentData.yearsOfExperience ??
    appointmentData.yearsofexperience ??
    0;

  const department =
    appointmentData.department ??
    appointmentData.dept ??
    appointmentData.hospital ??
    "";

  const consultantFees =
    appointmentData.consultantFees ??
    appointmentData.consultantfees ??
    appointmentData.consultationFee ??
    0;

  const rawDate =
    appointmentData.date ??
    appointmentData.datetime ??
    new Date().toISOString().split("T")[0];

  const date = String(rawDate).includes("T")
    ? String(rawDate).split("T")[0]
    : String(rawDate);

  const timeSlot =
    appointmentData.timeSlot ?? appointmentData.timeslot ?? appointmentData.time ?? "";

  const handleBooking = async () => {
    setErrorMsg("");
    if (!fullName || !age || !phone || !bloodGroup || !reason) {
      setErrorMsg("Please fill all the required details.");
      return;
    }
    if (!doctorId) {
      setErrorMsg("Doctor ID is missing from appointment data.");
      return;
    }

    const payload = {
      doctorId,
      doctorName,
      experience: Number(experience),
      yearsOfExperience: Number(experience),
      department,
      consultantFees: Number(consultantFees),
      date,
      timeSlot,
      patientId,
      name: fullName,
      age: parseInt(age, 10),
      gender,
      bloodGroup,
      reason,
      patientPhone: phone,
      doctorEmail: doctoremail,
    };

    try {
      setLoading(true);
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
      } catch {
        data = { message: text || "No response body" };
      }

      setLoading(false);
      if (data.alert && data.message) {
        showAlert("Notice", data.message);
        return;
      }

      if (response.ok) {
        navigation.navigate("paymentscreen", {
          appointment: data.appointment
            ? {
                ...data.appointment,
                consultantFees: data.appointment.consultantfees ?? payload.consultantFees,
                doctorName: data.appointment.doctorname ?? payload.doctorName,
                department: data.appointment.department ?? payload.department,
                date: data.appointment.date
                  ? data.appointment.date.split("T")[0]
                  : payload.date,
                timeSlot: data.appointment.timeslot ?? payload.timeSlot,
              }
            : { ...payload },
        });
      } else {
        setErrorMsg(data.message ? `Server: ${data.message}` : `Error ${response.status}`);
      }
    } catch (error) {
      setLoading(false);
      setErrorMsg("Network Error: Failed to book appointment.");
    }
  };

  if (!appointmentData)
    return (
      <View style={styles.center}>
        <Text>No data found.</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Patient Information</Text>
          <Text style={styles.headerSub}>Complete your booking details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.layoutWrapper, isDesktop && styles.desktopRow]}>
          {/* LEFT: SUMMARY */}
          <View style={[styles.summarySidebar, isDesktop && { flex: 0.7 }]}>
            <Text style={styles.sidebarTitle}>Appointment Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.docInfoRow}>
                <View style={styles.docIcon}>
                  <Ionicons name="person" size={24} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.sumDocName}>{doctorName}</Text>
                  <Text style={styles.sumDocDept}>{department}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.slotDetail}>
                <Ionicons name="calendar-clear" size={18} color="#64748B" />
                <Text style={styles.slotText}>{date}</Text>
              </View>
              <View style={styles.slotDetail}>
                <Ionicons name="time" size={18} color="#64748B" />
                <Text style={styles.slotText}>{timeSlot}</Text>
              </View>
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeLabel}>Consultation Fee</Text>
                <Text style={styles.feeBadgeValue}>₹{consultantFees}</Text>
              </View>
            </View>
          </View>

          {/* RIGHT: FORM */}
          <View style={[styles.formContainer, isDesktop && { flex: 1.3 }]}>
            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* BUTTON TO SHOW/HIDE ADD PATIENT FORM */}
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setShowAddPatientForm(!showAddPatientForm)}
            >
              <Text style={styles.toggleBtnText}>
                {showAddPatientForm ? "Hide Add Patient" : "Add New Patient"}
              </Text>
            </TouchableOpacity>

            {/* ADD PATIENT FORM */}
            {showAddPatientForm && (
              <PatientForm
                fullName={fullName}
                setFullName={setFullName}
                age={age}
                setAge={setAge}
                phone={phone}
                setPhone={setPhone}
                email={email}
                setEmail={setEmail}
                gender={gender}
                setGender={setGender}
                bloodGroup={bloodGroup}
                setBloodGroup={setBloodGroup}
                city={city}
                setCity={setCity}
                pin={pin}
                setPin={setPin}
                parentName={parentName}
                setParentName={setParentName}
                setErrorMsg={setErrorMsg}
                setShowAddPatientForm={setShowAddPatientForm}
                patientId={patientId}
                setPatientId={setPatientId}
                setExistingPatients={setExistingPatients}
                loading={loading}
                setLoading={setLoading}
              />
            )}

            {/* EXISTING PATIENTS LIST */}
            {!showAddPatientForm && existingPatients.length > 0 && (
              <ExistingPatientsList
                patients={existingPatients}
                selectedIndex={selectedPatientIndex}
                setSelectedIndex={setSelectedPatientIndex}
                setFullName={setFullName}
                setAge={setAge}
                setPhone={setPhone}
                setGender={setGender}
                setBloodGroup={setBloodGroup}
                setCity={setCity}
                setPin={setPin}
                setEmail={setEmail}
                setParentName={setParentName}
                setPatientId={setPatientId}
              />
            )}

            {/* REASON + CONFIRM */}
            {!showAddPatientForm && (
              <View style={styles.inputSection}>
                <Text style={styles.fieldLabel}>Reason for Visit</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Briefly describe your symptoms..."
                  multiline
                  numberOfLines={4}
                  value={reason}
                  onChangeText={setReason}
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleBooking}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Confirm Appointment</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ===================== PATIENT FORM COMPONENT =====================
function PatientForm({
  fullName,
  setFullName,
  age,
  setAge,
  phone,
  setPhone,
  email,
  setEmail,
  gender,
  setGender,
  bloodGroup,
  setBloodGroup,
  city,
  setCity,
  pin,
  setPin,
  parentName,
  setParentName,
  setErrorMsg,
  setShowAddPatientForm,
  patientId,
  setPatientId,
  setExistingPatients,
  loading,
  setLoading,
}) {
  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleAddPatient = async () => {
    setErrorMsg("");
    if (!fullName || !age || !phone || !gender) {
      setErrorMsg("Please fill all required patient details.");
      return;
    }

    const payload = {
      patientId,
      fullName,
      age: parseInt(age, 10),
      gender,
      phone,
      email,
      bloodGroup,
      city,
      pin,
      parentName,
    };

    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/book-appointment/patient/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showAlert(
          "Patient Added",
          `${data.patient.full_name} has been added successfully with Patient ID ${data.patient.patient_id}.`
        );
        setShowAddPatientForm(false);
        setPatientId(data.patient.patient_id);
        setExistingPatients(prev => [...prev, data.patient]);
      } else {
        setErrorMsg(data.message || "Failed to add patient");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg("Network error: Unable to add patient");
      console.error(err);
    }
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionLabel}>Add Patient</Text>

      <Text style={styles.fieldLabel}>Full Name</Text>
      <TextInput style={styles.textInput} placeholder="John Doe" value={fullName} onChangeText={setFullName} />

      <Text style={styles.fieldLabel}>Age</Text>
      <TextInput style={styles.textInput} placeholder="25" keyboardType="numeric" value={age} onChangeText={setAge} />

      <Text style={styles.fieldLabel}>Phone Number</Text>
      <View style={styles.phoneInputContainer}>
        <View style={styles.prefixContainer}>
          <Text style={styles.prefixText}>+91</Text>
        </View>
        <TextInput
          style={styles.flexInput}
          placeholder="00000 00000"
          keyboardType="numeric"
          maxLength={10}
          value={phone}
          onChangeText={text => setPhone(text.replace(/[^0-9]/g, ""))}
        />
      </View>

      <Text style={styles.fieldLabel}>Blood Group</Text>
      <TextInput style={styles.textInput} placeholder="O+ / AB-" value={bloodGroup} onChangeText={setBloodGroup} />

      <Text style={styles.fieldLabel}>Gender</Text>
      <View style={styles.chipGroup}>
        {["Male", "Female", "Other"].map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, gender === item && styles.activeChip]}
            onPress={() => setGender(item)}
          >
            <Text style={[styles.chipText, gender === item && styles.activeChipText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>City</Text>
      <TextInput style={styles.textInput} placeholder="City" value={city} onChangeText={setCity} />

      <Text style={styles.fieldLabel}>PIN</Text>
      <TextInput style={styles.textInput} placeholder="PIN Code" keyboardType="numeric" value={pin} onChangeText={setPin} />

      <Text style={styles.fieldLabel}>Email</Text>
      <TextInput style={styles.textInput} placeholder="Email" value={email} onChangeText={setEmail} />

      <Text style={styles.fieldLabel}>Parent / Guardian Name</Text>
      <TextInput style={styles.textInput} placeholder="Parent / Guardian Name" value={parentName} onChangeText={setParentName} />

      <TouchableOpacity style={[styles.submitBtn, { marginTop: 15 }]} onPress={handleAddPatient}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add Patient</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ===================== EXISTING PATIENTS LIST COMPONENT =====================
function ExistingPatientsList({ patients, selectedIndex, setSelectedIndex, setFullName, setAge, setPhone, setGender, setBloodGroup, setCity, setPin, setEmail, setParentName, setPatientId }) {
  return (
    <View style={styles.inputSection}>
      <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>Select Existing Patient</Text>
      {patients.map((patient, index) => (
        <TouchableOpacity
          key={patient.patient_id}
          style={[styles.existingPatientCard, selectedIndex === index && styles.selectedPatientCard]}
          onPress={() => {
            setSelectedIndex(index);
            setFullName(patient.full_name);
            setAge(String(patient.age));
            setPhone(patient.phone);
            setGender(patient.gender);
            setBloodGroup(patient.blood_group || "");
            setCity(patient.city || "");
            setPin(patient.pin || "");
            setEmail(patient.email || "");
            setParentName(patient.parent_name || "");
            setPatientId(patient.patient_id);
          }}
        >
          <Text style={styles.patientName}>{patient.full_name}</Text>
          <Text style={styles.patientDetails}>
            Age: {patient.age} | Gender: {patient.gender} | Phone: {patient.phone}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { height: 90, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 25, borderBottomWidth: 1, borderColor: "#E2E8F0", paddingTop: Platform.OS === 'ios' ? 40 : 0 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B" },
  scrollContent: { padding: 25 },
  layoutWrapper: { gap: 30 },
  desktopRow: { flexDirection: "row", alignItems: "flex-start" },
  toggleBtn: { backgroundColor: "#3B82F6", padding: 12, borderRadius: 12, marginBottom: 15 },
  toggleBtnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  summarySidebar: {},
  sidebarTitle: { fontSize: 16, fontWeight: "700", color: "#475569", marginBottom: 15 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  docInfoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 15 },
  docIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center" },
  sumDocName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  sumDocDept: { fontSize: 13, color: "#64748B" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  slotDetail: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  slotText: { fontSize: 14, color: "#475569", fontWeight: "500" },
  feeBadge: { marginTop: 15, backgroundColor: "#F0FDF4", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  feeBadgeLabel: { fontSize: 12, color: "#166534", fontWeight: "600" },
  feeBadgeValue: { fontSize: 16, color: "#166534", fontWeight: "800" },
  formContainer: { backgroundColor: "#fff", borderRadius: 24, padding: 25, borderWidth: 1, borderColor: "#E2E8F0" },
  inputSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#3B82F6", textTransform: "uppercase", marginBottom: 15, letterSpacing: 1 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#475569", marginBottom: 8 },
  textInput: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, padding: 14, fontSize: 15, color: "#1E293B", outlineStyle: "none" },
  textArea: { height: 100, textAlignVertical: "top" },
  chipGroup: { flexDirection: "row", gap: 10 },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center", backgroundColor: "#fff" },
  activeChip: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  chipText: { fontWeight: "600", color: "#64748B" },
  activeChipText: { color: "#fff" },
  submitBtn: { backgroundColor: "#3B82F6", padding: 18, borderRadius: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 10 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errorBox: { backgroundColor: "#FEF2F2", padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#FEE2E2" },
  errorText: { color: "#DC2626", fontSize: 13, fontWeight: "500", textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  phoneInputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, overflow: "hidden" },
  prefixContainer: { paddingHorizontal: 12, paddingVertical: 14, backgroundColor: "#F1F5F9", borderRightWidth: 1, borderRightColor: "#E2E8F0" },
  prefixText: { fontSize: 15, fontWeight: "700", color: "#64748B" },
  flexInput: { flex: 1, padding: 14, fontSize: 15, color: "#1E293B", outlineStyle: "none" },
  existingPatientCard: { backgroundColor: "#F8FAFC", padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  selectedPatientCard: { borderColor: "#3B82F6", borderWidth: 2 },
  patientName: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  patientDetails: { fontSize: 13, color: "#64748B", marginTop: 4 },
});