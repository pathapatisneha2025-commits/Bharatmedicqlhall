import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
   useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons,MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const DepartmentChartScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Admin View");
  const [expandedDept, setExpandedDept] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
          const [loadingCount, setLoadingCount] = useState(0);

  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    onLeave: 0,
    onBreak: 0,
    absent: 0,
  });

  const statusColors = {
    Present: "#2ecc71",
    Absent: "#e74c3c",
    "On Leave": "#f1c40f",
    "On Break": "#3498db",
    approved: "#27ae60",
    rejected: "#c0392b",
    pending: "#f39c12",
  };
  const { width: SCREEN_WIDTH } = useWindowDimensions();
      const MAX_WIDTH = 420;
      const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
      const showAlert = (title, message, buttons) => {
        if (Platform.OS === "web") {
          if (buttons && buttons.length > 1) {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
              const okBtn = buttons.find(b => b.style !== "cancel");
              okBtn?.onPress?.();
            }
          } else {
            window.alert(`${title}\n\n${message}`);
          }
        } else {
          Alert.alert(title, message, buttons);
        }
      };  
    
      useEffect(() => {
                let interval;
                if (loading) {
                  setLoadingCount(0);
                  interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
                } else clearInterval(interval);
                return () => clearInterval(interval);
              }, [loading]);
  

const fetchTodayAdminDepartmentData = async () => {
    try {
      setLoading(true);

      const [attRes, empRes] = await Promise.all([
        fetch("https://hospitaldatabasemanagement.onrender.com/attendance/all"),
        fetch("https://hospitaldatabasemanagement.onrender.com/employee/all"),
      ]);

      const attJson = await attRes.json();
      const empJson = await empRes.json();

      if (!attJson.success || !empJson.success) {
        Alert.alert("Error", "Failed to load data");
        return;
      }

      const attendance = attJson.data || [];
      const employees = empJson.employees || [];
      const today = new Date().toISOString().split("T")[0];

      const todayAttendance = {};
      attendance.forEach((a) => {
        if (!a.timestamp?.startsWith(today)) return;
        const prev = todayAttendance[a.employee_id];
        if (!prev || new Date(a.timestamp) > new Date(prev.timestamp)) {
          todayAttendance[a.employee_id] = a;
        }
      });

      const getStatusLabel = (status) => {
        if (status === "On Duty") return "Present";
        if (status === "Off Duty") return "On Leave";
        if (status === "On Break") return "On Break";
        return "Absent";
      };

      const deptMap = {};
      employees.forEach((emp) => {
        const deptName = emp.department?.trim() || "Others";
        if (!deptMap[deptName]) {
          deptMap[deptName] = { name: deptName, employees: [] };
        }

        const att = todayAttendance[emp.id];
        const finalStatus = att ? getStatusLabel(att.status) : "Absent";

        deptMap[deptName].employees.push({
          id: emp.id,
          name: emp.full_name,
          email: emp.email,
          role: emp.role,
          status: finalStatus,
        });
      });

      setDepartments(Object.values(deptMap));
    } catch (e) {
      Alert.alert("Error", "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DEPARTMENT SUMMARY (SAFE) ---------------- */
  const fetchTodayDepartmentSummary = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/attendance/all"
      );
      const json = await res.json();

      if (!json.success) return;

      const today = new Date().toISOString().split("T")[0];
      const todayData = json.data.filter((a) =>
        a.timestamp?.startsWith(today)
      );

      let present = 0,
        onLeave = 0,
        onBreak = 0,
        absent = 0;

      todayData.forEach((a) => {
        if (a.status === "On Duty") present++;
        else if (a.status === "Off Duty") onLeave++;
        else if (a.status === "On Break") onBreak++;
        else absent++;
      });

      setSummary({
        total: todayData.length,
        present,
        onLeave,
        onBreak,
        absent,
      });
    } catch (e) {
      Alert.alert("Error", "Unable to load summary");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EFFECT ---------------- */
  useEffect(() => {
    if (activeTab === "Department View") {
      fetchTodayDepartmentSummary();
    } else {
      fetchTodayAdminDepartmentData();
    }
  }, [activeTab]);

  const toggleExpand = (deptName) => {
    setExpandedDept((prev) => ({
      ...prev,
      [deptName]: !prev[deptName],
    }));
  };

 const renderEmployee = ({ item }) => (
    <View style={styles.employeeCard}>
      <View style={[styles.statusIndicator, { backgroundColor: statusColors[item.status] || "#95a5a6" }]} />
      <View style={styles.empInfo}>
        <View style={styles.empHeaderRow}>
          <Text style={styles.empName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || "#95a5a6") + "20" }]}>
            <Text style={[styles.statusBadgeText, { color: statusColors[item.status] || "#95a5a6" }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.empRole}>{item.role || "Staff Member"}</Text>
        <Text style={styles.empEmail}>{item.email}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.circleBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Staff Directory</Text>
          <Text style={styles.headerSub}>Departmental Attendance Chart</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Modern Segmented Control */}
        <View style={styles.tabContainer}>
          {["Admin View", "Department View"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Department View" ? (
          <View style={styles.summaryWrapper}>
            {loading ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.summaryGrid}>
                {Object.entries(summary).map(([key, value]) => (
                  <View key={key} style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{value}</Text>
                    <Text style={styles.summaryLabel}>{key.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.adminWrapper}>
            {/* Status Legend */}
            <View style={styles.legendCard}>
              {Object.keys(statusColors).slice(0, 4).map((status) => (
                <View key={status} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: statusColors[status] }]} />
                  <Text style={styles.legendText}>{status}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>All Departments</Text>

            {loading ? (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loaderText}>Syncing Depts... {loadingCount}s</Text>
              </View>
            ) : departments.length === 0 ? (
              <Text style={styles.emptyText}>No department data available.</Text>
            ) : (
              departments.map((dept) => (
                <View key={dept.name} style={styles.deptCard}>
                  <TouchableOpacity style={styles.deptHeader} onPress={() => toggleExpand(dept.name)}>
                    <View style={styles.deptTitleLeft}>
                      <MaterialCommunityIcons name="office-building" size={20} color="#64748b" />
                      <Text style={styles.deptNameText}>{dept.name}</Text>
                      <View style={styles.countBadge}><Text style={styles.countText}>{dept.employees.length}</Text></View>
                    </View>
                    <Ionicons
                      name={expandedDept[dept.name] ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>

                  {expandedDept[dept.name] && (
                    <View style={styles.deptContent}>
                      {dept.employees.map((emp, idx) => (
                        <View key={idx}>{renderEmployee({ item: emp })}</View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: 20,
    gap: 15,
  },
  circleBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  headerSub: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  scrollView: { paddingHorizontal: 20, paddingBottom: 40 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: "#fff", elevation: 2 },
  tabText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  activeTabText: { color: "#1e293b", fontWeight: "700" },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  summaryCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  summaryValue: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  summaryLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "700", marginTop: 5, letterSpacing: 1 },

  legendCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#64748b", fontWeight: "600" },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 15 },
  deptCard: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden", borderWidth: 1, borderColor: "#f1f5f9" },
  deptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  deptTitleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  deptNameText: { fontSize: 16, fontWeight: "700", color: "#334155" },
  countBadge: { backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  countText: { fontSize: 12, fontWeight: "700", color: "#64748b" },

  deptContent: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: "#f8fafc" },
  employeeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  statusIndicator: { width: 4, height: "100%", borderRadius: 2, marginRight: 12 },
  empInfo: { flex: 1 },
  empHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empName: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  empRole: { fontSize: 12, color: "#64748b", fontWeight: "500", marginTop: 2 },
  empEmail: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },

  loaderCenter: { alignItems: "center", padding: 40 },
  loaderText: { marginTop: 10, color: "#64748b", fontSize: 13 },
  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 20 },
});

export default DepartmentChartScreen;