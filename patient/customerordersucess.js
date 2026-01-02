import React, {useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getOrderId } from "../utils/storage";

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
const [orderId, setOrderId] = useState();

  // ✅ Get data from CheckoutScreen
  const totalAmount = route?.params?.totalAmount || 0;
  const expectedDelivery =
    route?.params?.expectedDelivery || new Date().toISOString();
  const orderDate = route?.params?.orderDate || new Date().toISOString();
  let orderSummary = route?.params?.orderSummary || [];
useEffect(() => {
  const fetchOrderId = async () => {
    if (!route?.params?.orderId) {
      const storedOrderId = await getOrderId();
      if (storedOrderId) setOrderId(storedOrderId);
    } else {
      setOrderId(route.params.orderId);
    }
  };
  fetchOrderId();
}, [route?.params?.orderId]);
  // 🔍 Debug log to confirm what we are receiving
  useEffect(() => {
    console.log("🛍️ Received orderSummary:", orderSummary);
  }, []);

  // ✅ Ensure orderSummary is always an array
  if (!Array.isArray(orderSummary)) {
    orderSummary = [orderSummary];
  }

  // ✅ Extract product names correctly
  const orderNames =
    orderSummary.length > 0
      ? orderSummary
          .map((item, index) => {
            return (
              item?.name ||
              item?.productName ||
              item?.title ||
              item?.itemName ||
              `Item ${index + 1}`
            );
          })
          .join(", ")
      : "No items found";

  // ✅ Calculate dynamic delivery days
  const getDeliveryDays = () => {
    const today = new Date();
    const deliveryDate = new Date(expectedDelivery);
    const diffTime = deliveryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "today or tomorrow";
    return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

  // ✅ Format date & time
  const formatDateTime = (datetime) => {
    const dateObj = new Date(datetime);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} at ${time}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ✅ Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#28a745" />
        </View>

        {/* 🎉 Success Message */}
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for your order. Your medicines will be delivered soon.
        </Text>

        {/* 📦 Delivery Estimate */}
        <Text style={styles.deliveryInfo}>
          📦 Expected to arrive in {getDeliveryDays()}.
        </Text>

        {/* 📦 Order Details Card */}
        <View style={styles.card}>
          <Text style={styles.detailRow}>
            <Text style={styles.label}>Order ID: </Text>
            <Text style={styles.value}>{orderId}</Text>
          </Text>

          <Text style={styles.detailRow}>
            <Text style={styles.label}>Items Ordered: </Text>
            <Text style={styles.value}>{orderNames}</Text>
          </Text>

          <Text style={styles.detailRow}>
            <Text style={styles.label}>Order Date & Time: </Text>
            <Text style={styles.value}>{formatDateTime(orderDate)}</Text>
          </Text>

          <Text style={styles.detailRow}>
            <Text style={styles.label}>Expected Delivery: </Text>
            <Text style={styles.value}>
              {new Date(expectedDelivery).toDateString()}
            </Text>
          </Text>

          <Text style={styles.detailRow}>
            <Text style={styles.label}>Total Amount: </Text>
            <Text style={styles.value}>₹{totalAmount.toFixed(2)}</Text>
          </Text>
        </View>

        {/* 🏠 Navigation Buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("bottomtab")}
        >
          <Text style={styles.btnText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("patientorders")}
        >
          <Text style={styles.secondaryBtnText}>View My Orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  iconContainer: {
    backgroundColor: "#e9f9ef",
    borderRadius: 100,
    padding: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#28a745",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  deliveryInfo: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  detailRow: {
    fontSize: 16,
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  value: {
    color: "#555",
  },
  primaryBtn: {
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});
