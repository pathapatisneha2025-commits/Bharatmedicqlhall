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
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { getEmployeeId, clearStorage } from "../utils/storage";
import colors from "../constants/colors";

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState({
    pending: 0,
    completed: 0,
    overdue: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [leavesTaken, setLeavesTaken] = useState(0);
  const [attendanceSummary, setAttendanceSummary] = useState({
    daily: "0h 0m",
    weekly: "0h 0m",
    monthly: "0h 0m",
  });
  const refreshInterval = useRef(null);
  const offDutyTimeoutRef = useRef(null);

  // ⭐ ADD BREAK FETCH FUNCTION
  const fetchBreakStatus = async (id) => {
    try {
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/${id}`
      );
      const data = await response.json();

      if (!data.success || !data.data.length) return null;

      // Get latest break record
      return data.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
    } catch (err) {
      console.log("Break API error:", err);
      return null;
    }
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good Morning!";
    if (currentHour < 18) return "Good Afternoon!";
    return "Good Evening!";
  };

  const formatAPITimestamp = (timestamp) => {
    if (!timestamp) return "No Record";
    try {
      const [date, time] = timestamp.split("T");
      const cleanTime = time.split(".")[0];
      return `${date} ${cleanTime}`;
    } catch (e) {
      return timestamp;
    }
  };

  const fetchEmployeeAndAttendance = async () => {
    try {
      const id = await getEmployeeId();
      if (id) {
        const empResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/employee/${id}`
        );
        const empData = await empResponse.json();
        if (empData.success) setEmployee(empData.employee);

        let latestRecord = null;

        // ⭐ FETCH ATTENDANCE ON DUTY
        const attResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/attendance/employee/${id}`
        );
        const attData = await attResponse.json();
        if (attData.success && attData.data.length > 0) {
          latestRecord = attData.data.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )[0];
        }

        // ⭐ FETCH LOGOUT (Off Duty)
        const logoutResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/attendance/logout/${id}`
        );
        const logoutData = await logoutResponse.json();

        if (logoutData.success && logoutData.data) {
          const { attendance, totals } = logoutData.data;

          const latestLogout = attendance.all?.length
            ? attendance.all.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )[0]
            : null;

          setAttendanceSummary({
            daily: totals?.daily_hours || "0h 0m",
            weekly: totals?.weekly_hours || "0h 0m",
            monthly: totals?.monthly_hours || "0h 0m",
          });

          if (
            latestLogout &&
            (!latestRecord ||
              new Date(latestLogout.timestamp) >
                new Date(latestRecord.timestamp))
          ) {
            latestRecord = latestLogout;
          }
        }

        // ⭐ FETCH BREAK STATUS (Break In / Break Out)
        const breakRecord = await fetchBreakStatus(id);

        // ⭐ MERGE BREAK + ATTENDANCE (LATEST WINS)
        if (
          breakRecord &&
          (!latestRecord ||
            new Date(breakRecord.timestamp) > new Date(latestRecord.timestamp))
        ) {
          const mappedStatus =
            breakRecord.break_type === "Break In"
              ? "In Break"
              : breakRecord.break_type === "Break Out" ||
                breakRecord.status === "Returned"
              ? "On Duty"
              : "On Duty";

          latestRecord = {
            status: mappedStatus,
            timestamp: breakRecord.timestamp,
          };
        }

        // FINAL SET
        setAttendance(latestRecord || null);

        // AUTO N/A AFTER OFF DUTY
        if (latestRecord?.status?.toLowerCase() === "off duty") {
          if (offDutyTimeoutRef.current) {
            clearTimeout(offDutyTimeoutRef.current);
          }
          offDutyTimeoutRef.current = setTimeout(() => {
            setAttendance((prev) =>
              prev ? { ...prev, status: "N/A" } : { status: "N/A" }
            );
          }, 10000);
        }

        // TASKS
        const taskResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/task/employee/${id}`
        );
        const taskData = await taskResponse.json();
        if (taskData.success) {
          setTasks(taskData.tasks || []);

          let pending = 0,
            completed = 0,
            overdue = 0;
          const today = new Date();

          taskData.tasks.forEach((task) => {
            if (task.status.toLowerCase() === "pending") {
              const dueDate = new Date(`${task.due_date}T${task.due_time}`);
              if (dueDate < today) {
                overdue++;
              } else {
                pending++;
              }
            } else if (task.status.toLowerCase() === "completed") {
              completed++;
            }
          });

          setTaskStats({ pending, completed, overdue });
        }

        // LEAVES
        const leaveResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/leaves/by-employee/${id}`
        );
        const leaveData = await leaveResponse.json();
        if (leaveData.leaves && leaveData.leaves.length > 0) {
          const totalLeaves = leaveData.leaves.reduce(
            (sum, leave) => sum + parseFloat(leave.leavestaken || 0),
            0
          );
          setLeavesTaken(totalLeaves);
        } else {
          setLeavesTaken(0);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployeeAndAttendance();
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      if (offDutyTimeoutRef.current) clearTimeout(offDutyTimeoutRef.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEmployeeAndAttendance();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEmployeeAndAttendance();
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary || "#1e90ff"} />
      </View>
    );
  }

  const getStatusCardColor = () => {
    const status = attendance?.status?.toLowerCase();
    if (status === "off duty") return "#ffe5e5";
    if (status === "on duty") return "#e0ffe5";
    if (status === "absent") return "#fff3cd";
    if (status === "in break") return "#fff0cc";
    if (status === "n/a") return "#f0f0f0";
    return "#f0f0f0";
  };

  const getStatusTextColor = () => {
    const status = attendance?.status?.toLowerCase();
    if (status === "off duty") return "#ff4d4d";
    if (status === "on duty") return "#27ae60";
    if (status === "absent") return "#e67e22";
    if (status === "in break") return "#d35400";
    if (status === "n/a") return "#111";
    return "#111";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("EmpSideBar")}>
          <Ionicons
            name="menu"
            size={28}
            color={colors.black}
            style={styles.menuIconLeft}
          />
        </TouchableOpacity>

        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>{employee?.full_name || "Employee"}</Text>
        </View>

        <View style={styles.rightIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AttendanceNotification")}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.black}
              style={styles.notificationIcon}
            />
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
        <View style={[styles.infoCard, { backgroundColor: "#e0f0ff" }]}>
          <MaterialCommunityIcons
            name="calendar-today"
            size={24}
            color="#1e90ff"
          />
          <Text style={styles.infoTitle}>TODAY</Text>
          <Text style={styles.infoValue}>
            {taskStats.pending +
              taskStats.completed +
              taskStats.overdue}{" "}
            Tasks
          </Text>
        </View>

        <View
          style={[styles.infoCard, { backgroundColor: getStatusCardColor() }]}
        >
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={getStatusTextColor()}
          />
          <Text style={styles.infoTitle}>STATUS</Text>
          <Text style={[styles.infoValue, { color: getStatusTextColor() }]}>
            {attendance?.status || "N/A"}
          </Text>
          <Text style={styles.subText}>
            {attendance?.timestamp
              ? formatAPITimestamp(attendance.timestamp)
              : "No Record"}
          </Text>
        </View>
      </View>

      {/* TASKS */}
      <TouchableOpacity
        style={styles.section}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("TaskView")}
      >
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        <Text style={styles.subText}>
          Pending: {taskStats.pending} | Completed: {taskStats.completed} |
          Overdue: {taskStats.overdue}
        </Text>

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <Text>{task.title}</Text>
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor:
                      task.status.toLowerCase() === "pending"
                        ? "#ffe4cc"
                        : task.status.toLowerCase() === "completed"
                        ? "#dcfce7"
                        : "#f8d7da",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    {
                      color:
                        task.status.toLowerCase() === "pending"
                          ? "#e67e22"
                          : task.status.toLowerCase() === "completed"
                          ? "#2ecc71"
                          : "#dc3545",
                    },
                  ]}
                >
                  {task.status}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.subText}>No tasks available</Text>
        )}
      </TouchableOpacity>

      {/* ATTENDANCE */}
      <View style={styles.attendanceContainer}>
        <Text style={styles.sectionTitle}>My Attendance</Text>
        <Text style={styles.attendanceCheckIn}>
          Last Record:{" "}
          {attendance?.timestamp
            ? formatAPITimestamp(attendance.timestamp)
            : "Not Available"}
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
            <Text style={styles.attendanceValue}>
              {attendanceSummary.weekly}
            </Text>
          </View>

          <View style={[styles.attendanceCard, { backgroundColor: "#FFF3E0" }]}>
            <Ionicons name="calendar-sharp" size={20} color="#EF6C00" />
            <Text style={styles.attendanceLabel}>This Month</Text>
            <Text style={styles.attendanceValue}>
              {attendanceSummary.monthly}
            </Text>
          </View>
        </View>
      </View>

      {/* ATTENDANCE SCHEDULER */}
      <View style={[styles.sectionCard, { backgroundColor: "#e6f7ff" }]}>
        <Text style={styles.sectionTitle}>Attendance Scheduler</Text>
        <Text style={styles.subText}>Set your attendance schedule</Text>
        <TouchableOpacity
          style={[
            styles.schedulerButton,
            { backgroundColor: colors.primary || "#1e90ff" },
          ]}
          onPress={() => navigation.navigate("timeSchedular")}
        >
          <Ionicons
            name="calendar"
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.schedulerButtonText}>Schedule Attendance</Text>
        </TouchableOpacity>
      </View>

      {/* BREAK SCHEDULER */}
      <View style={[styles.sectionCard, { backgroundColor: "#e6f7ff" }]}>
        <Text style={styles.sectionTitle}>Break Scheduler</Text>
        <Text style={styles.subText}>Set your break in and break out schedule</Text>
        <TouchableOpacity
          style={[
            styles.schedulerButton,
            { backgroundColor: "#1e90ff" },
          ]}
          onPress={() => navigation.navigate("breakTimeScheduler")}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.schedulerButtonText}>Schedule Break In / Out</Text>
        </TouchableOpacity>
      </View>

      {/* LEAVES */}
      <TouchableOpacity
        style={styles.section}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("Leave")}
      >
        <Text style={styles.sectionTitle}>
          Apply Leave <Text style={styles.subText}>({leavesTaken} days taken)</Text>
        </Text>
        <View style={styles.leaveRow}>
          <Text style={styles.leaveType}>Total Leaves Taken</Text>
          <Text style={styles.leaveCount}>{leavesTaken} days</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", flex: 1, marginTop: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    justifyContent: "space-between",
  },

  greetingContainer: { flex: 1, alignItems: "center" },
  greeting: { fontSize: 14, color: "#888" },
  name: { fontSize: 18, fontWeight: "bold", color: "#222" },

  avatar: { width: 40, height: 40, borderRadius: 20, marginLeft: 10 },
  menuIconLeft: { marginRight: 5 },
  notificationIcon: { marginRight: 10 },
  rightIcons: { flexDirection: "row", alignItems: "center" },

  infoRow: { flexDirection: "row", justifyContent: "space-between" },

  infoCard: {
    flex: 0.48,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  infoTitle: { marginTop: 6, fontSize: 12, color: "#444" },
  infoValue: { fontWeight: "bold", fontSize: 14, color: "#111" },

  section: {
    backgroundColor: "#f8f8f8",
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
  },

  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  subText: { fontSize: 12, color: "#666" },

  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  tagText: { fontSize: 12, fontWeight: "bold" },

  sectionCard: { padding: 14, borderRadius: 12, marginVertical: 10 },

  attendanceContainer: {
    backgroundColor: "#f8f0ff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  attendanceCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  attendanceLabel: { fontSize: 13, color: "#444", marginTop: 4 },
  attendanceValue: { fontSize: 16, fontWeight: "bold", color: "#000", marginTop: 4 },

  attendanceCheckIn: { fontSize: 12, color: "#666", marginTop: 4 },

  leaveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  leaveType: { fontSize: 14, color: "#333" },
  leaveCount: { fontWeight: "bold", color: "#000" },

  schedulerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },

  schedulerButtonText: { color: "#fff", fontWeight: "600" },

  scrollContent: { paddingBottom: 120 },
});

export default DashboardScreen;
