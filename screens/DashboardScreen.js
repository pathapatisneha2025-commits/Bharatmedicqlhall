// screens/DashboardScreen.js
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
  useWindowDimensions,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { getEmployeeId } from "../utils/storage";
import colors from "../constants/colors";

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions(); // responsive width
  const isWeb = Platform.OS === "web";

  // Force mobile width on web
  const MOBILE_MAX_WIDTH = 420;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState({ pending: 0, completed: 0, overdue: 0 });
  const [tasks, setTasks] = useState([]);
  const [leavesTaken, setLeavesTaken] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({ daily: "0h 0m", weekly: "0h 0m", monthly: "0h 0m" });

  const offDutyTimeoutRef = useRef(null);

  // Utility Functions
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
    } catch {
      return timestamp;
    }
  };

  const fetchAllData = async () => {
    try {
      const id = await getEmployeeId();
      if (!id) return;

      setLoading(true);

      const [
        empRes,
        attRes,
        logoutRes,
        taskRes,
        leaveRes,
        breakRes,
      ] = await Promise.all([
        fetch(`https://hospitaldatabasemanagement.onrender.com/employee/${id}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/employee/${id}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/logout/${id}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/task/employee/${id}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/leaves/by-employee/${id}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/${id}`),
      ]);

      const empData = await empRes.json();
      const attData = await attRes.json();
      const logoutData = await logoutRes.json();
      const taskData = await taskRes.json();
      const leaveData = await leaveRes.json();
      const breakData = await breakRes.json();

      if (empData.success) setEmployee(empData.employee);

      // Attendance
      let latestRecord = attData.success && attData.data.length
        ? attData.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
        : null;

      if (logoutData.success && logoutData.data) {
        const { attendance: allAttendance, totals } = logoutData.data;
        if (allAttendance.all?.length) {
          const latestLogout = allAttendance.all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          if (!latestRecord || new Date(latestLogout.timestamp) > new Date(latestRecord.timestamp)) {
            latestRecord = latestLogout;
          }
        }
        setAttendanceSummary({
          daily: totals?.daily_hours || "0h 0m",
          weekly: totals?.weekly_hours || "0h 0m",
          monthly: totals?.monthly_hours || "0h 0m",
        });
      }

      // Break
      const latestBreak = breakData.success && breakData.data?.length
        ? breakData.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
        : null;

      if (latestBreak && (!latestRecord || new Date(latestBreak.timestamp) > new Date(latestRecord.timestamp))) {
        const statusMap = latestBreak.break_type === "Break In" ? "In Break" : "On Duty";
        latestRecord = { status: statusMap, timestamp: latestBreak.timestamp };
      }

      setAttendance(latestRecord || null);

      // Auto N/A after Off Duty
      if (latestRecord?.status?.toLowerCase() === "off duty") {
        if (offDutyTimeoutRef.current) clearTimeout(offDutyTimeoutRef.current);
        offDutyTimeoutRef.current = setTimeout(() => {
          setAttendance((prev) => prev ? { ...prev, status: "N/A" } : { status: "N/A" });
        }, 10000);
      }

      // Tasks
      if (taskData.success) {
        setTasks(taskData.tasks || []);
        let pending = 0, completed = 0, overdue = 0;
        const today = new Date();
        taskData.tasks.forEach((t) => {
          const due = new Date(`${t.due_date}T${t.due_time}`);
          if (t.status.toLowerCase() === "pending") due < today ? overdue++ : pending++;
          else if (t.status.toLowerCase() === "completed") completed++;
        });
        setTaskStats({ pending, completed, overdue });
      }

      // Leaves
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

  useEffect(() => {
    fetchAllData();
    return () => offDutyTimeoutRef.current && clearTimeout(offDutyTimeoutRef.current);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const statusCardColor = () => {
    const s = attendance?.status?.toLowerCase();
    return s === "off duty" ? "#ffe5e5" : s === "on duty" ? "#e0ffe5" :
           s === "absent" ? "#fff3cd" : s === "in break" ? "#fff0cc" : "#f0f0f0";
  };

  const statusTextColor = () => {
    const s = attendance?.status?.toLowerCase();
    return s === "off duty" ? "#ff4d4d" : s === "on duty" ? "#27ae60" :
           s === "absent" ? "#e67e22" : s === "in break" ? "#d35400" : "#111";
  };

  if (loading && !refreshing)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary || "#1e90ff"} />
      </View>
    );

  // MOBILE-LIKE CARD WIDTH
  const cardWidth = "48%";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.mobileWrapper, { maxWidth: isWeb ? MOBILE_MAX_WIDTH : "100%" }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate("EmpSideBar")}>
            <Ionicons name="menu" size={28} color={colors.black} />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{employee?.full_name || "Employee"}</Text>
          </View>
          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={() => navigation.navigate("AttendanceNotification")}>
              <Ionicons name="notifications-outline" size={24} color={colors.black} />
            </TouchableOpacity>
            {employee?.image ? (
              <Image source={{ uri: employee.image }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle-outline" size={40} color="#666" />
            )}
          </View>
        </View>

        {/* TODAY & STATUS */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { backgroundColor: "#e0f0ff", width: cardWidth }]}>
            <MaterialCommunityIcons name="calendar-today" size={24} color="#1e90ff" />
            <Text style={styles.infoTitle}>TODAY</Text>
            <Text style={styles.infoValue}>
              {taskStats.pending + taskStats.completed + taskStats.overdue} Tasks
            </Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: statusCardColor(), width: cardWidth }]}>
            <Ionicons name="checkmark-circle" size={24} color={statusTextColor()} />
            <Text style={styles.infoTitle}>STATUS</Text>
            <Text style={[styles.infoValue, { color: statusTextColor() }]}>{attendance?.status || "N/A"}</Text>
            <Text style={styles.subText}>{attendance?.timestamp ? formatAPITimestamp(attendance.timestamp) : "No Record"}</Text>
          </View>
        </View>

        {/* TASKS */}
        <TouchableOpacity style={styles.section} activeOpacity={0.8} onPress={() => navigation.navigate("TaskView")}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <Text style={styles.subText}>
            Pending: {taskStats.pending} | Completed: {taskStats.completed} | Overdue: {taskStats.overdue}
          </Text>
          {tasks.length > 0 ? tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Text>{task.title}</Text>
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
        </TouchableOpacity>

        {/* ATTENDANCE */}
        <View style={styles.attendanceContainer}>
          <Text style={styles.sectionTitle}>My Attendance</Text>
          <Text style={styles.attendanceCheckIn}>
            Last Record: {attendance?.timestamp ? formatAPITimestamp(attendance.timestamp) : "Not Available"}
          </Text>
          <View style={styles.attendanceRow}>
            <View style={[styles.attendanceCard, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="time-outline" size={20} color="#1976D2" />
              <Text style={styles.attendanceLabel}>Today</Text>
              <Text style={styles.attendanceValue}>{attendanceSummary.daily}</Text>
            </View>
            <View style={[styles.attendanceCard, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
              <Text style={styles.attendanceLabel}>This Week</Text>
              <Text style={styles.attendanceValue}>{attendanceSummary.weekly}</Text>
            </View>
            <View style={[styles.attendanceCard, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="calendar-sharp" size={20} color="#EF6C00" />
              <Text style={styles.attendanceLabel}>This Month</Text>
              <Text style={styles.attendanceValue}>{attendanceSummary.monthly}</Text>
            </View>
          </View>
        </View>

        {/* LEAVES */}
        <TouchableOpacity style={styles.section} activeOpacity={0.8} onPress={() => navigation.navigate("Leave")}>
          <Text style={styles.sectionTitle}>
            Apply Leave <Text style={styles.subText}>({leavesTaken} days taken)</Text>
          </Text>
          <View style={styles.leaveRow}>
            <Text style={styles.leaveType}>Total Leaves Taken</Text>
            <Text style={styles.leaveCount}>{leavesTaken} days</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, paddingTop: Platform.OS === "web" ? 20 : 30 ,marginTop:30},
  scrollContent: { paddingBottom: 120 },
  mobileWrapper: { width: "100%", alignSelf: "center" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, justifyContent: "space-between" },
  greetingContainer: { flex: 1, alignItems: "center" },
  greeting: { fontSize: 14, color: "#888" },
  name: { fontSize: 18, fontWeight: "bold", color: "#222" },
  rightIcons: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 10 },
  infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoCard: { padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  infoTitle: { marginTop: 6, fontSize: 12, color: "#444" },
  infoValue: { fontWeight: "bold", fontSize: 14, color: "#111" },
  section: { backgroundColor: "#f8f8f8", padding: 14, borderRadius: 10, marginVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  subText: { fontSize: 12, color: "#666" },
  taskRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  tagText: { fontSize: 12, fontWeight: "bold" },
  attendanceContainer: { backgroundColor: "#f8f0ff", borderRadius: 16, padding: 16, marginVertical: 10 },
  attendanceRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  attendanceCard: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  attendanceLabel: { fontSize: 13, color: "#444", marginTop: 4 },
  attendanceValue: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  attendanceCheckIn: { fontSize: 12, color: "#666", marginTop: 4 },
  leaveRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  leaveType: { fontSize: 14, color: "#333" },
  leaveCount: { fontWeight: "bold", color: "#000" },
});

export default DashboardScreen;
