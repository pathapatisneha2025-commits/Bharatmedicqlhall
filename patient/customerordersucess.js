import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getOrderId } from "../utils/storage";

// Bharat Medical Theme Colors
const COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981", // Success green
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#1e293b",
  textLight: "#64748b",
  border: "#e2e8f0",
};

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [orderId, setOrderId] = useState();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 500;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 32;

  const totalAmount = route?.params?.totalAmount || 0;
  const expectedDelivery = route?.params?.expectedDelivery || new Date().toISOString();
  const orderDate = route?.params?.orderDate || new Date().toISOString();
  let orderSummary = route?.params?.orderSummary || [];

  useEffect(() => {
    const fetchOrderId = async () => {
      if (!route?.params?.orderId) {
        const storedOrderId = await getOrderId();
        if (storedOrderId) setOrderId(storedOrderId);
      } else {
        setOrderId(route.params.orderId);
      }
    };
    fetchOrderId();
  }, [route?.params?.orderId]);

  if (!Array.isArray(orderSummary)) {
    orderSummary = [orderSummary];
  }

  const orderNames = orderSummary.length > 0
      ? orderSummary.map((item, index) => item?.name || item?.productName || `Item ${index + 1}`).join(", ")
      : "Medicine Package";

  const getDeliveryDays = () => {
    const today = new Date();
    const deliveryDate = new Date(expectedDelivery);
    const diffTime = deliveryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? "today or tomorrow" : `${diffDays} days`;
  };

  const formatDateTime = (datetime) => {
    const dateObj = new Date(datetime);
    return `${dateObj.toLocaleDateString()} at ${dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainCard, { width: containerWidth }]}>
          
          {/* ✅ Status Header */}
          <View style={styles.successHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-sharp" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.title}>Order Placed!</Text>
            <Text style={styles.subtitle}>
              Your request has been received and is being processed by our pharmacy.
            </Text>
          </View>

          <View style={styles.divider} />

          {/* 📦 Delivery Banner */}
          <View style={styles.deliveryBanner}>
            <MaterialIcons name="local-shipping" size={20} color={COLORS.secondary} />
            <Text style={styles.deliveryText}>
              Arriving in <Text style={styles.boldText}>{getDeliveryDays()}</Text>
            </Text>
          </View>

          {/* 📋 Order Information */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Order ID</Text>
              <Text style={styles.value}>#{orderId || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Placed On</Text>
              <Text style={styles.value}>{formatDateTime(orderDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Items</Text>
              <Text style={styles.value} numberOfLines={1}>{orderNames}</Text>
            </View>

            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          {/* 🏠 Actions */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("bottomtab")}
            >
              <Text style={styles.btnText}>Return to Home</Text>
              <Ionicons name="home-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate("patientorders")}
            >
              <Text style={styles.secondaryBtnText}>Track Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: { boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 5 }
    })
  },
  successHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    width: "100%",
    marginVertical: 20,
  },
  deliveryBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  deliveryText: {
    color: "#065f46",
    fontSize: 14,
    fontWeight: "600",
  },
  infoSection: {
    gap: 16,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: "600",
    maxWidth: '60%',
    textAlign: 'right'
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderStyle: 'dashed'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: "600",
  },
  boldText: {
    fontWeight: "800",
  }
});