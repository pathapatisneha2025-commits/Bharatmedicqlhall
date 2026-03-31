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
   SafeAreaView ,
   useWindowDimensions,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
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
            const [loadingCount, setLoadingCount] = useState(0);
  
  const [filter, setFilter] = useState("Daily"); // Daily / Weekly / Monthly
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
  if (!filteredBookings.length) return showAlert("No data to download");

  const header = ["Employee Name","Patient Name","Booking Date","Service","Amount"];
  const rows = filteredBookings.map(b => [
    employees[b.employee_id] || `EMP-${b.employee_id}`,
    b.patient_name,
    new Date(b.appointment_date).toLocaleDateString(),
    b.specialization,
    b.doctor_consultant_fee,
  ]);

  const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n");

  if (Platform.OS === "web") {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee_bookings.csv";
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const fileUri = `${FileSystem.documentDirectory}employee_bookings.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv" });
  }
};


 return (
    <SafeAreaView style={styles.container}>
      {/* HEADER AREA */}
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.circleBack} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Staff Reports</Text>
          <Text style={styles.headerSub}>Patient booking history</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SEGMENTED FILTERS */}
        <View style={styles.tabContainer}>
          {["Daily", "Weekly", "Monthly"].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, filter === f && styles.activeTab]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.tabText, filter === f && styles.activeTabText]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIONS */}
        <TouchableOpacity style={styles.actionBtn} onPress={downloadCSV}>
          <Icon name="file-download" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Export CSV Report</Text>
        </TouchableOpacity>

        {/* LOADING STATE */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loaderText}>Syncing records... {loadingCount}s</Text>
          </View>
        ) : Object.keys(bookingsByEmployee).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="event-note" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No bookings found for this period.</Text>
          </View>
        ) : (
          Object.entries(bookingsByEmployee).map(([empName, empBookings]) => (
            <View key={empName} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(empName)}
                activeOpacity={0.7}
              >
                <View style={styles.empTitleRow}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{empName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.empNameText}>{empName}</Text>
                    <Text style={styles.bookingCount}>{empBookings.length} bookings</Text>
                  </View>
                </View>
                <Icon
                  name={expanded === empName ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={24}
                  color="#94a3b8"
                />
              </TouchableOpacity>

              {expanded === empName && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableContainer}>
                    <View style={styles.tHead}>
                      <Text style={[styles.tCol, { width: 100 }]}>Date</Text>
                      <Text style={[styles.tCol, { width: 140 }]}>Patient</Text>
                      <Text style={[styles.tCol, { width: 120 }]}>Service</Text>
                      <Text style={[styles.tCol, { width: 80, textAlign: 'right' }]}>Fee</Text>
                    </View>
                    {empBookings.map((b, i) => (
                      <View key={i} style={styles.tRow}>
                        <Text style={[styles.tCell, { width: 100 }]}>{new Date(b.appointment_date).toLocaleDateString()}</Text>
                        <Text style={[styles.tCell, { width: 140, fontWeight: '600' }]}>{b.patient_name}</Text>
                        <Text style={[styles.tCell, { width: 120 }]}>{b.specialization}</Text>
                        <Text style={[styles.tCell, { width: 80, textAlign: 'right', color: '#2563eb', fontWeight: '700' }]}>₹{b.doctor_consultant_fee}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: 20,
    gap: 15,
  },
  circleBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  headerSub: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: "#fff", elevation: 2 },
  tabText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  activeTabText: { color: "#1e293b", fontWeight: "700" },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eff6ff", justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: "#2563eb", fontWeight: '700', fontSize: 16 },
  empNameText: { fontSize: 16, fontWeight: "700", color: "#334155" },
  bookingCount: { fontSize: 12, color: "#94a3b8", marginTop: 2 },

  tableContainer: { marginTop: 15, backgroundColor: "#f8fafc", borderRadius: 12, padding: 10 },
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 8, marginBottom: 8 },
  tCol: { fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: 'uppercase', letterSpacing: 0.5 },
  tRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tCell: { fontSize: 13, color: "#475569" },

  loaderContainer: { padding: 50, alignItems: "center" },
  loaderText: { marginTop: 12, color: "#64748b", fontSize: 14 },
  emptyContainer: { padding: 60, alignItems: "center" },
  emptyText: { marginTop: 12, color: "#94a3b8", fontSize: 14, textAlign: 'center' },
});