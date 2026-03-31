import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Linking,
  FlatList,
  Modal,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function AdminDeliveryBoyOrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingCount, setLoadingCount] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    amount_received: "",
    payment_status: "",
  });
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

  const fetchDeliveryBoyOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/order-medicine/deliveredby-delivryboy"
      );
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.log("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoyOrders();
  }, []);

  const filteredOrders = orders.filter(
    (item) =>
      item.id.toString().includes(search) ||
      (item.deliveryboy_name && item.deliveryboy_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (orderId) => {
    showAlert("Delete Order", "Are you sure you want to delete this order?", [
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
            const data = await res.json();
            if (data.success) {
              setOrders((prev) => prev.filter((o) => o.id !== orderId));
            }
          } catch (error) {
            showAlert("Error", "Something went wrong");
          }
        },
      },
    ]);
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/order-medicine/update/${selectedOrder.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        }
      );
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...editData } : o))
        );
        setShowEditModal(false);
       showAlert("Success", "Order updated");
      }
    } catch (error) {
      showAlert("Error", "Update failed");
    }
  };

  const exportDeliveryBoyOrders = () => {
    const url = "https://hospitaldatabasemanagement.onrender.com/order-medicine/export-deliveryboy";
    Linking.openURL(url);
  };
  const exportDeliveryBoyOrdersCSV = async () => {
  try {
    if (!filteredOrders.length) {
      showAlert("No Data", "No orders available to export");
      return;
    }

    // CSV headers
    const headers = [
      "Order ID",
      "Patient ID",
      "Payment Method",
      "Items",
      "Subtotal",
      "Amount Received",
      "Payment Status",
      "Delivery Boy",
    ];

    // CSV rows
    const rows = filteredOrders.map((o) => [
      o.id,
      o.patient_id,
      o.payment_method,
      (o.order_summary || [])
        .map((i) => `${i.name} x${i.quantity}`)
        .join(" | "),
      o.subtotal,
      o.amount_received || "",
      o.payment_status || "",
      o.deliveryboy_name || "",
    ]);

    // Build CSV string
    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    // WEB
    if (Platform.OS === "web") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `delivery_orders_${Date.now()}.csv`;
      link.click();

      URL.revokeObjectURL(url);
      return;
    }

    // MOBILE
    const fileUri = FileSystem.documentDirectory + "delivery_orders.csv";
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.log(error);
    showAlert("Error", "CSV export failed");
  }
};


  const renderRow = ({ item, index }) => (
    <View style={styles.tableBodyRow}>
      <Text style={[styles.bodyCell, { width: 80 }]}>#{item.id}</Text>
      <Text style={[styles.bodyCell, { width: 120, fontWeight: "600" }]}>{item.patient_id}</Text>
      <Text style={[styles.bodyCell, { width: 120 }]}>{item.payment_method}</Text>
      <Text style={[styles.bodyCell, { width: 180 }]} numberOfLines={1}>
        {(item.order_summary || []).map((i) => `${i.name} (x${i.quantity})`).join(", ")}
      </Text>
      <Text style={[styles.bodyCell, { width: 100, fontWeight: "700" }]}>₹{item.subtotal}</Text>
      <Text style={[styles.bodyCell, { width: 140 }]}>{item.deliveryboy_name || "-"}</Text>
      <View style={[styles.actionCellWeb, { width: 120 }]}>
        <TouchableOpacity 
          style={styles.iconCircle} 
          onPress={() => { setSelectedOrder(item); setShowDetails(true); }}
        >
          <Feather name="eye" size={16} color="#0ea5e9" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]} 
          onPress={() => handleDelete(item.id)}
        >
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.webWrapper}>
      <View style={styles.mainContent}>
        
        {/* HEADER SECTION */}
        <View style={styles.contentHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.mainTitle}>Delivery Records</Text>
              <Text style={styles.subTitle}>Manage and track delivery boy order history</Text>
            </View>
          </View>
<TouchableOpacity
  onPress={exportDeliveryBoyOrdersCSV}
  style={styles.exportBtn}
>
  <Feather name="download" size={20} color="#fff" />
  <Text style={styles.exportBtnText}>Export CSV</Text>
</TouchableOpacity>

        </View>

        {/* TABLE CARD */}
        <View style={styles.tableCard}>
          <View style={styles.cardTop}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInputWeb}
                placeholder="Search by ID or Delivery Boy..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loaderText}>Loading Records...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.headerCell, { width: 80 }]}>Order ID</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Patient</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Payment</Text>
                  <Text style={[styles.headerCell, { width: 180 }]}>Items</Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>Total</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Delivery Boy</Text>
                  <Text style={[styles.headerCell, { width: 120, textAlign: 'center' }]}>Actions</Text>
                </View>
                <FlatList
                  data={filteredOrders}
                  renderItem={renderRow}
                  keyExtractor={(item) => item.id.toString()}
                  ListEmptyComponent={<Text style={{padding: 20, textAlign: 'center'}}>No Records Found</Text>}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* VIEW DETAILS MODAL */}
      <Modal visible={showDetails} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Information</Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {selectedOrder && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.detailRow}>
                   <Feather name="hash" size={16} color="#2563eb" style={{marginRight: 12}} />
                   <View><Text style={styles.detailLabel}>Order ID</Text><Text style={styles.detailValue}>{selectedOrder.id}</Text></View>
                </View>
                <View style={styles.detailRow}>
                   <Feather name="credit-card" size={16} color="#2563eb" style={{marginRight: 12}} />
                   <View><Text style={styles.detailLabel}>Payment Method</Text><Text style={styles.detailValue}>{selectedOrder.payment_method}</Text></View>
                </View>
                <View style={styles.detailRow}>
                   <Feather name="dollar-sign" size={16} color="#2563eb" style={{marginRight: 12}} />
                   <View><Text style={styles.detailLabel}>Amount Received</Text><Text style={styles.detailValue}>₹{selectedOrder.amount_received}</Text></View>
                </View>
                <View style={styles.detailRow}>
                   <Feather name="truck" size={16} color="#2563eb" style={{marginRight: 12}} />
                   <View><Text style={styles.detailLabel}>Delivery Boy</Text><Text style={styles.detailValue}>{selectedOrder.deliveryboy_name || "-"}</Text></View>
                </View>
              </ScrollView>
            )}
            <View style={styles.modalActions}>
               <TouchableOpacity 
                 style={styles.saveBtn} 
                 onPress={() => {
                   setEditData({ amount_received: selectedOrder.amount_received || "", payment_status: selectedOrder.payment_status || "" });
                   setShowDetails(false);
                   setShowEditModal(true);
                 }}
               >
                 <Text style={styles.saveBtnText}>Edit Payment</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.cancelBtnWeb} onPress={() => setShowDetails(false)}>
                 <Text style={styles.cancelBtnText}>Close</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Payment</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Feather name="dollar-sign" size={18} color="#2563eb" />
              <TextInput 
                style={styles.inputWeb} 
                placeholder="Amount Received" 
                value={editData.amount_received.toString()} 
                onChangeText={(t) => setEditData({...editData, amount_received: t})} 
              />
            </View>
            <View style={styles.inputGroup}>
              <Feather name="info" size={18} color="#2563eb" />
              <TextInput 
                style={styles.inputWeb} 
                placeholder="Payment Status" 
                value={editData.payment_status} 
                onChangeText={(t) => setEditData({...editData, payment_status: t})} 
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtnWeb} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  mainContent: { flex: 1, padding: 24 },
  contentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2 },
  mainTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4 },
  exportBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#10b981", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  exportBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8 },

  tableCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", flex: 1, overflow: "hidden" },
  cardTop: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 16, width: 350 },
  searchInputWeb: { paddingVertical: 10, marginLeft: 10, flex: 1 },

  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableBodyRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  bodyCell: { fontSize: 14, color: "#334155" },
  actionCellWeb: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0f9ff", justifyContent: "center", alignItems: "center" },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#64748b" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: "90%", maxWidth: 500, borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  modalScroll: { marginBottom: 20 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, backgroundColor: "#f8fafc", padding: 12, borderRadius: 8 },
  detailLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  detailValue: { fontSize: 15, color: "#1e293b", fontWeight: "600" },
  inputGroup: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: "#f8fafc" },
  inputWeb: { flex: 1, height: 45, marginLeft: 10 },
  modalActions: { flexDirection: "row", gap: 12 },
  saveBtn: { flex: 2, backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtnWeb: { flex: 1, backgroundColor: "#f1f5f9", padding: 14, borderRadius: 10, alignItems: "center" },
  cancelBtnText: { color: "#475569", fontWeight: "700" },
});