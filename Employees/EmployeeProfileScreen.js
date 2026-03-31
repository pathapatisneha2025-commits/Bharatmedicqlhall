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
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId, clearStorage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && SCREEN_WIDTH >= 1024;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  const fetchEmployeeDetails = async () => {
    try {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        showAlert("Error", "Employee ID not found. Please log in again.");
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
        showAlert("Error", data.message || "Failed to fetch employee details");
      }
    } catch (error) {
      showAlert("Network Error", error.message || "Something went wrong");
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
        <Text>No employee data found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Back */}
      <View style={styles.topBar}>
        <Ionicons
          name="arrow-back"
          size={28}
          color="#1E88E5"
          onPress={() => navigation.navigate("Dashboard")}
        />
      </View>

      {/* Header */}
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

      {/* INFO GRID */}
      <View style={styles.infoContainer}>
        <Section isDesktop={isDesktop} title="Basic Information" icon="person-outline">
          <InfoRow label="Email" value={employee.email} />
          <InfoRow label="Mobile" value={employee.mobile} />
          <InfoRow label="Department" value={employee.department} />
          <InfoRow label="Age" value={`${employee.age} yrs`} />
          <InfoRow label="Blood Group" value={employee.blood_group} />
          <InfoRow label="Experience" value={`${employee.experience} years`} />
          <InfoRow label="DOB" value={new Date(employee.dob).toDateString()} />
          <InfoRow label="Status" value={employee.status} />
        </Section>

        <Section isDesktop={isDesktop} title="Job Details" icon="briefcase-outline">
          <InfoRow label="Job Description" value={employee.job_description} />
          <InfoRow label="Employment Type" value={employee.employment_type} />
          <InfoRow label="Category" value={employee.category} />
          <InfoRow label="Monthly Salary" value={`₹${employee.monthly_salary}`} />
          <InfoRow
            label="Date of Joining"
            value={new Date(employee.date_of_joining).toDateString()}
          />
        </Section>

        <Section isDesktop={isDesktop} title="Schedule" icon="time-outline">
          <InfoRow label="Schedule In" value={employee.schedule_in} />
          <InfoRow label="Schedule Out" value={employee.schedule_out} />
          <InfoRow label="Break In" value={employee.break_in} />
          <InfoRow label="Break Out" value={employee.break_out} />
        </Section>

        <Section isDesktop={isDesktop} title="Bank Information" icon="card-outline">
          <InfoRow label="Bank Name" value={employee.bank_name} />
          <InfoRow label="Account Number" value={employee.account_number} />
          <InfoRow label="IFSC Code" value={employee.ifsc} />
          <InfoRow label="Branch" value={employee.branch_name} />
        </Section>

        <Section isDesktop={isDesktop} title="Address" icon="location-outline">
          <InfoRow
            label="Temporary Address"
            value={`${employee.temporary_addresses[0].street}, ${employee.temporary_addresses[0].city}`}
          />
          <InfoRow
            label="Permanent Address"
            value={`${employee.permanent_addresses[0].street}, ${employee.permanent_addresses[0].city}`}
          />
        </Section>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- Components ---------- */

const Section = ({ title, icon, children, isDesktop }) => (
  <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#1E88E5" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "N/A"}</Text>
  </View>
);


/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC", // Light gray background like the login screen
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  topBar: { 
    padding: 16, 
    backgroundColor: "#fff" 
  },
  header: { 
    alignItems: "center", 
    backgroundColor: "#fff", 
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#0D6EFD", // Matching your primary blue
    marginBottom: 12,
  },
  name: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1E293B", // Darker slate for better readability
    letterSpacing: 0.5
  },
  role: { 
    fontSize: 15, 
    color: "#64748B", 
    fontWeight: "500",
    marginBottom: 15 
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#0D6EFD", // Primary Blue from Screenshot
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: "center",
  },
  editButtonText: { 
    color: "#fff", 
    marginLeft: 8, 
    fontWeight: "700",
    fontSize: 14
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  section: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20, // More rounded like your login inputs
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionDesktop: {
    width: "48%",
  },
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8
  },
  sectionTitle: { 
    marginLeft: 10, 
    fontWeight: "800", 
    color: "#0D6EFD",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  label: { 
    fontWeight: "600", 
    color: "#64748B", 
    fontSize: 14 
  },
  value: { 
    maxWidth: "60%", 
    textAlign: "right", 
    color: "#1E293B", 
    fontWeight: "700",
    fontSize: 14
  },
  logoutButton: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 30,
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF4D4D", // Red outline for logout
  },
  logoutButtonText: { 
    color: "#FF4D4D", 
    marginLeft: 10, 
    fontWeight: "800",
    fontSize: 16
  },
});
