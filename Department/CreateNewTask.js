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
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { getSubadminId } from "../utils/storage";

const CreateTaskScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignto, setAssignto] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState(new Date());
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const containerWidth = SCREEN_WIDTH > 1024 ? 800 : SCREEN_WIDTH > 768 ? 700 : "95%";

  const formatDate = (date) => (date ? date.toISOString().split("T")[0] : "");
  const formatTime = (date) => (date ? date.toTimeString().slice(0, 5) : "");

  const showAlert = (title, message, buttons) => {
    if (isWeb) {
      const confirmAction = window.confirm(`${title}\n\n${message}`);
      if (confirmAction && buttons?.[1]?.onPress) buttons[1].onPress();
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/employee/all");
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
      else showAlert("Error", "Failed to load employees.");
    } catch (error) {
      showAlert("Error", "Something went wrong while fetching employees.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailSelection = (email) => {
    setAssignto((prev) => prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]);
  };

  const handleCreateTask = async () => {
  console.log("=== Create Task Triggered ===");
  console.log("Title:", title);
  console.log("Description:", description);
  console.log("Assigned To:", assignto);
  console.log("Priority:", priority);
  console.log("Due Date:", dueDate);
  console.log("Due Time:", dueTime);

  if (!title || assignto.length === 0 || !dueDate || !dueTime) {
    console.log("Validation failed: Missing required fields");
    showAlert("Validation Error", "Please fill all required fields.");
    return;
  }

  const subadmin_id = await getSubadminId();
  console.log("Subadmin ID:", subadmin_id);

  const createdBy = subadmin_id || null;
  console.log("Created By:", createdBy);

  const payload = {
    title,
    description,
    assignto,
    priority,
    due_date: formatDate(dueDate),
    due_time: dueTime.toTimeString().split(" ")[0],
    created_by: createdBy,
  };

  console.log("Payload to send:", payload);

  try {
    setLoading(true);
    const res = await fetch("https://hospitaldatabasemanagement.onrender.com/task/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("API Response:", data);

    if (res.ok) {
      showAlert("Success", data.message || "Task created successfully");
      navigation.goBack();
    } else {
      showAlert("Error", data.error || data.message || "Failed to create task");
    }
  } catch (error) {
    console.log("Error caught in try/catch:", error);
    showAlert("Error", "Something went wrong while creating the task.");
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create New Task</Text>
            <Text style={styles.headerSubtitle}>Assign duties to hospital staff</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { width: containerWidth, alignSelf: "center" }]}>
          <View style={styles.desktopRow}>
            {/* Left Column */}
            <View style={styles.columnMain}>
              <View style={[styles.formCard, { marginBottom: 20 }]}>
                <Text style={styles.label}>Task Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., General Ward Inventory Check"
                  placeholderTextColor="#94a3b8"
                  value={title}
                  onChangeText={setTitle}
                />
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Detailed instructions for the staff..."
                  placeholderTextColor="#94a3b8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              <View style={[styles.formCard, { marginBottom: 20 }]}>
                <Text style={styles.label}>Assign to Staff Members *</Text>
                <TouchableOpacity
                  style={[styles.dropdownTrigger, showEmployeeDropdown && styles.dropdownActive]}
                  onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                >
                  <Text style={[styles.dropdownValue, assignto.length === 0 && { color: "#94a3b8" }]}>
                    {assignto.length > 0 ? `${assignto.length} employees selected` : "Search or select team members"}
                  </Text>
                  <Ionicons name={showEmployeeDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                </TouchableOpacity>
                {showEmployeeDropdown && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 250 }}>
                      {employees.map((emp) => {
                        const isSelected = assignto.includes(emp.email);
                        return (
                          <TouchableOpacity
                            key={emp.id || emp.email}
                            style={[styles.employeeItem, isSelected && styles.employeeItemActive]}
                            onPress={() => toggleEmailSelection(emp.email)}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                              {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <View>
                              <Text style={[styles.empName, isSelected && { color: "#2563eb" }]}>{emp.full_name}</Text>
                              <Text style={styles.empEmail}>{emp.email}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.columnSide}>
              <View style={[styles.formCard, { marginBottom: 20 }]}>
                <Text style={styles.label}>Priority Level</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={priority} onValueChange={setPriority} style={styles.webPicker}>
                    <Picker.Item label="🟢 Low Priority" value="Low" />
                    <Picker.Item label="🟡 Medium Priority" value="Medium" />
                    <Picker.Item label="🔴 High Priority" value="High" />
                  </Picker>
                </View>

                {/* Deadline Date */}
<Text style={styles.label}>Deadline Date</Text>
{Platform.OS === "web" ? (
  <input
    type="date"
    style={styles.webInput}
    value={formatDate(dueDate)}
    onChange={(e) => setDueDate(new Date(e.target.value))}
  />
) : (
  <TextInput
    style={styles.webInput}
    value={formatDate(dueDate)}
    onChangeText={(val) => setDueDate(new Date(val))}
  />
)}

{/* Deadline Time */}
<Text style={styles.label}>Deadline Time</Text>
{Platform.OS === "web" ? (
  <input
    type="time"
    style={styles.webInput}
    value={formatTime(dueTime)}
    onChange={(e) => {
      const [h, m] = e.target.value.split(":");
      const updated = new Date(dueTime);
      updated.setHours(parseInt(h, 10));
      updated.setMinutes(parseInt(m, 10));
      setDueTime(updated);
    }}
  />
) : (
  <TextInput
    style={styles.webInput}
    value={formatTime(dueTime)}
    onChangeText={(val) => {
      const [h, m] = val.split(":");
      const updated = new Date(dueTime);
      updated.setHours(parseInt(h, 10));
      updated.setMinutes(parseInt(m, 10));
      setDueTime(updated);
    }}
  />
)}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Discard Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { marginLeft: 15 }]} onPress={handleCreateTask} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Publish Task</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f1f5f9" },
  header: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingVertical: 20, alignItems: "center" },
  headerContent: { width: "90%", maxWidth: 1200, flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginLeft: 12 },
  headerSubtitle: { fontSize: 14, color: "#64748b", marginLeft: 15, borderLeftWidth: 1, borderLeftColor: "#e2e8f0", paddingLeft: 15 },
  backBtn: { padding: 8, backgroundColor: "#f8fafc", borderRadius: 10 },

  scrollContent: { paddingVertical: 30 },
  desktopRow: { flexDirection: "row" },
  columnMain: { flex: 2 },
  columnSide: { flex: 1 },

  formCard: { backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#e2e8f0" },
  label: { fontSize: 12, fontWeight: "800", color: "#475569", marginBottom: 10, marginTop: 15, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 14, fontSize: 15, color: "#1e293b", borderWidth: 1, borderColor: "#e2e8f0" },
  textArea: { height: 120, textAlignVertical: "top" },

  dropdownTrigger: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  dropdownActive: { borderColor: "#2563eb", backgroundColor: "#fff" },
  dropdownValue: { fontSize: 15, color: "#1e293b", fontWeight: "500" },
  dropdownMenu: { backgroundColor: "#fff", borderRadius: 12, marginTop: 8, padding: 4, borderWidth: 1, borderColor: "#e2e8f0" },
  employeeItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, marginBottom: 2 },
  employeeItemActive: { backgroundColor: "#eff6ff" },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: "#cbd5e1", marginRight: 12, justifyContent: "center", alignItems: "center" },
  checkboxChecked: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  empName: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  empEmail: { fontSize: 12, color: "#64748b" },

  pickerWrapper: { backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
  webPicker: { padding: 12, border: "none", backgroundColor: "transparent", width: "100%", outline: "none" },

  webInput: { padding: 14, borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", fontSize: 14, outline: "none", color: "#1e293b", fontFamily: "inherit" },

  footer: { padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e2e8f0", alignItems: "center" },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, backgroundColor: "#f1f5f9" },
  cancelBtnText: { color: "#64748b", fontWeight: "700", fontSize: 15 },
  submitBtn: { flexDirection: "row", paddingVertical: 14, paddingHorizontal: 30, borderRadius: 10, backgroundColor: "#2563eb", alignItems: "center", shadowColor: "#2563eb", shadowOpacity: 0.3, shadowRadius: 10 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default CreateTaskScreen;
