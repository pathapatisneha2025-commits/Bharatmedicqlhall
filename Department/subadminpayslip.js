// screens/SubadminPayslipScreen.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

export default function SubadminPayslipScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subadminId, setSubadminId] = useState(null);
  const navigation = useNavigation();

  // Fetch subadmin ID
  useEffect(() => {
    const loadEmployeeId = async () => {
      const id = await getEmployeeId();
      setSubadminId(id);
    };
    loadEmployeeId();
  }, []);

  // Fetch all payslips
  useEffect(() => {
   

    const fetchPayslips = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://hospitaldatabasemanagement.onrender.com/payslips/all"
        );

        if (!response.ok) throw new Error("Failed to fetch payslips.");

        const data = await response.json();

        // Map API data to state
        const formattedData = data.map((item) => ({
          id: item.employeeId?.toString(),
          name: item.employee,
          designation: item.designation,
          basic: parseFloat(item.basicsalary),
          deductions: parseFloat(item.deductions),
          net: parseFloat(item.net_pay),
          status: item.status || "pending",
          date: item.date || "Current Month",
          pdfUrl: item.pdfUrl || "",
          year: item.year,
          month: item.month,
        }));

        setEmployees(formattedData);
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, []);

  // Approve / Reject payslip
  const handleAction = async (employeeId, action) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/payslips/status/${employeeId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        }
      );

      if (!response.ok) throw new Error("Failed to update payslip status.");

      const result = await response.json();

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId ? { ...emp, status: action } : emp
        )
      );

      Alert.alert("Success", result.message || `Payslip ${action} successfully.`);
    } catch (error) {
      Alert.alert("Error", `Failed to ${action} payslip.`);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = (pdfUrl) => {
    if (!pdfUrl) return Alert.alert("Error", "PDF not available yet.");
    Linking.openURL(pdfUrl).catch(() =>
      Alert.alert("Error", "Failed to open PDF.")
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading payslips...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.heading}>Subadmin Payslip Dashboard</Text>
      </View>

      {employees.length === 0 ? (
        <Text style={styles.noDataText}>No payslips available this month.</Text>
      ) : (
        employees.map((emp) => (
          <View key={emp.id} style={styles.payslipContainer}>
            <Text style={styles.payslipText}>👤 Employee: {emp.name}</Text>
            <Text style={styles.payslipText}>📌 Designation: {emp.designation}</Text>
            <Text style={styles.payslipText}>💰 Basic Salary: ₹{emp.basic}</Text>
            <Text style={styles.payslipText}>💸 Deductions: ₹{emp.deductions}</Text>
            <Text style={styles.payslipText}>📊 Net Pay: ₹{emp.net}</Text>
            <Text style={styles.payslipText}>📅 Date: {emp.date}</Text>
            <Text style={styles.statusText}>
              Status:{" "}
              <Text
                style={{
                  color:
                    emp.status === "approved"
                      ? "green"
                      : emp.status === "rejected"
                      ? "red"
                      : "#ff9900",
                  fontWeight: "bold",
                }}
              >
                {emp.status.toUpperCase()}
              </Text>
            </Text>

            {/* Action Buttons */}
            {emp.status === "pending" && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.approveButton]}
                  onPress={() => handleAction(emp.id, "approved")}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={() => handleAction(emp.id, "rejected")}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Download PDF */}
            {emp.status === "approved" && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#007bff", marginTop: 10 }]}
                onPress={() => handleDownloadPDF(emp.pdfUrl)}
              >
                <Text style={styles.buttonText}>Download Payslip PDF</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  backButton: { marginRight: 12 },
  heading: { fontSize: 22, fontWeight: "bold", flex: 1, textAlign: "center", marginRight: 24 },
  payslipContainer: {
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    elevation: 2,
  },
  payslipText: { fontSize: 16, marginVertical: 2 },
  statusText: { marginTop: 8, fontSize: 16 },
  actionButtons: { flexDirection: "row", marginTop: 10, justifyContent: "space-between" },
  button: { padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  approveButton: { backgroundColor: "#28a745" },
  rejectButton: { backgroundColor: "#dc3545" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  noDataText: { textAlign: "center", fontSize: 18, color: "#555" },
});
