import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";

const API_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function PickerDashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Store picked qty per order
  const [pickedData, setPickedData] = useState({});

  // FETCH ORDERS
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/salesorders/all`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
      else setOrders([]);
    } catch (e) {
      console.log("ERROR:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update picked qty locally
  const updatePickedQty = (orderId, index, qty) => {
    setPickedData((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [index]: qty },
    }));
  };

  // SEND PICKED ITEMS + UPDATE STATUS
  const sendToChecker = async (order) => {
    const pickedItems = order.items.map((item, index) => ({
      item_name: item.item_name,
      quantity: item.quantity,
      picked_qty:
        pickedData?.[order.id]?.[index] !== undefined
          ? Number(pickedData[order.id][index])
          : 0,
    }));

    // Validate
    for (let p of pickedItems) {
      if (!p.picked_qty || p.picked_qty === 0) {
        Alert.alert("Error", "Enter picked qty for all items.");
        return;
      }
    }

   try {
  const res = await fetch(`${API_URL}/picker/mark-as-picked`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: order.id,
      picked_items: pickedItems,
      status: "Picked"
    }),
  });

      const data = await res.json();

      if (data.success) {
        Alert.alert("Success", "Order sent to Checker!");
        fetchOrders();

     
      } else {
        Alert.alert("Error", data.error || "Failed to send");
      }
    } catch (e) {
      Alert.alert("Error", "Server error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "orange";
      case "Picked":
        return "#1565c0";
      case "Checked":
        return "green";
      case "Cancelled":
        return "red";
      default:
        return "black";
    }
  };

  // RENDER ORDER
  const renderOrder = ({ item }) => {
    const itemsArray = Array.isArray(item.items) ? item.items : [];

    const grandTotal = itemsArray.reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
      0
    );
if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );
    return (
      <View style={styles.orderCard}>
        <Text style={styles.title}>Order #{item.id}</Text>
        <Text className={styles.sub}>Name: {item.customer_name}</Text>
        <Text className={styles.sub}>Mobile: {item.mobile}</Text>
        <Text className={styles.sub}>Address: {item.address}</Text>

        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          Status: {item.status || "Pending"}
        </Text>

       {/* ITEMS LIST */}
<View style={{ marginTop: 10 }}>
  <Text style={{ fontWeight: "bold" }}>Items:</Text>

  {itemsArray.map((i, index) => (
    <View key={index} style={{ marginTop: 10 }}>
      <Text style={styles.itemText}>
        • {i.item_name} × {i.quantity}
      </Text>

      <Text style={{ marginLeft: 20, fontSize: 13, color: "#333" }}>
        Rate: ₹{i.rate}  
      </Text>

      <Text style={{ marginLeft: 20, fontSize: 13, color: "#333" }}>
        Line Total: ₹{i.rate * i.quantity}
      </Text>

      {/* PICKED QTY INPUT */}
      <TextInput
        placeholder="Picked Qty"
        keyboardType="numeric"
        style={styles.input}
        onChangeText={(text) => updatePickedQty(item.id, index, text)}
      />
    </View>
  ))}

  <Text style={{ marginTop: 10, fontWeight: "bold", fontSize: 15 }}>
    Grand Total: ₹{grandTotal}
  </Text>
</View>


        {/* BUTTON: PICK + SEND TO CHECKER */}
        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => sendToChecker(item)}
        >
          <Text style={styles.assignText}>Mark Picked </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.head}>📦 Picker Dashboard</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList data={orders} renderItem={renderOrder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  head: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },

  orderCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },

  title: { fontWeight: "bold", fontSize: 16 },
  sub: { fontSize: 14, marginTop: 4 },
  status: { marginTop: 8, fontWeight: "bold" },
  itemText: { fontSize: 14, marginLeft: 10, marginTop: 2 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    borderRadius: 6,
    width: 100,
    marginTop: 5,
    marginLeft: 10,
  },

  assignButton: {
    marginTop: 12,
    backgroundColor: "#8e24aa",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  assignText: { color: "#fff", fontWeight: "bold" },
});
