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
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DeliveryBoyDashboard() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const id = await getEmployeeId();
      if (id) {
        setEmployeeId(id);
      } else {
        Alert.alert("Error", "No delivery boy ID found in storage");
      }
    })();
  }, []);

  useEffect(() => {
  if (employeeId) {
    fetchAvailability(employeeId);
    fetchAssignedOrders(employeeId);
  }
}, [employeeId]);


  const fetchAssignedOrders = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/deliveryboy/${id}`);
      const data = await res.json();

      if (res.ok) {
        setOrders(data);
        setFilteredOrders(data);
      } else {
        Alert.alert("Error", data.error || "Failed to load orders");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to fetch assigned deliveries.");
    } finally {
      setLoading(false);
    }
  };

  const markAsDelivered = async (orderId) => {
    updateOrderStatus(orderId, "Delivered");
  };

  const markAsCancelled = async (orderId) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No" },
      { text: "Yes", onPress: () => updateOrderStatus(orderId, "Cancelled") },
    ]);
  };

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
        Alert.alert("Success", `Order marked as ${status}!`);
        fetchAssignedOrders(employeeId);
      } else {
        Alert.alert("Error", data.error || "Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setUpdating(false);
    }
  };

const fetchAvailability = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/deliveryboy/availability/${id}`);
    const data = await res.json();

    if (res.ok) {
      setIsAvailable(data.available);   // ← Update UI from DB
    } else {
      console.log("Error fetching availability:", data.error);
    }
  } catch (error) {
    console.error("Availability fetch error:", error);
  }
};

  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = orders.filter((order) => {
      const name = order.address?.name?.toLowerCase() || "";
      const city = order.address?.city?.toLowerCase() || "";
      const phone = order.address?.mobile?.toLowerCase() || "";
      const query = text.toLowerCase();
      return (
        name.includes(query) || city.includes(query) || phone.includes(query)
      );
    });
    setFilteredOrders(filtered);
  };
  const toggleAvailability = async () => {
  try {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);

    const res = await fetch(`${BASE_URL}/deliveryboy/update-availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employeeId, available: newStatus }),
    });

    const data = await res.json();
    if (!res.ok) {
      Alert.alert("Error", data.error || "Failed to update availability");
      setIsAvailable(!newStatus); // revert on failure
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Unable to update availability");
    setIsAvailable(!isAvailable); // revert on error
  }
};


  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled").length;
  const pendingOrders = totalOrders - deliveredOrders - cancelledOrders;

 

 if (loading)
       return (
         <View style={styles.loader}>
           <ActivityIndicator size="large" color="#007bff" />
           <Text>Loading...</Text>
         </View>
       );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
  <Text style={styles.header}>🚚 My Deliveries</Text>

  {/* NEW TOGGLE */}
 <View style={styles.toggleRow}>
  <Text style={styles.toggleLabel}>
    {isAvailable ? "Available" : "Not Available"}
  </Text>

  <Switch
    value={isAvailable}
    onValueChange={toggleAvailability}
    trackColor={{ false: "#ff6b6b", true: "#81c784" }}
    thumbColor={isAvailable ? "#4CAF50" : "#F44336"}
  />
</View>

</View>



        {/* ✅ Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: "#2196F3" }]}>
            <Text style={styles.summaryTitle}>Total Orders</Text>
            <Text style={styles.summaryValue}>{totalOrders}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#4CAF50" }]}>
            <Text style={styles.summaryTitle}>Delivered</Text>
            <Text style={styles.summaryValue}>{deliveredOrders}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#FFC107" }]}>
            <Text style={styles.summaryTitle}>Pending</Text>
            <Text style={styles.summaryValue}>{pendingOrders}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#F44336" }]}>
            <Text style={styles.summaryTitle}>Cancelled</Text>
            <Text style={styles.summaryValue}>{cancelledOrders}</Text>
          </View>
        </View>

        {/* ✅ Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#555"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, city, or phone..."
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>


{/* Action Buttons */}
<TouchableOpacity
  style={styles.primaryBtn}
  onPress={() => navigation.navigate("DeliverBoyOrders")} // ← Add this
>
  <Text style={styles.btnText}>Start Delivery</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.secondaryBtn}
onPress={() =>
    navigation.navigate("BusDeliveryScreen", {
      orderId: null,   // or "" or 0
    })
  }>
  <Text style={styles.btnText}>Bus Delivery</Text>
</TouchableOpacity>

  <TouchableOpacity 
  style={styles.cardBtn}
  onPress={() => 
    navigation.navigate("CashHandOverScreen", { deliveryBoyId: employeeId })
  }
>
  <Ionicons name="card-outline" size={22} color="#0A84FF" />
  <Text style={styles.cardText}>Payment Settlement</Text>
</TouchableOpacity>




      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    padding: 12,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2196F3",
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryCard: {
    flexBasis: "48%",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
    elevation: 3,
  },
  summaryTitle: { color: "#fff", fontSize: 14, fontWeight: "500" },
  summaryValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
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
  
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },



primaryBtn: {
backgroundColor: "#0A84FF",
padding: 15,
borderRadius: 12,
alignItems: "center",
marginBottom: 10,
},
secondaryBtn: {
backgroundColor: "#007BFF",
padding: 15,
borderRadius: 12,
alignItems: "center",
},
btnText: {
color: "#fff",
fontSize: 16,
fontWeight: "600",
},
cardBtn: {
  flexDirection: "row",
  alignItems: "center",
  padding: 15,
  borderRadius: 12,
  backgroundColor: "#E8F0FE",
  marginTop: 10,
  borderWidth: 1,
  borderColor: "#0A84FF",
},
cardText: {
  marginLeft: 10,
  fontSize: 16,
  color: "#0A84FF",
  fontWeight: "700",
},

toggleRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  paddingVertical: 5,
  marginBottom: 10
},

toggleLabel: {
  fontSize: 16,
  marginRight: 10,
  fontWeight: "600",
  color: "#333",
},

});
