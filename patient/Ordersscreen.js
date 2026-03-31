import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  BackHandler,
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getPatientId } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

const CANCEL_API = `https://hospitaldatabasemanagement.onrender.com/cancel-order/add`;

const COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#1e293b",
  textLight: "#64748b",
  border: "#e2e8f0",
  danger: "#ef4444",
  warning: "#f59e0b",
};

const cancelReasonsList = [
  "Ordered by mistake",
  "Product is not good",
  "Found better price",
  "Delivery delay",
  "Other",
];

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase();
  let config = { bg: "#e2e8f0", text: "#475569" };

  if (s === "delivered" || s === "completed") config = { bg: "#dcfce7", text: "#166534" };
  else if (s === "processing" || s === "in transit") config = { bg: "#dbeafe", text: "#1e40af" };
  else if (s === "cancelled") config = { bg: "#fee2e2", text: "#991b1b" };
  else if (s === "pending") config = { bg: "#fef3c7", text: "#92400e" };

  return (
    <View style={[styles.statusBox, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.text }]}>{status?.toUpperCase()}</Text>
    </View>
  );
};

const OrderCard = ({ order, onCancel, numColumns }) => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    let reason = selectedReason === "Other" ? customReason : selectedReason;
    if (!reason?.trim()) {
      Alert.alert("Error", "Please provide a reason.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(CANCEL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, reason }),
      });
      const data = await response.json();
      if (response.ok) {
        onCancel(order.id, data);
        setModalVisible(false);
      } else {
        Alert.alert("Error", data.message || "Failed to cancel");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.card, { flex: 1 / numColumns }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderIdText}>Order #{order.id}</Text>
          <Text style={styles.dateText}>
            {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {order.order_summary?.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemMain}>{item.name} <Text style={styles.qtyText}>x{item.quantity}</Text></Text>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.addressBox}>
        <Ionicons name="location-outline" size={14} color={COLORS.textLight} />
        <Text style={styles.addressText} numberOfLines={2}>
          {order.address?.flat}, {order.address?.street}, {order.address?.city}
        </Text>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Amount Paid</Text>
        <Text style={styles.totalValue}>₹{order.total}</Text>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity 
          style={styles.trackBtn}
          onPress={() => navigation.navigate("TrackOrderScreen", { orderId: order.id, deliveryBoyId: order.delivery_boy_id })}
        >
          <Text style={styles.trackBtnText}>Track Order</Text>
        </TouchableOpacity>

        {["processing", "pending"].includes(order.status?.toLowerCase()) && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel Modal */}
      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancel Order #{order.id}</Text>
            <Text style={styles.modalSub}>Please tell us why you want to cancel</Text>
            
            <View style={styles.pickerContainer}>
                <Picker
                selectedValue={selectedReason}
                onValueChange={(v) => setSelectedReason(v)}
                style={styles.picker}
                >
                <Picker.Item label="Select Reason" value="" />
                {cancelReasonsList.map((r, i) => <Picker.Item key={i} label={r} value={r} />)}
                </Picker>
            </View>

            {selectedReason === "Other" && (
              <TextInput
                placeholder="Type your reason..."
                value={customReason}
                onChangeText={setCustomReason}
                style={styles.input}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={handleCancel} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmCancelText}>Confirm Cancellation</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function OrdersAppointmentsScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Desktop Responsive
  const isDesktop = SCREEN_WIDTH > 1024;
  const numColumns = isDesktop ? 2 : 1; 

  const fetchOrders = async () => {
    try {
      const patientId = await getPatientId();
      if (!patientId) return;
      const response = await fetch(`https://hospitaldatabasemanagement.onrender.com/order-medicine/patient/${patientId}`);
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const backAction = () => {
      navigation.reset({ index: 0, routes: [{ name: "bottomtab" }] });
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <TouchableOpacity onPress={fetchOrders} style={styles.headerIcon}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="package-variant" size={80} color={COLORS.border} />
          <Text style={styles.noOrdersText}>No orders found.</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns}
          numColumns={numColumns}
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <OrderCard order={item} numColumns={numColumns} onCancel={(id, data) => {
            setOrders(prev => prev.map(o => o.id === id ? {...o, status: 'cancelled', cancelled_at: new Date(), cancellation_reason: data.reason} : o))
          }} />}
          contentContainerStyle={[styles.listContent, { width: isDesktop ? '80%' : '100%', alignSelf: 'center' }]}
          columnWrapperStyle={numColumns > 1 ? { gap: 20 } : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: Platform.OS === 'android' ? 30 : 0
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textDark },
  headerIcon: { padding: 5 },
  listContent: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }})
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  orderIdText: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  dateText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statusBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  itemsContainer: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemMain: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  qtyText: { color: COLORS.textLight, fontSize: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  addressBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  addressText: { fontSize: 12, color: COLORS.textLight, flex: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 15 },
  totalLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  btnRow: { flexDirection: 'row', gap: 10 },
  trackBtn: { flex: 2, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center' },
  trackBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.danger, padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: COLORS.danger, fontWeight: '600' },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', width: Platform.OS === 'web' ? 400 : '85%', padding: 25, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: 5 },
  modalSub: { fontSize: 14, color: COLORS.textLight, marginBottom: 20 },
  pickerContainer: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginBottom: 15, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  closeBtn: { flex: 1, padding: 15, alignItems: 'center' },
  closeBtnText: { color: COLORS.textLight, fontWeight: '600' },
  confirmCancelBtn: { flex: 2, backgroundColor: COLORS.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
  confirmCancelText: { color: '#fff', fontWeight: '700' }
});