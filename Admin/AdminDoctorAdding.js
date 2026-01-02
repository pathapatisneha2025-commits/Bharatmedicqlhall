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
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { storeDoctorId } from "../utils/storage";

export default function AdminDoctorFeeScreen() {
  const navigation = useNavigation();

  const [doctorName, setDoctorName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [consultanceFee, setConsultanceFee] = useState("");
  const [email, setEmail] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null); // <-- track edit mode

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

  // Add or Update doctor based on editingDoctorId
  const handleSaveDoctor = async () => {
    if (
      !doctorName ||
      !department ||
      !role ||
      !gender ||
      !experience ||
      !description ||
      !consultanceFee ||
      !email
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
      email,
    };

    try {
      let response;
      if (editingDoctorId) {
        // Update doctor
        response = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/consultancefee/update/${editingDoctorId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Add new doctor
        response = await fetch(
          "https://hospitaldatabasemanagement.onrender.com/consultancefee/add",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success",
          editingDoctorId ? "Doctor updated successfully" : "Doctor added successfully"
        );
        // Reset form
        setDoctorName("");
        setDepartment("");
        setRole("");
        setGender("");
        setExperience("");
        setDescription("");
        setConsultanceFee("");
        setEmail("");
        setEditingDoctorId(null); // reset edit mode
        fetchDoctors();
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to save doctor");
    }
  };

  const handleUpdateDoctor = (doctor) => {
    setDoctorName(doctor.doctor_name);
    setDepartment(doctor.department);
    setRole(doctor.role);
    setGender(doctor.gender);
    setExperience(doctor.experience.toString());
    setDescription(doctor.description);
    setConsultanceFee(doctor.consultance_fee.toString());
    setEmail(doctor.email);
    setEditingDoctorId(doctor.id); // enable edit mode
  };

  const handleDeleteDoctor = async (id) => {
    try {
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/consultancefee/${id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        Alert.alert("Deleted", "Doctor removed successfully");
        fetchDoctors();
      } else {
        Alert.alert("Error", "Failed to delete doctor");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to delete doctor");
    }
  };
   if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading doctors...</Text>
      </View>
    );
  }

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
        <TouchableOpacity
          onPress={() => handleUpdateDoctor(item)}
          style={{ marginRight: 15 }}
        >
          <MaterialIcons name="edit" size={24} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteDoctor(item.id)}>
          <MaterialIcons name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Input with Icon
  const InputWithIcon = ({ icon, placeholder, value, onChangeText, keyboardType }) => (
    <View style={styles.inputContainer}>
      <FontAwesome name={icon} size={20} color="#2196F3" style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        placeholderTextColor="#555"
      />
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
        <Text style={styles.heading}>
          {editingDoctorId ? "Edit Doctor Consultation Fee" : "Add Doctor Consultation Fee"}
        </Text>

        <InputWithIcon icon="user" placeholder="Doctor Name" value={doctorName} onChangeText={setDoctorName} />
        <InputWithIcon icon="envelope" placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <InputWithIcon icon="stethoscope" placeholder="Department" value={department} onChangeText={setDepartment} />
        <InputWithIcon icon="id-badge" placeholder="Role" value={role} onChangeText={setRole} />
        <InputWithIcon icon="venus-mars" placeholder="Gender" value={gender} onChangeText={setGender} />
        <InputWithIcon icon="calendar" placeholder="Experience (years)" keyboardType="numeric" value={experience} onChangeText={setExperience} />
        <InputWithIcon icon="file-text" placeholder="Description" value={description} onChangeText={setDescription} />
        <InputWithIcon icon="money" placeholder="Consultation Fee" keyboardType="numeric" value={consultanceFee} onChangeText={setConsultanceFee} />

        <TouchableOpacity style={styles.button} onPress={handleSaveDoctor}>
          <Text style={styles.buttonText}>
            {editingDoctorId ? "Update Doctor Fee" : "Add Doctor Fee"}
          </Text>
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
  container: { flex: 1, backgroundColor: "#e3f2fd" , marginTop: 30},
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
  heading: { fontSize: 20, fontWeight: "bold", marginVertical: 15, textAlign: "center", color: "#1565C0" },
  subHeading: { fontSize: 18, fontWeight: "600", marginVertical: 15, color: "#1976D2" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#90caf9",
    elevation: 2,
  },
  input: { flex: 1, height: 50, fontSize: 16, color: "#000" },
  button: { backgroundColor: "#2196F3", padding: 16, borderRadius: 12, alignItems: "center", marginVertical: 10, elevation: 2 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  doctorItem: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#bbdefb", elevation: 2 },
  doctorName: { fontWeight: "bold", fontSize: 17, marginBottom: 5, color: "#0d47a1" },
  fee: { marginTop: 5, fontWeight: "600", color: "#1976D2" },
  actionRow: { flexDirection: "row", marginTop: 12 },
});
