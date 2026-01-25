import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

import DeliveryMap from "./DeliveryMap.web"; // import the new map component

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function IndividualOrderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId, deliveryBoyId, deliveryType, orderType } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  const customer = orderType === "sales" ? order : order?.address;

  // ----------------- Fetch order details -----------------
  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const url =
        orderType === "sales"
          ? `${BASE_URL}/salesorders/${orderId}`
          : `${BASE_URL}/order-medicine/${orderId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) setOrder(data);
      else Alert.alert("Error", data.error || "Failed to load order details");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- Delivery Boy Location -----------------
  useEffect(() => {
    if (!order) return;

    if (Platform.OS !== "web") {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required for tracking.");
          return;
        }

        const subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          async (loc) => {
            const newLocation = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setDeliveryLocation(newLocation);

            if (customer?.latitude && customer?.longitude) {
              setRouteCoords([
                newLocation,
                { latitude: Number(customer.latitude), longitude: Number(customer.longitude) },
              ]);
            }
            setLoading(false);
          }
        );

        return () => subscription.remove();
      })();
    } else {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${BASE_URL}/delivery-boy/location?orderId=${orderId}`);
          const data = await res.json();
          if (data) {
            setDeliveryLocation({ latitude: data.latitude, longitude: data.longitude });
            if (customer?.latitude && customer?.longitude) {
              setRouteCoords([
                { latitude: data.latitude, longitude: data.longitude },
                { latitude: Number(customer.latitude), longitude: Number(customer.longitude) },
              ]);
            }
          }
        } catch (e) {
          console.error("Error fetching delivery location:", e);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [order]);

  const totalAmount =
    orderType === "sales"
      ? order?.items?.reduce((sum, item) => sum + Number(item.total || 0), 0)
      : order?.order_summary?.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handlePayment = () => {
    navigation.navigate("PaymentCollectionScreen", {
      orderId,
      amount: totalAmount,
      deliveryBoyId,
      deliveryType,
      orderType,
    });
  };

  const completeDelivery = async () => {
    const amountReceived =
      orderType === "sales"
        ? Number(order?.amount_collected ?? 0)
        : Number(order?.amount_received ?? 0);

    if (amountReceived < totalAmount) {
      Alert.alert(
        "Payment Pending ❌",
        `Total Amount: ₹${totalAmount}\nReceived: ₹${amountReceived}\n\nPlease collect full payment before completing delivery.`
      );
      return;
    }

    Alert.alert("Confirm Delivery", "Are you sure you want to complete this delivery?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Complete",
        onPress: async () => {
          try {
            const url =
              orderType === "sales"
                ? `${BASE_URL}/salesorders/complete-delivery`
                : `${BASE_URL}/order-medicine/mark-delivered`;

            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });

            const data = await res.json();
            if (res.ok) {
              Alert.alert("Success ✅", "Delivery marked as completed!");
              navigation.goBack();
            } else Alert.alert("Error", data.error || "Failed to complete delivery");
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Unable to complete delivery");
          }
        },
      },
    ]);
  };

  const callCustomer = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );

  if (!order)
    return (
      <View style={styles.loader}>
        <Text>No order details found.</Text>
      </View>
    );

  // ----------------- Render -----------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.header}>Order Details</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.title}>Customer Information</Text>
          <Text style={[styles.text, { flexShrink: 1 }]}>
            Name: {customer?.name || customer?.customer_name}
          </Text>
          <Text style={[styles.text, { flexShrink: 1 }]}>
            Address:{" "}
            {orderType === "sales"
              ? `${customer.address}, ${customer.landmark} - ${customer.pincode}`
              : `${customer?.flat}, ${customer?.street}, ${customer?.city}, ${customer?.state} - ${customer?.pincode}`}
          </Text>
          <Text style={styles.text}>Mobile: {customer?.mobile}</Text>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.title}>Order Summary</Text>
          {(orderType === "sales" ? order.items : order.order_summary)?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemText}>
                {orderType === "sales" ? item.item_name : item.name} x {item.quantity}
              </Text>
              <Text style={styles.itemText}>₹{item.total}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total Amount:</Text>
            <Text style={styles.totalText}>₹{totalAmount}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Payment Mode:</Text>
            <Text style={styles.totalText}>{order.payment_mode || order.payment_method}</Text>
          </View>
        </View>

        {/* Live Location Map */}
        <View style={styles.card}>
          <Text style={styles.title}>Live Delivery Tracking</Text>
          <DeliveryMap deliveryLocation={deliveryLocation} customer={customer} routeCoords={routeCoords} />
        </View>

        {/* Action Buttons */}
        <View style={[styles.buttonRow, { flexDirection: SCREEN_WIDTH < 500 ? "column" : "row" }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#4CAF50", marginVertical: SCREEN_WIDTH < 500 ? 5 : 0 }]}
            onPress={() => callCustomer(customer?.mobile)}
          >
            <Text style={styles.buttonText}>📞 Call Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#2196F3", marginVertical: SCREEN_WIDTH < 500 ? 5 : 0 }]}
            onPress={handlePayment}
          >
            <Text style={styles.buttonText}>💳 Collect Payment</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FF9800", marginTop: 10 }]}
          onPress={() =>
            navigation.navigate("AddressChangeRequestScreen", {
              orderId,
              deliveryBoyId,
              currentAddress:
                orderType === "sales"
                  ? `${customer.address}, ${customer.landmark} - ${customer.pincode}`
                  : `${customer.flat}, ${customer.street}, ${customer.city}, ${customer.state} - ${customer.pincode}`,
            })
          }
        >
          <Text style={styles.buttonText}>📍 Request Address Change</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.completeButton} onPress={completeDelivery}>
          <Text style={styles.buttonText}>✅ Complete Delivery</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { flexGrow: 1, padding: 12, paddingBottom: 30 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  header: { fontSize: 22, fontWeight: "bold", color: "#2196F3" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    maxWidth: Platform.OS === "web" ? 600 : "100%",
    alignSelf: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  text: { fontSize: 16, color: "#333", marginBottom: 4 },
  orderItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemText: { fontSize: 16, color: "#333" },
  divider: { height: 1, backgroundColor: "#ddd", marginVertical: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#000" },
  buttonRow: { justifyContent: "space-between", marginTop: 10 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 8, marginHorizontal: 5 },
  completeButton: { backgroundColor: "#FF5722", paddingVertical: 14, borderRadius: 10, marginTop: 20 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 16 },
});
