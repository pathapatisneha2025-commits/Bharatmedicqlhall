import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  useWindowDimensions,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const MedicineProductsScreen = () => {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // --- Responsive Logic ---
  const isDesktop = SCREEN_WIDTH > 768;
  const numColumns = isDesktop ? 3 : 1; 
  // -------------------------

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  const [cartCount, setCartCount] = useState(0);
  const [employeeId, setEmployeeId] = useState(null);

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const fetchEmployeeId = async () => {
      const id = await getEmployeeId();
      if (!id) {
        showAlert("Error", "Employee ID not found. Please login again.");
        return;
      }
      setEmployeeId(id);
    };
    fetchEmployeeId();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setLoadingCount(0);
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        setLoadingCount(count);
      }, 500);

      const response = await fetch(`${BASE_URL}/medicine/all`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
      clearInterval(interval);
    } catch (error) {
      showAlert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [search, products]);

  const handleAddToCart = async (item) => {
    if (!employeeId) {
      showAlert("Error", "Employee ID not found.");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeid: employeeId,
          name: item.name,
          category: item.category || "",
          manufacturer: item.manufacturer || "",
          batch_number: item.batch_number || "",
          pack_size: item.pack_size || "",
          description: item.description || "",
          price: item.price || 0,
          stock: item.stock || 0,
          quantity: 1,
          images: item.images || [],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showAlert("Success", data.message);
        setCartCount((prev) => prev + 1);
      } else {
        showAlert("Error", data.error);
      }
    } catch (err) {
      showAlert("Error", "Something went wrong");
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, isDesktop && styles.cardDesktop]}>
      <View style={styles.cardHeader}>
        <View style={styles.imageBox}>
           {item.images && item.images.length > 0 ? (
             <Image source={{ uri: item.images[0] }} style={styles.productImg} resizeMode="contain" />
           ) : (
             <Ionicons name="medical-outline" size={30} color="#0D6EFD" />
           )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{parseFloat(item.price).toFixed(2)}</Text>
            <View style={[styles.stockBadge, item.stock < 10 ? styles.stockLow : styles.stockNormal]}>
              {/* <Text style={styles.stockText}>{item.stock} in stock</Text> */}
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.addBtn} 
        onPress={() => handleAddToCart(item)}
      >
        <Ionicons name="cart-outline" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.loaderContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.loadingOverlay}>
        <Text style={styles.loadingText}>{loadingCount}%</Text>
        <ActivityIndicator size="small" color="#0D6EFD" />
      </View>
    </View>
  );

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.mainHeader, isDesktop && styles.desktopHeader]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Bharat Medical Hall</Text>
          <Text style={styles.headerSub}>Medicine Inventory Catalog</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or category..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.cartIconBtn} onPress={() => navigation.navigate("billingcart")}>
            <Ionicons name="bag-handle-outline" size={26} color="#0D6EFD" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          key={numColumns}
          data={filteredProducts}
          numColumns={numColumns}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={isDesktop ? styles.columnWrapper : null}
          ListEmptyComponent={<Text style={styles.noProducts}>No products found.</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#F8F9FA" },
  mainHeader: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5'
  },
  desktopHeader: { paddingHorizontal: '10%' },
  headerLeft: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1A1A1A" },
  headerSub: { fontSize: 13, color: "#6c757d", fontWeight: '500' },
  backBtn: { backgroundColor: '#F1F3F5', padding: 8, borderRadius: 12 },
  
  container: { flex: 1, paddingHorizontal: 16 },
  containerDesktop: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333',outlineStyle: "none", },
  cartIconBtn: { marginLeft: 15, backgroundColor: '#fff', padding: 10, borderRadius: 15, borderWidth: 1, borderColor: '#E9ECEF' },
  cartBadge: { position: "absolute", top: -5, right: -5, backgroundColor: "#DC3545", borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  listPadding: { paddingBottom: 100 },
  columnWrapper: { justifyContent: "space-between" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3
  },
  cardDesktop: { flex: 0.32, margin: 8 },
  cardHeader: { flexDirection: 'row', marginBottom: 15 },
  imageBox: { width: 70, height: 70, backgroundColor: '#F1F3F5', borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  infoContainer: { flex: 1, marginLeft: 15 },
  name: { fontSize: 17, fontWeight: "700", color: "#212529" },
  category: { fontSize: 13, color: "#adb5bd", marginTop: 2, fontWeight: '500' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontSize: 18, fontWeight: "800", color: "#0D6EFD" },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stockNormal: { backgroundColor: '#E7F9ED' },
  stockLow: { backgroundColor: '#FFF4E5' },
  stockText: { fontSize: 11, fontWeight: '700', color: '#198754' },
  
  addBtn: {
    backgroundColor: "#0D6EFD",
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 8 },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  loadingOverlay: { alignItems: 'center' },
  loadingText: { fontSize: 48, fontWeight: "900", color: "#0D6EFD", marginBottom: 10 },
  noProducts: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#adb5bd", fontWeight: '500' },
});

export default MedicineProductsScreen;