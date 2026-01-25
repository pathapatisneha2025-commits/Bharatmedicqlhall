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
      Alert.alert("Error", "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleExpand = (name) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded(expanded === name ? null : name);
  };

  const getStatusColor = (status) => {
    switch ((status || "Pending").toLowerCase()) {
      case "completed":
        return "#16a34a"; // green
      case "pending":
        return "#f59e0b"; // amber
      case "overdue":
        return "#dc2626"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Tasks</Text>
      </View>

      {/* SUMMARY CARDS */}
      <View style={{ width: "100%", alignItems: "center" }}>
        <View style={styles.contentWrapper}>
          <View style={styles.summaryRow}>
            <SummaryCard title="Completed" value="1" bg="#d1fae5" />
            <SummaryCard title="Pending" value="16" bg="#fef3c7" />
            <SummaryCard title="Overdue" value="0" bg="#fee2e2" />
          </View>
        </View>
      </View>

      {/* EMPLOYEE LIST */}
      <FlatList
        data={tasksData}
        keyExtractor={(item) => item.employee_name}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={{ width: "100%", alignItems: "center" }}>
            {/* MOBILE-LIKE CARD */}
            <View style={[styles.contentWrapper, styles.employeeCard]}>
              <TouchableOpacity
                style={styles.employeeRow}
                onPress={() => toggleExpand(item.employee_name)}
              >
                <Icon
                  name={expanded === item.employee_name ? "expand-more" : "chevron-right"}
                  size={22}
                />
                <Text style={styles.employeeName}>{item.employee_name}</Text>
                <TouchableOpacity style={styles.summaryBtn}>
                  <Text style={styles.summaryBtnText}>Summarise</Text>
                </TouchableOpacity>
              </TouchableOpacity>

{/* TASK TABLE */}
{expanded === item.employee_name && (
  <ScrollView horizontal style={{ marginTop: 12 }}>
    <View style={styles.taskTable}>
      {/* TABLE HEADER */}
      <View style={[styles.taskRow, styles.taskHeader]}>
        <Text style={[styles.taskCell, styles.taskTitle]}>Task</Text>
        <Text style={[styles.taskCell, styles.taskStatus]}>Status</Text>
        <Text style={[styles.taskCell, styles.taskTime]}>Time Taken</Text>
      </View>

      {/* TABLE ROWS */}
      {item.tasks.map((t) => (
        <View key={t.id} style={styles.taskRow}>
          <Text style={[styles.taskCell, styles.taskTitle]}>{t.title}</Text>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(t.status) }]}>
            <Text style={styles.statusText}>{t.status || "Pending"}</Text>
          </View>

          <Text style={[styles.taskCell, styles.taskTime]}>
            {t.completed_time ? formatDuration(t.created_at, t.completed_time) : "-"}
          </Text>
        </View>
      ))}
    </View>
  </ScrollView>
)}

            </View>
          </View>
        )}
      />
    </ScrollView>
  );
};

export default AdminEmployeeTasksScreen;

const SummaryCard = ({ title, value, bg }) => (
  <View style={[styles.summaryCard, { backgroundColor: bg }]}>
    <Text style={styles.summaryTitle}>{title}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 12 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },

  // MOBILE-LIKE WRAPPER
  contentWrapper: {
    width: "100%",
    maxWidth: 500,
  },

  // SUMMARY CARDS
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    flexBasis: "48%",
    minWidth: 140,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  summaryTitle: { fontWeight: "600", marginBottom: 6, fontSize: 14 },
  summaryValue: { fontSize: 18, fontWeight: "bold" },

  // EMPLOYEE LIST
  employeeCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginVertical: 6 },
  employeeRow: { flexDirection: "row", alignItems: "center" },
  employeeName: { flex: 1, fontWeight: "600", marginLeft: 8 },
  summaryBtn: { backgroundColor: "#2563eb", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  summaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  // TASK TABLE
 // TASK TABLE
taskTable: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, overflow: "hidden" },

taskRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e7eb",
},

taskHeader: { backgroundColor: "#f3f4f6" },

taskCell: { fontSize: 14, fontWeight: "500" },

// Column flex
taskTitle: { flex: 3 },
taskStatus: { flex: 1, textAlign: "center" },
taskTime: { flex: 1, textAlign: "center" },

statusBadge: {
  flex: 1,
  paddingVertical: 4,
  paddingHorizontal: 6,
  borderRadius: 6,
  alignItems: "center",
  justifyContent: "center",
  marginHorizontal: 4,
},

statusText: { color: "#fff", fontWeight: "600", fontSize: 12 },

});
