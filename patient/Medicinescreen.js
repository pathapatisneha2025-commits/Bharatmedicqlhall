import React, { useState, useEffect } from "react"; 
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
        BackHandler,

} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { storeMedicineId } from "../utils/storage";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://hospitaldatabasemanagement.onrender.com/medicine/all";

const MedicineScreen = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const navigation = useNavigation();

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setMedicines(data || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      alert("Failed to fetch medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // ✅ Get unique categories for tabs
  const categories = ["All", ...new Set(medicines.map(m => m.category?.trim()))];

  // ✅ Filter medicines based on search and active category
  const filteredMedicines = medicines.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "All" || item.category.trim() === activeTab;
    return matchesSearch && matchesTab;
  });
 useEffect(() => {
        const backAction = () => {
          // Instead of going back step by step, reset navigation to Sidebar/Home
          navigation.reset({
            index: 0,
            routes: [{ name: "bottomtab" }], // <-- replace with your sidebar/home screen name
          });
          return true; // prevents default back behavior
        };
      
        const backHandler = BackHandler.addEventListener(
          "hardwareBackPress",
          backAction
        );
      
        return () => backHandler.remove(); // clean up on unmount
      }, []);
  const renderMedicine = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ color: "#bbb" }}>No Image</Text>
        )}
      </View>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.brand}>{item.category}</Text>
      <Text style={styles.price}>₹{item.price}</Text>

      <TouchableOpacity
        style={[styles.cartBtn, { backgroundColor: "#3b82f6" }]}
        onPress={async () => {
          await storeMedicineId(item.id);
          navigation.navigate("medicaldetailscreen");
        }}
      >
        <Text style={styles.cartText}>Add to Cart</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cartBtn, { backgroundColor: "#10b981" }]}
        onPress={async () => {
          await storeMedicineId(item.id);
          navigation.navigate("medicaldetailscreen");
        }}
      >
        <Text style={styles.cartText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ---------- Header ---------- */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#111" />
        </TouchableOpacity>
        <Text style={styles.header}>Order Medicine</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* ---------- Search ---------- */}
      <TextInput
        placeholder="Search for medicines or health products"
        style={styles.searchBox}
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#999"
      />

      {/* ---------- Category Tabs ---------- */}
      <View style={styles.tabs}>
        {categories.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tabBtn, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: "#fff" }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.resultText}>{filteredMedicines.length} products found</Text>

      {/* ---------- Product List ---------- */}
      <FlatList
        data={filteredMedicines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMedicine}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

export default MedicineScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", paddingHorizontal: 15, paddingTop: 20 },
  headerContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  header: { fontSize: 22, fontWeight: "bold", color: "#111" },
  searchBox: { backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  tabs: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  tabBtn: { backgroundColor: "#e0e0e0", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 25, marginRight: 10, marginBottom: 10 },
  activeTab: { backgroundColor: "#3b82f6", shadowColor: "#3b82f6", shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  tabText: { fontSize: 14, color: "#333", fontWeight: "500" },
  resultText: { marginBottom: 10, color: "#555" },
  list: { paddingBottom: 30 },
  card: { flex: 1, backgroundColor: "#fff", borderRadius: 15, padding: 12, margin: 6, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  imageBox: { backgroundColor: "#f3f3f3", height: 120, justifyContent: "center", alignItems: "center", marginBottom: 10, borderRadius: 10, overflow: "hidden" },
  image: { width: "100%", height: "100%", borderRadius: 10 },
  name: { fontWeight: "bold", fontSize: 15, marginBottom: 2, color: "#111" },
  brand: { fontSize: 13, color: "#777" },
  price: { fontWeight: "bold", fontSize: 15, marginVertical: 6, color: "#000" },
  cartBtn: { width: "100%", marginTop: 6, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  cartText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
