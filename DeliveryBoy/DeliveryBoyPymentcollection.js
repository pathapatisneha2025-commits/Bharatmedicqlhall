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

  // 🔥 Split payment
  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");
  const [onlineMode, setOnlineMode] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Only allowed online modes
  const onlineModes = ["UPI", "Card", "Net Banking"];

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
      Alert.alert("Error", "Please select payment mode");
      return;
    }

    let finalPaymentMode = paymentMode;

    // CASH ONLY
    if (paymentMode === "Cash Only") {
      if (!amountReceived || Number(amountReceived) !== totalAmount) {
        Alert.alert("Error", "Cash amount must equal total amount");
        return;
      }
    }

    // ONLINE ONLY
    if (paymentMode === "Online Only") {
      if (!onlineMode) {
        Alert.alert("Error", "Select online payment type");
        return;
      }
      if (!amountReceived || Number(amountReceived) !== totalAmount) {
        Alert.alert("Error", "Online amount must equal total amount");
        return;
      }
      finalPaymentMode = onlineMode;
    }

    // 🔥 CASH + ONLINE
    if (paymentMode === "Cash + Online") {
      if (!onlineMode) {
        Alert.alert("Error", "Select online payment type");
        return;
      }

      const cash = Number(cashAmount || 0);
      const online = Number(onlineAmount || 0);

      if (cash + online !== totalAmount) {
        Alert.alert("Error", "Cash + Online must equal total amount");
        return;
      }

      finalPaymentMode = `Cash:${cash}, ${onlineMode}:${online}`;
    }

    try {
      // 1️⃣ Order medicine payment
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
        Alert.alert("Error", "Payment failed");
        return;
      }

      // 2️⃣ Sales payment
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
        Alert.alert("Warning", "Saved in first table, failed in second");
        return;
      }

      Alert.alert("Success", "Payment collected successfully");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server error");
    }
  };
  if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );

  // ✅ Only required modes
  const modes = ["Cash Only", "Online Only", "Cash + Online"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.header}>Payment Collection</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Amount */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount to Collect</Text>
          <Text style={styles.amountValue}>₹{totalAmount}</Text>
        </View>

        {/* Payment Mode */}
        <View style={styles.card}>
          <Text style={styles.title}>Payment Mode</Text>
          {modes.map((m, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.radioRow}
              onPress={() => {
                setPaymentMode(m);
                setAmountReceived("");
                setCashAmount("");
                setOnlineAmount("");
                setOnlineMode("");
              }}
            >
              <View style={styles.radioCircle}>
                {paymentMode === m && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioText}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CASH ONLY / ONLINE ONLY */}
        {(paymentMode === "Cash Only" || paymentMode === "Online Only") && (
          <View style={styles.card}>
            {paymentMode === "Online Only" && (
              <>
                <Text style={styles.title}>Online Payment Type</Text>
                {onlineModes.map((m, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.radioRow}
                    onPress={() => setOnlineMode(m)}
                  >
                    <View style={styles.radioCircle}>
                      {onlineMode === m && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioText}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={{ marginTop: 10 }}>Amount Received</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Enter Amount"
              value={amountReceived}
              onChangeText={setAmountReceived}
              style={styles.input}
            />
          </View>
        )}

        {/* 🔥 CASH + ONLINE */}
        {paymentMode === "Cash + Online" && (
          <View style={styles.card}>
            <Text style={styles.title}>Split Payment</Text>

            <Text>Cash Received</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Enter Cash Amount"
              value={cashAmount}
              onChangeText={handleCashChange}
              style={styles.input}
            />

            <Text style={{ marginTop: 10 }}>Online Payment Type</Text>
            {onlineModes.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={styles.radioRow}
                onPress={() => setOnlineMode(m)}
              >
                <View style={styles.radioCircle}>
                  {onlineMode === m && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>{m}</Text>
              </TouchableOpacity>
            ))}

            <Text style={{ marginTop: 10 }}>Online Amount</Text>
            <TextInput
              value={onlineAmount}
              editable={false}
              style={[styles.input, { backgroundColor: "#f1f3f5" }]}
            />

            <Text style={{ marginTop: 8, fontWeight: "600", color: "#28a745" }}>
              Total: ₹{Number(cashAmount || 0) + Number(onlineAmount || 0)}
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Collect Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { padding: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  header: { fontSize: 22, fontWeight: "bold" },
  amountBox: {
    backgroundColor: "#e9f2ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  amountLabel: { fontSize: 16 },
  amountValue: { fontSize: 30, fontWeight: "bold", color: "#007bff" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  radioRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  radioCircle: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#007bff",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    height: 10,
    width: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  radioText: { fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  submitBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 10,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});
