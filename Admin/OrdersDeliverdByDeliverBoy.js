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
   Linking
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDeliveryBoyOrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    amount_received: "",
    payment_status: "",
  });

  const fetchDeliveryBoyOrders = async () => {
    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/order-medicine/deliveredby-delivryboy"
      );

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.log("Fetch Delivery Boy Orders Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoyOrders();
  }, []);

  // =======================
  //   DELETE ORDER
  // =======================
  const handleDelete = async (orderId) => {
    Alert.alert("Delete Order", "Are you sure you want to delete this order?", [
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
              Alert.alert("Success", "Order deleted successfully");

              setOrders((prev) => prev.filter((o) => o.id !== orderId));
            } else {
              Alert.alert("Error", data.message || "Failed to delete");
            }
          } catch (error) {
            console.log("Delete Error:", error);
            Alert.alert("Error", "Something went wrong");
          }
        },
      },
    ]);
  };
  const exportDeliveryBoyOrders = () => {
  const url =
    "https://hospitaldatabasemanagement.onrender.com/order-medicine/export-deliveryboy";

  Alert.alert(
    "Export Orders",
    "Your export file will start downloading.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Download",
        onPress: () => {
          Linking.openURL(url);
        },
      },
    ]
  );
};


  // =======================
  //        UPDATE ORDER
  // =======================
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
        Alert.alert("Updated", "Order updated successfully");

        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id ? { ...o, ...editData } : o
          )
        );

        setShowEditModal(false);
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (error) {
      console.log("Update Error:", error);
      Alert.alert("Error", "Something went wrong during update");
    }
  };
  if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );

  // =======================
  // VIEW DETAILS POPUP
  // =======================
  const DetailsPopup = () => {
    if (!showDetails || !selectedOrder) return null;

    const items = selectedOrder.order_summary || [];
    const boy = selectedOrder.deliveryboydetails || {};
    const address = selectedOrder.address || {};

    return (
      <View style={styles.popupOverlay}>
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Order Details</Text>

          <ScrollView style={{ maxHeight: 400 }}>
            <Text style={styles.detailLine}>Order ID: {selectedOrder.id}</Text>
            <Text style={styles.detailLine}>
              Patient ID: {selectedOrder.patient_id}
            </Text>

            <Text style={styles.detailLine}>
              Payment Method: {selectedOrder.payment_method}
            </Text>
            <Text style={styles.detailLine}>
              Payment Mode: {selectedOrder.payment_mode}
            </Text>
            <Text style={styles.detailLine}>
              Payment Status: {selectedOrder.payment_status}
            </Text>
            <Text style={styles.detailLine}>
              Amount Received: ₹{selectedOrder.amount_received}
            </Text>
            <Text style={styles.detailLine}>
              Payment Collected At:{" "}
              {selectedOrder.payment_collected_at?.substring(0, 10)}
            </Text>

            <Text style={styles.detailLine}>
              Delivery Boy: {boy.name || "-"}
            </Text>
            <Text style={styles.detailLine}>
              Phone: {boy.mobile || "-"}
            </Text>

            <Text style={styles.detailLine}>
              Delivery Type: {selectedOrder.deliverytype}
            </Text>

            <Text style={[styles.detailLine, { fontWeight: "700" }]}>
              Address:
            </Text>
            <Text style={styles.itemLine}>Name: {address.name}</Text>
            <Text style={styles.itemLine}>Phone: {address.mobile}</Text>
            <Text style={styles.itemLine}>
              {address.flat}, {address.street}, {address.city}
            </Text>
            <Text style={styles.itemLine}>Pincode: {address.pincode}</Text>

            <Text style={[styles.detailLine, { fontWeight: "700" }]}>
              Items:
            </Text>
            {items.map((i, idx) => (
              <Text key={idx} style={styles.itemLine}>
                • {i.name} – ₹{i.price} (x{i.quantity})
              </Text>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#28a745" }]}
              onPress={() => {
                setShowDetails(false);
                setEditData({
                  amount_received: selectedOrder.amount_received || "",
                  payment_status: selectedOrder.payment_status || "",
                });
                setShowEditModal(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#d9534f" }]}
              onPress={() => {
                setShowDetails(false);
                handleDelete(selectedOrder.id);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowDetails(false)}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // =======================
  // EDIT MODAL
  // =======================
  const EditModal = () => {
    if (!showEditModal || !selectedOrder) return null;

    return (
      <View style={styles.popupOverlay}>
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Edit Order</Text>

          <Text style={styles.inputLabel}>Amount Received</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="Enter amount"
            keyboardType="numeric"
            value={editData.amount_received.toString()}
            onChangeText={(v) =>
              setEditData({ ...editData, amount_received: v })
            }
          />

          <Text style={styles.inputLabel}>Payment Status</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="Paid / Pending"
            value={editData.payment_status}
            onChangeText={(v) =>
              setEditData({ ...editData, payment_status: v })
            }
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#28a745" }]}
              onPress={handleUpdate}
            >
              <Ionicons name="checkmark-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#d9534f" }]}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // =======================
  // MAIN UI
  // =======================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>No Delivery Boy Orders Found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#eef2f5" }}>
      <DetailsPopup />
      <EditModal />

      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topHeaderText}>DeliveryBoyOrders</Text>
        <TouchableOpacity
  onPress={exportDeliveryBoyOrders}
  style={{ marginLeft: "auto" }}
>
  <Ionicons name="download-outline" size={26} color="#fff" />
</TouchableOpacity>

      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerText]}>Order ID</Text>
            <Text style={[styles.cell, styles.headerText]}>Patient</Text>
            <Text style={[styles.cell, styles.headerText]}>Payment</Text>
            <Text style={[styles.cell, styles.headerText]}>Items</Text>
            <Text style={[styles.cell, styles.headerText]}>Total</Text>
            <Text style={[styles.cell, styles.headerText]}>Delivery Boy</Text>
            <Text style={[styles.cell, styles.headerText]}>Action</Text>
          </View>

          {orders.map((item, index) => {
            const items = item.order_summary || [];

            return (
              <View
                style={[
                  styles.row,
                  index % 2 === 0 ? styles.evenRow : styles.oddRow,
                ]}
                key={item.id}
              >
                <Text style={styles.cell}>{item.id}</Text>
                <Text style={styles.cell}>{item.patient_id}</Text>
                <Text style={styles.cell}>{item.payment_method}</Text>

                <Text style={styles.cell}>
                  {items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                </Text>

                <Text style={styles.cell}>₹{item.subtotal}</Text>
                <Text style={styles.cell}>{item.deliveryboy_name || "-"}</Text>

                <TouchableOpacity
                  style={[styles.cell]}
                  onPress={() => {
                    setSelectedOrder(item);
                    setShowDetails(true);
                  }}
                >
                  <Ionicons name="eye-outline" size={26} color="#007aff" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007aff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 4,
    marginTop: 30,
  },
  topHeaderText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 12,
  },

  tableContainer: {
    backgroundColor: "#fff",
    margin: 14,
    borderRadius: 10,
    paddingBottom: 10,
    overflow: "hidden",
    elevation: 3,
  },
  headerRow: { backgroundColor: "#007aff" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.8,
    borderColor: "#e2e2e2",
  },

  evenRow: { backgroundColor: "#f8f9fb" },
  oddRow: { backgroundColor: "#fff" },

  cell: {
    width: 140,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },

  headerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  detailsBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#007aff",
  },
  detailLine: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  itemLine: {
    fontSize: 15,
    marginLeft: 10,
    marginBottom: 4,
    color: "#444",
  },
  closeBtn: {
    marginTop: 15,
    backgroundColor: "#007aff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 6,
    fontWeight: "600",
  },

  inputLabel: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 10,
  },
});
