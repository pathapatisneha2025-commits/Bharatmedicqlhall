import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPatientId, storeDeliveryAddressId } from "../utils/storage";

const DeliveryAddressScreen = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const storedId = await getPatientId();
        const id = route?.params?.patientId || storedId || 1;
        setPatientId(id);
      } catch (error) {
        console.error("Failed to load patient ID:", error);
        setPatientId(1);
      }
    };
    fetchPatientId();
  }, [route?.params?.patientId]);

  const fetchDeliveryAddresses = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/delivery-addresses/patient/${patientId}`
      );
      const data = await response.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Failed to fetch delivery addresses.");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchDeliveryAddresses();
  }, [patientId]);

  const handleSelectAddress = async (item) => {
    setSelectedAddress(item);
    await storeDeliveryAddressId(item.id);
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedAddress?.id === item.id;

    let iconName = "location-outline";
    let iconColor = "#FFA500"; // orange for others
    if (item.address_type.toLowerCase() === "home") {
      iconName = "home-outline";
      iconColor = "#4A90E2"; // blue
    } else if (item.address_type.toLowerCase() === "work") {
      iconName = "briefcase-outline";
      iconColor = "#28A745"; // green
    }
     if (loading)
            return (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Loading...</Text>
              </View>
            );
    

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleSelectAddress(item)}
      >
        <View style={styles.row}>
          <Ionicons
            name={iconName}
            size={28}
            color={iconColor}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.address_type}</Text>
              </View>
            </View>
            <Text style={styles.phone}>📞 {item.mobile}</Text>
            <Text style={styles.address}>
              {item.flat}, {item.street}
            </Text>
            <Text style={styles.address}>
              {item.city} - {item.pincode}
            </Text>
            {item.landmark && (
              <Text style={styles.landmark}>Landmark: {item.landmark}</Text>
            )}
          </View>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 10 }}>Loading addresses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with icon */}
      <View style={styles.headerContainer}>
       <TouchableOpacity  onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Ionicons name="home-outline" size={28} color="#4A90E2" style={{ marginRight: 8 }} />
        <Text style={styles.header}>Delivery Addresses</Text>
      </View>
   

      {addresses.length === 0 ? (
        <Text style={styles.noAddressText}>
          No addresses found. Add a new one below.
        </Text>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate("addaddress")}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addBtnText}> Add New Address</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.paymentBtn, !selectedAddress && styles.disabledBtn]}
        disabled={!selectedAddress}
        onPress={() =>
          navigation.navigate("checkout", {
            patientId,
            address: selectedAddress,
          })
        }
      >
        <Text style={styles.paymentText}>Continue to Payment</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default DeliveryAddressScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8", padding: 16 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  header: { fontSize: 22, fontWeight: "700", color: "#333" },
  subHeader: { fontSize: 14, color: "#555", marginBottom: 12 },
  noAddressText: { textAlign: "center", fontSize: 16, color: "#777", marginTop: 20 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: { borderColor: "#4A90E2", backgroundColor: "#e6f0ff" },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  tag: {
    backgroundColor: "#eef4ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 8,
  },
  tagText: { fontSize: 12, color: "#4A90E2" },
  phone: { marginTop: 4, color: "#555" },
  address: { color: "#555" },
  landmark: { color: "#777", fontSize: 13, marginTop: 4 },
  addBtn: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: "#4A90E2",
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 6 },
  paymentBtn: { backgroundColor: "#4A90E2", padding: 16, borderRadius: 8, alignItems: "center" },
  disabledBtn: { backgroundColor: "#ccc" },
  paymentText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#bbb",
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: "#4A90E2" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4A90E2" },
});
