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
  const [loadingCount, setLoadingCount] = useState(0);
  
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
        showAlert("Error", "Failed to load tasks");
      }
    } catch (error) {
      showAlert("Error", "Unable to fetch tasks");
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

  const filtered = tasks.filter((task) => {
    const assignedEmails = Array.isArray(task.assignedto)
      ? task.assignedto.join(",").toLowerCase()
      : "";

    const priority = task.priority
      ? task.priority.toLowerCase()
      : "";

    return (
      assignedEmails.includes(term) ||
      priority.includes(term)
    );
  });

  setFilteredTasks(filtered);
};


  // Delete Task
  const deleteTask = async (id) => {
    showAlert("Confirm Delete", "Are you sure you want to delete this task?", [
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
              showAlert("Success", "Task deleted successfully");
              fetchTasks();
            } else {
              showAlert("Error", data.message || "Failed to delete task");
            }
          } catch (error) {
            showAlert("Error", "Unable to delete task");
          }
        },
      },
    ]);
  };

  // Open Edit Modal
  const openEditModal = (task) => {
  if (!task) return;

  setEditTask(task);
  setTitle(task.title || "");
  setDescription(task.description || "");
  setAssignedTo(Array.isArray(task.assignedto) ? task.assignedto.join(",") : "");
  setCollaborators(Array.isArray(task.collaborators) ? task.collaborators.join(",") : "");
  setPriority(task.priority || "Medium");
  setStatus(task.status || "Not Started");
  setRecurringType(task.recurringtype || "Daily");
  setStartDate(task.startdate ? new Date(task.startdate) : new Date());
  setEndDate(task.duedate ? new Date(task.duedate) : new Date());
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
       showAlert("Success", "Task updated successfully");
        setModalVisible(false);
        fetchTasks();
      } else {
        showAlert("Error", data.message || "Failed to update task");
      }
    } catch (error) {
     showAlert("Error", "Unable to update task");
    }
  };
if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>loading{loadingCount}s</Text>
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
  Assigned: {Array.isArray(item.assignedto) ? item.assignedto.join(", ") : item.assignedto || "N/A"}
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
      {/* EDIT / CREATE TASK MODAL */}
<Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>

  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Edit Task</Text>

        {/* Title */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Assigned To */}
        <Text style={styles.label}>Assigned To (comma separated emails)</Text>
        <TextInput
          style={styles.input}
          value={assignedTo}
          onChangeText={setAssignedTo}
        />

        {/* Collaborators */}
        <Text style={styles.label}>Collaborators (comma separated emails)</Text>
        <TextInput
          style={styles.input}
          value={collaborators}
          onChangeText={setCollaborators}
        />

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <TextInput
          style={styles.input}
          value={priority}
          onChangeText={setPriority}
        />

        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <TextInput
          style={styles.input}
          value={status}
          onChangeText={setStatus}
        />

        {/* Recurring Type */}
        <Text style={styles.label}>Recurring Type</Text>
        <TextInput
          style={styles.input}
          value={recurringType}
          onChangeText={setRecurringType}
        />

        {/* Start Date */}
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowStartPicker(true)}
        >
          <Text>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {/* End Date */}
        <Text style={styles.label}>Due Date</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowEndPicker(true)}
        >
          <Text>{endDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}

        {/* Buttons */}
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#ccc" }]}
            onPress={() => setModalVisible(false)}
          >
            <Text>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#007bff" }]}
            onPress={updateTask}
          >
            <Text style={{ color: "#fff" }}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>

    </View>
  );
};

export default RecurringAdminTasksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Lighter, modern blue-grey background
    paddingTop: Platform.OS === "ios" ? 50 : 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },

  // HEADER
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginLeft: 15,
    color: "#1e293b",
  },

  /* Summary Cards */
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 18,
    marginHorizontal: 6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryValue: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1e293b" 
  },
  summaryLabel: { 
    fontSize: 12, 
    marginTop: 4, 
    color: "#64748b", 
    fontWeight: "700",
    textTransform: "uppercase" 
  },

  // SEARCH
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { 
    flex: 1, 
    height: "100%", 
    color: "#1e293b",
    fontSize: 15,
  },

  // TASK CARD
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#0f172a", 
    flex: 1, 
    marginRight: 10 
  },
  icons: { 
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 6,
    borderRadius: 10,
  },
  description: { 
    marginBottom: 15, 
    color: "#475569", 
    fontSize: 14, 
    lineHeight: 20 
  },
  rowInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 8,
  },
  infoText: { 
    marginLeft: 8, 
    color: "#334155", 
    fontSize: 13,
    fontWeight: "500" 
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)", // Blurry dark overlay
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "92%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    marginBottom: 20, 
    color: "#1e293b",
    textAlign: 'center' 
  },
  label: { 
    fontSize: 13, 
    fontWeight: "700", 
    marginTop: 15, 
    marginBottom: 6, 
    color: "#64748b",
    textTransform: "uppercase" 
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    backgroundColor: "#f8fafc",
    fontSize: 15,
    color: "#1e293b",
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f8fafc",
    height: 48,
    justifyContent: "space-between",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
    marginBottom: 10
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "700"
  }
});
