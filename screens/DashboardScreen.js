import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";
import colors from "../constants/colors";

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const cardWidth = isLargeScreen ? "48%" : "100%"; // Responsive card width

  // --- States from Original Logic ---
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState({ pending: 0, completed: 0, overdue: 0, total: 0 });
  const [tasks, setTasks] = useState([]);
  const [leavesTaken, setLeavesTaken] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({ daily: "0h 0m", weekly: "0h 0m", monthly: "0h 0m" });
  const [loadingCount, setLoadingCount] = useState(1);

  const offDutyTimeoutRef = useRef(null);

  // --- Utilities ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 18) return "Good Afternoon!";
    return "Good Evening!";
  };

  const formatAPITimestamp = (timestamp) => {
    if (!timestamp) return "No Record";
    try {
      const [date, time] = timestamp.split("T");
      return `${date} ${time.split(".")[0]}`;
    } catch { return timestamp; }
  };

  const normalizeHours = (str) => {
    if (!str) return "0h 0m";
    return str.replace("hrs", "h").replace("hr", "h").replace("mins", "m").replace("min", "m");
  };

  const statusCardColor = () => {
    const s = attendance?.status?.toLowerCase();
    return s === "off duty" ? "#ffe5e5" : s === "on duty" ? "#e0ffe5" :
           s === "absent" ? "#fff3cd" : s === "in break" ? "#fff0cc" : "#ffffff";
  };

  const statusTextColor = () => {
    const s = attendance?.status?.toLowerCase();
    return s === "off duty" ? "#ff4d4d" : s === "on duty" ? "#27ae60" :
           s === "absent" ? "#e67e22" : s === "in break" ? "#d35400" : "#111";
  };

  // --- Core Fetching Logic ---
  const fetchAllData = async () => {
    try {
      const id = await getEmployeeId();
      if (!id) return;
      setLoading(true);

      const empRes = await fetch(`https://hospitaldatabasemanagement.onrender.com/employee/${id}`);
      const empData = await empRes.json();
      if (!empData.success) return;

      const employeeInfo = empData.employee;
      setEmployee(employeeInfo);
      const phone = employeeInfo.mobile;
      const logoutIdentifier = phone || id;

      const [attRes, phoneAttRes, logoutRes, taskRes, leaveRes, breakRes] = await Promise.all([
        fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/employee/${id}`),
        phone ? fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/employee/phone/${phone}`) : Promise.resolve({ json: async () => ({ success: false, data: [] }) }),
        fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/logout/${logoutIdentifier}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/task/employee/${id}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/leaves/by-employee/${id}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/${id}`)
      ]);

      const [attData, phoneAttData, logoutData, taskData, leaveData, breakData] = await Promise.all([
        attRes.json(), phoneAttRes.json(), logoutRes.json(), taskRes.json(), leaveRes.json(), breakRes.json()
      ]);

   let allAttendance = [];

// Regular employee ID-based attendance
if (attData.success) allAttendance.push(...attData.data.map(a => ({ ...a, viaPhone: false })));

// Phone-based attendance
if (phoneAttData.success && phoneAttData.data) {
  const phoneData = Array.isArray(phoneAttData.data) ? phoneAttData.data : [phoneAttData.data];
  allAttendance.push(...phoneData.map(a => ({ ...a, viaPhone: true })));
}

// Logout data
if (logoutData.success) {
  const logoutArrays = [
    logoutData.attendance?.all || [],
    logoutData.attendance?.daily || [],
    logoutData.attendance?.weekly || [],
    logoutData.attendance?.monthly || []
  ];

  logoutArrays.flat().forEach(a => {
    // Avoid duplicate: same timestamp + same employee_id + same phone
    if (!allAttendance.some(existing => 
      existing.timestamp === a.timestamp &&
      existing.employee_id === a.employee_id &&
      (existing.phone || null) === (a.phone || null)
    )) {
      allAttendance.push({ ...a, viaPhone: false });
    }
  });

  // Update totals
  setAttendanceSummary({
    daily: normalizeHours(logoutData.totals?.daily_hours),
    weekly: normalizeHours(logoutData.totals?.weekly_hours),
    monthly: normalizeHours(logoutData.totals?.monthly_hours),
  });
}

// Break-in logic
if (breakData.success && breakData.data?.length) {
  const latestBreak = breakData.data.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  const breakStatus = latestBreak.break_type === "Break In" ? "In Break" : "On Duty";
  allAttendance.push({ ...latestBreak, status: breakStatus, viaPhone: false });
}

// Sort by timestamp and pick latest
const latestRecord = allAttendance.length
  ? allAttendance.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
  : null;

setAttendance(latestRecord || null);

      if (latestRecord?.status?.toLowerCase() === "off duty") {
        if (offDutyTimeoutRef.current) clearTimeout(offDutyTimeoutRef.current);
        offDutyTimeoutRef.current = setTimeout(() => {
          setAttendance(prev => prev ? { ...prev, status: "N/A" } : { status: "N/A" });
        }, 10000);
      }

      if (taskData.success) {
        setTasks(taskData.tasks || []);
        let pending = 0, completed = 0, overdue = 0;
        const today = new Date();
        taskData.tasks.forEach(t => {
          const due = new Date(`${t.due_date}T${t.due_time}`);
          if (t.status.toLowerCase() === "pending") due < today ? overdue++ : pending++;
          else if (t.status.toLowerCase() === "completed") completed++;
        });
        setTaskStats({ pending, completed, overdue, total: taskData.tasks.length });
      }

      if (leaveData.leaves?.length) {
        setLeavesTaken(leaveData.leaves.reduce((sum, l) => sum + parseFloat(l.leavestaken || 0), 0));
      } else setLeavesTaken(0);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchAllData();
    return () => offDutyTimeoutRef.current && clearTimeout(offDutyTimeoutRef.current);
  }, []);

  useFocusEffect(useCallback(() => { fetchAllData(); }, []));

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(1);
      interval = setInterval(() => setLoadingCount(prev => prev + 1), 1000);
    }
    return () => interval && clearInterval(interval);
  }, [loading]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading {loadingCount}</Text>
      </View>
    );
  }

  
  // --- Components ---
  const SidebarItem = ({ icon, label, active = false, nav }) => (
    <TouchableOpacity 
      style={[styles.sidebarItem, active && styles.sidebarItemActive]}
      onPress={() => nav && navigation.navigate(nav)}
    >
      <Ionicons name={icon} size={20} color={active ? "#fff" : "#555"} />
      <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      {/* SIDEBAR */}
    {isLargeScreen && (
  <View style={styles.sidebar}>
    <View style={styles.logoContainer}>
      <Text style={styles.logoText}>Bharat Medical</Text>
      <Text style={styles.logoSub}>Hall</Text>
    </View>

    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
      {[
        { name: 'Dashboard', icon: 'grid-outline' },
        { name: 'TaskView', icon: 'list-outline', label: 'Tasks' },
        { name: 'Attendance', icon: 'time-outline', label: 'Attendance' },
        { name: 'Attendanceoffduty', icon: 'log-out-outline', label: 'Attendance LogOut' },
        { name: 'BreakInScreen', icon: 'play-circle-outline', label: 'Break In' },
        { name: 'BreakOutScreen', icon: 'stop-circle-outline', label: 'Break Out' },
        { name: 'LeaveStatus', icon: 'document-text-outline', label: 'Leave Status' },
        { name: 'Leave', icon: 'calendar-outline', label: 'Leave Apply' },
        { name: 'payslip', icon: 'receipt-outline', label: 'Payslips' },
        { name: 'EmpPerformanceDashboard', icon: 'stats-chart-outline', label: 'KPI/KPA' },
        { name: 'Billing', icon: 'cash-outline', label: 'Billing' },
        { name: 'DoctorRequestForm', icon: 'create-outline', label: 'Employee Request Form' },
        { name: 'EmployeeRequestListScreen', icon: 'list-circle-outline', label: 'Employee Request Form all' },
        { name: 'DoctorAppointment', icon: 'calendar-number-outline', label: 'Employee Booking' },
        { name: 'EmployeeDailyBookings', icon: 'calendar-outline', label: 'DailyBookings' },
        { name: 'AddAllowanceUsageScreen', icon: 'cash-outline', label: 'EmployeeAllowanceUsageform' },
        { name: 'EmployeeAllowanceall', icon: 'cash-outline', label: 'EmployeeAllowanceUsageall' },
          { name: 'EmployeePickerScreen', icon: 'cash-outline', label: 'SalesOrder' },
          { name: 'CheckerScreen', icon: 'cash-outline', label: 'SalesOrderAssignDelivery' },


        { name: 'ProfileScreen', icon: 'person-circle-outline', label: 'Profile' },
      ].map((item, idx) => (
        <SidebarItem
          key={idx}
          icon={item.icon}
          label={item.label || item.name}
          nav={item.name}
          active={item.name === 'Dashboard'} // Default active
        />
      ))}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => navigation.replace("SelectRole")}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc3545" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
)}


      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.headerTitle}>{getGreeting()}</Text>
            <Text style={styles.headerSub}>Welcome back, {employee?.full_name || "Employee"}</Text>
          </View>
          <View style={styles.topRightActions}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#999" />
              <TextInput placeholder="Search tasks..." style={styles.searchInput} />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("AttendanceNotification")}>
                <Ionicons name="notifications-outline" size={24} color="#333" style={{marginHorizontal: 15}} />
            </TouchableOpacity>
            <View style={styles.userProfile}>
              <View style={styles.userText}>
                <Text style={styles.userName}>{employee?.full_name?.split(' ')[0]}</Text>
                <Text style={styles.userRole}>Staff</Text>
              </View>
              {employee?.image ? (
                <Image source={{ uri: employee.image }} style={styles.avatar} />
              ) : (
                <Ionicons name="person-circle" size={36} color="#007bff" />
              )}
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAllData(); }} />}
        >
          {/* INFO ROW (Original Style) */}
          <View style={styles.infoRow}>
            <TouchableOpacity
              style={[styles.infoCard, { backgroundColor: "#FFF3E0", width: cardWidth }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("TaskView")}
            >
              <MaterialCommunityIcons name="calendar-today" size={26} color="#EF6C00" />
              <Text style={styles.infoTitle}>TODAY</Text>
              <Text style={styles.infoValue}>{taskStats.pending + taskStats.completed + taskStats.overdue} Tasks</Text>
            </TouchableOpacity>

            <View style={[styles.infoCard, { backgroundColor: statusCardColor(), width: cardWidth }]}>
              <Ionicons name="checkmark-circle" size={26} color={statusTextColor()} />
              <Text style={styles.infoTitle}>STATUS</Text>
              <Text style={[styles.infoValue, { color: statusTextColor() }]}>
                {attendance?.status || "N/A"} {attendance?.viaPhone ? "(Phone)" : ""}
              </Text>
              <Text style={styles.subText}>{attendance?.timestamp ? formatAPITimestamp(attendance.timestamp) : "No Record"}</Text>
            </View>
          </View>

          {/* TASKS SECTION */}
          <TouchableOpacity style={styles.sectionCard} activeOpacity={0.8} onPress={() => navigation.navigate("TaskView")}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <Text style={styles.subText}>
              Pending: {taskStats.pending} | Completed: {taskStats.completed} | Overdue: {taskStats.overdue}
            </Text>
            <View style={{ marginTop: 10 }}>
              {tasks.length > 0 ? tasks.slice(0, 3).map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <Text style={{ flex: 1, color: '#333' }}>{task.title}</Text>
                  <View style={[styles.tag, {
                    backgroundColor: task.status.toLowerCase() === "pending" ? "#ffe4cc" :
                                     task.status.toLowerCase() === "completed" ? "#dcfce7" : "#f8d7da"
                  }]}>
                    <Text style={[styles.tagText, {
                      color: task.status.toLowerCase() === "pending" ? "#e67e22" :
                             task.status.toLowerCase() === "completed" ? "#2ecc71" : "#dc3545"
                    }]}>{task.status}</Text>
                  </View>
                </View>
              )) : <Text style={styles.subText}>No tasks available</Text>}
            </View>
          </TouchableOpacity>

          {/* ATTENDANCE SUMMARY */}
          <View style={styles.attendanceContainer}>
            <Text style={styles.sectionTitle}>My Attendance</Text>
            <Text style={styles.attendanceCheckIn}>
              Last Record: {attendance?.timestamp ? formatAPITimestamp(attendance.timestamp) : "Not Available"}
            </Text>
            <View style={styles.attendanceRow}>
              {[
                { label: "Today", value: attendanceSummary.daily, icon: "time-outline", bg: "#E3F2FD", color: "#1976D2" },
                { label: "This Week", value: attendanceSummary.weekly, icon: "calendar-outline", bg: "#E8F5E9", color: "#2E7D32" },
                { label: "This Month", value: attendanceSummary.monthly, icon: "calendar-sharp", bg: "#FFF3E0", color: "#EF6C00" }
              ].map((item, idx) => (
                <View key={idx} style={[styles.attendanceCard, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                  <Text style={styles.attendanceLabel}>{item.label}</Text>
                  <Text style={styles.attendanceValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SCHEDULERS */}
          <View style={styles.schedulerRow}>
            {[
              { title: "Attendance Scheduler", desc: "Set your attendance schedule", nav: "timeSchedular", icon: "calendar" },
              { title: "Break Scheduler", desc: "Set your break in/out", nav: "breakTimeScheduler", icon: "time-outline" }
            ].map((sch, i) => (
              <View key={i} style={[styles.miniSectionCard, { backgroundColor: "#e6f7ff", flex: 1, marginRight: i === 0 ? 15 : 0 }]}>
                <Text style={styles.sectionTitle}>{sch.title}</Text>
                <Text style={styles.subText}>{sch.desc}</Text>
                <TouchableOpacity
                  style={[styles.schedulerButton, { backgroundColor: colors.primary || "#1e90ff" }]}
                  onPress={() => navigation.navigate(sch.nav)}
                >
                  <Ionicons name={sch.icon} size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.schedulerButtonText}>{sch.title.includes("Break") ? "Schedule Break" : "Schedule Attendance"}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* LEAVES */}
          <TouchableOpacity style={styles.sectionCard} activeOpacity={0.8} onPress={() => navigation.navigate("Leave")}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.sectionTitle}>Apply Leave</Text>
                <Text style={styles.subText}>Track your leave history and balance</Text>
              </View>
              <View style={styles.leaveBadge}>
                <Text style={styles.leaveCount}>{Number(leavesTaken).toFixed(2)} days taken</Text>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f7fe' },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
 sidebar: {
  width: 280,
  backgroundColor: "#3B82F6",
  padding: 25,
  height: "100%",
},
sidebarHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 40,
  gap: 12,
},
logo: { width: 45, height: 45, borderRadius: 10, backgroundColor: "#fff" },
brandMain: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
brandSub: { fontSize: 12, color: "#BFDBFE" },
sidebarMenu: { flex: 1 },
sidebarItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8 },
sidebarItemActive: {
  backgroundColor: "#2563EB",
  ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } })
},
sidebarLabel: { marginLeft: 12, fontSize: 14, fontWeight: "600", color: "#BFDBFE" },
sidebarLabelActive: { color: "#fff" },

  content: { flex: 1 },
  topBar: { height: 80, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSub: { fontSize: 13, color: '#888' },
  topRightActions: { flexDirection: 'row', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, width: 200 },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 14 },
  userProfile: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#eee', paddingLeft: 15 },
  userText: { alignItems: 'flex-end', marginRight: 10 },
  userName: { fontWeight: 'bold', fontSize: 14 },
  userRole: { fontSize: 12, color: '#888' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  scrollBody: { padding: 25 },
  infoRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 15 },
  infoCard: { padding: 16, borderRadius: 15, alignItems: "center", marginBottom: 12, elevation: 3, backgroundColor: '#fff' },
  infoTitle: { marginTop: 6, fontSize: 12, color: "#555", fontWeight: '600' },
  infoValue: { fontWeight: "700", fontSize: 16, color: "#111", marginTop: 4 },
  sectionCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subText: { fontSize: 12, color: '#666' },
  taskRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  tagText: { fontSize: 11, fontWeight: "700" },
  attendanceContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2 },
  attendanceCheckIn: { fontSize: 12, color: '#007bff', marginVertical: 8 },
  attendanceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  attendanceCard: { flex: 1, alignItems: "center", paddingVertical: 15, borderRadius: 12, marginHorizontal: 4 },
  attendanceLabel: { fontSize: 11, color: "#555", marginTop: 4 },
  attendanceValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  schedulerRow: { flexDirection: 'row', marginBottom: 20 },
  miniSectionCard: { padding: 20, borderRadius: 15, elevation: 1 },
  schedulerButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, padding: 10, borderRadius: 10 },
  schedulerButtonText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  leaveBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  leaveCount: { fontWeight: 'bold', color: '#333', fontSize: 13 }
});

export default DashboardScreen;