import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function RequestForm({ navigation }) {
  const [employee, setEmployee] = useState({});
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const numColumns = SCREEN_WIDTH > 768 ? 3 : 2; // 3 cards on desktop, 2 on mobile
  const containerWidth = SCREEN_WIDTH > 1000 ? 1000 : SCREEN_WIDTH;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const loadEmployee = async () => {
    const id = await getEmployeeId();
    const res = await fetch(`${BASE_URL}/employee/${id}`);
    const data = await res.json();
    setEmployee(data.employee);
  };

  const loadInventory = async () => {
    const res = await fetch(`${BASE_URL}/doctorrequest`);
    const data = await res.json();
    setInventory(data.items || []);
  };

  useEffect(() => {
    Promise.all([loadEmployee(), loadInventory()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const addItem = (item) => {
    setCart((prev) => {
      const currentQty = prev[item.id] || 0;
      if (currentQty >= item.stock) return prev;
      return { ...prev, [item.id]: currentQty + 1 };
    });
  };

  const removeItem = (item) => {
    setCart((prev) => {
      if (!prev[item.id]) return prev;
      const updated = { ...prev };
      updated[item.id] === 1 ? delete updated[item.id] : (updated[item.id] -= 1);
      return updated;
    });
  };

  const submitRequest = async () => {
    if (Object.keys(cart).length === 0) {
      showAlert("Empty Request", "Please select items");
      return;
    }
    const employee_id = await getEmployeeId();
    if (!employee_id) {
      showAlert("Error", "Employee not found. Please login again.");
      return;
    }

    const items = Object.keys(cart).map((id) => {
      const inventoryItem = inventory.find((i) => i.id === parseInt(id));
      return {
        item_id: parseInt(id),
        name: inventoryItem?.name || "Unknown",
        quantity: cart[id],
      };
    });

    try {
      const res = await fetch(`${BASE_URL}/doctorrequest/submitrequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id,
          department: employee.department,
          items,
        }),
      });

      if (res.ok) {
        showAlert("Success", "Request sent for admin approval");
        setInventory(prev => prev.map(item => ({
          ...item,
          stock: item.stock - (cart[item.id] || 0)
        })));
        setCart({});
      } else {
        const errorData = await res.json();
        showAlert("Error", errorData.message || "Failed to submit request");
      }
    } catch (error) {
      showAlert("Error", "Server error. Please try again later.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0D6EFD" />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const selectedQty = cart[item.id] || 0;
    const remainingStock = item.stock - selectedQty;

    return (
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
        <Image
  source={{ uri: item.image_url || item.image_urls?.[0] || "https://via.placeholder.com/80" }}
  style={styles.cardImage} // ✅ use your style
  resizeMode="contain"
/>

          {remainingStock <= 5 && remainingStock > 0 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.stockLabel}>Stock: {remainingStock}</Text>
          
          <View style={styles.cardControls}>
            <TouchableOpacity onPress={() => removeItem(item)} style={styles.circleBtn}>
              <Ionicons name="remove" size={18} color="#666" />
            </TouchableOpacity>
            
            <Text style={styles.qtyText}>{selectedQty}</Text>
            
            <TouchableOpacity 
              onPress={() => addItem(item)} 
              disabled={remainingStock === 0}
              style={[styles.circleBtn, { backgroundColor: '#0D6EFD' }]}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>Stationery</Text>
          <Text style={styles.headerSub}>{employee.department}</Text>
        </View>
      </View>

      <View style={[styles.listWrapper, { width: containerWidth }]}>
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={numColumns}
          key={numColumns} // Forces re-render when switching columns
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {totalItems > 0 && (
        <View style={styles.floatingFooter}>
          <View>
            <Text style={styles.footerLabel}>Items Selected</Text>
            <Text style={styles.footerCount}>{totalItems} units</Text>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={submitRequest}>
            <Text style={styles.submitBtnText}>Request Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FA" },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F2F5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  headerSub: { fontSize: 13, color: '#666', fontWeight: '500' },

  listWrapper: { flex: 1, alignSelf: 'center' },
  flatListContent: { padding: 10, paddingBottom: 120 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 8,
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E9EF',
    // Shadow
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
 imageWrapper: {
  width: '100%',
  aspectRatio: 1.4, // width / height ratio
  backgroundColor: '#F8FAFC',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 10,
},
cardImage: {
  width: '100%',
  height: '100%',
  borderRadius: 12,
},

  lowStockBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FFF0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lowStockText: { fontSize: 10, color: '#DC3545', fontWeight: '700', textTransform: 'uppercase' },

  cardInfo: { padding: 12, alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 2 },
  stockLabel: { fontSize: 12, color: '#28A745', marginBottom: 12 },

  cardControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F1F4F9',
    borderRadius: 12,
    padding: 4,
  },
  circleBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  qtyText: { fontSize: 15, fontWeight: '800', color: '#333' },

  floatingFooter: {
    position: 'absolute', bottom: 25, left: 20, right: 20,
    backgroundColor: '#1A1A1A', borderRadius: 20,
    padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10
  },
  footerLabel: { color: '#999', fontSize: 12 },
  footerCount: { color: '#fff', fontSize: 18, fontWeight: '800' },
  submitBtn: { backgroundColor: '#0D6EFD', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
});