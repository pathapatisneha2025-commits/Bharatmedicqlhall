import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  BackHandler,
  Animated,
  Platform,
  useWindowDimensions,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const CartProductsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [employeeId, setEmployeeId] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 992; // Tablet/Desktop breakpoint

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const loadEmployeeId = async () => {
    const id = await getEmployeeId();
    if (id) setEmployeeId(id);
    else showAlert("Error", "Employee ID not found");
  };

  useEffect(() => { loadEmployeeId(); }, []);
  useEffect(() => { if (employeeId) fetchCartItems(employeeId); }, [employeeId]);

  const fetchCartItems = async (empId) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/cart/employee/${empId}`);
      if (!response.ok) throw new Error("Failed to fetch cart items");
      const data = await response.json();
      const items = data.items || [];
      setCartItems(items);
      calculateTotal(items);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (error) { showAlert("Error", error.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/cart/${id}`, { method: "DELETE" });
      if (response.ok) {
        const updatedItems = cartItems.filter((item) => item.id !== id);
        setCartItems(updatedItems);
        calculateTotal(updatedItems);
      }
    } catch (error) { showAlert("Error", "Failed to delete item"); }
    finally { setLoading(false); }
  };

  const updateQty = (itemId, change) => {
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + change);
        updateCartItem(itemId, newQty);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updatedItems);
    calculateTotal(updatedItems);
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await fetch(`${BASE_URL}/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
    } catch (error) { console.log("Update failed", error); }
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    setTotalAmount(total);
  };

  const renderItem = ({ item }) => (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <View style={styles.imageBox}>
        <Image 
          source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }} 
          style={styles.productImage} 
          resizeMode="contain" 
        />
      </View>
      <View style={styles.detailsBox}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#DC3545" />
          </TouchableOpacity>
        </View>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.priceQtyRow}>
          <Text style={styles.price}>₹{parseFloat(item.price).toFixed(2)}</Text>
          <View style={styles.stepper}>
            <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.stepBtn}>
              <Ionicons name="remove" size={16} color="#0D6EFD" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.stepBtn}>
              <Ionicons name="add" size={16} color="#0D6EFD" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER BAR */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.brandTitle}>Bharat Medical Hall</Text>
            <Text style={styles.brandSub}>Checkout & Billing</Text>
          </View>
        </View>
      </View>

      <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
        {/* LEFT COLUMN: ITEMS */}
        <View style={styles.leftColumn}>
          <Text style={styles.sectionTitle}>Shopping Cart ({cartItems.length} items)</Text>
          {loading && cartItems.length === 0 ? (
            <ActivityIndicator size="large" color="#0D6EFD" style={{marginTop: 50}} />
          ) : (
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>Your cart is currently empty.</Text>}
            />
          )}
        </View>

        {/* RIGHT COLUMN: SUMMARY */}
        <View style={isDesktop ? styles.rightColumn : styles.mobileFooter}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (GST 0%)</Text>
              <Text style={styles.summaryValue}>₹0.00</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 15 }]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.checkoutBtn, cartItems.length === 0 && { opacity: 0.6 }]}
              disabled={cartItems.length === 0}
              onPress={() => navigation.navigate("PatientDetailsScreen", { cartItems, totalAmount })}
            >
              <Text style={styles.checkoutText}>Proceed to Patient Details</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FA" },
  header: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E9ECEF", paddingVertical: 15 },
  headerContent: { maxWidth: 1200, alignSelf: 'center', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { backgroundColor: '#F1F3F5', padding: 8, borderRadius: 10 },
  brandTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A" },
  brandSub: { fontSize: 12, color: "#6c757d", fontWeight: '500' },

  mainLayout: { flex: 1, padding: 20 },
  desktopLayout: { flexDirection: 'row', maxWidth: 1200, alignSelf: 'center', width: '100%' },

  leftColumn: { flex: 2, marginRight: Platform.OS === 'web' && 20 ? 30 : 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 20 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EDF0F3' },
  imageBox: { width: 80, height: 80, backgroundColor: '#F8F9FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '80%', height: '80%' },
  detailsBox: { flex: 1, marginLeft: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  category: { fontSize: 12, color: '#999', marginVertical: 4 },
  priceQtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 17, fontWeight: '800', color: '#0D6EFD' },
  
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 8, padding: 3 },
  stepBtn: { backgroundColor: '#fff', width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  qtyText: { fontSize: 14, fontWeight: '700', marginHorizontal: 12 },

  rightColumn: { flex: 1, minWidth: 350 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#EDF0F3', position: Platform.OS === 'web' ? 'sticky' : 'relative', top: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 15 },
  summaryDivider: { height: 1, backgroundColor: '#F1F3F5', marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: '#6c757d', fontSize: 14 },
  summaryValue: { fontWeight: '600', color: '#333' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#0D6EFD' },

  checkoutBtn: { backgroundColor: '#0D6EFD', borderRadius: 14, height: 55, marginTop: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  mobileFooter: { marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
});

export default CartProductsScreen;