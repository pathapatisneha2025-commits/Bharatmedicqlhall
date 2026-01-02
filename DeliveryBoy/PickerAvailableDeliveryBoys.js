import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

const API_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function PickerAvailableDeliveryBoyScreen() {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch available delivery boys
  const fetchDeliveryBoys = async () => {
    try {
      const res = await fetch(`${API_URL}/deliveryboy/available`);
      const data = await res.json();

      if (data.success) {
        setDeliveryBoys(data.employees);
      } else {
        setDeliveryBoys([]);
      }
    } catch (e) {
      console.log("ERROR fetching delivery boys:", e);
      setDeliveryBoys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);
if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );
  // UI card
  const renderBoy = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.full_name}</Text>
      <Text style={styles.mobile}>📞 {item.mobile}</Text>

      <Text style={item.available ? styles.active : styles.inactive}>
        {item.available ? "Available" : "Not Available"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.head}>Available Delivery Boys</Text>

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
  head: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#e3f2fd",
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: "bold" },
  mobile: { fontSize: 15, marginTop: 4 },

  noData: { textAlign: "center", marginTop: 40, fontSize: 16 },

  active: {
    marginTop: 8,
    color: "green",
    fontWeight: "bold",
  },
  inactive: {
    marginTop: 8,
    color: "red",
    fontWeight: "bold",
  },
});
