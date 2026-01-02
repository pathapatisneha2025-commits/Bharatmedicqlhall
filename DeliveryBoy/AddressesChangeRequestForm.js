import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AddressChangeRequestScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { orderId, deliveryBoyId, currentAddress } = route.params;
  const [loading, setLoading] = useState(true);

  const [newAddress, setNewAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!newAddress || !pincode) {
      return Alert.alert("Error", "Address and Pincode are required");
    }

    try {
      const response = await fetch(
        `${BASE_URL}/salesorders/delivery/address-change/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            delivery_boy_id: deliveryBoyId,
            old_address: currentAddress,
            new_address: newAddress,
            new_landmark: landmark,
            new_pincode: pincode,
            reason: reason,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Address change request sent successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.error || "Failed to send request");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong!");
    }
  };
  if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#FF9800" />
          </TouchableOpacity>
          <Text style={styles.header}>Request Address Change</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Current Address:</Text>
          <Text style={styles.currentAddress}>{currentAddress}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>New Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter new address"
            value={newAddress}
            onChangeText={setNewAddress}
          />

          <Text style={styles.label}>Landmark (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter landmark"
            value={landmark}
            onChangeText={setLandmark}
          />

          <Text style={styles.label}>Pincode</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter pincode"
            keyboardType="number-pad"
            value={pincode}
            onChangeText={setPincode}
          />

          <Text style={styles.label}>Reason (optional)</Text>
          <TextInput
            style={[styles.input, { height: 90 }]}
            placeholder="Why is address changed?"
            multiline
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>📨 Submit Request</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { padding: 15 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  header: { fontSize: 20, fontWeight: "bold", color: "#FF9800" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 6 },
  currentAddress: {
    fontSize: 16,
    color: "#555",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#FF9800",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});

