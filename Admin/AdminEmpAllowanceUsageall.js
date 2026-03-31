import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  Platform,
  Alert,
  Linking,
  FlatList
} from "react-native";
import { Ionicons,Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com/allowanceuseage";

export default function AllowanceUsageLogsScreen({ navigation }) {
  const [usageList, setUsageList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [timeFilter, setTimeFilter] = useState(null);
  const [filterDate, setFilterDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_TABLE_WIDTH = 1500;
  const containerWidth = SCREEN_WIDTH > MAX_TABLE_WIDTH ? MAX_TABLE_WIDTH : SCREEN_WIDTH - 20;
  const isWeb = Platform.OS === "web";

  const columnWidths = [50, 150, 150, 300, 100, 100, 120, 60]; // proper widths for premium alignment

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const formatDateForInput = (date) => (date ? date.toISOString().split("T")[0] : "");

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => { fetchUsage(); }, []);
  useEffect(() => { applyFilters(); }, [timeFilter, filterDate, usageList]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/all`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.rows || [];
      setUsageList(rows);
      setFilteredData(rows);
    } catch (err) {
      showAlert("Error", "Failed to fetch usage data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let data = [...usageList];
    const now = new Date();

    if (filterDate) {
      const selected = filterDate.toDateString();
      data = data.filter(item => item.created_at && new Date(item.created_at).toDateString() === selected);
    } else if (timeFilter) {
      data = data.filter(item => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        if (timeFilter === "daily") return itemDate.toDateString() === now.toDateString();
        if (timeFilter === "weekly") {
          const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
          const end = new Date(start); end.setDate(start.getDate() + 7);
          return itemDate >= start && itemDate < end;
        }
        if (timeFilter === "monthly") return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        return true;
      });
    }

    setFilteredData(data);
  };

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilterDate(selectedDate);
      setTimeFilter(null);
    }
  };

  const resetFilter = () => {
    setFilterDate(null);
    setTimeFilter(null);
    setFilteredData(usageList);
  };

  const exportToExcel = () => {
    Linking.openURL(`${API_BASE}/export`);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={{ marginTop: 10 }}>Loading allowance usage {loadingCount}s</Text>
      </View>
    );
  }

 return (
    <View style={styles.webWrapper}>
    

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* Header Section */}
     {/* Header Section */}
<View style={styles.contentHeader}>
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
    
    {/* BACK ARROW */}
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={22} color="#1e293b" />
    </TouchableOpacity>

    {/* TITLE */}
    <View>
      <Text style={styles.mainTitle}>Allowance Usage Logs</Text>
      <Text style={styles.subTitle}>
        History of all allowance transactions and claims
      </Text>
    </View>

  </View>

  {/* RIGHT ACTION */}
  <View style={styles.headerActions}>
    <TouchableOpacity
      style={styles.exportBtn}
      onPress={() => Linking.openURL(`${API_BASE}/export`)}
    >
      <Feather name="download" size={18} color="#fff" />
      <Text style={styles.btnText}>Export Data</Text>
    </TouchableOpacity>
  </View>
</View>


        {/* Filters Bar */}
        <View style={styles.filterCard}>
          <View style={styles.filterGroup}>
            <Feather name="filter" size={18} color="#64748b" style={{ marginRight: 10 }} />
            
            <View style={styles.datePickerContainer}>
               {isWeb ? (
                 <input
                   type="date"
                   value={formatDateForInput(filterDate)}
                   onChange={(e) => { setFilterDate(e.target.value ? new Date(e.target.value) : null); setTimeFilter(null); }}
                   style={styles.webDateInput}
                 />
               ) : (
                 <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.mobileDateBtn}>
                    <Text>{filterDate ? filterDate.toLocaleDateString() : "Select Date"}</Text>
                 </TouchableOpacity>
               )}
            </View>

            <View style={styles.pickerWrapper}>
              <Picker 
                selectedValue={timeFilter} 
                onValueChange={(val) => { setTimeFilter(val); setFilterDate(null); }}
                style={styles.nativePicker}
              >
                <Picker.Item label="All Time" value={null} />
                <Picker.Item label="Today" value="daily" />
                <Picker.Item label="This Week" value="weekly" />
                <Picker.Item label="This Month" value="monthly" />
              </Picker>
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
              <Text style={styles.resetText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.hCell, { width: 60 }]}>S.No</Text>
                <Text style={[styles.hCell, { width: 180 }]}>Employee</Text>
                <Text style={[styles.hCell, { width: 150 }]}>Department</Text>
                <Text style={[styles.hCell, { width: 250 }]}>Description</Text>
                <Text style={[styles.hCell, { width: 120 }]}>Total Amt</Text>
                <Text style={[styles.hCell, { width: 120 }]}>Claimed</Text>
                <Text style={[styles.hCell, { width: 120 }]}>Date</Text>
                <Text style={[styles.hCell, { width: 80, textAlign: 'center' }]}>View</Text>
              </View>

              <FlatList
                data={filteredData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={[styles.tableRow, index % 2 === 0 && { backgroundColor: '#fcfcfc' }]}>
                    <Text style={[styles.rCell, { width: 60 }]}>#{index + 1}</Text>
                    <Text style={[styles.rCell, { width: 180, fontWeight: '600' }]}>{item.emp_name}</Text>
                    <Text style={[styles.rCell, { width: 150 }]}>{item.department}</Text>
                    <Text style={[styles.rCell, { width: 250 }]} numberOfLines={1}>{item.description}</Text>
                    <Text style={[styles.rCell, { width: 120, color: '#64748b' }]}>₹{item.amount}</Text>
                    <Text style={[styles.rCell, { width: 120, color: '#10b981', fontWeight: '700' }]}>₹{item.amount_used || 0}</Text>
                    <Text style={[styles.rCell, { width: 120 }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    <TouchableOpacity 
                      style={[styles.rCell, { width: 80, alignItems: 'center' }]} 
                      onPress={() => { setSelectedRecord(item); setModalVisible(true); }}
                    >
                      <View style={styles.viewIcon}><Feather name="eye" size={16} color="#2563eb" /></View>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal for Detail View */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Transaction Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Feather name="x" size={24} color="#64748b" /></TouchableOpacity>
            </View>
            {selectedRecord && (
              <View style={styles.modalBody}>
                <DetailRow label="Employee" value={selectedRecord.emp_name} />
                <DetailRow label="Department" value={selectedRecord.department} />
                <DetailRow label="Email" value={selectedRecord.emp_email} />
                <DetailRow label="Total Amount" value={`₹${selectedRecord.amount}`} />
                <DetailRow label="Used Amount" value={`₹${selectedRecord.amount_used || 0}`} />
                <DetailRow label="Date" value={new Date(selectedRecord.created_at).toLocaleString()} />
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailTextDesc}>{selectedRecord.description}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  webWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  sidebar: { width: 260, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 24 },
  sidebarBrand: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: "#2563EB", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  brandLetter: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  brandSub: { fontSize: 12, color: "#64748b", marginTop: -4 },
  backBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#f1f5f9",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#e2e8f0",
},

  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: "#2563EB" },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: "#64748b", fontWeight: "600" },
  sidebarLabelActive: { color: "#fff" },
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 12, marginTop: 20 },
  logoutText: { marginLeft: 12, color: "#ef4444", fontWeight: "700" },

  mainContent: { flex: 1, padding: 32 },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4 },
  exportBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  filterCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  filterGroup: { flexDirection: 'row', alignItems: 'center' },
webDateInput: {
  padding: 8,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: "#e2e8f0",
  color: "#1e293b",
  marginRight: 15,
  outlineStyle: "none",
},
  pickerWrapper: { width: 180, height: 40, backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 15 },
  nativePicker: { height: 40, width: '100%' },
  resetBtn: { paddingHorizontal: 15 },
  resetText: { color: '#ef4444', fontWeight: '600' },

  tableCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: 'hidden', flex: 1 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  hCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  rCell: { fontSize: 14, color: "#334155" },
  viewIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },

  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: 500, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  detailLabel: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  detailValue: { color: '#1e293b', fontWeight: '700', fontSize: 14 },
  detailTextDesc: { color: '#334155', marginTop: 8, lineHeight: 20 }
});