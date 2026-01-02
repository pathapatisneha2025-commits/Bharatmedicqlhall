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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const AdminBreakLogsScreen = () => {
  const [breakData, setBreakData] = useState([]);
  const [mergedBreaks, setMergedBreaks] = useState([]);
  const [filteredBreaks, setFilteredBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = useNavigation();

  const BREAK_API =
    "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/all";
  const DELETE_API =
    "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/delete";
  const UPDATE_API =
    "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/update";

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
      else Alert.alert("Error", "Failed to load break data");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreaks();
  }, []);

  // 🧩 Combine Break In/Out entries per employee
  useEffect(() => {
    if (!breakData.length) return;
    const sorted = [...breakData].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

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
          const breakOut = logs
            .slice(i + 1)
            .find((l) => l.break_type === "Break Out");
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

  // 🔍 Search filter
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

  // 🗑️ Delete logs by employee_id
  const handleDelete = async (record) => {
    const { breakInId, breakOutId } = record;

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this Break In/Out record pair?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const resIn = await fetch(`${DELETE_API}/${breakInId}`, {
                method: "DELETE",
              });
              const jsonIn = await resIn.json();

              let jsonOut = null;
              if (breakOutId) {
                const resOut = await fetch(`${DELETE_API}/${breakOutId}`, {
                  method: "DELETE",
                });
                jsonOut = await resOut.json();
              }

              if (
                jsonIn.success &&
                (!breakOutId || (jsonOut && jsonOut.success))
              ) {
                Alert.alert("Deleted", "Break In/Out records deleted successfully!");
                await fetchBreaks();
                setModalVisible(false);
              } else {
                Alert.alert("Error", "Failed to delete one or more records.");
              }
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  // ✏️ Update status
  const handleUpdate = async (record) => {
    const { breakInId, breakOutId } = record;
    try {
      const res = await fetch(UPDATE_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          breakInId,
          breakOutId,
          status: updatedStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        Alert.alert("Updated", "Status updated successfully!");
        setEditing(false);
        setModalVisible(false);
        await fetchBreaks();
      } else Alert.alert("Error", json.message);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading break logs...</Text>
      </View>
    );

  const columns = [
    { key: "sno", title: "S.No", width: 60 },
    { key: "emp", title: "Employee Name", width: 140 },
    { key: "inImg", title: "Break In Img", width: 120 },
    { key: "outImg", title: "Break Out Img", width: 120 },
    { key: "in", title: "Break In", width: 100 },
    { key: "out", title: "Break Out", width: 100 },
    { key: "status", title: "Status", width: 100 },
    { key: "action", title: "Action", width: 100 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Break Logs</Text>
      </View>

      {/* 🔍 Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#555" style={styles.searchIcon} />
        <TextInput
          placeholder="Search by employee name..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#777" />
          </TouchableOpacity>
        )}
      </View>

      {/* Table */}
      <ScrollView horizontal>
        <View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            {columns.map((col) => (
              <Text
                key={col.key}
                style={[styles.headerCell, { width: col.width }]}
              >
                {col.title}
              </Text>
            ))}
          </View>

          {filteredBreaks.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 && { backgroundColor: "#fafafa" },
              ]}
            >
              <Text style={[styles.cell, { width: 60 }]}>{index + 1}</Text>
              <Text style={[styles.cell, { width: 140 }]}>{item.employee_name}</Text>

              <View style={[styles.cell, { width: 120, alignItems: "center" }]}>
                {item.breakInImage ? (
                  <Image
                    source={{ uri: item.breakInImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Text style={styles.noImg}>No Img</Text>
                )}
              </View>

              <View style={[styles.cell, { width: 120, alignItems: "center" }]}>
                {item.breakOutImage ? (
                  <Image
                    source={{ uri: item.breakOutImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Text style={styles.noImg}>--</Text>
                )}
              </View>

              <Text style={[styles.cell, { width: 100 }]}>{item.breakInTime}</Text>
              <Text style={[styles.cell, { width: 100 }]}>{item.breakOutTime}</Text>
              <Text
                style={[
                  styles.cell,
                  { width: 100 },
                  item.status === "On Break"
                    ? { color: "orange" }
                    : { color: "green" },
                ]}
              >
                {item.status}
              </Text>

              <TouchableOpacity
                style={[styles.cell, { width: 100, alignItems: "center" }]}
                onPress={() => {
                  setSelectedRecord(item);
                  setModalVisible(true);
                  setUpdatedStatus(item.status);
                }}
              >
                <Ionicons name="eye-outline" size={22} color="#007bff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedRecord && (
              <>
                <Text style={styles.modalTitle}>Break Details</Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  {selectedRecord.breakInImage && (
                    <Image
                      source={{ uri: selectedRecord.breakInImage }}
                      style={styles.modalImage}
                    />
                  )}
                  {selectedRecord.breakOutImage && (
                    <Image
                      source={{ uri: selectedRecord.breakOutImage }}
                      style={styles.modalImage}
                    />
                  )}
                </View>

                <Text style={styles.modalText}>
                  Employee: {selectedRecord.employee_name}
                </Text>
                <Text style={styles.modalText}>
                  Break In: {selectedRecord.breakInTime}
                </Text>
                <Text style={styles.modalText}>
                  Break Out: {selectedRecord.breakOutTime}
                </Text>

                {editing ? (
                  <>
                    <TextInput
                      value={updatedStatus}
                      onChangeText={setUpdatedStatus}
                      style={styles.input}
                      placeholder="Enter new status"
                    />
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => handleUpdate(selectedRecord)}
                    >
                      <Text style={styles.btnText}>Update</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.modalText}>
                      Status: {selectedRecord.status}
                    </Text>
                    <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => setEditing(true)}
                      >
                        <Ionicons name="create-outline" size={20} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(selectedRecord)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setEditing(false);
                  }}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminBreakLogsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8", padding: 10 , marginTop: 30},
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  tableHeader: {
    backgroundColor: "#007bff", // Blue header background
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#0056b3",
  },
  headerCell: {
    fontWeight: "bold",
    fontSize: 14,
    padding: 10,
    color: "#fff", // White text for contrast
    borderRightWidth: 1,
    borderRightColor: "#0056b3",
    textAlign: "center",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    alignItems: "center",
  },

  cell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    fontSize: 13,
    textAlign: "center",
  },
  profileImage: { width: 50, height: 50, borderRadius: 25 },
  noImg: { fontSize: 12, color: "#999" },
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
  modalImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  modalText: { fontSize: 14, marginBottom: 4 },
  closeBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
  },
  closeBtnText: { color: "#fff", fontWeight: "bold" },
  editBtn: { backgroundColor: "orange", padding: 8, borderRadius: 6 },
  deleteBtn: { backgroundColor: "red", padding: 8, borderRadius: 6 },
  saveBtn: { backgroundColor: "green", padding: 8, borderRadius: 6, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    width: "80%",
    marginTop: 8,
  },
});
