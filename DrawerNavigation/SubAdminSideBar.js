// Sidebar.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {  clearStorage } from "../utils/storage"; // ✅ Import from your storage utils

const Sidebar = () => {
  const navigation = useNavigation();
const handleLogout = async () => {
    await clearStorage();
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }],
    });
  };
  // ✅ Grouped Sidebar Sections
  const sections = [
    {
      title: "HR",
      items: [
        { name: "Dashboard", icon: "grid-outline", screen: "DeptDashboard" },
        { name: "AttendanceLogin", icon: "time-outline", screen: "subadminAttendanceloginScreen" },
         { name: "AttendanceLogout", icon: "time-outline", screen: "subadminAttendancelogoutScreen" },
          { name: "Breakin", icon: "time-outline", screen: "subadminBreakInScreen" },
            { name: "Breakout", icon: "time-outline", screen: "subadminBreakoutScreen" },

        { name: "Employee Directory", icon: "people-outline", screen: "EmpList" },
        { name: "Attendance View", icon: "time-outline", screen: "attendanceall" },
         { name: "Break View", icon: "time-outline", screen: "BreakLogsScreen" },
         { name: "EmployeeAttendancetracker", icon: "time-outline", screen: "EmployeeAtendanceTracker" },
        { name: "Leave Policy", icon: "calendar-outline", screen: "LeavePolicy" },
        { name: "Leave Management", icon: "calendar-outline", screen: "subAdminleavestatus" },
        { name: "Task Assignment", icon: "checkmark-done-outline", screen: "taskScreen" },
        { name: "Department Name", icon: "business-outline", screen: "department" },
        { name: "Role Name", icon: "person-circle-outline", screen: "rolename" },
        { name: "Payslip", icon: "document-text-outline", screen: "subadminpayslip" },
        { name: "Employee Booking Appointment", icon: "bar-chart-outline", screen: "DoctorAppointment" },
      { name: "SubAdminEmployeeAllowances", icon: "cash-outline", screen: "SubAdminEmpAllowanceScreen" },

      ],
    },
    {
      title: "Sales",
      items: [
        { name: "Inventory Management", icon: "bar-chart-outline", screen: "Addmedicine" },
        { name: "Doctors Fee", icon: "settings-outline", screen: "Doctorfeeadding" },
        { name: "Department Chart", icon: "bar-chart-outline", screen: "Departmentchart" }
        ,{ name: "Doctor Tokens", icon: "settings-outline", screen: "subadminDoctorTokenBookingScreen" },
          { name: "DoctorsConsultanceFee", icon: "settings-outline", screen: "SubAdminConsultantFeesScreen" },

      ],
    },
    {
      title: "Purchase",
      items: [
        { name: "Purchase Orders", icon: "cart-outline", screen: "AllOrders" },
        { name: "Patients", icon: "business-outline", screen: "AllPatients" },
        { name: "BookAppointment", icon: "document-text-outline", screen: "BookedAppointment" },
        { name: "ProfileScreen", icon: "document-text-outline", screen: "SubAdminProfileScreen" },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Menu</Text>
      </View>

      {/* 📜 Scrollable Sidebar */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            {/* 📌 Section Title */}
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {/* 📁 Section Items */}
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={22} color="#fff" style={styles.icon} />
                <Text style={styles.menuText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* 🚪 Logout Button */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <AntDesign name="logout" size={22} color="#ff4d4d" style={styles.icon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Sidebar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    marginBottom: 10,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 5,
    textTransform: "uppercase",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  icon: {
    marginRight: 14,
  },
  menuText: {
    fontSize: 16,
    color: "#f1f5f9",
    fontWeight: "500",
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    backgroundColor: "#1e293b",
  },
  logoutText: {
    fontSize: 16,
    color: "#ff4d4d",
    marginLeft: 10,
    fontWeight: "600",
  },
});
