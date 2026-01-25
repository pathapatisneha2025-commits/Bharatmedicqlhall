import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
      BackHandler,
ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getPatientId,
  getDeliveryAddressId,
  storeOrderId,
} from "../utils/storage";

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [address, setAddress] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const storedPatientId = await getPatientId();
        setPatientId(route?.params?.patientId || storedPatientId || 1);
      } catch (e) {
        console.error(e);
        setPatientId(1);
      }
    };
    fetchPatientId();
  }, [route?.params?.patientId]);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const storedAddressId = await getDeliveryAddressId();
        const dynamicAddressId = route?.params?.address?.id || storedAddressId;

        if (!dynamicAddressId) return;
        setAddressId(dynamicAddressId);

        if (route?.params?.address) {
          setAddress(route.params.address);
        } else {
          const res = await fetch(
            `https://hospitaldatabasemanagement.onrender.com/delivery-addresses/${dynamicAddressId}`
          );
          if (res.ok) {
            const data = await res.json();
            setAddress(data);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAddress();
  }, [route?.params?.address]);

  useEffect(() => {
    if (!patientId) return;
    const fetchCart = async () => {
      try {
        setCartLoading(true);
        const res = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/cart/${patientId}`
        );
        if (res.ok) {
          const data = await res.json();
          setCartItems(data);
        } else {
          setCartItems([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCartLoading(false);
      }
    };
    fetchCart();
  }, [patientId]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const tax = subtotal > 0 ? subtotal * 0.05 : 0;
  const totalAmount = subtotal + deliveryFee + tax;

  const handleCheckout = async () => {
    if (!paymentMethod) return;
    const expectedDelivery = date.toISOString().split("T")[0];

    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/order-medicine/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            addressId,
            paymentMethod: paymentMethod.toLowerCase().replace(/\s/g, "_"),
            expectedDelivery,
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data) {
        setOrderDetails({
          ...data,
          subtotal,
          deliveryFee,
          tax,
          totalAmount,
          orderSummary: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            total: parseFloat(item.price) * item.quantity,
          })),
        });
      } else {
        setOrderDetails(null);
      }
    } catch (error) {
      console.error(error);
      setOrderDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSuccess = async () => {
    if (orderDetails) {
      await storeOrderId(orderDetails.order_id);
      navigation.navigate("ordersucess", {
        orderId: orderDetails.order_id,
        totalAmount: orderDetails.totalAmount,
        expectedDelivery: orderDetails.expectedDelivery,
        orderSummary: orderDetails.orderSummary,
      });
    }
  };
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
   if (loading)
          return (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text>Loading...</Text>
            </View>
          );
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location-outline" size={18} /> Delivery Address
          </Text>
          {address?.name ? (
            <>
              <Text style={styles.name}>{address.name}</Text>
              <Text style={styles.address}>
                {address.flat}, {address.street}, {address.city} -{" "}
                {address.pincode}
              </Text>
              <Text style={styles.phone}>
                <Ionicons name="call-outline" size={14} /> +91 {address.mobile}
              </Text>
            </>
          ) : (
            <Text style={{ color: "#888" }}>
              No address selected. Please go back and select an address.
            </Text>
          )}
        </View>

        {/* Cart Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cart-outline" size={18} /> Your Cart
          </Text>
          {cartLoading ? (
            <ActivityIndicator color="#007BFF" />
          ) : cartItems.length > 0 ? (
            cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <Image
                  source={{ uri: item.images?.[0] }}
                  style={styles.cartImage}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>
                    <FontAwesome5 name="capsules" size={12} color="#777" />{" "}
                    {item.category}
                  </Text>
                  <Text style={styles.itemQty}>
                    <MaterialIcons name="production-quantity-limits" size={12} />{" "}
                    Qty: {item.quantity} | ₹{item.price}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#777" }}>Your cart is empty.</Text>
          )}
        </View>

        {/* Expected Delivery */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar-outline" size={18} /> Expected Delivery
          </Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#007BFF" />
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={new Date()}
              maximumDate={new Date(new Date().setMonth(new Date().getMonth() + 1))}
              onChange={(e, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="list-outline" size={18} /> Order Summary
          </Text>
          <View style={styles.row}>
            <Text style={styles.item}>Subtotal</Text>
            <Text style={styles.price}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.item}>Delivery Fee</Text>
            <Text style={styles.price}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.item}>Tax (5%)</Text>
            <Text style={styles.price}>₹{tax.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.item, styles.totalText]}>
              <Ionicons name="cash-outline" size={16} /> Total
            </Text>
            <Text style={[styles.price, styles.totalText]}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="card-outline" size={18} /> Payment Method
          </Text>
          {["UPI Payment", "Credit/Debit Card", "Cash on Delivery"].map(
            (method) => (
              <TouchableOpacity
                key={method}
                style={styles.paymentOption}
                onPress={() => setPaymentMethod(method)}
              >
                <Ionicons
                  name={
                    paymentMethod === method
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={22}
                  color="#007BFF"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.item}>{method}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Checkout / Place Order */}
        {!orderDetails ? (
          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              (!paymentMethod || loading) && styles.disabledBtn,
            ]}
            disabled={!paymentMethod || loading}
            onPress={handleCheckout}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutText}>Proceed To Next</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.successBtn}
            onPress={handleOrderSuccess}
          >
            <Text style={styles.checkoutText}>Place Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F8", paddingHorizontal: 15 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 15 },
  headerTitle: { fontSize: 20, fontWeight: "700", marginLeft: 15, color: "#333" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: "#333" },
  name: { fontSize: 15, fontWeight: "600", color: "#222" },
  address: { fontSize: 14, color: "#555", marginTop: 3 },
  phone: { fontSize: 14, color: "#555", marginTop: 3 },
  cartItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cartImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: "#eee" },
  itemName: { fontSize: 15, fontWeight: "600", color: "#333" },
  itemCategory: { fontSize: 13, color: "#777", marginTop: 2 },
  itemQty: { fontSize: 13, color: "#555", marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: "600", color: "#000" },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  item: { fontSize: 15, color: "#333" },
  price: { fontSize: 15, fontWeight: "600" },
  divider: { borderBottomColor: "#E0E0E0", borderBottomWidth: 1, marginVertical: 8 },
  totalText: { fontSize: 16, fontWeight: "700", color: "#222" },
  paymentOption: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  checkoutBtn: {
    backgroundColor: "#4A90E2",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  disabledBtn: { backgroundColor: "#a0c4e8" },
  successBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  checkoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
  },
  dateText: { marginLeft: 10, fontSize: 16, color: "#333" },
});
