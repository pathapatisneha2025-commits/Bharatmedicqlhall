import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  FlatList,
} from "react-native";
import { Ionicons, Feather, Entypo, MaterialIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";

// Configure local notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const TaskScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignto, setAssignto] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState("12:00:00");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const empId = await getEmployeeId();
      if (!empId) {
        console.warn("No employee ID found in storage");
        setTasks([]);
        return;
      }

      const response = await fetch(`${BASE_URL}/task/employee/${empId}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      if (data && Array.isArray(data.tasks)) {
        const formattedTasks = data.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          assignto: Array.isArray(task.assignto)
            ? task.assignto.join(", ")
            : task.assignto,
          due: `${new Date(task.due_date).toLocaleDateString()} ${task.due_time}`,
          priority: task.priority,
          status:
            task.status?.toLowerCase() === "overdue"
              ? "Overdue"
              : task.status?.toLowerCase() === "completed"
              ? "Completed"
              : "Pending",
          raw_due_date: task.due_date,
          raw_due_time: task.due_time,
          created_at: task.created_at,         // 👈 ADD
  completed_time: task.completed_time,
        }));
        setTasks(formattedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Send local notification
  const sendLocalNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  };

  // Mark task as completed using POST API
  const markTaskComplete = async (taskId) => {
    try {
      const response = await fetch(`${BASE_URL}/task/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "completed" }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: "Completed" } : task
        )
      );

      Alert.alert("Success", data.message || "Task marked as completed ✅");
      sendLocalNotification("Task Completed 🎉", "You have completed a task!");
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task status");
    }
  };

  // Edit task
  const editTask = (task) => {
    setEditMode(true);
    setEditTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setAssignto(task.assignto);
    setPriority(task.priority);
    setDueDate(new Date(task.raw_due_date));
    setDueTime(task.raw_due_time);
  };

  // Update task via PUT API
  const handleUpdateTask = async () => {
    if (!title || !description || !assignto) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/task/update/${editTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          assignto,
          priority,
          due_date: dueDate.toISOString().split("T")[0],
          due_time: dueTime,
        }),
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();

      Alert.alert("Success", data.message);
      setEditMode(false);
      setEditTaskId(null);
      fetchTasks();
    } catch (error) {
      console.error("Update Task Error:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${BASE_URL}/task/delete/${taskId}`, {
              method: "DELETE",
            });

            if (!response.ok)
              throw new Error(`HTTP error! Status: ${response.status}`);

            await response.json();
            setTasks((prevTasks) =>
              prevTasks.filter((task) => task.id !== taskId)
            );
            Alert.alert("Deleted", "Task deleted successfully");
            sendLocalNotification("Task Deleted ❌", "A task was removed.");
          } catch (error) {
            console.error("Error deleting task:", error);
            Alert.alert("Error", "Failed to delete task");
          }
        },
      },
    ]);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const h = selectedTime.getHours().toString().padStart(2, "0");
      const m = selectedTime.getMinutes().toString().padStart(2, "0");
      setDueTime(`${h}:${m}:00`);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "All") return true;
    if (filter === "Pending")
      return task.status !== "Completed" && task.status !== "Overdue";
    if (filter === "Overdue") return task.status === "Overdue";
    return true;
  });
const calculateTimeTaken = (start, end) => {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffMs = endDate - startDate;
  const diffMinutes = Math.floor(diffMs / 60000);

  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, []);

 useFocusEffect(
  useCallback(() => {
    fetchTasks();   // auto-refresh when screen is focused
  }, [])
);

 if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );

  const renderTaskItem = ({ item: task }) => (
    <View
      style={[
        styles.taskCard,
        task.priority === "High" && styles.high,
        task.priority === "Medium" && styles.medium,
        task.priority === "Low" && styles.low,
        task.status === "Completed" && styles.completed,
        task.status === "Overdue" && styles.overdue,
      ]}
    >
      <View style={styles.taskTopRow}>
        <View style={styles.taskLabel}>
          {task.priority === "High" && (
            <>
              <Entypo name="warning" size={16} color="#e74c3c" />
              <Text style={[styles.priorityText, { color: "#e74c3c" }]}>
                {" "}HIGH PRIORITY
              </Text>
            </>
          )}
          {task.priority === "Medium" && (
            <>
              <Entypo name="dot-single" size={16} color="#f1c40f" />
              <Text style={[styles.priorityText, { color: "#f1c40f" }]}>
                {" "}MEDIUM
              </Text>
            </>
          )}
          {task.priority === "Low" && (
            <>
              <Entypo name="dot-single" size={16} color="#7f8c8d" />
              <Text style={[styles.priorityText, { color: "#7f8c8d" }]}>
                {" "}LOW
              </Text>
            </>
          )}
          {task.status === "Completed" && (
            <>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={[styles.priorityText, { color: "#27ae60" }]}>
                {" "}COMPLETED
              </Text>
            </>
          )}
          {task.status === "Overdue" && (
            <>
              <Ionicons name="alert-circle" size={16} color="#e74c3c" />
              <Text style={[styles.priorityText, { color: "#e74c3c" }]}>
                {" "}OVERDUE
              </Text>
            </>
          )}
        </View>

        <View style={styles.editDeleteIcons}>
          <TouchableOpacity onPress={() => editTask(task)}>
            <Feather name="edit" size={18} color="#2f80ed" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteTask(task.id)}
            style={{ marginLeft: 10 }}
          >
            <MaterialIcons name="delete" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[
          styles.taskTitle,
          task.status === "Completed" && {
            textDecorationLine: "line-through",
            color: "#555",
          },
        ]}
      >
        {task.title}
      </Text>
      <Text style={styles.taskDesc}>{task.description}</Text>
      <Text style={styles.assigntoText}>Assigned to: {task.assignto}</Text>
      <View style={styles.taskBottomRow}>
        <Text style={styles.dueText}>Due: {task.due}</Text>

        {task.status !== "Completed" ? (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => markTaskComplete(task.id)}
          >
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        ) : (
<View>
  <Text style={{ color: "#27ae60", fontWeight: "bold" }}>
    ✔ Done
  </Text>

  {task.created_at && task.completed_time && (
    <Text style={{ color: "#2c3e50", fontSize: 11, marginTop: 2 }}>
      Completed in: {calculateTimeTaken(task.created_at, task.completed_time)}
    </Text>
  )}
</View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity  onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Tasks</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => navigation.navigate("createtaskemp")}
          >
            <Text style={styles.addTaskButtonText}>Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("tasknotification")}>
            <Feather
              name="bell"
              size={20}
              color="#333"
              style={{ marginLeft: 12 }}
            />
            {notificationCount > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.notifCount}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {["All", "Pending", "Overdue"].map((type) => (
          <TouchableOpacity
            key={type}
            style={filter === type ? styles.filterActive : null}
            onPress={() => setFilter(type)}
          >
            <Text
              style={filter === type ? styles.filterTextActive : styles.filterText}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Edit Form */}
      {editMode ? (
        <View style={styles.editForm}>
          <Text style={styles.editHeader}>Edit Task</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
          />

          <TextInput
            style={[styles.input, { height: 80 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            multiline
          />

          <TextInput
            style={styles.input}
            value={assignto}
            onChangeText={setAssignto}
            placeholder="Assign To (Email)"
          />

          <View style={styles.pickerBox}>
            <Picker
              selectedValue={priority}
              onValueChange={(val) => setPriority(val)}
            >
              <Picker.Item label="High" value="High" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Low" value="Low" />
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{dueDate.toISOString().split("T")[0]}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text>{dueTime}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.saveButton, { flex: 1, marginRight: 5 }]}
              onPress={handleUpdateTask}
            >
              <Text style={styles.saveButtonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { flex: 1, marginLeft: 5 }]}
              onPress={() => setEditMode(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: "#e8f0ff" }]}>
              <Text style={styles.statNumber}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#e6f7ec" }]}>
              <Text style={[styles.statNumber, { color: "#27ae60" }]}>
                {tasks.filter((t) => t.status === "Completed").length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#fff8e6" }]}>
              <Text style={[styles.statNumber, { color: "#f39c12" }]}>
                {
                  tasks.filter(
                    (t) => t.status !== "Completed" && t.status !== "Overdue"
                  ).length
                }
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#ffe6e6" }]}>
              <Text style={[styles.statNumber, { color: "#e74c3c" }]}>
                {tasks.filter((t) => t.status === "Overdue").length}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          </View>

          {/* Task List */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#2f80ed"
              style={{ marginTop: 20 }}
            />
          ) : filteredTasks.length === 0 ? (
            <Text style={{ textAlign: "center", marginTop: 20, color: "#555" }}>
              No tasks found
            </Text>
          ) : (
            <FlatList
              data={filteredTasks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTaskItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      )}
    </View>
  );
};

export default TaskScreen;

// Styles (keep same as your original code)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  addTaskButton: {
    backgroundColor: "#2f80ed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  addTaskButtonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  notificationDot: {
    position: "absolute",
    top: -5,
    right: 20,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  notifCount: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  filters: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  filterActive: {
    borderBottomWidth: 2,
    borderColor: "#2f80ed",
    paddingBottom: 4,
  },
  filterTextActive: { color: "#2f80ed", fontWeight: "bold" },
  filterText: { color: "#888" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#2f80ed" },
  statLabel: { fontSize: 12, color: "#555" },
  taskCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    elevation: 1,
  },
  taskTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    justifyContent: "space-between",
  },
  taskLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    flex: 1,
  },
  editDeleteIcons: { flexDirection: "row" },
  priorityText: { fontSize: 12, fontWeight: "bold" },
  taskTitle: { fontSize: 14, fontWeight: "bold", marginVertical: 4 },
  taskDesc: { fontSize: 12, color: "#555", marginBottom: 4 },
  assigntoText: { fontSize: 12, color: "#555", marginBottom: 8 },
  taskBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueText: { fontSize: 12, color: "#888" },
  completeButton: {
    backgroundColor: "#2f80ed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButtonText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  high: { borderColor: "#e74c3c", borderWidth: 1, backgroundColor: "#fff6f6" },
  medium: { borderColor: "#f1c40f", borderWidth: 1, backgroundColor: "#fffce8" },
  low: { borderColor: "#7f8c8d", borderWidth: 1 },
  completed: { borderColor: "#27ae60", borderWidth: 1, backgroundColor: "#ecfdf5" },
  overdue: { borderColor: "#e74c3c", borderWidth: 1, backgroundColor: "#fff1f0" },
  editForm: {
    backgroundColor: "#f5f7fa",
    padding: 16,
    borderRadius: 12,
    flex: 1,
  },
  editHeader: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  saveButton: {
    backgroundColor: "#2f80ed",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: { color: "#fff", fontWeight: "bold" },
});
