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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getEmployeeId, clearStorage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

export default function PickerProfileScreen() {
  const navigation = useNavigation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const MAX_WIDTH = 1500; // Optimized for mobile view
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

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
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loaderText}>Syncing Profile...</Text>
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#64748b", fontSize: 16 }}>No employee data found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.headerEditBtn}
          onPress={() => navigation.navigate("DeliverBoyEdit", { employee })}
        >
          <View style={styles.editIconCircle}>
            <Ionicons name="pencil" size={18} color="#4F46E5" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.mainWrapper, { width: containerWidth, alignSelf: "center" }]}>
          
          {/* Enhanced Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: employee.image }} style={styles.profileImage} />
              <View style={styles.statusBadge} />
            </View>
            <Text style={styles.name}>{employee.full_name}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>Emp ID: #{employee.id}</Text>
            </View>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="moped" size={16} color="#4F46E5" />
              <Text style={styles.roleText}>{employee.role}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <InfoSection
              title="Personal Information"
              icon="person"
              data={[
                { label: "Email", value: employee.email, icon: "mail-outline" },
                { label: "Mobile", value: employee.mobile, icon: "call-outline" },
                { label: "Department", value: employee.department, icon: "business-outline" },
                { label: "Age", value: `${employee.age} yrs`, icon: "calendar-outline" },
                { label: "Blood Group", value: employee.blood_group, icon: "water-outline" },
              ]}
            />

            <InfoSection 
              title="Employment Details" 
              icon="briefcase" 
              data={[
                { label: "Type", value: employee.employment_type, icon: "ribbon-outline" },
                { label: "Salary", value: `₹${employee.monthly_salary}`, icon: "wallet-outline" },
                { label: "Joined", value: new Date(employee.date_of_joining).toDateString(), icon: "calendar-clear-outline" },
              ]}
            />

            <InfoSection 
              title="Duty Hours" 
              icon="time" 
              data={[
                { label: "Shift", value: `${employee.schedule_in} - ${employee.schedule_out}`, icon: "sunny-outline" },
                { label: "Break", value: `${employee.break_in} - ${employee.break_out}`, icon: "cafe-outline" },
              ]}
            />

            <InfoSection 
              title="Bank Account" 
              icon="card" 
              data={[
                { label: "Bank", value: employee.bank_name, icon: "account-balance-outline" },
                { label: "A/C No", value: employee.account_number, icon: "finger-print-outline" },
                { label: "IFSC", value: employee.ifsc, icon: "code-working-outline" },
              ]}
            />

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout Account</Text>
            </TouchableOpacity>
            
            <Text style={styles.versionText}>Build v1.0.24 • Made for BHM</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoSection = ({ title, icon, data }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={18} color="#4F46E5" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionBody}>
      {data.map((item, index) => (
        <View key={index} style={[styles.row, index === data.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.labelGroup}>
            <Ionicons name={item.icon} size={16} color="#94a3b8" style={{ marginRight: 10 }} />
            <Text style={styles.label}>{item.label}</Text>
          </View>
          <Text style={styles.value} numberOfLines={1}>{item.value || "N/A"}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  backBtn: { padding: 8 },
  editIconCircle: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' 
  },
  
  profileCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 35,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: { 
    width: 110, height: 110, borderRadius: 55, 
    borderWidth: 4, borderColor: '#EEF2FF' 
  },
  statusBadge: {
    position: 'absolute', bottom: 5, right: 5,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#10B981', borderWidth: 4, borderColor: '#fff'
  },
  name: { fontSize: 24, fontWeight: "900", color: "#1e293b", marginBottom: 4 },
  idBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6, marginBottom: 8 },
  idText: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20,
  },
  roleText: { color: '#4F46E5', fontWeight: '800', fontSize: 13, marginLeft: 6 },

  infoContainer: { paddingHorizontal: 16 },
  section: { 
    backgroundColor: "#fff", borderRadius: 24, 
    marginBottom: 20, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  iconContainer: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1E293B" },
  sectionBody: { backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16 },
  row: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    paddingVertical: 14, borderBottomWidth: 1, borderColor: "#E2E8F0" 
  },
  labelGroup: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  value: { fontSize: 14, fontWeight: "700", color: "#1E293B", maxWidth: "55%" },
  
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderText: { marginTop: 12, color: '#4F46E5', fontWeight: '700' },
  
  logoutButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#EF4444", paddingVertical: 16, borderRadius: 16,
    marginTop: 10, shadowColor: "#EF4444", shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    gap: 8
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  versionText: { 
    textAlign: 'center', color: '#94A3B8', 
    fontSize: 12, marginTop: 25, fontWeight: '600' 
  }
});