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
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";

import DeliveryMap from "./DeliveryMap"; // import the map component

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";
const GOOGLE_MAPS_API_KEY = "AIzaSyDqHcDP19qW9nuD5UO5M7f3v8eEUN9c5do";

export default function IndividualOrderScreen({ navigation }) {
  const route = useRoute();
  const { orderId, deliveryType, orderType } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  const customer = orderType === "sales" ? order : order?.address;
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const getCustomerAddressString = (order) => {
    if (!order?.address) return "";
    const addr = order.address;
    const city = addr.city?.toLowerCase() === "vishakaptnam" ? "Visakhapatnam" : addr.city;
    const state = addr.state?.toLowerCase() === "andhrapradesh" ? "Andhra Pradesh" : addr.state;
    return `${addr.flat}, ${addr.street}, ${city}, ${state}, ${addr.pincode}, India`;
  };

  // Loader timer
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount(c => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch order details
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
      else showAlert("Error", data.error || "Failed to load order details");
    } catch (error) {
      console.error(error);
      showAlert("Error", "Unable to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  // Geocode customer address
  const getCoordinatesFromAddress = async address => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK") {
        const loc = data.results[0].geometry.location;
        return { latitude: loc.lat, longitude: loc.lng };
      }
      console.warn("Geocoding failed:", data.status);
      return null;
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  // Fetch customer coords
  useEffect(() => {
    if (!order) return;

    const fetchCustomerCoords = async () => {
      const addressString = getCustomerAddressString(order);
      const coords = await getCoordinatesFromAddress(addressString);
      if (coords) setCustomerCoords(coords);

      if (deliveryLocation && coords) setRouteCoords([deliveryLocation, coords]);
    };

    fetchCustomerCoords();
  }, [order, deliveryLocation]);

 // Fetch delivery boy location from server using orderId
const fetchDeliveryBoyLocation = async () => {
  try {
    const res = await fetch(`${BASE_URL}/deliveryboy/location/${orderId}`);
    const data = await res.json();

    if (data.success && data.location) {
      const loc = {
        latitude: Number(data.location.latitude),
        longitude: Number(data.location.longitude),
      };
      
      setDeliveryLocation(loc);

      // log the location to console
      console.log("Delivery Boy Location:", loc);

      if (customerCoords) setRouteCoords([loc, customerCoords]);
    }
  } catch (err) {
    console.error("Error fetching delivery boy location:", err);
  }
};

  // Polling for delivery boy location every 5 seconds
  useEffect(() => {
    if (!order || !customerCoords) return;

    fetchDeliveryBoyLocation(); // initial fetch
    const interval = setInterval(fetchDeliveryBoyLocation, 5000);

    return () => clearInterval(interval);
  }, [order, customerCoords]);

  const totalAmount =
    orderType === "sales"
      ? order?.items?.reduce((sum, item) => sum + Number(item.total || 0), 0)
      : order?.order_summary?.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handlePayment = () => {
    navigation.navigate("PaymentCollectionScreen", {
      orderId,
      amount: totalAmount,
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
      showAlert(
        "Payment Pending ❌",
        `Total Amount: ₹${totalAmount}\nReceived: ₹${amountReceived}\n\nPlease collect full payment before completing delivery.`
      );
      return;
    }

    showAlert("Confirm Delivery", "Are you sure you want to complete this delivery?", [
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
              showAlert("Success ✅", "Delivery marked as completed!");
              navigation.goBack();
            } else showAlert("Error", data.error || "Failed to complete delivery");
          } catch (e) {
            console.error(e);
            showAlert("Error", "Unable to complete delivery");
          }
        },
      },
    ]);
  };

  const callCustomer = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={{ marginTop: 12, color: "#64748b" }}>
          Preparing Order Data... {loadingCount}s
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderId?.toString().slice(-6) || 'Details'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainWrapper, isDesktop && styles.desktopGrid]}>
          
          {/* LEFT COLUMN: Customer & Order Data */}
          <View style={[isDesktop ? styles.column : null]}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={22} color="#0ea5e9" />
                <Text style={styles.cardTitle}>Customer Details</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{customer?.name || customer?.customer_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone</Text>
                <TouchableOpacity onPress={() => callCustomer(customer?.mobile)}>
                  <Text style={[styles.value, { color: '#0ea5e9', fontWeight: '700' }]}>{customer?.mobile}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={16} color="#64748b" style={{ marginTop: 2 }} />
                <Text style={styles.addressText}>
                  {orderType === "sales"
                    ? `${customer?.address}, ${customer?.landmark} - ${customer?.pincode}`
                    : `${customer?.flat}, ${customer?.street}, ${customer?.city}, ${customer?.state} - ${customer?.pincode}`}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="receipt-outline" size={22} color="#0ea5e9" />
                <Text style={styles.cardTitle}>Order Items</Text>
              </View>
              {(orderType === "sales" ? order.items : order.order_summary)?.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{orderType === "sales" ? item.item_name : item.name}</Text>
                    <Text style={styles.itemQty}>Quantity: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.total}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Mode</Text>
                <Text style={styles.summaryValue}>{order.payment_mode || order.payment_method}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Bill</Text>
                <Text style={styles.totalValue}>₹{totalAmount}</Text>
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN: Map & Actions */}
          <View style={[isDesktop ? styles.column : null]}>
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
              <View style={[styles.cardHeader, { padding: 15 }]}>
                <Ionicons name="map-outline" size={22} color="#0ea5e9" />
                <Text style={styles.cardTitle}>Live Tracking</Text>
              </View>
              <View style={isDesktop ? { height: 350 } : { height: 250 }}>
               {deliveryLocation && customerCoords ? (
  <DeliveryMap
    deliveryLocation={deliveryLocation}
    customerCoords={customerCoords}
    routeCoords={routeCoords}
  />
) : (
  <ActivityIndicator size="large" color="#0ea5e9" />
)}
           </View>
            </View>

            <View style={styles.actionContainer}>
              <View style={styles.buttonGrid}>
                <TouchableOpacity style={[styles.actionButton, styles.btnCall]} onPress={() => callCustomer(customer?.mobile)}>
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.btnPayment]} onPress={handlePayment}>
                  <Ionicons name="card" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Payment</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.btnAddress}
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
                <Ionicons name="location" size={18} color="#f59e0b" />
                <Text style={styles.btnAddressText}>Request Address Change</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.completeButton} onPress={completeDelivery}>
                <Text style={styles.completeButtonText}>Finish Delivery</Text>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  backButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },

  scrollContainer: { flexGrow: 1, padding: 16 },
  mainWrapper: { flexDirection: 'column' },
  desktopGrid: { flexDirection: 'row', gap: 20 },
  column: { flex: 1 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: '#64748b', fontSize: 14 },
  value: { color: '#1e293b', fontSize: 14, fontWeight: '600' },
  
  addressContainer: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 8 },
  addressText: { flex: 1, color: '#475569', fontSize: 13, lineHeight: 18 },

  orderItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  itemQty: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 15 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { color: '#64748b', fontSize: 14 },
  summaryValue: { color: '#1e293b', fontWeight: '600' },
  
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#0ea5e9' },

  actionContainer: { marginTop: 10 },
  buttonGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionButton: { 
    flex: 1, 
    height: 50, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8 
  },
  btnCall: { backgroundColor: '#10b981' },
  btnPayment: { backgroundColor: '#0ea5e9' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  btnAddress: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 20
  },
  btnAddressText: { color: '#b45309', fontWeight: '600', fontSize: 14 },

  completeButton: { 
    backgroundColor: "#1e293b", 
    height: 60, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  completeButtonText: { color: "#fff", fontWeight: "800", fontSize: 18 },
});