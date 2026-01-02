import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRoute, useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function BusDeliveryScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { orderId, deliveryType, orderType } = route.params;

  const [busName, setBusName] = useState("");
  const [busRoute, setBusRoute] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [driverName, setDriverName] = useState("");
  const [phone, setPhone] = useState("");

  const [freightAmount, setFreightAmount] = useState("");
  const [freightRef, setFreightRef] = useState("");

  const [busPhoto, setBusPhoto] = useState(null);
  const [parcelPhoto, setParcelPhoto] = useState(null);

  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // PICK IMAGE
  // ============================================================
  const pickImage = async (setState) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setState(result.assets[0].uri);
    }
  };

  // ============================================================
  // SUBMIT BUS DELIVERY
  // ============================================================
  const handleBusDelivery = async () => {
    if (
      !busName ||
      !busRoute ||
      !departureTime ||
      !arrivalTime ||
      !driverName ||
      !freightAmount ||
      !busPhoto ||
      !parcelPhoto
    ) {
      Alert.alert("Error", "Please fill all required fields & upload photos");
      return;
    }

    const payload = {
      orderId,
      deliveryType, // <-- same as IndividualOrderScreen
      busDetails: {
        busName,
        busRoute,
        departureTime,
        arrivalTime,
        driverName,
        phone,
        freightAmount,
        freightRef,
        busPhoto,
        parcelPhoto,
      },
      status: "pending",
    };

    const apiUrl =
      orderType === "sales"
        ? `${BASE_URL}/salesorders/update-busdelivery`
        : `${BASE_URL}/order-medicine/update-bus-delivery`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert("Success", "Bus delivery details saved successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.error || "Failed to submit details");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Something went wrong. Try again.");
    }
  };
if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );
  // ============================================================
  // UI
  // ============================================================
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.header}>Bus Delivery</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Bus Info */}
        <View style={styles.card}>
          <Text style={styles.title}>Bus Information</Text>

          <Text style={styles.label}>Bus Name *</Text>
          <TextInput
            value={busName}
            onChangeText={setBusName}
            placeholder="e.g., VRL Travels"
            style={styles.input}
          />

          <Text style={styles.label}>Bus Route *</Text>
          <TextInput
            value={busRoute}
            onChangeText={setBusRoute}
            placeholder="e.g., Bangalore → Mumbai"
            style={styles.input}
          />

          <Text style={styles.label}>Departure Time *</Text>
          <TouchableOpacity
            style={styles.timeBox}
            onPress={() => setShowDeparturePicker(true)}
          >
            <Text style={styles.timeText}>
              {departureTime || "Select Time"}
            </Text>
            <Ionicons name="time-outline" size={22} color="#555" />
          </TouchableOpacity>

          {showDeparturePicker && (
            <DateTimePicker
              mode="time"
              value={new Date()}
              onChange={(e, selected) => {
                setShowDeparturePicker(false);
                if (selected) {
                  const t =
                    selected.getHours().toString().padStart(2, "0") +
                    ":" +
                    selected.getMinutes().toString().padStart(2, "0");
                  setDepartureTime(t);
                }
              }}
            />
          )}

          <Text style={styles.label}>Expected Arrival *</Text>
          <TouchableOpacity
            style={styles.timeBox}
            onPress={() => setShowArrivalPicker(true)}
          >
            <Text style={styles.timeText}>
              {arrivalTime || "Select Time"}
            </Text>
            <Ionicons name="time-outline" size={22} color="#555" />
          </TouchableOpacity>

          {showArrivalPicker && (
            <DateTimePicker
              mode="time"
              value={new Date()}
              onChange={(e, selected) => {
                setShowArrivalPicker(false);
                if (selected) {
                  const t =
                    selected.getHours().toString().padStart(2, "0") +
                    ":" +
                    selected.getMinutes().toString().padStart(2, "0");
                  setArrivalTime(t);
                }
              }}
            />
          )}
        </View>

        {/* Contact Details */}
        <View style={styles.card}>
          <Text style={styles.title}>Contact Details</Text>

          <Text style={styles.label}>Driver / Conductor *</Text>
          <TextInput
            value={driverName}
            onChangeText={setDriverName}
            placeholder="Enter driver name"
            style={styles.input}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Optional"
            style={styles.input}
          />
        </View>

        {/* Freight Details */}
        <View style={styles.card}>
          <Text style={styles.title}>Freight Details</Text>

          <Text style={styles.label}>Freight Amount (₹) *</Text>
          <TextInput
            value={freightAmount}
            onChangeText={setFreightAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            style={styles.input}
          />

          <Text style={styles.label}>Freight Reference No</Text>
          <TextInput
            value={freightRef}
            onChangeText={setFreightRef}
            placeholder="Optional"
            style={styles.input}
          />
        </View>

        {/* Photos */}
        <View style={styles.card}>
          <Text style={styles.title}>Upload Photos</Text>

          <Text style={styles.label}>Bus Photo *</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => pickImage(setBusPhoto)}
          >
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.uploadText}>Upload Bus Photo</Text>
          </TouchableOpacity>

          {busPhoto && (
            <Image source={{ uri: busPhoto }} style={styles.previewImage} />
          )}

          <Text style={styles.label}>Parcel Photo *</Text>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => pickImage(setParcelPhoto)}
          >
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.uploadText}>Upload Parcel Photo</Text>
          </TouchableOpacity>

          {parcelPhoto && (
            <Image source={{ uri: parcelPhoto }} style={styles.previewImage} />
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleBusDelivery}>
          <Text style={styles.submitText}>Save Bus Delivery</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ===================================================================
// STYLES (Same style language as IndividualOrderScreen)
// ===================================================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  container: { padding: 12 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  header: { fontSize: 22, fontWeight: "bold", color: "#2196F3" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },

  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },

  label: { fontSize: 16, marginTop: 10, color: "#444" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginTop: 5,
  },

  timeBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  timeText: { fontSize: 16, color: "#000" },

  uploadBtn: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 8,
  },

  uploadText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginTop: 10,
  },

  submitBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  submitText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
