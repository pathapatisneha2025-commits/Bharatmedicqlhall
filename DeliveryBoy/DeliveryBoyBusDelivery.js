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
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView
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
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;
  const CONTENT_MAX_WIDTH = 1100;

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

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const pickImage = async (setState) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setState(result.assets[0].uri);
    }
  };

  const handleBusDelivery = async () => {
    if (!busName || !busRoute || !departureTime || !arrivalTime || !driverName || !freightAmount || !busPhoto || !parcelPhoto) {
      showAlert("Missing Information", "Please fill all required fields and upload photos.");
      return;
    }

    const payload = {
      orderId,
      deliveryType,
      busDetails: { busName, busRoute, departureTime, arrivalTime, driverName, phone, freightAmount, freightRef, busPhoto, parcelPhoto },
      status: "pending",
    };

    const apiUrl = orderType === "sales" 
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
        showAlert("Success", "Bus delivery details saved successfully!");
        navigation.goBack();
      } else {
        showAlert("Error", data.error || "Failed to submit details");
      }
    } catch (e) {
      showAlert("Error", "Server unreachable. Please try again later.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Dispatch Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={[styles.responsiveWrapper, isDesktop && { maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }]}>
            
            {/* Order Identity Card */}
            <View style={styles.identityCard}>
               <View>
                 <Text style={styles.identityLabel}>Order ID</Text>
                 <Text style={styles.identityValue}>#{orderId}</Text>
               </View>
               <View style={styles.badge}>
                 <Text style={styles.badgeText}>{deliveryType}</Text>
               </View>
            </View>

            <View style={[styles.mainLayout, isDesktop && styles.desktopRow]}>
              {/* Left Column: Logistics */}
              <View style={[isDesktop ? styles.column : null]}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="bus-outline" size={20} color="#0ea5e9" />
                    <Text style={styles.cardTitle}>Transport Details</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bus Name *</Text>
                    <TextInput value={busName} onChangeText={setBusName} placeholder="Travels name" style={styles.input} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Route *</Text>
                    <TextInput value={busRoute} onChangeText={setBusRoute} placeholder="Origin → Destination" style={styles.input} />
                  </View>

                  <View style={styles.inputRow}>
                   {/* Departure Time */}
<View style={{ flex: 1 }}>
  <Text style={styles.inputLabel}>Departure *</Text>
  {Platform.OS === "web" ? (
    <input
      type="time"
      value={departureTime}
      onChange={(e) => setDepartureTime(e.target.value)}
      style={styles.webTimeInput}
    />
  ) : (
    <>
      <TouchableOpacity style={styles.timeBox} onPress={() => setShowDeparturePicker(true)}>
        <Text style={styles.timeText}>{departureTime || "00:00"}</Text>
        <Ionicons name="time-outline" size={18} color="#94a3b8" />
      </TouchableOpacity>
      {showDeparturePicker && (
        <DateTimePicker
          value={departureTime ? new Date(`1970-01-01T${departureTime}:00`) : new Date()}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={(event, date) => {
            setShowDeparturePicker(false);
            if (date) {
              const h = String(date.getHours()).padStart(2, "0");
              const m = String(date.getMinutes()).padStart(2, "0");
              setDepartureTime(`${h}:${m}`);
            }
          }}
        />
      )}
    </>
  )}
</View>

{/* Arrival Time */}
<View style={{ flex: 1 }}>
  <Text style={styles.inputLabel}>Arrival *</Text>
  {Platform.OS === "web" ? (
    <input
      type="time"
      value={arrivalTime}
      onChange={(e) => setArrivalTime(e.target.value)}
      style={styles.webTimeInput}
    />
  ) : (
    <>
      <TouchableOpacity style={styles.timeBox} onPress={() => setShowArrivalPicker(true)}>
        <Text style={styles.timeText}>{arrivalTime || "00:00"}</Text>
        <Ionicons name="time-outline" size={18} color="#94a3b8" />
      </TouchableOpacity>
      {showArrivalPicker && (
        <DateTimePicker
          value={arrivalTime ? new Date(`1970-01-01T${arrivalTime}:00`) : new Date()}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={(event, date) => {
            setShowArrivalPicker(false);
            if (date) {
              const h = String(date.getHours()).padStart(2, "0");
              const m = String(date.getMinutes()).padStart(2, "0");
              setArrivalTime(`${h}:${m}`);
            }
          }}
        />
      )}
    </>
  )}
</View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="person-outline" size={20} color="#0ea5e9" />
                    <Text style={styles.cardTitle}>Staff Contact</Text>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Driver/Conductor *</Text>
                    <TextInput value={driverName} onChangeText={setDriverName} placeholder="Name" style={styles.input} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91" style={styles.input} />
                  </View>
                </View>
              </View>

              {/* Right Column: Financials & Photos */}
              <View style={[isDesktop ? styles.column : null]}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="cash-outline" size={20} color="#10b981" />
                    <Text style={styles.cardTitle}>Freight Expense</Text>
                  </View>
                  <View style={styles.inputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Amount (₹) *</Text>
                      <TextInput value={freightAmount} onChangeText={setFreightAmount} keyboardType="numeric" placeholder="0.00" style={styles.input} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Ref No.</Text>
                      <TextInput value={freightRef} onChangeText={setFreightRef} placeholder="Optional" style={styles.input} />
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="images-outline" size={20} color="#f59e0b" />
                    <Text style={styles.cardTitle}>Visual Proof</Text>
                  </View>
                  <View style={styles.photoGrid}>
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity style={[styles.uploadBtn, busPhoto && styles.uploadBtnActive]} onPress={() => pickImage(setBusPhoto)}>
                        <Ionicons name={busPhoto ? "checkmark-circle" : "bus"} size={22} color={busPhoto ? "#fff" : "#64748b"} />
                        <Text style={[styles.uploadText, busPhoto && {color: '#fff'}]}>Bus</Text>
                      </TouchableOpacity>
                      {busPhoto && <Image source={{ uri: busPhoto }} style={styles.previewImage} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity style={[styles.uploadBtn, parcelPhoto && styles.uploadBtnActive]} onPress={() => pickImage(setParcelPhoto)}>
                        <Ionicons name={parcelPhoto ? "checkmark-circle" : "cube"} size={22} color={parcelPhoto ? "#fff" : "#64748b"} />
                        <Text style={[styles.uploadText, parcelPhoto && {color: '#fff'}]}>Parcel</Text>
                      </TouchableOpacity>
                      {parcelPhoto && <Image source={{ uri: parcelPhoto }} style={styles.previewImage} />}
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleBusDelivery}>
                  <Text style={styles.submitText}>Complete Dispatch</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
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
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  backBtn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 8 },
  container: { padding: 16, flexGrow: 1 },
  responsiveWrapper: { width: '100%' },

  identityCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  identityLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  identityValue: { fontSize: 18, fontWeight: '800', color: '#0ea5e9' },
  badge: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#0ea5e9', fontWeight: '700', textTransform: 'uppercase' },

  mainLayout: { flexDirection: 'column', gap: 16 },
  desktopRow: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  column: { flex: 1 },

  card: { backgroundColor: "#fff", padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },

  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: "#fff", color: '#1e293b' },

  inputRow: { flexDirection: 'row', gap: 12 },
  timeBox: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" },
  timeText: { fontSize: 15, color: "#1e293b", fontWeight: '500' },

  photoGrid: { flexDirection: 'row', gap: 12 },
  uploadBtn: { 
    backgroundColor: "#f1f5f9", 
    padding: 15, 
    borderRadius: 15, 
    alignItems: "center", 
    justifyContent: 'center', 
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed'
  },
  uploadBtnActive: { backgroundColor: '#1e293b', borderStyle: 'solid', borderColor: '#1e293b' },
  uploadText: { color: "#64748b", fontWeight: "700", fontSize: 12 },
  previewImage: { width: "100%", height: 100, borderRadius: 12, marginTop: 10 },

  submitBtn: { 
    backgroundColor: "#1e293b", 
    paddingVertical: 18, 
    borderRadius: 15, 
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: "#1e293b",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});