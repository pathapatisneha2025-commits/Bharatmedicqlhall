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
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

const API_URL = "https://hospitaldatabasemanagement.onrender.com/picker";
const SALES_ORDER_API = "https://hospitaldatabasemanagement.onrender.com/salesorders";

export default function CheckerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // Invoice modal state
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
const [freightModal, setFreightModal] = useState(false);
const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch all picked orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/picked/all`);
      const data = await res.json();
      // If backend returns an object with success flag adjust accordingly
      // Assuming `data` is array of orders
      setOrders(Array.isArray(data) ? data : data || []);
    } catch (err) {
      console.log("Fetch Error:", err);
      Alert.alert("Error", "Unable to fetch orders.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Check mismatch for each order
  const hasMismatch = (items) => {
    if (!items || !Array.isArray(items)) return false;
    for (let i of items) {
      if (Number(i.quantity) !== Number(i.picked_qty)) return true;
    }
    return false;
  };

  // Verify order (mark as Checked)
  const verifyOrder = async (order) => {
    const mismatch = hasMismatch(order.picked_items);

    if (mismatch) {
      Alert.alert("Mismatch", "Picker quantities do not match.");
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
        Alert.alert("Success", `Order #${order.id} verified!`);
        await fetchOrders();
      } else {
        Alert.alert("Error", data.error || "Failed to verify order.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Server Error", "Unable to verify order.");
    }

    setProcessing(null);
  };

  // -----------------------------------------
  // 🔵 Generate Invoice (AUTO-OPEN modal)
  // -----------------------------------------
  const generateInvoice = async (order) => {
    if (order.status !== "Checked") {
      Alert.alert("Hold On", "Verify the order before generating invoice.");
      return;
    }

    setGeneratingInvoice(true);
    try {
      const res = await fetch(
        `${SALES_ORDER_API}/generate-invoice/${order.id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        // backend returns inserted invoice inside data (as per your backend)
        const invoice = data.data || data; // fallback
        // ensure medicines is parsed array
        if (typeof invoice.medicines === "string") {
          try {
            invoice.medicines = JSON.parse(invoice.medicines);
          } catch (e) {
            // if already array or cannot parse, leave it
          }
        }

        setInvoiceData(invoice);
        setInvoiceVisible(true); // auto-open modal
        await fetchOrders(); // refresh orders
      } else {
        Alert.alert("Error", data.error || "Failed to generate invoice");
      }
    } catch (err) {
      console.log("Generate Invoice Error:", err);
      Alert.alert("Server Error", "Unable to generate invoice.");
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
      Alert.alert("Saved", "Freight option updated.");
      setFreightModal(false);
      fetchOrders(); // refresh
    } else {
      Alert.alert("Error", data.error || "Unable to save freight option.");
    }
  } catch (err) {
    Alert.alert("Error", "Server error while saving.");
  }
};



  // -----------------------------------------
  // 🚴 DELIVERY BOY ASSIGN LOGIC
  // -----------------------------------------
 const handleDeliveryBoyAssign = async (order) => {
  if (order.status !== "Checked") {
    Alert.alert("Hold On", "Please verify the order before assignment.");
    return;
  }

  // ------------------------------------------
  // 1️⃣ LOCAL DELIVERY → DIRECT ASSIGN
  // ------------------------------------------
  if (order.delivery_type === "local") {
    navigation.navigate("AssignDeliveryBoyScreen", {
      orderId: order.id,
      type: "salesorder",
    });
    return;
  }

  // ------------------------------------------
  // 2️⃣ OUTSIDE DELIVERY → PAYMENT + INVOICE RULES
  // ------------------------------------------
  if (order.delivery_type === "outside") {
    const res = await fetch(
      `${BASE_URL}/orders/payment-status/${order.id}`
    );
    const data = await res.json();

    if (!data.invoice_generated) {
      Alert.alert("Invoice Required", "Generate invoice before assignment.");
      return;
    }

    if (!data.payment_received && !data.credit_approved) {
      Alert.alert(
        "Payment Pending",
        "Payment is required before assigning delivery."
      );
      return;
    }

    navigation.navigate("AssignDeliveryBoyScreen", {
      orderId: order.id,
      type: "salesorder",
    });
    return;
  }

  // ------------------------------------------
  // 3️⃣ BUS DELIVERY → INVOICE + FREIGHT CHECK
  // ------------------------------------------
  if (order.delivery_type === "bus") {
    if (!order.invoice_generated) {
      Alert.alert("Invoice Required", "Bus orders require invoice.");
      return;
    }

  if (!order.freight_option_selected) {
  setSelectedOrder(order);
  setFreightModal(true);   // OPEN MODAL
  return;
}


    // Payment logic depending on freight option
    if (order.freight_option_selected === "customer_to_company") {
      if (!order.payment_received) {
        Alert.alert(
          "Payment Required",
          "Customer must pay item + freight before dispatch."
        );
        return;
      }
    }

    navigation.navigate("AssignDeliveryBoyScreen", {
      orderId: order.id,
      type: "salesorder",
    });
    return;
  }
};


  // Copy invoice number to clipboard
  const copyInvoiceNo = async () => {
    if (!invoiceData) return;
    const text = invoiceData.invoice_no || "";
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(text);
      } else {
        Clipboard.setString(text);
      }
      Alert.alert("Copied", "Invoice number copied to clipboard.");
    } catch (err) {
      Alert.alert("Error", "Unable to copy.");
    }
  };
if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );
  // Render medicine item
  const renderMedicine = ({ item, index }) => {
    return (
      <View style={styles.medicineRow}>
        <Text style={styles.medicineIndex}>{index + 1}.</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.medicineName}>{item.name}</Text>
          <Text style={styles.medicineSub}>
            {item.quantity} x ₹{item.unitPrice ?? (item.rate ?? 0)} = ₹{item.total}
          </Text>
        </View>
        <Text style={styles.medicineTotal}>₹{item.total}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Verify Picked Orders</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.noOrders}>No Picked Orders</Text>
        ) : (
          orders.map((order) => {
            const mismatch = hasMismatch(order.picked_items);

            return (
              <View key={order.id} style={styles.card}>
                {/* ORDER HEADER */}
                <View style={styles.orderRow}>
                  <MaterialIcons name="assignment" size={24} color="#2e7d32" />
                  <Text style={styles.orderId}>Order #{order.id}</Text>

                  <View
                    style={[
                      styles.statusBadge,
                      order.status === "Checked"
                        ? { backgroundColor: "#4caf50" }
                        : { backgroundColor: "#ff9800" },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {order.status || "Picked"}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER INFO */}
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={22} color="#555" />
                  <View style={styles.infoText}>
                    <Text style={styles.label}>Customer</Text>
                    <Text style={styles.value}>{order.customer_name}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="call" size={22} color="#555" />
                  <View style={styles.infoText}>
                    <Text style={styles.label}>Mobile</Text>
                    <Text style={styles.value}>{order.mobile}</Text>
                  </View>
                </View>

                {/* ITEMS */}
                <Text style={styles.sectionHeader}>Items Verification</Text>

                {order.picked_items.map((i, idx) => {
                  const itemMismatch = Number(i.quantity) !== Number(i.picked_qty);

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.itemRow,
                        itemMismatch ? styles.mismatchBox : styles.correctBox,
                      ]}
                    >
                      <View>
                        <Text style={styles.itemText}>• {i.item_name}</Text>
                      </View>

                      <View>
                        <Text style={styles.qtyText}>Ordered: {i.quantity}</Text>
                        <Text style={styles.pickedText}>Picked: {i.picked_qty}</Text>
                      </View>
                    </View>
                  );
                })}

                {/* MISMATCH */}
                {mismatch && (
                  <View style={styles.alertBox}>
                    <Ionicons name="warning" size={22} color="#b71c1c" />
                    <Text style={styles.alertText}>
                      Mismatch found! Ask picker to correct.
                    </Text>
                  </View>
                )}

                {/* VERIFY BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    mismatch ? { backgroundColor: "#777" } : {},
                  ]}
                  onPress={() => verifyOrder(order)}
                  disabled={mismatch || processing === order.id}
                >
                  {processing === order.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                      <Text style={styles.verifyText}>Mark as Checked</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* INVOICE BUTTON (OUTSIDE ONLY) */}
                {order.delivery_type === "outside"|| order.delivery_type === "bus"&&(
                  <>
                    {order.invoice_generated ? (
                      <View style={styles.invoiceDoneBadge}>
                        <Ionicons name="receipt" size={20} color="#fff" />
                        <Text style={styles.invoiceDoneText}>Invoice Generated</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.invoiceButton}
                        onPress={() => generateInvoice(order)}
                      >
                        {generatingInvoice ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="receipt-outline" size={22} color="#fff" />
                            <Text style={styles.invoiceText}>Generate Invoice</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* ASSIGN DELIVERY BOY */}
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => handleDeliveryBoyAssign(order)}
                >
                  <Ionicons name="bicycle" size={22} color="#fff" />
                  <Text style={styles.assignText}>Assign Delivery Boy</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ---------------- INVOICE MODAL ---------------- */}
      <Modal
        visible={invoiceVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInvoiceVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice</Text>
              <TouchableOpacity onPress={() => setInvoiceVisible(false)}>
                <Ionicons name="close" size={26} color="#222" />
              </TouchableOpacity>
            </View>

            {invoiceData ? (
              <ScrollView style={{ paddingHorizontal: 12 }}>
                {/* Invoice header */}
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceNo}>{invoiceData.invoice_no}</Text>
                    <Text style={styles.invoiceSub}>
                      {invoiceData.customer_name} • {invoiceData.customer_mobile}
                    </Text>
                    <Text style={styles.invoiceSub}>
                      {invoiceData.address || ""}
                    </Text>
                  </View>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>₹{invoiceData.total_amount}</Text>
                  </View>
                </View>

                {/* medicines list */}
                <Text style={styles.itemsHeader}>Items</Text>
                <FlatList
                  data={invoiceData.medicines || []}
                  keyExtractor={(item, i) => `${item.name}-${i}`}
                  renderItem={renderMedicine}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                  contentContainerStyle={{ paddingBottom: 10 }}
                />

                {/* Payment mode and created at */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Payment</Text>
                  <Text style={styles.metaValue}>
                    {invoiceData.payment_mode || "N/A"}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Created</Text>
                  <Text style={styles.metaValue}>
                    {invoiceData.created_at
                      ? new Date(invoiceData.created_at).toLocaleString()
                      : ""}
                  </Text>
                </View>

                {/* Action buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#1976d2" }]}
                    onPress={copyInvoiceNo}
                  >
                    <Ionicons name="copy" size={18} color="#fff" />
                    <Text style={styles.actionText}>Copy Invoice No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#4caf50" }]}
                    onPress={() => {
                      // placeholder for print / share
                      Alert.alert("Print", "Implement print/share logic as needed.");
                    }}
                  >
                    <Ionicons name="print" size={18} color="#fff" />
                    <Text style={styles.actionText}>Print</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#777" }]}
                    onPress={() => setInvoiceVisible(false)}
                  >
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.actionText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={{ padding: 20 }}>
                <ActivityIndicator size="large" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
  visible={freightModal}
  transparent
  animationType="fade"
  onRequestClose={() => setFreightModal(false)}
>
  <View style={{
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  }}>
    <View style={{
      backgroundColor: "#fff",
      width: "85%",
      padding: 20,
      borderRadius: 12
    }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Select Freight Option
      </Text>

      {/* OPTIONS */}
      {[
  { key: "customer_to_bus", label: "Customer will pay at Bus" },
  { key: "BHM_to_bus", label: "BHM Company will pay Bus" },
  { key: "customer_to_company", label: "Customer pays Company (Item + Freight)" },
  { key: "delivery_boy_to_bus", label: "Delivery Boy will pay Bus" }
].map(option => (
  <TouchableOpacity
    key={option.key}
    style={{
      padding: 12,
      backgroundColor: "#e3f2fd",
      marginTop: 10,
      borderRadius: 8
    }}
    onPress={() => saveFreightOption(option.key)}
  >
    <Text style={{ fontSize: 16 }}>{option.label}</Text>
  </TouchableOpacity>
))}


      <TouchableOpacity
        style={{
          marginTop: 14,
          padding: 12,
          backgroundColor: "#777",
          borderRadius: 8,
          alignItems: "center"
        }}
        onPress={() => setFreightModal(false)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f3f4" },

  header: {
    padding: 15,
    backgroundColor: "#fff",
    elevation: 4,
  },
  headerText: { fontSize: 22, fontWeight: "bold" },

  noOrders: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#777",
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    margin: 12,
    borderRadius: 12,
    elevation: 3,
  },

  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  orderId: { marginLeft: 10, fontSize: 18, fontWeight: "bold", flex: 1 },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontWeight: "bold",
  },

  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  infoText: { marginLeft: 10 },
  label: { color: "#777", fontSize: 13 },
  value: { fontSize: 16, fontWeight: "600" },

  sectionHeader: { marginTop: 15, fontSize: 17, fontWeight: "bold" },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    marginTop: 6,
    borderRadius: 10,
  },
  correctBox: { backgroundColor: "#e8f5e9" },
  mismatchBox: { backgroundColor: "#ffebee" },

  itemText: { fontSize: 15 },
  qtyText: { fontSize: 14, fontWeight: "600" },
  pickedText: { fontSize: 14 },

  alertBox: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  alertText: { marginLeft: 10, color: "#b71c1c" },

  verifyButton: {
    backgroundColor: "#4caf50",
    marginTop: 18,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  verifyText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },

  invoiceButton: {
    backgroundColor: "#6a1b9a",
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  invoiceText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },

  invoiceDoneBadge: {
    backgroundColor: "#2e7d32",
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  invoiceDoneText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },

  assignButton: {
    backgroundColor: "#1976d2",
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  assignText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },

  /* ---------------- Modal styles (B2 Card style) ---------------- */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    maxHeight: "90%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },

  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  invoiceNo: { fontSize: 16, fontWeight: "800" },
  invoiceSub: { color: "#555", marginTop: 6 },

  totalBox: {
    backgroundColor: "#f5f7fb",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  totalLabel: { color: "#666", fontSize: 12 },
  totalAmount: { fontSize: 18, fontWeight: "800" },

  itemsHeader: { marginTop: 6, fontSize: 16, fontWeight: "700", paddingBottom: 6 },

  medicineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  medicineIndex: { width: 26, color: "#444" },
  medicineName: { fontWeight: "700" },
  medicineSub: { color: "#666", marginTop: 4 },
  medicineTotal: { marginLeft: 8, fontWeight: "700" },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  metaLabel: { color: "#777" },
  metaValue: { fontWeight: "700" },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingBottom: 24,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: { color: "#fff", marginLeft: 8, fontWeight: "700" },
});

