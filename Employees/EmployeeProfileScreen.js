import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId,clearStorage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  const fetchEmployeeDetails = async () => {
    try {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        Alert.alert("Error", "Employee ID not found. Please log in again.");
        navigation.navigate("Login");
        return;
      }

      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/employee/${employeeId}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployee(data.employee);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch employee details");
      }
    } catch (error) {
      Alert.alert("Network Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
const handleLogout = async () => {
    await clearStorage();
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }],
    });
  };
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#555", fontSize: 16 }}>No employee data found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 🔙 Back Button */}
      <View style={styles.topBar}>
        <Ionicons
          name="arrow-back"
          size={28}
          color="#1E88E5"
          onPress={() => navigation.goBack()}
        />
      </View>

      {/* 🧑‍⚕️ Profile Header */}
      <View style={styles.header}>
        <Image source={{ uri: employee.image }} style={styles.profileImage} />
        <Text style={styles.name}>{employee.full_name}</Text>
        <Text style={styles.role}>{employee.role}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate("editemployeeprofilescreen", { employee })
          }
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* 📋 Employee Info */}
      <View style={styles.infoContainer}>
        <Section title="Basic Information" icon="person-outline">
          <InfoRow label="Email" value={employee.email} />
          <InfoRow label="Mobile" value={employee.mobile} />
          <InfoRow label="Department" value={employee.department} />
          <InfoRow label="Age" value={`${employee.age} yrs`} />
          <InfoRow label="Blood Group" value={employee.blood_group} />
          <InfoRow label="Experience" value={`${employee.experience} years`} />
          <InfoRow label="DOB" value={new Date(employee.dob).toDateString()} />
          <InfoRow label="Status" value={employee.status} />
        </Section>

        <Section title="Job Details" icon="briefcase-outline">
          <InfoRow label="Job Description" value={employee.job_description} />
          <InfoRow label="Employment Type" value={employee.employment_type} />
          <InfoRow label="Category" value={employee.category} />
          <InfoRow label="Monthly Salary" value={`₹${employee.monthly_salary}`} />
          <InfoRow label="Date of Joining" value={new Date(employee.date_of_joining).toDateString()} />
        </Section>

        <Section title="Schedule" icon="time-outline">
          <InfoRow label="Schedule In" value={employee.schedule_in} />
          <InfoRow label="Schedule Out" value={employee.schedule_out} />
          <InfoRow label="Break In" value={employee.break_in} />
          <InfoRow label="Break Out" value={employee.break_out} />

        </Section>

        <Section title="Bank Information" icon="card-outline">
          <InfoRow label="Bank Name" value={employee.bank_name} />
          <InfoRow label="Account Number" value={employee.account_number} />
          <InfoRow label="IFSC Code" value={employee.ifsc} />
          <InfoRow label="Branch" value={employee.branch_name} />
        </Section>

        <Section title="Address" icon="location-outline">
          <InfoRow
            label="Temporary Address"
            value={`${employee.temporary_addresses[0].street}, ${employee.temporary_addresses[0].city}, ${employee.temporary_addresses[0].state} - ${employee.temporary_addresses[0].pincode}`}
          />
          <InfoRow
            label="Permanent Address"
            value={`${employee.permanent_addresses[0].street}, ${employee.permanent_addresses[0].city}, ${employee.permanent_addresses[0].state} - ${employee.permanent_addresses[0].pincode}`}
          />
        </Section>
      </View>

        {/* ✅ Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
    
  );
}

// Reusable Section Component
const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#1E88E5" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Reusable Info Row Component
const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FB" },
  topBar: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center", margin: 16 },
  header: { alignItems: "center", marginTop: 10, marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10, borderWidth: 2, borderColor: "#1E88E5" },
  name: { fontSize: 22, fontWeight: "700", color: "#1E88E5", textAlign: "center" },
  role: { fontSize: 16, color: "#666", marginBottom: 10, textAlign: "center" },
  editButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E88E5", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 25, marginTop: 8 },
  editButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 6 },
  infoContainer: { paddingHorizontal: 20, marginBottom: 30 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginLeft: 6, color: "#1E88E5" },
  sectionContent: {},
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  label: { fontSize: 15, fontWeight: "600", color: "#444" },
  value: { fontSize: 15, color: "#555", maxWidth: "55%", textAlign: "right" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F8FB" },
   logoutButton: {
  
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
