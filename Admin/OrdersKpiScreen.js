import React, { useState, useEffect } from "react"; 
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5,Feather } from "@expo/vector-icons";

const ORDERS_URL = "https://hospitaldatabasemanagement.onrender.com/order-medicine/all";
const EMPLOYEES_URL = "https://hospitaldatabasemanagement.onrender.com/employee/all";

const OrdersKpiScreen = () => {
  const [loading, setLoading] = useState(true);
        const [loadingCount, setLoadingCount] = useState(0);

  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [deliveryStats, setDeliveryStats] = useState([]);
  const [summary, setSummary] = useState({
    stock: 0,
    ordersDaily: 0,
    ordersWeekly: 0,
    ordersMonthly: 0,
    totalRevenue: 0,
  });

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
  useEffect(() => {
          let interval;
          if (loading) {
            setLoadingCount(0);
            interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
          } else clearInterval(interval);
          return () => clearInterval(interval);
        }, [loading]);
  // Fetch Orders
  const fetchOrders = async () => {
    try {
      const res = await fetch(ORDERS_URL);
      const data = await res.json();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to fetch orders");
    }
  };

  // Fetch Delivery Boys (only role 'hd delivery')
  const fetchDeliveryBoys = async () => {
    try {
      const res = await fetch(EMPLOYEES_URL);
      const data = await res.json();

      if (!data.employees || data.employees.length === 0) {
        setDeliveryBoys([]);
        return;
      }

      // Filter only HD Delivery role
      const filtered = data.employees.filter(emp => {
        const role = emp.role?.toLowerCase().trim().replace(/\s+/g, ' ');
        return role === "hd delivery";
      });

      const mapped = filtered.map(emp => ({
        id: emp.id.toString(),
        name: emp.full_name,
      }));

      setDeliveryBoys(mapped);
    } catch (error) {
      console.error("Error fetching employees:", error);
      showAlert("Error", "Failed to fetch delivery boys");
    }
  };

  // Calculate summary and delivery stats from orders
  const calculateStats = () => {
  let totalRevenue = 0;
  let totalStock = 0;
  let ordersDaily = 0;
  let ordersWeekly = 0;
  let ordersMonthly = 0;

  const deliverySummary = {};

  const now = new Date();

  // ---- DATE HELPERS (timezone safe) ----
  const todayStr = now.toISOString().split("T")[0];

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  orders.forEach(order => {
    const deliveryBoyId = order.deliveryboy_id?.toString();
    const status = order.status?.toLowerCase();

    // ✅ handle both createdAt & created_at
    const orderDate = new Date(order.createdAt || order.created_at);
    if (isNaN(orderDate)) return;

    const orderDateStr = orderDate.toISOString().split("T")[0];

    // -------- Revenue --------
    totalRevenue += Number(order.total) || 0;

    // -------- Stock --------
    order.order_summary?.forEach(item => {
      totalStock += Number(item.quantity) || 0;
    });

 // TODAY
if (orderDateStr === todayStr) {
  ordersDaily += 1;
}

// WEEK (Monday–Sunday)
if (orderDate >= startOfWeek && orderDate <= now) {
  ordersWeekly += 1;
}

// MONTH
if (
  orderDate.getFullYear() === now.getFullYear() &&
  orderDate.getMonth() === now.getMonth()
) {
  ordersMonthly += 1;
}


    // -------- DELIVERY PERFORMANCE --------
    if (deliveryBoyId) {
      const boy = deliveryBoys.find(b => b.id === deliveryBoyId);
      if (!boy) return;

      if (!deliverySummary[deliveryBoyId]) {
        deliverySummary[deliveryBoyId] = {
          name: boy.name,
          completed: 0,
          pending: 0,
        };
      }

      if (status === "delivered") {
        deliverySummary[deliveryBoyId].completed += 1;
      } else {
        deliverySummary[deliveryBoyId].pending += 1;
      }
    }
  });

  setSummary({
    stock: totalStock,
    ordersDaily,
    ordersWeekly,
    ordersMonthly,
    totalRevenue: totalRevenue.toFixed(2),
  });

  setDeliveryStats(Object.values(deliverySummary));
};

  const getPerformance = (completed, pending) => {
    const total = completed + pending;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchDeliveryBoys();
      await fetchOrders();
      setLoading(false);
    };
    fetchData();
  }, []);

  // Recalculate stats whenever orders or delivery boys change
  useEffect(() => {
    if (orders.length && deliveryBoys.length) {
      calculateStats();
    }
  }, [orders, deliveryBoys]);

  if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading{loadingCount}s</Text>
        </View>
      );
 return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Inventory Insights</Text>
          <Text style={styles.headerSub}>Real-time monitoring & analytics</Text>
        </View>

        {/* Primary Metric: Total Stock */}
        <View style={styles.mainStockCard}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="warehouse" size={30} color="#0284c7" />
          </View>
          <View>
            <Text style={styles.stockLabel}>Global Stock Inventory</Text>
            <Text style={styles.stockValue}>{summary.stock} <Text style={styles.unitText}>Units</Text></Text>
          </View>
        </View>

        {/* Grid Stats */}
        <View style={styles.gridContainer}>
          <View style={[styles.gridCard, { borderLeftColor: "#EAB308" }]}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridLabel}>Today</Text>
              <Feather name="shopping-cart" size={16} color="#EAB308" />
            </View>
            <Text style={styles.gridValue}>{summary.ordersDaily}</Text>
          </View>

          <View style={[styles.gridCard, { borderLeftColor: "#EC4899" }]}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridLabel}>This Week</Text>
              <Feather name="trending-up" size={16} color="#EC4899" />
            </View>
            <Text style={styles.gridValue}>{summary.ordersWeekly}</Text>
          </View>
        </View>

        <View style={styles.gridContainer}>
          <View style={[styles.gridCard, { borderLeftColor: "#8B5CF6" }]}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridLabel}>Monthly</Text>
              <Feather name="calendar" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.gridValue}>{summary.ordersMonthly}</Text>
          </View>

          <View style={[styles.gridCard, { borderLeftColor: "#10B981" }]}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridLabel}>Revenue</Text>
              <FontAwesome5 name="rupee-sign" size={14} color="#10B981" />
            </View>
            <Text style={[styles.gridValue, { color: "#064E3B" }]}>₹{summary.totalRevenue}</Text>
          </View>
        </View>

        {/* Delivery Section */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Agent Performance</Text>
          <View style={styles.activeBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.activeText}>Live</Text>
          </View>
        </View>

        {deliveryStats.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No dispatch data available for this period.</Text>
          </View>
        ) : (
          deliveryStats.map((boy) => {
            const performance = getPerformance(boy.completed, boy.pending);
            return (
              <View key={boy.name} style={styles.deliveryCard}>
                <View style={styles.deliveryInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{boy.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deliveryName}>{boy.name}</Text>
                    <View style={styles.orderSummaryRow}>
                      <Text style={styles.orderSummaryText}>Done: <Text style={styles.bold}>{boy.completed}</Text></Text>
                      <View style={styles.dotSeparator} />
                      <Text style={styles.orderSummaryText}>Wait: <Text style={[styles.bold, { color: "#EF4444" }]}>{boy.pending}</Text></Text>
                    </View>
                  </View>
                  <View style={styles.perfTag}>
                    <Text style={styles.perfTagText}>{performance}%</Text>
                  </View>
                </View>

                <View style={styles.progressBarWrapper}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${performance}%` }]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersKpiScreen;

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderText: { marginTop: 12, color: "#64748B", fontWeight: "600" },

  headerContainer: { marginBottom: 25 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: "#64748B", marginTop: 2 },

  mainStockCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  stockLabel: { fontSize: 13, fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5 },
  stockValue: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
  unitText: { fontSize: 16, fontWeight: "400", color: "#94A3B8" },

  gridContainer: { flexDirection: "row", gap: 12, marginBottom: 12 },
  gridCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  gridHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  gridLabel: { fontSize: 12, fontWeight: "700", color: "#64748B", textTransform: "uppercase" },
  gridValue: { fontSize: 22, fontWeight: "800", color: "#1E293B" },

  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  activeBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981", marginRight: 6 },
  activeText: { fontSize: 10, fontWeight: "800", color: "#059669", textTransform: "uppercase" },

  deliveryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
  },
  deliveryInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E0F2FE", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#0284C7" },
  deliveryName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  orderSummaryRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  orderSummaryText: { fontSize: 12, color: "#64748B" },
  bold: { fontWeight: "700", color: "#1E293B" },
  dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#CBD5E1", marginHorizontal: 8 },
  perfTag: { backgroundColor: "#F1F5F9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  perfTagText: { fontSize: 12, fontWeight: "800", color: "#475569" },

  progressBarWrapper: { marginTop: 15 },
  progressBarBg: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: 6, backgroundColor: "#10B981", borderRadius: 3 },

  emptyCard: { padding: 40, alignItems: "center" },
  emptyText: { color: "#94A3B8", fontSize: 14, textAlign: "center" },
});