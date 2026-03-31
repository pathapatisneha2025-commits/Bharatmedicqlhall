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
  SafeAreaView,
  useWindowDimensions,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 420;

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message || ""}`);
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // Loading timer
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch data whenever employee or date changes
  useEffect(() => {
    fetchData();
  }, [selectedEmployee, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let bookingsJson = [];

      if (selectedEmployee === "online") {
        const res = await fetch(`${API_BASE}/book-appointment/all`);
        bookingsJson = (await res.json()).map((b) => ({ ...b, source: "online" }));
        setEmployees({});
      } else {
        const res = await fetch(`${API_BASE}/doctorbooking/all`);
        bookingsJson = (await res.json()).map((b) => ({ ...b, source: "employee" }));

        const employeesRes = await fetch(`${API_BASE}/employee/all`);
        const employeesJson = await employeesRes.json();

        const empMap = {};
        if (employeesJson.success && employeesJson.employees) {
          employeesJson.employees.forEach((emp) => {
            empMap[emp.id] = emp.full_name;
          });
        }
        setEmployees(empMap);
      }

      setBookingData(bookingsJson || []);
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

  /* FILTER BOOKINGS */
  const filteredBookings = bookingData.filter((b) => {
    if (selectedEmployee && selectedEmployee !== "online") {
      if (String(b.employee_id) !== String(selectedEmployee)) return false;
    } else if (selectedEmployee === "online" && b.source !== "online") {
      return false;
    }
    if (selectedDate) {
      const bookingDate = b.appointment_date || b.date;
      if (!bookingDate) return false;
      if (new Date(bookingDate).toISOString().slice(0, 10) !== selectedDate) return false;
    }
    return true;
  });

  /* GROUP BOOKINGS */
  const bookingsByEmployee = filteredBookings.reduce((acc, b) => {
    let name = b.source === "online" ? "Online" : employees[b.employee_id] || `EMP-${b.employee_id}`;
    if (!acc[name]) acc[name] = [];
    acc[name].push(b);
    return acc;
  }, {});

  /* TOTAL REVENUE ALL FILTERS */
  const totalRevenue = filteredBookings.reduce(
    (sum, b) => sum + Number(b.source === "online" ? b.consultantfees || 0 : b.doctor_consultant_fee || 0),
    0
  );

  /* CSV DOWNLOAD */
  const downloadCSV = async () => {
    if (!filteredBookings.length) {
      return showAlert("No data to download");
    }

    const header = ["Employee Name", "Patient Name", "Booking Date", "Service", "Amount"];
    const rows = filteredBookings.map((b) => [
      b.source === "online" ? "Online" : employees[b.employee_id] || `EMP-${b.employee_id}`,
      b.patient_name,
      new Date(b.appointment_date || b.date).toLocaleDateString(),
      b.specialization,
      b.source === "online" ? b.consultantfees : b.doctor_consultant_fee,
    ]);

    const csvContent = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

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
      {/* HEADER */}
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.circleBack} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Staff Reports</Text>
          <Text style={styles.headerSub}>Patient booking history</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* EMPLOYEE DROPDOWN */}
        <Text style={styles.label}>Select Employee</Text>
        <View style={styles.pickerBox}>
          <Picker selectedValue={selectedEmployee} onValueChange={(itemValue) => setSelectedEmployee(itemValue)}>
            <Picker.Item label="Online" value="online" />
            {Object.entries(employees).map(([id, name]) => (
              <Picker.Item key={id} label={name} value={id} />
            ))}
          </Picker>
        </View>

        {/* DATE PICKER */}
        <Text style={styles.label}>Select Date</Text>
        {Platform.OS === "web" ? (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", marginBottom: 10 }}
          />
        ) : (
          <>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowPicker(true)}>
              <Text>{selectedDate || "Select Date"}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={selectedDate ? new Date(selectedDate) : new Date()}
                mode="date"
                display="calendar"
                onChange={(event, date) => {
                  setShowPicker(false);
                  if (date) setSelectedDate(date.toISOString().slice(0, 10));
                }}
              />
            )}
          </>
        )}

        {/* TOTAL REVENUE */}
        {filteredBookings.length > 0 && (
          <View style={styles.totalRevenueContainer}>
            <Text style={styles.totalRevenueText}>Total Revenue: ₹{totalRevenue.toLocaleString()}</Text>
          </View>
        )}

        {/* CSV BUTTON */}
        <TouchableOpacity style={styles.actionBtn} onPress={downloadCSV}>
          <Icon name="file-download" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Export CSV Report</Text>
        </TouchableOpacity>

        {/* LOADING / EMPTY / DATA */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loaderText}>Syncing records... {loadingCount}s</Text>
          </View>
        ) : Object.keys(bookingsByEmployee).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="event-note" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No bookings found.</Text>
          </View>
        ) : (
          Object.entries(bookingsByEmployee).map(([empName, empBookings]) => (
            <View key={empName} style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(empName)}>
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
                <ScrollView horizontal>
                  <View style={styles.tableContainer}>
                    <View style={styles.tHead}>
                      <Text style={[styles.tCol, { width: 100 }]}>Date</Text>
                      <Text style={[styles.tCol, { width: 140 }]}>Patient</Text>
                      <Text style={[styles.tCol, { width: 120 }]}>Service</Text>
                      <Text style={[styles.tCol, { width: 80, textAlign: "right" }]}>Fee</Text>
                    </View>
                    {empBookings.map((b, i) => (
                      <View key={i} style={styles.tRow}>
                        <Text style={[styles.tCell, { width: 100 }]}>
                          {new Date(b.appointment_date || b.date).toLocaleDateString()}
                        </Text>
                        <Text style={[styles.tCell, { width: 140, fontWeight: "600" }]}>
                          {b.source === "online" ? b.name : b.patient_name}
                        </Text>
                        <Text style={[styles.tCell, { width: 120 }]}>
                          {b.source === "online" ? b.department : b.specialization}
                        </Text>
                        <Text style={[styles.tCell, { width: 80, textAlign: "right", color: "#2563eb", fontWeight: "700" }]}>
                          ₹{b.source === "online" ? b.consultantfees : b.doctor_consultant_fee}
                        </Text>
                      </View>
                    ))}
                    {/* Employee Total Revenue */}
                    <View style={[styles.tRow, { borderBottomWidth: 0, paddingVertical: 10 }]}>
                      <Text style={[styles.tCell, { width: 360, fontWeight: "700", textAlign: "right" }]}>Total Revenue:</Text>
                      <Text style={[styles.tCell, { width: 80, textAlign: "right", color: "#16a34a", fontWeight: "800" }]}>
                        ₹{empBookings.reduce(
                          (sum, b) => sum + Number(b.source === "online" ? b.consultantfees || 0 : b.doctor_consultant_fee || 0),
                          0
                        ).toLocaleString()}
                      </Text>
                    </View>
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

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerArea: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20, gap: 15 },
  circleBack: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  headerSub: { fontSize: 13, color: "#64748b" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontWeight: "600", marginBottom: 5, marginTop: 10 },
  pickerBox: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  dateInput: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", padding: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#1e293b", paddingVertical: 12, borderRadius: 12, gap: 8, marginTop: 20 },
  actionBtnText: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, marginTop: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#2563eb", fontWeight: "700" },
  empNameText: { fontSize: 16, fontWeight: "700" },
  bookingCount: { fontSize: 12, color: "#94a3b8" },
  tableContainer: { marginTop: 15, backgroundColor: "#f8fafc", borderRadius: 12, padding: 10 },
  tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 8, marginBottom: 8 },
  tCol: { fontSize: 11, fontWeight: "700", color: "#94a3b8" },
  tRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tCell: { fontSize: 13, color: "#475569" },
  loaderContainer: { padding: 50, alignItems: "center" },
  loaderText: { marginTop: 12 },
  emptyContainer: { padding: 60, alignItems: "center" },
  emptyText: { marginTop: 12, color: "#94a3b8" },
  totalRevenueContainer: { backgroundColor: "#e0f2fe", padding: 12, borderRadius: 12, marginVertical: 10 },
  totalRevenueText: { fontSize: 14, fontWeight: "700", color: "#0369a1", textAlign: "center" }
});