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
  useWindowDimensions,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { storeMedicineId } from "../utils/storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const API_URL = "https://hospitaldatabasemanagement.onrender.com/medicine/all";

const MedicineScreen = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;
  const numColumns = isDesktop ? 4 : 2;

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();
      setMedicines(data || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const categories = ["All", ...new Set(medicines.map((m) => m.category?.trim()))];

  const filteredMedicines = medicines.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "All" || item.category.trim() === activeTab;
    return matchesSearch && matchesTab;
  });

  useEffect(() => {
    const backAction = () => {
      navigation.reset({ index: 0, routes: [{ name: "bottomtab" }] });
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  const renderMedicine = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="contain" />
        ) : (
          <Ionicons name="medical-outline" size={40} color="#CBD5E1" />
        )}
        {/* <View style={styles.badge}>
          <Text style={styles.badgeText}>In Stock</Text>
        </View> */}
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.categoryLabel}>{item.category}</Text>
        <Text style={styles.medicineName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.priceText}>₹{item.price}</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={async () => {
              await storeMedicineId(item.id);
              navigation.navigate("medicaldetailscreen");
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={async () => {
              await storeMedicineId(item.id);
              navigation.navigate("medicaldetailscreen");
            }}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loaderText}>Stocking Pharmacy...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Order Medicine</Text>
          <Text style={styles.headerSubtitle}>Verified Healthcare Products</Text>
        </View>
      <TouchableOpacity
  style={styles.iconBtn}
  onPress={() => navigation.navigate("shoppingcart")} // <-- add this
>
  <Ionicons name="cart-outline" size={24} color="#1E293B" />
</TouchableOpacity>
      </View>

      {/* Modern Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
        <TextInput
          placeholder="Search for medicines, syrups, tablets..."
          style={styles.searchBox}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Horizontal Categories */}
      <View style={{ marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {categories.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tabBtn, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid List */}
      <FlatList
        data={filteredMedicines}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMedicine}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.resultCount}>{filteredMedicines.length} items available</Text>}
      />
    </SafeAreaView>
  );
};

export default MedicineScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", paddingTop: Platform.OS === 'ios' ? 0 : 40 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
  loaderText: { marginTop: 12, color: '#3B82F6', fontWeight: '600' },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 20 },
  iconBtn: { width: 45, height: 45, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  headerSubtitle: { fontSize: 13, color: "#64748B", fontWeight: '500' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#fff", marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 16, height: 55, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  searchBox: { flex: 1, fontSize: 15, color: "#1E293B" },

  tabsScroll: { paddingHorizontal: 20, paddingBottom: 5 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: "#fff", marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  activeTab: { backgroundColor: "#3B82F6", borderColor: '#3B82F6' },
  tabText: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  activeTabText: { color: "#fff" },

  listContainer: { paddingHorizontal: 15, paddingBottom: 40 },
  resultCount: { fontSize: 13, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 15, marginLeft: 5 },

  card: { flex: 1, backgroundColor: "#fff", borderRadius: 20, margin: 8, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  imageBox: { height: 120, backgroundColor: "#F8FAFC", borderRadius: 15, justifyContent: "center", alignItems: "center", marginBottom: 12, overflow: 'hidden' },
  image: { width: "80%", height: "80%" },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, color: '#10B981', fontWeight: '800' },

  cardInfo: { gap: 4 },
  categoryLabel: { fontSize: 10, fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase' },
  medicineName: { fontWeight: "700", fontSize: 15, color: "#1E293B" },
  priceText: { fontWeight: "800", fontSize: 17, color: "#1E293B", marginVertical: 4 },

  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 5 },
  addButton: { width: 40, height: 40, backgroundColor: '#10B981', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  buyButton: { flex: 1, backgroundColor: '#3B82F6', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  buyButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 }
});