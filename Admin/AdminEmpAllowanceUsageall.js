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
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Linking } from "react-native";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com/allowanceuseage";

export default function AllowanceUsageLogsScreen({ navigation }) {
  const [usageList, setUsageList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [timeFilter, setTimeFilter] = useState(null); // daily | weekly | monthly
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [timeFilter, filterDate, usageList]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/all`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.rows || [];
      setUsageList(rows);
      setFilteredData(rows);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch usage data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let data = [...usageList];
    const now = new Date();

    // 🔹 Exact Date (highest priority)
    if (filterDate) {
      const selected = filterDate.toDateString();
      data = data.filter(
        (item) =>
          item.created_at &&
          new Date(item.created_at).toDateString() === selected
      );
    }

    // 🔹 Dropdown filter
    else if (timeFilter) {
      data = data.filter((item) => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);

        if (timeFilter === "daily") {
          return itemDate.toDateString() === now.toDateString();
        }

        if (timeFilter === "weekly") {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay());
          start.setHours(0, 0, 0, 0);

          const end = new Date(start);
          end.setDate(start.getDate() + 7);

          return itemDate >= start && itemDate < end;
        }

        if (timeFilter === "monthly") {
          return (
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear()
          );
        }

        return true;
      });
    }

    setFilteredData(data);
  };

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilterDate(selectedDate);
      setTimeFilter(null); // disable dropdown
    }
  };

  const resetFilter = () => {
    setTimeFilter(null);
    setFilterDate(null);
    setFilteredData(usageList);
  };

  const exportToExcel = () => {
    Linking.openURL(`${API_BASE}/export`);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text>Loading allowance usage...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Allowance Usage</Text>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {/* Date Picker */}
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} />
            <Text style={{ marginLeft: 6 }}>
              {filterDate ? filterDate.toLocaleDateString() : "Pick Date"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={filterDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleDateChange}
            />
          )}

          {/* 🔽 Dropdown */}
          <View style={styles.dropdown}>
            <Ionicons name="time-outline" size={18} />
            <Picker
              selectedValue={timeFilter}
              onValueChange={(val) => {
                setTimeFilter(val);
                setFilterDate(null);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Range" value={null} />
              <Picker.Item label="Today" value="daily" />
              <Picker.Item label="This Week" value="weekly" />
              <Picker.Item label="This Month" value="monthly" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtn} onPress={exportToExcel}>
            <Ionicons name="download-outline" size={16} color="#fff" />
            <Text style={styles.resetText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Table */}
        <ScrollView horizontal>
          <View>
            <View style={[styles.tableRow, styles.tableHeader]}>
              {["S.No", "Name", "Department", "Description", "Amount", "Used", "Date", "Action"].map(
                (h, i) => (
                  <Text key={i} style={[styles.cell, styles.headerCell]}>
                    {h}
                  </Text>
                )
              )}
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => String(item.id || index)}
              renderItem={({ item, index }) => (
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>{index + 1}</Text>
                  <Text style={styles.cell}>{item.emp_name}</Text>
                  <Text style={styles.cell}>{item.department}</Text>
                  <Text style={[styles.cell, { maxWidth: 250 }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.cell}>₹{item.amount}</Text>
                  <Text style={styles.cell}>
                    {item.amount_used ? `₹${item.amount_used}` : "-"}
                  </Text>
                  <Text style={styles.cell}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedRecord(item);
                      setModalVisible(true);
                    }}
                  >
                    <Ionicons name="eye-outline" size={20} color="#1e90ff" />
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
              {selectedRecord && (
                <>
                  <Text style={styles.modalTitle}>{selectedRecord.emp_name}</Text>
                  <Text>Department: {selectedRecord.department}</Text>
                  <Text>Email: {selectedRecord.emp_email}</Text>
                  <Text>Description: {selectedRecord.description}</Text>
                  <Text>Amount: ₹{selectedRecord.amount}</Text>
                  <Text>
                    Used: {selectedRecord.amount_used ? `₹${selectedRecord.amount_used}` : "-"}
                  </Text>
                  <Text>
                    Date: {new Date(selectedRecord.created_at).toLocaleDateString()}
                  </Text>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f6f8", alignItems: "center" },
  container: { flex: 1, width: "100%", maxWidth: 1200, padding: 16 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", marginLeft: 12 },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 8,
    height: 42,
  },

  picker: {
    width: 160,
    height: 80,
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6c757d",
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e90ff",
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  resetText: { color: "#fff", marginLeft: 6 },

  tableHeader: { backgroundColor: "#e9ecef" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  cell: { padding: 10, minWidth: 120, fontSize: 13 },
  headerCell: { fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  closeBtn: {
    marginTop: 16,
    backgroundColor: "#1e90ff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontWeight: "bold" },
});
