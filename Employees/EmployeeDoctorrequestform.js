import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function RequestForm({ navigation }) {
  const [employee, setEmployee] = useState({});
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get("window").width;
  const isDesktop = screenWidth >= 768;

  /* ============================
       FETCH EMPLOYEE DETAILS
  ============================ */
  const loadEmployee = async () => {
    const id = await getEmployeeId();
    const res = await fetch(`${BASE_URL}/employee/${id}`);
    const data = await res.json();
    setEmployee(data.employee);
  };

  /* ============================
       FETCH INVENTORY ITEMS
  ============================ */
  const loadInventory = async () => {
    const res = await fetch(`${BASE_URL}/doctorrequest`);
    const data = await res.json();
    setInventory(data.items || []);
  };

  useEffect(() => {
    Promise.all([loadEmployee(), loadInventory()]).finally(() =>
      setLoading(false)
    );
  }, []);

  /* ============================
       CART HANDLERS
  ============================ */
  const addItem = (item) => {
    setCart((prev) => {
      const currentQty = prev[item.id] || 0;
      if (currentQty >= item.stock) return prev;
      return { ...prev, [item.id]: currentQty + 1 };
    });
  };

  const removeItem = (item) => {
    setCart((prev) => {
      if (!prev[item.id]) return prev;
      const updated = { ...prev };
      updated[item.id] === 1
        ? delete updated[item.id]
        : (updated[item.id] -= 1);
      return updated;
    });
  };

  /* ============================
       SUBMIT REQUEST
  ============================ */
  /* ============================
   SUBMIT REQUEST
============================ */
const submitRequest = async () => {
  if (Object.keys(cart).length === 0) {
    Alert.alert("Empty Request", "Please select items");
    return;
  }

  // Get employee_id from storage directly
  const employee_id = await getEmployeeId();

  if (!employee_id) {
    Alert.alert("Error", "Employee not found. Please login again.");
    return;
  }

 const items = Object.keys(cart).map((id) => {
  const inventoryItem = inventory.find((i) => i.id === parseInt(id));
  return {
    item_id: parseInt(id),
    name: inventoryItem?.name || "Unknown",
    quantity: cart[id],
  };
});


  try {
    const res = await fetch(`${BASE_URL}/doctorrequest/submitrequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id,
        department: employee.department,
        items,
      }),
    });

  if (res.ok) {
  const data = await res.json();
  Alert.alert("Success", "Request sent for admin approval");

  // Deduct stock locally
  setInventory(prev =>
    prev.map(item => ({
      ...item,
      stock: item.stock - (cart[item.id] || 0)
    }))
  );

  setCart({}); // clear cart
  console.log("Submitted request:", data.request);
}
else {
      const errorData = await res.json();
      Alert.alert("Error", errorData.message || "Failed to submit request");
    }
  } catch (error) {
    console.error("Error submitting request:", error);
    Alert.alert("Error", "Server error. Please try again later.");
  }
};


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ============================
       ITEM CARD
  ============================ */
  const renderItem = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          minWidth: 140,
          marginHorizontal: 8,
          marginVertical: 10,
        },
      ]}
    >
      <Image
        source={{
          uri:
            item.image_url ||
            item.image_urls?.[0] ||
            "https://via.placeholder.com/80",
        }}
        style={[styles.image, { height: 100 }]}
        resizeMode="contain"
      />
      <Text style={styles.name}>{item.name}</Text>
<Text style={styles.stock}>
  {item.stock - (cart[item.id] || 0) > 0
    ? `Stock: ${item.stock - (cart[item.id] || 0)}`
    : "Out of Stock"}
</Text>

      <View style={styles.stockBar}>
        <View
          style={[
            styles.stockFill,
            {
              width: `${
                (Math.min(cart[item.id] || 0, item.stock) / item.stock) * 100
              }%`,
            },
          ]}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => removeItem(item)}>
          <Ionicons name="remove-circle-outline" size={26} color="#EF4444" />
        </TouchableOpacity>
        <Text style={styles.qty}>{cart[item.id] || 0}</Text>
        <TouchableOpacity onPress={() => addItem(item)}>
          <Ionicons name="add-circle-outline" size={26} color="#10B981" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stationery Inventory</Text>
        <Text style={styles.cartCount}>
          {Object.values(cart).reduce((a, b) => a + b, 0)} selected
        </Text>
      </View>

      {/* CENTERED CONTENT */}
      <View style={styles.centeredContent}>
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={1}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 16,
          }}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submitRequest}>
          <Text style={styles.submitText}>Submit Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ============================
       STYLES
=========================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FB" },

  header: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    marginLeft: 15,
    fontWeight: "bold",
  },
  cartCount: {
    color: "#fff",
    marginLeft: 15,
    fontWeight: "bold",
    fontSize: 16,
  },

  centeredContent: {
    flex: 1,
    maxWidth: 700,
    alignSelf: "center",
    width: "100%",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    flex: 1,
    elevation: 3,
  },

  image: { marginBottom: 8, height: 100 },

  name: { fontWeight: "bold", fontSize: 16 },
  stock: { fontSize: 12, color: "#6B7280" },

  stockBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginVertical: 6,
  },
  stockFill: {
    height: 6,
    backgroundColor: "#10B981",
    borderRadius: 3,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  qty: { fontSize: 16, fontWeight: "bold" },

  submitBtn: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
