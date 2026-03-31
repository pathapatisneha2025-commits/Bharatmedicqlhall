import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const CreateTaskScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueTime, setDueTime] = useState("12:00");
const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false); // ✅ THIS

  const isMounted = useRef(true);

  useEffect(() => {
    fetchEmployees();
    return () => { isMounted.current = false; };
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employee/all`);
      const json = await response.json();
      if (json?.employees && isMounted.current) setAllEmployees(json.employees);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const toggleAssignee = (emp) => {
    setAssignees((prev) => {
      const exists = prev.some((a) => a.email === emp.email);
      return exists ? prev.filter((a) => a.email !== emp.email) : [...prev, emp];
    });
  };

  const handleCreateTask = async () => {
    if (!title.trim() || !description.trim() || assignees.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const createdBy = await getEmployeeId();
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assignto: assignees.map((a) => a.email),
        priority,
        due_date: dueDate,
        due_time: dueTime,
        created_by: createdBy,
      };

      const response = await fetch(`${BASE_URL}/task/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Task Published Successfully!");
        navigation.goBack();
      }
    } catch (error) {
      alert("Failed to create task.");
    }
  };

  const filteredEmployees = allEmployees.filter((emp) =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.breadcrumb}>TASKS / NEW ASSIGNMENT</Text>
            <Text style={styles.headerTitle}>Create New Task</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.discardBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.publishBtn} onPress={handleCreateTask}>
            <Ionicons name="cloud-upload-outline" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.publishText}>Publish Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        <View style={styles.desktopLayout}>
          <View style={styles.leftColumn}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>General Information</Text>
              <Text style={styles.inputLabel}>TASK TITLE</Text>
              <TextInput style={styles.textInput} placeholder="e.g. Update Records" value={title} onChangeText={setTitle} />
              
              <Text style={styles.inputLabel}>DESCRIPTION</Text>
              <TextInput 
                style={[styles.textInput, styles.textArea]} 
                placeholder="Details..." 
                multiline 
                value={description} 
                onChangeText={setDescription} 
              />
            </View>

            <View style={[styles.card, { marginTop: 24 }]}>
              <Text style={styles.cardTitle}>Schedule</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={styles.inputLabel}>DUE DATE</Text>
                  {Platform.OS === 'web' ? (
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={styles.htmlInput} />
                  ) : <Text>Use Mobile Date Picker</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>DUE TIME</Text>
                  {Platform.OS === 'web' ? (
                    <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} style={styles.htmlInput} />
                  ) : <Text>Use Mobile Time Picker</Text>}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={priority} onValueChange={setPriority}>
                  <Picker.Item label="High" value="High" />
                  <Picker.Item label="Medium" value="Medium" />
                  <Picker.Item label="Low" value="Low" />
                </Picker>
              </View>
            </View>
<View style={[styles.card, { marginTop: 24 }]}>
  <Text style={styles.cardTitle}>Assign Team</Text>

  {/* Selected Assignees */}
  <TouchableOpacity
    style={styles.assigneeInput}
    onPress={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
    activeOpacity={0.9}
  >
    {assignees.length === 0 ? (
      <Text style={styles.placeholderText}>Select team members</Text>
    ) : (
      <View style={styles.chipContainer}>
        {assignees.map((emp) => (
          <View key={emp.email} style={styles.chip}>
            <Text style={styles.chipText}>{emp.full_name}</Text>
            <TouchableOpacity onPress={() => toggleAssignee(emp)}>
              <Ionicons name="close" size={14} color="#475569" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    )}
    <Ionicons
      name={showAssigneeDropdown ? "chevron-up" : "chevron-down"}
      size={18}
      color="#64748b"
    />
  </TouchableOpacity>

  {/* Dropdown */}
  {showAssigneeDropdown && (
    <View style={styles.assigneeDropdown}>
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color="#94a3b8" />
        <TextInput
          placeholder="Search employee..."
          style={styles.searchField}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={{ maxHeight: 260 }}>
        {filteredEmployees.map((item) => {
          const selected = assignees.some((a) => a.email === item.email);
          return (
            <TouchableOpacity
              key={item.email}
              style={[
                styles.dropdownAssignee,
                selected && styles.dropdownAssigneeActive,
              ]}
              onPress={() => toggleAssignee(item)}
            >
              <View>
                <Text style={styles.empName}>{item.full_name}</Text>
                <Text style={styles.empEmail}>{item.email}</Text>
              </View>
              {selected && (
                <Ionicons name="checkmark-circle" size={18} color="#2563eb" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  )}
</View>

          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#f8fafc" },
  headerBar: { height: 80, backgroundColor: "#ffffff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 40, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  breadcrumb: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  headerRight: { flexDirection: "row" },
  publishBtn: { backgroundColor: "#2563eb", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  publishText: { color: "white", fontWeight: "700" },
  discardBtn: { marginRight: 20, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  discardText: { color: "#64748b", fontWeight: "700" },
  scrollWrapper: { padding: 40 },
  desktopLayout: { maxWidth: 1200, alignSelf: "center", width: "100%", flexDirection: "row" },
  leftColumn: { flex: 2, marginRight: 30 },
  rightColumn: { flex: 1 },
  card: { backgroundColor: "#ffffff", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#e2e8f0" },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", marginBottom: 8, marginTop: 12 },
  textInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 14,outlineStyle: "none" },
  textArea: { height: 140, textAlignVertical: "top" },
  row: { flexDirection: "row" },
  htmlInput: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  pickerContainer: { backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  searchField: { flex: 1, paddingVertical: 10, marginLeft: 8 },
  assigneeInput: {
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#e2e8f0",
  borderRadius: 12,
  padding: 12,
  minHeight: 52,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

placeholderText: {
  color: "#94a3b8",
  fontSize: 14,
},

chipContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  flex: 1,
},

chip: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#e0e7ff",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 20,
  marginRight: 6,
},

chipText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#1e293b",
  marginRight: 6,
},

assigneeDropdown: {
  marginTop: 8,
  backgroundColor: "#ffffff",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#e2e8f0",
  padding: 12,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 5,
},

dropdownAssignee: {
  paddingVertical: 12,
  paddingHorizontal: 10,
  borderRadius: 10,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

dropdownAssigneeActive: {
  backgroundColor: "#eff6ff",
},

  empName: { fontSize: 14, fontWeight: "700" },
  empEmail: { fontSize: 12, color: "#64748b" },
});

export default CreateTaskScreen;