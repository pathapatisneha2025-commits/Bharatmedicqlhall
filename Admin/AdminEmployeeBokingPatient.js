import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminEmployeePatientReports() {
  const navigation = useNavigation();
  const [bookingData, setBookingData] = useState([]);
  const [employees, setEmployees] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("Daily"); // Daily / Weekly / Monthly

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const bookingsRes = await fetch(`${API_BASE}/doctorbooking/all`);
      const bookingsJson = await bookingsRes.json();
      setBookingData(bookingsJson || []);

      const employeesRes = await fetch(`${API_BASE}/employee/all`);
      const employeesJson = await employeesRes.json();

      const empMap = {};
      if (employeesJson.success && employeesJson.employees) {
        employeesJson.employees.forEach(emp => {
          empMap[emp.id] = emp.full_name;
        });
      }
      setEmployees(empMap);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (name) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded(expanded === name ? null : name);
  };

  // ---------------------------
  // Filter bookings frontend
  // ---------------------------
  const filterBookingsByDate = (bookings) => {
    const now = new Date();
    return bookings.filter(b => {
      const date = new Date(b.appointment_date);
      if (filter === "Daily") {
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
      } else if (filter === "Weekly") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Sunday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Saturday
        return date >= weekStart && date <= weekEnd;
      } else if (filter === "Monthly") {
        return date.getFullYear() === now.getFullYear() &&
               date.getMonth() === now.getMonth();
      }
      return true;
    });
  };

  const filteredBookings = filterBookingsByDate(bookingData);

  // Group bookings by employee full name
  const bookingsByEmployee = filteredBookings.reduce((acc, b) => {
    const name = employees[b.employee_id] || `EMP-${b.employee_id}`;
    if (!acc[name]) acc[name] = [];
    acc[name].push(b);
    return acc;
  }, {});

  // ---------------------------
  // CSV Download
  // ---------------------------
  const downloadCSV = async () => {
    if (!filteredBookings.length) return Alert.alert("No data to download");

    const header = ["Employee Name","Patient Name","Booking Date","Service","Amount"];
    const rows = filteredBookings.map(b => [
      employees[b.employee_id] || `EMP-${b.employee_id}`,
      b.patient_name,
      new Date(b.appointment_date).toLocaleDateString(),
      b.specialization,
      b.doctor_consultant_fee,
    ]);

    const csvContent =
      [header.join(","), ...rows.map(r => r.join(","))].join("\n");

    const fileUri = `${FileSystem.cacheDirectory}employee_bookings.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv" });
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#0a66c2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee-wise Bookings</Text>
      </View>

      {/* FILTERS */}
      <View style={styles.filterContainer}>
        {["Daily", "Weekly", "Monthly"].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={filter === f ? styles.filterTextActive : styles.filterText}>{f}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.downloadButton} onPress={downloadCSV}>
          <Icon name="download" size={18} color="#fff" />
          <Text style={styles.downloadText}>Download CSV</Text>
        </TouchableOpacity>
      </View>

      {/* LOADER */}
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0a66c2" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      )}

      {/* BOOKINGS CARDS */}
      {!loading &&
        Object.entries(bookingsByEmployee).map(([empName, empBookings]) => (
          <View key={empName} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => toggleExpand(empName)}
            >
              <Icon
                name={expanded === empName ? "expand-more" : "chevron-right"}
                size={22}
                color="#0a66c2"
              />
              <Text style={styles.empName}>{empName}</Text>
            </TouchableOpacity>

            {expanded === empName && (
              <ScrollView horizontal style={styles.tableScroll} contentContainerStyle={{ minWidth: 600 }}>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.col}>Booking Date</Text>
                    <Text style={styles.col}>Patient Name</Text>
                    <Text style={styles.col}>Service</Text>
                    <Text style={styles.col}>Employee</Text>
                    <Text style={styles.col}>Fee</Text>
                  </View>
                  {empBookings.map((b, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={styles.col}>{new Date(b.appointment_date).toLocaleDateString()}</Text>
                      <Text style={styles.col}>{b.patient_name}</Text>
                      <Text style={styles.col}>{b.specialization}</Text>
                      <Text style={styles.col}>{employees[b.employee_id] || `EMP-${b.employee_id}`}</Text>
                      <Text style={[styles.col, styles.fee]}>₹{b.doctor_consultant_fee}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f8ff", padding: 12 },
  pageContent: { alignItems: "center", width: "100%" },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 12, width: "100%", maxWidth: 1200, justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#0a66c2", textAlign: "center" },

  filterContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  filterButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: "#0a66c2" },
  filterButtonActive: { backgroundColor: "#0a66c2" },
  filterText: { color: "#0a66c2", fontWeight: "700" },
  filterTextActive: { color: "#fff", fontWeight: "700" },

  downloadButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#0a66c2", padding: 6, borderRadius: 6 },
  downloadText: { color: "#fff", fontWeight: "700", marginLeft: 4 },

  loader: { alignItems: "center", marginVertical: 30 },
  loadingText: { marginTop: 8, color: "#555" },

  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginVertical: 6, elevation: 2, width: "100%", maxWidth: 900, alignSelf: "center" },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  empName: { marginLeft: 10, fontWeight: "700", color: "#333" },

  tableScroll: { width: "100%" },
  table: { marginTop: 10, borderRadius: 8, overflow: "hidden", backgroundColor: "#f9fbff" },
  tableHeader: { flexDirection: "row", backgroundColor: "#e3edff", paddingVertical: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#eef2ff" },
  col: { flex: 1, textAlign: "center", fontSize: 12, minWidth: 120 },
  fee: { color: "#0a66c2", fontWeight: "700" },
});
