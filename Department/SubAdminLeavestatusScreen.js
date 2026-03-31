// screens/SubadminLeavesScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function SubadminLeavesScreen() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const containerWidth = SCREEN_WIDTH > 1000 ? SCREEN_WIDTH - 60 : 1200; // Force wide for dashboard table

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

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://hospitaldatabasemanagement.onrender.com/leaves/all");
      if (!response.ok) throw new Error("Failed to fetch leaves.");
      const result = await response.json();
      setLeaves(result.leaves || []);
      setFilteredLeaves(result.leaves || []);
    } catch (error) {
      showAlert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    const filtered = leaves.filter((leave) => {
      const matchesSearch =
        leave.employee_name.toLowerCase().includes(searchText.toLowerCase()) ||
        leave.department.toLowerCase().includes(searchText.toLowerCase()) ||
        leave.leave_type.toLowerCase().includes(searchText.toLowerCase());

      const leaveStart = new Date(leave.start_date).setHours(0, 0, 0, 0);
      const leaveEnd = new Date(leave.end_date).setHours(0, 0, 0, 0);
      const matchesStartDate = startDate ? leaveStart >= startDate.setHours(0, 0, 0, 0) : true;
      const matchesEndDate = endDate ? leaveEnd <= endDate.setHours(0, 0, 0, 0) : true;

      return matchesSearch && matchesStartDate && matchesEndDate;
    });
    setFilteredLeaves(filtered);
  }, [searchText, startDate, endDate, leaves]);

  const updateLeaveStatus = async (id, status) => {
    try {
      setLoading(true);
      const response = await fetch("https://hospitaldatabasemanagement.onrender.com/leaves/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error("Failed to update leave status.");
      const result = await response.json();

      setLeaves((prev) => prev.map((leave) => (leave.id === id ? { ...leave, status: status } : leave)));
      showAlert("Success", result.message || `Leave ${status} successfully.`);
    } catch (error) {
      showAlert("Error", `Failed to ${status} leave.`);
    } finally {
      setLoading(false);
    }
  };

  const deleteLeave = async (id) => {
    showAlert("Confirm Delete", "Are you sure you want to delete this leave?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`https://hospitaldatabasemanagement.onrender.com/leaves/delete/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete leave.");
            showAlert("Success", "Leave deleted successfully.");
            setLeaves((prev) => prev.filter((leave) => leave.id !== id));
          } catch (error) {
            showAlert("Error", error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Stats for Dashboard
  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status.toLowerCase() === 'pending').length,
    approved: leaves.filter(l => l.status.toLowerCase() === 'approved').length,
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2F80ED" />
        <Text style={styles.loadingText}>Loading dashboard {loadingCount}s</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Bar */}
      <View style={styles.dashboardHeader}>
        <View style={styles.headerTitleGroup}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
            <Ionicons name="arrow-back" size={20} color="#2F80ED" />
          </TouchableOpacity>
          <Text style={styles.heading}>Leave Management Dashboard</Text>
        </View>
        
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees or departments..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Dashboard Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: '#2F80ED' }]}>
          <Text style={styles.statLabel}>Total Requests</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#ff9900' }]}>
          <Text style={styles.statLabel}>Pending Approval</Text>
          <Text style={styles.statValue}>{stats.pending}</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: 'green' }]}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={styles.statValue}>{stats.approved}</Text>
        </View>
      </View>

      {/* Data Table Section */}
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{ minWidth: containerWidth }}>
            {/* Table Header */}
            <View style={styles.headerRow}>
              {[
                { label: "EMPLOYEE", width: 180 },
                { label: "DEPARTMENT", width: 150 },
                { label: "TYPE", width: 120 },
                { label: "START DATE", width: 130 },
                { label: "END DATE", width: 130 },
                { label: "DAYS", width: 80 },
                { label: "DEDUCTION", width: 130 },
                { label: "STATUS", width: 120 },
                { label: "ACTIONS", width: 250 },
              ].map((col) => (
                <Text key={col.label} style={[styles.headerCell, { width: col.width }]}>
                  {col.label}
                </Text>
              ))}
            </View>

            {/* Table Body */}
            {filteredLeaves.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.noDataText}>No leave records found for your search criteria.</Text>
              </View>
            ) : (
              filteredLeaves.map((leave, index) => (
                <View key={leave.id} style={[styles.row, index % 2 === 0 ? null : styles.alternateRow]}>
                  <Text style={[styles.cell, { width: 180, fontWeight: '600', color: '#1e293b' }]}>{leave.employee_name}</Text>
                  <Text style={[styles.cell, { width: 150 }]}>{leave.department}</Text>
                  <Text style={[styles.cell, { width: 120 }]}>
                    <View style={styles.typeBadge}><Text style={styles.typeText}>{leave.leave_type}</Text></View>
                  </Text>
                  <Text style={[styles.cell, { width: 130 }]}>{new Date(leave.start_date).toLocaleDateString()}</Text>
                  <Text style={[styles.cell, { width: 130 }]}>{new Date(leave.end_date).toLocaleDateString()}</Text>
                  <Text style={[styles.cell, { width: 80 }]}>{leave.leaves_duration}</Text>
                  <Text style={[styles.cell, { width: 130, color: '#dc3545', fontWeight: 'bold' }]}>₹{leave.salary_deduction}</Text>
                  
                  <View style={[styles.cell, { width: 120 }]}>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: leave.status.toLowerCase() === "approved" ? "#ecfdf5" : leave.status.toLowerCase() === "rejected" ? "#fef2f2" : "#fffbeb"
                    }]}>
                      <Text style={[styles.statusText, { 
                        color: leave.status.toLowerCase() === "approved" ? "green" : leave.status.toLowerCase() === "rejected" ? "red" : "#ff9900" 
                      }]}>
                        ● {leave.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.cell, { width: 250, flexDirection: "row" }]}>
                    {leave.status.toLowerCase() === "pending" && (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#10b981" }]} onPress={() => updateLeaveStatus(leave.id, "approved")}>
                          <Text style={styles.btnLabel}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#f59e0b" }]} onPress={() => updateLeaveStatus(leave.id, "rejected")}>
                          <Text style={styles.btnLabel}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#ef4444" }]} onPress={() => deleteLeave(leave.id)}>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  loadingText: { marginTop: 10, color: '#64748b' },

  dashboardHeader: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  heading: { fontSize: 22, fontWeight: "800", color: "#0f172a" },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    width: Platform.OS === 'web' ? 400 : '100%',
    marginTop: Platform.OS === 'web' ? 0 : 15,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: { height: 40, flex: 1, marginLeft: 8, fontSize: 14, outlineStyle: 'none' },

  statsContainer: { flexDirection: 'row', padding: 20, gap: 15, flexWrap: 'wrap' },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 5 },

  tableCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3
  },
  headerRow: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerCell: { fontSize: 11, fontWeight: "800", color: "#64748b", textAlign: "left", paddingHorizontal: 15 },
  
  row: { flexDirection: "row", paddingVertical: 12, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  alternateRow: { backgroundColor: '#fcfcfc' },
  cell: { fontSize: 14, color: "#475569", paddingHorizontal: 15 },

  typeBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  typeText: { fontSize: 12, color: '#475569', fontWeight: '600' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: "800" },

  actionBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, marginRight: 8, justifyContent: 'center' },
  btnLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },

  emptyState: { padding: 40, alignItems: 'center' },
  noDataText: { fontSize: 15, color: "#94a3b8" },
});