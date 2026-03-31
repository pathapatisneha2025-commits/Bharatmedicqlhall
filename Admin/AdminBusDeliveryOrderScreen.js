import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
   Linking,
    useWindowDimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons ,Feather} from "@expo/vector-icons";

export default function AdminBusDeliveredOrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
          const [loadingCount, setLoadingCount] = useState(0);

  // Popup States
  const [showPopup, setShowPopup] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const fetchBusOrders = async () => {
    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/order-medicine/delivered-by-bus"
      );

      const data = await response.json();
      setOrders(data.busDeliveredOrders || []);
    } catch (error) {
      console.log("Fetch Bus Orders Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusOrders();
  }, []);

  const handleUpdateBusDelivery = async (orderId, updatedData) => {
  try {
    const res = await fetch(
      `https://hospitaldatabasemanagement.onrender.com/order-medicine/update-bus-delivery/${orderId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      }
    );

    const result = await res.json();

    if (res.ok) {
     showAlert("Success", "Order updated successfully");
      fetchBusOrders(); // reload
    } else {
      showAlert("Error", result.error || "Update failed");
    }
  } catch (err) {
    console.log("Update Error:", err);
   showAlert("Error", "Something went wrong");
  }
};
const exportBusOrders = () => {
  const url =
    "https://hospitaldatabasemanagement.onrender.com/order-medicine/bus/export";

 showAlert(
    "Export Bus Orders",
    "Your file will download in your browser.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) },
    ]
  );
};


const handleDelete = async (orderId) => {
 showAlert(
    "Delete Order",
    "Are you sure you want to delete this order?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `https://hospitaldatabasemanagement.onrender.com/order-medicine/delete/${orderId}`,
              { method: "DELETE" }
            );

            const result = await res.json();

            if (res.ok) {
             showAlert("Success", "Order deleted successfully");
              fetchBusOrders(); // Refresh table
            } else {
              showAlert("Error", result.error || "Delete failed");
            }
          } catch (err) {
            console.log("Delete Error:", err);
           showAlert("Error", "Something went wrong");
          }
        },
      },
    ]
  );
};

 const DetailsPopup = () => {
    if (!showDetails || !selectedOrder) return null;
    const bus = selectedOrder.busdetails || {};
    const items = selectedOrder.order_summary || [];

    return (
      <View style={styles.popupOverlay}>
        <View style={styles.detailsBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.detailsTitle}>Order Information</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 350 }}>
            <View style={styles.modalDetailCard}>
              <Text style={styles.detailLabel}>Order ID</Text>
              <Text style={styles.detailValue}>#{selectedOrder.id}</Text>
            </View>
            <View style={styles.modalDetailCard}>
              <Text style={styles.detailLabel}>Bus Name</Text>
              <Text style={styles.detailValue}>{bus.busName || "-"}</Text>
            </View>
            <View style={styles.modalDetailCard}>
              <Text style={styles.detailLabel}>Driver Name</Text>
              <Text style={styles.detailValue}>{bus.driverName || "-"}</Text>
            </View>
            <Text style={styles.sectionHeading}>Items Ordered</Text>
            {items.map((i, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Feather name="package" size={14} color="#94a3b8" />
                <Text style={styles.itemText}>{i.name} (x{i.quantity})</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
              onPress={() => {
                handleUpdateBusDelivery(selectedOrder.id, {
                  deliveryType: "bus",
                  busDetails: {
                    busName: selectedOrder?.busdetails?.busName || "RTC Express",
                    driverName: selectedOrder?.busdetails?.driverName || "Ramu",
                    arrivalTime: selectedOrder?.busdetails?.arrivalTime || "7:30 PM",
                  },
                });
                setShowDetails(false);
              }}
            >
              <Feather name="edit-3" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
              onPress={() => {
                setShowDetails(false);
                handleDelete(selectedOrder.id);
              }}
            >
              <Feather name="trash-2" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: "#64748b" }}>Loading orders... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <DetailsPopup />

      {/* HEADER SECTION */}
      <View style={styles.contentHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.mainTitle}>Bus Shipments</Text>
            <Text style={styles.subTitle}>Track and manage medicine bus deliveries</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={exportBusOrders}>
          <Feather name="download" size={18} color="#fff" />
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* TABLE CARD */}
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={!isWeb}>
          <View style={{ minWidth: isWeb ? "100%" : 1000 }}>
            {/* TABLE HEADER */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, { width: 80 }]}>ID</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Patient</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Payment</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>Items Summary</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>Total</Text>
              <Text style={[styles.headerCell, { width: 140 }]}>Bus Name</Text>
              <Text style={[styles.headerCell, { width: 140 }]}>Driver</Text>
              <Text style={[styles.headerCell, { width: 100, textAlign: "center" }]}>View</Text>
            </View>

            {/* TABLE BODY */}
            <ScrollView>
              {orders.map((item, index) => {
                const bus = item.busdetails || {};
                const items = item.order_summary || [];
                return (
                  <View key={item.id} style={[styles.bodyRow, index % 2 !== 0 && { backgroundColor: "#f8fafc" }]}>
                    <Text style={[styles.bodyCell, { width: 80, fontWeight: "600" }]}>#{item.id}</Text>
                    <Text style={[styles.bodyCell, { width: 120 }]}>{item.patient_id}</Text>
                    <Text style={[styles.bodyCell, { width: 120 }]}>{item.payment_method}</Text>
                    <Text style={[styles.bodyCell, { width: 200 }]} numberOfLines={1}>
                      {items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                    </Text>
                    <Text style={[styles.bodyCell, { width: 100, fontWeight: "700", color: "#0f172a" }]}>₹{item.total}</Text>
                    <Text style={[styles.bodyCell, { width: 140 }]}>{bus.busName || "-"}</Text>
                    <Text style={[styles.bodyCell, { width: 140 }]}>{bus.driverName || "-"}</Text>
                    <View style={{ width: 100, alignItems: "center" }}>
                      <TouchableOpacity
                        style={styles.viewIconCircle}
                        onPress={() => {
                          setSelectedOrder(item);
                          setShowDetails(true);
                        }}
                      >
                        <Feather name="eye" size={18} color="#2563eb" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC", padding: 20 },
  contentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25, marginTop: Platform.OS === 'ios' ? 40 : 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  mainTitle: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", fontSize: 13, marginTop: 2 },
  exportBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  exportBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 14 },

  tableCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", flex: 1, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f1f5f9", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  bodyRow: { flexDirection: "row", paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  bodyCell: { fontSize: 14, color: "#475569" },
  viewIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  popupOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  detailsBox: { width: "90%", maxWidth: 450, backgroundColor: "#fff", padding: 24, borderRadius: 20, elevation: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  detailsTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  modalDetailCard: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  detailLabel: { fontSize: 11, color: "#64748b", fontWeight: "700", textTransform: "uppercase", marginBottom: 2 },
  detailValue: { fontSize: 15, color: "#1e293b", fontWeight: "600" },
  sectionHeading: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginTop: 15, marginBottom: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 5 },
  itemText: { fontSize: 14, color: "#475569" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 25 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, gap: 8 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  closeBtn: { marginTop: 12, paddingVertical: 12, alignItems: "center", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  closeText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
});