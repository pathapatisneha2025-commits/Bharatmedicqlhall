import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getPatientId } from "../utils/storage";

export default function ShoppingCartScreen({ route }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(null);

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 1024;

  const deliveryFee = 40;
  const taxRate = 0.05;

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
    if (patientId) fetchCartItems();
  }, [patientId]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/cart/${patientId}`);
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      showAlert("Error", "Failed to fetch cart items");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/cart/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      showAlert("Error", "Failed to remove item");
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + deliveryFee + tax;

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator size="large" color="#002E5B" /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Patient Dashboard Header */}
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.greetingText}>My Medical Cart</Text>
          <Text style={styles.subGreeting}>Manage your prescriptions and health products</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
          
          {/* Left Column: Medicine List */}
          <View style={isDesktop ? styles.leftPanel : styles.fullPanel}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11329/11329073.png' }} 
                  style={styles.emptyImg} 
                />
                <Text style={styles.emptyTitle}>Cart is Empty</Text>
                <TouchableOpacity 
                    style={styles.addMedBtn} 
                    onPress={() => navigation.navigate("MedicineScreen")}
                >
                  <Text style={styles.addMedText}>+ Browse Medicines</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cartItems.map((item) => (
                <View key={item.id} style={styles.medCard}>
                  <View style={styles.medIconBox}>
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} style={styles.medImg} />
                    ) : (
                      <MaterialCommunityIcons name="pill" size={30} color="#002E5B" />
                    )}
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{item.name}</Text>
                    <Text style={styles.medSub}>{item.manufacturer} • {item.category}</Text>
                    <View style={styles.medMeta}>
                      <Text style={styles.medPrice}>₹{item.price}</Text>
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyBadgeText}>Qty: {item.quantity}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-bin-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Right Column: Checkout Sidebar */}
          {cartItems.length > 0 && (
            <View style={isDesktop ? styles.rightPanel : styles.fullPanel}>
              <View style={styles.invoiceCard}>
                <Text style={styles.invoiceTitle}>Order Summary</Text>
                
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>Items Total</Text>
                  <Text style={styles.invoiceValue}>₹{subtotal}</Text>
                </View>
                
                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>Delivery Charges</Text>
                  <Text style={styles.invoiceValue}>₹{deliveryFee}</Text>
                </View>

                <View style={styles.invoiceRow}>
                  <Text style={styles.invoiceLabel}>Estimated Tax (GST)</Text>
                  <Text style={styles.invoiceValue}>₹{tax}</Text>
                </View>

                <View style={styles.dottedDivider} />

                <View style={[styles.invoiceRow, { marginBottom: 25 }]}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalValue}>₹{total}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.checkoutAction}
                  onPress={() => navigation.navigate("selectaddress", { cartItems, total })}
                >
                  <Text style={styles.checkoutActionText}>Checkout Now</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>

                {/* <View style={styles.offerTag}>
                  <Ionicons name="pricetag-outline" size={14} color="#059669" />
                  <Text style={styles.offerText}>Free delivery on orders above ₹1000</Text>
                </View> */}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  dashboardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  greetingText: { fontSize: 22, fontWeight: '800', color: '#3B82F6' },
  subGreeting: { fontSize: 13, color: '#64748B', marginTop: 2 },
  closeBtn: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },

  scrollContent: { padding: 20 },
  mainLayout: { gap: 20 },
  desktopLayout: { flexDirection: 'row', alignItems: 'flex-start' },
  leftPanel: { flex: 1.8 },
  rightPanel: { flex: 1 },
  fullPanel: { width: '100%' },

  medCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  medIconBox: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  medImg: { width: 45, height: 45, borderRadius: 8 },
  medInfo: { flex: 1, marginLeft: 16 },
  medName: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  medSub: { fontSize: 12, color: '#64748B', marginVertical: 4 },
  medMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medPrice: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
  qtyBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  qtyBadgeText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  deleteBtn: { padding: 10 },

  invoiceCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    elevation: 2
  },
  invoiceTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  invoiceLabel: { fontSize: 14, color: '#64748B' },
  invoiceValue: { fontSize: 14, color: '#3B82F6', fontWeight: '700' },
  dottedDivider: { height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', marginVertical: 15 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#3B82F6' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#10B981' }, // Emerald for total

  checkoutAction: { 
    backgroundColor: '#3B82F6', 
    height: 56, 
    borderRadius: 14, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 10 
  },
  checkoutActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  offerTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 6 },
  offerText: { fontSize: 12, color: '#059669', fontWeight: '600' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyImg: { width: 120, height: 120, opacity: 0.8 },
  emptyTitle: { marginTop: 20, fontSize: 18, fontWeight: '700', color: '#64748B' },
  addMedBtn: { marginTop: 15, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#E0F2FE', borderRadius: 10 },
  addMedText: { color: '#3B82F6', fontWeight: '700' }
});