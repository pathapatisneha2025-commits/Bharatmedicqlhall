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
  SafeAreaView,
  Modal,
  ScrollView
} from "react-native";
import { Pencil, Trash2, ArrowLeft, Search , Calendar, Clock, User} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";
const STATUS_COLORS = {
  completed: "#d1fae5",
  pending: "#fef3c7",
  overdue: "#fee2e2",
};
const theme = {
  bg: "#f3f4f6",       // background color for badge
  text: "#1e293b",     // text color
  border: "#2563eb",   // border/stripe color
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
const [editModalVisible, setEditModalVisible] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);
// Edit Modal States
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
  const { width } = useWindowDimensions();
const isWeb = Platform.OS === "web";
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
    const handleDateConfirm = (date) => {
  setEditDueDate(date.toISOString().split("T")[0]);
  setShowDatePicker(false);
};

const handleTimeConfirm = (time) => {
  const formatted = time.toTimeString().slice(0, 5);
  setEditDueTime(formatted);
  setShowTimePicker(false);
};
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
const updateTask = async () => {
  try {
    await fetch(`${BASE_URL}/task/update/${editTaskData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        assignees: [editAssignee],
        priority: editPriority,
        due_date: editDueDate,
        due_time: editDueTime,
      }),
    });

    setEditModalVisible(false);
    fetchTasks();
  } catch (error) {
    showAlert("Error", "Failed to update task");
  }
};
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
      showAlert("Error", "Failed to fetch tasks");
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
    showAlert("Delete Task", "Are you sure?", [
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
      <View style={[styles.taskCard, isWeb && { width: 600, alignSelf: 'center' }]}>
        <View style={[styles.statusStripe, { backgroundColor: theme.border }]} />
        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <View style={styles.metaRow}>
                <Calendar size={14} color="#6b7280" />
              Created: {new Date(item.created_at).toLocaleDateString()} by {item.created_by || "N/A"}
              </View>
            </View>
            <View style={styles.actionButtons}>
           <TouchableOpacity
  onPress={() => openEditModal(item)}
  style={styles.iconBtn}
>
  <Pencil size={18} color="#2563eb" />
</TouchableOpacity>

              <TouchableOpacity onPress={() => deleteTask(item.id)} style={[styles.iconBtn, { backgroundColor: '#fef2f2' }]}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.metaRow}>
              <Clock size={14} color="#374151" />
              <Text style={styles.detailLabel}>Due:</Text>
              <Text style={styles.detailValue}>{item.due_date ? new Date(item.due_date).toLocaleDateString() : "-"} {item.due_time || ""}</Text>
            </View>
            <View style={styles.metaRow}>
              <User size={14} color="#374151" />
              <Text style={styles.detailLabel}>Assignees:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{item.assignees?.join(", ") || "Unassigned"}</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={[styles.badge, { backgroundColor: theme.bg }]}>
              <Text style={[styles.badgeText, { color: theme.text }]}>{status.toUpperCase()}</Text>
            </View>
          {status === "completed" && item.completed_time && (
                      <Text style={styles.taskDate}>
                        Time Taken: {formatDuration(item.created_at, item.completed_time)}
                      </Text>
                    )}
          </View>
        </View>
      </View>
    );
  };


return (
  <SafeAreaView style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
        <ArrowLeft size={24} color="#1f2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Task Matrix</Text>
      <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate("CreateTask")}>
        <Text style={styles.createBtnText}>+ Create</Text>
      </TouchableOpacity>
    </View>

    {/* FlatList */}
    <FlatList
      data={filteredTasks}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderTask}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />}
      ListHeaderComponent={
        <View style={isWeb && { width: 600, alignSelf: 'center' }}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <StatCard label="Completed" value={completedCount} color="#10b981" />
            <StatCard label="Pending" value={pendingCount} color="#f59e0b" />
            <StatCard label="Overdue" value={overdueCount} color="#ef4444" />
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks or team..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Time Filter Tabs */}
          <View style={styles.filterStrip}>
            {["all", "daily", "weekly", "monthly"].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setTimeFilter(f)}
                style={[styles.filterTab, timeFilter === f && styles.activeFilterTab]}
              >
                <Text style={[styles.filterTabText, timeFilter === f && styles.activeFilterTabText]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>No tasks found matching your criteria</Text>}
      contentContainerStyle={{ padding: 16 }}
    />

    {/* EDIT TASK MODAL */}
     <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Task</Text>

              <TextInput style={styles.input} placeholder="Title" value={editTitle} onChangeText={setEditTitle} />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Assign To (email)"
                value={editAssignee}
                onChangeText={setEditAssignee}
              />

              <Picker selectedValue={editPriority} onValueChange={setEditPriority} style={styles.input}>
                <Picker.Item label="High" value="High" />
                <Picker.Item label="Medium" value="Medium" />
                <Picker.Item label="Low" value="Low" />
              </Picker>

              {/* Date Picker */}
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center" }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{editDueDate || "Select Due Date"}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setShowDatePicker(false)}
              />

              {/* Time Picker */}
              <TouchableOpacity
                style={[styles.input, { flexDirection: "row", alignItems: "center" }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={18} color="#374151" style={{ marginRight: 8 }} />
                <Text>{editDueTime || "Select Due Time"}</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showTimePicker}
                mode="time"
                onConfirm={handleTimeConfirm}
                onCancel={() => setShowTimePicker(false)}
                is24Hour={true}
              />

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={updateTask}>
                  <Text style={styles.saveButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  </SafeAreaView>
);

};

const StatCard = ({ label, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerIcon: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  createBtn: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: "#fff", fontWeight: "700" },

  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 12,
    alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", marginTop: 4, textTransform: 'uppercase' },

  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    paddingHorizontal: 16, borderRadius: 12, height: 50, borderWidth: 1, borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: "#1e293b" ,  outlineStyle: "none",   // ✅ removes web rectangle
},

  filterStrip: { flexDirection: "row", backgroundColor: "#e2e8f0", padding: 4, borderRadius: 10, marginBottom: 20 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  activeFilterTab: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, elevation: 2 },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  activeFilterTabText: { color: "#2563eb" },

  taskCard: {
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 16,
    flexDirection: "row", overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  statusStripe: { width: 6 },
  taskContent: { flex: 1, padding: 16 },
  taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  taskTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  metaText: { fontSize: 12, color: "#64748b" },
  
  actionButtons: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 8 },

  detailsBox: { backgroundColor: "#f8fafc", padding: 10, borderRadius: 10, marginVertical: 12 },
  detailLabel: { fontSize: 12, fontWeight: "700", color: "#475569" },
  detailValue: { fontSize: 12, color: "#1e293b", flex: 1 },

  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  durationText: { fontSize: 12, color: "#64748b", fontWeight: "600" },

  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 15 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  width: "90%",
  maxWidth: 400,
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 12,
  elevation: 5,
},
modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#1e293b" },
modalBackground: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  alignItems: "center",
},

modalContent: {
  width: "92%",
  maxWidth: 450,
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 20,
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 8,
},

modalTitle: {
  fontSize: 20,
  fontWeight: "800",
  color: "#1e293b",
  marginBottom: 16,
  textAlign: "center",
},

input: {
  borderWidth: 1,
  borderColor: "#e2e8f0",
  backgroundColor: "#f8fafc",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 12,
  marginBottom: 12,
  fontSize: 14,
  color: "#1e293b",
},

cancelButton: {
  flex: 1,
  backgroundColor: "#f1f5f9",
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center",
  marginRight: 8,
},

cancelButtonText: {
  color: "#475569",
  fontWeight: "700",
},

saveButton: {
  flex: 1,
  backgroundColor: "#2563eb",
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center",
},

saveButtonText: {
  color: "#ffffff",
  fontWeight: "700",
},


});

export default TaskAssignment;