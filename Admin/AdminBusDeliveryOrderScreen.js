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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminBusDeliveredOrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popup States
  const [showPopup, setShowPopup] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      Alert.alert("Success", "Order updated successfully");
      fetchBusOrders(); // reload
    } else {
      Alert.alert("Error", result.error || "Update failed");
    }
  } catch (err) {
    console.log("Update Error:", err);
    Alert.alert("Error", "Something went wrong");
  }
};
const exportBusOrders = () => {
  const url =
    "https://hospitaldatabasemanagement.onrender.com/order-medicine/bus/export";

  Alert.alert(
    "Export Bus Orders",
    "Your file will download in your browser.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) },
    ]
  );
};


const handleDelete = async (orderId) => {
  Alert.alert(
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
              Alert.alert("Success", "Order deleted successfully");
              fetchBusOrders(); // Refresh table
            } else {
              Alert.alert("Error", result.error || "Delete failed");
            }
          } catch (err) {
            console.log("Delete Error:", err);
            Alert.alert("Error", "Something went wrong");
          }
        },
      },
    ]
  );
};

  //------------------------------------------------------
  // DETAILED VIEW POPUP
  //------------------------------------------------------
  const DetailsPopup = () => {
    if (!showDetails || !selectedOrder) return null;

    const bus = selectedOrder.busdetails || {};
    const items = selectedOrder.order_summary || [];

    return (
      <View style={styles.popupOverlay}>
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Order Details</Text>

          <ScrollView style={{ maxHeight: 350 }}>
            <Text style={styles.detailLine}>Order ID: {selectedOrder.id}</Text>
            <Text style={styles.detailLine}>Patient ID: {selectedOrder.patient_id}</Text>
            <Text style={styles.detailLine}>Payment: {selectedOrder.payment_method}</Text>
            <Text style={styles.detailLine}>Total: ₹{selectedOrder.total}</Text>

            <Text style={styles.detailLine}>Bus Name: {bus.busName || "-"}</Text>
<Text style={styles.detailLine}>
  Driver Name: {selectedOrder?.busdetails?.driverName ?? "-"}
</Text>


            <Text style={[styles.detailLine, { fontWeight: "700" }]}>Items:</Text>

            {items.map((i, idx) => (
              <Text key={idx} style={styles.itemLine}>
                • {i.name} (x{i.quantity})
              </Text>
            ))}
          </ScrollView>

        <View style={styles.actionRow}>

  {/* EDIT */}
  <TouchableOpacity
    style={[styles.actionBtn, { backgroundColor: "#5cb85c" }]}
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
    <Ionicons name="create-outline" size={18} color="#fff" />
    <Text style={styles.actionBtnText}>Edit</Text>
  </TouchableOpacity>

  {/* DELETE */}
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

        {/* CLOSE */}
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



   if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>No Bus Delivery Orders Found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#eef2f5" }}>
    
      <DetailsPopup />

      {/* HEADER */}
<View style={styles.topHeader}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={26} color="#fff" />
  </TouchableOpacity>
  <Text style={styles.topHeaderText}>BusDeliveredOrders</Text>
   <TouchableOpacity style={styles.exportBtn} onPress={exportBusOrders}>
    <Ionicons name="download-outline" size={20} color="#fff" />
    <Text style={styles.exportBtnText}>Export</Text>
  </TouchableOpacity>
</View>





      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* HEADER ROW */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerText]}>Order ID</Text>
            <Text style={[styles.cell, styles.headerText]}>Patient</Text>
            <Text style={[styles.cell, styles.headerText]}>Payment</Text>
            <Text style={[styles.cell, styles.headerText]}>Items</Text>
            <Text style={[styles.cell, styles.headerText]}>Total</Text>
            <Text style={[styles.cell, styles.headerText]}>Bus</Text>
            <Text style={[styles.cell, styles.headerText]}>Driver</Text>
            <Text style={[styles.cell, styles.headerText]}>Action</Text>
          </View>

          {/* TABLE ROWS */}
          {orders.map((item, index) => {
            const bus = item.busdetails || {};
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

                <Text style={styles.cell}>₹{item.total}</Text>
                <Text style={styles.cell}>{bus.busName || "-"}</Text>
                <Text style={styles.cell}>{bus.driverName || "-"}</Text>

              {/* ACTION – DIRECT VIEW */}
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

//------------------------------------------------------
// STYLES
//------------------------------------------------------
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

  // POPUP STYLES
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
 exportRow: {
  flexDirection: "row",
  justifyContent: "flex-end",
  paddingHorizontal: 16,
  paddingVertical: 10,
},

exportBtn: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#007aff",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 8,
  elevation: 3,
},

exportBtnText: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "600",
  marginLeft: 6,
},


  // DETAILS POPUP
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

});
