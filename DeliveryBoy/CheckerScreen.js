import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Clipboard,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

const API_URL = "https://hospitaldatabasemanagement.onrender.com/picker";
const SALES_ORDER_API = "https://hospitaldatabasemanagement.onrender.com/salesorders";

export default function CheckerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [processing, setProcessing] = useState(null);

  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [freightModal, setFreightModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 480;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/picked/all`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data || []);
    } catch (err) {
      console.log("Fetch Error:", err);
      showAlert("Error", "Unable to fetch orders.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const hasMismatch = (items) => {
    if (!items || !Array.isArray(items)) return false;
    return items.some(i => Number(i.quantity) !== Number(i.picked_qty));
  };

  const verifyOrder = async (order) => {
    const mismatch = hasMismatch(order.picked_items);
    if (mismatch) {
      showAlert("Mismatch", "Picker quantities do not match.");
      return;
    }
    setProcessing(order.id);
    try {
      const res = await fetch(`${API_URL}/update-checkerstatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          checked_items: order.picked_items,
          status: "Checked",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Success", `Order #${order.id} verified!`);
        await fetchOrders();
      } else {
        showAlert("Error", data.error || "Failed to verify order.");
      }
    } catch (err) {
      showAlert("Server Error", "Unable to verify order.");
    }
    setProcessing(null);
  };

  const generateInvoice = async (order) => {
    if (order.status !== "Checked") {
      showAlert("Hold On", "Verify the order before generating invoice.");
      return;
    }
    setGeneratingInvoice(true);
    try {
      const res = await fetch(`${SALES_ORDER_API}/generate-invoice/${order.id}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const invoice = data.data || data;
        if (typeof invoice.medicines === "string") {
          try { invoice.medicines = JSON.parse(invoice.medicines); } catch (e) {}
        }
        setInvoiceData(invoice);
        setInvoiceVisible(true);
        await fetchOrders();
      } else {
        showAlert("Error", data.error || "Failed to generate invoice");
      }
    } catch (err) {
      showAlert("Server Error", "Unable to generate invoice.");
    }
    setGeneratingInvoice(false);
  };

  const saveFreightOption = async (option) => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`${SALES_ORDER_API}/bus/freight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          freight_option_selected: option
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Saved", "Freight option updated.");
        setFreightModal(false);
        fetchOrders();
      } else {
        showAlert("Error", data.error || "Unable to save freight option.");
      }
    } catch (err) {
      showAlert("Error", "Server error while saving.");
    }
  };

  const handleDeliveryBoyAssign = async (order) => {
    if (order.status !== "Checked") {
      showAlert("Hold On", "Please verify the order before assignment.");
      return;
    }
    if (order.delivery_type === "local") {
      navigation.navigate("AssignDeliveryBoyScreen", { orderId: order.id, type: "salesorder" });
      return;
    }
    if (order.delivery_type === "outside") {
      const res = await fetch(`${BASE_URL}/orders/payment-status/${order.id}`);
      const data = await res.json();
      if (!data.invoice_generated) {
        showAlert("Invoice Required", "Generate invoice before assignment.");
        return;
      }
      if (!data.payment_received && !data.credit_approved) {
        showAlert("Payment Pending", "Payment is required before assigning delivery.");
        return;
      }
      navigation.navigate("AssignDeliveryBoyScreen", { orderId: order.id, type: "salesorder" });
      return;
    }
    if (order.delivery_type === "bus") {
      if (!order.invoice_generated) {
        showAlert("Invoice Required", "Bus orders require invoice.");
        return;
      }
      if (!order.freight_option_selected) {
        setSelectedOrder(order);
        setFreightModal(true);
        return;
      }
      if (order.freight_option_selected === "customer_to_company" && !order.payment_received) {
        showAlert("Payment Required", "Customer must pay item + freight before dispatch.");
        return;
      }
      navigation.navigate("AssignDeliveryBoyScreen", { orderId: order.id, type: "salesorder" });
    }
  };

  const copyInvoiceNo = async () => {
    if (!invoiceData) return;
    const text = invoiceData.invoice_no || "";
    try {
      if (Platform.OS === "web") await navigator.clipboard.writeText(text);
      else Clipboard.setString(text);
      showAlert("Copied", "Invoice number copied to clipboard.");
    } catch (err) {
      showAlert("Error", "Unable to copy.");
    }
  };

  const renderMedicine = ({ item, index }) => (
    <View style={styles.medicineRow}>
      <Text style={styles.medicineIndex}>{index + 1}.</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.medicineName}>{item.name}</Text>
        <Text style={styles.medicineSub}>{item.quantity} units @ ₹{item.unitPrice ?? item.rate ?? 0}</Text>
      </View>
      <Text style={styles.medicineTotal}>₹{item.total}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerText}>Checker Panel</Text>
          <Text style={styles.headerSub}>Verify and dispatch picked orders</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Syncing orders... {loadingCount}s</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={64} color="#CBD5E1" />
              <Text style={styles.noOrders}>No orders waiting for verification</Text>
            </View>
          ) : (
            orders.map((order) => {
              const mismatch = hasMismatch(order.picked_items);
              const isChecked = order.status === "Checked";

              return (
                <View key={order.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderBadgeText}>ID: #{order.id}</Text>
                    </View>
                    <View style={[styles.statusTag, isChecked ? styles.tagSuccess : styles.tagWarning]}>
                      <Text style={[styles.statusTagText, isChecked ? styles.textSuccess : styles.textWarning]}>
                        {order.status || "Picked"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.customerSection}>
                    <View style={styles.infoRow}>
                      <Ionicons name="person-circle" size={20} color="#64748B" />
                      <Text style={styles.customerName}>{order.customer_name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="call" size={18} color="#64748B" />
                      <Text style={styles.customerMobile}>{order.mobile}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>Items Verification</Text>
                  {order.picked_items.map((i, idx) => {
                    const itemMismatch = Number(i.quantity) !== Number(i.picked_qty);
                    return (
                      <View key={idx} style={[styles.itemRow, itemMismatch ? styles.rowError : styles.rowSuccess]}>
                        <Text style={styles.itemName} numberOfLines={1}>• {i.item_name}</Text>
                        <View style={styles.qtyContainer}>
                          <Text style={styles.qtyLabel}>Ord: <Text style={{fontWeight:'700'}}>{i.quantity}</Text></Text>
                          <Text style={[styles.qtyLabel, itemMismatch && {color: '#EF4444'}]}>Pick: <Text style={{fontWeight:'700'}}>{i.picked_qty}</Text></Text>
                        </View>
                      </View>
                    );
                  })}

                  {mismatch && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={20} color="#B91C1C" />
                      <Text style={styles.errorBannerText}>Quantity mismatch detected.</Text>
                    </View>
                  )}

                  <View style={styles.actionGrid}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnVerify, (mismatch || isChecked) && styles.btnDisabled]}
                      onPress={() => verifyOrder(order)}
                      disabled={mismatch || processing === order.id || isChecked}
                    >
                      {processing === order.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={18} color="#fff" />
                          <Text style={styles.btnText}>Verify</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {(order.delivery_type === "outside" || order.delivery_type === "bus") && (
                      <TouchableOpacity
                        style={[styles.btn, order.invoice_generated ? styles.btnInvoiceDone : styles.btnInvoice]}
                        onPress={() => !order.invoice_generated && generateInvoice(order)}
                        disabled={generatingInvoice}
                      >
                        <Ionicons name="receipt" size={18} color="#fff" />
                        <Text style={styles.btnText}>{order.invoice_generated ? "Invoiced" : "Invoice"}</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.btn, styles.btnAssign]}
                      onPress={() => handleDeliveryBoyAssign(order)}
                    >
                      <FontAwesome5 name="shipping-fast" size={14} color="#fff" />
                      <Text style={styles.btnText}>Assign</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* INVOICE MODAL */}
      <Modal visible={invoiceVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceModal}>
            <View style={styles.modalHeaderInner}>
              <Text style={styles.modalTitle}>Tax Invoice</Text>
              <TouchableOpacity onPress={() => setInvoiceVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {invoiceData && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.invoiceMetaCard}>
                  <View>
                    <Text style={styles.invNoText}>{invoiceData.invoice_no}</Text>
                    <Text style={styles.invDateText}>{new Date(invoiceData.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.invAmountContainer}>
                    <Text style={styles.invAmountLabel}>Total Amount</Text>
                    <Text style={styles.invAmountValue}>₹{invoiceData.total_amount}</Text>
                  </View>
                </View>

                <View style={styles.medicineList}>
                  {invoiceData.medicines?.map((item, idx) => (
                    <View key={idx} style={styles.medicineCard}>
                      <View style={{flex: 1}}>
                        <Text style={styles.medicineNameText}>{item.name}</Text>
                        <Text style={styles.medicineDetailsText}>{item.quantity} units x ₹{item.unitPrice ?? item.rate}</Text>
                      </View>
                      <Text style={styles.medicinePriceText}>₹{item.total}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.invoiceFooterActions}>
                  <TouchableOpacity style={[styles.footerBtn, {backgroundColor: '#4F46E5'}]} onPress={copyInvoiceNo}>
                    <Ionicons name="copy-outline" size={18} color="#fff" />
                    <Text style={styles.footerBtnText}>Copy ID</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.footerBtn, {backgroundColor: '#10B981'}]}>
                    <Ionicons name="print-outline" size={18} color="#fff" />
                    <Text style={styles.footerBtnText}>Print</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FREIGHT MODAL */}
      <Modal visible={freightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.freightCard}>
            <Text style={styles.freightTitle}>Freight Configuration</Text>
            <Text style={styles.freightSub}>Select how the shipping cost will be handled</Text>
            
            {[
              { key: "customer_to_bus", label: "Customer pays at Bus", icon: "people" },
              { key: "BHM_to_bus", label: "BHM Company pays Bus", icon: "business" },
              { key: "customer_to_company", label: "Customer pays Company", icon: "wallet" },
              { key: "delivery_boy_to_bus", label: "Delivery Boy pays Bus", icon: "bicycle" }
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={styles.freightOption}
                onPress={() => saveFreightOption(option.key)}
              >
                <Ionicons name={option.icon} size={20} color="#4F46E5" />
                <Text style={styles.freightOptionText}>{option.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.freightCancel} onPress={() => setFreightModal(false)}>
              <Text style={styles.freightCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: { marginRight: 15, padding: 5 },
  headerText: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#64748B", fontWeight: "500" },

  scrollContent: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  noOrders: { marginTop: 15, color: "#94A3B8", fontSize: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  orderBadgeText: { fontWeight: '700', color: '#475569', fontSize: 12 },
  
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagSuccess: { backgroundColor: '#DCFCE7' },
  tagWarning: { backgroundColor: '#FEF3C7' },
  statusTagText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  textSuccess: { color: '#166534' },
  textWarning: { color: '#92400E' },

  customerSection: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  customerName: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: '#1E293B' },
  customerMobile: { marginLeft: 8, fontSize: 14, color: '#64748B' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 8, marginBottom: 6 },
  rowSuccess: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  rowError: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  itemName: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '500' },
  qtyContainer: { flexDirection: 'row', gap: 10 },
  qtyLabel: { fontSize: 12, color: '#64748B' },

  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, marginTop: 10 },
  errorBannerText: { marginLeft: 8, color: '#B91C1C', fontWeight: '600', fontSize: 13 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  btn: { flex: 1, minWidth: '30%', height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnVerify: { backgroundColor: '#4F46E5' },
  btnInvoice: { backgroundColor: '#7C3AED' },
  btnInvoiceDone: { backgroundColor: '#10B981' },
  btnAssign: { backgroundColor: '#0EA5E9' },
  btnDisabled: { backgroundColor: '#CBD5E1' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 20 },
  invoiceModal: { backgroundColor: '#fff', borderRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  
  invoiceMetaCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  invNoText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  invDateText: { color: '#64748B', fontSize: 12, marginTop: 2 },
  invAmountContainer: { alignItems: 'flex-end' },
  invAmountLabel: { fontSize: 10, color: '#64748B', textTransform: 'uppercase' },
  invAmountValue: { fontSize: 20, fontWeight: '900', color: '#4F46E5' },

  medicineCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  medicineNameText: { fontWeight: '700', color: '#334155' },
  medicineDetailsText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  medicinePriceText: { fontWeight: '800', color: '#1E293B' },

  invoiceFooterActions: { flexDirection: 'row', gap: 10, marginTop: 20, paddingBottom: 10 },
  footerBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerBtnText: { color: '#fff', fontWeight: '700' },

  freightCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  freightTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  freightSub: { textAlign: 'center', color: '#64748B', marginTop: 6, marginBottom: 20 },
  freightOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  freightOptionText: { flex: 1, marginLeft: 12, fontWeight: '600', color: '#334155' },
  freightCancel: { marginTop: 10, padding: 16 },
  freightCancelText: { textAlign: 'center', fontWeight: '700', color: '#EF4444' }
});