import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";

const API_URL = "https://hospitaldatabasemanagement.onrender.com/order-medicine/all";
const UPDATE_STATUS_URL =
  "https://hospitaldatabasemanagement.onrender.com/order-medicine/update-status";

const ManageOrdersScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update Order Status
  const updateOrderStatus = async (orderId, status) => {
    try {
      setLoading(true);
      const res = await fetch(UPDATE_STATUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("✅ Success", data.message || `Order marked as ${status}`);
        fetchOrders();
      } else {
        Alert.alert("❌ Error", data.error || "Failed to update status");
      }
    } catch {
      Alert.alert("Error", "Something went wrong while updating order status.");
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(
    (order) =>
      order.address?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.status?.toLowerCase().includes(search.toLowerCase())
  );

  // Preview modal
  const previewOrder = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Delete (local demo)
  const deleteOrder = (id) => {
    Alert.alert("Confirm Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setOrders((prev) => prev.filter((o) => o.id !== id));
          Alert.alert("Deleted", "Order deleted successfully!");
        },
      },
    ]);
  };

  // Render each row
  const renderRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.colSmall]}>{index + 1}</Text>
      <Text
        style={[
          styles.cell,
          styles.colMedium,
          item.status === "processing"
            ? styles.statusProcessing
            : item.status === "cancelled"
            ? styles.statusCancelled
            : item.status === "inprogress"
            ? styles.statusInProgress
            : item.status === "delivered"
            ? styles.statusDelivered
            : styles.statusDefault,
        ]}
      >
        {item.status}
      </Text>
      <Text style={[styles.cell, styles.colLarge]}>{item.address?.name}</Text>
      <Text style={[styles.cell, styles.colMedium]}>{item.address?.mobile}</Text>
      <Text style={[styles.cell, styles.colXLarge]} numberOfLines={2}>
        {item.address?.flat}, {item.address?.street}, {item.address?.landmark},{" "}
        {item.address?.city}, {item.address?.state} - {item.address?.pincode}
      </Text>
      <Text style={[styles.cell, styles.colMedium]}>{item.payment_method}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.subtotal}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.tax}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.delivery_fee}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.total}</Text>
      <Text style={[styles.cell, styles.colMedium]}>
        {new Date(item.expected_delivery).toLocaleDateString()}
      </Text>
      <Text style={[styles.cell, styles.colLarge]} numberOfLines={2}>
        {item.order_summary?.map((m) => `${m.name} x${m.quantity}`).join(", ")}
      </Text>

      <View style={[styles.cell, styles.colLarge, styles.statusBtnsContainer]}>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: "#ff9800" }]}
          onPress={() => updateOrderStatus(item.id, "inprogress")}
        >
          <Text style={styles.statusBtnText}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: "#4caf50" }]}
          onPress={() => updateOrderStatus(item.id, "delivered")}
        >
          <Text style={styles.statusBtnText}>Delivered</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: "#f44336" }]}
          onPress={() => updateOrderStatus(item.id, "cancelled")}
        >
          <Text style={styles.statusBtnText}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.cell, styles.colSmall, styles.actionCell]}>
        <TouchableOpacity onPress={() => previewOrder(item)}>
          <FontAwesome name="eye" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteOrder(item.id)}>
          <Icon name="delete" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff", marginTop: 10, padding: 10 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Manage Orders</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by patient name or status"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearch("")}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <ScrollView horizontal>
          <View style={{ flex: 1 }}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.headerCell, styles.colSmall]}>#</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Status</Text>
              <Text style={[styles.headerCell, styles.colLarge]}>Name</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Mobile</Text>
              <Text style={[styles.headerCell, styles.colXLarge]}>Address</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Payment</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Subtotal</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Tax</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Delivery</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Total</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Delivery Date</Text>
              <Text style={[styles.headerCell, styles.colLarge]}>Medicines</Text>
              <Text style={[styles.headerCell, styles.colLarge]}>Update Status</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Actions</Text>
            </View>

            <FlatList
              data={filteredOrders}
              renderItem={renderRow}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>📦 Order Details</Text>
              <Text style={styles.modalText}>Order ID: {selectedOrder?.id}</Text>
              <Text style={styles.modalText}>Patient: {selectedOrder?.address?.name}</Text>
              <Text style={styles.modalText}>Mobile: {selectedOrder?.address?.mobile}</Text>
              <Text style={styles.modalText}>
                Address: {selectedOrder?.address?.flat}, {selectedOrder?.address?.street},{" "}
                {selectedOrder?.address?.landmark}, {selectedOrder?.address?.city},{" "}
                {selectedOrder?.address?.state} - {selectedOrder?.address?.pincode}
              </Text>
              <Text style={styles.modalText}>Payment: {selectedOrder?.payment_method}</Text>
              <Text style={styles.modalText}>Status: {selectedOrder?.status}</Text>
              <Text style={styles.modalText}>
                Expected Delivery: {new Date(selectedOrder?.expected_delivery).toDateString()}
              </Text>
              <Text style={styles.modalText}>Subtotal: ₹{selectedOrder?.subtotal}</Text>
              <Text style={styles.modalText}>Tax: ₹{selectedOrder?.tax}</Text>
              <Text style={styles.modalText}>Delivery Fee: ₹{selectedOrder?.delivery_fee}</Text>
              <Text style={styles.modalText}>Total: ₹{selectedOrder?.total}</Text>

              <Text style={styles.modalSubtitle}>💊 Medicines:</Text>
              {selectedOrder?.order_summary?.map((m, i) => (
                <Text key={i} style={styles.modalText}>
                  • {m.name} × {m.quantity} (₹{m.price})
                </Text>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold", marginLeft: 16,marginTop:20 },

  searchContainer: { marginBottom: 10, flexDirection: "row", alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    flex: 1,
  },
  clearButton: {
    backgroundColor: "black",
    padding: 8,
    alignItems: "center",
    borderRadius: 5,
    marginLeft: 8,
  },
  clearText: { color: "#fff", fontWeight: "bold" },

  tableHeader: { backgroundColor: "#f1f1f1" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", alignItems: "center" },
  headerCell: { padding: 6, fontWeight: "bold", fontSize: 13, textAlign: "center" },
  cell: { padding: 6, fontSize: 12, textAlign: "center" },

  colSmall: { width: 80 },
  colMedium: { width: 140 },
  colLarge: { width: 220 },
  colXLarge: { width: 340 },

  statusProcessing: { color: "orange", fontWeight: "bold" },
  statusCancelled: { color: "red", fontWeight: "bold" },
  statusInProgress: { color: "#ff9800", fontWeight: "bold" },
  statusDelivered: { color: "#4caf50", fontWeight: "bold" },
  statusDefault: { color: "blue", fontWeight: "bold" },

  statusBtnsContainer: { flexDirection: "row", justifyContent: "space-around" },
  statusBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  statusBtnText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  actionCell: { flexDirection: "row", justifyContent: "space-around" },

  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  modalSubtitle: { fontSize: 18, fontWeight: "bold", marginTop: 15 },
  modalText: { fontSize: 15, marginVertical: 3 },
  closeButton: { backgroundColor: "#2196F3", padding: 12, borderRadius: 10, marginTop: 15 },
  closeButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: 16 },
});

export default ManageOrdersScreen;
