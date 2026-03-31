import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminRequestFormall() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const tableWidth = Math.max(750, SCREEN_WIDTH - 40); // min table width or screen width minus padding

  const loadRequests = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctorrequest/allrequest`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequestStatus = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/doctorrequest/update-request/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadRequests();
    } catch (error) {
      Alert.alert("Error", "Server connection failed");
    }
  };

  const StatusBadge = ({ status }) => {
    let styles_badge = { bg: "#F1F5F9", text: "#64748B" };
    if (status === "approved") styles_badge = { bg: "#DCFCE7", text: "#15803d" };
    if (status === "rejected") styles_badge = { bg: "#FEE2E2", text: "#b91c1c" };
    if (status === "pending") styles_badge = { bg: "#FEF3C7", text: "#b45309" };

    return (
      <View style={[styles.badge, { backgroundColor: styles_badge.bg }]}>
        <View style={[styles.dot, { backgroundColor: styles_badge.text }]} />
        <Text style={[styles.badgeText, { color: styles_badge.text }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Fetching Requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Request Management</Text>
          <Text style={styles.headerSubtitle}>
            Approve or decline internal department requests
          </Text>
        </View>
      </View>

      {/* Table Section */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={[styles.tableContainer, { minWidth: tableWidth }]}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { width: 70 }]}>ID</Text>
              <Text style={[styles.columnHeader, { width: 120 }]}>Employee</Text>
              <Text style={[styles.columnHeader, { width: 140 }]}>Dept</Text>
              <Text style={[styles.columnHeader, { width: 250 }]}>Requested Items</Text>
              <Text style={[styles.columnHeader, { width: 120 }]}>Status</Text>
              <Text style={[styles.columnHeader, { width: 160, textAlign: "center" }]}>
                Actions
              </Text>
            </View>

            {/* Table Body */}
            {requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="inbox" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>No pending requests found</Text>
              </View>
            ) : (
              requests.map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    { backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC" },
                  ]}
                >
                  <Text style={[styles.cellID, { width: 70 }]}>#{item.id}</Text>
                  <View style={{ width: 120 }}>
                    <Text style={styles.cellMainText}>{item.employee_id}</Text>
                  </View>
                  <Text style={[styles.cell, { width: 140 }]}>{item.department}</Text>
                  <Text style={[styles.cellItems, { width: 250 }]} numberOfLines={2}>
                    {item.items.map((i) => `${i.name} (${i.quantity})`).join(", ")}
                  </Text>
                  <View style={{ width: 120 }}>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={[styles.actionCell, { width: 160 }]}>
                    {item.status === "pending" ? (
                      <View style={styles.btnGroup}>
                        <TouchableOpacity
                          style={[styles.iconBtn, styles.approveBtn]}
                          onPress={() => updateRequestStatus(item.id, "approved")}
                          activeOpacity={0.7}
                        >
                          <Feather name="check" size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.iconBtn, styles.rejectBtn]}
                          onPress={() => updateRequestStatus(item.id, "rejected")}
                          activeOpacity={0.7}
                        >
                          <Feather name="x" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.handledContainer}>
                        <MaterialIcons name="done-all" size={14} color="#94A3B8" />
                        <Text style={styles.completedText}>Closed</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
  loadingText: { marginTop: 12, color: "#64748B", fontWeight: "600" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  headerSubtitle: { fontSize: 13, color: "#64748B", fontWeight: "400" },

  tableContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFF",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.08)" },
    }),
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  columnHeader: { color: "#FFF", fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.7 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  cellID: { fontSize: 13, color: "#64748B", fontWeight: "700" },
  cellMainText: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  cell: { fontSize: 14, color: "#475569" },
  cellItems: { fontSize: 14, color: "#64748B", fontStyle: "italic" },

  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  actionCell: { justifyContent: "center", alignItems: "center" },
  btnGroup: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", ...Platform.select({ web: { cursor: "pointer" } }) },
  approveBtn: { backgroundColor: "#10B981" },
  rejectBtn: { backgroundColor: "#EF4444" },

  handledContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  completedText: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },

  emptyContainer: { padding: 60, alignItems: "center" },
  emptyText: { marginTop: 12, color: "#94A3B8", fontSize: 16 },
});
