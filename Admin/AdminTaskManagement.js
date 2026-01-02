// screens/TaskAssignment.js
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
  Modal,
  ScrollView,
} from "react-native";
import {
  Pencil,
  Trash2,
  ArrowLeft,
  Clock,
  Calendar,
  Search,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const TaskAssignment = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Edit Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTaskData, setEditTaskData] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editPriority, setEditPriority] = useState("Low");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDueTime, setEditDueTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const navigation = useNavigation();

  // Fetch tasks
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

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
  };

  // ✨ STATUS COUNTS FOR CARDS
  const completedCount = tasks.filter(
    (t) => t.status?.toLowerCase() === "completed"
  ).length;

  const pendingCount = tasks.filter(
    (t) => (t.status || "pending").toLowerCase() === "pending"
  ).length;

  const overdueCount = tasks.filter((t) => {
    if (!t.due_date) return false;
    const today = new Date();
    const due = new Date(t.due_date);
    return due < today && t.status?.toLowerCase() !== "completed";
  }).length;

  // Search filter
  useEffect(() => {
    let updated = [...tasks];

    if (searchText.trim() !== "") {
      updated = updated.filter(
        (t) =>
          t.title.toLowerCase().includes(searchText.toLowerCase()) ||
          (t.assignto?.join(", ") || "")
            .toLowerCase()
            .includes(searchText.toLowerCase())
      );
    }
    setFilteredTasks(updated);
  }, [searchText, tasks]);

  // Delete task
  const deleteTask = (taskId) => {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/task/delete/${taskId}`, {
              method: "DELETE",
            });
            await fetchTasks();
          } catch (e) {
            Alert.alert("Error", "Could not delete");
          }
        },
      },
    ]);
  };

  // Open edit modal
  const openEditModal = (task) => {
    setEditTaskData(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditAssignee(task.assignto?.[0] || "");
    setEditPriority(task.priority);
    setEditDueDate(task.due_date?.split("T")[0]);
    setEditDueTime(task.due_time || "");
    setEditModalVisible(true);
  };

  // Update task
  const updateTask = async () => {
    if (!editTaskData) return;

    try {
      const body = {
        title: editTitle,
        description: editDescription,
        assignto: editAssignee,
        priority: editPriority,
        due_date: editDueDate,
        due_time: editDueTime,
      };

      const res = await fetch(`${BASE_URL}/task/update/${editTaskData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await fetchTasks();
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update task");
    }
  };
   if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading task...</Text>
      </View>
    );
  }

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskDate}>
            Created: {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.taskDate}>
            Due:{" "}
            {item.due_date
              ? new Date(item.due_date).toLocaleDateString()
              : "-"}{" "}
            {item.due_time || ""}
          </Text>
        </View>
{item.status?.toLowerCase() === "completed" && item.completed_time && (
  <Text style={styles.taskDate}>
    Completed On: {new Date(item.completed_time).toLocaleString()}
  </Text>
)}

        <TouchableOpacity onPress={() => openEditModal(item)}>
          <Pencil size={20} color="#2563eb" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginLeft: 10 }}
          onPress={() => deleteTask(item.id)}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.assignedText}>
        Assigned To: {item.assignto?.join(", ") || "N/A"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Task Assignment</Text>

        <TouchableOpacity
          style={styles.createTaskButton}
          onPress={() => navigation.navigate("CreateTask")}
        >
          <Text style={styles.createTaskButtonText}>+ Create Task</Text>
        </TouchableOpacity>
      </View>

      {/* ✨ SUMMARY CARDS */}
      <View style={styles.cardRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#d1fae5" }]}>
          <Text style={styles.cardTitle}>Completed</Text>
          <Text style={styles.cardCount}>{completedCount}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: "#fef3c7" }]}>
          <Text style={styles.cardTitle}>Pending</Text>
          <Text style={styles.cardCount}>{pendingCount}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: "#fee2e2" }]}>
          <Text style={styles.cardTitle}>Overdue</Text>
          <Text style={styles.cardCount}>{overdueCount}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.filterCard}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#6b7280" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or assignee..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : filteredTasks.length === 0 ? (
        <Text style={styles.noTask}>No tasks found</Text>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTask}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 10, marginTop: 30 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  createTaskButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createTaskButtonText: { color: "#fff", fontWeight: "bold" },

  // ✨ CARDS
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 3,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 5,
  },
  cardCount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },

  filterCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
  },
  searchContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 6,
  },

  taskItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  taskTitle: { fontSize: 16, fontWeight: "bold" },
  taskDate: { fontSize: 12, color: "#6b7280" },
  assignedText: { marginTop: 5, fontSize: 12, color: "#374151" },
  noTask: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#6b7280",
  },
});

export default TaskAssignment;
