import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

const API_BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const formatDuration = (start, end) => {
  if (!start || !end) return "-";
  const startDate = new Date(start);
  const endDate = new Date(end);
  let diff = Math.abs(endDate - startDate);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  const seconds = Math.floor(diff / 1000);

  let result = [];
  if (days) result.push(`${days}d`);
  if (hours) result.push(`${hours}h`);
  if (minutes) result.push(`${minutes}m`);
  if (seconds && !days && !hours && !minutes) result.push(`${seconds}s`);

  return result.join(" ") || "-";
};

const AdminEmployeeTasksScreen = () => {
  const navigation = useNavigation();
  const [tasksData, setTasksData] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.style !== "cancel");
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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/task/all`);
      const result = await res.json();

      if (result.success && Array.isArray(result.tasks)) {
        const grouped = {};
        result.tasks.forEach((task) => {
          const assignees = task.assignees?.length ? task.assignees : ["Unassigned"];
          assignees.forEach((emp) => {
            if (!grouped[emp]) grouped[emp] = [];
            grouped[emp].push(task);
          });
        });

        setTasksData(
          Object.keys(grouped).map((emp) => ({
            employee_name: emp,
            tasks: grouped[emp],
          }))
        );
      }
    } catch (e) {
      showAlert("Error", "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleExpand = (name) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === name ? null : name);
  };

  const getStatusColor = (status) => {
    switch ((status || "Pending").toLowerCase()) {
      case "completed":
        return "#10B981"; // green-500
      case "pending":
        return "#F59E0B"; // amber-500
      case "overdue":
        return "#EF4444"; // red-500
      default:
        return "#6B7280"; // gray-500
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}>
      {/* HEADER */}
      <View style={[styles.header, { width: isDesktop ? "80%" : "90%" }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Overview</Text>
        <TouchableOpacity onPress={fetchTasks} style={styles.backBtn}>
          <Icon name="refresh" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* SUMMARY CARDS */}
      <View style={[styles.contentWrapper, { width: isDesktop ? "80%" : "90%" }]}>
        <View style={styles.summaryRow}>
          <SummaryCard title="Completed" value="1" color="#059669" bg="#ECFDF5" flex={isDesktop ? 1 : 0.48} />
          <SummaryCard title="Pending" value="16" color="#D97706" bg="#FFFBEB" flex={isDesktop ? 1 : 0.48} />
          <SummaryCard title="Overdue" value="0" color="#DC2626" bg="#FEF2F2" flex={isDesktop ? 1 : 1} />
        </View>
      </View>

      {/* EMPLOYEE LIST */}
      <View style={{ width: isDesktop ? "80%" : "90%" }}>
        {tasksData.map((item) => (
          <View key={item.employee_name} style={styles.employeeCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.employeeRow}
              onPress={() => toggleExpand(item.employee_name)}
            >
              <View style={styles.employeeMainInfo}>
                <Icon
                  name={expanded === item.employee_name ? "keyboard-arrow-down" : "keyboard-arrow-right"}
                  size={24}
                  color="#6b7280"
                />
                <Text style={styles.employeeName}>{item.employee_name}</Text>
              </View>
              <TouchableOpacity style={styles.summaryBtn}>
                <Text style={styles.summaryBtnText}>Report</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {expanded === item.employee_name && (
              <ScrollView horizontal={!isDesktop} style={{ marginTop: 15 }}>
                <View style={[styles.taskTable, { width: isDesktop ? "100%" : 650 }]}>
                  <View style={[styles.taskRow, styles.taskHeader]}>
                    <Text style={[styles.taskCell, styles.taskTitle, { fontWeight: "700" }]}>TASK DESCRIPTION</Text>
                    <Text style={[styles.taskCell, styles.taskStatus, { fontWeight: "700" }]}>STATUS</Text>
                    <Text style={[styles.taskCell, styles.taskTime, { fontWeight: "700" }]}>DURATION</Text>
                  </View>

                  {item.tasks.map((t) => (
                    <View key={t.id} style={styles.taskRow}>
                      <Text style={[styles.taskCell, styles.taskTitle]}>{t.title}</Text>
                      <View style={styles.statusCellWrapper}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(t.status) }]}>
                          <Text style={styles.statusText}>{t.status || "Pending"}</Text>
                        </View>
                      </View>
                      <Text style={[styles.taskCell, styles.taskTime]}>
                        {t.completed_time ? formatDuration(t.created_at, t.completed_time) : "--"}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const SummaryCard = ({ title, value, color, bg, flex }) => (
  <View style={[styles.summaryCard, { backgroundColor: bg, flex: flex, marginHorizontal: 4 }]}>
    <Text style={[styles.summaryTitle, { color: color }]}>{title}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingTop: Platform.OS === "web" ? 20 : 50 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "#fff", elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },

  // Loader
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6b7280", fontWeight: "500" },

  // Summary Cards
  contentWrapper: { marginBottom: 15 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  summaryCard: {
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    minWidth: 110,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  summaryTitle: { fontWeight: "700", marginBottom: 4, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: "800", color: "#111827" },

  // Employee Card
  employeeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  employeeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  employeeMainInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  employeeName: { fontWeight: "700", marginLeft: 8, fontSize: 17, color: "#1f2937" },
  summaryBtn: { backgroundColor: "#eff6ff", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dbeafe" },
  summaryBtnText: { color: "#2563eb", fontWeight: "700", fontSize: 13 },

  // Task Table
  taskTable: { borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", borderWidth: 1, borderColor: "#f3f4f6" },
  taskRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  taskHeader: { backgroundColor: "#F9FAFB" },
  taskCell: { fontSize: 14, color: "#4b5563" },
  taskTitle: { flex: 2.5 },
  taskStatus: { flex: 1, textAlign: "center" },
  taskTime: { flex: 1, textAlign: "center" },

  // Status Badge
  statusCellWrapper: { flex: 1, alignItems: "center" },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, minWidth: 85, alignItems: "center" },
  statusText: { color: "#fff", fontWeight: "700", fontSize: 11, textTransform: "uppercase" },
});

export default AdminEmployeeTasksScreen;