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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function IndividualOrderScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { orderId, deliveryBoyId, deliveryType, orderType } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  // -------------------------------------------------------
  // FETCH ORDER DETAILS (Normal API or Sales API)
  // -------------------------------------------------------
  const fetchOrderDetails = async () => {
    try {
      const url =
        orderType === "sales"
          ? `${BASE_URL}/salesorders/${orderId}`
          : `${BASE_URL}/order-medicine/${orderId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setOrder(data);
      } else {
        Alert.alert("Error", data.error || "Failed to load order details");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const callCustomer = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  // -------------------------------------------------------
  // TOTAL AMOUNT (Supports Sales + Normal)
  // -------------------------------------------------------
  const totalAmount =
    orderType === "sales"
      ? order?.items?.reduce((sum, item) => sum + Number(item.total || 0), 0)
      : order?.order_summary?.reduce((sum, item) => sum + Number(item.total || 0), 0);

  const handlePayment = () => {
    navigation.navigate("PaymentCollectionScreen", {
      orderId: orderId,
      amount: totalAmount,
      deliveryBoyId: deliveryBoyId,
      deliveryType: deliveryType,
      orderType: orderType,
    });
  };

 const completeDelivery = async () => {
  // Calculate total and amount received
  const totalAmount =
    orderType === "sales"
      ? order?.items?.reduce((sum, item) => sum + Number(item.total || 0), 0)
      : order?.order_summary?.reduce((sum, item) => sum + Number(item.total || 0), 0);

const amountReceived = orderType === "sales"
  ? Number(order?.amount_collected ?? 0)
  : Number(order?.amount_received ?? 0);


  // Check if payment is complete
  if (amountReceived < totalAmount) {
    Alert.alert(
      "Payment Pending ❌",
      `Total Amount: ₹${totalAmount}\nReceived: ₹${amountReceived}\n\nPlease collect full payment before completing delivery.`
    );
    return;
  }

  // Confirm delivery with user
  Alert.alert(
    "Confirm Delivery",
    "Are you sure you want to complete this delivery?",
    [
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
              method: "POST", // use POST as your backend expects orderId in body
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            });

            const data = await res.json();

            if (res.ok) {
              Alert.alert("Success ✅", "Delivery marked as completed!");
              navigation.goBack();
            } else {
              Alert.alert("Error", data.error || "Failed to complete delivery");
            }
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Unable to complete delivery");
          }
        },
      },
    ]
  );
};

  const sendAddressChangeRequest = async () => {
  try {
    const response = await fetch(`${BASE_URL}/orders/request-address-change`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        deliveryBoyId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert(
        "Request Sent",
        "Address change request has been sent to admin.\nYou will be notified after approval."
      );
    } else {
      Alert.alert("Error", data.error || "Unable to send request");
    }
  } catch (error) {
    Alert.alert("Error", "Something went wrong while sending request");
  }
};


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loader}>
        <Text>No order details found.</Text>
      </View>
    );
  }

  // For sales order → customer fields are at root level
  const customer = orderType === "sales" ? order : order.address;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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

          <Text style={styles.text}>
            Name: {customer?.name || customer?.customer_name}
          </Text>

          <Text style={styles.text}>
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

          {(orderType === "sales" ? order.items : order.order_summary)?.map(
            (item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={styles.itemText}>
                  {orderType === "sales" ? item.item_name : item.name} x{" "}
                  {item.quantity}
                </Text>
                <Text style={styles.itemText}>₹{item.total}</Text>
              </View>
            )
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total Amount:</Text>
            <Text style={styles.totalText}>₹{totalAmount}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Payment Mode:</Text>
            <Text style={styles.totalText}>
              {order.payment_mode || order.payment_method}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
            onPress={() => callCustomer(customer?.mobile)}
          >
            <Text style={styles.buttonText}>📞 Call Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#2196F3" }]}
            onPress={handlePayment}
          >
            <Text style={styles.buttonText}>💳 Collect Payment</Text>
          </TouchableOpacity>
        </View>
{/* Address Change Request */}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { padding: 12, paddingBottom: 30 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  header: { fontSize: 22, fontWeight: "bold", color: "#2196F3" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  text: { fontSize: 16, color: "#333", marginBottom: 4 },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  itemText: { fontSize: 16, color: "#333" },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#000" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  completeButton: {
    backgroundColor: "#FF5722",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 16 },
});
