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
  Dimensions,
  
} from "react-native";
import { Ionicons, Feather, Entypo, MaterialIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  const [taskTypeFilter, setTaskTypeFilter] = useState("All");
const isLargeScreen = SCREEN_WIDTH > 900;
const isTablet = SCREEN_WIDTH > 600 && SCREEN_WIDTH <= 900;
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const empId = await getEmployeeId();
      if (!empId) { setTasks([]); setLoading(false); return; }

      const [assignedData, createdData] = await Promise.all([
        fetch(`${BASE_URL}/task/employee/${empId}`).then(res => res.json()),
        fetch(`${BASE_URL}/task/created/${empId}`).then(res => res.json())
      ]);

      const combinedTasks = [
        ...(assignedData.tasks || []).map(t => ({ ...t, _type: "ASSIGNED" })),
        ...(createdData.tasks || []).map(t => ({ ...t, _type: "CREATED" }))
      ];

      const taskMap = new Map();
      combinedTasks.forEach(t => taskMap.set(t.id, t));

      const formattedTasks = Array.from(taskMap.values()).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        assignto: Array.isArray(task.assignto) ? task.assignto.join(", ") : task.assignto,
        due: `${new Date(task.due_date).toLocaleDateString()} ${task.due_time}`,
        priority: task.priority,
        status:
          task.status?.toLowerCase() === "completed" ? "Completed" :
          task.status?.toLowerCase() === "overdue" ? "Overdue" :
          "Pending",
        raw_due_date: task.due_date,
        raw_due_time: task.due_time,
        created_at: task.created_at,
        completed_time: task.completed_time,
        taskType: task._type,
      }));

      setTasks(formattedTasks);
      setNotificationCount(formattedTasks.filter(t => t.status === "Pending").length);

    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchTasks(); }, [fetchTasks]));

  const sendLocalNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  };

  const markTaskComplete = async (taskId) => {
    try {
      const response = await fetch(`${BASE_URL}/task/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "completed" }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "Completed" } : t));
      Alert.alert("Success", data.message || "Task marked as completed ✅");
      sendLocalNotification("Task Completed 🎉", "You have completed a task!");
    } catch (err) { console.error(err); Alert.alert("Error", "Failed to update task"); }
  };

  const editTask = useCallback((task) => {
    setEditMode(true); setEditTaskId(task.id);
    setTitle(task.title); setDescription(task.description);
    setAssignto(task.assignto); setPriority(task.priority);
    setDueDate(new Date(task.raw_due_date)); setDueTime(task.raw_due_time);
  }, []);

  const handleUpdateTask = async () => {
    if (!title || !description || !assignto) { Alert.alert("Validation Error", "All fields required!"); return; }
    try {
      const response = await fetch(`${BASE_URL}/task/update/${editTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, assignto, priority, due_date: dueDate.toISOString().split("T")[0], due_time: dueTime }),
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      Alert.alert("Success", data.message);
      setEditMode(false); setEditTaskId(null); fetchTasks();
    } catch (err) { console.error(err); Alert.alert("Error", "Failed to update task"); }
  };

  const deleteTask = useCallback((taskId) => {
    Alert.alert("Confirm Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const response = await fetch(`${BASE_URL}/task/delete/${taskId}`, { method: "DELETE" });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          await response.json();
          setTasks(prev => prev.filter(t => t.id !== taskId));
          sendLocalNotification("Task Deleted ❌", "A task was removed.");
        } catch (err) { console.error(err); Alert.alert("Error", "Failed to delete task"); }
      }}
    ]);
  }, []);

  const onDateChange = (e, d) => { setShowDatePicker(false); if(d) setDueDate(d); };
  const onTimeChange = (e, t) => { setShowTimePicker(false); if(t) { const h=t.getHours().toString().padStart(2,"0"); const m=t.getMinutes().toString().padStart(2,"0"); setDueTime(`${h}:${m}:00`); } };

  const filteredTasks = tasks.filter(t => {
    if(taskTypeFilter==="ASSIGNED" && t.taskType!=="ASSIGNED") return false;
    if(taskTypeFilter==="CREATED" && t.taskType!=="CREATED") return false;
    if(filter==="Pending") return t.status==="Pending";
    if(filter==="Overdue") return t.status==="Overdue";
    return true;
  });

  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchTasks(); setRefreshing(false); }, [fetchTasks]);

  const calculateTimeTaken = (start,end) => {
    if(!start||!end) return null;
    const diffMs = new Date(end)-new Date(start);
    const diffMinutes = Math.floor(diffMs/60000);
    const days=Math.floor(diffMinutes/1440); const hours=Math.floor((diffMinutes%1440)/60); const minutes=diffMinutes%60;
    if(days>0) return `${days}d ${hours}h ${minutes}m`; if(hours>0) return `${hours}h ${minutes}m`; return `${minutes}m`;
  };

  const renderTaskItem = ({item: task})=>(
    <View style={[styles.taskCard,
      task.priority==="High"?styles.high:task.priority==="Medium"?styles.medium:styles.low,
      task.status==="Completed"?styles.completed:task.status==="Overdue"?styles.overdue:null
    ]}>
      <View style={styles.taskTopRow}>
        <View style={styles.taskLabel}>
          {task.priority==="High" && <><Entypo name="warning" size={16} color="#e74c3c" /><Text style={[styles.priorityText,{color:"#e74c3c"}]}> HIGH PRIORITY</Text></>}
          {task.priority==="Medium" && <><Entypo name="dot-single" size={16} color="#f1c40f" /><Text style={[styles.priorityText,{color:"#f1c40f"}]}> MEDIUM</Text></>}
          {task.priority==="Low" && <><Entypo name="dot-single" size={16} color="#7f8c8d" /><Text style={[styles.priorityText,{color:"#7f8c8d"}]}> LOW</Text></>}
          {task.status==="Completed" && <><Ionicons name="checkmark-circle" size={16} color="#27ae60" /><Text style={[styles.priorityText,{color:"#27ae60"}]}> COMPLETED</Text></>}
          {task.status==="Overdue" && <><Ionicons name="alert-circle" size={16} color="#e74c3c" /><Text style={[styles.priorityText,{color:"#e74c3c"}]}> OVERDUE</Text></>}
        </View>
        <View style={styles.editDeleteIcons}>
          <TouchableOpacity onPress={()=>editTask(task)}><Feather name="edit" size={18} color="#2f80ed"/></TouchableOpacity>
          <TouchableOpacity onPress={()=>deleteTask(task.id)} style={{marginLeft:10}}><MaterialIcons name="delete" size={20} color="#e74c3c"/></TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.taskTitle, task.status==="Completed" && {textDecorationLine:"line-through", color:"#555"}]}>{task.title}</Text>
      <Text style={styles.taskDesc}>{task.description}</Text>
      <Text style={styles.assigntoText}>Assigned to: {task.assignto}</Text>
      <View style={styles.taskBottomRow}>
        <Text style={styles.dueText}>Due: {task.due}</Text>
        {task.status!=="Completed"?(
          <TouchableOpacity style={styles.completeButton} onPress={()=>markTaskComplete(task.id)}><Text style={styles.completeButtonText}>Mark Complete</Text></TouchableOpacity>
        ):(
          <View><Text style={{color:"#27ae60", fontWeight:"bold"}}>✔ Done</Text>
            {task.created_at && task.completed_time && <Text style={{color:"#2c3e50", fontSize:11, marginTop:2}}>Completed in: {calculateTimeTaken(task.created_at,task.completed_time)}</Text>}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.containerCenter}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#333"/></TouchableOpacity>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.addTaskButton} onPress={()=>navigation.navigate("CreateTaskScreen")}><Text style={styles.addTaskButtonText}>Add Task</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>navigation.navigate("tasknotification")}>
              <Feather name="bell" size={20} color="#333" style={{marginLeft:12}}/>
              {notificationCount>0 && <View style={styles.notificationDot}><Text style={styles.notifCount}>{notificationCount}</Text></View>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statBox, taskTypeFilter==="ASSIGNED"?styles.statActive:{}]} onPress={()=>setTaskTypeFilter(taskTypeFilter==="ASSIGNED"?"ALL":"ASSIGNED")}>
            <Text style={styles.statNumber}>{tasks.filter(t=>t.taskType==="ASSIGNED").length}</Text>
            <Text style={styles.statLabel}>Assigned To Me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statBox, taskTypeFilter==="CREATED"?styles.statActive:{}]} onPress={()=>setTaskTypeFilter(taskTypeFilter==="CREATED"?"ALL":"CREATED")}>
            <Text style={[styles.statNumber,{color:"#27ae60"}]}>{tasks.filter(t=>t.taskType==="CREATED").length}</Text>
            <Text style={styles.statLabel}>Created By Me</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {["All","Pending","Overdue"].map(f=>(
            <TouchableOpacity key={f} style={filter===f?styles.filterActive:null} onPress={()=>setFilter(f)}>
              <Text style={filter===f?styles.filterTextActive:styles.filterText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task List */}
        {editMode?null:loading?<ActivityIndicator size="large" color="#2f80ed" style={{marginTop:20}}/>:
          <FlatList data={filteredTasks} keyExtractor={i=>i.id.toString()} renderItem={renderTaskItem} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>} contentContainerStyle={{paddingBottom:20}}/>
        }
      </View>
    </View>
  );
};

export default TaskScreen;

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:"#fff"},
  containerCenter:{flex:1,alignSelf:"center",width:SCREEN_WIDTH>900?900:SCREEN_WIDTH-20,paddingHorizontal:10},
  header:{marginTop:30,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  headerTitle:{fontSize:18,fontWeight:"bold"},
  headerIcons:{flexDirection:"row",alignItems:"center"},
  addTaskButton:{backgroundColor:"#2f80ed",paddingHorizontal:12,paddingVertical:6,borderRadius:6,marginRight:10},
  addTaskButtonText:{color:"#fff",fontWeight:"bold",fontSize:12},
  notificationDot:{position:"absolute",top:-5,right:20,backgroundColor:"#e74c3c",borderRadius:10,paddingHorizontal:5},
  notifCount:{color:"#fff",fontSize:10,fontWeight:"bold"},
  statsRow:{flexDirection:"row",justifyContent:"space-between",flexWrap:"wrap",marginBottom:12},
  statBox:{flex:1,minWidth:140,margin:4,padding:10,borderRadius:10,alignItems:"center",backgroundColor:"#e8f0ff"},
  statActive:{backgroundColor:"#cce0ff"},
  statNumber:{fontSize:20,fontWeight:"bold",color:"#2f80ed"},
  statLabel:{fontSize:12,color:"#555"},
  filters:{flexDirection:"row",justifyContent:"space-around",marginVertical:12,flexWrap:"wrap"},
  filterActive:{borderBottomWidth:2,borderColor:"#2f80ed",paddingBottom:4},
  filterTextActive:{color:"#2f80ed",fontWeight:"bold"},
  filterText:{color:"#888"},
  taskCard:{padding:14,borderRadius:12,marginBottom:12,backgroundColor:"#f9f9f9",elevation:1,width:"100%"},
  taskTopRow:{flexDirection:"row",alignItems:"center",marginBottom:4,justifyContent:"space-between"},
  taskLabel:{flexDirection:"row",alignItems:"center",flex:1},
  editDeleteIcons:{flexDirection:"row"},
  priorityText:{fontSize:12,fontWeight:"bold"},
  taskTitle:{fontSize:14,fontWeight:"bold",marginVertical:4},
  taskDesc:{fontSize:12,color:"#555",marginBottom:4},
  assigntoText:{fontSize:12,color:"#555",marginBottom:8},
  taskBottomRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  dueText:{fontSize:12,color:"#888"},
  completeButton:{backgroundColor:"#2f80ed",paddingHorizontal:12,paddingVertical:6,borderRadius:8},
  completeButtonText:{color:"#fff",fontSize:12,fontWeight:"bold"},
  high:{borderColor:"#e74c3c",borderWidth:1,backgroundColor:"#fff6f6"},
  medium:{borderColor:"#f1c40f",borderWidth:1,backgroundColor:"#fffce8"},
  low:{borderColor:"#7f8c8d",borderWidth:1},
  completed:{borderColor:"#27ae60",borderWidth:1,backgroundColor:"#ecfdf5"},
  overdue:{borderColor:"#e74c3c",borderWidth:1,backgroundColor:"#fff1f0"},
});
