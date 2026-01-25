import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
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

  const windowHeight = Dimensions.get("window").height;
const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

  useEffect(() => {
    const fetchData = async () => {
      const empId = await getEmployeeId();
      if (!empId) {
        Alert.alert("Error", "Employee ID not found");
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
      Alert.alert("Error", "Failed to fetch allowance usage");
    }
  };

  /* ================= CSV DOWNLOAD ================= */
const downloadCSV = async () => {
  try {
    if (!usageData.length) {
      Alert.alert("No Data", "Nothing to download");
      return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert(
        "Not Supported",
        "CSV download does not work in Expo Go. Use APK or Dev Build."
      );
      return;
    }

    const headers = [
      "Employee Name",
      "Department",
      "Description",
      "Total Amount",
      "Amount Used",
      "Date",
    ];

    const csvRows = [
      headers.map(escapeCSV).join(","),
      ...usageData.map((item) =>
        [
          escapeCSV(item.emp_name),
          escapeCSV(item.department),
          escapeCSV(item.description),
          escapeCSV(item.amount),
          escapeCSV(item.amount_used),
escapeCSV(
  new Date(item.created_at).toISOString().split("T")[0]
)
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    const fileUri =
      FileSystem.documentDirectory + "employee_allowance.csv";

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: "utf8",
    });

    await Sharing.shareAsync(fileUri);
  } catch (err) {
    console.log("CSV ERROR:", err);
    Alert.alert("Error", "CSV download failed");
  }
};




  /* ================= EXCEL DOWNLOAD ================= */
const downloadExcel = async () => {
  try {
    if (!usageData.length) {
      Alert.alert("No Data", "Nothing to download");
      return;
    }

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert(
        "Not Supported",
        "Download not supported in Expo Go. Use APK or Dev Build."
      );
      return;
    }

    const excelData = usageData.map((item) => ({
      "Employee Name": item.emp_name,
      Department: item.department,
      Description: item.description,
      "Total Amount": item.amount,
      "Amount Used": item.amount_used,
      Date: new Date(item.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allowance");

    const base64 = XLSX.write(workbook, {
      type: "base64",
      bookType: "xlsx",
      compression: false,
    });

    const fileUri =
      FileSystem.documentDirectory + "employee_allowance.xlsx";

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Sharing.shareAsync(fileUri);
  } catch (err) {
    console.log(err);
    Alert.alert("Error", "Excel download failed");
  }
};


  return (
    <View style={[styles.container, { minHeight: windowHeight }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Employee Allowance Usage</Text>

        <View style={{ flexDirection: "row", marginLeft: "auto" }}>
          <TouchableOpacity onPress={downloadCSV} style={{ marginRight: 16 }}>
            <Ionicons name="document-text-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={downloadExcel}>
            <Ionicons name="grid-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0D6EFD" />
      ) : usageData.length === 0 ? (
        <Text style={styles.noData}>No records found</Text>
      ) : (
        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={styles.headerCell}>Employee Name</Text>
              <Text style={styles.headerCell}>Department</Text>
              <Text style={styles.headerCell}>Description</Text>
              <Text style={styles.headerCell}>Total Amount</Text>
              <Text style={styles.headerCell}>Amount Used</Text>
              <Text style={styles.headerCell}>Date</Text>
            </View>

            {usageData.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={styles.cell}>{item.emp_name}</Text>
                <Text style={styles.cell}>{item.department}</Text>
                <Text style={styles.cell}>{item.description}</Text>
                <Text style={styles.cell}>₹{item.amount}</Text>
                <Text style={styles.cell}>{item.amount_used}</Text>
                <Text style={styles.cell}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D6EFD",
    padding: 12,
    borderRadius: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  tableContainer: {
    minWidth: 700,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerRow: {
    backgroundColor: "#0D6EFD",
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    color: "#333",
  },
  headerCell: {
    flex: 1,
    paddingHorizontal: 8,
    color: "#fff",
    fontWeight: "bold",
  },
  noData: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },
});
