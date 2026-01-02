import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId, clearStorage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DeliveryBoyDashboard() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("total"); // "total" | "completed" | "pending"

  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const id = await getEmployeeId();
      if (id) setEmployeeId(id);
      else Alert.alert("Error", "No delivery boy ID found in storage");
    })();
  }, []);

  useEffect(() => {
    if (employeeId) fetchAssignedOrders(employeeId);
  }, [employeeId]);

  const fetchSalesAssignedOrders = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/salesorders/by-deliveryboy/${id}`);
      const data = await res.json();
      if (res.ok && data.success) return data.orders;
      console.log("Sales Order Error:", data.error);
      return [];
    } catch (err) {
      console.log("Sales Fetch Error:", err);
      return [];
    }
  };

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
      Alert.alert("Error", "Unable to fetch assigned deliveries.");
    } finally {
      setLoading(false);
    }
  };

 const handleSearch = (text) => {
  setSearchText(text);
  const q = text.toLowerCase();

  const filtered = orders.filter((order) => {
    const isSales = typeof order.customer_name === "string";
    const name = isSales
      ? order.customer_name?.toLowerCase()
      : order.address?.name?.toLowerCase();
    const city = isSales
      ? order.landmark?.toLowerCase()
      : order.address?.city?.toLowerCase();
    const phone = isSales
      ? order.mobile?.toLowerCase()
      : order.address?.mobile?.toLowerCase();
    return name?.includes(q) || city?.includes(q) || phone?.includes(q);
  });

  // Apply current filter on top of search
  applyFilter(activeFilter, filtered);
};

const applyFilter = (filter, orderList = orders) => {
  setActiveFilter(filter);

  const filtered = orderList.filter((o) => {
    const status = o.status?.trim().toLowerCase() || "";

    if (filter === "completed") return status === "delivered";
    if (filter === "pending") return status !== "delivered";

    return true; // total
  });

  setFilteredOrders(filtered);
};


  const handleLogout = async () => {
    await clearStorage();
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }],
    });
  };

  const totalCount = orders.length;
  const completedCount = orders.filter((o) => o.status === "Delivered").length;
  const pendingCount = orders.filter((o) => o.status !== "Delivered").length;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.header}>🚚 My Deliveries</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* 🔍 Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#555" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, city, or phone..."
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {/* 🔹 Filter Cards */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterCard,
              activeFilter === "total" && styles.filterCardActive,
            ]}
            onPress={() => applyFilter("total")}
          >
            <Text style={styles.filterTitle}>Total</Text>
            <Text style={styles.filterCount}>{totalCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterCard,
              activeFilter === "completed" && styles.filterCardActive,
            ]}
            onPress={() => applyFilter("completed")}
          >
            <Text style={styles.filterTitle}>Completed</Text>
            <Text style={styles.filterCount}>{completedCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterCard,
              activeFilter === "pending" && styles.filterCardActive,
            ]}
            onPress={() => applyFilter("pending")}
          >
            <Text style={styles.filterTitle}>Pending</Text>
            <Text style={styles.filterCount}>{pendingCount}</Text>
          </TouchableOpacity>
        </View>

        {filteredOrders.length === 0 ? (
          <Text style={styles.noOrders}>No matching deliveries found.</Text>
        ) : (
          filteredOrders.map((order) => {
            const isSales = typeof order.customer_name === "string";
            const total = isSales
              ? order.items?.reduce((sum, item) => sum + item.total, 0)
              : order.total;

            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.row}>
                  <Ionicons name="person" size={18} color="#555" />
                  <Text style={styles.text}>
                    {isSales ? order.customer_name : order.address?.name}
                  </Text>
                </View>

                <Text style={styles.text}>
                  📍
                  {isSales
                    ? order.address
                    : `${order.address?.flat}, ${order.address?.street}, ${order.address?.city}`}
                </Text>

                <Text style={styles.text}>
                  🏙️
                  {isSales
                    ? `${order.landmark}, ${order.pincode}`
                    : `${order.address?.state} - ${order.address?.pincode}`}
                </Text>

                <Text style={styles.text}>
                  📞 {isSales ? order.mobile : order.address?.mobile}
                </Text>

                <Text style={styles.text}>💰 ₹{total}</Text>

                <Text
                  style={[
                    styles.status,
                    order.status === "Delivered"
                      ? styles.statusDelivered
                      : order.status === "Cancelled"
                      ? styles.statusCancelled
                      : styles.statusPending,
                  ]}
                >
                  {order.status}
                </Text>

                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "bold", marginBottom: 4 }}>🧾 Items:</Text>
                  {(isSales ? order.items : order.order_summary)?.map((item, index) => (
                    <Text key={index} style={styles.text}>
                      • {isSales ? item.item_name : item.name} × {item.quantity} = ₹
                      {item.total}
                    </Text>
                  ))}
                </View>

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  {!order.delivery_type && (
                    <>
                      <TouchableOpacity
                        style={[styles.button, { flex: 1, marginRight: 5 }]}
                        onPress={() =>
                          navigation.navigate("IndividualOrderScreen", {
                            orderId: order.id,
                            deliveryBoyId: employeeId,
                            orderType: isSales ? "sales" : "normal",
                            deliveryType: "local",
                          })
                        }
                      >
                        <Text style={styles.buttonText}>Start Delivery</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cancelButton, { flex: 1, marginLeft: 5 }]}
                        onPress={() =>
                          navigation.navigate("BusDeliveryScreen", {
                            orderId: order.id,
                            deliveryType: "bus",
                            orderType: isSales ? "sales" : "normal",
                          })
                        }
                      >
                        <Text style={styles.buttonText}>Bus Delivery</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {order.delivery_type === "local" && (
                    <TouchableOpacity
                      style={[styles.button, { flex: 1 }]}
                      onPress={() =>
                        navigation.navigate("IndividualOrderScreen", {
                          orderId: order.id,
                          deliveryBoyId: employeeId,
                          orderType: isSales ? "sales" : "normal",
                          deliveryType: order.delivery_type,
                        })
                      }
                    >
                      <Text style={styles.buttonText}>Start Delivery</Text>
                    </TouchableOpacity>
                  )}

                  {order.delivery_type === "bus" && (
                    <TouchableOpacity
                      style={[styles.cancelButton, { flex: 1 }]}
                      onPress={() =>
                        navigation.navigate("BusDeliveryScreen", {
                          orderId: order.id,
                          deliveryType: order.delivery_type,
                          orderType: isSales ? "sales" : "normal",
                        })
                      }
                    >
                      <Text style={styles.buttonText}>Bus Delivery</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { padding: 12 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 22, fontWeight: "bold", color: "#2196F3" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 2,
    marginBottom: 15,
  },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  filterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  filterCard: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 3,
  },
  filterCardActive: { backgroundColor: "#2196F3" },
  filterTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  filterCount: { fontSize: 18, fontWeight: "bold", marginTop: 4, color: "#555" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  text: { fontSize: 16, color: "#333", marginLeft: 5 },
  button: { backgroundColor: "#2196F3", paddingVertical: 8, borderRadius: 8 },
  cancelButton: { backgroundColor: "#F44336", paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  status: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  statusDelivered: { backgroundColor: "#c8e6c9", color: "#2e7d32" },
  statusPending: { backgroundColor: "#ffecb3", color: "#f57c00" },
  statusCancelled: { backgroundColor: "#ffcdd2", color: "#c62828" },
  noOrders: { textAlign: "center", color: "#888", marginTop: 20, fontSize: 16 },
});
