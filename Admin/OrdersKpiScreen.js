import React, { useState, useEffect } from "react"; 
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

const ORDERS_URL = "https://hospitaldatabasemanagement.onrender.com/order-medicine/all";
const EMPLOYEES_URL = "https://hospitaldatabasemanagement.onrender.com/employee/all";

const OrdersKpiScreen = () => {
  const [loading, setLoading] = useState(true);
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
      Alert.alert("Error", "Failed to fetch delivery boys");
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
          <Text>Loading...</Text>
        </View>
      );
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Orders & Stock Dashboard</Text>

      {/* Stock Card */}
      <View style={[styles.card, styles.stockCard]}>
        <MaterialCommunityIcons name="warehouse" size={30} color="#0284c7" />
        <View style={{ marginLeft: 16 }}>
          <Text style={styles.cardTitle}>Stock</Text>
          <Text style={styles.cardValue}>{summary.stock}</Text>
        </View>
      </View>

      {/* Orders Cards */}
      <View style={styles.cardRow}>
        <View style={[styles.card, styles.dailyCard]}>
          <Ionicons name="cart-outline" size={28} color="#ca8a04" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.cardTitle}>Today</Text>
            <Text style={styles.cardValue}>{summary.ordersDaily}</Text>
          </View>
        </View>

        <View style={[styles.card, styles.weeklyCard]}>
          <Ionicons name="calendar-outline" size={28} color="#db2777" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.cardTitle}>This Week</Text>
            <Text style={styles.cardValue}>{summary.ordersWeekly}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.card, styles.monthlyCard]}>
          <Ionicons name="calendar-sharp" size={28} color="#7c3aed" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.cardTitle}>This Month</Text>
            <Text style={styles.cardValue}>{summary.ordersMonthly}</Text>
          </View>
        </View>

        <View style={[styles.card, styles.revenueCard]}>
          <FontAwesome5 name="rupee-sign" size={28} color="#16a34a" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.cardTitle}>Revenue</Text>
            <Text style={styles.cardValue}>₹{summary.totalRevenue}</Text>
          </View>
        </View>
      </View>

      {/* Delivery Boys Performance */}
      <Text style={styles.sectionHeader}>Delivery Boys Performance</Text>
      <View>
        {deliveryStats.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>No delivery data yet.</Text>
        ) : (
          deliveryStats.map((boy) => {
            const performance = getPerformance(boy.completed, boy.pending);
            return (
              <View key={boy.name} style={styles.deliveryCard}>
                <View style={styles.deliveryHeader}>
                  <Ionicons name="person-circle-outline" size={28} color="#0284c7" />
                  <Text style={styles.deliveryName}>{boy.name}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusText, { color: "#16a34a" }]}>
                    Completed: {boy.completed}
                  </Text>
                  <Text style={[styles.statusText, { color: "#dc2626" }]}>
                    Pending: {boy.pending}
                  </Text>
                </View>

                <View style={styles.performanceBarBackground}>
                  <View
                    style={[styles.performanceBarFill, { width: `${performance}%` }]}
                  />
                </View>
                <Text style={styles.performanceText}>Performance: {performance}%</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default OrdersKpiScreen;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f8fafc" },
  header: { fontSize: 28, fontWeight: "700", color: "#2563eb", marginBottom: 20, textAlign: "center" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  card: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, marginHorizontal: 4 },
  stockCard: { backgroundColor: "#e0f2fe", marginBottom: 12 },
  dailyCard: { backgroundColor: "#fef3c7" },
  weeklyCard: { backgroundColor: "#fce7f3" },
  monthlyCard: { backgroundColor: "#ede9fe" },
  revenueCard: { backgroundColor: "#dcfce7" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  cardValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sectionHeader: { fontSize: 20, fontWeight: "700", color: "#2563eb", marginVertical: 14 },
  deliveryCard: { backgroundColor: "#f0f9ff", borderRadius: 14, padding: 14, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  deliveryHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  deliveryName: { fontSize: 18, fontWeight: "700", marginLeft: 10 },
  statusRow: { flexDirection: "row", justifyContent: "space-between" },
  statusText: { fontSize: 14, fontWeight: "600" },
  performanceBarBackground: { height: 10, borderRadius: 8, backgroundColor: "#d1d5db", marginTop: 8, overflow: "hidden" },
  performanceBarFill: { height: 10, borderRadius: 8, backgroundColor: "#16a34a" },
  performanceText: { fontSize: 12, color: "#374151", fontWeight: "500", marginTop: 4 },
});
