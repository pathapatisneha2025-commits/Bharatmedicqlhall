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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const DepartmentChartScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Admin View");
  const [expandedDept, setExpandedDept] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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

    /* 1️⃣ latest TODAY attendance per employee */
    const todayAttendance = {};

    attendance.forEach((a) => {
      if (!a.timestamp.startsWith(today)) return;

      const prev = todayAttendance[a.employee_id];
      if (!prev || new Date(a.timestamp) > new Date(prev.timestamp)) {
        todayAttendance[a.employee_id] = a;
      }
    });

    /* 2️⃣ normalize status for UI */
    const getStatusLabel = (status) => {
      if (status === "On Duty") return "Present";
      if (status === "Off Duty") return "On Leave";
      if (status === "On Break") return "On Break";
      return "Absent";
    };

    /* 3️⃣ group employees by department */
    const deptMap = {};

    employees.forEach((emp) => {
      const deptName = emp.department?.trim() || "Others";

      if (!deptMap[deptName]) {
        deptMap[deptName] = {
          name: deptName,
          employees: [],
        };
      }

      const att = todayAttendance[emp.id];

      deptMap[deptName].employees.push({
        id: emp.id,
        name: emp.full_name,
        email: emp.email,
        role: emp.role,
        status: att ? getStatusLabel(att.status) : "Absent",
      });
    });

    setDepartments(Object.values(deptMap));
  } catch (err) {
    Alert.alert("Error", "Unable to load admin department data");
  } finally {
    setLoading(false);
  }
};


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
    <View
      style={[
        styles.employeeCard,
        { backgroundColor: statusColors[item.status] || "#95a5a6" },
      ]}
    >
      <Ionicons name="person" size={22} color="#fff" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.empName}>{item.name}</Text>
        <Text style={styles.empEmail}>{item.email}</Text>
        <Text style={styles.empRole}>Role: {item.role || "N/A"}</Text>
        <Text style={styles.empStatus}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Department Chart</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["Admin View", "Department View"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "Department View" ? (
          <>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#1E88E5"
                style={{ marginTop: 30 }}
              />
            ) : (
              <View style={styles.summaryContainer}>
                {Object.entries(summary).map(([key, value]) => {
                  let color = "#2980b9";
                  if (key === "present") color = "#27ae60";
                  else if (key === "onLeave") color = "#f1c40f";
                  else if (key === "onBreak") color = "#3498db";
                  else if (key === "absent") color = "#c0392b";

                  return (
                    <View key={key} style={styles.summaryCard}>
                      <Text style={[styles.summaryTitle, { color }]}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                      <Text style={styles.summaryValue}>{value}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.legendContainer}>
              {Object.keys(statusColors).map((status) => (
                <View key={status} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: statusColors[status] }]}
                  />
                  <Text style={styles.legendText}>{status}</Text>
                </View>
              ))}
            </View>

            <View style={styles.deptContainer}>
              <Text style={styles.deptHeader}>All Departments</Text>

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color="#1E88E5"
                  style={{ marginTop: 30 }}
                />
              ) : departments.length === 0 ? (
                <Text style={styles.noDeptText}>No departments found.</Text>
              ) : (
                departments.map((dept) => (
                  <View key={dept.name} style={styles.deptSection}>
                    <TouchableOpacity
                      style={styles.deptRow}
                      onPress={() => toggleExpand(dept.name)}
                    >
                      <Ionicons
                        name={
                          expandedDept[dept.name]
                            ? "chevron-down"
                            : "chevron-forward"
                        }
                        size={18}
                        color="#333"
                      />
                      <Text style={styles.deptName}>
                        {dept.name} ({dept.employees.length})
                      </Text>
                    </TouchableOpacity>

                    {expandedDept[dept.name] && dept.employees.length > 0 && (
                      <FlatList
                        data={dept.employees}
                        renderItem={renderEmployee}
                        keyExtractor={(item, idx) => idx.toString()}
                      />
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DepartmentChartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f3f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    margin: 10,
    elevation: 5,
  },
  backButton: {
    padding: 6,
    borderRadius: 50,
    backgroundColor: "#1565C0",
    marginRight: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  scrollView: { paddingBottom: 40 },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    backgroundColor: "#dfe6e9",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    elevation: 2,
  },
  tab: { flex: 1, padding: 12, alignItems: "center" },
  activeTab: { backgroundColor: "#1E88E5" },
  tabText: { fontSize: 14, color: "#2d3436" },
  activeTabText: { color: "#fff", fontWeight: "700" },

  summaryContainer: { marginTop: 20, marginHorizontal: 15 },
  summaryCard: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    borderRadius: 14,
    marginVertical: 6,
    alignItems: "center",
    elevation: 3,
  },
  summaryTitle: { fontSize: 16, fontWeight: "600" },
  summaryValue: { fontSize: 22, fontWeight: "700", color: "#2d3436", marginTop: 4 },

  legendContainer: {
    flexDirection: "row",
    margin: 15,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 6,
  },
  legendDot: { width: 14, height: 14, borderRadius: 7, marginRight: 6 },
  legendText: { fontSize: 13, color: "#333", fontWeight: "500" },

  deptContainer: { marginHorizontal: 15, marginBottom: 40 },
  deptHeader: { fontSize: 18, fontWeight: "700", marginVertical: 10, color: "#2d3436" },
  deptSection: { marginBottom: 10, backgroundColor: "#fff", borderRadius: 12, padding: 8, elevation: 2 },
  deptRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  deptName: { fontSize: 16, marginLeft: 8, color: "#2d3436", fontWeight: "600" },
  noDeptText: { textAlign: "center", color: "#777", marginTop: 20, fontSize: 15 },

  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginVertical: 5,
    elevation: 2,
  },
  empName: { fontSize: 15, color: "#fff", fontWeight: "700" },
  empEmail: { fontSize: 13, color: "#f0f0f0", marginTop: 2 },
  empRole: { fontSize: 13, color: "#f0f0f0", marginTop: 2 },
  empStatus: { fontSize: 13, color: "#fff", marginTop: 2, fontStyle: "italic" },
});
