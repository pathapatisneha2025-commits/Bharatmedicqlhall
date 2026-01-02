import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage"; // 👈 adjust path if needed
import { useNavigation } from "@react-navigation/native";

export default function EmpPerformanceDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Attendance states
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
const navigation = useNavigation();

  // Leave summary states
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = await getEmployeeId();

        if (!id) {
          console.warn("⚠️ No employee ID found in storage.");
          setLoading(false);
          setAttendanceLoading(false);
          setLeaveLoading(false);
          return;
        }

        // ✅ Fetch tasks
        const tasksResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/task/employee/${id}`
        );
        const tasksData = await tasksResponse.json();

        if (tasksData.success && Array.isArray(tasksData.tasks)) {
          const uniqueTasks = Array.from(
            new Map(tasksData.tasks.map((task) => [task.id, task])).values()
          );
          setTasks(uniqueTasks);
        }

        // ✅ Fetch attendance summary
        const attendanceResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/employeekpi/attendancesummary/${id}`
        );
        const attendanceData = await attendanceResponse.json();

        if (attendanceData.success && attendanceData.summary) {
          setAttendance(attendanceData.summary);
        }

        // ✅ Fetch leave summary
        const leaveResponse = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/employeekpi/leavessummary/${id}`
        );
        const leaveData = await leaveResponse.json();

        if (leaveData.success && leaveData.summary) {
          setLeaveSummary(leaveData.summary);
        }
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
        setAttendanceLoading(false);
        setLeaveLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Calculate completion %
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const completionRate =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // ✅ Attendance %
  const attendanceRate = attendance
    ? Math.round((attendance.total_present / attendance.total_days) * 100)
    : 0;

  // ✅ Leave usage %
  const leaveUsage =
    leaveSummary && leaveSummary.total_annual_paid_leaves > 0
      ? Math.round(
          (leaveSummary.annual_used_leaves /
            leaveSummary.total_annual_paid_leaves) *
            100
        )
      : 0;
if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );
  return (
    <ScrollView style={styles.container}>
<View style={styles.headerContainer}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
    <Ionicons name="arrow-back" size={26} color="#2c3e50" />
  </TouchableOpacity>
  </View>

  <Text style={styles.pageTitle}>My Performance Overview</Text>
      {/* Top Cards */}
      <View style={styles.row}>
        <Card
          icon="checkmark-done-outline"
          title="Tasks Completed"
          value={`${completedCount} / ${tasks.length || 0}`}
          subtext="↑ 95% vs last month"
          color="#eafaf1"
          iconColor="#2ecc71"
        />
        <Card
          icon="calendar-outline"
          title="Attendance Rate"
          value={attendanceLoading ? "Loading..." : `${attendanceRate || 0}%`}
          subtext="↑ 98% vs last month"
          color="#ebf5fb"
          iconColor="#3498db"
        />
      </View>

      <View style={styles.row}>
        <Card
          icon="time-outline"
          title="Leave Balance"
          value={
            leaveLoading
              ? "Loading..."
              : `${leaveSummary?.remaining_annual_paid_leaves || 0} days`
          }
          color="#f5faf6"
          iconColor="#27ae60"
        />
        <Card
          icon="alert-circle-outline"
          title="Pending Requests"
          value="0"
          color="#fef9e7"
          iconColor="#f1c40f"
        />
      </View>

      <Text style={styles.subHeader}>Detailed Performance Areas</Text>

      {/* My Tasks Overview */}
      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>
          <Ionicons name="clipboard-outline" size={18} color="#2980b9" /> My
          Tasks Overview
        </Text>

        <View style={styles.circlePlaceholder}>
          {loading ? (
            <ActivityIndicator size="small" color="#27ae60" />
          ) : (
            <Text style={styles.circleText}>{completionRate}%</Text>
          )}
        </View>

        <View style={{ marginTop: 10 }}>
          {loading ? (
            <Text style={{ textAlign: "center", color: "#7f8c8d" }}>
              Loading tasks...
            </Text>
          ) : tasks.length > 0 ? (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TaskItem
                  name={item.title}
                  status={item.status}
                  priority={item.priority}
                />
              )}
            />
          ) : (
            <Text style={{ textAlign: "center", color: "#7f8c8d" }}>
              No tasks available.
            </Text>
          )}
        </View>
      </View>

      {/* Attendance Summary */}
      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>
          <Ionicons name="calendar-outline" size={18} color="#3498db" />{" "}
          Attendance Summary
        </Text>

        {attendanceLoading ? (
          <ActivityIndicator size="small" color="#3498db" />
        ) : attendance ? (
          <>
            <View style={styles.circlePlaceholderBlue}>
              <Text style={styles.circleText}>{attendanceRate}%</Text>
              <Text style={{ color: "#777", marginTop: 5 }}>This Month</Text>
            </View>

            <View style={styles.statsRow}>
              <Stat
                label="Present"
                value={attendance.total_present}
                color="#2ecc71"
              />
              <Stat label="Late" value={attendance.total_late} color="#f1c40f" />
              <Stat
                label="Absent"
                value={attendance.total_absent}
                color="#e74c3c"
              />
            </View>
            <Text style={styles.totalDays}>
              Total Days: {attendance.total_days}
            </Text>
          </>
        ) : (
          <Text style={{ textAlign: "center", color: "#7f8c8d" }}>
            No attendance data available.
          </Text>
        )}
      </View>

      {/* ✅ Leave Balance & History */}
      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>
          <Ionicons name="bed-outline" size={18} color="#27ae60" /> Leave
          Balance & History
        </Text>

        {leaveLoading ? (
          <ActivityIndicator size="small" color="#27ae60" />
        ) : leaveSummary ? (
          <>
            <View style={styles.statsRow}>
              <Stat
                label="Taken"
                value={leaveSummary.annual_used_leaves}
                color="#3498db"
              />
              <Stat
                label="Remaining"
                value={leaveSummary.remaining_annual_paid_leaves}
                color="#2ecc71"
              />
              <Stat
                label="Monthly Paid"
                value={leaveSummary.monthly_paid_leaves}
                color="#f39c12"
              />
            </View>
            <Text style={styles.leaveUsage}>Leave Usage: {leaveUsage}%</Text>
          </>
        ) : (
          <Text style={{ textAlign: "center", color: "#7f8c8d" }}>
            No leave data available.
          </Text>
        )}
      </View>

      {/* Overall Performance Rating */}
      <View style={styles.blockCard}>
        <Text style={styles.blockTitle}>
          <Ionicons name="stats-chart-outline" size={18} color="#16a085" />{" "}
          Overall Performance Rating
        </Text>
        <View style={styles.circlePlaceholderGreen}>
          <Text style={styles.circleText}>94%</Text>
          <Text style={{ color: "#777", marginTop: 5 }}>
            Performance Score
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- Reusable Components ---------- */
const Card = ({ icon, title, value, subtext, color, iconColor }) => (
  <View style={[styles.card, { backgroundColor: color }]}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    {subtext && <Text style={styles.cardSubtext}>{subtext}</Text>}
  </View>
);

const TaskItem = ({ name, status, priority }) => (
  <View style={styles.taskItem}>
    <View>
      <Text style={styles.taskName}>{name}</Text>
      <Text
        style={[
          styles.taskStatus,
          { color: status === "completed" ? "#27ae60" : "#e74c3c" },
        ]}
      >
        {status}
      </Text>
    </View>
    <Text
      style={[
        styles.priorityTag,
        {
          backgroundColor:
            priority === "High"
              ? "#f8d7da"
              : priority === "Medium"
              ? "#fff3cd"
              : "#d4edda",
          color:
            priority === "High"
              ? "#c0392b"
              : priority === "Medium"
              ? "#b7950b"
              : "#27ae60",
        },
      ]}
    >
      {priority}
    </Text>
  </View>
);

const Stat = ({ label, value, color }) => (
  <View style={{ alignItems: "center" }}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfc",
    padding: 15,
     marginTop:20,
  },
 headerContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 10,
  marginTop: 10,
},

backButton: {
  padding: 6,
  marginRight: 10,
  borderRadius: 8,
  backgroundColor: "#eef3f6",
},

pageTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#2c3e50",
},

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    margin: 5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 5,
    color: "#34495e",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 5,
    color: "#2c3e50",
  },
  cardSubtext: {
    fontSize: 11,
    color: "#27ae60",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginTop: 15,
    marginBottom: 10,
  },
  blockCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#2c3e50",
  },
  circlePlaceholder: {
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 7,
    borderColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
  },
  circlePlaceholderBlue: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 7,
    borderColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  circlePlaceholderGreen: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 7,
    borderColor: "#16a085",
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f4f6f7",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
  },
  taskName: { fontSize: 13, fontWeight: "600", color: "#2c3e50" },
  taskStatus: { fontSize: 11 },
  priorityTag: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statLabel: { fontSize: 12, color: "#555" },
  statValue: { fontSize: 18, fontWeight: "700" },
  totalDays: {
    textAlign: "center",
    color: "#555",
    marginTop: 8,
    fontSize: 12,
  },
  leaveUsage: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
    fontSize: 13,
  },
});
