import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Platform, useWindowDimensions
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";

export default function AddAllowanceUsageScreen({ navigation }) {
  const [empData, setEmpData] = useState({ emp_id: null, emp_name: "", emp_email: "", department: "" });
  const [allowanceAmount, setAllowanceAmount] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState({ current: 0, total: 2 }); 

  const API_BASE = "https://hospitaldatabasemanagement.onrender.com";

  // ✅ Responsive Breakpoints
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth > 1024;
  const isTablet = screenWidth > 768;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      setLoadingCount({ current: 0, total: 2 });

      const empId = await getEmployeeId();
      if (!empId) return showAlert("Error", "Employee ID not found");

      const empResponse = await fetch(`${API_BASE}/employee/${empId}`);
      const empJson = await empResponse.json();
      if (!empResponse.ok) throw new Error(empJson.message);

      setEmpData({
        emp_id: empId,
        emp_name: empJson.employee.full_name,
        emp_email: empJson.employee.email,
        department: empJson.employee.department,
      });

      const allowanceResponse = await fetch(`${API_BASE}/employeeallowances/employee/${empId}`);
      const allowanceJson = await allowanceResponse.json();
      if (!allowanceResponse.ok) throw new Error(allowanceJson.message);

      const amount = allowanceJson.length > 0 ? parseFloat(allowanceJson[0].allowance_amount) : 0;
      setAllowanceAmount(amount);
      setRows([{ amount: amount, amountUsed: "", description: "" }]);
    } catch (err) {
      showAlert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployeeDetails(); }, []);

  const addRow = () => {
    const totalUsed = rows.reduce((sum, r) => sum + (parseFloat(r.amountUsed) || 0), 0);
    const remaining = allowanceAmount - totalUsed;
    if (remaining <= 0) return showAlert("No remaining allowance", "All allowance has been used.");
    setRows([...rows, { amount: remaining, amountUsed: "", description: "" }]);
  };

  const updateAmountUsed = (value, index) => {
    const updated = [...rows];
    const numericValue = parseFloat(value) || 0;
    const usedBefore = updated.slice(0, index).reduce((sum, r) => sum + (parseFloat(r.amountUsed) || 0), 0);
    const remaining = allowanceAmount - usedBefore;

    if (numericValue > remaining) return showAlert("Error", "Amount exceeds remaining allowance");

    updated[index].amountUsed = value; // Keep as string for input
    updated[index].amount = remaining;

    let cumulativeUsed = usedBefore + numericValue;
    for (let i = index + 1; i < updated.length; i++) {
      updated[i].amount = allowanceAmount - cumulativeUsed;
      cumulativeUsed += parseFloat(updated[i].amountUsed || 0);
    }
    setRows(updated);
  };

  const updateDescription = (text, index) => {
    const updated = [...rows];
    updated[index].description = text;
    setRows(updated);
  };

  const deleteRow = (index) => {
    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to delete this row?")) {
            setRows(rows.filter((_, i) => i !== index));
        }
    } else {
        Alert.alert("Confirm Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => setRows(rows.filter((_, i) => i !== index)) }
        ]);
    }
  };

  const handleAddUsage = async () => {
    for (const row of rows) {
      if (!row.description.trim()) return showAlert("Error", "Description cannot be empty");
    }

    const allDescriptions = rows.map(r => r.description.trim()).join(", ");
    const allAmountUsed = rows.map(r => r.amountUsed || 0).join(", ");
    const totalUsed = rows.reduce((sum, r) => sum + (parseFloat(r.amountUsed) || 0), 0);

    try {
      const res = await fetch(`${API_BASE}/allowanceuseage/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_id: empData.emp_id,
          emp_name: empData.emp_name,
          emp_email: empData.emp_email,
          department: empData.department,
          description: allDescriptions,
          amount: totalUsed,
          amount_used: allAmountUsed,
        }),
      });

      if (!res.ok) throw new Error("Failed to add allowance usage");

      showAlert("Success", "Usage details added!");
      setRows([{ amount: allowanceAmount, amountUsed: "", description: "" }]);
    } catch (err) {
      showAlert("Error", err.message);
    }
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loaderText}>Loading... {loadingCount.current} / {loadingCount.total}</Text>
    </View>
  );

return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
        
        {/* Header Section */}
        <View style={styles.topNav}>
          <View style={styles.headerInfo}>
            <Text style={styles.pageTitle}>Allowance Usage</Text>
            <Text style={styles.pageSubtitle}>Manage and track your allowance spending</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Dashboard")}>
            <Ionicons name="close-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Info Stat Cards */}
        <View style={[styles.infoGrid, isTablet && styles.infoGridRow]}>
            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: '#E8F1FF' }]}>
                    <Ionicons name="person" size={20} color="#0D6EFD" />
                </View>
                <Text style={styles.statLabel}>Employee</Text>
                <Text style={styles.statValue} numberOfLines={1}>{empData.emp_name || "---"}</Text>
            </View>
            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: '#E7F9ED' }]}>
                    <Ionicons name="business" size={20} color="#28A745" />
                </View>
                <Text style={styles.statLabel}>Department</Text>
                <Text style={styles.statValue}>{empData.department || "---"}</Text>
            </View>
            <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: '#FFF8E6' }]}>
                    <Ionicons name="wallet" size={20} color="#FFA500" />
                </View>
                <Text style={styles.statLabel}>Total Allowance</Text>
                <Text style={styles.statValue}>₹{allowanceAmount}</Text>
            </View>
        </View>

        {/* Entry Table Section */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.hCell, { width: 120 }]}>Remaining</Text>
            <Text style={[styles.hCell, { width: 140 }]}>Amount (₹)</Text>
            <Text style={[styles.hCell, { flex: 1 }]}>Description / Purpose</Text>
            <Text style={[styles.hCell, { width: 50 }]}></Text>
          </View>

          {rows.map((item, index) => (
            <View key={index} style={styles.entryRow}>
              <View style={[styles.cell, { width: 120 }]}>
                <Text style={styles.remainingText}>₹{item.amount}</Text>
              </View>
              <TextInput
                style={[styles.input, { width: 130, fontWeight: '700', color: '#0D6EFD' }]}
                placeholder="0.00"
                keyboardType="numeric"
                value={item.amountUsed?.toString()}
                onChangeText={(text) => updateAmountUsed(text, index)}
              />
              <TextInput
                style={[styles.input, { flex: 1, minHeight: 45 }]}
                placeholder="What was this used for?"
                multiline
                value={item.description}
                onChangeText={(text) => updateDescription(text, index)}
              />
              <TouchableOpacity style={styles.deleteIcon} onPress={() => deleteRow(index)}>
                <Ionicons name="trash-bin-outline" size={20} color="#DC3545" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addRow}>
            <Ionicons name="add" size={18} color="#0D6EFD" />
            <Text style={styles.addButtonText}>Add Another Row</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAddUsage}>
                <Text style={styles.submitBtnText}>Submit Records</Text>
            </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  scrollContent: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  mainWrapper: { width: '100%' },
  desktopWrapper: { maxWidth: 1000 },

  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  headerInfo: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  pageSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  backBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },

  infoGrid: { gap: 15, marginBottom: 25 },
  infoGridRow: { flexDirection: 'row' },
  statCard: { 
    flex: 1, backgroundColor: "#fff", padding: 18, borderRadius: 12, 
    borderWidth: 1, borderColor: '#E0E0E0', elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { fontSize: 12, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 17, fontWeight: '700', color: '#333', marginTop: 4 },

  tableContainer: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', padding: 15, marginBottom: 30 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 12, marginBottom: 10 },
  hCell: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase' },
  
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  cell: { paddingRight: 10 },
  remainingText: { fontSize: 15, fontWeight: '600', color: '#666' },
  input: { 
    backgroundColor: '#FCFDFF', borderWidth: 1, borderColor: '#E2E8F0', 
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, marginHorizontal: 4 ,outlineStyle: "none"
  },
  deleteIcon: { width: 40, alignItems: 'center', justifyContent: 'center' },

  addButton: { 
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', 
    marginTop: 15, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#F0F7FF' 
  },
  addButtonText: { color: '#0D6EFD', fontWeight: '600', fontSize: 13, marginLeft: 6 },

  footer: { alignItems: 'flex-end' },
  submitBtn: { 
    backgroundColor: '#0D6EFD', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10,
    shadowColor: "#0D6EFD", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#F8F9FA' },
  loaderText: { marginTop: 12, fontSize: 14, color: "#666" },
});