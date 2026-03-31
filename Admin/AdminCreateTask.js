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
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const AdminAddTaskScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState([]);
  const [collaborators, setCollaborators] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Not Started");
  const [recurringType, setRecurringType] = useState("Daily");

  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

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
      Alert.alert("Error", "Failed to fetch employees.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeSelection = (email) => {
    if (assignedTo.includes(email)) {
      setAssignedTo(assignedTo.filter((e) => e !== email));
    } else {
      setAssignedTo([...assignedTo, email]);
    }
  };

  const handleCreateTask = async () => {
    if (!title || assignedTo.length === 0 || !description) {
      Alert.alert("Validation Error", "Please fill all required fields.");
      return;
    }

    const payload = {
      title,
      description,
      assignedTo: assignedTo,
      collaborators: collaborators ? collaborators.split(",") : [],
      priority,
      status,
      recurringType,
      start_date: startDate.toISOString().split("T")[0],
      start_time: startTime.toTimeString().split(" ")[0],
      end_date: endDate.toISOString().split("T")[0],
      end_time: endTime.toTimeString().split(" ")[0],
    };

    try {
      setLoading(true);
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/Admintask/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert("Success", data.message || "Task created successfully");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.message || "Failed to create task");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong while creating the task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate, setter, hidePicker) => {
    hidePicker(false);
    if (event.type === "set" && selectedDate) setter(selectedDate);
  };

  const handleTimeChange = (event, selectedTime, setter, hidePicker) => {
    hidePicker(false);
    if (event.type === "set" && selectedTime) setter(selectedTime);
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading task...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 20 }}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.header}>Add New Recurring Task</Text>
        </View>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter task title"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
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
            const isSelected = assignedTo.includes(emp.email);
            return (
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.multiSelectItem,
                  isSelected && styles.multiSelectSelected,
                ]}
                onPress={() => toggleEmployeeSelection(emp.email)}
              >
                <Text style={{ color: isSelected ? "white" : "black" }}>
                  {emp.full_name} ({emp.email})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Collaborators */}
        <Text style={styles.label}>Collaborators (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="Team A, Team B"
          value={collaborators}
          onChangeText={setCollaborators}
        />

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

        {/* Status */}
        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={status}
            onValueChange={(itemValue) => setStatus(itemValue)}
          >
            <Picker.Item label="Not Started" value="Not Started" />
            <Picker.Item label="In Progress" value="In Progress" />
            <Picker.Item label="Completed" value="Completed" />
          </Picker>
        </View>

        {/* Recurring Type */}
        <Text style={styles.label}>Recurring Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={recurringType}
            onValueChange={(itemValue) => setRecurringType(itemValue)}
          >
            <Picker.Item label="Daily" value="Daily" />
            <Picker.Item label="Weekly" value="Weekly" />
            <Picker.Item label="Monthly" value="Monthly" />
          </Picker>
        </View>

        {/* Start Date & Time Row */}
        <Text style={styles.label}>Start *</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimePicker}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="black" />
            <Text style={{ marginLeft: 8 }}>{startDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimePicker}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="black" />
            <Text style={{ marginLeft: 8 }}>
              {startTime.toLocaleTimeString([], { hour12: false })}
            </Text>
          </TouchableOpacity>
        </View>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(event, selectedDate) =>
              handleDateChange(event, selectedDate, setStartDate, setShowStartDatePicker)
            }
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            is24Hour={true}
            onChange={(event, selectedTime) =>
              handleTimeChange(event, selectedTime, setStartTime, setShowStartTimePicker)
            }
          />
        )}

        {/* End Date & Time Row */}
        <Text style={styles.label}>End *</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimePicker}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="black" />
            <Text style={{ marginLeft: 8 }}>{endDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimePicker}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="black" />
            <Text style={{ marginLeft: 8 }}>
              {endTime.toLocaleTimeString([], { hour12: false })}
            </Text>
          </TouchableOpacity>
        </View>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={startDate}
            onChange={(event, selectedDate) =>
              handleDateChange(event, selectedDate, setEndDate, setShowEndDatePicker)
            }
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            is24Hour={true}
            onChange={(event, selectedTime) =>
              handleTimeChange(event, selectedTime, setEndTime, setShowEndTimePicker)
            }
          />
        )}
      </ScrollView>

      {/* Footer Buttons */}
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

export default AdminAddTaskScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffff",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
  },

  // Top Bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 25,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  header: { fontSize: 18, fontWeight: "bold", color: "white", marginLeft: 12 },

  // Labels and inputs
  label: { fontSize: 15, fontWeight: "600", marginTop: 18, marginBottom: 6, color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "white",
    fontSize: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "white",
    overflow: "hidden",
  },

  // Multi-select for assigned employees
  multiSelectContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "white",
  },
  multiSelectItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  multiSelectSelected: {
    backgroundColor: "#2563eb",
  },

  // Date & Time pickers
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dateTimePicker: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "white",
    justifyContent: "flex-start",
  },

  // Footer buttons
  footer: {
    padding: 15,
    backgroundColor: "#f4f6fb",
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "#f3f4f6" },
  createButton: { backgroundColor: "#2563eb" },
  cancelText: { color: "#111827", fontWeight: "600", fontSize: 15 },
  createText: { color: "white", fontWeight: "600", fontSize: 15 },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6fb",
  },
});

