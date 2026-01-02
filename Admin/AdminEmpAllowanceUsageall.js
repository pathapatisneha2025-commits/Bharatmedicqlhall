// AllowanceUsageLogsScreen.js
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
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Linking } from "react-native";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com/allowanceuseage";

export default function AllowanceUsageLogsScreen({ navigation }) {
  const [usageList, setUsageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/all`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.data || data?.rows || [];
      setUsageList(rows);
      setFilteredData(rows);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch usage data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!filterDate) {
      setFilteredData(usageList);
      return;
    }
    const dateStr = new Date(filterDate).toLocaleDateString();
    setFilteredData(
      usageList.filter((r) => {
        const created = r.created_at || r.date || r.createdAt || r.timestamp;
        if (!created) return false;
        return new Date(created).toLocaleDateString() === dateStr;
      })
    );
  }, [filterDate, usageList]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setFilterDate(selectedDate);
  };

  const resetFilter = () => {
    setFilterDate(null);
    setFilteredData(usageList);
  };

  const openViewModal = (item) => {
    setSelectedRecord(item);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditRecord({
      id: item.id,
      emp_name: item.emp_name || "",
      emp_email: item.emp_email || "",
      department: item.department || "",
      description: item.description || "",
      amount: item.amount != null ? String(item.amount) : "",
      amount_used: item.amount_used != null ? String(item.amount_used) : "",
      date: item.created_at || "",
    });
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    if (!editRecord) return;
    const { id, emp_name, emp_email, department, description, amount, amount_used } = editRecord;

    if (!emp_name || !emp_email || !department || !description || amount === "") {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_name,
          emp_email,
          department,
          description,
          amount: parseFloat(amount),
          amount_used: amount_used !== "" ? parseFloat(amount_used) : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Record updated");
        setEditModalVisible(false);
        fetchUsage();
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/delete/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
              Alert.alert("Deleted", data.message || "Record deleted");
              setUsageList((prev) => prev.filter((r) => r.id !== id));
              setFilteredData((prev) => prev.filter((r) => r.id !== id));
            } else {
              throw new Error(data.message || "Delete failed");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("Error", err.message || "Could not delete");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const exportToExcel = () => {
    const url = `${API_BASE}/export`;
    Alert.alert("Export CSV", "File will open in the browser for download.", [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) },
    ]);
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading allowance usage...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Allowance Usage</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color="#000" />
          <Text style={{ marginLeft: 8 }}>
            {filterDate ? new Date(filterDate).toLocaleDateString() : "Pick Date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={filterDate ? new Date(filterDate) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportBtn} onPress={exportToExcel}>
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={[styles.resetText, { marginLeft: 6 }]}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView horizontal>
        <View>
          <View style={[styles.tableRow, styles.tableHeader]}>
            {[
              { title: "S.No", w: 60 },
              { title: "Name", w: 140 },
              { title: "Department", w: 140 },
              { title: "Description", w: 260 },
              { title: "Amount", w: 110 },
              { title: "Amount Used", w: 110 },
              { title: "Date", w: 120 },
              { title: "Action", w: 90 },
            ].map((h, idx) => (
              <Text key={idx} style={[styles.cell, styles.headerCell, { width: h.w }]}>
                {h.title}
              </Text>
            ))}
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => (item.id ? String(item.id) : String(index))}
            renderItem={({ item, index }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.cell, { width: 60 }]}>{index + 1}</Text>
                <Text style={[styles.cell, { width: 140 }]}>{item.emp_name}</Text>
                <Text style={[styles.cell, { width: 140 }]}>{item.department}</Text>
                <Text style={[styles.cell, { width: 260 }]} numberOfLines={2}>
                  {String(item.description)}
                </Text>
                <Text style={[styles.cell, { width: 110 }]}>₹{item.amount}</Text>
                <Text style={[styles.cell, { width: 110 }]}>
                  {item.amount_used != null ? `₹${item.amount_used}` : "-"}
                </Text>
                <Text style={[styles.cell, { width: 120 }]}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.cell,
                    { width: 90, alignItems: "center", flexDirection: "row", justifyContent: "space-around" },
                  ]}
                >
                  <TouchableOpacity onPress={() => openViewModal(item)}>
                    <Ionicons name="eye-outline" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* View Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedRecord && (
              <>
                <Text style={styles.modalTitle}>{selectedRecord.emp_name}</Text>
                <Text style={styles.modalText}>Department: {selectedRecord.department}</Text>
                <Text style={styles.modalText}>Email: {selectedRecord.emp_email}</Text>
                <Text style={styles.modalText}>Description: {selectedRecord.description}</Text>
                <Text style={styles.modalText}>Amount: ₹{selectedRecord.amount}</Text>
                <Text style={styles.modalText}>
                  Amount Used: {selectedRecord.amount_used != null ? `₹${selectedRecord.amount_used}` : "-"}
                </Text>
                <Text style={styles.modalText}>
                  Date: {new Date(selectedRecord.created_at).toLocaleDateString()}
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "#6c757d" }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "orange" }]}
                    onPress={() => {
                      setModalVisible(false);
                      openEditModal(selectedRecord);
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: "red" }]}
                    onPress={() => {
                      setModalVisible(false);
                      handleDelete(selectedRecord.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Allowance</Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editRecord?.emp_name ?? ""}
                onChangeText={(t) => setEditRecord((p) => ({ ...p, emp_name: t }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={editRecord?.emp_email ?? ""}
                onChangeText={(t) => setEditRecord((p) => ({ ...p, emp_email: t }))}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Department"
                value={editRecord?.department ?? ""}
                onChangeText={(t) => setEditRecord((p) => ({ ...p, department: t }))}
              />
              <TextInput
                style={[styles.input, { minHeight: 100 }]}
                placeholder="Description"
                value={editRecord?.description ?? ""}
                onChangeText={(t) => setEditRecord((p) => ({ ...p, description: t }))}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Amount"
                value={editRecord?.amount ?? ""}
                onChangeText={(t) => setEditRecord((p) => ({ ...p, amount: t }))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Amount Used"
                value={editRecord?.amount_used ?? ""}
                onChangeText={(t) => setEditRecord((p) => ({ ...p, amount_used: t }))}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#1e90ff" }]} onPress={saveEdit}>
                  <Text style={styles.modalBtnText}>Update</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.modalBtnText, { color: "#333" }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ------------------- Styles -------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8", padding: 10, marginTop: 30 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  filterBtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  resetBtn: { flexDirection: "row", backgroundColor: "#6c757d", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignItems: "center" },
  exportBtn: { flexDirection: "row", backgroundColor: "#1e90ff", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignItems: "center" },
  resetText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  tableHeader: { backgroundColor: "#e9ecef" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", backgroundColor: "#fff" },
  cell: { padding: 8, borderRightWidth: 1, borderRightColor: "#ddd", fontSize: 13, textAlignVertical: "center" },
  headerCell: { fontWeight: "bold", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalBox: { backgroundColor: "#fff", width: "90%", borderRadius: 10, padding: 18, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 14, marginBottom: 6 },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 16, width: "100%" },
  input: { backgroundColor: "#f0f4ff", borderRadius: 8, padding: 10, fontSize: 16, borderWidth: 1, borderColor: "#a0c4ff", marginBottom: 12 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 6 },
  modalBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  closeBtn: { backgroundColor: "#007bff", paddingVertical: 8, paddingHorizontal: 18, borderRadius: 6, alignItems: "center" },
  closeBtnText: { color: "#fff", fontWeight: "bold" },
});
