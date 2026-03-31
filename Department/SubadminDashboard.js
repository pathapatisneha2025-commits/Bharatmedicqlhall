import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform,
  useWindowDimensions, StatusBar ,SafeAreaView
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';

const BASE_URL = 'https://hospitaldatabasemanagement.onrender.com';

const groupByDepartment = (employees) => {
  const departments = {};
  employees.forEach(emp => {
    const dept = emp.department || "Unassigned";
    if (!departments[dept]) departments[dept] = [];
    departments[dept].push(emp);
  });
  return departments;
};

const SubAdminDashboardScreen = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState("DeptDashboard"); // default active

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;
const iconSize = 20;
const fontSize = 14;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, leaveRes, taskRes] = await Promise.all([
          axios.get(`${BASE_URL}/employee/all`),
          axios.get(`${BASE_URL}/leaves/all`),
          axios.get(`${BASE_URL}/task/all`)
        ]);
        setEmployees(empRes.data.employees || []);
        setLeaves(leaveRes.data.leaves || []);
        setTasks(taskRes.data.tasks || []);
      } catch (error) {
        console.log('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Syncing Hospital Data...</Text>
      </View>
    );
  }
  // Sidebar Items Categorized for better UX
  const sidebarCategories = [
    {
      title: "HR",
      items: [
        { name: "Dashboard", icon: "grid-outline", screen: "DeptDashboard" },
        { name: "Attendance Login", icon: "time-outline", screen: "subadminAttendanceloginScreen" },
        { name: "Attendance Logout", icon: "time-outline", screen: "subadminAttendancelogoutScreen" },
        { name: "Break In", icon: "time-outline", screen: "subadminBreakInScreen" },
        { name: "Break Out", icon: "time-outline", screen: "subadminBreakoutScreen" },
        { name: "Employee Directory", icon: "people-outline", screen: "EmpList" },
        { name: "Attendance View", icon: "time-outline", screen: "attendanceall" },
        { name: "Break View", icon: "time-outline", screen: "BreakLogsScreen" },
        { name: "Employee Attendance Tracker", icon: "time-outline", screen: "EmployeeAtendanceTracker" },
        { name: "Leave Management", icon: "calendar-outline", screen: "subAdminleavestatus" },
        { name: "Task Assignment", icon: "checkmark-done-outline", screen: "taskScreen" },
        { name: "Department Name", icon: "business-outline", screen: "department" },
        { name: "Role Name", icon: "person-circle-outline", screen: "rolename" },
        { name: "Payslip", icon: "document-text-outline", screen: "subadminpayslip" },
        { name: "Employee Allowances", icon: "cash-outline", screen: "SubAdminEmpAllowanceScreen" },
      ],
    },
    {
      title: "Sales",
      items: [
        { name: "Inventory Management", icon: "bar-chart-outline", screen: "Addmedicine" },
        { name: "Stationary Management", icon: "bar-chart-outline", screen: "SubadminStationaryInventory" },
        { name: "Department Chart", icon: "bar-chart-outline", screen: "Departmentchart" },
        { name: "Doctor Tokens", icon: "settings-outline", screen: "subadminDoctorTokenBookingScreen" },
        { name: "Consultancy Fees", icon: "settings-outline", screen: "SubAdminConsultantFeesScreen" },
      ],
    },
    {
      title: "Purchase",
      items: [
        { name: "Purchase Orders", icon: "cart-outline", screen: "AllOrders" },
        { name: "Patients", icon: "business-outline", screen: "AllPatients" },
        { name: "Book Appointment", icon: "document-text-outline", screen: "BookedAppointment" },
        { name: "Profile", icon: "document-text-outline", screen: "SubAdminProfileScreen" },
      ],
    },
  ];
  const departments = groupByDepartment(employees);
  const onDutyCount = employees.filter(emp => emp.status === 'on_duty').length;
  const onLeaveCount = employees.filter(emp => emp.status === 'on_leave').length;
  const pendingCount = employees.filter(emp => emp.status === 'pending').length;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* DESKTOP SIDEBAR */}
      {isDesktop && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarLogoContainer}>
            <View style={styles.miniLogo}><Text style={styles.miniLogoText}>BM</Text></View>
            <Text style={styles.sidebarBrand}>Bharat Medical</Text>
          </View>
       <ScrollView showsVerticalScrollIndicator={false}>
  
{sidebarCategories.map((cat, idx) => (
  <View key={idx} style={styles.sidebarSection}>
    <Text style={styles.sidebarSectionTitle}>{cat.title}</Text>
    {cat.items.map((item, i) => {
      const isActive = activeScreen === item.screen;
      return (
        <TouchableOpacity
          key={i}
          style={[
            styles.sidebarItem,
            isActive && styles.sidebarItemActive
          ]}
          onPress={() => {
            setActiveScreen(item.screen); // set active
            navigation.navigate(item.screen);
          }}
        >
          <Ionicons
            name={item.icon}
            size={iconSize}
            color={isActive ? "#fff" : "#64748b"} // icon color changes
          />
          <Text
            style={[
              styles.sidebarItemText,
              isActive && styles.sidebarItemTextActive
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
))}
        <TouchableOpacity 
          style={[styles.sidebarItem, { marginTop: 20, borderTopWidth: 1, borderColor: '#334155', paddingTop: 15 }]} 
          onPress={() => navigation.navigate("SubAdminLoginScreen")}
        >
          <Ionicons name="log-out-outline" size={iconSize} color="#ef4444" />
          <Text style={[styles.sidebarItemText, { color: '#ef4444' }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
        </View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={isDesktop ? styles.desktopContent : styles.mobileContent}>
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Hospital Overview</Text>
            <Text style={styles.headerSub}>Sub-Admin Control Panel</Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.notifBadge}>
              <Ionicons name="notifications" size={22} color="#fff" />
              <View style={styles.redDot} />
            </TouchableOpacity>
            <Image source={require('../assets/Logo.jpg')} style={styles.avatar} />
          </View>
        </View>

        {/* 1. STATS ROW */}
        <View style={styles.statsContainer}>
          <StatCard title="Total Staff" val={employees.length} icon="people-outline" color="#1e3a8a" bg="#e0f2fe" />
<StatCard title="On Duty" val={onDutyCount} icon="medkit-outline" color="#15803d" bg="#dcfce7" />
<StatCard title="On Leave" val={onLeaveCount} icon="calendar-outline" color="#d97706" bg="#fef3c7" />
<StatCard title="Leave Requests" val={leaves.filter(l => l.status === 'pending').length} icon="alert-circle-outline" color="#b91c1c" bg="#fee2e2" />

        </View>

        <View style={isDesktop ? styles.desktopGrid : null}>
          
          {/* 2. DEPARTMENTS SECTION */}
          <View style={isDesktop ? styles.gridLeft : null}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Departments</Text>
              <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
            </View>
            {Object.keys(departments).slice(0, 4).map((dept, index) => (
              <TouchableOpacity key={index} style={styles.departmentCard} onPress={() => navigation.navigate('Departmentchart', { department: dept, members: departments[dept] })}>
                <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}><FontAwesome5 name="hospital-alt" size={14} color="#2563eb" /></View>
                <View>
                  <Text style={styles.departmentName}>{dept}</Text>
                  <Text style={styles.departmentMembers}>{departments[dept].length} Active Personnel</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>

          {/* 3. LEAVE REQUESTS SECTION */}
          <View style={isDesktop ? styles.gridRight : null}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Leaves</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{leaves.filter(l => l.status === 'pending').length}</Text></View>
            </View>
            {leaves.filter(l => l.status === 'pending').length === 0 ? (
                <Text style={styles.emptyText}>No pending requests</Text>
            ) : (
                leaves.filter(l => l.status === 'pending').slice(0, 3).map((leave, index) => (
                    <View key={index} style={styles.leaveRequest}>
                        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.leaveAvatar} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.leaveName}>{leave.employee_name}</Text>
                            <Text style={styles.leaveReason}>{leave.reason}</Text>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.actionBtnApprove}><Ionicons name="checkmark" size={18} color="#fff" /></TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtnReject}><Ionicons name="close" size={18} color="#fff" /></TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
          </View>
        </View>

        {/* 4. RECENT TASKS SECTION (FULL WIDTH) */}
        <Text style={styles.sectionTitle}>Current Task Progress</Text>
        <View style={isDesktop ? styles.gridWrapper : null}>
            {tasks.slice(-4).reverse().map((task, index) => (
                <TouchableOpacity key={index} style={[styles.taskCard, isDesktop && { width: '49%' }]}>
                    <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={[styles.statusTag, { backgroundColor: task.status === 'pending' ? '#fff7ed' : '#f0fdf4' }]}>
                            <Text style={[styles.statusText, { color: task.status === 'pending' ? '#c2410c' : '#15803d' }]}>{task.status}</Text>
                        </View>
                    </View>
                    <Text style={styles.taskMeta}>Assigned to: {task.assignto?.join(', ')}</Text>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: task.status === 'pending' ? '45%' : '100%', backgroundColor: task.status === 'pending' ? '#f59e0b' : '#22c55e' }]} />
                    </View>
                </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
    </View>
  );
};

const StatCard = ({ title, val, icon, color, bg }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <View style={styles.statIconWrap}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statVal}>{val}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  mobileContent: { padding: 16, paddingTop: 40 },
  desktopContent: { padding: 30 },

  /* Sidebar */
  sidebar: { width: 250, backgroundColor: '#2563eb', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 20 },
  sidebarLogoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  miniLogo: { width: 32, height: 32, backgroundColor: '#2563eb', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  miniLogoText: { color: '#fff', fontWeight: 'bold' },
  sidebarBrand: { marginLeft: 12, fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 5 },
  sidebarItemActive: { backgroundColor: '#2563eb' },
 sidebarItemActive: {
  backgroundColor: '#2563eb', // active background
},
sidebarItemTextActive: {
  color: '#fff', // active text color
  fontWeight: '600',
},
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutText: { marginLeft: 12, color: '#ef4444', fontWeight: '600' },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 20, borderRadius: 20, marginBottom: 25 },
  headerGreeting: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#94a3b8', fontSize: 12 },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  notifBadge: { marginRight: 15 },
  redDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4, borderWidth: 1, borderColor: '#1e293b' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#334155' },
sidebarSectionTitle: {
  fontSize: 12,
  fontWeight: '700',
  color: '#94a3b8',
  marginBottom: 5
},

  /* Stats */
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { width: '48%', padding: 15, borderRadius: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  statIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statVal: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  statTitle: { fontSize: 11, color: '#64748b', fontWeight: '600' },

  /* Desktop Grid Layout */
  desktopGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridLeft: { width: '48%' },
  gridRight: { width: '48%' },
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  /* Sections */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  viewAll: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  countBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#ef4444', fontSize: 11, fontWeight: 'bold' },

  departmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  iconCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  departmentName: { fontWeight: '700', fontSize: 14, color: '#1e293b' },
  departmentMembers: { fontSize: 11, color: '#94a3b8' },

  /* Leave Items */
  leaveRequest: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  leaveAvatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12 },
  leaveName: { fontWeight: '700', fontSize: 13 },
  leaveReason: { fontSize: 11, color: '#64748b' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtnApprove: { backgroundColor: '#22c55e', padding: 8, borderRadius: 8 },
  actionBtnReject: { backgroundColor: '#ef4444', padding: 8, borderRadius: 8 },

  /* Task Cards */
  taskCard: { backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 15, borderBottomWidth: 3, borderBottomColor: '#e2e8f0' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  taskTitle: { fontWeight: '700', fontSize: 14, flex: 1, color: '#1e293b' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  taskMeta: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  progressContainer: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, fontSize: 14, color: '#64748b', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 20 }
});

export default SubAdminDashboardScreen;