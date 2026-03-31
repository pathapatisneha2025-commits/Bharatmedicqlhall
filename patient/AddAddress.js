import React, { useState, useEffect } from "react";
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
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPatientId } from "../utils/storage";
import { SafeAreaView } from "react-native-safe-area-context";

// Defined theme based on your screenshot
const THEME = {
  primary: "#3b82f6", // The bright blue from the sidebar
  background: "#f8fafc", // Light gray background
  white: "#ffffff",
  textDark: "#1e293b",
  border: "#e2e8f0",
  placeholder: "#94a3b8",
};

export default function AddDeliveryAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pincode, setPincode] = useState("");
  const [flat, setFlat] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressType, setAddressType] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(null);

  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const storedId = await getPatientId();
        setPatientId(route?.params?.patientId || storedId || 1);
      } catch (e) {
        setPatientId(1);
      }
    };
    fetchPatientId();
  }, [route?.params?.patientId]);

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleAddAddress = async () => {
    if (!name || !mobile || !pincode || !flat || !street || !city || !state || !addressType) {
      showAlert("Error", "Please fill all required fields!");
      return;
    }
    if (mobile.length !== 10) {
      showAlert("Error", "Mobile number must be 10 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/delivery-addresses/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: patientId,
            name, mobile, pincode, flat, street, city, state, landmark,
            address_type: addressType,
          }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showAlert("Success", "Address added successfully!");
        navigation.navigate("deliveryaddress", { patientId });
      } else {
        showAlert("Error", data.message || "Something went wrong!");
      }
    } catch (error) {
      setLoading(false);
      showAlert("Error", "Failed to add address.");
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={{ marginTop: 10, color: THEME.textDark }}>Saving Address...</Text>
      </View>
    );

  const isDesktop = SCREEN_WIDTH >= 768;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.card}>
            {/* Header Area */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                <Ionicons name="arrow-back" size={20} color={THEME.textDark} />
              </TouchableOpacity>
              <Text style={styles.heading}>Add Delivery Address</Text>
            </View>

            {/* Form Grid */}
            <View style={styles.formGrid}>
              
              {/* Name */}
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} placeholder="e.g. John Doe" value={name} onChangeText={setName} placeholderTextColor={THEME.placeholder} />
              </View>

              {/* Mobile */}
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.phoneContainer}>
                  <View style={styles.countryCode}><Text style={styles.countryText}>+91</Text></View>
                  <TextInput
                    style={styles.phoneInput}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={mobile}
                    onChangeText={(text) => setMobile(text.replace(/[^0-9]/g, ""))}
                  />
                </View>
              </View>

              {/* Pincode */}
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={pincode} onChangeText={setPincode} placeholder="6-digit code" />
              </View>

              {/* Flat */}
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Text style={styles.label}>Flat / House No.</Text>
                <TextInput style={styles.input} value={flat} onChangeText={setFlat} />
              </View>

              {/* Street */}
              <View style={styles.fullWidth}>
                <Text style={styles.label}>Street / Locality</Text>
                <TextInput style={styles.input} value={street} onChangeText={setStreet} />
              </View>

              {/* City & State Row */}
              <View style={styles.halfWidth}>
                <Text style={styles.label}>City</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>State</Text>
                <TextInput style={styles.input} value={state} onChangeText={setState} />
              </View>

              {/* Landmark */}
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <TextInput style={styles.input} value={landmark} onChangeText={setLandmark} />
              </View>

              {/* Address Type */}
              <View style={isDesktop ? styles.halfWidth : styles.fullWidth}>
                <Text style={styles.label}>Address Type</Text>
                <TextInput style={styles.input} placeholder="Home / Office" value={addressType} onChangeText={setAddressType} />
              </View>

              {/* Action Button */}
              <View style={styles.fullWidth}>
                <TouchableOpacity style={styles.button} onPress={handleAddAddress}>
                  <Text style={styles.buttonText}>Save Address</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: THEME.background },
  card: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 800,
    // Soft shadow like the dashboard cards
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }
    })
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconCircle: { backgroundColor: THEME.background, padding: 8, borderRadius: 20, marginRight: 15 },
  heading: { fontSize: 20, fontWeight: "700", color: THEME.textDark },
  formGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  halfWidth: { width: "48%", marginBottom: 12 },
  fullWidth: { width: "100%", marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: THEME.textDark, marginBottom: 6, marginLeft: 2 },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: THEME.textDark,
  },
  phoneContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: '#fff'
  },
  countryCode: { paddingHorizontal: 12, justifyContent: 'center', backgroundColor: THEME.background, borderRightWidth: 1, borderRightColor: THEME.border },
  countryText: { fontSize: 14, fontWeight: "600", color: THEME.textDark },
  phoneInput: { flex: 1, padding: 12, fontSize: 15 },
  button: {
    backgroundColor: THEME.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});