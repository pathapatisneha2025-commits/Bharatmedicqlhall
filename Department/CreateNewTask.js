// screens/CreateTaskScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const CreateTaskScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignto, setAssignto] = useState([]); // multiple emails
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch employees
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/employee/all"
      );
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      } else {
        Alert.alert("Error", "Failed to load employees.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      Alert.alert("Error", "Something went wrong while fetching employees.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSelection = (email) => {
    if (assignto.includes(email)) {
      setAssignto(assignto.filter((e) => e !== email));
    } else {
      setAssignto([...assignto, email]);
    }
  };

  const handleCreateTask = async () => {
    if (!title || assignto.length === 0 || !dueDate || !dueTime) {
      Alert.alert("Validation Error", "Please fill all required fields.");
      return;
    }

    const formattedDate = dueDate.toISOString().split("T")[0];
    const formattedTime = dueTime.toTimeString().split(" ")[0];

    const payload = {
      title,
      description,
      assignto,
      priority,
      due_date: formattedDate,
      due_time: formattedTime,
    };

    try {
      setLoading(true);
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/task/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message || "Task created successfully");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Error", "Something went wrong while creating the task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.header}>Create New Task</Text>
        </View>

        {/* Task Title */}
        <TextInput
          style={styles.input}
          placeholder="Enter task title"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Enter task description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Assign To */}
        <Text style={styles.label}>Assign to *</Text>
        <View style={styles.multiSelectContainer}>
          {employees.map((emp) => {
            const isSelected = assignto.includes(emp.email);
            return (
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.multiSelectItem,
                  isSelected && styles.multiSelectSelected,
                ]}
                onPress={() => toggleEmailSelection(emp.email)}
              >
                <Text style={{ color: isSelected ? "white" : "black" }}>
                  {emp.full_name} ({emp.email})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={priority}
            onValueChange={(itemValue) => setPriority(itemValue)}
          >
            <Picker.Item label="Low" value="Low" />
            <Picker.Item label="Medium" value="Medium" />
            <Picker.Item label="High" value="High" />
          </Picker>
        </View>

        {/* Due Date */}
        <Text style={styles.label}>Due Date *</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="black" />
          <Text style={{ marginLeft: 10 }}>
            {dueDate ? dueDate.toLocaleDateString() : "Select Date"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}

        {/* Due Time */}
        <Text style={styles.label}>Due Time *</Text>
        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={20} color="black" />
          <Text style={{ marginLeft: 10 }}>
            {dueTime
              ? dueTime.toLocaleTimeString([], { hour12: false })
              : "Select Time"}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={dueTime}
            mode="time"
            display="default"
            is24Hour={true}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setDueTime(selectedTime);
            }}
          />
        )}
      </ScrollView>

      {/* Bottom Buttons (always visible) */}
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateTask}
            >
              <Text style={styles.createText}>+ Create Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default CreateTaskScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6f0ff", marginTop: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
  },
  header: { fontSize: 18, fontWeight: "bold", color: "white", marginLeft: 10 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 15, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "white",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "white",
  },
  multiSelectContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "white",
  },
  multiSelectItem: {
    padding: 8,
    marginVertical: 3,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
  },
  multiSelectSelected: {
    backgroundColor: "#2563eb",
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "white",
  },
  footer: {
    padding: 15,
    backgroundColor: "#e6f0ff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "#f0f0f0" },
  createButton: { backgroundColor: "#2563eb" },
  cancelText: { color: "black", fontWeight: "bold" },
  createText: { color: "white", fontWeight: "bold" },
});
