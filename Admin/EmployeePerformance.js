import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // ✅ Add this import

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AllEmployeesPerformance() {
  const [employees, setEmployees] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation(); // ✅ Initialize navigation

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${BASE_URL}/employee/all`);
        const data = await res.json();
        if (data.success) {
          setEmployees(data.employees || []);
        }
      } catch (err) {
        console.error("❌ Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Toggle expand and fetch employee data
  const toggleExpand = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    if (!details[id]) {
      try {
        const [tasksRes, attendanceRes, leaveRes] = await Promise.all([
          fetch(`${BASE_URL}/task/employee/${id}`),
          fetch(`${BASE_URL}/employeekpi/attendancesummary/${id}`),
          fetch(`${BASE_URL}/employeekpi/leavessummary/${id}`),
        ]);

        const [tasksData, attendanceData, leaveData] = await Promise.all([
          tasksRes.json(),
          attendanceRes.json(),
          leaveRes.json(),
        ]);

        const employeeDetails = {
          tasks: tasksData.tasks || [],
          attendance: attendanceData.summary || null,
          leaveSummary: leaveData.summary || null,
        };

        setDetails((prev) => ({ ...prev, [id]: employeeDetails }));
      } catch (error) {
        console.error("Error fetching details:", error);
      }
    }
  };

  // Filter employees by name or department
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 10, color: "#555" }}>Loading employees...</Text>
      </View>
    );
  }

  return (
   <ScrollView
  style={styles.container}
  contentContainerStyle={{ paddingBottom: 120 }}
  bounces={true}
  overScrollMode="always"
>

<View style={styles.topHeader}>
  <TouchableOpacity onPress={() => navigation.navigate("AdminDashboard")}>
    <Ionicons name="arrow-back" size={24} color="#2c3e50" />
  </TouchableOpacity>
  <Text style={styles.header}>All Employees Performance</Text>
</View>

      {/* 🔍 Search Bar */}
      <View style={styles.searchContainer}>
      
        <Ionicons name="search" size={18} color="#888" style={{ marginHorizontal: 8 }} />
        <TextInput
          placeholder="Search by name or department..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholderTextColor="#000"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {filteredEmployees.length === 0 ? (
        <Text style={styles.noData}>No employees found.</Text>
      ) : (
        filteredEmployees.map((emp) => {
          const empDetails = details[emp.id] || {};
          const { tasks = [], attendance, leaveSummary } = empDetails;

          // Calculate percentages
          const completedCount = tasks.filter((t) => t.status === "completed").length;
          const completionRate =
            tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

          const attendanceRate = attendance
            ? Math.round((attendance.total_present / attendance.total_days) * 100)
            : 0;

          const leaveUsage =
            leaveSummary && leaveSummary.total_annual_paid_leaves > 0
              ? Math.round(
                  (leaveSummary.annual_used_leaves /
                    leaveSummary.total_annual_paid_leaves) *
                    100
                )
              : 0;

          return (
            <View key={emp.id} style={styles.empCard}>
              <View style={styles.empHeader}>
                <View>
                  <Text style={styles.empName}>{emp.full_name}</Text>
                  <Text style={styles.empDept}>
                    <Ionicons name="briefcase-outline" size={13} color="#3498db" />{" "}
                    {emp.department || "N/A"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => toggleExpand(emp.id)}
                >
                  <Text style={styles.viewBtnText}>
                    {expanded[emp.id] ? "Hide" : "Performance"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Expanded Section */}
              {expanded[emp.id] && (
                <View style={styles.expandedArea}>
                  {/* Tasks */}
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="clipboard-outline" size={18} color="#2980b9" /> Task
                    Overview
                  </Text>
                  {tasks.length > 0 ? (
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
                    <Text style={styles.noData}>No tasks found.</Text>
                  )}

                  {/* Attendance */}
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="calendar-outline" size={18} color="#3498db" />{" "}
                    Attendance Summary
                  </Text>
                  {attendance ? (
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
                  ) : (
                    <Text style={styles.noData}>No attendance data.</Text>
                  )}

                  {/* Leave */}
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="bed-outline" size={18} color="#27ae60" /> Leave Summary
                  </Text>
                  {leaveSummary ? (
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
                  ) : (
                    <Text style={styles.noData}>No leave data.</Text>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

/* ---------- Reusable Components ---------- */
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
  container: { flex: 1, backgroundColor: "#f9fbfc", padding: 15 , marginTop: 30},
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
 topHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 15,
  gap: 10,
},
header: {
  fontSize: 20,
  fontWeight: "700",
  color: "#2c3e50",
},

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 15,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 4,
  },
  empCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  empHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  empName: { fontSize: 16, fontWeight: "600", color: "#2c3e50" },
  empDept: { fontSize: 12, color: "#7f8c8d", marginTop: 2 },
  viewBtn: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  expandedArea: { marginTop: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 10,
    marginBottom: 5,
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
    marginVertical: 10,
  },
  statLabel: { fontSize: 12, color: "#555" },
  statValue: { fontSize: 16, fontWeight: "700" },
  noData: {
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: 13,
    marginVertical: 8,
  },
});
