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
  const [filterType, setFilterType] = useState("monthly"); // weekly or monthly
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
const navigation = useNavigation();

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/BreakIn-attendance/totalemployeescount`);
      const result = await res.json();
      if (result.success) setSummaryData(result.summary);
      else Alert.alert("Error", "Failed to fetch summary data");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to load summary data");
    }
  };

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/attendance/summary?view=${filterType}`;
      if (filterType === "monthly") {
        url += `&month=${selectedMonth}`;
      }
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) setAttendanceData(result.data);
      else Alert.alert("Error", "Failed to load data");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to fetch records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Refetch attendance when filter type or month changes
  useEffect(() => {
    fetchAttendance();
  }, [filterType, selectedMonth]);

  const toggleExpand = (id) => {
    LayoutAnimation.easeInEaseOut();
    setExpanded(expanded === id ? null : id);
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading employee...</Text>
      </View>
    );
  }
  return (
    <ScrollView style={{ flex: 1, padding: 10, backgroundColor: "#fff" }}>
      <View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.navigate("AdminDashboard")}>
    <Icon name="arrow-back" size={26} color="#000" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>📋 Attendance Records</Text>
</View>


      {/* Summary */}
      {summaryData ? (
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: "#e3f2fd" }]}>
            <Text style={styles.summaryLabel}>Present</Text>
            <Text style={styles.summaryValue}>{summaryData.total_present}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#ffebee" }]}>
            <Text style={[styles.summaryLabel, { color: "#c62828" }]}>Absent</Text>
            <Text style={[styles.summaryValue, { color: "#c62828" }]}>
              {summaryData.total_absent}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#fff8e1" }]}>
            <Text style={[styles.summaryLabel, { color: "#f57c00" }]}>On Leave</Text>
            <Text style={[styles.summaryValue, { color: "#f57c00" }]}>
              {summaryData.total_on_leave}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#e8f5e9" }]}>
            <Text style={[styles.summaryLabel, { color: "#2e7d32" }]}>On Break</Text>
            <Text style={[styles.summaryValue, { color: "#2e7d32" }]}>
              {summaryData.employees_on_break}
            </Text>
          </View>
        </View>
      ) : (
        <ActivityIndicator size="small" color="#000" />
      )}

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === "weekly" && styles.activeFilter]}
          onPress={() => setFilterType("weekly")}
        >
          <Text style={[styles.filterText, filterType === "weekly" && styles.activeText]}>
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === "monthly" && styles.activeFilter]}
          onPress={() => setFilterType("monthly")}
        >
          <Text style={[styles.filterText, filterType === "monthly" && styles.activeText]}>
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Picker (only for monthly filter) */}
      {filterType === "monthly" && (
        <View style={styles.monthPickerContainer}>
          <Text style={{ fontWeight: "bold", marginRight: 10 }}>Select Month:</Text>
         <Picker
  selectedValue={selectedMonth}
  style={{
    flex: 1,
    height: Platform.OS === "android" ? 50 : undefined,
    color: "#000",
    backgroundColor: "#fff",
  }}
  dropdownIconColor="#000"
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

      {/* Attendance Records */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.employee_id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <TouchableOpacity onPress={() => toggleExpand(item.employee_id)}>
                  <Icon
                    name={expanded === item.employee_id ? "expand-more" : "chevron-right"}
                    size={22}
                    color="#000"
                  />
                </TouchableOpacity>
                <Text style={styles.empName}>{item.employee_name}</Text>
                <TouchableOpacity style={styles.summaryBtn}>
                  <Text style={styles.summaryText}>Summarise</Text>
                </TouchableOpacity>
              </View>

              {expanded === item.employee_id && (
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={styles.colDate}>Date</Text>
                    <Text style={styles.colTime}>Check In</Text>
                    <Text style={styles.colTime}>Check Out</Text>
                    <Text style={styles.colTime}>Duration</Text>
                    <Text style={styles.colTime}>Status</Text>
                  </View>

                  {/* Table Rows */}
                 {item.days.map((d, idx) => {
  const formattedDate = d.date ? d.date.split("T")[0] : "-";

  const rawStatus = d.status;

  // 🔥 NEW STATUS MAPPING
  let displayStatus = rawStatus;
  let attendanceCategory = rawStatus;

  if (rawStatus === "fullDay") {
    displayStatus = "Absent(On Leave Fullday)";
    attendanceCategory = "Absent";
  } else if (rawStatus === "firsthalf") {
    displayStatus = "Present (On Leave First Half)";
    attendanceCategory = "Present";
  } else if (rawStatus === "secondhalf") {
    displayStatus = "Present (On Leave Second Half)";
    attendanceCategory = "Present";
  } else if (rawStatus === "hourly") {
    displayStatus = "Present (Hourly Leave)";
    attendanceCategory = "Present";
  } else if (rawStatus === "multipleDays") {
    displayStatus = "Absent (Multiple Days Leave)";
    attendanceCategory = "Absent";
  } else if (rawStatus === "Present" || rawStatus === "On Duty") {
    displayStatus = "Present";
    attendanceCategory = "Present";
  } else if (rawStatus === "Absent") {
    displayStatus = "Absent";
    attendanceCategory = "Absent";
  }

                    // Working hours calculation
                    let working_hours = "-";
                    if (d.check_in && d.check_out && displayStatus === "Present") {
                      try {
                        const parseTime = (timeStr) => {
                          if (!timeStr || timeStr === "-") return null;
                          const [time, modifier] = timeStr.split(" ");
                          let [hours, minutes] = time.split(":").map(Number);
                          if (modifier === "PM" && hours !== 12) hours += 12;
                          if (modifier === "AM" && hours === 12) hours = 0;
                          return new Date(1970, 0, 1, hours, minutes, 0);
                        };

                        const start = parseTime(d.check_in);
                        const end = parseTime(d.check_out);

                        if (start && end && end > start) {
                          const diffMs = end - start;
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          working_hours = `${hours}h ${minutes}m`;
                        } else {
                          working_hours = "0h 0m";
                        }
                      } catch {
                        working_hours = "-";
                      }
                    }

                    return (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={styles.colDate}>{formattedDate}</Text>
                        <Text style={styles.colTime}>{d.check_in || "-"}</Text>
                        <Text style={styles.colTime}>{d.check_out || "-"}</Text>
                        <Text style={styles.colTime}>{working_hours}</Text>
                        <Text
                          style={[
                            styles.colTime,
                            displayStatus === "Present"
                              ? styles.present
                              : displayStatus === "Absent"
                              ? styles.absent
                              : styles.leave,
                          ]}
                        >
                          {displayStatus}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        />
      )}
    </ScrollView>
  );
};

export default AdminEmployeeAttendanceRecords;

const styles = StyleSheet.create({
 header: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 10,
  paddingVertical: 6,
},
headerTitle: {
  fontSize: 20,
  fontWeight: "bold",
  marginLeft: 10,
  color: "#000",
},


  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
  },
  summaryLabel: { fontSize: 13, fontWeight: "bold", color: "#333" },
  summaryValue: { fontSize: 20, fontWeight: "bold", marginTop: 4 },

  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#ccc",
    marginHorizontal: 5,
  },
  activeFilter: { backgroundColor: "#000", borderColor: "#000" },
  filterText: { color: "#000", fontWeight: "600" },
  activeText: { color: "#fff" },

monthPickerContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
  paddingHorizontal: 10,
  paddingVertical: 5,
  backgroundColor: "#f9f9f9",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#ccc",
  overflow: "hidden",
},

  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  empName: { flex: 1, marginLeft: 10, fontWeight: "bold", color: "#000" },
  summaryBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  summaryText: { color: "#fff", fontWeight: "bold" },

  tableContainer: { marginTop: 10, backgroundColor: "#fff", borderRadius: 6 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eaeaea",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  colDate: { flex: 1.2, textAlign: "center", fontSize: 12 },
  colTime: { flex: 1, textAlign: "center", fontSize: 12 },
  present: { color: "#4caf50", fontWeight: "bold" },
  absent: { color: "#f44336", fontWeight: "bold" },
  leave: { color: "#ff9800", fontWeight: "bold" },
});
