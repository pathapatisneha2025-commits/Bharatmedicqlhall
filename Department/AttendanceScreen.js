import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const AttendanceScreen = () => {
  const [loginData, setLoginData] = useState([]);
  const [logoutData, setLogoutData] = useState([]);
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

  // ✅ Fetch login & logout data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loginRes, logoutRes] = await Promise.all([
          fetch(LOGIN_API),
          fetch(LOGOUT_API),
        ]);

        const loginJson = await loginRes.json();
        const logoutJson = await logoutRes.json();

        if (loginJson.success) setLoginData(loginJson.data || []);
        if (logoutJson.success)
          setLogoutData(logoutJson.data?.attendance?.all || []);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch attendance data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Merge login & logout data with IDs
  useEffect(() => {
    if (loginData.length === 0 && logoutData.length === 0) return;

    const getDateOnly = (ts) => new Date(ts).toISOString().split("T")[0];
    const formatTime = (timestamp) => {
      if (!timestamp) return "--";
      return timestamp.substring(11, 19);
    };

    const mergedMap = {};

    // Step 1: Add login entries
    loginData.forEach((login) => {
      const key = `${login.employee_id}-${getDateOnly(login.timestamp)}`;
      mergedMap[key] = {
        employee_id: login.employee_id,
        login_id: login.id, // ✅ Added
        logout_id: null, // ✅ Added
        name: login.full_name,
        date: new Date(login.timestamp).toLocaleDateString(),
        checkInTime: formatTime(login.timestamp),
        checkInTimeFull: login.timestamp,
        login_image: login.image_url,
        logout_image: null,
        logoutTime: "--",
        status: "On Duty",
        totalHours: "--",
      };
    });

    // Step 2: Merge logout data
    logoutData.forEach((logout) => {
      const key = `${logout.employee_id}-${getDateOnly(logout.timestamp)}`;

      if (mergedMap[key]) {
        mergedMap[key].logoutTime = formatTime(logout.timestamp);
        mergedMap[key].logout_image = logout.image_url;
        mergedMap[key].status = "Off Duty";
        mergedMap[key].logout_id = logout.id; // ✅ Added
        mergedMap[key].totalHours = calculateTotalHours(
          mergedMap[key].checkInTimeFull,
          logout.timestamp
        );
      } else {
        mergedMap[key] = {
          employee_id: logout.employee_id,
          login_id: null, // ✅ Added
          logout_id: logout.id, // ✅ Added
          name: `Employee ${logout.employee_id}`,
          date: new Date(logout.timestamp).toLocaleDateString(),
          checkInTime: "--",
          logoutTime: formatTime(logout.timestamp),
          login_image: null,
          logout_image: logout.image_url,
          status: "Off Duty",
          totalHours: "--",
        };
      }
    });

    const merged = Object.values(mergedMap).map((item, index) => ({
      sno: index + 1,
      ...item,
    }));

    setMergedData(merged);
    setFilteredData(merged);
  }, [loginData, logoutData]);

  // ✅ Calculate total hours
  const calculateTotalHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "--";
    const diff = new Date(checkOut) - new Date(checkIn);
    if (isNaN(diff) || diff <= 0) return "--";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // ✅ Apply filters
  useEffect(() => {
    let filtered = [...mergedData];
    if (filterDate) filtered = filtered.filter((i) => i.date === filterDate);
    if (filterStatus !== "All")
      filtered = filtered.filter((i) => i.status === filterStatus);
    setFilteredData(filtered);
  }, [filterDate, filterStatus, mergedData]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setFilterDate(selectedDate.toLocaleDateString());
  };

  const resetFilter = () => {
    setFilterDate(null);
    setFilterStatus("All");
    setFilteredData(mergedData);
  };

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  // ✅ Delete attendance record based on login_id and logout_id
  // ✅ Delete attendance record using your /delete API that accepts JSON body
const handleDeleteAttendance = async () => {
  if (!selectedEmployee) return;

  Alert.alert(
    "Confirm Delete",
    "Delete this attendance record?",
    [
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
                }),
              }
            );

            const result = await response.json();

            if (result.success) {
              Alert.alert("Success", "Attendance deleted successfully");

              // ✅ Remove from local state
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
            } else {
              Alert.alert("Error", result.message || "Failed to delete record");
            }
          } catch (err) {
            console.error("Delete error:", err);
            Alert.alert("Error", "Something went wrong while deleting");
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};
const handleUpdateAttendance = async () => {
  if (!selectedEmployee) return;

  Alert.alert(
    "Confirm Update",
    "Update this attendance record?",
    [
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
                  status: selectedEmployee.status,
                  checkIn: selectedEmployee.checkInTimeFull,
                  checkOut: selectedEmployee.logoutTimeFull,
                }),
              }
            );

            const result = await response.json();

            if (result.success) {
              Alert.alert("Success", "Attendance updated successfully");

              // Update local merged data
              setMergedData((prev) =>
                prev.map((item) =>
                  item.login_id === selectedEmployee.login_id
                    ? { ...item, ...selectedEmployee }
                    : item
                )
              );
              setModalVisible(false);
            } else {
              Alert.alert("Error", result.message || "Failed to update record");
            }
          } catch (err) {
            console.error("Update error:", err);
            Alert.alert("Error", "Something went wrong while updating");
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};


  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading attendance...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Employee Attendance</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color="#000" />
          <Text style={{ marginLeft: 5 }}>{filterDate || "Pick Date"}</Text>
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
            style={{ height: 40, width: 120 }}
          >
            <Picker.Item label="All" value="All" />
            <Picker.Item label="On Duty" value="On Duty" />
            <Picker.Item label="Off Duty" value="Off Duty" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal>
        <View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            {[
              "S.No",
              "Name",
              "Login Img",
              "Logout Img",
              "Status",
              "Check-In",
              "Logout",
              "Total Hrs",
              "Date",
              "Action",
            ].map((header, idx) => (
              <Text
                key={idx}
                style={[
                  styles.cell,
                  styles.headerCell,
                  { width: header === "Action" ? 80 : 100 },
                ]}
              >
                {header}
              </Text>
            ))}
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.sno.toString()}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.cell, { width: 50 }]}>{item.sno}</Text>
                <Text style={[styles.cell, { width: 120 }]}>{item.name}</Text>

                <View
                  style={[styles.cell, { width: 100, alignItems: "center" }]}
                >
                  <Image
                    source={{ uri: item.login_image }}
                    style={styles.profileImage}
                  />
                </View>

                <View
                  style={[styles.cell, { width: 100, alignItems: "center" }]}
                >
                  {item.logout_image ? (
                    <Image
                      source={{ uri: item.logout_image }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Text style={{ fontSize: 12, color: "#999" }}>No Image</Text>
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

                <Text style={[styles.cell, { width: 120 }]}>
                  {item.checkInTime}
                </Text>
                <Text style={[styles.cell, { width: 120 }]}>
                  {item.logoutTime}
                </Text>
                <Text style={[styles.cell, { width: 120 }]}>
                  {item.totalHours}
                </Text>
                <Text style={[styles.cell, { width: 100 }]}>{item.date}</Text>

                <TouchableOpacity
                  style={[styles.cell, { width: 80, alignItems: "center" }]}
                  onPress={() => openModal(item)}
                >
                  <Ionicons name="eye-outline" size={22} color="#007bff" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedEmployee && (
              <>
                <Text style={styles.modalTitle}>{selectedEmployee.name}</Text>

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
                <Text style={styles.modalText}>
                  Check-In: {selectedEmployee.checkInTime}
                </Text>
                <Text style={styles.modalText}>
                  Logout: {selectedEmployee.logoutTime}
                </Text>
                <Text style={styles.modalText}>
                  Total Hours: {selectedEmployee.totalHours}
                </Text>
                <Text style={styles.modalText}>
                  Date: {selectedEmployee.date}
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "#6c757d" }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
<TouchableOpacity
    style={[styles.closeBtn, { backgroundColor: "orange" }]}
    onPress={() => handleUpdateAttendance()}
  >
    <Text style={styles.closeBtnText}>Update</Text>
  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "red" }]}
                    onPress={handleDeleteAttendance}
                  >
                    <Text style={styles.closeBtnText}>Delete</Text>
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

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8", padding: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  filterBtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    marginLeft: 10,
    backgroundColor: "#fff",
  },
  resetBtn: {
    flexDirection: "row",
    backgroundColor: "#6c757d",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 10,
  },
  resetText: { color: "#fff", marginLeft: 5, fontWeight: "600" },
  tableHeader: { backgroundColor: "#e0e0e0" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  cell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    fontSize: 13,
    textAlignVertical: "center",
  },
  headerCell: { fontWeight: "bold", fontSize: 14 },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 15,
  },
  modalImage: { width: 80, height: 80, borderRadius: 40 },
  modalText: { fontSize: 14, marginBottom: 4 },
  closeBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  closeBtnText: { color: "#fff", fontWeight: "bold" },
});
