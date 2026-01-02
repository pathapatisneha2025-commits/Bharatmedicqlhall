import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const AdminRecurringAddTaskScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const [recurringType, setRecurringType] = useState("Daily");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showEmployeeList, setShowEmployeeList] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/employee/all"
      );
      const data = await response.json();
      if (data.success) {
        const emails = data.employees.map((emp) => emp.email);
        setEmployees(emails);
      } else {
        Alert.alert("Error", "Failed to fetch employees");
      }
    } catch (error) {
      console.log("❌ Fetch employees error:", error);
      Alert.alert("Error", "Unable to fetch employees");
    }
  };

  const toggleEmployee = (email) => {
    if (assignedTo.includes(email)) {
      setAssignedTo(assignedTo.filter((e) => e !== email));
    } else {
      setAssignedTo([...assignedTo, email]);
    }
  };

  const handleSubmit = async () => {
    if (!title || assignedTo.length === 0 || !description) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const payload = {
      title,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      assignedTo: assignedTo,
      priority,
      collaborators: [],
      attachment: null,
      description,
      status: "Not Started",
      recurringType,
    };

    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/Admintask/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "Task created successfully");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      console.log("❌ Error:", error);
      Alert.alert("Error", "Unable to create task. Try again later.");
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Task</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {/* Title */}
        <Text style={styles.label}>Title*</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="create-outline" size={20} color="#007bff" />
          <TextInput
            style={styles.input}
            placeholder="Enter task title"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description*</Text>
        <View style={[styles.inputWrapper, { height: 100 }]}>
          <Ionicons name="document-text-outline" size={20} color="#007bff" />
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Enter task description"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Assigned To */}
        <Text style={styles.label}>Assigned To*</Text>
        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => setShowEmployeeList(!showEmployeeList)}
        >
          <Ionicons name="people-outline" size={20} color="#007bff" />
          <Text style={{ marginLeft: 8 }}>
            {assignedTo.length > 0 ? assignedTo.join(", ") : "Select Employees"}
          </Text>
        </TouchableOpacity>

        {showEmployeeList && (
          <FlatList
            data={employees}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.employeeItem}
                onPress={() => toggleEmployee(item)}
              >
                <Text>{item}</Text>
                {assignedTo.includes(item) && <Text style={styles.checkMark}>✔</Text>}
              </TouchableOpacity>
            )}
          />
        )}

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="flag-outline" size={20} color="#007bff" />
          <TextInput
            style={styles.input}
            value={priority}
            onChangeText={setPriority}
          />
        </View>

    {/* Recurring Type Dropdown */}
<Text style={{ marginTop: 10, fontWeight: "bold" }}>Recurring Type</Text>
<View
  style={{
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "#fff",
  }}
>
  <Picker
    selectedValue={recurringType}
    onValueChange={(value) => setRecurringType(value)}
    style={{ height: 45 }}
  >
    <Picker.Item label="Daily" value="Daily" />
    <Picker.Item label="Weekly" value="Weekly" />
    <Picker.Item label="Monthly" value="Monthly" />
    <Picker.Item label="Yearly" value="Yearly" />
  </Picker>
</View>


        {/* Dates and Times */}
        <Text style={styles.label}>Start Date & Time</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={20} color="#007bff" />
            <Text style={styles.dateText}>{startDate.toDateString()}</Text>
          </View>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, date) => {
              if (Platform.OS === "android") setShowStartDatePicker(false);
              if (date) {
                setStartDate((prev) => new Date(prev.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())));
              }
            }}
          />
        )}
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartTimePicker(true)}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={20} color="#007bff" />
            <Text style={styles.dateText}>
              {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </TouchableOpacity>
        {showStartTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, time) => {
              if (Platform.OS === "android") setShowStartTimePicker(false);
              if (time) {
                setStartDate((prev) => new Date(prev.setHours(time.getHours(), time.getMinutes())));
              }
            }}
          />
        )}

        <Text style={styles.label}>End Date & Time</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={20} color="#007bff" />
            <Text style={styles.dateText}>{endDate.toDateString()}</Text>
          </View>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, date) => {
              if (Platform.OS === "android") setShowEndDatePicker(false);
              if (date) {
                setEndDate((prev) => new Date(prev.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())));
              }
            }}
          />
        )}
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndTimePicker(true)}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={20} color="#007bff" />
            <Text style={styles.dateText}>
              {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </TouchableOpacity>
        {showEndTimePicker && (
          <DateTimePicker
            value={endDate}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, time) => {
              if (Platform.OS === "android") setShowEndTimePicker(false);
              if (time) {
                setEndDate((prev) => new Date(prev.setHours(time.getHours(), time.getMinutes())));
              }
            }}
          />
        )}

        {/* Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Add Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AdminRecurringAddTaskScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f4f7", marginTop: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  formContainer: { padding: 15, paddingBottom: 50 },
  label: { fontSize: 16, fontWeight: "600", marginTop: 15, marginBottom: 5, color: "#333" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    height: 45,
    elevation: 1,
  },
  input: { flex: 1, fontSize: 15, marginLeft: 8 },
  dateButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
    elevation: 1,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateText: { fontSize: 15, color: "#333" },
  employeeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  checkMark: { color: "#007bff", fontWeight: "bold" },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: "center",
    elevation: 2,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
