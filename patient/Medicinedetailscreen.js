import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { getMedicineId, getPatientId } from "../utils/storage";

const MedicineDetailsScreen = ({ route, navigation }) => {
  const [medicine, setMedicine] = useState(null);
  const [patientId, setPatientId] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [medicineId, setMedicineId] = useState(null);
  
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 1024;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const initData = async () => {
      const sPatientId = await getPatientId();
      const sMedId = await getMedicineId();
      setPatientId(route?.params?.patientId || sPatientId || 1);
      setMedicineId(route?.params?.medicineId || sMedId);
    };
    initData();
  }, [route?.params]);

  useEffect(() => {
    if (medicineId) fetchMedicineById();
  }, [medicineId]);

  const fetchMedicineById = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/medicine/${medicineId}`);
      const data = await res.json();
      setMedicine(data);
    } catch (error) {
      showAlert("Error", "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type) => {
    if (!medicine) return;
    setAddingToCart(true);
    try {
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          ...medicine,
          quantity: quantity,
        }),
      });
      if (res.ok) {
        if (type === 'buy') navigation.navigate("shoppingcart", { patientId });
        else showAlert("Success", "Added to your pharmacy cart");
      }
    } catch (error) {
      showAlert("Error", "Server connection failed");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || !medicine) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#002E5B" />
        <Text style={{marginTop: 10, color: '#64748B'}}>Loading Product Specifications...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Breadcrumb Nav */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Ionicons name="chevron-back" size={18} color="#64748B" />
          <Text style={styles.breadcrumbText}>Medicine Store</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbCurrent}> / {medicine.name}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.mainWrapper, isDesktop && styles.desktopRow]}>
          
          {/* LEFT COLUMN: Visuals */}
          <View style={isDesktop ? styles.leftCol : styles.mobileCol}>
            <View style={styles.imageCard}>
              {medicine.images?.[0] ? (
                <Image source={{ uri: medicine.images[0] }} style={styles.mainImage} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name="pill" size={120} color="#E2E8F0" />
              )}
            </View>
            
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>BATCH NO.</Text>
                <Text style={styles.specValue}>{medicine.batch_number || 'N/A'}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>PACK SIZE</Text>
                <Text style={styles.specValue}>{medicine.pack_size || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* RIGHT COLUMN: Data & Actions */}
          <View style={isDesktop ? styles.rightCol : styles.mobileCol}>
            <View style={styles.headerInfo}>
              <Text style={styles.brandName}>{medicine.manufacturer}</Text>
              <Text style={styles.medTitle}>{medicine.name}</Text>
              <View style={styles.tagRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{medicine.category}</Text>
                </View>
                {/* <View style={styles.stockBadge}>
                  <View style={styles.dot} />
                  <Text style={styles.stockText}>{medicine.stock} Units Available</Text>
                </View> */}
              </View>
            </View>

            <View style={styles.descriptionBox}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descContent}>{medicine.description || "No clinical description provided for this product."}</Text>
            </View>

            {/* Price & Cart Workspace */}
            <View style={styles.actionPanel}>
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Unit Price</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.priceAmount}>{medicine.price}</Text>
                  <Text style={styles.taxNote}>+ GST (Incl.)</Text>
                </View>
              </View>

              <View style={styles.quantitySection}>
                <Text style={styles.priceLabel}>Adjust Quantity</Text>
                <View style={styles.qtyControl}>
                  <TouchableOpacity onPress={() => quantity > 1 && setQuantity(q => q - 1)} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={20} color="#1E293B" />
                  </TouchableOpacity>
                  <Text style={styles.qtyInput}>{quantity}</Text>
                  <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn}>
                    <Ionicons name="add" size={20} color="#1E293B" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonStack}>
                <TouchableOpacity 
                  style={styles.cartBtn} 
                  onPress={() => handleAction('cart')}
                  disabled={addingToCart}
                >
                  <Ionicons name="cart-outline" size={20} color="#002E5B" />
                  <Text style={styles.cartBtnText}>Add to Pharmacy Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.buyBtn}
                  onPress={() => handleAction('buy')}
                  disabled={addingToCart}
                >
                  <Text style={styles.buyBtnText}>Buy Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MedicineDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  breadcrumb: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backLink: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbText: { color: '#64748B', fontSize: 14 },
  breadcrumbCurrent: { color: '#1E293B', fontSize: 14, fontWeight: '600' },

  mainWrapper: { padding: 20, gap: 30 },
  desktopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  leftCol: { flex: 1, maxWidth: 450 },
  rightCol: { flex: 1.5 },
  mobileCol: { width: '100%' },

  imageCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    height: 350, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    elevation: 2
  },
  mainImage: { width: '80%', height: '80%' },

  specGrid: { flexDirection: 'row', gap: 15, marginTop: 20 },
  specItem: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  specLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800', marginBottom: 5 },
  specValue: { fontSize: 14, color: '#1E293B', fontWeight: '700' },

  headerInfo: { marginBottom: 25 },
  brandName: { color: '#3B82F6', fontWeight: '700', fontSize: 14, textTransform: 'uppercase', marginBottom: 5 },
  medTitle: { fontSize: 32, fontWeight: '800', color: '#002E5B', marginBottom: 15 },
  tagRow: { flexDirection: 'row', gap: 10 },
  categoryBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  categoryText: { color: '#0369A1', fontWeight: '700', fontSize: 12 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 8 },
  stockText: { color: '#166534', fontWeight: '700', fontSize: 12 },

  descriptionBox: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  descContent: { fontSize: 15, color: '#64748B', lineHeight: 24 },

  actionPanel: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#002E5B',
    shadowOpacity: 0.05,
    elevation: 4
  },
  priceSection: { marginBottom: 20 },
  priceLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginRight: 4 },
  priceAmount: { fontSize: 32, fontWeight: '800', color: '#1E293B' },
  taxNote: { fontSize: 12, color: '#94A3B8', marginLeft: 10, fontWeight: '500' },

  quantitySection: { marginBottom: 25 },
  qtyControl: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    width: 140, 
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 5
  },
  qtyBtn: { width: 35, height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8 },
  qtyInput: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

  buttonStack: { gap: 12 },
  cartBtn: { 
    flexDirection: 'row', 
    height: 55, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: '#002E5B', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10
  },
  cartBtnText: { color: '#002E5B', fontWeight: '700', fontSize: 16 },
  buyBtn: { 
    height: 55, 
    borderRadius: 12, 
    backgroundColor: '#002E5B', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});