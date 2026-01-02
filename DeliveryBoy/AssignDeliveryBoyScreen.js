import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

const API_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AssignDeliveryBoyScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { orderId ,type} = route.params; // ONLY orderId
  

  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch delivery boys
  const fetchDeliveryBoys = async () => {
    try {
      const res = await fetch(`${API_URL}/deliveryboy/available`);
      const data = await res.json();

      if (data.success) setDeliveryBoys(data.employees);
      else setDeliveryBoys([]);
    } catch (e) {
      console.log("ERROR:", e);
      setDeliveryBoys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

const assignDeliveryBoy = async (id) => {
  try {
    let url = "";
    let body = { orderId, employee_id: id };

    if (type === "order") {
      // Normal Order API
      url = `${API_URL}/deliveryboy/assign-delivery`;
    } 
    else if (type === "salesorder") {
      // Sales Order API
      url = `${API_URL}/salesorders/assign-deliveryboy`;
    } 
    else {
      return Alert.alert("Error", "Invalid order type!");
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("ASSIGN:", data);

    if (res.ok && data.success) {
      Alert.alert("Success", `Delivery Boy assigned (${type})`);
      navigation.goBack();
    } else {
      Alert.alert("Error", data.error || "Assignment failed");
    }
  } catch (err) {
    console.log("ASSIGN ERROR:", err);
    Alert.alert("Error", "Something went wrong");
  }
};

if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );



  const renderBoy = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        Alert.alert(
          "Confirm",
          `Assign ${item.full_name} to Order #${orderId}?`,
          [
            { text: "Cancel" },
            { text: "Assign", onPress: () => assignDeliveryBoy(item.id) },
          ]
        )
      }
    >
      <Text style={styles.name}>{item.full_name}</Text>
      <Text style={styles.mobile}>📞 {item.mobile}</Text>
      <Text style={styles.text}>Attendance: {item.attendance_status || "N/A"}</Text>
      <Text style={styles.text}>⏸ Break: {item.break_status || "N/A"}</Text>

      <Text style={item.available ? styles.active : styles.inactive}>
        {item.available ? "Available" : "Not Available"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.head}>Assign Delivery Boy</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" />
      ) : deliveryBoys.length === 0 ? (
        <Text style={styles.noData}>No delivery boys available</Text>
      ) : (
        <FlatList
          data={deliveryBoys}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBoy}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  head: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#e3f2fd",
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: "bold" },
  mobile: { fontSize: 15, marginTop: 3 },
  text: { marginTop: 5 },
  noData: { textAlign: "center", marginTop: 40, fontSize: 16 },
  active: { marginTop: 5, color: "green", fontWeight: "bold" },
  inactive: { marginTop: 5, color: "red", fontWeight: "bold" },
});
