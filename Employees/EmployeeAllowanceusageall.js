import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { getEmployeeId } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

export default function EmployeeAllowanceAll() {
  const navigation = useNavigation();
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;
  const MAX_WIDTH = 1400;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const fetchData = async () => {
      const empId = await getEmployeeId();
      if (!empId) {
        showAlert("Error", "Employee ID not found");
        return;
      }
      fetchAllowanceByEmployee(empId);
    };
    fetchData();
  }, []);

  const fetchAllowanceByEmployee = async (empId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/allowanceuseage/employee/${empId}`
      );
      const data = await response.json();
      setUsageData(data || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showAlert("Error", "Failed to fetch allowance usage");
    }
  };

  const formatDateForDisplay = (dateString) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const downloadCSV = async () => {
    try {
      if (!usageData.length) {
        showAlert("No Data", "Nothing to download");
        return;
      }

      const headers = ["Employee Name", "Department", "Description", "Total Amount", "Amount Used", "Date"];
      const rows = [
        headers.join(","),
        ...usageData.map((item) =>
          [
            `"${item.emp_name}"`,
            `"${item.department}"`,
            `"${item.description}"`,
            item.amount,
            item.amount_used,
            `'${new Date(item.created_at).toISOString().split("T")[0]}`,
          ].join(",")
        ),
      ];

      const csvContent = rows.join("\n");

      if (Platform.OS === "web") {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "employee_allowance.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      const fileUri = FileSystem.documentDirectory + "employee_allowance.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.log(error);
      showAlert("Error", "CSV download failed");
    }
  };

  const downloadExcel = async () => {
    try {
      if (!usageData.length) {
        showAlert("No Data", "Nothing to download");
        return;
      }

      const excelData = usageData.map((item) => ({
        "Employee Name": item.emp_name,
        Department: item.department,
        Description: item.description,
        "Total Amount": item.amount,
        "Amount Used": item.amount_used,
        Date: new Date(item.created_at).toISOString().split("T")[0],
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Allowance");

      if (Platform.OS === "web") {
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "employee_allowance.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        showAlert("Not Supported", "Use APK or Dev Build");
        return;
      }

      const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
      const fileUri = FileSystem.documentDirectory + "employee_allowance.xlsx";
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.log(error);
      showAlert("Error", "Excel download failed");
    }
  };

  return (
    <View style={styles.container}>
      {/* TOP HEADER */}
      <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
  </TouchableOpacity>
        <View>
          <Text style={styles.title}>Allowance History</Text>
          <Text style={styles.subtitle}>Detailed view of your allowance logs</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={downloadExcel} style={styles.iconButton}>
            <Ionicons name="download-outline" size={20} color="#555" />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.createButton}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Add Log</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STATS CARDS */}
        {/* <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F1FF' }]}><Ionicons name="receipt" size={18} color="#0D6EFD" /></View>
            <Text style={styles.statLabel}>Total Logs</Text>
            <Text style={styles.statValue}>{usageData.length}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E7F9ED' }]}><Ionicons name="wallet" size={18} color="#28A745" /></View>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>₹{usageData.reduce((acc, curr) => acc + (curr.amount_used || 0), 0)}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF8E6' }]}><Ionicons name="calendar" size={18} color="#FFA500" /></View>
            <Text style={styles.statLabel}>Last Entry</Text>
            <Text style={styles.statValue}>{usageData.length > 0 ? formatDateForDisplay(usageData[0].created_at) : 'N/A'}</Text>
          </View>
        </View> */}

        TABLE SECTION
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.columnHeader, { flex: 2 }]}>Description</Text>
            <Text style={[styles.columnHeader, { flex: 1.5 }]}>Department</Text>
            <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Amount</Text>
            <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'center' }]}>Date</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#0D6EFD" style={{ margin: 20 }} />
          ) : usageData.length === 0 ? (
            <Text style={styles.noDataText}>No records available</Text>
          ) : (
            usageData.map((item, index) => (
              <View key={item.id || index} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.cellText, { flex: 2, fontWeight: '500' }]} numberOfLines={1}>{item.description}</Text>
                <View style={{ flex: 1.5 }}>
                   <View style={styles.deptBadge}><Text style={styles.deptBadgeText}>{item.department || 'General'}</Text></View>
                </View>
                <Text style={[styles.cellText, { flex: 1, textAlign: 'right', color: '#0D6EFD', fontWeight: '700' }]}>₹{item.amount_used}</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'center', color: '#888', fontSize: 11 }]}>{formatDateForDisplay(item.created_at)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  topNav: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    paddingHorizontal: 24, paddingTop: 50, paddingBottom: 20, backgroundColor: '#fff' 
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  subtitle: { fontSize: 12, color: "#666" },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginRight: 12, padding: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  createButton: { 
    flexDirection: 'row', backgroundColor: '#0D6EFD', paddingHorizontal: 14, 
    paddingVertical: 8, borderRadius: 8, alignItems: 'center' 
  },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 13, marginLeft: 4 },
  
  scrollContent: { padding: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#fff', width: '31%', padding: 12, borderRadius: 12, elevation: 1 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { color: '#888', fontSize: 10, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#333' },

  tableWrapper: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1, borderWidth: 1, borderColor: '#eee' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F1F5F9', paddingVertical: 12, paddingHorizontal: 15 },
  columnHeader: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#FCFDFF' },
  cellText: { fontSize: 13, color: '#334155' },
  deptBadge: { backgroundColor: '#E2E8F0', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  deptBadgeText: { fontSize: 10, color: '#475569', fontWeight: '700' },
  noDataText: { textAlign: 'center', padding: 30, color: '#999' }
});