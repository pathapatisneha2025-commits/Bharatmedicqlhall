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
import { Ionicons, AntDesign, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { clearStorage} from "../utils/storage";

const Sidebar = () => {
  const navigation = useNavigation();
const handleLogout = async () => {
    await clearStorage();
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }],
    });
  };
  // ==========================
  // Sidebar Sections and Items
  // ==========================
  const sections = [
    // ==========================
    // HR Section
    // ==========================
    {
      title: "HR",
      items: [
        { name: "Admin Profile", icon: "people-outline", screen: "AdminProfileScreen" },
        { name: "Dashboard", icon: "grid-outline", screen: "AdminDashboard" },

        // Employee Management
        { name: "All Employees", icon: "people-outline", screen: "Adminallemployees" },
        { name: "AllEmployeesProfileupdate", icon: "people-outline", screen: "AdminProfileApprovalScreen" },

         { name: "All EmployeePerformance", icon: "people-outline", screen: "EmployeePerformance" },
        { name: "SubAdmin All Employees", icon: "people-circle-outline", screen: "SubAdminAllEmpListScreen" },
        { name: "Admin All Employees", icon: "settings-outline", screen: "AdminListScreen" },
        { name: "All Patients", icon: "person-outline", screen: "AdminAllPatients" },
        { name: "AdminEmployeeallowace", icon: "cash-outline", screen: "AdminEmpAllowanceScreen" },
        { name: "AllowanceUsageListScreen", icon: "clipboard-outline", screen: "AllowanceUsageListScreen" },

      { name: "UpdateAddressesrequestchange", icon: "clipboard-outline", screen: "AddressChangeRequests" },

        { name: "AdminAttendanceLogin", icon: "time-outline", screen: "AdminAttendanceScreen" },
        { name: "AdminAttendanceLogout", icon: "time-outline", screen: "AdminOffDutyScreen" },

        { name: "Attendance View", icon: "time-outline", screen: "Adminattendancelogs" },
        { name: "BreakTime View", icon: "time-outline", screen: "AdminBreakLogsScreen" },
  { name: "AllemployeeAttendancetracker", icon: "time-outline", screen: "AdminEmployeeAttendanceRecords" },
        // { name: "Leave Policy", icon: "calendar-outline", screen: "LeavePolicy" },
        { name: "Leave Management", icon: "clipboard-outline", screen: "AdminLeaveApproval" },
        { name: "EmployeeDeduction Management", icon: "remove-circle-outline", screen: "EmployeedeductionsFormScreen" },


        // Task & Role
        
        { name: "Recurring Task Assignment", icon: "checkmark-done-outline", screen: "RecurringAllTasks" },
        { name: "Task Assignment", icon: "checkmark-done-outline", screen: "Admintaskmanagement" },
        { name: "EmployeewisetaskAssignment", icon: "checkmark-done-outline", screen: "AdminEmployeeTasksScreen" },

        { name: "Department Name", icon: "business-outline", screen: "department" },
        { name: "Role Name", icon: "person-circle-outline", screen: "rolename" },

        // Reports
        { name: "Payslip", icon: "document-text-outline", screen: "subadminpayslip" },
        { name: "KPI Metrics", icon: "bar-chart-outline", screen: "Departmentchart" },
        { name: "Empworkingdays", icon: "bar-chart-outline", screen: "empworkingdays" },
        { name: "Employee Request form", icon: "bar-chart-outline", screen: "DoctorRequestFormall" },
        { name: "LatePenalityform", icon: "alert-circle-outline", screen: "EmployeeLatepenality" },
        { name: "AllEmployeeBreakPenality", icon: "alert-circle-outline", screen: "BreakPenaltyScreen" },
        { name: "Deptwiseleavelimit", icon: "alert-circle-outline", screen: "AdminDepartmentLimitScreen" },

        { name: "CRMScreen", icon: "grid-outline", screen: "CRMScreen" },
        { name: "ordersKpiScreen", icon: "grid-outline", screen: "OrdersKpiScreen" },

      ],
    },

    // ==========================
    // Sales Section
    // ==========================
    {
      title: "Sales",
      items: [
        // Inventory & Doctors
        { name: "Inventory Management", icon: "archive-outline", screen: "AdminAddMedicineScreen" },
        { name: "StationaryInventory", icon: "archive-outline", screen: "AdminAddStatinorayInventory" },
        { name: "AdminApproverequestall", icon: "archive-outline", screen: "AdminRequestFormall" },

          { name: "DoctorsManagement", icon: "medkit-outline", screen: "DoctorApprovalScreen" },
{ name: "Doctors Fee", icon: "medkit-outline", screen: "AddDoctors" },
        { name: "CreateSalesorederForm", icon: "archive-outline", screen: "SalesOrderForm" },

        { name: "Doctors Fee", icon: "medkit-outline", screen: "AddDoctors" },
        { name: "Doctors tokens", icon: "medkit-outline", screen: "AdminDoctorTokenScreen" },
        { name: "DoctorsDailyTokensreport", icon: "medkit-outline", screen: "DailyTokensReport" },

        { name: "Doctors ConsultanceFee", icon: "medkit-outline", screen: "AddDoctorConsultantFeesScreen" },
        { name: "assignPunetoDoctors", icon: "medkit-outline", screen: "AdminAssignDoctorScreen" },

        { name: "EmloyeeSalaryDeductions", icon: "cash-outline", screen: "AdminSalaryDeductionsScreen" },
        { name: "EmployeeBookAppointmentall", icon: "calendar-outline", screen: "AdminEmployeePatientReports" },

        { name: "Department Chart", icon: "pie-chart-outline", screen: "Departmentchart" },
      ],
    },

    // ==========================
    // Purchase Section
    // ==========================
    {
      title: "Purchase",
      items: [
        { name: "Purchase Orders", icon: "cart-outline", screen: "AdminCustomerOrders" },
        { name: "Book Appointment", icon: "calendar-outline", screen: "BookAppointment" },
        { name: "DeliveryboyCashhandover", icon: "cash-outline", screen: "AdminHandoverScreen" },

        { name: "OrdersDeliverdByBus", icon: "cart-outline", screen: "AdminBusDeliveredOrdersScreen" },
        { name: "OrdersDeliverdByDeliveryBoy", icon: "cart-outline", screen: " OrdersDeliverdByDeliveryBoy" },


      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ==========================
          Header
      ========================== */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Menu</Text>
      </View>

      {/* ==========================
          Admin Panel Quick View
      ========================== */}
      <View style={styles.adminPanel}>
        <Text style={styles.adminPanelTitle}>Admin Panel Overview</Text>

        <View style={styles.adminRow}>
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate("DeptDashboard")}
          >
            <Ionicons name="grid-outline" size={26} color="#38bdf8" />
            <Text style={styles.adminCardText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate("Adminallemployees")}
          >
            <Ionicons name="people-outline" size={26} color="#38bdf8" />
            <Text style={styles.adminCardText}>Employees</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.adminRow}>
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate("AdminAddMedicineScreen")}
          >
            <Ionicons name="bar-chart-outline" size={26} color="#38bdf8" />
            <Text style={styles.adminCardText}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate("AdminCustomerOrders")}
          >
            <Ionicons name="cart-outline" size={26} color="#38bdf8" />
            <Text style={styles.adminCardText}>Orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ==========================
          Scrollable Sidebar Sections
      ========================== */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
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

      {/* ==========================
          Logout Button
      ========================== */}
      <TouchableOpacity style={styles.logout}onPress={handleLogout}>
        <AntDesign name="logout" size={22} color="#ff4d4d" style={styles.icon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Sidebar;

// ==========================
// Styles
// ==========================
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

  // Admin Panel
  adminPanel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  adminPanelTitle: {
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  adminRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  adminCard: {
    width: "48%",
    backgroundColor: "#0f172a",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  adminCardText: {
    color: "#f8fafc",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },

  // Sidebar Sections
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

  // Logout Button
  logout: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
      paddingBottom: 60,  // 👈 Add this line (increase height from bottom)

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
