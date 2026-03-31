import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminProfileApprovalScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingCount, setLoadingCount] = useState(0);

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

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/employee/pending_approve_update`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.employees || []);
      } else {
        showAlert("Error", data.message || "Failed to fetch requests");
      }
    } catch (err) {
      showAlert("Error", "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const approveRequest = async (employeeId) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/employee/approve-update/${employeeId}`, { method: "PUT" });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, status: "approved" } : emp));
        showAlert("Success", "Employee update approved");
      }
    } catch (err) {
      showAlert("Error", "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };


  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { width: 150 }]}>Name</Text>
      <Text style={[styles.headerCell, { width: 220 }]}>Email Address</Text>
      <Text style={[styles.headerCell, { width: 130 }]}>Department</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Role</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Status</Text>
      <Text style={[styles.headerCell, { width: 120, textAlign: 'center' }]}>Action</Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      <Text style={[styles.cell, { width: 150, fontWeight: '600' }]}>{item.full_name}</Text>
      <Text style={[styles.cell, { width: 220 }]}>{item.email}</Text>
      <Text style={[styles.cell, { width: 130 }]}>{item.department}</Text>
      <Text style={[styles.cell, { width: 120 }]}>{item.role}</Text>
      <View style={[styles.cell, { width: 120 }]}>
        <View style={[styles.statusBadge, item.status === "approved" ? styles.badgeApproved : styles.badgePending]}>
          <Text style={item.status === "approved" ? styles.statusApprovedText : styles.statusPendingText}>
            {item.status === "approved" ? "Approved" : "Pending"}
          </Text>
        </View>
      </View>
      <View style={[styles.cell, { width: 120, alignItems: 'center' }]}>
        <TouchableOpacity
          style={[styles.approveButton, { backgroundColor: item.status === "approved" ? "#e2e8f0" : "#2563EB" }]}
          onPress={() => approveRequest(item.id)}
          disabled={item.status === "approved"}
        >
          <Text style={[styles.approveText, { color: item.status === "approved" ? "#94a3b8" : "#fff" }]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.webContainer}>
    

      {/* MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
      <View style={styles.contentHeader}>
  <View style={styles.titleRow}>
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={22} color="#1e293b" />
    </TouchableOpacity>

    <View>
      <Text style={styles.mainTitle}>Approval Requests</Text>
      <Text style={styles.subTitle}>
        Manage pending profile update requests from staff
      </Text>
    </View>
  </View>
</View>

        {/* TABLE CARD */}
        <View style={styles.tableCard}>
          {loading && employees.length === 0 ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={{ marginTop: 10 }}>Loading {loadingCount}s</Text>
            </View>
          ) : employees.length === 0 ? (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>No pending requests found.</Text></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                {renderHeader()}
                <FlatList
                  data={employees}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  
  // Sidebar
  sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 24 },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: '#2563EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandLetter: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  brandSub: { fontSize: 12, color: '#64748b', marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: '#2563EB' },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: '#64748b', fontWeight: '600' },
  sidebarLabelActive: { color: '#fff' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutText: { marginLeft: 12, color: '#ef4444', fontWeight: '700' },

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  contentHeader: { marginBottom: 24 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subTitle: { color: '#64748b', marginTop: 4 },

  // Table Styling
  tableCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', elevation: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F8FAFC", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { padding: 16, fontWeight: "700", color: "#64748b", fontSize: 13 },
  tableRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowEven: { backgroundColor: "#fff" },
  rowOdd: { backgroundColor: "#fcfdfe" },
  cell: { padding: 16, fontSize: 14, color: "#334155" },

  // Badges
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeApproved: { backgroundColor: '#d1fae5' },
  badgePending: { backgroundColor: '#fef3c7' },
  statusApprovedText: { color: '#065f46', fontSize: 12, fontWeight: '700' },
  statusPendingText: { color: '#92400e', fontSize: 12, fontWeight: '700' },

  // Button
  approveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, elevation: 1 },
  approveText: { fontWeight: "700", fontSize: 13 },

  loaderContainer: { padding: 40, alignItems: "center" },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16 }
});