import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function OrderForm() {
  const navigation = useNavigation();

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [orderItems, setOrderItems] = useState([
    { id: Date.now(), name: "", quantity: "1", mrp: "", rate: "" },
  ]);

  const [paymentMode, setPaymentMode] = useState("cod");
  const [deliveryType, setDeliveryType] = useState("local");
  const [loading, setLoading] = useState(false);

  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [prescriptionImage, setPrescriptionImage] = useState(null);

  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      { id: Date.now(), name: "", quantity: "1", mrp: "", rate: "" },
    ]);
  };

  const removeOrderItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((i) => i.id !== id));
    }
  };

  const updateOrderItem = (id, field, value) => {
    setOrderItems(
      orderItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const pickPrescription = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPrescriptionImage(result.assets[0].uri);
    }
  };

  /* GRAND TOTAL */
  const grandTotal = orderItems.reduce((sum, i) => {
    let qty = Number(i.quantity || 0);
    let rate = Number(i.rate || 0);
    return sum + qty * rate;
  }, 0);

  const handleSubmit = async () => {
    if (!customerName || !mobile || !address || !pinCode) {
      Alert.alert("Missing Information", "Please fill all required fields.");
      return;
    }

    if (orderItems.some((i) => !i.name.trim())) {
      Alert.alert("Missing Items", "Add at least one valid order item.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("customer_name", customerName);
      formData.append("mobile", mobile);
      formData.append("address", address);
      formData.append("landmark", landmark);
      formData.append("pincode", pinCode);

      formData.append("payment_mode", paymentMode);
      formData.append("delivery_type", deliveryType);

      formData.append(
        "prescription_required",
        String(prescriptionRequired)
      );

      /* FORMAT ITEMS */
      const formattedItems = orderItems.map((i) => ({
        item_name: i.name,
        quantity: Number(i.quantity || 0),
        mrp: Number(i.mrp || 0),
        rate: Number(i.rate || 0),
        total: Number(i.quantity || 0) * Number(i.rate || 0),
      }));

      formData.append("items", JSON.stringify(formattedItems));
      formData.append("total_amount", String(grandTotal)); // FIXED ✔

      if (prescriptionRequired && prescriptionImage) {
        formData.append("prescription", {
          uri: prescriptionImage,
          name: "prescription.jpg",
          type: "image/jpeg",
        });
      }

      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/salesorders/create",
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success) {
        Alert.alert("Success", "Order Created Successfully!");

        setCustomerName("");
        setMobile("");
        setAddress("");
        setLandmark("");
        setPinCode("");
        setOrderItems([
          { id: Date.now(), name: "", quantity: "1", mrp: "", rate: "" },
        ]);
        setPaymentMode("cod");
        setDeliveryType("local");
        setPrescriptionRequired(false);
        setPrescriptionImage(null);

        navigation.goBack();
      } else {
        Alert.alert("Error", data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Could not create order.");
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.header}>Create Sales Order</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CUSTOMER INFO */}
      <View style={styles.sectionHeader}>
        <Ionicons name="person-circle-outline" size={22} color="#2563eb" />
        <Text style={styles.sectionTitle}>Customer Information</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Customer Name *"
        value={customerName}
        onChangeText={setCustomerName}
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile Number *"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
      />

      {/* ADDRESS */}
      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={22} color="#2563eb" />
        <Text style={styles.sectionTitle}>Delivery Address</Text>
      </View>

      <TextInput
        style={[styles.input, { height: 70 }]}
        placeholder="Address *"
        value={address}
        multiline
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Landmark"
        value={landmark}
        onChangeText={setLandmark}
      />
      <TextInput
        style={styles.input}
        placeholder="Pin Code *"
        value={pinCode}
        keyboardType="number-pad"
        onChangeText={setPinCode}
      />

      {/* ORDER ITEMS */}
      <View style={styles.sectionHeader}>
        <Ionicons name="cart-outline" size={22} color="#2563eb" />
        <Text style={styles.sectionTitle}>Order Items</Text>
      </View>

      {orderItems.map((item, index) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={styles.itemCardHeader}>
            <Text style={styles.itemCardTitle}>Item {index + 1}</Text>
            {orderItems.length > 1 && (
              <TouchableOpacity onPress={() => removeOrderItem(item.id)}>
                <Ionicons name="trash-outline" size={22} color="red" />
              </TouchableOpacity>
            )}
          </View>

          {/* Item fields */}
          <View style={styles.fieldRow}>
            <Ionicons name="medkit-outline" size={18} color="#2563eb" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Item Name"
              value={item.name}
              onChangeText={(t) =>
                updateOrderItem(item.id, "name", t)
              }
            />
          </View>

          <View style={styles.fieldRow}>
            <Ionicons name="cube-outline" size={18} color="#2563eb" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Quantity"
              keyboardType="number-pad"
              value={item.quantity}
              onChangeText={(t) =>
                updateOrderItem(item.id, "quantity", t)
              }
            />
          </View>

          <View style={styles.fieldRow}>
            <Ionicons name="pricetag-outline" size={18} color="#2563eb" />
            <TextInput
              style={styles.fieldInput}
              placeholder="MRP"
              keyboardType="numeric"
              value={item.mrp}
              onChangeText={(t) =>
                updateOrderItem(item.id, "mrp", t)
              }
            />
          </View>

          <View style={styles.fieldRow}>
            <Ionicons name="cash-outline" size={18} color="#2563eb" />
            <TextInput
              style={styles.fieldInput}
              placeholder="Rate (Selling Price)"
              keyboardType="numeric"
              value={item.rate}
              onChangeText={(t) =>
                updateOrderItem(item.id, "rate", t)
              }
            />
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addItemButton}
        onPress={addOrderItem}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addItemText}>Add Another Item</Text>
      </TouchableOpacity>

      {/* PAYMENT MODE */}
      <View style={styles.sectionHeader}>
        <Ionicons name="card-outline" size={22} color="#2563eb" />
        <Text style={styles.sectionTitle}>Payment Mode</Text>
      </View>

      {["cod", "online", "upi"].map((mode) => (
        <TouchableOpacity
          key={mode}
          style={styles.radioRow}
          onPress={() => setPaymentMode(mode)}
        >
          <View style={styles.radioOuter}>
            {paymentMode === mode && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>
            {mode === "cod"
              ? "Cash on Delivery"
              : mode === "online"
              ? "Online Payment"
              : "UPI"}
          </Text>
        </TouchableOpacity>
      ))}

      {/* DELIVERY TYPE */}
      <View style={styles.sectionHeader}>
        <Ionicons name="bicycle-outline" size={22} color="#2563eb" />
        <Text style={styles.sectionTitle}>Delivery Type</Text>
      </View>

      {["local", "outside", "bus"].map((type) => (
  <TouchableOpacity
    key={type}
    style={styles.radioRow}
    onPress={() => setDeliveryType(type)}
  >
    <View style={styles.radioOuter}>
      {deliveryType === type && <View style={styles.radioInner} />}
    </View>

    <Text style={styles.radioLabel}>
      {type === "local"
        ? "Local (Baripada)"
        : type === "outside"
        ? "Outside Baripada"
        : "Bus Delivery"}
    </Text>
  </TouchableOpacity>
))}


      {/* PRESCRIPTION */}
      <View style={styles.sectionHeader}>
        <Ionicons name="medkit-outline" size={22} color="#2563eb" />
        <Text style={styles.sectionTitle}>Prescription</Text>
      </View>

      <TouchableOpacity
        style={styles.switchRow}
        onPress={() => setPrescriptionRequired(!prescriptionRequired)}
      >
        <Text>Prescription Required?</Text>
        <Text>{prescriptionRequired ? "Yes" : "No"}</Text>
      </TouchableOpacity>

      {prescriptionRequired && (
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={pickPrescription}
        >
          {prescriptionImage ? (
            <Image
              source={{ uri: prescriptionImage }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 10,
              }}
            />
          ) : (
            <Text style={{ color: "#777" }}>
              Tap to Upload Prescription
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* SUBMIT BUTTON */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Create Sales Order</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
    marginTop: 30,
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  backButton: { padding: 4 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563eb",
    textAlign: "center",
    flex: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },

  itemCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  itemCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },

  fieldInput: {
    flex: 1,
    fontSize: 15,
  },

  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },

  addItemText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    backgroundColor: "#444",
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 16,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
  },

  uploadBox: {
    padding: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 10,
    borderColor: "#999",
    alignItems: "center",
    marginBottom: 20,
  },

  submitBtn: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
});
