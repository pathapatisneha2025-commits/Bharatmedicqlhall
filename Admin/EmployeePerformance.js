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
  useWindowDimensions,
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
const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;

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
    <View style={styles.webContainer}>
      {/* SIDEBAR */}
    
      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        <View style={styles.contentHeader}>
      <View style={styles.headerLeft}>
  <TouchableOpacity
    style={styles.backBtn}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="arrow-back" size={22} color="#1e293b" />
  </TouchableOpacity>

  <View>
    <Text style={styles.mainTitle}>Employee Performance</Text>
    <Text style={styles.subTitle}>
      Track productivity, attendance, and leave summaries
    </Text>
  </View>
</View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              placeholder="Search employee..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No matching employees found.</Text></View>
          ) : (
            filteredEmployees.map((emp) => {
              const empDetails = details[emp.id] || {};
              const { tasks = [], attendance, leaveSummary } = empDetails;

              return (
                <View key={emp.id} style={styles.empCard}>
                  <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(emp.id)} activeOpacity={0.7}>
                    <View style={styles.empInfo}>
                      <View style={styles.avatarMini}><Text style={styles.avatarText}>{emp.full_name.charAt(0)}</Text></View>
                      <View>
                        <Text style={styles.empName}>{emp.full_name}</Text>
                        <Text style={styles.empDept}>{emp.department || "General Store"}</Text>
                      </View>
                    </View>
                    <Ionicons name={expanded[emp.id] ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
                  </TouchableOpacity>

                  {expanded[emp.id] && (
                    <View style={styles.expandedArea}>
                      <View style={styles.statsGrid}>
                        {/* Attendance Section */}
                        <View style={styles.statsCard}>
                          <Text style={styles.statsTitle}>Attendance</Text>
                          {attendance ? (
                            <View style={styles.statsRow}>
                              <Stat label="Present" value={attendance.total_present} color="#10b981" />
                              <Stat label="Late" value={attendance.total_late} color="#f59e0b" />
                              <Stat label="Absent" value={attendance.total_absent} color="#ef4444" />
                            </View>
                          ) : <ActivityIndicator size="small" color="#2563EB" />}
                        </View>

                        {/* Leave Section */}
                        <View style={styles.statsCard}>
                          <Text style={styles.statsTitle}>Leaves</Text>
                          {leaveSummary ? (
                            <View style={styles.statsRow}>
                              <Stat label="Used" value={leaveSummary.annual_used_leaves} color="#3b82f6" />
                              <Stat label="Left" value={leaveSummary.remaining_annual_paid_leaves} color="#10b981" />
                              <Stat label="Paid" value={leaveSummary.monthly_paid_leaves} color="#8b5cf6" />
                            </View>
                          ) : <ActivityIndicator size="small" color="#2563EB" />}
                        </View>
                      </View>

                      {/* Task Section */}
                      <View style={styles.taskSection}>
                        <Text style={styles.statsTitle}>Active Tasks</Text>
                        {tasks.length > 0 ? (
                          tasks.slice(0, 3).map((task) => (
                            <TaskItem key={task.id} name={task.title} status={task.status} priority={task.priority} />
                          ))
                        ) : <Text style={styles.noData}>No recent tasks.</Text>}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const TaskItem = ({ name, status, priority }) => (
  <View style={styles.taskItem}>
    <View style={{ flex: 1 }}>
      <Text style={styles.taskName} numberOfLines={1}>{name}</Text>
      <Text style={[styles.taskStatus, { color: status === "completed" ? "#10b981" : "#ef4444" }]}>{status}</Text>
    </View>
    <View style={[styles.priorityBadge, priority === "High" ? styles.pHigh : priority === "Medium" ? styles.pMed : styles.pLow]}>
      <Text style={[styles.priorityText, priority === "High" ? styles.ptHigh : priority === "Medium" ? styles.ptMed : styles.ptLow]}>{priority}</Text>
    </View>
  </View>
);

const Stat = ({ label, value, color }) => (
  <View style={styles.statContainer}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  webContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  
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
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutText: { marginLeft: 12, color: '#ef4444', fontWeight: '700' },

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subTitle: { color: '#64748b', marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, width: 300 },
  searchInput: { paddingVertical: 10, marginLeft: 10, flex: 1, fontSize: 14,outlineStyle: "none" },

  // Employee Card
  empCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  empInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#2563EB', fontWeight: 'bold' },
  empName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  empDept: { fontSize: 13, color: '#64748b' },

  // Expanded Area
  expandedArea: { padding: 20, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statsCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statsTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statContainer: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },

  // Tasks
  taskSection: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  taskName: { fontSize: 14, fontWeight: '600', color: '#334155' },
  taskStatus: { fontSize: 12, fontWeight: '500' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pHigh: { backgroundColor: '#fee2e2' }, ptHigh: { color: '#ef4444' },
  pMed: { backgroundColor: '#fef3c7' }, ptMed: { color: '#d97706' },
  pLow: { backgroundColor: '#dcfce7' }, ptLow: { color: '#16a34a' },
  priorityText: { fontSize: 11, fontWeight: '700' },

  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748b' },
  noData: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }
});