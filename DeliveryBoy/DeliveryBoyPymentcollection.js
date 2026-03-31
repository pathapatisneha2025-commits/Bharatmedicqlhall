import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function PaymentCollectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { orderId, amount, deliveryBoyId, deliveryType } = route.params;
  const totalAmount = Number(amount);

  const [paymentMode, setPaymentMode] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");
  const [onlineMode, setOnlineMode] = useState("");
  const [loading, setLoading] = useState(false);

  const onlineModes = ["UPI", "Card", "Net Banking"];
  const modes = ["Cash Only", "Online Only", "Cash + Online"];
  
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;
  const CONTENT_MAX_WIDTH = 1000;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleCashChange = (value) => {
    setCashAmount(value);
    const cash = Number(value || 0);
    if (cash <= totalAmount) {
      setOnlineAmount((totalAmount - cash).toString());
    } else {
      setOnlineAmount("0");
    }
  };

  const handleSubmit = async () => {
    if (!paymentMode) {
      showAlert("Error", "Please select payment mode");
      return;
    }

    let finalPaymentMode = paymentMode;

    if (paymentMode === "Cash Only") {
      if (!amountReceived || Number(amountReceived) !== totalAmount) {
        showAlert("Error", "Cash amount must equal total amount");
        return;
      }
    }

    if (paymentMode === "Online Only") {
      if (!onlineMode) {
        showAlert("Error", "Select online payment type");
        return;
      }
      if (!amountReceived || Number(amountReceived) !== totalAmount) {
        showAlert("Error", "Online amount must equal total amount");
        return;
      }
      finalPaymentMode = onlineMode;
    }

    if (paymentMode === "Cash + Online") {
      if (!onlineMode) {
        showAlert("Error", "Select online payment type");
        return;
      }
      const cash = Number(cashAmount || 0);
      const online = Number(onlineAmount || 0);
      if (cash + online !== totalAmount) {
        showAlert("Error", "Cash + Online must equal total amount");
        return;
      }
      finalPaymentMode = `Cash:${cash}, ${onlineMode}:${online}`;
    }

    setLoading(true);
    try {
      const res1 = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/order-medicine/collect-payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            deliveryBoyId,
            deliveryType,
            amount: totalAmount,
            paymentMode: finalPaymentMode,
            amountReceived: totalAmount,
          }),
        }
      );

      if (!res1.ok) {
        showAlert("Error", "Payment failed");
        setLoading(false);
        return;
      }

      const res2 = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/salesorders/sales/payment/collect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            collected_by: deliveryBoyId,
            amount_collected: totalAmount,
            payment_mode_collected: finalPaymentMode,
            remarks: `Delivery Type: ${deliveryType}`,
          }),
        }
      );

      if (!res2.ok) {
        showAlert("Warning", "Payment partially saved. Please check with admin.");
        setLoading(false);
        return;
      }

      showAlert("Success ✅", "Payment collected successfully");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      showAlert("Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Processing Transaction...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collect Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.responsiveWrapper, isDesktop && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" }]}>
          
          <View style={[styles.mainLayout, isDesktop && styles.desktopRow]}>
            {/* Left Column: Totals and Mode Selection */}
            <View style={[isDesktop ? styles.column : null]}>
              <View style={styles.amountBox}>
                <View>
                  <Text style={styles.amountLabel}>Total Receivable</Text>
                  <Text style={styles.amountValue}>₹{totalAmount}</Text>
                </View>
                <Ionicons name="wallet-outline" size={40} color="rgba(255,255,255,0.5)" />
              </View>

              <View style={styles.card}>
                <Text style={styles.title}>Payment Mode</Text>
                <View style={styles.modeContainer}>
                  {modes.map((m, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.radioRow, paymentMode === m && styles.radioRowActive]}
                      onPress={() => {
                        setPaymentMode(m);
                        setAmountReceived("");
                        setCashAmount("");
                        setOnlineAmount("");
                        setOnlineMode("");
                      }}
                    >
                      <View style={[styles.radioCircle, paymentMode === m && styles.radioCircleActive]}>
                        {paymentMode === m && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.radioText, paymentMode === m && styles.radioTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Right Column: Detailed Input */}
            <View style={[isDesktop ? styles.column : null]}>
              {paymentMode === "" ? (
                <View style={styles.placeholderCard}>
                  <Ionicons name="card-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.placeholderText}>
                    Please select a payment mode from the left to continue the transaction.
                  </Text>
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.title}>Transaction Details</Text>
                  
                  {(paymentMode === "Online Only" || paymentMode === "Cash + Online") && (
                    <View style={styles.subSection}>
                      <Text style={styles.inputLabel}>Online Provider</Text>
                      <View style={styles.onlineTypeGrid}>
                        {onlineModes.map((m, i) => (
                          <TouchableOpacity 
                            key={i} 
                            style={[styles.chip, onlineMode === m && styles.chipActive]} 
                            onPress={() => setOnlineMode(m)}
                          >
                            <Text style={[styles.chipText, onlineMode === m && styles.chipTextActive]}>{m}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {paymentMode === "Cash + Online" ? (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Cash Component (Received)</Text>
                        <TextInput
                          keyboardType="numeric"
                          placeholder="0.00"
                          value={cashAmount}
                          onChangeText={handleCashChange}
                          style={styles.input}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Online Component (Balance)</Text>
                        <TextInput
                          value={onlineAmount}
                          editable={false}
                          style={[styles.input, { backgroundColor: "#f8fafc", color: "#64748b" }]}
                        />
                      </View>
                    </>
                  ) : (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Total Amount Collected</Text>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="Enter Amount"
                        value={amountReceived}
                        onChangeText={setAmountReceived}
                        style={styles.input}
                      />
                    </View>
                  )}

                  <View style={styles.footerSummary}>
                    <Text style={styles.summaryText}>Finalizing Amount:</Text>
                    <Text style={styles.summaryTotal}>₹{totalAmount}</Text>
                  </View>

                  <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Confirm & Complete</Text>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  backBtn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 8 },
  container: { padding: 16, flexGrow: 1 },
  responsiveWrapper: { width: "100%" },

  mainLayout: { flexDirection: "column" },
  desktopRow: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
  column: { flex: 1 },

  amountBox: { 
    backgroundColor: "#0ea5e9", 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  },
  amountLabel: { fontSize: 14, color: "#e0f2fe", fontWeight: '600' },
  amountValue: { fontSize: 32, fontWeight: "800", color: "#fff", marginTop: 4 },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 20, color: "#1e293b" },
  
  modeContainer: { gap: 12 },
  radioRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#f1f5f9' 
  },
  radioRowActive: { borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' },
  radioCircle: { 
    height: 20, 
    width: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: "#cbd5e1", 
    marginRight: 12, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  radioCircleActive: { borderColor: "#0ea5e9" },
  radioDot: { height: 10, width: 10, backgroundColor: "#0ea5e9", borderRadius: 5 },
  radioText: { fontSize: 15, color: "#64748b", fontWeight: '500' },
  radioTextActive: { color: "#0ea5e9", fontWeight: '700' },

  placeholderCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed'
  },
  placeholderText: { color: "#94a3b8", textAlign: "center", marginTop: 15, lineHeight: 20 },

  subSection: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  onlineTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  chipActive: { backgroundColor: '#1e293b' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  inputGroup: { marginBottom: 15 },
  input: { 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: "#e2e8f0", 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    color: '#1e293b',
    fontWeight: '600'
  },

  footerSummary: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9' 
  },
  summaryText: { fontSize: 14, color: '#64748b' },
  summaryTotal: { fontSize: 20, fontWeight: '800', color: '#1e293b' },

  submitBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 15,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#f8fafc' },
});