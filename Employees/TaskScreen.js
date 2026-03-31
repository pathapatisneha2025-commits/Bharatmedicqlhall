import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons, Feather, Entypo, MaterialIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";
const SCREEN_WIDTH = Dimensions.get("window").width;

const TaskScreen = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
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
  const [taskTypeFilter, setTaskTypeFilter] = useState("ALL");
  const [loadingCount, setLoadingCount] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [assignedCount, setAssignedCount] = useState(0);

  const isMounted = useRef(true);

  // --- Logic Functions ---
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

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const empId = await getEmployeeId();
      if (!empId) {
        if (isMounted.current) setTasks([]);
        return;
      }
      const employeeRes = await fetch(`${BASE_URL}/employee/${empId}`);
      const employeeData = await employeeRes.json();
      const email = employeeData.employee?.email?.trim().toLowerCase() || "";
      setUserEmail(email);

      const [assignedData, createdData] = await Promise.all([
        fetch(`${BASE_URL}/task/employee/${empId}`).then((res) => res.json()),
        fetch(`${BASE_URL}/task/created/${empId}`).then((res) => res.json()),
      ]);
      setAssignedCount(assignedData.count || 0);

      const combinedTasks = [
        ...(assignedData.tasks || []).map((t) => ({ ...t, _type: "ASSIGNED" })),
        ...(createdData.tasks || []).map((t) => ({ ...t, _type: "CREATED" })),
      ];

      const taskMap = new Map();
      combinedTasks.forEach((t) => taskMap.set(t.id, t));

      const formattedTasks = Array.from(taskMap.values()).map((task) => {
        const assignees = (Array.isArray(task.assignto)
          ? task.assignto
          : task.assignto?.split(",") || []
        ).map((a) => a?.trim().toLowerCase());

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          assignto: assignees,
          due: `${new Date(task.due_date).toLocaleDateString()} ${task.due_time}`,
          priority: task.priority,
          status:
            task.status?.toLowerCase() === "completed" ? "Completed" :
            task.status?.toLowerCase() === "overdue" ? "Overdue" : "Pending",
          raw_due_date: task.due_date,
          raw_due_time: task.due_time,
          created_at: task.created_at,
          completed_time: task.completed_time,
          taskType: task._type,
        };
      });

      if (isMounted.current) {
        setTasks(formattedTasks);
        setNotificationCount(formattedTasks.filter((t) => t.status === "Pending").length);
      }
    } catch (err) {
      console.error(err);
      if (isMounted.current) setTasks([]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      fetchTasks();
      return () => { isMounted.current = false; };
    }, [fetchTasks])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, [fetchTasks]);

  const markTaskComplete = async (taskId) => {
    try {
      await fetch(`${BASE_URL}/task/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "completed" }),
      });
      if (isMounted.current) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "Completed" } : t)));
        showAlert("Success", "Task marked as completed ✅");
      }
    } catch (err) {
      showAlert("Error", "Failed to update task");
    }
  };

  const editTask = useCallback((task) => {
    setEditMode(true);
    setEditTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setAssignto(Array.isArray(task.assignto) ? task.assignto.join(", ") : task.assignto || "");
    setPriority(task.priority);
    setDueDate(new Date(task.raw_due_date));
    setDueTime(task.raw_due_time);
  }, []);

  const handleUpdateTask = async () => {
    if (!title || !description || !assignto) {
        showAlert("Validation Error", "All fields required!");
        return;
    }
    try {
      const response = await fetch(`${BASE_URL}/task/update/${editTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, assignto: assignto.split(",").map(e => e.trim()),
          priority, due_date: dueDate.toISOString().split("T")[0], due_time: dueTime
        }),
      });
      const data = await response.json();
      showAlert("Success", data.message || "Updated", [
        { text: "OK", onPress: () => { setEditMode(false); fetchTasks(); }}
      ]);
    } catch (err) { showAlert("Error", "Failed to update"); }
  };

  const deleteTask = (taskId) => {
    showAlert("Confirm Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await fetch(`${BASE_URL}/task/delete/${taskId}`, { method: "DELETE" });
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }}
    ]);
  };

  const onDateChange = (e, d) => { setShowDatePicker(false); if (d) setDueDate(d); };
  const onTimeChange = (e, s) => {
    setShowTimePicker(false);
    if (!s) return;
    setDueTime(`${s.getHours().toString().padStart(2, "0")}:${s.getMinutes().toString().padStart(2, "0")}:00`);
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskTypeFilter === "ASSIGNED" && !t.assignto.includes(userEmail.toLowerCase())) return false;
    if (taskTypeFilter === "CREATED" && t.taskType !== "CREATED") return false;
    if (filter === "Pending" && t.status !== "Pending") return false;
    if (filter === "Overdue" && t.status !== "Overdue") return false;
    return true;
  });

 // 1. Keep this helper function (add it if missing above renderTaskItem)
  const calculateTimeTaken = (start, end) => {
    if (!start || !end) return null;
    const diffMs = new Date(end) - new Date(start);
    const diffMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(diffMinutes / 1440);
    const hours = Math.floor((diffMinutes % 1440) / 60);
    const minutes = diffMinutes % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // 2. The Updated renderTaskItem
  const renderTaskItem = ({ item: task }) => (
    <View style={styles.taskCard}>
      <View style={[styles.priorityIndicator, 
        task.priority === "High" ? {backgroundColor: '#e74c3c'} : 
        task.priority === "Medium" ? {backgroundColor: '#f1c40f'} : {backgroundColor: '#2f80ed'}]} 
      />
      <View style={styles.taskContent}>
        <View style={styles.taskTopRow}>
          <Text style={[styles.taskTitle, task.status === "Completed" && {textDecorationLine: "line-through", color: "#888"}]}>
            {task.title}
          </Text>
          <View style={styles.editDeleteIcons}>
            <TouchableOpacity onPress={() => editTask(task)}><Feather name="edit-3" size={18} color="#2f80ed" /></TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(task.id)} style={{ marginLeft: 15 }}><Feather name="trash-2" size={18} color="#e74c3c" /></TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
        
        <View style={styles.taskMeta}>
           <View style={styles.metaItem}>
              <Feather name="calendar" size={12} color="#888" />
              <Text style={styles.metaText}>{task.due}</Text>
           </View>
           <View style={styles.metaItem}>
              <Feather name="user" size={12} color="#888" />
              <Text style={styles.metaText} numberOfLines={1}>
                {Array.isArray(task.assignto) ? task.assignto[0] : task.assignto}
              </Text>
           </View>
        </View>

        <View style={styles.taskBottomRow}>
          <View style={[styles.statusBadge, task.status === "Completed" ? styles.statusSuccess : task.status === "Overdue" ? styles.statusDanger : styles.statusInfo]}>
            <Text style={task.status === "Completed" ? styles.statusTextSuccess : task.status === "Overdue" ? styles.statusTextDanger : styles.statusTextInfo}>
              {task.status === "Completed" ? "✔ Done" : task.status}
            </Text>
          </View>

          {task.status !== "Completed" ? (
            <TouchableOpacity style={styles.completeButton} onPress={() => markTaskComplete(task.id)}>
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: 'flex-end' }}>
              {task.created_at && task.completed_time && (
                <Text style={{ color: "#717679", fontSize: 10 }}>
                  Time: {calculateTimeTaken(task.created_at, task.completed_time)}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.containerCenter}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color="#333" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate("tasknotification")} style={styles.iconBtn}>
              <Feather name="bell" size={22} color="#333" />
              {notificationCount > 0 && <View style={styles.notificationDot} />}
            </TouchableOpacity>
            <View style={styles.profileCircle}><Text style={styles.profileLetter}>{userEmail ? userEmail[0].toUpperCase() : 'U'}</Text></View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, taskTypeFilter === "ASSIGNED" && styles.statCardActive]} onPress={() => setTaskTypeFilter("ASSIGNED")}>
            <View style={[styles.iconCircle, {backgroundColor: '#e8f0ff'}]}><Feather name="user-check" size={20} color="#2f80ed" /></View>
<Text style={styles.statNumber}>
  {userEmail ? assignedCount : "..."}
</Text>          
   <Text style={styles.statLabel}>Assigned</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, taskTypeFilter === "CREATED" && styles.statCardActive]} onPress={() => setTaskTypeFilter("CREATED")}>
            <View style={[styles.iconCircle, {backgroundColor: '#ecfdf5'}]}><Feather name="edit" size={20} color="#27ae60" /></View>
            <Text style={[styles.statNumber, {color: '#27ae60'}]}>{tasks.filter(t => t.taskType === "CREATED").length}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterBar}>
          {["All", "Pending", "Overdue"].map((f) => (
            <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.fabAdd} onPress={() => navigation.navigate("CreateTaskScreen")}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCenter}><ActivityIndicator size="large" color="#2f80ed" /><Text style={styles.loadingProgress}>{loadingCount}%</Text></View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(i) => (i.id ? i.id.toString() : Math.random().toString())}
            renderItem={renderTaskItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}

       {Platform.OS === "web" && (
  <Modal
    visible={editMode}
    transparent
    animationType="fade"
    onRequestClose={() => setEditMode(false)}
  >
    <View style={styles.webModalOverlay}>
      <View style={styles.webModalContainer}>

        {/* Header */}
        <View style={styles.webModalHeader}>
          <Text style={styles.webModalTitle}>Edit Task</Text>
          <TouchableOpacity onPress={() => setEditMode(false)}>
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.webLabel}>Title</Text>
          <TextInput
            style={styles.webInput}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.webLabel}>Description</Text>
          <TextInput
            style={[styles.webInput, { height: 90 }]}
            value={description}
            multiline
            onChangeText={setDescription}
          />

          <Text style={styles.webLabel}>Assign To</Text>
          <TextInput
            style={styles.webInput}
            value={assignto}
            onChangeText={setAssignto}
          />

          <Text style={styles.webLabel}>Priority</Text>
          <View style={styles.webPicker}>
            <Picker selectedValue={priority} onValueChange={setPriority}>
              <Picker.Item label="High" value="High" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Low" value="Low" />
            </Picker>
          </View>

          <Text style={styles.webLabel}>Due Date</Text>
          <TextInput
            style={styles.webInput}
            value={dueDate.toISOString().split("T")[0]}
            editable={false}
          />

          <Text style={styles.webLabel}>Due Time</Text>
          <TextInput
            style={styles.webInput}
            value={dueTime}
            editable={false}
          />
        </ScrollView>

        {/* Footer */}
        <View style={styles.webFooter}>
          <TouchableOpacity
            style={styles.webCancel}
            onPress={() => setEditMode(false)}
          >
            <Text>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.webUpdate}
            onPress={handleUpdateTask}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Update Task
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  </Modal>
)}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD", paddingTop: Platform.OS === "android" ? 40 : 10 },
  containerCenter: { flex: 1, alignSelf: "center", width: SCREEN_WIDTH > 900 ? 900 : SCREEN_WIDTH, paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1A1C1E" },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notificationDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, backgroundColor: "#e74c3c", borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  profileCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2f80ed', justifyContent: 'center', alignItems: 'center' },
  profileLetter: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  statCard: { flex: 0.48, backgroundColor: "#fff", padding: 16, borderRadius: 20, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  statCardActive: { borderWidth: 1, borderColor: '#2f80ed' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNumber: { fontSize: 24, fontWeight: "800", color: "#2f80ed" },
  statLabel: { fontSize: 14, color: "#717679", marginTop: 2 },
  filterBar: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, backgroundColor: "#E9ECEF", marginRight: 10 },
  filterPillActive: { backgroundColor: "#2f80ed" },
  filterPillText: { color: "#717679", fontWeight: "600" },
  filterPillTextActive: { color: "#fff" },
  fabAdd: { marginLeft: 'auto', backgroundColor: '#2f80ed', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  taskCard: { flexDirection: 'row', backgroundColor: "#fff", borderRadius: 20, marginBottom: 15, overflow: 'hidden', elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12 },
  priorityIndicator: { width: 6 },
  taskContent: { flex: 1, padding: 16 },
  taskTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  taskTitle: { fontSize: 16, fontWeight: "700", color: "#1A1C1E", flex: 1 },
  taskDesc: { fontSize: 13, color: "#717679", marginVertical: 8, lineHeight: 18 },
  taskMeta: { flexDirection: 'row', marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  metaText: { fontSize: 11, color: '#888', marginLeft: 4, maxWidth: 80 },
  taskBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusInfo: { backgroundColor: '#e8f0ff' },
  statusSuccess: { backgroundColor: '#ecfdf5' },
  statusDanger: { backgroundColor: '#fff1f0' },
  statusTextInfo: { color: '#2f80ed', fontSize: 12, fontWeight: '700' },
  statusTextSuccess: { color: '#27ae60', fontSize: 12, fontWeight: '700' },
  statusTextDanger: { color: '#e74c3c', fontSize: 12, fontWeight: '700' },
  completeButton: { backgroundColor: "#2f80ed", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  completeButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 },
  modalCardWeb: { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: '90%', maxWidth: 500, alignSelf: 'center', marginVertical: 40 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20, color: '#1A1C1E', textAlign: 'center' },
  input: { backgroundColor: '#F1F3F5', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 14, borderWidth: 0 },
  pickerBox: { backgroundColor: '#F1F3F5', borderRadius: 12, marginBottom: 15, overflow: 'hidden' },
  datePickerBtn: { backgroundColor: '#F1F3F5', padding: 15, borderRadius: 12, marginBottom: 15 },
  datePickerText: { color: '#1A1C1E', fontSize: 14 },
  dateInputWeb: { backgroundColor: '#F1F3F5', borderRadius: 12, padding: 15, marginBottom: 15 },
  modalActions: { flexDirection: 'row', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  cancelBtnText: { color: '#717679', fontWeight: '600' },
  saveBtn: { flex: 2, backgroundColor: '#2f80ed', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingProgress: { fontSize: 20, fontWeight: "800", color: "#2f80ed", marginTop: 10 },
  webModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  alignItems: "center",
},

webModalContainer: {
  width: 520,
  maxHeight: "85%",
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0px 20px 60px rgba(0,0,0,0.25)", // web only
},

webModalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

webModalTitle: {
  fontSize: 22,
  fontWeight: "800",
},

webLabel: {
  fontSize: 12,
  fontWeight: "600",
  color: "#6b7280",
  marginTop: 14,
  marginBottom: 6,
},

webInput: {
  backgroundColor: "#f3f4f6",
  padding: 14,
  borderRadius: 12,
  fontSize: 14,
},

webPicker: {
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  overflow: "hidden",
},

webFooter: {
  flexDirection: "row",
  gap: 12,
  marginTop: 20,
},

webCancel: {
  flex: 1,
  padding: 14,
  borderRadius: 14,
  backgroundColor: "#e5e7eb",
  alignItems: "center",
},

webUpdate: {
  flex: 2,
  padding: 14,
  borderRadius: 14,
  backgroundColor: "#2563eb",
  alignItems: "center",
},

});

export default TaskScreen;