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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";
import * as Notifications from "expo-notifications";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CreateTaskScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/employee/all`);
        const data = await response.json();
        if (response.ok && data?.success && data?.employees) {
          const employeesOnDuty = data.employees.map((emp) => ({
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            status: "On Duty",
          }));
          setAllEmployees(employeesOnDuty);
          setFilteredEmployees(employeesOnDuty);
        } else {
          Alert.alert("Error", "Failed to fetch employee data.");
        }
      } catch (error) {
        Alert.alert("Network Error", "Unable to fetch employee data.");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(allEmployees);
    } else {
      const filtered = allEmployees.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, allEmployees]);

  const toggleAssignee = (emp) => {
    setAssignees((prev) => {
      const exists = prev.some((a) => a.email === emp.email);
      return exists ? prev.filter((a) => a.email !== emp.email) : [...prev, emp];
    });
  };

  const showLocalNotification = async (taskTitle) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Created ✅",
        body: `Task "${taskTitle}" has been assigned.`,
        sound: true,
      },
      trigger: null,
    });
  };

  const handleCreateTask = async () => {
    if (!title.trim() || !description.trim() || assignees.length === 0) {
      Alert.alert("Validation Error", "Please fill all required fields.");
      return;
    }

    const formattedDate = dueDate.toISOString().split("T")[0];
    const formattedTime = dueTime.toTimeString().split(" ")[0];

    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignto: assignees.map((a) => a.email),
      priority,
      due_date: formattedDate,
      due_time: formattedTime,
    };

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/task/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data?.task) {
        await showLocalNotification(title);
        Alert.alert("Success", data.message || "Task created successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        throw new Error(data.message || "Task creation failed");
      }
    } catch (error) {
      Alert.alert("Error", "Could not create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };
if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.header}>Create New Task</Text>
          </View>

          {/* Title */}
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, { height: 90 }]}
            placeholder="Enter task description"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Employee Selector */}
          <Text style={styles.label}>Assign To *</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setDropdownVisible(!dropdownVisible)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownButtonText}>
                {assignees.length > 0
                  ? `${assignees.length} Selected`
                  : "Select Employees"}
              </Text>
              <Ionicons
                name={dropdownVisible ? "chevron-up" : "chevron-down"}
                size={18}
                color="#2563eb"
              />
            </TouchableOpacity>

            {dropdownVisible && (
              <View style={styles.checkboxContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search employee..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={{ maxHeight: 250 }}>
                  {filteredEmployees.map((emp, idx) => {
                    const isSelected = assignees.some(
                      (a) => a.email === emp.email
                    );
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => toggleAssignee(emp)}
                        activeOpacity={0.7}
                        style={styles.checkboxItem}
                      >
                        <Checkbox
                          value={isSelected}
                          onValueChange={() => toggleAssignee(emp)}
                          color={isSelected ? "#2563eb" : undefined}
                        />
                        <Text style={styles.checkboxLabel}>
                          {emp.full_name} ({emp.email})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Priority */}
          <Text style={styles.label}>Priority *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={priority}
              onValueChange={(itemValue) => setPriority(itemValue)}
            >
              <Picker.Item label="High" value="High" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="Low" value="Low" />
            </Picker>
          </View>

          {/* Due Date */}
          <Text style={styles.label}>Due Date *</Text>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#2563eb" />
            <Text style={styles.dateText}>
              {dueDate.toLocaleDateString()}
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
            <Ionicons name="time-outline" size={20} color="#2563eb" />
            <Text style={styles.dateText}>
              {dueTime.toLocaleTimeString([], { hour12: false })}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={dueTime}
              mode="time"
              display="default"
              is24Hour
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setDueTime(selectedTime);
              }}
            />
          )}

          {/* Buttons */}
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateTask}
                activeOpacity={0.8}
              >
                <Text style={styles.createText}>+ Create Task</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTaskScreen;

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 40 },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8faff",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 25,
    elevation: 3,
  },
  backButton: { paddingHorizontal: 10 },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "white",
    elevation: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  dropdownContainer: { marginBottom: 20 },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "white",
    elevation: 1,
  },
  dropdownButtonText: { fontSize: 14, color: "#333" },
  checkboxContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d0d7e2",
    marginTop: 5,
    elevation: 2,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  checkboxLabel: { marginLeft: 10, fontSize: 14, color: "#333" },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "white",
    elevation: 1,
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "white",
    elevation: 1,
  },
  dateText: { marginLeft: 10, fontSize: 14, color: "#333" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
  },
  cancelButton: { backgroundColor: "#f3f4f6" },
  createButton: { backgroundColor: "#2563eb" },
  cancelText: { color: "#333", fontWeight: "600" },
  createText: { color: "white", fontWeight: "600" },
});
