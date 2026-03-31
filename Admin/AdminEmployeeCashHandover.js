import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function EmployeeCashHandoverAdminDesktop() {
  const navigation = useNavigation();

  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 1200; // wider for desktop
  const isWeb = Platform.OS === "web";

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
      interval = setInterval(() => setLoadingCount(c => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/employee/cashhandover/all"
      );
      const data = await res.json();
      if (data.success) {
        setHandovers(
          data.handovers.map(h => ({
            id: h.id,
            receiver_name: h.receiver_name || "N/A",
            amount: Number(h.amount),
            handed_by: h.handed_by,
            receiver: h.receiver,
            handover_date: h.handover_date,
          }))
        );
      } else {
        setHandovers([]);
      }
    } catch (err) {
      console.error("Handover fetch error:", err);
      setHandovers([]);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async id => {
    setUpdatingId(id);
    try {
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/employee/complete/${id}`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (data.success) {
        showAlert("Success", "Handover marked as complete");
        fetchHandovers();
      } else {
        showAlert("Error", data.message || "Failed to mark complete");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to mark complete");
    } finally {
      setUpdatingId(null);
    }
  };

  const onView = handover => {
    setSelectedHandover(handover);
    setViewModalVisible(true);
  };

  const generateCSV = () => {
    const headers = ["ID", "Receiver Name", "Amount", "Handed By", "Receiver ID", "Handover Date"];
    const rows = handovers.map(h => [
      h.id,
      h.receiver_name,
      h.amount,
      h.handed_by,
      h.receiver,
      new Date(h.handover_date).toLocaleString(),
    ]);
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const downloadCSV = () => {
    const csv = generateCSV();
    const fileName = `cash_handover_${Date.now()}.csv`;
    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert("CSV export only available on web");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ color: "#2563eb", marginTop: 8 }}>
          Loading handovers {loadingCount}s
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.headerArea}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Cash Handover Logs</Text>
            <Text style={styles.headerSub}>Manage employee handovers</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.btnExport} onPress={downloadCSV}>
          <Feather name="file-text" size={18} color="#fff" />
          <Text style={styles.btnExportText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* TABLE CARD */}
      <View style={styles.cardTable}>
        <ScrollView horizontal showsHorizontalScrollIndicator={!isWeb}>
          <View style={{ minWidth: SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20 }}>
            {/* TABLE HEADER */}
            <View style={styles.tableHeader}>
              <Text style={[styles.hCell, { width: 60 }]}>ID</Text>
              <Text style={[styles.hCell, { width: 200 }]}>Receiver</Text>
              <Text style={[styles.hCell, { width: 120 }]}>Amount</Text>
              <Text style={[styles.hCell, { width: 150 }]}>Handed By</Text>
              <Text style={[styles.hCell, { width: 150 }]}>Receiver ID</Text>
              <Text style={[styles.hCell, { width: 200 }]}>Handover Date</Text>
              <Text style={[styles.hCell, { width: 120, textAlign: "center" }]}>Complete</Text>
              <Text style={[styles.hCell, { width: 80, textAlign: "center" }]}>View</Text>
            </View>

            {/* TABLE ROWS */}
            <ScrollView>
              {handovers.map((h, index) => (
                <View
                  key={h.id}
                  style={[styles.tRow, index % 2 !== 0 && { backgroundColor: "#f8fafc" }]}
                >
                  <Text style={[styles.tCell, { width: 60, fontWeight: "700" }]}>#{h.id}</Text>
                  <Text style={[styles.tCell, { width: 200 }]}>{h.receiver_name}</Text>
                  <Text style={[styles.tCell, { width: 120 }]}>₹{h.amount}</Text>
                  <Text style={[styles.tCell, { width: 150 }]}>{h.handed_by}</Text>
                  <Text style={[styles.tCell, { width: 150 }]}>{h.receiver}</Text>
                  <Text style={[styles.tCell, { width: 200 }]}>
                    {new Date(h.handover_date).toLocaleString()}
                  </Text>
                  <View style={{ width: 120, alignItems: "center" }}>
                    <TouchableOpacity
                      style={[styles.btnComplete, updatingId === h.id && { backgroundColor: "#999" }]}
                      disabled={updatingId === h.id}
                      onPress={() => markComplete(h.id)}
                    >
                      <Text style={styles.btnCompleteText}>
                        {updatingId === h.id ? "Updating..." : "Complete"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ width: 80, alignItems: "center" }}>
                    <TouchableOpacity style={styles.btnEye} onPress={() => onView(h)}>
                      <Feather name="eye" size={18} color="#2563eb" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* VIEW MODAL */}
      <Modal visible={viewModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Handover Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedHandover && (
              <ScrollView>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Receiver Name</Text>
                  <Text style={styles.infoValue}>{selectedHandover.receiver_name}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Amount</Text>
                  <Text style={styles.infoValue}>₹{selectedHandover.amount}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Handed By (ID)</Text>
                  <Text style={styles.infoValue}>{selectedHandover.handed_by}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Receiver ID</Text>
                  <Text style={styles.infoValue}>{selectedHandover.receiver}</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Handover Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedHandover.handover_date).toLocaleString()}
                  </Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setViewModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F1F5F9", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  circleBack: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  headerSub: { color: "#64748b", fontSize: 13 },
  btnExport: { flexDirection: "row", alignItems: "center", backgroundColor: "#334155", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnExportText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 13 },

  cardTable: { backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: "#e2e8f0", flex: 1, overflow: "hidden", elevation: 3 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  hCell: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tRow: { flexDirection: "row", paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  tCell: { fontSize: 13, color: "#475569" },

  btnComplete: { backgroundColor: "#28a745", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  btnCompleteText: { color: "#fff", fontWeight: "700" },

  btnEye: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "95%", maxWidth: 600, backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  infoCard: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  infoLabel: { fontSize: 10, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  infoValue: { fontSize: 15, color: "#1e293b", fontWeight: "600", marginTop: 2 },
  modalCloseBtn: { backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 12, marginTop: 15, alignItems: "center" },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});