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
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPatientId, storeDeliveryAddressId } from "../utils/storage";

/* =======================
    PREMIUM COUNTING LOADER
======================= */
const CountingLoader = ({ text = "Loading..." }) => {
  const [loadingCount, setLoadingCount] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingCount((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 15);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderCircle}>
          <Text style={styles.loaderNumber}>{loadingCount}%</Text>
          <Text style={styles.loaderSubText}>{text}</Text>
      </View>
    </View>
  );
};

const DeliveryAddressScreen = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const fetchPatientId = async () => {
      const storedId = await getPatientId();
      setPatientId(route?.params?.patientId || storedId || 1);
    };
    fetchPatientId();
  }, [route?.params?.patientId]);

  useEffect(() => {
    if (patientId) fetchDeliveryAddresses();
  }, [patientId]);

  const fetchDeliveryAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/delivery-addresses/patient/${patientId}`
      );
      const data = await response.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      showAlert("Error", "Failed to sync addresses.");
    } finally {
      // Small delay to let the counting loader finish smoothly
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleSelectAddress = async (item) => {
    setSelectedAddress(item);
    await storeDeliveryAddressId(item.id);
  };

  const renderAddressItem = ({ item }) => {
    const isSelected = selectedAddress?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.addressBox, isSelected && styles.addressBoxSelected]}
        onPress={() => handleSelectAddress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.addressHeader}>
          <View style={[styles.statusDot, isSelected && styles.statusDotActive]} />
          <Text style={styles.addressTypeText}>{item.address_type.toUpperCase()}</Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#0080FF" />
              <Text style={styles.selectedBadgeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.patientDetailRow}>
          <Text style={styles.patientNameText}>{item.name}</Text>
          <Text style={styles.patientPhoneText}>📞 {item.mobile}</Text>
        </View>

        <Text style={styles.fullAddressText}>
          {item.flat}, {item.street}, {item.city} - {item.pincode}
        </Text>

        {item.landmark && (
          <View style={styles.landmarkBox}>
            <Text style={styles.landmarkLabel}>LANDMARK: </Text>
            <Text style={styles.landmarkValue}>{item.landmark}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <CountingLoader text="Syncing your locations..." />;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Styled like Login Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0080FF" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.mainTitle}>Delivery <Text style={{color: '#0080FF'}}>Address</Text></Text>
          <Text style={styles.subTitle}>Select a saved location for your medical delivery</Text>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAddressItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity
              onPress={() => navigation.navigate("addaddress")}
              style={styles.addAddressPrompt}
            >
              <View style={styles.addIconCircle}>
                <Ionicons name="location" size={20} color="#0080FF" />
              </View>
              <Text style={styles.addAddressText}>Add New Delivery Location</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={{marginLeft: 'auto'}} />
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={70} color="#E2E8F0" />
              <Text style={styles.emptyText}>No addresses found in your profile</Text>
            </View>
          }
        />
      </View>

      {/* Primary Action Button - Matches Login Style */}
      {selectedAddress && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => navigation.navigate("checkout", { patientId, address: selectedAddress })}
          >
            <Text style={styles.primaryActionText}>Continue to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default DeliveryAddressScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  
  // Header Style
  topHeader: { paddingHorizontal: 30, paddingTop: 20, paddingBottom: 15 },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  headerTextGroup: { marginBottom: 10 },
  mainTitle: { fontSize: 32, fontWeight: "800", color: "#1E293B" },
  subTitle: { fontSize: 15, color: "#64748B", marginTop: 5, lineHeight: 22 },

  content: { flex: 1 },
  listContainer: { padding: 25, paddingBottom: 120 },
  
  // Add Address Box
  addAddressPrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginBottom: 30,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  addAddressText: { fontSize: 16, fontWeight: "700", color: "#1E293B" },

  // Address Cards (Signup Input Style)
  addressBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  addressBoxSelected: {
    borderColor: "#0080FF",
    backgroundColor: "#F0F9FF",
  },
  addressHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#CBD5E1", marginRight: 8 },
  statusDotActive: { backgroundColor: "#0080FF" },
  addressTypeText: { fontSize: 11, fontWeight: "800", color: "#64748B", letterSpacing: 0.5 },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0080FF",
    gap: 5,
  },
  selectedBadgeText: { fontSize: 10, fontWeight: "900", color: "#0080FF" },

  patientDetailRow: { marginBottom: 8 },
  patientNameText: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  patientPhoneText: { fontSize: 14, color: "#0080FF", fontWeight: "700", marginTop: 2 },
  fullAddressText: { fontSize: 14, color: "#475569", lineHeight: 22 },
  
  landmarkBox: {
    marginTop: 15,
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 12,
  },
  landmarkLabel: { fontSize: 11, fontWeight: "800", color: "#64748B" },
  landmarkValue: { fontSize: 11, color: "#1E293B", fontWeight: "700" },

  // Primary Button Style (Matches Login)
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 25,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  primaryActionBtn: {
    backgroundColor: "#0080FF",
    height: 65,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0px 10px 25px rgba(0, 128, 255, 0.4)' },
      default: { elevation: 8, shadowColor: '#0080FF', shadowOpacity: 0.4, shadowRadius: 10 }
    })
  },
  primaryActionText: { color: "#fff", fontSize: 18, fontWeight: "800" },

  // Loader Styles
  loaderContainer: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  loaderCircle: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', borderWidth: 8, borderColor: '#0080FF' },
  loaderNumber: { fontSize: 48, fontWeight: '900', color: '#0080FF' },
  loaderSubText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 5 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  emptyText: { marginTop: 15, color: "#94A3B8", fontSize: 16, fontWeight: '600' },
});