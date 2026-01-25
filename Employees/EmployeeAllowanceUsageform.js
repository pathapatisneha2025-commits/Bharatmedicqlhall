import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Dimensions, ActivityIndicator 
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";

export default function AddAllowanceUsageScreen({ navigation }) {

  const [empData, setEmpData] = useState({ emp_id: null, emp_name: "", emp_email: "", department: "" });
  const [allowanceAmount, setAllowanceAmount] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = "https://hospitaldatabasemanagement.onrender.com";
  const screenWidth = Dimensions.get("window").width;

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const empId = await getEmployeeId();
      if (!empId) return Alert.alert("Error", "Employee ID not found");

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
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployeeDetails(); }, []);

  const addRow = () => {
    const totalUsed = rows.reduce((sum, r) => sum + (parseFloat(r.amountUsed) || 0), 0);
    const remaining = allowanceAmount - totalUsed;
    if (remaining <= 0) return Alert.alert("No remaining allowance", "All allowance has been used.");
    setRows([...rows, { amount: remaining, amountUsed: "", description: "" }]);
  };

  const updateAmountUsed = (value, index) => {
    const updated = [...rows];
    const numericValue = parseFloat(value) || 0;
    const usedBefore = updated.slice(0, index).reduce((sum, r) => sum + (parseFloat(r.amountUsed) || 0), 0);
    const remaining = allowanceAmount - usedBefore;

    if (numericValue > remaining) return Alert.alert("Error", "Amount used cannot exceed remaining allowance");

    updated[index].amountUsed = numericValue;
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
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this row?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => setRows(rows.filter((_, i) => i !== index)) }
      ]
    );
  };

  const handleAddUsage = async () => {
    for (const row of rows) {
      if (!row.description.trim()) return Alert.alert("Error", "Description cannot be empty");
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

      Alert.alert("Success", "Usage details added!");
      setRows([{ amount: allowanceAmount, amountUsed: "", description: "" }]);
    } catch (err) {
      Alert.alert("Error", err.message);
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")}>
          <Ionicons name="arrow-back" size={28} color="#1e90ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Allowance Usage</Text>
      </View>

      {/* Employee Info */}
      {[["person-circle-outline", empData.emp_name], ["email", empData.emp_email], ["business-outline", empData.department]].map(([icon, value], idx) => (
        <View key={idx} style={styles.infoCard}>
          {icon === "email" ? <MaterialIcons name="email" size={24} color="#1e90ff" /> : <Ionicons name={icon} size={24} color="#1e90ff" />}
          <View style={styles.infoText}>
            <Text style={styles.infoValue}>{value || "Loading..."}</Text>
          </View>
        </View>
      ))}

      {/* Table */}
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: Math.max(650, screenWidth - 40) }}>
            {/* Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={styles.headerCell}>Remaining (₹)</Text>
              <Text style={styles.headerCell}>Amount Used (₹)</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Description</Text>
              <Text style={styles.headerCell}>Action</Text>
            </View>

            {/* Rows */}
            {rows.map((item, index) => (
              <View key={index} style={styles.rowCard}>
                <View style={styles.cellBox}>
                  <Text style={styles.cell}>{item.amount}</Text>
                </View>

                <TextInput
                  style={[styles.amountInput, { width: screenWidth > 768 ? 150 : 120 }]}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={item.amountUsed?.toString() || ""}
                  onChangeText={(text) => updateAmountUsed(text, index)}
                />

                <TextInput
                  style={[styles.descriptionInput, { minWidth: screenWidth > 768 ? 300 : 200 }]}
                  placeholder="Enter usage description..."
                  multiline
                  value={item.description}
                  onChangeText={(text) => updateDescription(text, index)}
                />

                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteRow(index)}>
                  <Ionicons name="trash-outline" size={24} color="#ff4d4d" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Row */}
            <TouchableOpacity style={styles.addRowBtn} onPress={addRow}>
              <Text style={styles.addRowText}>+ Add Row</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAddUsage}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e6f0ff", padding: 20, marginTop: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1e3c72", marginLeft: 10 },
  infoCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 15, elevation: 4 },
  infoText: { marginLeft: 15 },
  infoValue: { fontSize: 16, fontWeight: "600", color: "#1e3c72" },

  tableContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: "#a0c4ff" },
  tableHeaderRow: { flexDirection: "row", paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: "#a0c4ff" },
  headerCell: { fontWeight: "700", fontSize: 16, color: "#1e3c72", paddingHorizontal: 8, minWidth: 100 },

  rowCard: { flexDirection: "row", alignItems: "flex-start", marginVertical: 5, padding: 12, borderRadius: 10, backgroundColor: "#f2f8ff" },
  cellBox: { width: 100, justifyContent: "center", alignItems: "center" },
  cell: { fontSize: 16, color: "#1e3c72" },

  amountInput: { minHeight: 45, borderWidth: 1, borderColor: "#a0c4ff", borderRadius: 8, paddingHorizontal: 8, textAlignVertical: "center", marginHorizontal: 5 },
  descriptionInput: { flex: 1, minHeight: 70, borderWidth: 1, borderColor: "#a0c4ff", borderRadius: 8, padding: 8, textAlignVertical: "top", marginHorizontal: 5 },

  deleteBtn: { width: 80, justifyContent: "center", alignItems: "center", marginHorizontal: 5 },

  addRowBtn: { backgroundColor: "#1e90ff", padding: 10, alignItems: "center", borderRadius: 10, marginTop: 10 },
  addRowText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  button: { backgroundColor: "#1e90ff", padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
