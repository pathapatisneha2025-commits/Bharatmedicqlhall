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
  ActivityIndicator,
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
  const [loading, setLoading] = useState(false);
  
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
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("https://hospitaldatabasemanagement.onrender.com/employee/all");
      const data = await response.json();
      if (data.success) {
        const emails = data.employees.map((emp) => emp.email);
        setEmployees(emails);
      } else {
        showAlert("Error", "Failed to fetch employees");
      }
    } catch (error) {
     showAlert("Error", "Unable to fetch employees");
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
      showAlert("Error", "Please fill all required fields");
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
      setLoading(true);
      const response = await fetch("https://hospitaldatabasemanagement.onrender.com/Admintask/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        showAlert("Success", "Task created successfully");
        navigation.goBack();
      } else {
        showAlert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      showAlert("Error", "Unable to create task.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#64748b" }}>Processing...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Dashboard Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Recurring Task</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Row 1: Title and Priority */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Task Title*</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="create-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="e.g. Weekly Room Inspection" value={title} onChangeText={setTitle} />
              </View>
            </View>
            <View style={[styles.flex1, styles.webOnlyMargin]}>
              <Text style={styles.label}>Priority Level</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="flag-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} value={priority} onChangeText={setPriority} />
              </View>
            </View>
          </View>

          {/* Row 2: Recurring Type and Assigned To */}
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Recurring Schedule</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={recurringType} onValueChange={(v) => setRecurringType(v)} style={styles.picker}>
                  <Picker.Item label="Daily" value="Daily" />
                  <Picker.Item label="Weekly" value="Weekly" />
                  <Picker.Item label="Monthly" value="Monthly" />
                </Picker>
              </View>
            </View>
            <View style={[styles.flex1, styles.webOnlyMargin]}>
              <Text style={styles.label}>Assigned Personnel*</Text>
              <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowEmployeeList(!showEmployeeList)}>
                <Ionicons name="people-outline" size={18} color="#2563eb" />
                <Text style={styles.assignedText} numberOfLines={1}>
                  {assignedTo.length > 0 ? assignedTo.join(", ") : "Select Employees"}
                </Text>
              </TouchableOpacity>
              {showEmployeeList && (
                <View style={styles.dropdownOverlay}>
                  <FlatList
                    data={employees}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.employeeItem} onPress={() => toggleEmployee(item)}>
                        <Text style={{ color: "#334155" }}>{item}</Text>
                        {assignedTo.includes(item) && <Ionicons name="checkmark-circle" size={18} color="#2563eb" />}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <Text style={styles.label}>Description & Instructions*</Text>
          <View style={[styles.inputWrapper, { height: 120, alignItems: "flex-start", paddingTop: 12 }]}>
            <Ionicons name="document-text-outline" size={18} color="#2563eb" />
            <TextInput style={[styles.input, { height: 100 }]} placeholder="Provide task details..." multiline value={description} onChangeText={setDescription} />
          </View>

          {/* Row 3: Dates */}
         {/* Row 3: Dates */}
<View style={styles.row}>
  {/* Start Schedule */}
  <View style={styles.flex1}>
    <Text style={styles.label}>Start Schedule</Text>

    {Platform.OS === "web" ? (
      <View style={styles.dateTimeRow}>
        <input
          type="date"
          value={startDate.toISOString().split("T")[0]}
          onChange={(e) => {
            const [year, month, day] = e.target.value.split("-");
            const newDate = new Date(startDate);
            newDate.setFullYear(year, month - 1, day);
            setStartDate(newDate);
          }}
          style={styles.webDateInput}
        />
        <input
          type="time"
          value={startDate.toTimeString().slice(0, 5)}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(":");
            const newDate = new Date(startDate);
            newDate.setHours(hours, minutes);
            setStartDate(newDate);
          }}
          style={styles.webDateInput}
        />
      </View>
    ) : (
      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartDatePicker(true)}>
          <Text style={styles.dateBtnText}>{startDate.toDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartTimePicker(true)}>
          <Text style={styles.dateBtnText}>
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(e, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display="default"
            onChange={(e, selectedTime) => {
              setShowStartTimePicker(false);
              if (selectedTime) setStartDate(selectedTime);
            }}
          />
        )}
      </View>
    )}
  </View>

  {/* End Schedule */}
  <View style={[styles.flex1, styles.webOnlyMargin]}>
    <Text style={styles.label}>End Schedule</Text>

    {Platform.OS === "web" ? (
      <View style={styles.dateTimeRow}>
        <input
          type="date"
          value={endDate.toISOString().split("T")[0]}
          onChange={(e) => {
            const [year, month, day] = e.target.value.split("-");
            const newDate = new Date(endDate);
            newDate.setFullYear(year, month - 1, day);
            setEndDate(newDate);
          }}
          style={styles.webDateInput}
        />
        <input
          type="time"
          value={endDate.toTimeString().slice(0, 5)}
          onChange={(e) => {
            const [hours, minutes] = e.target.value.split(":");
            const newDate = new Date(endDate);
            newDate.setHours(hours, minutes);
            setEndDate(newDate);
          }}
          style={styles.webDateInput}
        />
      </View>
    ) : (
      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndDatePicker(true)}>
          <Text style={styles.dateBtnText}>{endDate.toDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndTimePicker(true)}>
          <Text style={styles.dateBtnText}>
            {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(e, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={endDate}
            mode="time"
            display="default"
            onChange={(e, selectedTime) => {
              setShowEndTimePicker(false);
              if (selectedTime) setEndDate(selectedTime);
            }}
          />
        )}
      </View>
    )}
  </View>
</View>


          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Deploy Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminRecurringAddTaskScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  backBtn: { padding: 8, marginRight: 8, borderRadius: 8, backgroundColor: "#f8fafc" },

  scrollContainer: { padding: 30, maxWidth: 1000, alignSelf: "center", width: "100%" },
  
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },

  row: { 
    flexDirection: Platform.OS === "web" ? "row" : "column", 
    marginBottom: 10 
  },
  flex1: { flex: 1 },
  webOnlyMargin: { marginLeft: Platform.OS === "web" ? 20 : 0 },

  label: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 8, marginTop: 15 },
  
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 48,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1e293b", outlineStyle: "none" },
  assignedText: { marginLeft: 10, color: "#334155", flex: 1 },

  pickerContainer: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, height: 48, justifyContent: "center" },
  picker: { width: "100%", borderWidth: 0, backgroundColor: "transparent" },

  dateTimeRow: { flexDirection: "row", gap: 10 },
  dateBtn: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, height: 48, justifyContent: "center", alignItems: "center" },
  dateBtnText: { color: "#334155", fontWeight: "500", fontSize: 14 },

  dropdownOverlay: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", marginTop: 5, maxHeight: 150, zIndex: 100 },
  employeeItem: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
webDateInput: {
  flex: 1,
  padding: 10,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#e2e8f0",
  fontSize: 14,
  marginRight: 10,
  outlineStyle: "none",
},

  submitButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
    alignSelf: Platform.OS === "web" ? "flex-end" : "stretch",
    minWidth: 200,
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});