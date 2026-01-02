// screens/AddDeliveryAddressScreen.js
import React, { useState,useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPatientId } from "../utils/storage"; // import your util

export default function AddDeliveryAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pincode, setPincode] = useState("");
  const [flat, setFlat] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressType, setAddressType] = useState(""); // Home/Office
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(null); // initially null
// Fetch patientId from utils
  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const storedId = await getPatientId();
        setPatientId(route?.params?.patientId || storedId || 1);
      } catch (e) {
        console.error("❌ Failed to get patient ID:", e);
        setPatientId(1); // fallback
      }
    };
    fetchPatientId();
  }, [route?.params?.patientId]);
  const handleAddAddress = async () => {
    if (
      !name ||
      !mobile ||
      !pincode ||
      !flat ||
      !street ||
      !city ||
      !state ||
      !addressType
    ) {
      Alert.alert("Error", "Please fill all required fields!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/delivery-addresses/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patient_id: patientId,
            name,
            mobile,
            pincode,
            flat,
            street,
            city,
            state,
            landmark,
            address_type: addressType,
          }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", "Address added successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("deliveryaddress", { patientId }),
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Something went wrong!");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to add address. Please try again.");
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* 🔙 Back Navigation Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.heading}>Add Delivery Address</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          keyboardType="phone-pad"
          value={mobile}
          onChangeText={setMobile}
        />
        <TextInput
          style={styles.input}
          placeholder="Pincode"
          keyboardType="numeric"
          value={pincode}
          onChangeText={setPincode}
        />
        <TextInput
          style={styles.input}
          placeholder="Flat / House No."
          value={flat}
          onChangeText={setFlat}
        />
        <TextInput
          style={styles.input}
          placeholder="Street / Locality"
          value={street}
          onChangeText={setStreet}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholder="State"
          value={state}
          onChangeText={setState}
        />
        <TextInput
          style={styles.input}
          placeholder="Landmark (Optional)"
          value={landmark}
          onChangeText={setLandmark}
        />
        <TextInput
          style={styles.input}
          placeholder="Address Type (Home/Office)"
          value={addressType}
          onChangeText={setAddressType}
        />

        <TouchableOpacity style={styles.button} onPress={handleAddAddress}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Address</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
