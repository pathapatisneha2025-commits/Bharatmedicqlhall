// screens/PaymentScreen.js
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
} from "react-native";
import { RadioButton } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // Get appointment passed from booking screen
  const passedAppointment = route.params?.appointment;

  const [appointment, setAppointment] = useState(passedAppointment || null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi"); // "upi" or "cash"
  const [upiApp, setUpiApp] = useState("Google Pay");

  // Editable form fields
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    reason: "",
    date: "",
    timeSlot: "",
    consultantFees: "",
    patientPhone: "",
  });

  // ------------------ Fetch appointment by doctorId (GET API) ------------------
  const fetchAppointment = async (doctorId) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/book-appointment/doctor/${doctorId}`
      );
      const data = await res.json();
      setLoading(false);

      if (Array.isArray(data) && data.length > 0) {
        const appt = data[0];
        setAppointment(appt);
        setForm({
          name: appt.name || "",
          age: String(appt.age || ""),
          gender: appt.gender || "",
          bloodGroup: appt.bloodgroup || "",
          reason: appt.reason || "",
          date: appt.date?.split("T")[0] || "",
          timeSlot: appt.timeslot || "",
          consultantFees: appt.consultantfees || "",
          patientPhone: appt.patientphone || "",
        });
      } else {
        Alert.alert("No Appointment", "No appointment found for this doctor.");
      }
    } catch (err) {
      setLoading(false);
      console.error("Fetch Error:", err);
      Alert.alert("Error", "Failed to fetch appointment details.");
    }
  };

  useEffect(() => {
    if (passedAppointment?.doctorId || passedAppointment?.doctorid) {
      const doctorId = passedAppointment.doctorId || passedAppointment.doctorid;
      fetchAppointment(doctorId);
    } else if (passedAppointment) {
      setAppointment(passedAppointment);
      setForm({
        name: passedAppointment.name || "",
        age: String(passedAppointment.age || ""),
        gender: passedAppointment.gender || "",
        bloodGroup: passedAppointment.bloodgroup || "",
        reason: passedAppointment.reason || "",
        date: passedAppointment.date?.split("T")[0] || "",
        timeSlot: passedAppointment.timeslot || "",
        consultantFees: passedAppointment.consultantfees || "",
        patientPhone: passedAppointment.patientphone || "",
      });
    }
  }, [passedAppointment]);

  // ------------------ Update appointment (PUT API) ------------------
  const updateAppointment = async () => {
    if (!appointment?.id) {
      Alert.alert("Error", "Appointment ID not found.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/book-appointment/update/${appointment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doctorId: appointment.doctorid,
            doctorName: appointment.doctorname,
            yearsOfExperience: appointment.yearsofexperience,
            department: appointment.department,
            consultantFees: parseFloat(form.consultantFees),
            date: form.date,
            timeSlot: form.timeSlot,
            patientId: appointment.patientid,
            name: form.name,
            age: parseInt(form.age),
            gender: form.gender,
            bloodGroup: form.bloodGroup,
            reason: form.reason,
            patientPhone: form.patientPhone,
          }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("✅ Success", data.message || "Appointment updated successfully!");
        setAppointment(data.appointment);
        setIsEditing(false);
        setForm({
          name: data.appointment.name || "",
          age: String(data.appointment.age || ""),
          gender: data.appointment.gender || "",
          bloodGroup: data.appointment.bloodgroup || "",
          reason: data.appointment.reason || "",
          date: data.appointment.date?.split("T")[0] || "",
          timeSlot: data.appointment.timeslot || "",
          consultantFees: data.appointment.consultantfees || "",
          patientPhone: data.appointment.patientphone || "",
        });
      } else {
        Alert.alert("Update Failed", data.message || "Could not update appointment.");
      }
    } catch (err) {
      setLoading(false);
      console.error("Update Error:", err);
      Alert.alert("Error", "Failed to update appointment.");
    }
  };

  const platformFee = 25;
  const totalAmount = parseFloat(form.consultantFees || 0) + platformFee;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.center}>
        <Text>No appointment found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Payment</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={{ marginLeft: "auto" }}
        >
          <Icon name="pencil" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Appointment Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appointment Summary</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Patient Name"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Age"
              keyboardType="numeric"
              value={form.age}
              onChangeText={(t) => setForm({ ...form, age: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Gender"
              value={form.gender}
              onChangeText={(t) => setForm({ ...form, gender: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Blood Group"
              value={form.bloodGroup}
              onChangeText={(t) => setForm({ ...form, bloodGroup: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Reason"
              value={form.reason}
              onChangeText={(t) => setForm({ ...form, reason: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              value={form.date}
              onChangeText={(t) => setForm({ ...form, date: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Time Slot"
              value={form.timeSlot}
              onChangeText={(t) => setForm({ ...form, timeSlot: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Consultation Fees"
              keyboardType="numeric"
              value={form.consultantFees.toString()}
              onChangeText={(t) => setForm({ ...form, consultantFees: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Patient Phone"
              keyboardType="phone-pad"
              value={form.patientPhone}
              onChangeText={(t) => setForm({ ...form, patientPhone: t })}
            />

            <TouchableOpacity style={styles.updateBtn} onPress={updateAppointment}>
              <Text style={styles.updateText}>Update Appointment</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Doctor</Text>
              <Text style={styles.value}>{appointment.doctorname}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Patient</Text>
              <Text style={styles.value}>{appointment.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date & Time</Text>
              <Text style={styles.value}>
                {form.date} | {form.timeSlot}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>Hospital Visit</Text> {/* Changed type */}
            </View>
          </>
        )}
      </View>

      {/* Bill Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bill Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Consultation Fee</Text>
          <Text style={styles.value}>₹{form.consultantFees || appointment.consultantfees}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Platform Fee</Text>
          <Text style={styles.value}>₹{platformFee}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={[styles.label, { fontWeight: "bold" }]}>Total Amount</Text>
          <Text style={[styles.value, { fontWeight: "bold" }]}>₹{totalAmount}</Text>
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Payment Method</Text>

        <View style={styles.radioRow}>
          <RadioButton
            value="upi"
            status={paymentMethod === "upi" ? "checked" : "unchecked"}
            onPress={() => setPaymentMethod("upi")}
          />
          <Text style={styles.label}>UPI</Text>

          <RadioButton
            value="cash"
            status={paymentMethod === "cash" ? "checked" : "unchecked"}
            onPress={() => setPaymentMethod("cash")}
          />
          <Text style={styles.label}>Cash in Hospital</Text>
        </View>

        {paymentMethod === "upi" && (
          <>
            <Text style={[styles.label, { marginBottom: 10, marginTop: 5 }]}>
              Choose UPI App:
            </Text>

            <View style={styles.upiRow}>
              {["Google Pay", "PhonePe", "Paytm", "Amazon Pay"].map((app) => (
                <TouchableOpacity
                  key={app}
                  style={[styles.upiButton, upiApp === app && styles.upiButtonSelected]}
                  onPress={() => setUpiApp(app)}
                >
                  <Text style={[styles.upiText, upiApp === app && styles.upiTextSelected]}>
                    {app}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Proceed to Payment */}
      <TouchableOpacity
        style={styles.paymentButton}
        onPress={() => navigation.navigate("bookconfimationop", { appointment, paymentMethod })}
      >
        <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16,marginTop:30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerText: { fontSize: 20, fontWeight: "600", marginLeft: 10 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 15, color: "#555" },
  value: { fontSize: 15, color: "#111" },
  separator: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginVertical: 8 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  upiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  upiButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#F1F5F9",
  },
  upiButtonSelected: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  upiText: { fontSize: 14, color: "#333" },
  upiTextSelected: { color: "#FFF", fontWeight: "600" },
  paymentButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 30,
  },
  paymentButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
  },
  updateBtn: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  updateText: { color: "#fff", fontWeight: "600" },
});
