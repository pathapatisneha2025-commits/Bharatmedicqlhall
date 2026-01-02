import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const RecurringAdminTasksScreen = () => {
  const navigation = useNavigation();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Counters for dashboard cards
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Not Started");
  const [recurringType, setRecurringType] = useState("Daily");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/Admintask/all"
      );
      const data = await response.json();

      if (data.success) {
        const updated = data.data.map((task) => {
          const due = new Date(task.duedate);
          const now = new Date();

          let taskStatus = task.status;

          // Auto-mark overdue
          if (taskStatus !== "Completed" && due < now) {
            taskStatus = "Overdue";
          }

          return { ...task, status: taskStatus };
        });

        setTasks(updated);
        setFilteredTasks(updated);

        // update dashboard counters
        setPendingCount(updated.filter((t) => t.status === "Pending" || t.status === "Not Started").length);
        setCompletedCount(updated.filter((t) => t.status === "Completed").length);
        setOverdueCount(updated.filter((t) => t.status === "Overdue").length);
      } else {
        Alert.alert("Error", "Failed to load tasks");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to fetch tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  // Search Filter
  const handleSearch = (text) => {
    setSearchQuery(text);

    if (text.trim() === "") {
      setFilteredTasks(tasks);
      return;
    }

    const term = text.toLowerCase();
    const filtered = tasks.filter(
      (task) =>
        task.assignedto.some((email) => email.toLowerCase().includes(term)) ||
        task.priority.toLowerCase().includes(term)
    );

    setFilteredTasks(filtered);
  };

  // Delete Task
  const deleteTask = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(
              `https://hospitaldatabasemanagement.onrender.com/Admintask/delete/${id}`,
              { method: "DELETE" }
            );
            const data = await response.json();

            if (data.success) {
              Alert.alert("Success", "Task deleted successfully");
              fetchTasks();
            } else {
              Alert.alert("Error", data.message || "Failed to delete task");
            }
          } catch (error) {
            Alert.alert("Error", "Unable to delete task");
          }
        },
      },
    ]);
  };

  // Open Edit Modal
  const openEditModal = (task) => {
    setEditTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setAssignedTo(task.assignedto.join(","));
    setCollaborators(task.collaborators.join(","));
    setPriority(task.priority);
    setStatus(task.status);
    setRecurringType(task.recurringtype);
    setStartDate(new Date(task.startdate));
    setEndDate(new Date(task.duedate));
    setModalVisible(true);
  };

  // Update Task
  const updateTask = async () => {
    if (!editTask) return;

    const payload = {
      title,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      assignedTo: assignedTo.split(","),
      priority,
      collaborators: collaborators.split(","),
      attachment: null,
      description,
      status,
      recurringType,
    };

    try {
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/Admintask/update/${editTask.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert("Success", "Task updated successfully");
        setModalVisible(false);
        fetchTasks();
      } else {
        Alert.alert("Error", data.message || "Failed to update task");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update task");
    }
  };
if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading...</Text>
      </View>
    );
  // Render Task Card
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.icons}>
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <MaterialIcons name="edit" size={22} color="#007bff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => deleteTask(item.id)}
            style={{ marginLeft: 15 }}
          >
            <MaterialIcons name="delete" size={22} color="red" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.rowInfo}>
        <Ionicons name="person-outline" size={16} color="#555" />
        <Text style={styles.infoText}>
          Assigned: {item.assignedto.join(", ")}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <FontAwesome name="flag" size={16} color="#555" />
        <Text style={styles.infoText}>Priority: {item.priority}</Text>
      </View>

      {/* NEW — SHOW STATUS */}
      <View style={styles.rowInfo}>
        <MaterialIcons name="task" size={16} color="#555" />
        <Text style={[styles.infoText, { fontWeight: "bold" }]}>
          Status: {item.status}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <MaterialIcons name="repeat" size={16} color="#555" />
        <Text style={styles.infoText}>Recurring: {item.recurringtype}</Text>
      </View>

      <View style={styles.rowInfo}>
        <Ionicons name="calendar-outline" size={16} color="#555" />
        <Text style={styles.infoText}>
          Start: {new Date(item.startdate).toLocaleString()}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <Ionicons name="calendar-outline" size={16} color="#555" />
        <Text style={styles.infoText}>
          Due: {new Date(item.duedate).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("AdminDashboard")}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Admin Tasks</Text>

        <TouchableOpacity
          style={{ marginLeft: "auto" }}
          onPress={() => navigation.navigate("createRecurringTaskScreen")}
        >
          <Ionicons name="add-circle-outline" size={28} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* SUMMARY CARDS */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#fff3cd" }]}>
          <Text style={styles.summaryValue}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: "#d4edda" }]}>
          <Text style={styles.summaryValue}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: "#f8d7da" }]}>
          <Text style={styles.summaryValue}>{overdueCount}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#555"
          style={{ marginRight: 8 }}
        />

        <TextInput
          placeholder="Search by email or priority..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* LIST */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* MODAL … (unchanged) */}
    </View>
  );
};

export default RecurringAdminTasksScreen;

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 30, backgroundColor: "#f4f6f8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },

  /* Summary Cards */
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  summaryValue: { fontSize: 20, fontWeight: "bold" },
  summaryLabel: { fontSize: 14, marginTop: 4 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    elevation: 2,
  },
  searchInput: { flex: 1, height: 40, color: "#000" },

  card: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "bold" },
  icons: { flexDirection: "row" },
  description: { marginVertical: 5, color: "#555" },
  rowInfo: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  infoText: { marginLeft: 5, color: "#555", fontSize: 13 },
});
