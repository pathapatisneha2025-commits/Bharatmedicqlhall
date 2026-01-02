// screens/EmployeePayslipScreen.js
import React, { useState, useEffect } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { getEmployeeId } from "../utils/storage";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function EmployeePayslipScreen() {
  const navigation = useNavigation();

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // Last month calculation
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();

  const [employeeId, setEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payslipData, setPayslipData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("current"); // 'current' or 'last'

  useEffect(() => {
    const fetchEmployeeId = async () => {
      const id = await getEmployeeId();
      if (!id) {
        Alert.alert("Error", "No employee ID found in storage.");
        return;
      }
      setEmployeeId(id);
    };
    fetchEmployeeId();
  }, []);

  const fetchPayslip = async (type) => {
    if (!employeeId) return Alert.alert("Error", "Employee ID missing.");

    let fetchYear = year;
    let fetchMonth = month;

    if (type === "last") {
      fetchYear = lastMonthYear;
      fetchMonth = lastMonth;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/payslips/pdf/${fetchYear}/${fetchMonth}/${employeeId}`,
        { method: "GET" }
      );

      if (!response.ok) throw new Error("Failed to generate payslip PDF.");

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        const pdfBlob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          setPayslipData(reader.result);
          setSelectedMonth(type);
          Alert.alert("Success", `${type === "current" ? "Current" : "Last"} month payslip generated!`);
        };

        reader.readAsDataURL(pdfBlob);
      } else throw new Error("Invalid response. Expected a PDF file.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch payslip.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!employeeId) return Alert.alert("Error", "Employee ID missing.");

    let url = `${BASE_URL}/payslips/pdf/${year}/${month}/${employeeId}`;
    if (selectedMonth === "last") {
      url = `${BASE_URL}/payslips/pdf/${lastMonthYear}/${lastMonth}/${employeeId}`;
    }

    try {
      Alert.alert("Opening", "Your payslip will open in a new tab.");
      Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Failed to open PDF.");
      console.error(error);
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.heading}>Employee Payslip</Text>
      </View>

      <View style={styles.payslipContainer}>
        <Text style={styles.label}>Select Month</Text>
        <View style={styles.monthButtons}>
          <TouchableOpacity
            style={[styles.monthBtn, selectedMonth === "current" && styles.activeMonthBtn]}
            onPress={() => fetchPayslip("current")}
          >
            <MaterialCommunityIcons name="calendar-today" size={20} color="#fff" />
            <Text style={styles.monthBtnText}>{monthNames[month - 1]}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.monthBtn, selectedMonth === "last" && styles.activeMonthBtn]}
            onPress={() => fetchPayslip("last")}
          >
            <MaterialCommunityIcons name="calendar-minus" size={20} color="#fff" />
            <Text style={styles.monthBtnText}>{monthNames[lastMonth - 1]}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={downloadPdf} disabled={!payslipData}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.buttonText}>
            {payslipData ? "Download / Share PDF" : "Generate PDF first"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 10,
  },
  payslipContainer: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  monthButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  activeMonthBtn: {
    backgroundColor: "#0056b3",
  },
  monthBtnText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
