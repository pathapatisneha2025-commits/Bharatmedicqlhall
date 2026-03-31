import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DeliveryBoyOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const [employeeId, setEmployeeId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("total");

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 768;

  const locationSubscriptionRef = useRef(null);
  const orderIdRef = useRef(null);

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  // Loading counter for UI
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  // Get employeeId from storage
  useEffect(() => {
    (async () => {
      const id = await getEmployeeId();
      if (id) setEmployeeId(id);
      else showAlert("Error", "No delivery boy ID found in storage");
    })();
  }, []);

  // Fetch orders when employeeId is available
  useEffect(() => {
    if (employeeId) fetchAssignedOrders(employeeId);
  }, [employeeId]);

  // Fetch Sales Orders
  const fetchSalesAssignedOrders = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/salesorders/by-deliveryboy/${id}`);
      const data = await res.json();
      if (res.ok && data.success) return data.orders.map(o => ({ ...o, isSales: true }));
      return [];
    } catch (err) {
      console.log("Sales Fetch Error:", err);
      return [];
    }
  };

  // Fetch Purchase Orders
  // Fetch Purchase Orders
const fetchPurchaseAssignedOrders = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/purchase-orders/by-delivery-boy/${id}`);
    const data = await res.json();
    if (res.ok && data.success) {
      // Map to consistent field names
      return data.data.map(o => ({
        ...o,
        isPurchase: true,
        supplier_name: o.supplier,              // map supplier
        supplier_address: o.address || "",      // if API has address
        supplier_mobile: o.mobile || "",        // if API has mobile
        purchase_items: o.purchase_items.map(i => ({
          ...i,
          quantity: i.stock                       // map stock to quantity for display
        }))
      }));
    }
    return [];
  } catch (err) {
    console.log("Purchase Fetch Error:", err);
    return [];
  }
};

  // Fetch Direct/Normal Orders + Merge all
  const fetchAssignedOrders = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/deliveryboy/${id}`);
      const normalOrders = await res.json();

      const salesOrders = await fetchSalesAssignedOrders(id);
      const purchaseOrders = await fetchPurchaseAssignedOrders(id);

      const merged = [...normalOrders, ...salesOrders, ...purchaseOrders];
      setOrders(merged);
      setFilteredOrders(merged);
    } catch (error) {
      console.error(error);
      showAlert("Error", "Unable to fetch assigned deliveries.");
    } finally {
      setLoading(false);
    }
  };

  // Search & filter
  const handleSearch = (text) => {
    setSearchText(text);
    const q = text.toLowerCase();
    const filtered = orders.filter((order) => {
      const name = order.isSales
        ? order.customer_name?.toLowerCase()
        : order.isPurchase
        ? order.supplier_name?.toLowerCase()
        : order.address?.name?.toLowerCase();
      const city = order.isSales
        ? order.landmark?.toLowerCase()
        : order.isPurchase
        ? order.supplier_city?.toLowerCase()
        : order.address?.city?.toLowerCase();
      const phone = order.isSales
        ? order.mobile?.toLowerCase()
        : order.isPurchase
        ? order.supplier_mobile?.toLowerCase()
        : order.address?.mobile?.toLowerCase();
      return name?.includes(q) || city?.includes(q) || phone?.includes(q);
    });
    applyFilter(activeFilter, filtered);
  };

  const applyFilter = (filter, orderList = orders) => {
    setActiveFilter(filter);
    const filtered = orderList.filter((o) => {
      const status = o.status?.trim().toLowerCase() || "";
      if (filter === "completed") return status === "delivered";
      if (filter === "pending") return status !== "delivered";
      return true;
    });
    setFilteredOrders(filtered);
  };

  // Location tracking
  const startTrackingLocation = async (orderId) => {
    if (!employeeId) return;
    stopTrackingLocation();
    orderIdRef.current = orderId;

    if (Platform.OS === "web") {
      if (!navigator.geolocation) return;
      locationSubscriptionRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            if (!orderIdRef.current) return;
            await fetch(`${BASE_URL}/deliveryboy/order/update-location`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderIdRef.current,
                deliveryBoyId: employeeId,
                latitude,
                longitude,
              }),
            });
          } catch (err) {}
        });
      }, 5000);
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 5000, distanceInterval: 5 },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          try {
            if (!orderIdRef.current) return;
           await fetch(`${BASE_URL}/deliveryboy/order/update-location`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    deliveryBoyId: employeeId,
    latitude,
    longitude,
    status: "moving", // or "online" / "offline" based on your logic
  }),
});
          } catch (err) {}
        }
      );
    }
  };

  const stopTrackingLocation = () => {
    if (Platform.OS === "web") {
      if (locationSubscriptionRef.current) {
        clearInterval(locationSubscriptionRef.current);
        locationSubscriptionRef.current = null;
      }
    } else {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    }
    orderIdRef.current = null;
  };
const markPurchaseDelivered = async (orderId) => {
  if (!employeeId) return;

  try {
    // Optimistic UI update
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === orderId ? { ...o, status: "Delivered", receivedby: employeeId, delivered_date: new Date() } : o
      )
    );
    setFilteredOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === orderId ? { ...o, status: "Delivered", receivedby: employeeId, delivered_date: new Date() } : o
      )
    );

    const res = await fetch(`${BASE_URL}/purchase-orders/mark-delivered/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receivedby: employeeId }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.log("Failed backend update:", data);
      // Revert UI if failed
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? { ...o, status: "Pending", receivedby: null } : o))
      );
      setFilteredOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? { ...o, status: "Pending", receivedby: null } : o))
      );
    }
  } catch (err) {
    console.log("Mark delivered error:", err);
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === orderId ? { ...o, status: "Pending", receivedby: null } : o))
    );
    setFilteredOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === orderId ? { ...o, status: "Pending", receivedby: null } : o))
    );
  }
};
  const totalCount = orders.length;
  const completedCount = orders.filter((o) => o.status === "Delivered").length;
  const pendingCount = totalCount - completedCount;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={{ marginTop: 10, color: "#64748b" }}>
          Fetching Orders {loadingCount}s
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Logistics</Text>
        <TouchableOpacity onPress={() => fetchAssignedOrders(employeeId)} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, isDesktop && styles.desktopContainer]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by customer, city, or phone..."
              value={searchText}
              onChangeText={handleSearch}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.filterRow}>
            {[
              { id: "total", label: "All Orders", count: totalCount, icon: "list", color: "#0ea5e9" },
              { id: "pending", label: "In Progress", count: pendingCount, icon: "time", color: "#f59e0b" },
              { id: "completed", label: "Delivered", count: completedCount, icon: "checkmark-circle", color: "#10b981" },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterCard,
                  activeFilter === item.id && { borderColor: item.color, borderBottomWidth: 3 },
                ]}
                onPress={() => applyFilter(item.id)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={activeFilter === item.id ? item.color : "#94a3b8"}
                />
                <Text style={[styles.filterLabel, activeFilter === item.id && { color: item.color }]}>
                  {item.label}
                </Text>
                <View style={[styles.badge, { backgroundColor: item.color }]}>
                  <Text style={styles.badgeText}>{item.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.gridWrapper}>
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
                <Text style={styles.noOrders}>No orders found for this selection.</Text>
              </View>
            ) : (
              filteredOrders.map((order, index) => {
                const total = order.isSales
                  ? order.items?.reduce((sum, item) => sum + item.total, 0)
                  : order.isPurchase
                  ? order.purchase_items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
                  : order.total;

                const key = order.id
                  ? `${order.isSales ? "sales" : order.isPurchase ? "purchase" : "normal"}-${order.id}`
                  : `order-${index}`;

                return (
                  <View key={key} style={[styles.card, isDesktop && styles.desktopCard]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName} numberOfLines={1}>
                          {order.isSales
                            ? order.customer_name
                            : order.isPurchase
                            ? order.supplier_name
                            : order.address?.name}
                        </Text>
                        <Text style={styles.orderTypeTag}>
                          {order.isSales
                            ? "Sales Rep"
                            : order.isPurchase
                            ? "Purchase"
                            : "Direct"}
                        </Text>
                      </View>
                      <Text style={styles.textPrice}>₹{total}</Text>
                    </View>

              {!order.isPurchase && (
  <View style={styles.addressBox}>
    <View style={styles.infoRow}>
      <Ionicons name="location-sharp" size={16} color="#0ea5e9" />
      <Text style={styles.addressText}>
        {order.isSales
          ? order.address
          : `${order.address?.flat}, ${order.address?.street}, ${order.address?.city}`}
      </Text>
    </View>
    <View style={styles.infoRow}>
      <Ionicons name="call" size={14} color="#64748b" />
      <Text style={styles.phoneText}>
        {order.isSales ? order.mobile : order.address?.mobile}
      </Text>
    </View>
  </View>
)}

                    <View style={styles.itemsBox}>
                      <Text style={styles.itemsTitle}>ORDER SUMMARY</Text>
                      {(order.isSales ? order.items : order.isPurchase ? order.purchase_items : order.order_summary)?.map(
                        (item, idx) => (
                          <Text key={idx} style={styles.itemText} numberOfLines={1}>
                            • {order.isSales ? item.item_name : item.name}{" "}
                            <Text style={{ color: "#94a3b8" }}>(x{item.quantity})</Text>
                          </Text>
                        )
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <View
                        style={[
                          styles.statusBadge,
                          order.status === "Delivered"
                            ? styles.bgDelivered
                            : order.status === "Cancelled"
                            ? styles.bgCancelled
                            : styles.bgPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            order.status === "Delivered"
                              ? styles.txtDelivered
                              : order.status === "Cancelled"
                              ? styles.txtCancelled
                              : styles.txtPending,
                          ]}
                        >
                          {order.status}
                        </Text>
                      </View>
                    </View>
{/* Hide Deliver & Bus buttons for Purchase Orders */}
{!order.isPurchase && (
  <View style={styles.buttonRow}>
    
    {/* Deliver Button */}
    <TouchableOpacity
      style={styles.btnPrimary}
      onPress={async () => {
        navigation.navigate("IndividualOrderScreen", {
          orderId: order.id,
          deliveryBoyId: employeeId,
          orderType: order.isSales
            ? "sales"
            : "normal",
          deliveryType: "local",
          orderDetails: order,
        });
        await startTrackingLocation(order.id);
      }}
    >
      <Ionicons
        name="navigate-outline"
        size={18}
        color="white"
        style={{ marginRight: 5 }}
      />
      <Text style={styles.btnText}>Deliver</Text>
    </TouchableOpacity>

    {/* Bus Button */}
    <TouchableOpacity
      style={styles.btnSecondary}
      onPress={() =>
        navigation.navigate("BusDeliveryScreen", {
          orderId: order.id,
          deliveryType: "bus",
          orderType: order.isSales ? "sales" : "normal",
        })
      }
    >
      <Ionicons
        name="bus-outline"
        size={18}
        color="#475569"
        style={{ marginRight: 5 }}
      />
      <Text style={styles.btnTextSecondary}>Bus</Text>
    </TouchableOpacity>

  </View>
)}
{order.isPurchase && order.status !== "Delivered" && (
  <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: "#10b981",
      paddingVertical: 12,
      borderRadius: 10,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    }}
    onPress={() => markPurchaseDelivered(order.id)}
  >
    <Ionicons
      name="checkmark-done-outline"
      size={18}
      color="white"
      style={{ marginRight: 5 }}
    />
    <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
      Mark Delivered
    </Text>
  </TouchableOpacity>
)}
                  </View>
                );
              })
            )}
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
  backBtn: { padding: 5 },
  refreshBtn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 8 },
  scrollContent: { padding: 20 },
  mainWrapper: { width: "100%" },
  desktopContainer: { maxWidth: 1200, alignSelf: "center" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 10, color: '#1e293b',outlineStyle: "none" },

  filterRow: { flexDirection: "row", justifyContent: 'space-between', marginBottom: 25, backgroundColor: '#fff', padding: 10, borderRadius: 12 },
  filterCard: { flex: 1, alignItems: "center", paddingVertical: 10, flexDirection: 'row', justifyContent: 'center' },
  filterLabel: { fontSize: 13, fontWeight: "600", color: "#64748b", marginHorizontal: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  gridWrapper: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 10,
    width: Platform.OS === 'web' ? 'calc(100% - 20px)' : SCREEN_WIDTH - 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  desktopCard: { width: "calc(33.33% - 20px)" },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  orderTypeTag: { fontSize: 10, color: '#0ea5e9', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  textPrice: { fontSize: 18, fontWeight: '800', color: '#0f172a' },

  addressBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  addressText: { flex: 1, fontSize: 13, color: '#475569', marginLeft: 8 },
  phoneText: { fontSize: 13, color: '#64748b', marginLeft: 8, fontWeight: '500' },

  itemsBox: { marginBottom: 15 },
  itemsTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  itemText: { fontSize: 13, color: '#334155', marginBottom: 4 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  bgDelivered: { backgroundColor: '#dcfce7' },
  txtDelivered: { color: '#15803d' },
  bgPending: { backgroundColor: '#fef3c7' },
  txtPending: { color: '#b45309' },
  bgCancelled: { backgroundColor: '#fee2e2' },
  txtCancelled: { color: '#b91c1c' },

  buttonRow: { flexDirection: "row", gap: 10 },
  btnPrimary: { flex: 2, backgroundColor: "#0ea5e9", paddingVertical: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnSecondary: { flex: 1, backgroundColor: "#f1f5f9", paddingVertical: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  btnTextSecondary: { color: "#475569", fontWeight: "bold", fontSize: 14 },

  emptyState: { width: '100%', alignItems: 'center', paddingVertical: 60 },
  noOrders: { color: "#94a3b8", marginTop: 15, fontSize: 15, fontWeight: '500' },
});