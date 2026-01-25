import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
    BackHandler,

} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getPatientId } from "../utils/storage";
import { LinearGradient } from "expo-linear-gradient";

export default function ShoppingCartScreen({ route }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(false);
  const [patientId, setPatientId] = useState(null);

  const navigation = useNavigation();
  const deliveryFee = 40;
  const taxRate = 0.05;

  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const storedId = await getPatientId();
        setPatientId(route?.params?.patientId || storedId || 1);
      } catch (e) {
        console.error("❌ Failed to get patient ID:", e);
        setPatientId(1);
      }
    };
    fetchPatientId();
  }, [route?.params?.patientId]);

  useEffect(() => {
    if (!patientId) return;

    const fetchCartItems = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/cart/${patientId}`
        );
        const data = await res.json();
        setCartItems(Array.isArray(data) ? data : data.items || []);
      } catch (error) {
        console.log("Error fetching cart:", error);
        Alert.alert("Error", "Failed to fetch cart items");
      } finally {
        setLoading(false);
      }
    };
    fetchCartItems();
  }, [patientId]);

  const incrementQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQty = (id) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const removeItem = async (id) => {
    try {
      setUpdatingItem(true);
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/cart/${id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        Alert.alert("Success", "Item removed from cart");
        setCartItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        const data = await res.json();
        Alert.alert("Error", data.message || "Failed to remove item");
      }
    } catch (error) {
      console.log("Error deleting cart item:", error);
      Alert.alert("Error", "Something went wrong while removing item");
    } finally {
      setUpdatingItem(false);
    }
  };

  const subtotal = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
    : 0;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + deliveryFee + tax;
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
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#3B82F6" />
      </TouchableOpacity>

      {/* Title with Cart Icon */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Shopping Cart</Text>
        <View style={styles.cartIconWrapper}>
          <Ionicons name="cart-outline" size={28} color="#3B82F6" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Cart Items */}
      {cartItems.length === 0 ? (
        <Text style={styles.emptyText}>Your cart is empty</Text>
      ) : (
        cartItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemBrand}>{item.manufacturer}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.quantityRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementQty(item.id)}>
                <Text style={styles.qtyText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementQty(item.id)}>
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Order Summary */}
      {cartItems.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryText}>₹{subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Delivery Fee</Text>
            <Text style={styles.summaryText}>₹{deliveryFee}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Tax (5%)</Text>
            <Text style={styles.summaryText}>₹{tax}</Text>
          </View>
          <View style={styles.separator} />
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={[styles.summaryText, { fontWeight: "700", fontSize: 16 }]}>Total</Text>
            <Text style={[styles.summaryText, { fontWeight: "700", fontSize: 16 }]}>₹{total}</Text>
          </View>
        </View>
      )}

      {/* Red Checkout Button */}
      {cartItems.length > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate("selectaddress", { cartItems, total })}
          style={{ marginBottom: 30 }}
        >
         <LinearGradient 
  colors={["#FFD54F", "#FFC107"]}  // Light yellow to amber
  style={styles.checkoutBtn}
>
  <Text style={styles.checkoutText}>Proceed to Checkout</Text>
</LinearGradient>

        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8", padding: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  cartIconWrapper: { position: "relative" },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cartBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  emptyText: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#6B7280" },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  itemInfo: { flexDirection: "row", alignItems: "center" },
  itemImage: { width: 60, height: 60, borderRadius: 10 },
  itemName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  itemBrand: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: "600", color: "#10B981", marginTop: 4 },
  quantityRow: { flexDirection: "row", alignItems: "center", marginTop: 12, justifyContent: "flex-end" },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { fontSize: 18, fontWeight: "600", color: "#374151" },
  qtyNumber: { marginHorizontal: 14, fontSize: 16, fontWeight: "600", color: "#111827" },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryText: { fontSize: 15, color: "#111827" },
  separator: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginVertical: 8 },
  checkoutBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
