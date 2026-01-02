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
import { getEmployeeId, removeEmployeeId ,clearStorage} from "../utils/storage"; // ✅ Added removeEmployeeId
import { useNavigation } from "@react-navigation/native";

export default function DeliveryBoyProfileScreen() {
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
        <Text style={{ color: "#555", fontSize: 16 }}>
          No employee data found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <Ionicons
          name="arrow-back"
          size={28}
          color="#1E88E5"
          onPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.header}>
        <Image source={{ uri: employee.image }} style={styles.profileImage} />
        <Text style={styles.name}>{employee.full_name}</Text>
        <View style={styles.roleContainer}>
          <Ionicons name="bicycle-outline" size={18} color="#1E88E5" style={{ marginRight: 6 }} />
          <Text style={styles.role}>{employee.role}</Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("DeliverBoyEdit", { employee })}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <InfoSection
          title="Basic Information"
          icon="person-outline"
          data={[
            { label: "Email", value: employee.email },
            { label: "Mobile", value: employee.mobile },
            { label: "Department", value: employee.department },
            { label: "Age", value: `${employee.age} yrs` },
            { label: "Blood Group", value: employee.blood_group },
            { label: "Experience", value: `${employee.experience} years` },
            { label: "DOB", value: new Date(employee.dob).toDateString() },
            { label: "Status", value: employee.status },
          ]}
        />
        {/* Other Info Sections */}
        <InfoSection title="Job Details" icon="briefcase-outline" data={[
          { label: "Job Description", value: employee.job_description },
          { label: "Employment Type", value: employee.employment_type },
          { label: "Category", value: employee.category },
          { label: "Monthly Salary", value: `₹${employee.monthly_salary}` },
          { label: "Date of Joining", value: new Date(employee.date_of_joining).toDateString() },
        ]}/>
        <InfoSection title="Schedule" icon="time-outline" data={[
          { label: "Schedule In", value: employee.schedule_in },
          { label: "Schedule Out", value: employee.schedule_out },
          { label: "Break In", value: employee.break_in },
          { label: "Break Out", value: employee.break_out },
        ]}/>
        <InfoSection title="Bank Information" icon="card-outline" data={[
          { label: "Bank Name", value: employee.bank_name },
          { label: "Account Number", value: employee.account_number },
          { label: "IFSC Code", value: employee.ifsc },
          { label: "Branch", value: employee.branch_name },
        ]}/>
        <InfoSection title="Address" icon="home-outline" data={[
          { label: "Temporary Address", value: `${employee.temporary_addresses[0].street}, ${employee.temporary_addresses[0].city}, ${employee.temporary_addresses[0].state} - ${employee.temporary_addresses[0].pincode}` },
          { label: "Permanent Address", value: `${employee.permanent_addresses[0].street}, ${employee.permanent_addresses[0].city}, ${employee.permanent_addresses[0].state} - ${employee.permanent_addresses[0].pincode}` },
        ]}/>

        {/* ✅ Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const InfoSection = ({ title, icon, data }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#1E88E5" style={{ marginRight: 8 }} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {data.map((item, index) => (
      <View key={index} style={styles.row}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.value}>{item.value || "N/A"}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FB" },
  topBar: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center", margin: 16 },
  header: { alignItems: "center", marginTop: 10, marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  name: { fontSize: 22, fontWeight: "700", color: "#1E88E5", textAlign: "center" },
  role: { fontSize: 16, color: "#666", marginBottom: 10, textAlign: "center" },
  editButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E88E5", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 25, marginTop: 8 },
  editButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 6 },
  infoContainer: { paddingHorizontal: 20, marginBottom: 30 },
  section: { backgroundColor: "#fff", borderRadius: 10, padding: 15, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.6, borderColor: "#eee" },
  label: { fontSize: 15, fontWeight: "600", color: "#444" },
  value: { fontSize: 15, color: "#555", maxWidth: "60%", textAlign: "right" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F8FB" },
  roleContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
