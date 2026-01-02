 import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

const AttendanceLogsScreen = () => {
  const [loginData, setLoginData] = useState([]);
  const [logoutData, setLogoutData] = useState([]);
  const [breakData, setBreakData] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();

  const LOGIN_API =
    "https://hospitaldatabasemanagement.onrender.com/attendance/login/all";
  const LOGOUT_API =
    "https://hospitaldatabasemanagement.onrender.com/attendance/logout/all";
  const BREAK_API =
    "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/all";

  // Fetch login + logout + break logs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loginRes, logoutRes, breakRes] = await Promise.all([
          fetch(LOGIN_API),
          fetch(LOGOUT_API),
          fetch(BREAK_API),
        ]);

        const loginJson = await loginRes.json();
        const logoutJson = await logoutRes.json();
        const breakJson = await breakRes.json();

        if (loginJson.success) setLoginData(loginJson.data || []);
        if (logoutJson.success)
          setLogoutData(logoutJson.data?.attendance?.all || []);
        if (breakJson.success) setBreakData(breakJson.data || []);
      } catch (err) {
        console.log("Fetch Error:", err);
        Alert.alert("Error", "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Merge all logs
  useEffect(() => {
    if (loginData.length === 0 && logoutData.length === 0) return;

    const getDateOnly = (ts) => {
      if (!ts) return null;
      const d = new Date(ts);
      if (isNaN(d)) return null;
      return d.toISOString().split("T")[0];
    };

    const formatTime = (ts) => {
      if (!ts) return "--";
      if (typeof ts === "string") return ts.substring(11, 19);
      return "--";
    };

    const mergedMap = {};

    // LOGIN MAP
    loginData.forEach((login) => {
      const key = `${login.employee_id}-${getDateOnly(login.timestamp)}`;
      mergedMap[key] = {
        employee_id: login.employee_id,
        login_id: login.id,
        logout_id: null,
        name: login.full_name,
        date: new Date(login.timestamp).toLocaleDateString(),
        checkInTime: formatTime(login.timestamp),
        checkInTimeFull: login.timestamp,
        login_image: login.image_url,
        logout_image: null,
        logoutTime: "--",
        status: "On Duty",
        totalHours: "--",
        breakStatus: "--",
        breakIds: [],
      };
    });

    // LOGOUT MAP
    logoutData.forEach((logout) => {
      const key = `${logout.employee_id}-${getDateOnly(logout.timestamp)}`;

      const baseDate = logout.timestamp || mergedMap[key]?.checkInTimeFull;

      if (!mergedMap[key]) {
        mergedMap[key] = {
          employee_id: logout.employee_id,
          login_id: null,
          logout_id: logout.id,
          name: `Employee ${logout.employee_id}`,
          date: new Date(baseDate).toLocaleDateString(),
          checkInTime: "--",
          checkInTimeFull: null,
          logoutTime: formatTime(logout.timestamp),
          logoutTimeFull: logout.timestamp,
          login_image: null,
          logout_image: logout.image_url,
          status: "Off Duty",
          totalHours: "--",
          breakStatus: "--",
          breakIds: [],
        };
      } else {
        mergedMap[key].logoutTime = formatTime(logout.timestamp);
        mergedMap[key].logoutTimeFull = logout.timestamp;
        mergedMap[key].logout_image = logout.image_url;
        mergedMap[key].logout_id = logout.id;
        mergedMap[key].status = "Off Duty";
        mergedMap[key].totalHours = calculateTotalHours(
          mergedMap[key].checkInTimeFull,
          logout.timestamp
        );
      }
    });

    // BREAKS MERGE
    Object.values(mergedMap).forEach((item) => {
      const baseDate = item.checkInTimeFull || item.logoutTimeFull;
      if (!baseDate) return;

      const employeeBreaks = breakData
        .filter(
          (b) =>
            b.employee_id === item.employee_id &&
            new Date(b.timestamp).toDateString() ===
              new Date(baseDate).toDateString()
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (employeeBreaks.length > 0) {
        const lastBreak = employeeBreaks[0];
        item.breakStatus =
          lastBreak.break_type === "Break In" ? "On Break" : "Returned";
        item.breakIds = employeeBreaks.map((b) => b.id);
      } else {
        item.breakStatus = "--";
        item.breakIds = [];
      }
    });

    const merged = Object.values(mergedMap).map((itm, index) => ({
      sno: index + 1,
      ...itm,
    }));

    setMergedData(merged);
    setFilteredData(merged);
  }, [loginData, logoutData, breakData]);

  // Calculating total hours
  const calculateTotalHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "--";

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (isNaN(start) || isNaN(end) || end <= start) return "--";

    const diff = end - start;
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hrs}h ${mins}m`;
  };

  // Filter logic
  useEffect(() => {
    let filtered = [...mergedData];
    if (filterDate) filtered = filtered.filter((i) => i.date === filterDate);
    if (filterStatus !== "All")
      filtered = filtered.filter((i) => i.status === filterStatus);
    setFilteredData(filtered);
  }, [filterDate, filterStatus, mergedData]);

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setFilterDate(selectedDate.toLocaleDateString());
  };

  const resetFilter = () => {
    setFilterDate(null);
    setFilterStatus("All");
    setFilteredData(mergedData);
  };

  // Modal open
  const openModal = (employee) => {
    const breakStatuses = {};
    employee.breakIds?.forEach((id) => {
      breakStatuses[id] = employee.breakStatus || "Returned";
    });

    setSelectedEmployee({ ...employee, breakStatuses });
    setModalVisible(true);
  };

  // DELETE ATTENDANCE + BREAKS
  const handleDeleteAttendance = async () => {
    if (!selectedEmployee) return;

    Alert.alert("Confirm Delete", "Delete this attendance record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            const response = await fetch(
              "https://hospitaldatabasemanagement.onrender.com/attendance/delete",
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  loginId: selectedEmployee.login_id,
                  logoutId: selectedEmployee.logout_id,
                  breakIds: selectedEmployee.breakIds,
                }),
              }
            );

            const result = await response.json();

            if (result.success) {
              setMergedData((prev) =>
                prev.filter(
                  (i) =>
                    i.login_id !== selectedEmployee.login_id &&
                    i.logout_id !== selectedEmployee.logout_id
                )
              );

              setFilteredData((prev) =>
                prev.filter(
                  (i) =>
                    i.login_id !== selectedEmployee.login_id &&
                    i.logout_id !== selectedEmployee.logout_id
                )
              );

              setModalVisible(false);
              Alert.alert("Success", "Deleted successfully");
            } else {
              Alert.alert("Error", result.message || "Delete failed");
            }
          } catch (err) {
            console.log("Delete Error:", err);
            Alert.alert("Error", "Something went wrong");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // UPDATE ATTENDANCE + BREAK STATUSES
  const handleUpdateAttendance = async () => {
    if (!selectedEmployee) return;

    Alert.alert("Confirm Update", "Update record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: async () => {
          try {
            setLoading(true);

            const response = await fetch(
              "https://hospitaldatabasemanagement.onrender.com/attendance/update",
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  loginId: selectedEmployee.login_id,
                  logoutId: selectedEmployee.logout_id,
                  checkIn: selectedEmployee.checkInTimeFull,
                  checkOut: selectedEmployee.logoutTimeFull,
                  breakUpdates: selectedEmployee.breakIds?.map((id) => ({
                    id,
                    status: selectedEmployee.breakStatuses[id],
                  })),
                }),
              }
            );

            const result = await response.json();

            if (result.success) {
              setMergedData((prev) =>
                prev.map((i) =>
                  i.login_id === selectedEmployee.login_id
                    ? { ...i, ...selectedEmployee }
                    : i
                )
              );

              setModalVisible(false);
              Alert.alert("Success", "Updated successfully");
            } else {
              Alert.alert("Error", result.message || "Update failed");
            }
          } catch (err) {
            console.log("Update error:", err);
            Alert.alert("Error", "Something went wrong");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
const exportAttendance = () => {
  const url = "https://hospitaldatabasemanagement.onrender.com/attendance/export";

  Alert.alert(
    "Export Attendance",
    "Your attendance file will download in your browser.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) },
    ]
  );
};

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Employee Attendance</Text>
      </View>

      {/* FILTERS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color="#000" />
          <Text style={{ marginLeft: 5 }}>
            {filterDate || "Pick Date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            onChange={handleDateChange}
          />
        )}

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={filterStatus}
            onValueChange={setFilterStatus}
            style={{ height: 50, width: 120 }}
          >
            <Picker.Item label="All" value="All" />
            <Picker.Item label="On Duty" value="On Duty" />
            <Picker.Item label="Off Duty" value="Off Duty" />
          </Picker>
        </View>

      
          <TouchableOpacity onPress={exportAttendance} style={{ marginLeft: "auto" }}>
    <Ionicons name="download-outline" size={26} color="#000" />
  </TouchableOpacity>
      </View>

      {/* TABLE */}
      <ScrollView horizontal>
        <View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            {[
              "S.No",
              "Name",
              "Login Img",
              "Logout Img",
              "Status",
              "Break",
              "Check-In",
              "Logout",
              "Total Hrs",
              "Date",
              "Action",
            ].map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.cell,
                  styles.headerCell,
                  { width: h === "Action" ? 80 : 105 },
                ]}
              >
                {h}
              </Text>
            ))}
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.sno.toString()}
              contentContainerStyle={{ paddingBottom: 100 }} // 👈 extra scroll space

            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.cell, { width: 50 }]}>{item.sno}</Text>
                <Text style={[styles.cell, { width: 130 }]}>{item.name}</Text>

                <View
                  style={[
                    styles.cell,
                    { width: 100, alignItems: "center" },
                  ]}
                >
                  <Image
                    source={{ uri: item.login_image }}
                    style={styles.profileImage}
                  />
                </View>

                <View
                  style={[
                    styles.cell,
                    { width: 100, alignItems: "center" },
                  ]}
                >
                  {item.logout_image ? (
                    <Image
                      source={{ uri: item.logout_image }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Text style={{ fontSize: 12, color: "#aaa" }}>
                      No Image
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.cell,
                    { width: 100 },
                    item.status === "On Duty"
                      ? { color: "green" }
                      : { color: "red" },
                  ]}
                >
                  {item.status}
                </Text>

                <Text
                  style={[
                    styles.cell,
                    { width: 100 },
                    item.breakStatus === "On Break"
                      ? { color: "orange" }
                      : { color: "green" },
                  ]}
                >
                  {item.breakStatus}
                </Text>

                <Text style={[styles.cell, { width: 120 }]}>
                  {item.checkInTime}
                </Text>

                <Text style={[styles.cell, { width: 120 }]}>
                  {item.logoutTime}
                </Text>

                <Text style={[styles.cell, { width: 120 }]}>
                  {item.totalHours}
                </Text>

                <Text style={[styles.cell, { width: 100 }]}>
                  {item.date}
                </Text>

                <TouchableOpacity
                  style={[styles.cell, { width: 80, alignItems: "center" }]}
                  onPress={() => openModal(item)}
                >
                  <Ionicons
                    name="eye-outline"
                    size={22}
                    color="#007bff"
                  />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedEmployee && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedEmployee.name}
                </Text>

                <View style={styles.modalRow}>
                  <Image
                    source={{ uri: selectedEmployee.login_image }}
                    style={styles.modalImage}
                  />
                  {selectedEmployee.logout_image ? (
                    <Image
                      source={{ uri: selectedEmployee.logout_image }}
                      style={styles.modalImage}
                    />
                  ) : (
                    <Text>No Logout Image</Text>
                  )}
                </View>

                <Text style={styles.modalText}>
                  Status:{" "}
                  <Text
                    style={{
                      color:
                        selectedEmployee.status === "On Duty"
                          ? "green"
                          : "red",
                    }}
                  >
                    {selectedEmployee.status}
                  </Text>
                </Text>

                <Text style={styles.modalText}>Break Status:</Text>
                {selectedEmployee.breakIds?.map((bId, idx) => (
                  <View
                    key={bId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text>Break {idx + 1}</Text>

                    <Picker
                      selectedValue={
                        selectedEmployee.breakStatuses[bId] || "Returned"
                      }
                      style={{ width: 120, height: 40 }}
                      onValueChange={(val) =>
                        setSelectedEmployee((prev) => ({
                          ...prev,
                          breakStatuses: {
                            ...prev.breakStatuses,
                            [bId]: val,
                          },
                        }))
                      }
                    >
                      <Picker.Item label="On Break" value="On Break" />
                      <Picker.Item label="Returned" value="Returned" />
                    </Picker>
                  </View>
                ))}

                <Text style={styles.modalText}>
                  Check-In: {selectedEmployee.checkInTime || "--"}
                </Text>
                <Text style={styles.modalText}>
                  Logout: {selectedEmployee.logoutTime || "--"}
                </Text>
                <Text style={styles.modalText}>
                  Total Hours: {selectedEmployee.totalHours || "--"}
                </Text>
                <Text style={styles.modalText}>
                  Date: {selectedEmployee.date}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "#6c757d" }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "orange" }]}
                    onPress={handleUpdateAttendance}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "red" }]}
                    onPress={handleDeleteAttendance}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttendanceLogsScreen;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8", padding: 10, marginTop: 30 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  filterBtn: { flexDirection: "row", borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 8, alignItems: "center", backgroundColor: "#fff" },
  pickerWrapper: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, justifyContent: "center", marginLeft: 10, backgroundColor: "#fff" },
  
  tableHeader: { backgroundColor: "#e0e0e0" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", backgroundColor: "#fff" },
  cell: { padding: 8, borderRightWidth: 1, borderRightColor: "#ddd", fontSize: 13, textAlignVertical: "center" },
  headerCell: { fontWeight: "bold", fontSize: 14 },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: "85%", borderRadius: 10, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalRow: { flexDirection: "row", justifyContent: "center", gap: 15, marginBottom: 15 },
  modalImage: { width: 80, height: 80, borderRadius: 40 },
  modalText: { fontSize: 14, marginBottom: 4 },
  closeBtn: { backgroundColor: "#007bff", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 6 },
  closeBtnText: { color: "#fff", fontWeight: "bold" },
});
