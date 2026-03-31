import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
 useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function SubAdminEmpAllowanceScreen() {
  const navigation = useNavigation();

  const [employees, setEmployees] = useState([]);
  const [allowances, setAllowances] = useState([]);
  const [loading, setLoading] = useState(false);
          const [loadingCount, setLoadingCount] = useState(0);
  
  const [refreshing, setRefreshing] = useState(false);

  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [allowanceAmount, setAllowanceAmount] = useState("");
  const [editId, setEditId] = useState(null);
   const { width: SCREEN_WIDTH } = useWindowDimensions();
  
 const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
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
                let interval;
                if (loading) {
                  setLoadingCount(0);
                  interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
                } else clearInterval(interval);
                return () => clearInterval(interval);
              }, [loading]);
  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employee/all`);
      const result = await response.json();
      const employeeArray = Array.isArray(result) ? result : result.employees ? result.employees : [];
      setEmployees(employeeArray);

      if (employeeArray.length > 0) {
        const firstEmp = employeeArray[0];
        setSelectedEmployeeName(firstEmp.full_name || firstEmp.name || "");
        setEmployeeEmail(firstEmp.email || "");
      }
    } catch (error) {
      showAlert("Error", "Failed to fetch employees");
    }
  };

  // Fetch all allowances
  const fetchAllowances = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/employeeallowances/all`);
      const result = await response.json();
      setAllowances(result);
    } catch (error) {
      showAlert("Error", "Failed to fetch allowances");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAllowances();
  }, []);

  // Auto-fill email when employee name changes
  const handleEmployeeChange = (name) => {
    setSelectedEmployeeName(name);
    const emp = employees.find((e) => e.full_name === name || e.name === name);
    setEmployeeEmail(emp ? emp.email : "");
  };

  const resetForm = () => {
    if (employees.length > 0) {
      const firstEmp = employees[0];
      setSelectedEmployeeName(firstEmp.full_name || firstEmp.name || "");
      setEmployeeEmail(firstEmp.email || "");
    } else {
      setSelectedEmployeeName("");
      setEmployeeEmail("");
    }
    setAllowanceAmount("");
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!selectedEmployeeName || !employeeEmail || !allowanceAmount) {
      showAlert("Validation Error", "All fields are required!");
      return;
    }

    const payload = {
      emp_name: selectedEmployeeName,
      emp_email: employeeEmail,
      allowance_amount: parseInt(allowanceAmount),
    };

    try {
      setLoading(true);
      const url = editId ? `${BASE_URL}/employeeallowances/update/${editId}` : `${BASE_URL}/employeeallowances/add`;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
       showAlert("Success", editId ? "Updated successfully" : "Added successfully");
        resetForm();
        fetchAllowances();
      } else {
        showAlert("Error", result.message || "Something went wrong");
      }
    } catch (error) {
      showAlert("Error", "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedEmployeeName(item.emp_name);
    setEmployeeEmail(item.emp_email);
    setAllowanceAmount(item.allowance_amount.toString());
    setEditId(item.id);
  };

 const handleDelete = async (id) => {
  if (Platform.OS === "web") {
    const confirmed = window.confirm("Are you sure you want to delete this record?");
    if (!confirmed) return;
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/employeeallowances/delete/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (response.ok) {
        alert("Record deleted successfully");
        fetchAllowances();
      } else {
        alert(result.message || "Failed to delete");
      }
    } catch (error) {
      alert("Failed to delete data");
    } finally {
      setLoading(false);
    }
  } else {
    // Mobile alert logic remains the same
    showAlert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/employeeallowances/delete/${id}`, { method: "DELETE" });
            const result = await response.json();
            if (response.ok) {
              showAlert("Success", "Record deleted successfully");
              fetchAllowances();
            } else showAlert("Error", result.message || "Failed to delete");
          } catch (error) {
            showAlert("Error", "Failed to delete data");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }
};

 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading employee allowanceloadingCount</Text>
      </View>
    );
  }
const renderTableRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { width: 60 }]}>#{index + 1}</Text>
      <Text style={[styles.tableCell, { width: 150, fontWeight: '600' }]}>{item.emp_name}</Text>
      <Text style={[styles.tableCell, { width: 220 }]}>{item.emp_email}</Text>
      <Text style={[styles.tableCell, { width: 120, color: '#10b981', fontWeight: 'bold' }]}>₹{item.allowance_amount}</Text>
      <View style={styles.actionCell}>
        <TouchableOpacity style={styles.actionIcon} onPress={() => handleEdit(item)}>
          <Feather name="edit-2" size={16} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]} onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10 }}>Processing... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.webWrapper}>
   
      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        <View style={styles.contentHeader}>
         <View style={styles.contentHeader}>
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
    
    {/* BACK ARROW */}
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={22} color="#1e293b" />
    </TouchableOpacity>

    {/* TITLE */}
    <View>
      <Text style={styles.mainTitle}>Allowance Management</Text>
      <Text style={styles.subTitle}>
        Manage and track employee monthly allowances
      </Text>
    </View>

  </View>
</View>

        </View>

        <View style={styles.flexRow}>
          {/* FORM CARD */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>{editId ? "Update Allowance" : "Add New Allowance"}</Text>
            
            <Text style={styles.fieldLabel}>Employee Name</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={selectedEmployeeName} onValueChange={handleEmployeeChange}>
                {employees.map((emp) => (
                  <Picker.Item key={emp.id} label={emp.full_name || emp.name} value={emp.full_name || emp.name} />
                ))}
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Employee Email</Text>
            <View style={styles.disabledInput}>
              <Feather name="mail" size={18} color="#94a3b8" />
              <TextInput style={styles.inputStyle} value={employeeEmail} editable={false} />
            </View>

            <Text style={styles.fieldLabel}>Amount (INR)</Text>
            <View style={styles.activeInput}>
              <Feather name="dollar-sign" size={18} color="#2563eb" />
              <TextInput 
                style={styles.inputStyle} 
                placeholder="0.00" 
                keyboardType="numeric" 
                value={allowanceAmount} 
                onChangeText={setAllowanceAmount} 
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{editId ? "Update Record" : "Save Allowance"}</Text>
            </TouchableOpacity>
            {editId && (
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancel Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* TABLE CARD */}
          <View style={styles.tableCard}>
             <View style={styles.tableCardHeader}>
                <Text style={styles.cardTitle}>Recent Records</Text>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                   <View style={styles.tableHeader}>
                      <Text style={[styles.headerCell, { width: 60 }]}>S.No</Text>
                      <Text style={[styles.headerCell, { width: 150 }]}>Name</Text>
                      <Text style={[styles.headerCell, { width: 220 }]}>Email</Text>
                      <Text style={[styles.headerCell, { width: 120 }]}>Amount</Text>
                      <Text style={[styles.headerCell, { width: 100, textAlign: 'center' }]}>Actions</Text>
                   </View>
                   <FlatList
                      data={allowances}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={renderTableRow}
                      contentContainerStyle={{ paddingBottom: 20 }}
                   />
                </View>
             </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  sidebar: { width: 260, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 24 },
  sidebarBrand: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: "#2563EB", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  brandLetter: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  brandSub: { fontSize: 12, color: "#64748b", marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: "#2563EB" },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: "#64748b", fontWeight: "600" },
  sidebarLabelActive: { color: "#fff" },
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 12 },
  logoutText: { marginLeft: 12, color: "#ef4444", fontWeight: "700" },

  mainContent: { flex: 1, padding: 32 },
  contentHeader: { marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4 },

  flexRow: { flexDirection: "row", gap: 24, flex: 1 },
  formCard: { width: 350, backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", alignSelf: 'flex-start' },
  tableCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: 'hidden' },
  tableCardHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  pickerWrapper: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, marginBottom: 16, backgroundColor: "#f8fafc", overflow: 'hidden' },
  disabledInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  activeInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#2563eb", borderRadius: 10, paddingHorizontal: 12, marginBottom: 20 },
  inputStyle: { flex: 1, height: 45, marginLeft: 10, color: "#1e293b", outlineStyle: 'none' },

  submitBtn: { backgroundColor: "#2563eb", padding: 15, borderRadius: 10, alignItems: "center" },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { marginTop: 12, padding: 10, alignItems: "center" },
  cancelBtnText: { color: "#ef4444", fontWeight: "600" },

  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  tableCell: { fontSize: 14, color: "#334155" },
  actionCell: { width: 100, flexDirection: "row", justifyContent: "center", gap: 8 },
  actionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" }
});