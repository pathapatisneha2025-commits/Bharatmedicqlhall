import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const API_BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AdminEmployeeAttendanceRecords = () => {
  const [filterType, setFilterType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.style !== "cancel");
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

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/BreakIn-attendance/totalemployeescount`);
      const result = await res.json();
      if (result.success) setSummaryData(result.summary);
      else showAlert("Error", "Failed to fetch summary data");
    } catch (err) {
      showAlert("Error", "Unable to load summary data");
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/attendance/summary?view=${filterType}`;
      if (filterType === "monthly") url += `&month=${selectedMonth}`;
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) setAttendanceData(result.data);
      else showAlert("Error", "Failed to load data");
    } catch (err) {
      showAlert("Error", "Unable to fetch records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [filterType, selectedMonth]);

  const toggleExpand = (id) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded(expanded === id ? null : id);
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Dashboard {loadingCount}s</Text>
      </View>
    );

  return (
    <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
      {/* HEADER SECTION */}
      <View style={styles.dashboardHeader}>
        <View style={styles.headerTitleGroup}>
          <TouchableOpacity 
            onPress={() => navigation.navigate("DeptDashboard")}
            style={styles.backCircle}
          >
            <Icon name="arrow-back" size={24} color="#007bff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitleText}>Attendance Dashboard</Text>
            <Text style={styles.subTitleText}>Monitor employee daily presence and breaks</Text>
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, filterType === "weekly" && styles.activeToggle]}
              onPress={() => setFilterType("weekly")}
            >
              <Text style={[styles.toggleText, filterType === "weekly" && styles.activeToggleText]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, filterType === "monthly" && styles.activeToggle]}
              onPress={() => setFilterType("monthly")}
            >
              <Text style={[styles.toggleText, filterType === "monthly" && styles.activeToggleText]}>Monthly</Text>
            </TouchableOpacity>
          </View>

          {filterType === "monthly" && (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedMonth}
                style={styles.pickerStyle}
                onValueChange={(month) => setSelectedMonth(month)}
              >
                <Picker.Item label="January" value={1} />
                <Picker.Item label="February" value={2} />
                <Picker.Item label="March" value={3} />
                <Picker.Item label="April" value={4} />
                <Picker.Item label="May" value={5} />
                <Picker.Item label="June" value={6} />
                <Picker.Item label="July" value={7} />
                <Picker.Item label="August" value={8} />
                <Picker.Item label="September" value={9} />
                <Picker.Item label="October" value={10} />
                <Picker.Item label="November" value={11} />
                <Picker.Item label="December" value={12} />
              </Picker>
            </View>
          )}
        </View>
      </View>

      {/* KPI SUMMARY CARDS */}
      {summaryData && (
        <View style={styles.summaryGrid}>
          {[
            { label: "Total Present", val: summaryData.total_present, color: "#4caf50", bg: "#e8f5e9", icon: "person-outline" },
            { label: "Total Absent", val: summaryData.total_absent, color: "#f44336", bg: "#ffebee", icon: "person-off" },
            { label: "On Leave", val: summaryData.total_on_leave, color: "#ff9800", bg: "#fff3e0", icon: "event-busy" },
            { label: "Currently On Break", val: summaryData.employees_on_break, color: "#007bff", bg: "#e3f2fd", icon: "coffee" }
          ].map((item, i) => (
            <View key={i} style={[styles.kpiCard, { borderLeftColor: item.color }]}>
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Icon name={item.icon} size={20} color={item.color} />
              </View>
              <View>
                <Text style={styles.kpiLabel}>{item.label}</Text>
                <Text style={[styles.kpiValue, { color: item.color }]}>{item.val}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ATTENDANCE LIST / TABLE */}
      <View style={styles.listSection}>
        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.employee_id.toString()}
          scrollEnabled={false} // Since nested in ScrollView
          renderItem={({ item }) => (
            <View style={styles.employeeCard}>
              <TouchableOpacity 
                style={styles.cardHeader} 
                onPress={() => toggleExpand(item.employee_id)}
                activeOpacity={0.7}
              >
                <View style={styles.nameSection}>
                  <Icon
                    name={expanded === item.employee_id ? "keyboard-arrow-down" : "keyboard-arrow-right"}
                    size={24}
                    color="#666"
                  />
                  <Text style={styles.empNameText}>{item.employee_name}</Text>
                </View>
                <View style={styles.summaryBadge}>
                    <Text style={styles.badgeText}>View Details</Text>
                </View>
              </TouchableOpacity>

              {expanded === item.employee_id && (
                <View style={styles.tableWrapper}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={styles.tableBody}>
                      {/* Table Header */}
                      <View style={styles.tableHeadRow}>
                        <Text style={[styles.th, { width: 120 }]}>Date</Text>
                        <Text style={[styles.th, { width: 100 }]}>Check In</Text>
                        <Text style={[styles.th, { width: 100 }]}>Check Out</Text>
                        <Text style={[styles.th, { width: 100 }]}>Duration</Text>
                        <Text style={[styles.th, { width: 220 }]}>Status</Text>
                      </View>

                      {/* Table Content */}
                      {item.days.map((d, idx) => {
                        const formattedDate = d.date ? d.date.split("T")[0] : "-";
                        let displayStatus = d.status;
                        
                        if (d.status === "fullDay") displayStatus = "Absent (On Leave Fullday)";
                        else if (d.status === "firsthalf") displayStatus = "Present (Leave 1st Half)";
                        else if (d.status === "secondhalf") displayStatus = "Present (Leave 2nd Half)";
                        else if (d.status === "hourly") displayStatus = "Present (Hourly Leave)";
                        else if (d.status === "multipleDays") displayStatus = "Absent (Multi-Day Leave)";

                        let working_hours = "-";
                        if (d.check_in && d.check_out && (displayStatus.includes("Present") || displayStatus === "On Duty")) {
                            try {
                                const parseTime = (t) => {
                                    if (!t || t === "-") return null;
                                    const [time, modifier] = t.split(" ");
                                    let [hours, minutes] = time.split(":").map(Number);
                                    if (modifier === "PM" && hours !== 12) hours += 12;
                                    if (modifier === "AM" && hours === 12) hours = 0;
                                    return new Date(1970, 0, 1, hours, minutes, 0);
                                };
                                const start = parseTime(d.check_in);
                                const end = parseTime(d.check_out);
                                if (start && end && end > start) {
                                    const diffMs = end - start;
                                    working_hours = `${Math.floor(diffMs / 3600000)}h ${Math.floor((diffMs % 3600000) / 60000)}m`;
                                } else working_hours = "0h 0m";
                            } catch { working_hours = "-"; }
                        }

                        return (
                          <View key={idx} style={[styles.tdRow, idx % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                            <Text style={[styles.td, { width: 120 }]}>{formattedDate}</Text>
                            <Text style={[styles.td, { width: 100 }]}>{d.check_in || "-"}</Text>
                            <Text style={[styles.td, { width: 100 }]}>{d.check_out || "-"}</Text>
                            <Text style={[styles.td, { width: 100 }]}>{working_hours}</Text>
                            <View style={{ width: 220, paddingHorizontal: 10 }}>
                                <View style={[styles.statusPill, { 
                                    backgroundColor: displayStatus.includes("Present") ? "#e8f5e9" : "#ffebee" 
                                }]}>
                                    <Text style={[styles.statusPillText, { 
                                        color: displayStatus.includes("Present") ? "#2e7d32" : "#c62828" 
                                    }]}>
                                        {displayStatus}
                                    </Text>
                                </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#f0f2f5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontWeight: "600", color: "#666" },

  // Header Bar
  dashboardHeader: {
    backgroundColor: "#fff",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start'
  },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  backCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: "#f0f7ff", justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitleText: { fontSize: 24, fontWeight: "800", color: "#1a1a1a" },
  subTitleText: { fontSize: 14, color: "#666", marginTop: 2 },

  actionBar: { flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === 'web' ? 0 : 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#f0f2f5', borderRadius: 10, padding: 4, marginRight: 15 },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  activeToggle: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  toggleText: { fontWeight: '600', color: '#666' },
  activeToggleText: { color: '#007bff' },

  pickerWrapper: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, width: 150 },
  pickerStyle: { height: 40, width: '100%', fontSize: 14 },

  // Summary Grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, justifyContent: 'space-between' },
  kpiCard: { 
    backgroundColor: '#fff', 
    width: Platform.OS === 'web' ? '24%' : '48%', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderLeftWidth: 5,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  kpiLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  kpiValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },

  // List Section
  listSection: { paddingHorizontal: 15, paddingBottom: 40 },
  employeeCard: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 12, overflow: 'hidden', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  nameSection: { flexDirection: 'row', alignItems: 'center' },
  empNameText: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 10 },
  summaryBadge: { backgroundColor: '#e7f0ff', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#007bff', fontWeight: 'bold' },

  // Table Styles
  tableWrapper: { backgroundColor: '#fcfcfc', borderTopWidth: 1, borderTopColor: '#eee' },
  tableBody: { padding: 15 },
  tableHeadRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 8, marginBottom: 5 },
  th: { fontSize: 12, fontWeight: '800', color: '#475569', textAlign: 'center', textTransform: 'uppercase' },
  tdRow: { flexDirection: 'row', paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  evenRow: { backgroundColor: '#fff' },
  oddRow: { backgroundColor: '#f9fafb' },
  td: { fontSize: 13, color: '#334155', textAlign: 'center' },

  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'center' },
  statusPillText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
});

export default AdminEmployeeAttendanceRecords;