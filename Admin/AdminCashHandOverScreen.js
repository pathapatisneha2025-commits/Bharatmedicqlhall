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
import { Ionicons,Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function AdminHandoverScreen() {
    const navigation = useNavigation();
  
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
          const [loadingCount, setLoadingCount] = useState(0);
const [viewModalVisible, setViewModalVisible] = useState(false);
const [selectedHandover, setSelectedHandover] = useState(null);


          const { width: SCREEN_WIDTH } = useWindowDimensions();
            const MAX_WIDTH = 420;
            const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
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
                        interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
                      } else clearInterval(interval);
                      return () => clearInterval(interval);
                    }, [loading]);
  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/deliveryboy/handover/all"
      );
      const data = await res.json();

      const formatted = (data.handovers || []).map((h) => ({
        id: h.id,
        deliveryboy: h.deliveryboy_id,
        date: h.date,
        total_cash: Number(h.total_cash),
        total_digital: Number(h.total_digital),
        total: Number(h.total_cash) + Number(h.total_digital),
        cash_returned: Number(h.cash_returned),
        created_at: h.created_at,
      }));

      setHandovers(formatted);
    } catch (err) {
      console.error("Handover fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
const onView = (handover) => {
  setSelectedHandover(handover);
  setViewModalVisible(true);
};
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `'${day}/${month}/${year}`; // 👈 force TEXT
};


const generateCSV = () => {
  const headers = [
    "ID",
    "Delivery Boy ID",
    "Date",
    "Cash",
    "Digital",
    "Total",
    "Returned",
    "Created Time",
  ];

 const rows = handovers.map(h => [
  h.id,
  h.deliveryboy,
  formatDate(h.date),
  h.total_cash,
  h.total_digital,
  h.total,
  h.cash_returned,
  `'${new Date(h.created_at).toLocaleString()}`, // force text
]);


  return [headers, ...rows]
    .map(row => row.join(","))
    .join("\n");
};




const downloadCSV = async () => {
  const csv = generateCSV();
  const fileName = `handover_report_${Date.now()}.csv`;

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
    try {
      const FileSystem = await import("expo-file-system");
      const Sharing = await import("expo-sharing");

      const path = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(path);
    } catch (err) {
     showAlert("Error", "Unable to export CSV");
    }
  }
};


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ color: "#2563eb", marginTop: 8 }}>
          Loading handovers{loadingCount}s
        </Text>
      </View>
    );
  }
return (
    <SafeAreaView style={styles.mainContainer}>
      {/* HEADER SECTION */}
      <View style={styles.headerArea}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Handover Logs</Text>
            <Text style={styles.headerSub}>Manage delivery boy collections</Text>
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
          <View style={{ minWidth: isWeb ? "100%" : 1000 }}>
            {/* HEADER ROW */}
            <View style={styles.tableHeader}>
              <Text style={[styles.hCell, { width: 60 }]}>ID</Text>
              <Text style={[styles.hCell, { width: 100 }]}>DB ID</Text>
              <Text style={[styles.hCell, { width: 120 }]}>Date</Text>
              <Text style={[styles.hCell, { width: 100 }]}>Cash</Text>
              <Text style={[styles.hCell, { width: 100 }]}>Digital</Text>
              <Text style={[styles.hCell, { width: 110 }]}>Total Coll.</Text>
              <Text style={[styles.hCell, { width: 110 }]}>Returned</Text>
              <Text style={[styles.hCell, { width: 120 }]}>Timestamp</Text>
              <Text style={[styles.hCell, { width: 80, textAlign: "center" }]}>View</Text>
            </View>

            {/* BODY ROWS */}
            <ScrollView>
              {handovers.map((h, index) => (
                <View key={h.id} style={[styles.tRow, index % 2 !== 0 && { backgroundColor: "#f8fafc" }]}>
                  <Text style={[styles.tCell, { width: 60, fontWeight: "700" }]}>#{h.id}</Text>
                  <Text style={[styles.tCell, { width: 100 }]}>{h.deliveryboy}</Text>
                  <Text style={[styles.tCell, { width: 120 }]}>
                    {new Date(h.date).toISOString().split("T")[0]}
                  </Text>
                  <Text style={[styles.tCell, { width: 100 }]}>₹{h.total_cash}</Text>
                  <Text style={[styles.tCell, { width: 100 }]}>₹{h.total_digital}</Text>
                  <Text style={[styles.tCell, { width: 110, fontWeight: "700", color: "#1e293b" }]}>
                    ₹{h.total}
                  </Text>
                  <Text style={[styles.tCell, { width: 110, color: "#dc2626" }]}>₹{h.cash_returned}</Text>
                  <Text style={[styles.tCell, { width: 120 }]}>
                    {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
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
              <Text style={styles.modalTitle}>Collection Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedHandover && (
              <ScrollView>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Delivery Agent ID</Text>
                  <Text style={styles.infoValue}>{selectedHandover.deliveryboy}</Text>
                </View>

                <View style={styles.splitRow}>
                  <View style={[styles.infoCard, { flex: 1 }]}>
                    <Text style={styles.infoLabel}>Cash Coll.</Text>
                    <Text style={styles.infoValue}>₹{selectedHandover.total_cash}</Text>
                  </View>
                  <View style={[styles.infoCard, { flex: 1 }]}>
                    <Text style={styles.infoLabel}>Digital Coll.</Text>
                    <Text style={styles.infoValue}>₹{selectedHandover.total_digital}</Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Total Amount</Text>
                  <Text style={[styles.infoValue, { color: "#2563eb", fontSize: 18 }]}>
                    ₹{selectedHandover.total}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Cash Returned</Text>
                  <Text style={[styles.infoValue, { color: "#dc2626" }]}>
                    ₹{selectedHandover.cash_returned}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Log Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedHandover.date).toDateString()}
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

  headerArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, marginTop: 10 },
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
  btnEye: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "95%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  infoCard: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  infoLabel: { fontSize: 10, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  infoValue: { fontSize: 15, color: "#1e293b", fontWeight: "600", marginTop: 2 },
  splitRow: { flexDirection: "row", gap: 10 },
  modalCloseBtn: { backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 12, marginTop: 15, alignItems: "center" },
  modalCloseText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});