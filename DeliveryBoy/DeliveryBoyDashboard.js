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
  Switch,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId,clearStorage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DeliveryBoyDashboard() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [updating, setUpdating] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [collections, setCollections] = useState({ total_cash: 0, total_digital: 0 });
  const [location, setLocation] = useState(null);

  const isAvailableRef = useRef(isAvailable);
  useEffect(() => {
    isAvailableRef.current = isAvailable;
  }, [isAvailable]);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 768;

  const navigation = useNavigation();

  /* ====================== Alert ====================== */
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

  /* ====================== Loading Counter ====================== */
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount(c => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  /* ====================== Get Employee ID ====================== */
  useEffect(() => {
    (async () => {
      const id = await getEmployeeId();
      if (id) setEmployeeId(id);
      else showAlert("Error", "No delivery boy ID found");
    })();
  }, []);

  /* ====================== Initial Data Load ====================== */
  useEffect(() => {
    if (employeeId) {
      fetchAvailability(employeeId);
      fetchAssignedOrders(employeeId);
      fetchCollections(employeeId);
    }
  }, [employeeId]);

  /* ====================== Live Location ====================== */
  useEffect(() => {
    if (!employeeId) return;
    let subscription;
    const startWatchingLocation = async () => {
      if (Platform.OS === "web") {
        if (navigator.geolocation) {
          const watchId = navigator.geolocation.watchPosition(
            async pos => {
              const { latitude, longitude } = pos.coords;
              setLocation({ latitude, longitude });
              await sendLocation(latitude, longitude, isAvailable);
            },
            err => console.error("Web geolocation error:", err),
            { enableHighAccuracy: true, maximumAge: 5000, distanceFilter: 5 }
          );
          return () => navigator.geolocation.clearWatch(watchId);
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          async pos => {
            const { latitude, longitude } = pos.coords;
            setLocation({ latitude, longitude });
            await sendLocation(latitude, longitude, isAvailable);
          }
        );
      }
    };
    startWatchingLocation();
    return () => subscription?.remove();
  }, [employeeId, isAvailable]);

  /* ====================== Send Location ====================== */
const sendLocation = async (lat, lng, status) => {
  if (!employeeId || lat == null || lng == null) return;

  try {
    await fetch(`${BASE_URL}/deliveryboy/update-location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryBoyId: employeeId,
        latitude: Number(lat),
        longitude: Number(lng),
        status: status ? "available" : "unavailable",
      }),
    });
  } catch (err) {
    console.error("Error sending location:", err);
  }
};
  /* ====================== Fetch Availability ====================== */
  const fetchAvailability = async id => {
    try {
      const res = await fetch(`${BASE_URL}/deliveryboy/availability/${id}`);
      const data = await res.json();
      if (res.ok) setIsAvailable(data.available);
    } catch (error) {
      console.error(error);
    }
  };

  /* ====================== Toggle Availability ====================== */
  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === "web") {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject("Geolocation not supported");
          navigator.geolocation.getCurrentPosition(
            pos => {
              const { latitude, longitude } = pos.coords;
              resolve({ latitude, longitude });
            },
            err => reject(err),
            { enableHighAccuracy: true }
          );
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("Location permission not granted");
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      }
    } catch (err) {
      console.error("Failed to get location:", err);
      return null;
    }
  };

  const toggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    try {
      await fetch(`${BASE_URL}/deliveryboy/update-availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: employeeId, available: newStatus }),
      });
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        await sendLocation(currentLocation.latitude, currentLocation.longitude, newStatus);
      }
    } catch (err) {
      console.error("Availability update failed", err);
      setIsAvailable(!newStatus);
    }
  };

  /* ====================== Fetch Collections ====================== */
  const fetchCollections = async deliveryBoyId => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch(`${BASE_URL}/deliveryboy/${deliveryBoyId}/collections?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setCollections({
          total_cash: data.total_cash || 0,
          total_digital: data.total_digital || 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };
   const fetchSalesAssignedOrders = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/salesorders/by-deliveryboy/${id}`);
      const data = await res.json();
      if (res.ok && data.success) return data.orders;
      return [];
    } catch (err) {
      console.log("Sales Fetch Error:", err);
      return [];
    }
  };

  /* ====================== Fetch Orders ====================== */
  const fetchAssignedOrders = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/deliveryboy/${id}`);
      const normalOrders = await res.json();
      const salesOrders = await fetchSalesAssignedOrders(id);
      const merged = [...normalOrders, ...salesOrders];
      setOrders(merged);
      setFilteredOrders(merged);
    } catch (error) {
      console.error(error);
      showAlert("Error", "Unable to fetch assigned deliveries.");
    } finally {
      setLoading(false);
    }
  };


  /* ====================== Update Order Status ====================== */
  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdating(true);
      const res = await fetch(`${BASE_URL}/deliveryboy/update-delivery-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchAssignedOrders(employeeId);
        fetchCollections(employeeId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  /* ====================== Search ====================== */
  const handleSearch = text => {
    setSearchText(text);
    const query = text.toLowerCase();
    const filtered = orders.filter(order => {
      const name = order.address?.name?.toLowerCase() || "";
      const city = order.address?.city?.toLowerCase() || "";
      const phone = order.address?.mobile || "";
      return name.includes(query) || city.includes(query) || phone.includes(query);
    });
    setFilteredOrders(filtered);
  };

  /* ====================== Counts ====================== */
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === "Delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "Cancelled").length;
  const pendingOrders = totalOrders - deliveredOrders - cancelledOrders;
  const totalCollection = Number(collections.total_cash) + Number(collections.total_digital);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading {loadingCount}s</Text>
      </View>
    );
  }

  // --- Sidebar Component ---
  const Sidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarBrand}>Bharat Medical</Text>
      </View>
      <View style={styles.sidebarContent}>
        <TouchableOpacity style={styles.sidebarItemActive}>
          <Ionicons name="grid" size={20} color="#fff" />
          <Text style={styles.sidebarTextActive}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate("DeliverBoyOrders")}>
          <Ionicons name="list" size={20} color="#64748b" />
          <Text style={styles.sidebarText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate("BusDeliveryScreen", { orderId: null })}>
          <Ionicons name="bus" size={20} color="#64748b" />
          <Text style={styles.sidebarText}>Bus Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate("CashHandOverScreen", { deliveryBoyId: employeeId })}>
          <Ionicons name="card" size={20} color="#64748b" />
          <Text style={styles.sidebarText}>Payments</Text>
        </TouchableOpacity>

         <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate("DeliverBoyProfileScreen", { deliveryBoyId: employeeId })}>
          <Ionicons name="person" size={20} color="#64748b" />
          <Text style={styles.sidebarText}>profile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sidebarFooter}>
       <TouchableOpacity
  style={styles.logoutBtn}
  onPress={async () => {
    // Clear stored data
    await clearStorage();

    // Reset navigation stack to prevent back navigation
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }], // or "Login" if you have that screen
    });
  }}
>
  <Ionicons name="log-out-outline" size={20} color="#ef4444" />
  <Text style={styles.logoutText}>Logout</Text>
</TouchableOpacity>

      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {isDesktop && <Sidebar />}

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
            {/* HEADER */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.header}>🚚 Dashboard</Text>
                <Text style={styles.subHeader}>Welcome back, Delivery Partner</Text>
              </View>
              <View style={styles.headerActions}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{isAvailable ? "Available" : "Offline"}</Text>
                  <Switch
                    value={isAvailable}
                    onValueChange={toggleAvailability}
                    trackColor={{ false: "#cbd5e1", true: "#81c784" }}
                    thumbColor={isAvailable ? "#22c55e" : "#94a3b8"}
                  />
                </View>
                <TouchableOpacity onPress={() => fetchAssignedOrders(employeeId)} style={styles.refreshBtn}>
                  <Ionicons name="refresh" size={20} color="#0A84FF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* SUMMARY CARDS */}
            <View style={styles.summaryContainer}>
              <SummaryCard title="Total Orders" value={totalOrders} color="#3b82f6" isDesktop={isDesktop} icon="cube" />
              <SummaryCard title="Delivered" value={deliveredOrders} color="#22c55e" isDesktop={isDesktop} icon="checkmark-circle" />
              <SummaryCard title="Pending" value={pendingOrders} color="#f59e0b" isDesktop={isDesktop} icon="time" />
              <SummaryCard title="Cancelled" value={cancelledOrders} color="#ef4444" isDesktop={isDesktop} icon="close-circle" />
              <SummaryCard title="Total Collection" value={`₹ ${totalCollection}`} color="#8b5cf6" isDesktop={isDesktop} fullWidth icon="wallet" />
            </View>

            <View style={isDesktop ? styles.desktopActionRow : null}>
              {/* SEARCH */}
              <View style={[styles.searchContainer, isDesktop && { flex: 2, marginBottom: 0, marginRight: 15 }]}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, city, phone"
                  value={searchText}
                  onChangeText={handleSearch}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* QUICK ACTIONS BUTTONS */}
              <View style={[isDesktop ? styles.buttonRowDesktop : styles.buttonRowMobile]}>
                <TouchableOpacity
                  style={[styles.primaryBtn, isDesktop && { flex: 1, marginRight: 10 }]}
                  onPress={() => navigation.navigate("DeliverBoyOrders")}
                >
                  <Text style={styles.btnText}>Start Delivery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, isDesktop && { flex: 1 }]}
                  onPress={() => navigation.navigate("BusDeliveryScreen", { orderId: null })}
                >
                  <Text style={styles.btnText}>Bus Delivery</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cardBtn}
              onPress={() => navigation.navigate("CashHandOverScreen", { deliveryBoyId: employeeId })}
            >
              <Ionicons name="card-outline" size={22} color="#0A84FF" />
              <Text style={styles.cardText}>Payment Settlement</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const SummaryCard = ({ title, value, color, isDesktop, icon, fullWidth }) => (
  <View
    style={[
      styles.summaryCard,
      { borderLeftColor: color, borderLeftWidth: 5 },
      isDesktop ? { flexBasis: fullWidth ? "100%" : "23.5%" } : { flexBasis: fullWidth ? "100%" : "48%" },
    ]}
  >
    <View style={styles.cardInfo}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
    </View>
    <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  mainContainer: { flex: 1, flexDirection: "row" },
  contentScroll: { flex: 1 },
  scrollContent: { padding: 20 },
  mainWrapper: { width: "100%", maxWidth: 1200, alignSelf: 'center' },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // SIDEBAR STYLES
  sidebar: {
    width: 260,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    padding: 20,
    height: '100%',
  },
  sidebarHeader: { marginBottom: 40, paddingHorizontal: 10 },
  sidebarBrand: { fontSize: 22, fontWeight: "bold", color: "#0ea5e9" },
  sidebarContent: { flex: 1 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sidebarItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#0ea5e9',
  },
  sidebarText: { marginLeft: 12, color: "#64748b", fontWeight: "500" },
  sidebarTextActive: { marginLeft: 12, color: "#fff", fontWeight: "bold" },
  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutText: { marginLeft: 12, color: '#ef4444', fontWeight: '600' },

  // HEADER
  header: { fontSize: 28, fontWeight: "bold", color: "#1e293b" },
  subHeader: { color: '#64748b', fontSize: 14, marginTop: 2 },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 30 
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  refreshBtn: { marginLeft: 15, padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },

  // SUMMARY CARDS
  summaryContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginBottom: 25 
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  iconBg: { padding: 10, borderRadius: 10 },
  summaryTitle: { color: "#64748b", fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  summaryValue: { color: "#1e293b", fontSize: 22, fontWeight: "bold", marginTop: 4 },

  // SEARCH & ACTIONS
  desktopActionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 10, color: '#1e293b' ,outlineStyle: "none"},

  // BUTTONS
  buttonRowMobile: { marginBottom: 15 },
  buttonRowDesktop: { flexDirection: 'row', flex: 1 },
  primaryBtn: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryBtn: {
    backgroundColor: "#334155",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  // PAYMENT CARD
  cardBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#0ea5e9",
    borderStyle: 'dashed'
  },
  cardText: { marginLeft: 10, fontSize: 15, color: "#0ea5e9", fontWeight: "700" },

  // TOGGLE
  toggleRow: { flexDirection: "row", alignItems: "center", backgroundColor: '#fff', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  toggleLabel: { fontSize: 13, marginRight: 8, fontWeight: "700", color: "#475569" },
});