import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const AdminBreakLogsScreen = () => {
  const [breakData, setBreakData] = useState([]);
  const [mergedBreaks, setMergedBreaks] = useState([]);
  const [filteredBreaks, setFilteredBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = useNavigation();

  const BREAK_API = "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/all";
  const DELETE_API = "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/delete";
  const UPDATE_API = "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/update";

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

  const getTimeOnly = (timestamp) => {
    if (!timestamp || timestamp === "--") return "--";
    try {
      const timePart = timestamp.split("T")[1] || timestamp.split(" ")[1];
      return timePart ? timePart.substring(0, 8) : "--";
    } catch {
      return "--";
    }
  };

  const fetchBreaks = async () => {
    try {
      const res = await fetch(BREAK_API);
      const json = await res.json();
      if (json.success) setBreakData(json.data);
      else showAlert("Error", "Failed to load break data");
    } catch (err) {
      showAlert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreaks();
  }, []);

  useEffect(() => {
    if (!breakData.length) return;
    const sorted = [...breakData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const grouped = {};
    sorted.forEach((item) => {
      const empId = item.employee_id;
      if (!grouped[empId]) grouped[empId] = [];
      grouped[empId].push(item);
    });

    const merged = [];
    Object.keys(grouped).forEach((empId) => {
      const logs = grouped[empId];
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.break_type === "Break In") {
          const breakOut = logs.slice(i + 1).find((l) => l.break_type === "Break Out");
          merged.push({
            employee_id: empId,
            employee_name: log.user_name,
            breakInId: log.id,
            breakOutId: breakOut ? breakOut.id : null,
            breakInTime: getTimeOnly(log.timestamp),
            breakOutTime: breakOut ? getTimeOnly(breakOut.timestamp) : "--",
            breakInImage: log.image_url,
            breakOutImage: breakOut ? breakOut.image_url : null,
            status: breakOut ? breakOut.status : log.status,
          });
        }
      }
    });

    const reversed = merged.reverse();
    setMergedBreaks(reversed);
    setFilteredBreaks(reversed);
  }, [breakData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBreaks(mergedBreaks);
    } else {
      const filtered = mergedBreaks.filter((item) =>
        item.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBreaks(filtered);
    }
  }, [searchQuery, mergedBreaks]);

  const handleDelete = async (record) => {
    const { breakInId, breakOutId } = record;
    showAlert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const resIn = await fetch(`${DELETE_API}/${breakInId}`, { method: "DELETE" });
            const jsonIn = await resIn.json();
            if (jsonIn.success) {
              if (breakOutId) await fetch(`${DELETE_API}/${breakOutId}`, { method: "DELETE" });
              showAlert("Deleted", "Record deleted successfully!");
              await fetchBreaks();
              setModalVisible(false);
            }
          } catch (err) {
            showAlert("Error", err.message);
          }
        },
      },
    ]);
  };

  const handleUpdate = async (record) => {
    const { breakInId, breakOutId } = record;
    try {
      const res = await fetch(UPDATE_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breakInId, breakOutId, status: updatedStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showAlert("Updated", "Status updated successfully!");
        setEditing(false);
        setModalVisible(false);
        await fetchBreaks();
      }
    } catch (err) {
      showAlert("Error", err.message);
    }
  };
 


  const columns = [
    { key: "sno", title: "S.No", width: 50 },
    { key: "emp", title: "Employee Name", width: 140 },
    { key: "inImg", title: "Break In Img", width: 110 },
    { key: "outImg", title: "Break Out Img", width: 110 },
    { key: "in", title: "Break In", width: 90 },
    { key: "out", title: "Break Out", width: 90 },
    { key: "status", title: "Status", width: 100 },
    { key: "action", title: "Action", width: 70 },
  ];
   const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0);
const tableMinWidth = SCREEN_WIDTH > totalTableWidth
  ? SCREEN_WIDTH
  : totalTableWidth;

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>loading{loadingCount}s</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Break Logs</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by employee name..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Table Section */}
      <View style={styles.tableWrapper}>
<ScrollView horizontal showsHorizontalScrollIndicator={true}>
  <View style={{ minWidth: tableMinWidth }}>
          <View>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              {columns.map((col) => (
                <Text key={col.key} style={[styles.headerCell, { width: col.width }]}>
                  {col.title}
                </Text>
              ))}
            </View>

            {/* Table Body */}
            <ScrollView style={{ flex: 1 }}>
              {filteredBreaks.map((item, index) => (
                <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? "#fff" : "#fcfcfc" }]}>
                  <Text style={[styles.cell, { width: 50 }]}>{index + 1}</Text>
                  <Text style={[styles.cell, { width: 140, fontWeight: "500", textAlign: 'left', paddingLeft: 10 }]}>{item.employee_name}</Text>
                  
                  <View style={[styles.cell, { width: 110, alignItems: "center" }]}>
                    {item.breakInImage ? (
                      <Image source={{ uri: item.breakInImage }} style={styles.rowImage} />
                    ) : (
                      <Text style={styles.noImg}>No Img</Text>
                    )}
                  </View>

                  <View style={[styles.cell, { width: 110, alignItems: "center" }]}>
                    {item.breakOutImage ? (
                      <Image source={{ uri: item.breakOutImage }} style={styles.rowImage} />
                    ) : (
                      <Text style={styles.noImg}>--</Text>
                    )}
                  </View>

                  <Text style={[styles.cell, { width: 90 }]}>{item.breakInTime}</Text>
                  <Text style={[styles.cell, { width: 90 }]}>{item.breakOutTime}</Text>

                  <Text style={[
                    styles.cell, 
                    { width: 100, fontWeight: "bold" },
                    item.status === "On Break" ? { color: "#f39c12" } : { color: "#27ae60" }
                  ]}>
                    {item.status}
                  </Text>

                  <TouchableOpacity
                    style={[styles.cell, { width: 70, borderRightWidth: 0, alignItems: "center" }]}
                    onPress={() => {
                      setSelectedRecord(item);
                      setModalVisible(true);
                      setUpdatedStatus(item.status);
                    }}
                  >
                    <Ionicons name="eye" size={22} color="#3498db" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
          </View>
        </ScrollView>
      </View>

      {/* Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {selectedRecord && (
                <>
                  <Text style={styles.modalTitle}>Break Details</Text>
                  <View style={styles.modalImageRow}>
                    <Image source={{ uri: selectedRecord.breakInImage }} style={styles.modalImage} />
                    {selectedRecord.breakOutImage && <Image source={{ uri: selectedRecord.breakOutImage }} style={styles.modalImage} />}
                  </View>
                  <Text style={styles.modalText}>Name: {selectedRecord.employee_name}</Text>
                  <Text style={styles.modalText}>Time: {selectedRecord.breakInTime} - {selectedRecord.breakOutTime}</Text>
                  
                  {editing ? (
                    <>
                      <TextInput value={updatedStatus} onChangeText={setUpdatedStatus} style={styles.input} />
                      <TouchableOpacity style={styles.saveBtn} onPress={() => handleUpdate(selectedRecord)}>
                        <Text style={styles.btnText}>Update</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.modalButtonsRow}>
                      <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#f39c12" }]} onPress={() => setEditing(true)}>
                        <Ionicons name="create" size={20} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#e74c3c" }]} onPress={() => handleDelete(selectedRecord)}>
                        <Ionicons name="trash" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity style={styles.closeBtn} onPress={() => { setModalVisible(false); setEditing(false); }}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminBreakLogsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fa", padding: 15, paddingTop: Platform.OS === 'ios' ? 50 : 40 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  title: { fontSize: 22, fontWeight: "bold", marginLeft: 15, color: "#333" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15,outlineStyle: "none" },
  tableWrapper: { flex: 1, backgroundColor: "#fff", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#ddd" },
  tableRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tableHeader: { backgroundColor: "#1a237e" },
  headerCell: { 
    color: "#fff", 
    fontWeight: "bold", 
    paddingVertical: 12, 
    textAlign: "center", 
    fontSize: 13,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)"
  },
  cell: { 
    paddingVertical: 10, 
    textAlign: "center", 
    fontSize: 13, 
    color: "#444",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  rowImage: { width: 50, height: 50, borderRadius: 5, borderWidth: 1, borderColor: "#ddd" },
  noImg: { color: "#aaa", fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalWrapper: { backgroundColor: "#fff", width: "85%", borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalImageRow: { flexDirection: "row", justifyContent: "center", marginBottom: 15 },
  modalImage: { width: 80, height: 80, borderRadius: 10, marginHorizontal: 5 },
  modalText: { fontSize: 16, marginBottom: 5 },
  modalButtonsRow: { flexDirection: "row", justifyContent: "center", marginTop: 15 },
  modalBtn: { padding: 10, borderRadius: 8, marginHorizontal: 10 },
  closeBtn: { marginTop: 20, padding: 12, backgroundColor: "#eee", borderRadius: 8 },
  closeBtnText: { textAlign: "center", fontWeight: "600" }
});