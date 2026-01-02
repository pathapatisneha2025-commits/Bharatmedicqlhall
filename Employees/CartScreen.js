import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const CartProductsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [employeeId, setEmployeeId] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Load Employee ID
  const loadEmployeeId = async () => {
    const id = await getEmployeeId();
    if (id) setEmployeeId(id);
    else Alert.alert("Error", "Employee ID not found in storage");
  };

  useEffect(() => { loadEmployeeId(); }, []);
  useEffect(() => { if (employeeId) fetchCartItems(employeeId); }, [employeeId]);

  const fetchCartItems = async (empId) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/cart/employee/${empId}`);
      if (!response.ok) throw new Error("Failed to fetch cart items");
      const data = await response.json();
      const items = data.items || [];
      setCartItems(items);

      const total = items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );
      setTotalAmount(total);

      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (error) { Alert.alert("Error", error.message); }
    finally { setLoading(false); }
  };

  const deleteFromCart = (id) => {
    Alert.alert("Confirm", "Remove this item?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/cart/${id}`, { method: "DELETE" });
            const data = await response.json();
            if (response.ok) {
              Alert.alert("Success", "Item removed from cart");
              const updatedItems = cartItems.filter((item) => item.id !== id);
              setCartItems(updatedItems);
              calculateTotal(updatedItems);
            } else Alert.alert("Error", data.message || "Failed to delete item");
          } catch (error) { Alert.alert("Error", "Failed to delete item"); }
          finally { setLoading(false); }
        },
      },
    ]);
  };

  const increaseQuantity = (itemId) => {
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + 1;
        updateCartItem(itemId, newQty);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updatedItems);
    calculateTotal(updatedItems);
  };

  const decreaseQuantity = (itemId) => {
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId && item.quantity > 1) {
        const newQty = item.quantity - 1;
        updateCartItem(itemId, newQty);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updatedItems);
    calculateTotal(updatedItems);
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await fetch(`${BASE_URL}/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
    } catch (error) { console.log("Update failed", error); }
  };

  const calculateTotal = (items) => {
    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
    setTotalAmount(total);
  };

  const renderItem = ({ item }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <Image source={{ uri: item.images?.[0] }} style={styles.productImage} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>₹{parseFloat(item.price).toFixed(2)}</Text>

        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => decreaseQuantity(item.id)}
          >
            <Ionicons name="remove-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => increaseQuantity(item.id)}
          >
            <Ionicons name="add-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteFromCart(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading cart items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with cart icon */}
      <View style={styles.headerRow}>
        <Ionicons name="cart-outline" size={28} color="#007bff" />
        <Text style={styles.heading}> My Cart</Text>
      </View>

      {cartItems.length === 0 ? (
        <Text style={styles.noItems}>No items in cart.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Total & Proceed */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>
          <Ionicons name="cash-outline" size={20} /> Total: ₹{totalAmount.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.proceedBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("PatientDetailsScreen", {
              cartItems,
              totalAmount,
            })
          }
        >
          <Text style={styles.proceedText}>
            <Ionicons name="arrow-forward-outline" size={20} color="#fff" /> Proceed to Patient Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartProductsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb", padding: 15 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  heading: { fontSize: 22, fontWeight: "700", color: "#222" },
  noItems: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#555" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: { width: 90, height: 90, borderRadius: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#222" },
  category: { fontSize: 14, color: "#888", marginVertical: 2 },
  price: { fontSize: 15, fontWeight: "700", color: "#007bff" },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  qtyBtn: { backgroundColor: "#007bff", padding: 6, borderRadius: 6 },
  quantity: { fontSize: 16, fontWeight: "600", color: "#222", marginHorizontal: 12 },
  deleteBtn: { backgroundColor: "#ff4d4d", borderRadius: 50, padding: 10 },
  totalContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  totalText: { fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 10 },
  proceedBtn: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
  },
  proceedText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
