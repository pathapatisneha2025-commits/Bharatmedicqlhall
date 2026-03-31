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
  Platform,
  StatusBar,
    useWindowDimensions,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
    const [loadingCount, setLoadingCount] = useState(0);
  
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


    const { width: SCREEN_WIDTH } = useWindowDimensions();
      const MAX_WIDTH = 420;
      const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
        const isWeb = Platform.OS === "web";
      
    const getUnifiedId = (row) => row.employee_id ?? row.phone;

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
       showAlert ("Error", "Failed to fetch data");
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
  return new Date(ts).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
};

 // For login (UTC → IST)
const formatLoginTime = (ts) => {
  if (!ts) return "--";

  const date = new Date(ts); // UTC time from API
  // Convert to IST manually by adding 5:30
  const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
  const localMinutes = date.getUTCMinutes() + istOffset;
  const localHours = date.getUTCHours() + Math.floor(localMinutes / 60);
  const minutes = localMinutes % 60;
  const hours12 = localHours % 12 || 12;
  const ampm = localHours >= 12 ? "PM" : "AM";

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

// For logout (already IST, just extract HH:MM)
const formatLogoutTime = (ts) => {
  if (!ts) return "--";

  const date = new Date(ts.replace("Z", "")); // Remove Z to treat as local
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hours12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};




    const mergedMap = {};

    // LOGIN MAP
    loginData.forEach((login) => {
const uniqueId = getUnifiedId(login);
const key = `${uniqueId}-${getDateOnly(login.timestamp)}`;

      mergedMap[key] = {
        employee_id: login.employee_id,
        login_id: login.id,
        logout_id: null,
          phone: login.phone || null,

  name: login.full_name || `Employee (${login.phone})`,
        date: new Date(login.timestamp).toLocaleDateString(),
        checkInTime: formatLoginTime(login.timestamp),
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
const uniqueId = getUnifiedId(logout);
const key = `${uniqueId}-${getDateOnly(logout.timestamp)}`;

      const baseDate = logout.timestamp || mergedMap[key]?.checkInTimeFull;

      if (!mergedMap[key]) {
        mergedMap[key] = {
          employee_id: logout.employee_id,
          login_id: null,
          logout_id: logout.id,
name: logout.full_name || `Employee (${logout.employee_id})`,
          date: new Date(baseDate).toLocaleDateString(),
          checkInTime: "--",
          checkInTimeFull: null,
          logoutTime: logout.timestamp,
          logoutTimeFull: logout.timestamp,
          login_image: null,
          logout_image: logout.image_url,
          status: "Off Duty",
    totalHours: logout.daily_hours || "--", // ✅ Use API daily_hours if available
          breakStatus: "--",
          breakIds: [],
        };
      } else {
       mergedMap[key].logoutTime =formatLogoutTime(logout.timestamp); // ✅ Only time
mergedMap[key].logoutTimeFull = logout.timestamp; // Keep full timestamp for calculations

        mergedMap[key].logout_image = logout.image_url;
        mergedMap[key].logout_id = logout.id;
        mergedMap[key].status = "Off Duty";
        if (logout.session_hours?.hours || logout.session_hours?.minutes) {
    const h = logout.session_hours.hours || 0;
    const m = logout.session_hours.minutes || 0;
    mergedMap[key].totalHours = `${h}h ${m}m`;
    mergedMap[key].sessionHours = logout.session_hours;
  } else {
    mergedMap[key].totalHours = calculateTotalHours(
      mergedMap[key].checkInTimeFull,
      logout.timestamp
    );
  }

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

    showAlert ("Confirm Delete", "Delete this attendance record?", [
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
              showAlert ("Success", "Deleted successfully");
            } else {
              showAlert ("Error", result.message || "Delete failed");
            }
          } catch (err) {
            console.log("Delete Error:", err);
            showAlert ("Error", "Something went wrong");
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

   showAlert ("Confirm Update", "Update record?", [
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
              showAlert ("Success", "Updated successfully");
            } else {
              showAlert ("Error", result.message || "Update failed");
            }
          } catch (err) {
            console.log("Update error:", err);
            showAlert ("Error", "Something went wrong");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
const exportAttendance = () => {
  const url = "https://hospitaldatabasemanagement.onrender.com/attendance/export";

  showAlert (
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Verifying location{loadingCount}s</Text>
      </View>
    );

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="dark-content" />

      

      {/* RIGHT CONTENT AREA */}
      <View style={styles.contentArea}>
        <View style={styles.headerTitleContainer}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
             <View>
                <Text style={styles.pageTitle}>Employee Attendance Logs</Text>
                <Text style={styles.pageSubTitle}>Monitor daily check-ins and break timings</Text>
             </View>
             <TouchableOpacity style={styles.exportBtn} onPress={exportAttendance}>
                <Feather name="download" size={18} color="#fff" />
                <Text style={styles.exportBtnText}>Export CSV</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* FILTERS */}
        <View style={styles.filterCard}>
          <TouchableOpacity style={styles.dateFilter} onPress={() => setShowDatePicker(true)}>
            <Feather name="calendar" size={18} color="#2563EB" />
            <Text style={styles.filterLabel}>{filterDate || "All Dates"}</Text>
          </TouchableOpacity>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={filterStatus}
              onValueChange={setFilterStatus}
              style={{ height: 40, width: 140, border: 'none' }}
            >
              <Picker.Item label="All Status" value="All" />
              <Picker.Item label="On Duty" value="On Duty" />
              <Picker.Item label="Off Duty" value="Off Duty" />
            </Picker>
          </View>
          
          <TouchableOpacity onPress={() => {setFilterDate(null); setFilterStatus("All")}} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

       {showDatePicker && Platform.OS !== "web" && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    onChange={handleDateChange}
  />
)}

        {/* LOGS TABLE */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.hCell, { width: 50 }]}>#</Text>
                <Text style={[styles.hCell, { width: 150 }]}>Employee Name</Text>
                <Text style={[styles.hCell, { width: 100 }]}>Verification</Text>
                <Text style={[styles.hCell, { width: 110 }]}>Status</Text>
                <Text style={[styles.hCell, { width: 110 }]}>Break</Text>
                <Text style={[styles.hCell, { width: 110 }]}>Check-In</Text>
                <Text style={[styles.hCell, { width: 110 }]}>Check-Out</Text>
                <Text style={[styles.hCell, { width: 100 }]}>Total</Text>
                <Text style={[styles.hCell, { width: 60 }]}>View</Text>
              </View>

              <FlatList
                data={filteredData}
                keyExtractor={(item) => item.sno.toString()}
                renderItem={({ item }) => (
                  <View style={styles.tableDataRow}>
                    <Text style={[styles.dCell, { width: 50, color: '#94a3b8' }]}>{item.sno}</Text>
                    <Text style={[styles.dCell, { width: 150, fontWeight: '700' }]}>{item.name}</Text>
                    <View style={[styles.dCell, { width: 100, flexDirection: 'row' }]}>
                       <Image source={{ uri: item.login_image }} style={styles.miniImg} />
                       {item.logout_image && <Image source={{ uri: item.logout_image }} style={[styles.miniImg, {marginLeft: -10}]} />}
                    </View>
                    <View style={[{ width: 110, paddingLeft: 10 }]}>
                        <View style={[styles.statusPill, {backgroundColor: item.status === 'On Duty' ? '#ecfdf5' : '#fff1f2'}]}>
                           <Text style={[styles.pillText, {color: item.status === 'On Duty' ? '#059669' : '#ef4444'}]}>{item.status}</Text>
                        </View>
                    </View>
                    <View style={[{ width: 110, paddingLeft: 10 }]}>
                        <View style={[styles.statusPill, {backgroundColor: item.breakStatus === 'On Break' ? '#fffbeb' : '#f1f5f9'}]}>
                           <Text style={[styles.pillText, {color: item.breakStatus === 'On Break' ? '#d97706' : '#64748b'}]}>{item.breakStatus}</Text>
                        </View>
                    </View>
                    <Text style={[styles.dCell, { width: 110 }]}>{item.checkInTime}</Text>
                    <Text style={[styles.dCell, { width: 110 }]}>{item.logoutTime}</Text>
                    <Text style={[styles.dCell, { width: 100, fontWeight: '600' }]}>{item.totalHours}</Text>
                    <TouchableOpacity style={[styles.dCell, { width: 60 }]} onPress={() => openModal(item)}>
                       <Feather name="eye" size={18} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* MODAL PRESERVED */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedEmployee && (
              <>
                <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>Record Details</Text>
                   <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#64748b"/></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                  <Text style={styles.detailName}>{selectedEmployee.name}</Text>
                  <Text style={styles.detailDate}>{selectedEmployee.date}</Text>
                  
                  <View style={styles.modalImgRow}>
                    <View>
                       <Text style={styles.imgLabel}>Check-In Image</Text>
                       <Image source={{ uri: selectedEmployee.login_image }} style={styles.modalImage} />
                    </View>
                    <View>
                       <Text style={styles.imgLabel}>Check-Out Image</Text>
                       {selectedEmployee.logout_image ? (
                        <Image source={{ uri: selectedEmployee.logout_image }} style={styles.modalImage} />
                       ) : (
                        <View style={[styles.modalImage, styles.emptyImg]}><Text>N/A</Text></View>
                       )}
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateAttendance}>
                      <Text style={styles.btnText}>Update Record</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAttendance}>
                      <Text style={styles.btnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#E2E8F0', padding: 24 },
  brandContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandLogo: { width: 40, height: 40, backgroundColor: '#2563EB', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandLetter: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  brandName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  brandPortal: { fontSize: 12, color: '#64748B' },
  navGroup: { flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  navItemActive: { backgroundColor: '#2563EB' },
  navText: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#64748B' },
  navTextActive: { color: '#fff' },
  logoutSection: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  logoutText: { marginLeft: 12, fontWeight: '700', color: '#EF4444' },

  contentArea: { flex: 1, padding: 32 },
  headerTitleContainer: { marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#1E293B' },
  pageSubTitle: { fontSize: 15, color: '#64748B', marginTop: 4 },
  exportBtn: { flexDirection: 'row', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  exportBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },

  filterCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 20, alignItems: 'center', gap: 12, borderWeight: 1, borderColor: '#e2e8f0' },
  dateFilter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 10, borderRadius: 10 },
  filterLabel: { marginLeft: 8, color: '#2563EB', fontWeight: '600' },
  pickerWrapper: { backgroundColor: '#f8fafc', borderRadius: 10, overflow: 'hidden' },
  resetBtn: { padding: 10 },
  resetBtnText: { color: '#64748B', fontWeight: '600' },

  tableCard: { backgroundColor: '#fff', borderRadius: 20, padding: 10, flex: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, borderWeight: 1, borderColor: '#e2e8f0' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  hCell: { fontWeight: '800', color: '#64748B', fontSize: 13, paddingHorizontal: 10 },
  tableDataRow: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc', alignItems: 'center' },
  dCell: { fontSize: 14, color: '#334155', paddingHorizontal: 10 },
  miniImg: { width: 32, height: 32, borderRadius: 16, borderWeight: 2, borderColor: '#fff', backgroundColor: '#e2e8f0' },
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '800' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#2563EB', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', maxWidth: 500, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  detailName: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  detailDate: { color: '#64748b', marginBottom: 20 },
  modalImgRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  imgLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 8 },
  modalImage: { width: 210, height: 150, borderRadius: 12 },
  emptyImg: { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  updateBtn: { flex: 2, backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center' },
  deleteBtn: { flex: 1, backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: '700', color: '#fff' }
});

export default AttendanceLogsScreen;