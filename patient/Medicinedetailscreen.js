import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProductCard from "../components/ProductCard";
import { getMedicineId, getPatientId } from "../utils/storage";
import { LinearGradient } from "expo-linear-gradient";

const MedicineDetailsScreen = ({ route, navigation }) => {
  const [medicine, setMedicine] = useState(null);
  const [patientId, setPatientId] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [medicineId, setMedicineId] = useState(null);

  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const storedPatientId = await getPatientId();
        setPatientId(route?.params?.patientId || storedPatientId || 1);
      } catch {
        setPatientId(route?.params?.patientId || 1);
      }
    };
    fetchPatientId();
  }, [route?.params?.patientId]);

  useEffect(() => {
    const fetchMedicineId = async () => {
      try {
        const storedId = await getMedicineId();
        setMedicineId(route?.params?.medicineId || storedId || null);
      } catch {
        setMedicineId(route?.params?.medicineId || null);
      }
    };
    fetchMedicineId();
  }, [route?.params?.medicineId]);

  const fetchMedicineById = async () => {
    if (!medicineId) return;
    try {
      setLoading(true);
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/medicine/${medicineId}`);
      const data = await res.json();
      setMedicine(data);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to fetch medicine details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicineById();
  }, [medicineId]);

  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => quantity > 1 && setQuantity(quantity - 1);

  const addToCart = async () => {
    if (!medicine) return;
    try {
      setAddingToCart(true);
const cartData = {
        patient_id: patientId,
        name: medicine.name,
        category: medicine.category,
        manufacturer: medicine.manufacturer,
        batch_number: medicine.batch_number,
        pack_size: medicine.pack_size,
        description: medicine.description,
        price: medicine.price,
        stock: medicine.stock,
        quantity: quantity,
        images: medicine.images,
      };

      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartData),
      });
      const result = await res.json();
      if (res.ok) {
        Alert.alert("Success", result.message);
        navigation.navigate("shoppingcart", { patientId });
      } else {
        Alert.alert("Error", result.message || "Failed to add to cart");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong while adding to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!medicine) return;
    try {
      setBuyNowLoading(true);
const cartData = {
        patient_id: patientId,
        name: medicine.name,
        category: medicine.category,
        manufacturer: medicine.manufacturer,
        batch_number: medicine.batch_number,
        pack_size: medicine.pack_size,
        description: medicine.description,
        price: medicine.price,
        stock: medicine.stock,
        quantity: quantity,
        images: medicine.images,
      };

      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartData),
      });
      const result = await res.json();
      if (res.ok) navigation.navigate("shoppingcart", { patientId });
      else Alert.alert("Error", result.message || "Failed to process Buy Now");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong while buying");
    } finally {
      setBuyNowLoading(false);
    }
  };

  if (loading || !medicine) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#007AFF" />
        </TouchableOpacity>

        {/* Medicine Carousel */}
        <ProductCard medicine={medicine} />

        {/* Medicine Name */}
        <Text style={styles.medicineName}>{medicine.name}</Text>

        {/* Info Section */}
        <View style={styles.infoBox}>
          {[
            { label: "Category", value: medicine.category },
            { label: "Manufacturer", value: medicine.manufacturer },
            { label: "Batch Number", value: medicine.batch_number },
            { label: "Pack Size", value: medicine.pack_size },
            { label: "Description", value: medicine.description },
            { label: "Stock", value: medicine.stock },
          ].map((item, idx) => (
            <Text key={idx} style={styles.infoText}>
              <Text style={styles.label}>{item.label}: </Text>
              {item.value}
            </Text>
          ))}
        </View>

        {/* Price & Quantity */}
        <View style={styles.row}>
          <Text style={styles.mrp}>₹{medicine.price}</Text>
          <View style={styles.quantityBox}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decreaseQuantity}>
              <Text style={styles.qtyText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNumber}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={increaseQuantity}>
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity disabled={addingToCart} onPress={addToCart} style={{ flex: 1 }}>
            <LinearGradient
              colors={["#4facfe", "#00f2fe"]}
              style={styles.gradientBtn}
            >
              <Text style={styles.btnText}>{addingToCart ? "Adding..." : "Add to Cart"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity disabled={buyNowLoading} onPress={handleBuyNow} style={{ flex: 1 }}>
            <LinearGradient
              colors={["#43e97b", "#38f9d7"]}
              style={styles.gradientBtn}
            >
              <Text style={styles.btnText}>{buyNowLoading ? "Processing..." : "Buy Now"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MedicineDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f6ff", padding: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { alignSelf: "flex-start", marginBottom: 10 },
  medicineName: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 15 },
  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  infoText: { fontSize: 15, marginVertical: 3, color: "#333" },
  label: { fontWeight: "600", color: "#007AFF" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  mrp: { fontSize: 20, fontWeight: "bold", color: "#28a745" },
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  qtyBtn: { backgroundColor: "#e0e0e0", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  qtyText: { fontSize: 20, fontWeight: "bold", color: "#555" },
  qtyNumber: { fontSize: 16, marginHorizontal: 10, fontWeight: "600", color: "#007AFF" },
  btnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, gap: 10 },
  gradientBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
