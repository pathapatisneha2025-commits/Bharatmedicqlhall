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
import { Pencil, Trash2, ArrowLeft, Clock } from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const TaskAssignment = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("recent");
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal States
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

  // ✅ Fetch all tasks
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
    } catch (error) {
      console.error("Error fetching tasks:", error);
      Alert.alert("Error", "Failed to fetch tasks.");
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

  // ✅ DELETE Task
  const deleteTask = (taskId) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/task/delete/${taskId}`, {
              method: "DELETE",
            });
            const data = await res.json();
            if (res.ok) {
              Alert.alert("Deleted", data.message || "Task deleted successfully");
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
              setFilteredTasks((prev) => prev.filter((t) => t.id !== taskId));
            } else {
              Alert.alert("Error", data.message || "Failed to delete task");
            }
          } catch (error) {
            Alert.alert("Error", "Something went wrong while deleting the task.");
          }
        },
      },
    ]);
  };

  // ✅ Open Edit Modal
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

  // ✅ Update Task (PUT)
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

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", data.message || "Task updated successfully");
        setEditModalVisible(false);
        await fetchTasks();
      } else {
        Alert.alert("Error", data.message || "Failed to update task");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while updating the task.");
    }
  };

  const handleDateConfirm = (date) => {
    setEditDueDate(date.toISOString().split("T")[0]);
    setShowDatePicker(false);
  };

  const handleTimeConfirm = (time) => {
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const seconds = time.getSeconds().toString().padStart(2, "0");
    setEditDueTime(`${hours}:${minutes}:${seconds}`);
    setShowTimePicker(false);
  };

  // ✅ Filters
  const applyFiltersAndSort = useCallback(() => {
    let updated = [...tasks];
    if (statusFilter !== "All") {
      updated = updated.filter(
        (t) => (t.status || "pending").toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (priorityFilter !== "All") {
      updated = updated.filter(
        (t) => t.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }
    updated.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
    });
    setFilteredTasks(updated);
  }, [tasks, statusFilter, priorityFilter, sortOrder]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // ✅ Render each task
  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskDate}>Created: {new Date(item.created_at).toLocaleDateString()}</Text>
          <Text style={styles.taskDate}>
            Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : "-"}{" "}
            {item.due_time || ""}
          </Text>
        </View>
        <TouchableOpacity onPress={() => openEditModal(item)} style={{ marginLeft: 10 }}>
          <Pencil size={20} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteTask(item.id)} style={{ marginLeft: 10 }}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.assignedText}>Assigned To: {item.assignto?.join(", ") || "N/A"}</Text>
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
        <TouchableOpacity
          style={styles.createTaskButton}
          onPress={() => navigation.navigate("CreateTask")}
        >
          <Text style={styles.createTaskButtonText}>+ Create Task</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Picker selectedValue={statusFilter} onValueChange={setStatusFilter} style={styles.filterPicker}>
          <Picker.Item label="All Status" value="All" />
          <Picker.Item label="Pending" value="pending" />
          <Picker.Item label="Completed" value="completed" />
          <Picker.Item label="Overdue" value="overdue" />
        </Picker>
        <Picker selectedValue={priorityFilter} onValueChange={setPriorityFilter} style={styles.filterPicker}>
          <Picker.Item label="All Priority" value="All" />
          <Picker.Item label="High" value="High" />
          <Picker.Item label="Medium" value="Medium" />
          <Picker.Item label="Low" value="Low" />
        </Picker>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : filteredTasks.length === 0 ? (
        <Text style={styles.noTask}>No tasks found</Text>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderTask}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563eb"]} />
          }
        />
      )}

      {/* Edit Modal */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 10, marginTop: 30 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  createTaskButton: { backgroundColor: "#2563eb", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createTaskButtonText: { color: "#fff", fontWeight: "bold" },
  filtersContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  filterPicker: { flex: 1, marginHorizontal: 4, backgroundColor: "#fff", borderRadius: 8 },
  taskItem: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  taskTitle: { fontSize: 16, fontWeight: "bold" },
  taskDate: { fontSize: 12, color: "#6b7280" },
  assignedText: { marginTop: 5, fontSize: 12, color: "#374151" },
  noTask: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#6b7280" },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 10, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { backgroundColor: "#f3f4f6", padding: 10, borderRadius: 8, marginBottom: 10 },
  cancelButton: { backgroundColor: "#ef4444", padding: 12, borderRadius: 8, flex: 1, marginRight: 5 },
  cancelButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  saveButton: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, flex: 1, marginLeft: 5 },
  saveButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});

export default TaskAssignment;
