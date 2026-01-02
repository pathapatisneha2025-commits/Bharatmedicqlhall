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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage"; // ✅ Import from utils

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const MedicineProductsScreen = () => {
  const navigation = useNavigation();

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [employeeId, setEmployeeId] = useState(null); // ✅ Dynamic employee ID state

  // ✅ Fetch employee ID from storage
  useEffect(() => {
    const fetchEmployeeId = async () => {
      const id = await getEmployeeId();
      if (!id) {
        Alert.alert("Error", "Employee ID not found. Please login again.");
        return;
      }
      setEmployeeId(id);
    };
    fetchEmployeeId();
  }, []);

  // ✅ Fetch all medicines
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/medicine/all`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Filter products when search changes
  useEffect(() => {
    const filtered = products.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [search, products]);

  // ✅ Add to Cart API
  const handleAddToCart = async (item) => {
    if (!employeeId) {
      Alert.alert("Error", "Employee ID not loaded yet. Try again.");
      return;
    }

    try {
      setLoading(true);
const payload = {
  employeeid: employeeId,
  name: item.name || "",
  category: item.category || "",
  manufacturer: item.manufacturer || "",
  batch_number: item.batch_number || "",
  pack_size: item.pack_size || "",
  description: item.description || "",
  price: item.price ? item.price.toString() : "0",
  stock: item.stock ? item.stock.toString() : "0",
  quantity: "1",
  images:
    item.images && item.images.length > 0
      ? item.images
      : ['https://via.placeholder.com/300'], // fallback
};


      const response = await fetch(`${BASE_URL}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data?.message) {
        Alert.alert("✅ Success", data.message);
        setCartCount((prev) => prev + 1);
      } else {
        throw new Error(data.message || "Failed to add item to cart");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
   if (loading)
          return (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text>Loading...</Text>
            </View>
          );
  

  // ✅ Render each product card
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        {item.images && item.images.length > 0 && (
<Image
  source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/300' }}
  style={styles.productImage}
/>
        )}
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>₹{parseFloat(item.price).toFixed(2)}</Text>
        <Text style={styles.stock}>Stock: {item.stock}</Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item)}>
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔙 Back Arrow */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Products</Text>
      </View>

      {/* 🔍 Search & Cart Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 🛒 Cart Icon */}
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate("billingcart")}>
          <Ionicons name="cart-outline" size={24} color="#000" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 📦 Products List */}
      <Text style={styles.heading}>Products</Text>
      {filteredProducts.length === 0 ? (
        <Text style={styles.noProducts}>No products found.</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default MedicineProductsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    marginTop:20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backBtn: {
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 45,
  },
  searchIcon: { marginRight: 5 },
  searchInput: { flex: 1, fontSize: 16 },
  cartBtn: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    right: 2,
    top: 2,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cartBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  heading: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  noProducts: { textAlign: "center", marginTop: 20, fontSize: 16 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 5 },
  name: { fontSize: 16, fontWeight: "bold", color: "#000" },
  category: { fontSize: 14, color: "#777", marginVertical: 2 },
  price: { fontSize: 15, fontWeight: "bold", color: "#007bff" },
  stock: { fontSize: 13, color: "#555" },
  addBtn: { backgroundColor: "#007bff", borderRadius: 50, padding: 10 },
});
