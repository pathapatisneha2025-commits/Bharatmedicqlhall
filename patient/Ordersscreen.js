// screens/OrdersAppointmentsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  BackHandler,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { getPatientId } from "../utils/storage";

const CANCEL_API = `https://hospitaldatabasemanagement.onrender.com/cancel-order/add`;

const cancelReasonsList = [
  "Ordered by mistake",
  "Product is not good",
  "Found better price",
  "Delivery delay",
  "Other",
];

// 🔹 Status Badge
const StatusButton = ({ status }) => {
  let bgColor = "#ccc";
  const statusLower = status?.toLowerCase();

  if (statusLower === "delivered" || statusLower === "completed") bgColor = "#28a745";
  else if (statusLower === "processing" || statusLower === "in transit") bgColor = "#ff9800";
  else if (statusLower === "upcoming") bgColor = "#2196f3";
  else if (statusLower === "cancelled") bgColor = "#dc3545";
  else if (statusLower === "pending") bgColor = "#ffc107";

  return (
    <View style={[styles.statusBox, { backgroundColor: bgColor }]}>
      <Text style={styles.statusText}>{status?.toUpperCase()}</Text>
    </View>
  );
};

// 🔹 Order Card
const OrderCard = ({ order, onCancel }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    let reason = selectedReason === "Other" ? customReason : selectedReason;
    if (!reason || !reason.trim()) {
      Alert.alert("Error", "Please select or enter a reason for cancellation.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(CANCEL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, reason }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        onCancel(order.id, data);
        setModalVisible(false);
        setSelectedReason("");
        setCustomReason("");
      } else {
        Alert.alert("Error", data.message || "Failed to cancel order");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
        const backAction = () => {
          // Instead of going back step by step, reset navigation to Sidebar/Home
          navigation.reset({
            index: 0,
            routes: [{ name: "bottomtab" }], // <-- replace with your sidebar/home screen name
          });
          return true; // prevents default back behavior
        };
      
        const backHandler = BackHandler.addEventListener(
          "hardwareBackPress",
          backAction
        );
      
        return () => backHandler.remove(); // clean up on unmount
      }, []);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.title}>Order #{order.id}</Text>
        <StatusButton status={order.status} />
      </View>

      <Text style={styles.date}>
        Ordered on: {new Date(order.created_at).toLocaleDateString()}{" "}
        {new Date(order.created_at).toLocaleTimeString()}
      </Text>

      <Text style={styles.subHeading}>Items:</Text>
      {order.order_summary?.map((item, index) => (
        <Text key={index} style={styles.itemText}>
          • {item.name} (x{item.quantity}) - ₹{item.price}
        </Text>
      ))}

      <Text style={styles.total}>Total: ₹{order.total}</Text>

      <Text style={styles.address}>
        Delivery Address: {order.address?.flat}, {order.address?.street},{" "}
        {order.address?.city}, {order.address?.state} - {order.address?.pincode}
      </Text>

      {["processing", "in transit"].includes(order.status.toLowerCase()) && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#dc3545" }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.actionText}>Cancel Order</Text>
        </TouchableOpacity>
      )}

      {/* Cancel Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Order</Text>

            <Text style={styles.modalLabel}>Select Reason:</Text>
            <Picker
              selectedValue={selectedReason}
              onValueChange={(itemValue) => setSelectedReason(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a reason..." value="" />
              {cancelReasonsList.map((reason, index) => (
                <Picker.Item key={index} label={reason} value={reason} />
              ))}
            </Picker>

            {selectedReason === "Other" && (
              <TextInput
                placeholder="Enter custom reason"
                value={customReason}
                onChangeText={setCustomReason}
                style={styles.input}
              />
            )}

            {loading ? (
              <ActivityIndicator size="small" color="#007bff" style={{ marginVertical: 10 }} />
            ) : (
              <View style={{ marginTop: 10 }}>
                <TouchableOpacity style={styles.submitButton} onPress={handleCancel}>
                  <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#aaa", marginTop: 6 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.submitText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Cancel info */}
      {order.status.toLowerCase() === "cancelled" && order.cancelled_at && (
        <Text style={styles.cancelInfo}>
          Cancelled At: {new Date(order.cancelled_at).toLocaleString()}
          {"\n"}
          Reason: {order.cancellation_reason || "N/A"}
        </Text>
      )}
    </View>
  );
};

// 🔹 Main Screen
export default function OrdersAppointmentsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const patientId = await getPatientId();
      if (!patientId) {
        Alert.alert("Error", "Patient ID not found in storage");
        setLoading(false);
        return;
      }

      const API_URL = `https://hospitaldatabasemanagement.onrender.com/order-medicine/patient/${patientId}`;
      const response = await fetch(API_URL);

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUpdate = (orderId, data) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              cancellation_reason: data.reason || "Customer cancelled",
            }
          : o
      )
    );
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header with Back Arrow */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>

        <Text style={styles.heading}>My Orders & Appointments</Text>

        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />
      ) : orders.length === 0 ? (
        <Text style={styles.noOrdersText}>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <OrderCard order={item} onCancel={handleCancelUpdate} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5", padding: 16, paddingTop: 40 },
  
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  
  heading: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 16, fontWeight: "600", color: "#222" },
  date: { fontSize: 13, color: "#666", marginBottom: 6 },
  subHeading: { fontSize: 15, fontWeight: "600", marginVertical: 6, color: "#444" },
  itemText: { fontSize: 14, color: "#333", marginVertical: 2 },
  total: { fontSize: 15, fontWeight: "bold", marginVertical: 8, color: "#111" },
  address: { fontSize: 13, color: "#666", marginBottom: 10 },
  statusBox: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  actionButton: { paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 6 },
  actionText: { color: "#fff", fontWeight: "600" },
  noOrdersText: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#777" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: { backgroundColor: "#fff", padding: 22, borderRadius: 14, width: "85%" },
  modalTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 12, color: "#222" },
  modalLabel: { marginBottom: 6, fontSize: 14, color: "#444" },
  picker: { marginBottom: 12, backgroundColor: "#f1f3f5", borderRadius: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "600" },
  cancelInfo: { marginTop: 8, fontSize: 12, color: "#555", fontStyle: "italic" },
});
