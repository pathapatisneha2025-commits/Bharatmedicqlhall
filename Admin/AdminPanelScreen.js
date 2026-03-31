import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Entypo, Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';


const BASE_URL = 'https://hospitaldatabasemanagement.onrender.com';

const AdminPanelScreen = () => {
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigation = useNavigation();
const route = useRoute();
  const [activeScreen, setActiveScreen] = useState(route.name);

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dr, em, pa, ap, or, lv, tk] = await Promise.all([
        fetch(`${BASE_URL}/doctor/all`),
        fetch(`${BASE_URL}/employee/all`),
        fetch(`${BASE_URL}/patient/all`),
        fetch(`${BASE_URL}/book-appointment/all`),
        fetch(`${BASE_URL}/order-medicine/all`),
        fetch(`${BASE_URL}/leaves/all`),
        fetch(`${BASE_URL}/task/all`),
      ]);

      const doctors = await dr.json();
      const employees = await em.json();
      const patients = await pa.json();
      const appointments = await ap.json();
      const orders = await or.json();
      const leavesData = await lv.json();
      const tasksData = await tk.json();

      setDoctorCount(Array.isArray(doctors) ? doctors.length : 0);
      setEmployeeCount(employees?.employees?.length || 0);
      setPatientCount(patients?.patients?.length || 0);
      setLeaves(leavesData?.leaves || []);
      setTasks(tasksData?.tasks || []);

      const rev = (Array.isArray(appointments) ? appointments.reduce((s, i) => s + Number(i.consultantfees || 0), 0) : 0) +
                  (Array.isArray(orders) ? orders.reduce((s, i) => s + Number(i.total || 0), 0) : 0);
      setTotalRevenue(rev);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  const handleLeaveAction = async (id, status) => {
    try {
      await fetch(`${BASE_URL}/leaves/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch {
      Alert.alert("Error", "Action failed");
    }
  };
  useEffect(() => {
  setActiveScreen(route.name);
}, [route.name]);
const handleLogout = async () => {
  try {
    // Clear stored token or user info
    await AsyncStorage.clear();

    // Navigate to login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'SelectRole' }], // replace with your login screen name
    });
  } catch (error) {
    Alert.alert("Error", "Failed to logout. Try again.");
  }
};


  const sidebarSections = [
  {
    title: "HR",
    items: [
      { name: "Admin Profile", icon: "people-outline", screen: "AdminProfileScreen" },
      { name: "Dashboard", icon: "grid-outline", screen: "AdminDashboard" },
      { name: "All Employees", icon: "people-outline", screen: "Adminallemployees" },
      { name: "Profile Update Requests", icon: "people-outline", screen: "AdminProfileApprovalScreen" },
      { name: "Employee Performance", icon: "people-outline", screen: "EmployeePerformance" },
     { name: "Employee History", icon: "people-outline", screen: "AdminEmployeeHistory" },

      { name: "SubAdmin Employees", icon: "people-circle-outline", screen: "SubAdminAllEmpListScreen" },
      { name: "Admin Employees", icon: "settings-outline", screen: "AdminListScreen" },
      { name: "All Patients", icon: "person-outline", screen: "AdminAllPatients" },
      { name: "Employee Allowance", icon: "cash-outline", screen: "AdminEmpAllowanceScreen" },
      { name: "Allowance Usage", icon: "clipboard-outline", screen: "AllowanceUsageListScreen" },
      { name: "Address Change Requests", icon: "clipboard-outline", screen: "AddressChangeRequests" },
      { name: "Attendance Login", icon: "time-outline", screen: "AdminAttendanceScreen" },
      { name: "Attendance Logout", icon: "time-outline", screen: "AdminOffDutyScreen" },
      { name: "Attendance View", icon: "time-outline", screen: "Adminattendancelogs" },
      { name: "Break Time Logs", icon: "time-outline", screen: "AdminBreakLogsScreen" },
      { name: "Employee Attendance Tracker", icon: "time-outline", screen: "AdminEmployeeAttendanceRecords" },
      { name: "Leave Management", icon: "clipboard-outline", screen: "AdminLeaveApproval" },
      { name: "Employee Deductions", icon: "remove-circle-outline", screen: "EmployeedeductionsFormScreen" },
      { name: "Recurring Tasks", icon: "checkmark-done-outline", screen: "RecurringAllTasks" },
      { name: "Task Assignment", icon: "checkmark-done-outline", screen: "Admintaskmanagement" },
      { name: "Employee-wise Tasks", icon: "checkmark-done-outline", screen: "AdminEmployeeTasksScreen" },
      { name: "Department Name", icon: "business-outline", screen: "department" },
      { name: "Role Name", icon: "person-circle-outline", screen: "rolename" },
      { name: "Payslip", icon: "document-text-outline", screen: "AdminPayslipScreen" },
      { name: "KPI Metrics", icon: "bar-chart-outline", screen: "Departmentchart" },
      { name: "Department Leave Limit", icon: "alert-circle-outline", screen: "AdminDepartmentLimitScreen" },
      { name: "CRM", icon: "grid-outline", screen: "CRMScreen" },
      { name: "Orders KPI", icon: "grid-outline", screen: "OrdersKpiScreen" },
      { name: "EmployeeCashHandover", icon: "grid-outline", screen: "EmployeeCashHandoverAdmin" },

    ],
  },

  {
    title: "Sales",
    items: [
    { name: "Sales Orders", icon: "cart-outline", screen: "AdminCustomerOrders" },

      { name: "Inventory Management", icon: "archive-outline", screen: "AdminAddMedicineScreen" },
      { name: "Stationary Inventory", icon: "archive-outline", screen: "AdminAddStatinorayInventory" },
      { name: "Approve Requests", icon: "archive-outline", screen: "AdminRequestFormall" },
      { name: "Doctors Management", icon: "medkit-outline", screen: "DoctorApprovalScreen" },
      { name: "Create Sales Order", icon: "archive-outline", screen: "SalesOrderForm" },
      { name: "Doctor Tokens", icon: "medkit-outline", screen: "AdminDoctorTokenScreen" },
      { name: "Daily Tokens Report", icon: "medkit-outline", screen: "DailyTokensReport" },
      { name: "Doctor Consultancy Fee", icon: "medkit-outline", screen: "AddDoctorConsultantFeesScreen" },
      { name: "Doctor Time Slots", icon: "medkit-outline", screen: "AdminDoctortimeSlotScreen" },

      { name: "Assign Pune to Doctors", icon: "medkit-outline", screen: "AdminAssignDoctorScreen" },
      { name: "Salary Deductions", icon: "cash-outline", screen: "AdminSalaryDeductionsScreen" },
      { name: "Employee Appointments", icon: "calendar-outline", screen: "AdminEmployeePatientReports" },
      { name: "PatientBookingHistory", icon: "calendar-outline", screen: "EmployeeBookingPatientReports" },

      { name: "Department Chart", icon: "pie-chart-outline", screen: "Departmentchart" },
    ],
  },

  {
    title: "Purchase",
    items: [
      { name:"Purchase Orders", icon: "cart-outline", screen: "AdminPurchaseOrders" },

      { name: "Book Appointment", icon: "calendar-outline", screen: "BookAppointment" },
      { name: "Cash Handover", icon: "cash-outline", screen: "AdminHandoverScreen" },
      { name: "Orders by Bus", icon: "cart-outline", screen: "AdminBusDeliveredOrdersScreen" },
      { name: "Orders by Delivery Boy", icon: "bicycle-outline", screen: "OrdersDeliverdByDeliveryBoy" },
      { name: "Delivery Boy Locations", icon: "bicycle-outline", screen: "AdminDeliveryBoyMapScreen" },
    { name: "Delivery Boys Report", icon: "bicycle-outline", screen: "DeliveryBoyReportScreen" },

     { name: "AdminADDMedicinceFields", icon: "archive-outline", screen: "AdminManageFieldsScreen" },
    { name: "AdminADDPurchaseOrderFields", icon: "archive-outline", screen: "AdminPurchaseOrderFields" },
    { name: "AdminADDCreatesalesOrderFields", icon: "archive-outline", screen: "AdminAddCreateSalesorderfields" },


    ],
  },

   {
    title: "ECOGREEN INTEGRATION APIS",
    items:[
  { 
    name: "Generate Token", 
    icon: "key-outline",           // 🔑 suitable for token/key
    screen: "TokenGeneratorApp" 
  },
  { 
    name: "Get Item Master Data", 
    icon: "pricetag-outline",      // 🏷️ represents items/products
    screen: "ItemMasterScreen" 
  },
  { 
    name: "Get Stock Details", 
    icon: "archive-outline",       // 📦 represents inventory/stock
    screen: "StockDetailsScreen" 
  },
  { 
    name: "Get Customer Master Data", 
    icon: "people-outline",        // 👥 better than person-circle, for customers
    screen: "CustomerMasterScreen" 
  },
  { 
    name: "Get Purchase Order", 
    icon: "file-tray-full-outline", // 📑 represents purchase orders
    screen: "EcogreenPurchaseOrderScreen" 
  },
  { 
    name: "Create Sales Order", 
    icon: "create-outline",        // ✏️ for creating orders
    screen: "EcoGreenCreateSalesOrder" 
  },
  { 
    name: "Sales Order Status", 
    icon: "stats-chart-outline",   // 📊 for order status/progress
    screen: "SalesOrderStatusScreen" 
  },



],
  },
];


const SidebarItem = ({ icon, label, active = false, onPress }) => (
  <TouchableOpacity
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress}
  >
    <Ionicons
      name={icon}
      size={22}
      color={active ? "#fff" : "#64748b"}
    />
    <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Data... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.webContainer}>
      {/* LEFT SIDEBAR */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarBrand}>
          <View style={styles.brandIcon}><Text style={styles.brandLetter}>B</Text></View>
          <View>
            <Text style={styles.brandTitle}>Bharat Medical</Text>
            <Text style={styles.brandSub}>Hall</Text>
          </View>
        </View>

     <View style={styles.sidebarMenu}>
  <ScrollView showsVerticalScrollIndicator={false}>
    {sidebarSections.map((section) => (
      <View key={section.title} style={{ marginBottom: 24 }}>
        <Text style={styles.sidebarSectionTitle}>{section.title}</Text>

       {section.items.map((item) => {
  const isActive = activeScreen === item.screen;

  return (
    <SidebarItem
      key={item.name}
      icon={item.icon}
      label={item.name}
      active={isActive}
      onPress={() => {
        setActiveScreen(item.screen);
        navigation.navigate(item.screen);
      }}
    />
  );
})}


      </View>
    ))}
  </ScrollView>
</View>


      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
  <Feather name="log-out" size={20} color="#ef4444" />
  <Text style={styles.logoutText}>Logout</Text>
</TouchableOpacity>

      </View>

      {/* RIGHT CONTENT */}
      <View style={styles.mainContent}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>Manage your hospital operations effectively.</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={24} color="#64748b" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
              <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profileImage} />
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard title="Total Doctors" value={doctorCount} icon="account" color="#E1E9FF" />
            <StatCard title="Employees" value={employeeCount} icon="account-group" color="#E5FFF2" />
            <StatCard title="Patients" value={patientCount} icon="account-heart" color="#F3E9FF" />
            <StatCard title="Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="currency-inr" color="#FFF7D9" />
          </View>

          <View style={styles.contentGrid}>
            {/* Recent Activity / Tasks */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity (Tasks)</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Admintaskmanagement')}>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              {tasks.slice(0, 5).map((item) => (
                <TouchableOpacity key={item.id} style={styles.taskItem}>
                  <View style={[styles.taskPriority, { backgroundColor: item.priority === 'High' ? '#fee2e2' : '#e0f2fe' }]}>
                    <MaterialCommunityIcons name="flag" size={16} color={item.priority === 'High' ? '#ef4444' : '#0ea5e9'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    <Text style={styles.taskSub}>Due: {item.due_date} • {item.assigned_to || 'Unassigned'}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Leave Approvals */}
            <View style={[styles.sectionCard, { marginLeft: 20 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pending Approvals</Text>
              </View>
              {leaves.filter(l => l.status.toLowerCase() === 'pending').slice(0, 5).map((item) => (
                <View key={item.id} style={styles.approvalItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.approvalName}>{item.employee_name}</Text>
                    <Text style={styles.approvalSub}>{item.leave_type} ({item.leavestaken} days)</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.miniBtnApprove} onPress={() => handleLeaveAction(item.id, 'approved')}>
                      <Text style={styles.miniBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniBtnReject} onPress={() => handleLeaveAction(item.id, 'cancelled')}>
                      <Text style={styles.miniBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { backgroundColor: color }]}>
    <MaterialCommunityIcons name={icon} size={28} color="#1e293b" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  webContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontWeight: '600', color: '#2563EB' },

  // Sidebar
  sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 24 },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: '#2563EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandLetter: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  brandSub: { fontSize: 12, color: '#64748b', marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: '#2563EB' },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: '#64748b', fontWeight: '600' },
  sidebarLabelActive: { color: '#fff' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, marginTop: 20 },
  logoutText: { marginLeft: 12, color: '#ef4444', fontWeight: '700' },

  // Content
  mainContent: { flex: 1, padding: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1e293b' },
  headerSubtitle: { color: '#64748b', marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginRight: 20 },
  notifBadge: { position: 'absolute', right: 2, top: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  profileImage: { width: 40, height: 40, borderRadius: 20 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { flex: 1, marginHorizontal: 8, padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginVertical: 4 },
  statTitle: { fontSize: 13, color: '#475569', fontWeight: '600' },

  contentGrid: { flexDirection: 'row' },
  sectionCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  viewAll: { color: '#2563EB', fontWeight: '700', fontSize: 13 },

  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  taskPriority: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  taskTitle: { fontWeight: '700', color: '#334155', fontSize: 14 },
  taskSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  approvalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  approvalName: { fontWeight: '700', color: '#334155' },
  approvalSub: { fontSize: 12, color: '#64748b' },
  actionRow: { flexDirection: 'row' },
  miniBtnApprove: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 5 },
  miniBtnReject: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  miniBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' }
});

export default AdminPanelScreen;