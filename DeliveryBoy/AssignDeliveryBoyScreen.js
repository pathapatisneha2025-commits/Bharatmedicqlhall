import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const API_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AssignDeliveryBoyScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { orderId, type } = route.params;

  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 480;

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  const fetchDeliveryBoys = async () => {
    try {
      const res = await fetch(`${API_URL}/deliveryboy/available`);
      const data = await res.json();
      if (data.success) setDeliveryBoys(data.employees);
      else setDeliveryBoys([]);
    } catch (e) {
      console.log("ERROR:", e);
      setDeliveryBoys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const assignDeliveryBoy = async (id) => {
    try {
      let url = "";
      let body = { orderId, employee_id: id };

      if (type === "order") url = `${API_URL}/deliveryboy/assign-delivery`;
      else if (type === "salesorder") url = `${API_URL}/salesorders/assign-deliveryboy`;
      else return showAlert("Error", "Invalid order type!");

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showAlert("Success", `Delivery Boy assigned (${type})`);
        navigation.goBack();
      } else showAlert("Error", data.error || "Assignment failed");
    } catch (err) {
      console.log("ASSIGN ERROR:", err);
      showAlert("Error", "Something went wrong");
    }
  };

  const renderBoy = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        showAlert("Confirm Assignment", `Assign ${item.full_name} to Order #${orderId}?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: () => assignDeliveryBoy(item.id) },
        ])
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{item.full_name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={14} color="#64748B" />
              <Text style={styles.mobile}>{item.mobile}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusTag, item.available ? styles.tagSuccess : styles.tagWarning]}>
          <Text style={[styles.statusTagText, item.available ? styles.textSuccess : styles.textWarning]}>
            {item.available ? "Available" : "Busy"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Attendance</Text>
          <Text style={styles.detailValue}>{item.attendance_status || "N/A"}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Break Status</Text>
          <Text style={styles.detailValue}>{item.break_status || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.assignAction}>
        <Text style={styles.assignActionText}>Tap to assign order</Text>
        <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
      </View>
    </TouchableOpacity>
  );

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loaderText}>Syncing staff... {loadingCount}s</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerText}>Assign Agent</Text>
          <Text style={styles.headerSub}>Order ID: #{orderId}</Text>
        </View>
      </View>

      {deliveryBoys.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="person-off" size={64} color="#CBD5E1" />
          <Text style={styles.noData}>No delivery boys available right now</Text>
        </View>
      ) : (
        <FlatList
          data={deliveryBoys}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBoy}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#64748B", fontWeight: "500" },

  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { marginRight: 15, padding: 5 },
  headerText: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#4F46E5", fontWeight: "600", marginTop: 2 },

  scrollContent: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  noData: { marginTop: 15, color: "#94A3B8", fontSize: 16, textAlign: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  profileSection: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#4F46E5", fontSize: 18, fontWeight: "800" },
  name: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 },
  mobile: { fontSize: 13, color: "#64748B" },

  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagSuccess: { backgroundColor: "#DCFCE7" },
  tagWarning: { backgroundColor: "#FEF3C7" },
  statusTagText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  textSuccess: { color: "#166534" },
  textWarning: { color: "#92400E" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },

  detailsGrid: { flexDirection: "row", justifyContent: "space-between" },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", fontWeight: "700" },
  detailValue: { fontSize: 14, color: "#334155", fontWeight: "600", marginTop: 2 },

  assignAction: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignActionText: { fontSize: 12, color: "#4F46E5", fontWeight: "700" },
});