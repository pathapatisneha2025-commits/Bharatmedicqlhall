import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function EmployeePickerScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [pickedData, setPickedData] = useState({});
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Responsive Layout Constants
  const isDesktop = SCREEN_WIDTH > 1024;
  const isTablet = SCREEN_WIDTH > 768 && SCREEN_WIDTH <= 1024;
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const SIDEBAR_WIDTH = 260;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/salesorders/all`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
      else setOrders([]);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updatePickedQty = (orderId, index, qty) => {
    setPickedData((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [index]: qty },
    }));
  };

  const sendToChecker = async (order) => {
    const pickedItems = order.items.map((item, index) => ({
      item_name: item.item_name,
      quantity: item.quantity,
      picked_qty: pickedData?.[order.id]?.[index] !== undefined ? Number(pickedData[order.id][index]) : 0,
    }));

    for (let p of pickedItems) {
      if (!p.picked_qty || p.picked_qty === 0) {
        showAlert("Error", "Enter picked qty for all items.");
        return;
      }
    }

    try {
      const res = await fetch(`${API_URL}/picker/mark-as-picked`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, picked_items: pickedItems, status: "Picked" }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Success", "Order sent to Checker!");
        fetchOrders();
      } else {
        showAlert("Error", data.error || "Failed to send");
      }
    } catch (e) {
      showAlert("Error", "Server error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#f59e0b";
      case "Picked": return "#0ea5e9";
      case "Checked": return "#10b981";
      default: return "#1e293b";
    }
  };

 const SidebarItem = ({ icon, label, active = false, onPress }) => (
  <TouchableOpacity
    style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    onPress={onPress} // <-- attach the onPress here
  >
    <Ionicons name={icon} size={22} color={active ? "#fff" : "#bfdbfe"} />
    <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>{label}</Text>
  </TouchableOpacity>
);
   

  const renderOrder = ({ item }) => {
    const itemsArray = Array.isArray(item.items) ? item.items : [];
    const grandTotal = itemsArray.reduce((sum, i) => sum + (i.rate || 0) * (i.quantity || 0), 0);

    return (
      <View style={[styles.orderCard, (isDesktop || isTablet) ? { flex: 1 / numColumns, margin: 10 } : { width: '100%' }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderIdText}>Order #{item.id}</Text>
            <Text style={styles.dateText}>{item.customer_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || "Pending"}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoLine}><Ionicons name="call-outline" size={14} color="#64748b" /><Text style={styles.infoText}>{item.mobile}</Text></View>
          <View style={styles.infoLine}><Ionicons name="location-outline" size={14} color="#64748b" /><Text style={styles.infoText} numberOfLines={1}>{item.address}</Text></View>
          <View style={styles.itemsDivider} />
          {itemsArray.map((i, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}><Text style={styles.itemMainName}>{i.item_name}</Text><Text style={styles.itemSubDetail}>Qty: {i.quantity}</Text></View>
              <TextInput placeholder="0" keyboardType="numeric" style={styles.pickInput} onChangeText={(text) => updatePickedQty(item.id, index, text)} />
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalValue}>₹{grandTotal}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => sendToChecker(item)}>
            <Text style={styles.actionBtnText}>Pick</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainWrapper}>
      {/* BLUE DESKTOP SIDEBAR */}
      {/* {isDesktop && (
        <View style={[styles.sidebar, { width: SIDEBAR_WIDTH }]}>
          <View style={styles.sidebarHeader}>
            <View style={styles.logoBox}><Ionicons name="cube" size={24} color="#0284c7" /></View>
            <Text style={styles.logoText}>LogiTrack</Text>
          </View>
          <View style={styles.sidebarMenu}>
           <SidebarItem
        icon="grid"
        label="Dashboard"
        active
        onPress={() => navigation.navigate("PickerDashboardScreen")}
      />
      <SidebarItem
        icon="list"
        label="Checker"
        onPress={() => navigation.navigate("CheckerScreen")}
      />
      <SidebarItem
        icon="person"
        label="Profile"
        onPress={() => navigation.navigate("PickerProfileScreen")}
      />
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.navigate("SelectRole")}>
            <Ionicons name="log-out-outline" size={20} color="#fecaca" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* CONTENT AREA */}
      <View style={styles.contentContainer}>
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.mainTitle}>Picker Dashboard</Text>
            <Text style={styles.subTitle}>{orders.length} Orders Pending</Text>
          </View>
          <TouchableOpacity onPress={fetchOrders} style={styles.refreshBtn}>
             <Ionicons name="refresh" size={22} color="#0284c7" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoader}><ActivityIndicator size="large" color="#0284c7" /></View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrder}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={isDesktop ? styles.listPaddingDesktop : styles.listPaddingMobile}
          />
        )}
      </View>

      {/* MOBILE BOTTOM NAV - HIDDEN ON DESKTOP */}
      {!isDesktop && (
        <View style={styles.bottomNav}>
          <Ionicons name="grid" size={24} color="#0284c7" />
          <Ionicons name="list" size={24} color="#94a3b8" />
          <Ionicons name="person" size={24} color="#94a3b8" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, flexDirection: 'row', backgroundColor: "#f0f9ff" },
  
  // Blue Sidebar Styles
  sidebar: { backgroundColor: '#0284c7', padding: 20 },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, gap: 12 },
  logoBox: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 8, gap: 12 },
  sidebarItemActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  sidebarLabel: { color: '#bfdbfe', fontWeight: '600', fontSize: 16 },
  sidebarLabelActive: { color: '#fff' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  logoutText: { color: '#fecaca', fontWeight: '700' },

  // Content Styles
  contentContainer: { flex: 1, padding: 25 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#0c4a6e" },
  subTitle: { fontSize: 15, color: "#7dd3fc", fontWeight: "600" },
  refreshBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  
  listPaddingDesktop: { paddingBottom: 30 },
  listPaddingMobile: { paddingBottom: 100 },
  
  orderCard: { backgroundColor: "#fff", borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#bae6fd' },
  cardHeader: { backgroundColor: '#0c4a6e', padding: 18, flexDirection: 'row', justifyContent: 'space-between' },
  orderIdText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  dateText: { color: '#7dd3fc', fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, backgroundColor: '#fff' },
  statusText: { fontSize: 11, fontWeight: '800' },
  
  cardBody: { padding: 18 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { color: '#475569', fontSize: 13, fontWeight: '500' },
  itemsDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 12, borderRadius: 12, marginBottom: 8 },
  itemMainName: { fontSize: 14, fontWeight: '700', color: '#0c4a6e' },
  itemSubDetail: { fontSize: 12, color: '#64748b' },
  pickInput: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: '#bae6fd', borderRadius: 8, width: 55, height: 35, textAlign: 'center', fontWeight: '800', color: '#0284c7' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#059669' },
  actionBtn: { backgroundColor: '#0284c7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  centerLoader: { flex: 1, justifyContent: "center" }
});