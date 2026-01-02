// AdminDoctorFeeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { storeDoctorId } from "../utils/storage"; // ✅ import at top

export default function AdminDoctorFeeScreen() {
  const navigation = useNavigation();

  const [doctorName, setDoctorName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [consultanceFee, setConsultanceFee] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
const [email, setEmail] = useState("");

  // Fetch all doctors
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/consultancefee/all"
      );
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Add a new doctor
  const handleAddDoctor = async () => {
    if (
      !doctorName ||
      !department ||
      !role ||
      !gender ||
      !experience ||
      !description ||
      !consultanceFee||
        !email // ✅ validate email

    ) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const payload = {
      doctor_name: doctorName,
      department,
      role,
      gender,
      experience: parseInt(experience),
      description,
      consultance_fee: parseFloat(consultanceFee),
        email // ✅ include email

    };

    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/consultancefee/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data?.doctor) {
        const doctor=data.doctor;
         // ✅ Store doctor ID
      await storeDoctorId(doctor.id);
        Alert.alert("Success", "Doctor consultation fee added successfully");
        setDoctorName("");
        setDepartment("");
        setRole("");
        setGender("");
        setExperience("");
        setDescription("");
        setConsultanceFee("");
        fetchDoctors();
        setEmail(""); // ✅ reset email

      } else {
        Alert.alert("Error", data.message || "Failed to add doctor");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to add doctor");
    }
  };

  // Update doctor
  const handleUpdateDoctor = async (doctor) => {
    Alert.prompt(
      "Update Fee",
      `Update consultation fee for ${doctor.doctor_name}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async (fee) => {
            if (!fee) return;
            try {
              const payload = { ...doctor, consultance_fee: parseFloat(fee) };
              const response = await fetch(
                `https://hospitaldatabasemanagement.onrender.com/consultancefee/update/${doctor.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }
              );
              const data = await response.json();
              if (response.ok) {
                Alert.alert("Success", "Doctor fee updated successfully");
                fetchDoctors();
              } else {
                Alert.alert("Error", data.message || "Failed to update doctor fee");
              }
            } catch (error) {
              console.log(error);
              Alert.alert("Error", "Failed to update doctor fee");
            }
          },
        },
      ],
      "plain-text",
      `${doctor.consultance_fee}`
    );
  };

  // Delete doctor
  const handleDeleteDoctor = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this doctor?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(
              `https://hospitaldatabasemanagement.onrender.com/consultancefee/delete/${id}`,
              { method: "DELETE" }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert("Success", data.message || "Doctor deleted successfully");
              fetchDoctors();
            } else {
              Alert.alert("Error", data.message || "Failed to delete doctor");
            }
          } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to delete doctor");
          }
        },
      },
    ]);
  };

  const renderDoctorItem = ({ item }) => (
    <View style={styles.doctorItem}>
      <Text style={styles.doctorName}>{item.doctor_name}</Text>
      <Text>Department: {item.department}</Text>
      <Text>Role: {item.role}</Text>
      <Text>Gender: {item.gender}</Text>
      <Text>Experience: {item.experience} years</Text>
      <Text>Description: {item.description}</Text>
      <Text style={styles.fee}>Consultation Fee: ₹{item.consultance_fee}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => handleUpdateDoctor(item)} style={{ marginRight: 15 }}>
          <MaterialIcons name="edit" size={24} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteDoctor(item.id)}>
          <MaterialIcons name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Consultation Fees</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.heading}>Add Doctor Consultation Fee</Text>

        <TextInput style={styles.input} placeholder="Doctor Name" value={doctorName} onChangeText={setDoctorName} />
    <TextInput style={styles.input}placeholder="Email"keyboardType="email-address"value={email} onChangeText={setEmail}
/>
        <TextInput style={styles.input} placeholder="Department" value={department} onChangeText={setDepartment} />
        <TextInput style={styles.input} placeholder="Role" value={role} onChangeText={setRole} />
        <TextInput style={styles.input} placeholder="Gender" value={gender} onChangeText={setGender} />
        <TextInput
          style={styles.input}
          placeholder="Experience (in years)"
          keyboardType="numeric"
          value={experience}
          onChangeText={setExperience}
        />
        <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
        <TextInput
          style={styles.input}
          placeholder="Consultation Fee"
          keyboardType="numeric"
          value={consultanceFee}
          onChangeText={setConsultanceFee}
        />

        <TouchableOpacity style={styles.button} onPress={handleAddDoctor}>
          <Text style={styles.buttonText}>Add Doctor Fee</Text>
        </TouchableOpacity>

        <Text style={styles.subHeading}>All Doctors</Text>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Loading doctors...</Text>
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDoctorItem}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e3f2fd" }, // Light blue background
  header: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
  },
  backButton: { marginRight: 10 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  scrollView: { padding: 20, paddingBottom: 50 },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
    textAlign: "center",
    color: "#1565C0",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 15,
    color: "#1976D2",
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#90caf9",
    elevation: 1,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
    elevation: 2,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  doctorItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bbdefb",
    elevation: 2,
  },
  doctorName: { fontWeight: "bold", fontSize: 17, marginBottom: 5, color: "#0d47a1" },
  fee: { marginTop: 5, fontWeight: "600", color: "#1976D2" },
  actionRow: { flexDirection: "row", marginTop: 12 },
});
