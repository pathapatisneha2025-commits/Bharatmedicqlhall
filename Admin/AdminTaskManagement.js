import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Pencil, Trash2, ArrowLeft, Search } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";
const STATUS_COLORS = {
  completed: "#d1fae5",
  pending: "#fef3c7",
  overdue: "#fee2e2",
};

const formatDuration = (start, end) => {
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
  return result.join(" ") || "0s";
};

const TaskAssignment = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
const [timeFilter, setTimeFilter] = useState("all"); // "all", "daily", "weekly", "monthly"

  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const fetchTasks = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await fetch(`${BASE_URL}/task/all`);
      const data = await response.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        setFilteredTasks(data.tasks);
      } else {
        setTasks([]);
        setFilteredTasks([]);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to fetch tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTasks(); }, []));
  const onRefresh = async () => { setRefreshing(true); await fetchTasks(); };

  const completedCount = tasks.filter(t => t.status?.toLowerCase() === "completed").length;
  const pendingCount = tasks.filter(t => (t.status || "pending").toLowerCase() === "pending").length;
  const overdueCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status?.toLowerCase() !== "completed").length;

  useEffect(() => {
    let updated = [...tasks];
    if (searchText.trim() !== "") {
      updated = updated.filter(
        t => t.title.toLowerCase().includes(searchText.toLowerCase()) ||
             (t.assignees?.join(", ") || "").toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredTasks(updated);
  }, [searchText, tasks]);

  const deleteTask = (taskId) => {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${BASE_URL}/task/delete/${taskId}`, { method: "DELETE" });
            await fetchTasks();
          } catch (e) { Alert.alert("Error", "Could not delete"); }
        },
      },
    ]);
  };
const applyTimeFilter = (tasksList) => {
  if (timeFilter === "all") return tasksList;

  const now = new Date();
  return tasksList.filter((task) => {
    if (!task.due_date) return false;
    const due = new Date(task.due_date);

    if (timeFilter === "daily") {
      return due.toDateString() === now.toDateString();
    }
    if (timeFilter === "weekly") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      return due >= weekStart && due <= weekEnd;
    }
    if (timeFilter === "monthly") {
      return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
    }
    return true;
  });
};

// Update your filteredTasks useEffect to include the time filter
useEffect(() => {
  let updated = [...tasks];

  if (searchText.trim() !== "") {
    updated = updated.filter(
      t =>
        t.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.assignees?.join(", ") || "").toLowerCase().includes(searchText.toLowerCase())
    );
  }

  // Apply the time filter
  updated = applyTimeFilter(updated);

  setFilteredTasks(updated);
}, [searchText, tasks, timeFilter]);
  const renderTask = ({ item }) => {
    const status = (item.status || "pending").toLowerCase();
    const statusColor = STATUS_COLORS[status] || "#f3f4f6";

    return (
      <View
        style={[
          styles.taskItem,
          {
            borderLeftColor: statusColor,
            width: Platform.OS === "web" ? 500 : "100%",
          },
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDate}>
              Created: {new Date(item.created_at).toLocaleDateString()} by {item.created_by || "N/A"}
            </Text>
            <Text style={styles.taskDate}>
              Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : "-"} {item.due_time || ""}
            </Text>
            {status === "completed" && item.completed_time && (
              <Text style={styles.taskDate}>
                Time Taken: {formatDuration(item.created_at, item.completed_time)}
              </Text>
            )}
            <Text style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              {status.toUpperCase()}
            </Text>
            <Text style={styles.assignedText}>
              Assigned To: {item.assignees?.join(", ") || "N/A"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginLeft: 10 }}>
            <TouchableOpacity onPress={() => Alert.alert("Edit Task", "Edit modal here")}>
              <Pencil size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 12 }} onPress={() => deleteTask(item.id)}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading tasks...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Assignment</Text>
        <TouchableOpacity style={styles.createTaskButton} onPress={() => navigation.navigate("CreateTask")}>
          <Text style={styles.createTaskButtonText}>+ Create Task</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={[styles.cardRow, Platform.OS === "web" ? { justifyContent: "center" } : {}]}>
        <View style={[styles.summaryCard, { backgroundColor: STATUS_COLORS.completed }]}>
          <Text style={styles.cardTitle}>Completed</Text>
          <Text style={styles.cardCount}>{completedCount}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: STATUS_COLORS.pending }]}>
          <Text style={styles.cardTitle}>Pending</Text>
          <Text style={styles.cardCount}>{pendingCount}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: STATUS_COLORS.overdue }]}>
          <Text style={styles.cardTitle}>Overdue</Text>
          <Text style={styles.cardCount}>{overdueCount}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.filterCard, Platform.OS === "web" ? { width: 520, alignSelf: "center" } : {}]}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, Platform.OS === "web" ? { fontSize: 16 } : {}]}
            placeholder="Search by title or assignee..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>
<View style={{ flexDirection: "row", justifyContent: "space-around", marginVertical: 10 }}>
  {["all", "daily", "weekly", "monthly"].map((f) => (
    <TouchableOpacity
      key={f}
      onPress={() => setTimeFilter(f)}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: timeFilter === f ? "#2563eb" : "#f3f4f6",
      }}
    >
      <Text style={{ color: timeFilter === f ? "#fff" : "#111827", fontWeight: "600" }}>
        {f.charAt(0).toUpperCase() + f.slice(1)}
      </Text>
    </TouchableOpacity>
  ))}
</View>

{/* Tasks List */}
 {filteredTasks.length === 0 ? (
        <Text style={styles.noTask}>No tasks found</Text>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTask}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />}
          numColumns={1}
          contentContainerStyle={{ alignItems: Platform.OS === "web" ? "center" : "stretch", paddingBottom: 30 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 10, paddingTop: 30 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111827", flex: 1, textAlign: "center" },
  createTaskButton: { backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  createTaskButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap" },
  summaryCard: { flex: 1, padding: 18, borderRadius: 12, marginHorizontal: 6, marginVertical: 8, elevation: 3, alignItems: "center", maxWidth: 220 },
  cardTitle: { fontSize: 15, color: "#374151", fontWeight: "600", marginBottom: 6 },
  cardCount: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  filterCard: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 15, elevation: 3 },
  searchContainer: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, fontSize: 15, color: "#111827", paddingVertical: 6 },
  taskItem: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 14, elevation: 2, borderLeftWidth: 6 },
  taskTitle: { fontSize: 17, fontWeight: "bold", color: "#111827", marginBottom: 5 },
  taskDate: { fontSize: 13, color: "#6b7280" },
  assignedText: { marginTop: 7, fontSize: 13, color: "#374151" },
  statusBadge: { marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 14, color: "#111827", fontWeight: "bold", fontSize: 13 },
  noTask: { textAlign: "center", marginTop: 25, fontSize: 16, color: "#6b7280" },
});

export default TaskAssignment;
