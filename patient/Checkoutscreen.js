import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  BackHandler,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
// Note: We keep this for native builds, but we won't trigger it on Web
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getPatientId,
  getDeliveryAddressId,
  storeOrderId,
} from "../utils/storage";

const COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#1e293b",
  textLight: "#64748b",
  border: "#e2e8f0",
};

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 768;

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

  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const tax = subtotal > 0 ? subtotal * 0.05 : 0;
  const totalAmount = subtotal + deliveryFee + tax;

  // ... (Keep your existing useEffects for Patient, Address, and Cart)
  useEffect(() => {
    const fetchPatientId = async () => {
      const storedPatientId = await getPatientId();
      setPatientId(route?.params?.patientId || storedPatientId || 1);
    };
    fetchPatientId();
  }, [route?.params?.patientId]);

  useEffect(() => {
    const fetchAddress = async () => {
      const storedAddressId = await getDeliveryAddressId();
      const dynamicAddressId = route?.params?.address?.id || storedAddressId;
      if (!dynamicAddressId) return;
      setAddressId(dynamicAddressId);
      if (route?.params?.address) setAddress(route.params.address);
      else {
        try {
          const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/delivery-addresses/${dynamicAddressId}`);
          if (res.ok) { const data = await res.json(); setAddress(data); }
        } catch (e) { console.error(e); }
      }
    };
    fetchAddress();
  }, [route?.params?.address]);

  useEffect(() => {
    if (!patientId) return;
    const fetchCart = async () => {
      setCartLoading(true);
      try {
        const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/cart/${patientId}`);
        if (res.ok) { const data = await res.json(); setCartItems(data); }
      } catch (e) { console.error(e); } finally { setCartLoading(false); }
    };
    fetchCart();
  }, [patientId]);

  const handleCheckout = async () => {
    if (!paymentMethod) return;
    const expectedDelivery = date.toISOString().split("T")[0];
    setLoading(true);
    try {
      const response = await fetch("https://hospitaldatabasemanagement.onrender.com/order-medicine/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, addressId, paymentMethod: paymentMethod.toLowerCase().replace(/\s/g, "_"), expectedDelivery }),
      });
      const data = await response.json();
      if (response.ok) {
        setOrderDetails({
          ...data, subtotal, deliveryFee, tax, totalAmount,
          orderSummary: cartItems.map(item => ({ name: item.name, quantity: item.quantity, total: parseFloat(item.price) * item.quantity })),
        });
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Header */}
        <View style={styles.progressContainer}>
            <View style={[styles.stepLine, { backgroundColor: COLORS.primary }]} />
            <View style={styles.stepCircle}><Ionicons name="checkmark" size={14} color="#fff" /></View>
            <Text style={styles.stepTextActive}>Cart</Text>
            <View style={[styles.stepLine, { backgroundColor: COLORS.primary }]} />
            <View style={styles.stepCircle}><Text style={{color: '#fff', fontSize: 12}}>2</Text></View>
            <Text style={styles.stepTextActive}>Review</Text>
            <View style={styles.stepLine} />
            <View style={[styles.stepCircle, { backgroundColor: '#cbd5e1' }]}><Text style={{color: '#fff', fontSize: 12}}>3</Text></View>
            <Text style={styles.stepText}>Payment</Text>
        </View>

        <View style={[styles.grid, isDesktop && styles.desktopGrid]}>
          <View style={[styles.column, isDesktop && { flex: 1.5 }]}>
            {/* Address Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Delivery Address</Text>
              </View>
              {address ? (
                <View style={styles.addressBox}>
                  <Text style={styles.addressName}>{address.name}</Text>
                  <Text style={styles.addressText}>{address.flat}, {address.street}</Text>
                  <Text style={styles.addressText}>{address.city} - {address.pincode}</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>HOME</Text></View>
                </View>
              ) : <Text style={styles.emptyText}>No address selected</Text>}
            </View>

            {/* Cart Items */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Items in Order</Text>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartItem}>
                  <Image source={{ uri: item.images?.[0] }} style={styles.cartImage} />
                  <View style={styles.cartItemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>Qty: {item.quantity} · ₹{item.price}</Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.column, isDesktop && { flex: 1 }]}>
            {/* WEB CALENDAR SECTION */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Delivery Schedule</Text>
              {Platform.OS === 'web' ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.border}` }}>
                  <MaterialIcons name="event" size={20} color={COLORS.primary} style={{ marginRight: '10px' }} />
                  <input
                    type="date"
                    value={date.toISOString().split("T")[0]}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(new Date(e.target.value))}
                    style={{
                      border: 'none',
                      background: 'none',
                      outline: 'none',
                      fontSize: '15px',
                      color: COLORS.textDark,
                      fontFamily: 'inherit',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ) : (
                <>
                  <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.dateValue}>{date.toDateString()}</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker 
                      value={date} 
                      mode="date" 
                      minimumDate={new Date()} 
                      onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} 
                    />
                  )}
                </>
              )}
            </View>

            {/* Payment & Price Summary (Same as before) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment Method</Text>
              {["UPI Payment", "Credit/Debit Card", "Cash on Delivery"].map((method) => (
                <TouchableOpacity key={method} style={[styles.methodItem, paymentMethod === method && styles.methodItemSelected]} onPress={() => setPaymentMethod(method)}>
                  <Ionicons name={paymentMethod === method ? "radio-button-on" : "radio-button-off"} size={20} color={paymentMethod === method ? COLORS.primary : COLORS.textLight} />
                  <Text style={[styles.methodText, paymentMethod === method && { fontWeight: '700' }]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Price Details</Text>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>₹{subtotal.toFixed(2)}</Text></View>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>Delivery</Text><Text style={[styles.priceValue, { color: COLORS.secondary }]}>FREE</Text></View>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>Taxes</Text><Text style={styles.priceValue}>₹{tax.toFixed(2)}</Text></View>
              <View style={styles.dashDivider} />
              <View style={styles.priceRow}><Text style={styles.totalLabel}>Total Amount</Text><Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text></View>
              
              <TouchableOpacity 
                style={[styles.mainBtn, (!paymentMethod || loading) && { opacity: 0.6 }, orderDetails && {backgroundColor: COLORS.secondary}]} 
                onPress={orderDetails ? handleOrderSuccess : handleCheckout}
                disabled={!paymentMethod || loading}
              >
                <Text style={styles.mainBtnText}>{orderDetails ? "Confirm Order" : "Proceed to Payment"}</Text>
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  scrollContent: { padding: 16, paddingBottom: 100 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 20 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: -5 },
  stepTextActive: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginHorizontal: 8 },
  stepText: { fontSize: 12, color: COLORS.textLight, marginHorizontal: 8 },
  grid: { gap: 16 },
  desktopGrid: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 12 },
  addressBox: { padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8 },
  addressName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  addressText: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cartImage: { width: 50, height: 50, borderRadius: 8 },
  cartItemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  itemMeta: { fontSize: 12, color: COLORS.textLight },
  itemPrice: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  dateValue: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600' },
  methodItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  methodItemSelected: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  methodText: { marginLeft: 12, fontSize: 14, color: COLORS.textDark },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { color: COLORS.textLight, fontSize: 14 },
  priceValue: { fontWeight: '600', color: COLORS.textDark },
  dashDivider: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  mainBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 10 },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});