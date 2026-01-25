import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function AdminHandoverScreen() {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    try {
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/deliveryboy/handover/all"
      );
      const data = await res.json();

      const formatted = (data.handovers || []).map((h) => ({
        id: h.id,
        deliveryboy: h.deliveryboy_id,
        date: h.date,
        total_cash: Number(h.total_cash),
        total_digital: Number(h.total_digital),
        total: Number(h.total_cash) + Number(h.total_digital),
        cash_returned: Number(h.cash_returned),
        created_at: h.created_at,
      }));

      setHandovers(formatted);
    } catch (err) {
      console.error("Handover fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onView = (handover) => {
    Alert.alert(
      "Handover Details",
      `Delivery Boy: ${handover.deliveryboy}\nCash: ₹${handover.total_cash}\nDigital: ₹${handover.total_digital}\nReturned: ₹${handover.cash_returned}`
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ color: "#2563eb", marginTop: 8 }}>
          Loading handovers...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>All Cash Handovers</Text>

      <ScrollView horizontal>
        <View>
          {/* Header */}
          <View style={[styles.row, styles.header]}>
            {[
              "ID",
              "DB ID",
              "Date",
              "Cash",
              "Digital",
              "Total",
              "Returned",
              "Time",
              "Action",
            ].map((h) => (
              <Text key={h} style={[styles.cell, styles.headerText]}>
                {h}
              </Text>
            ))}
          </View>

          {/* Rows */}
          <ScrollView>
            {handovers.map((h) => (
              <View key={h.id} style={styles.row}>
                <Text style={styles.cell}>{h.id}</Text>
                <Text style={styles.cell}>{h.deliveryboy}</Text>
                <Text style={styles.cell}>
                  {new Date(h.date).toISOString().split("T")[0]}
                </Text>
                <Text style={styles.cell}>₹{h.total_cash}</Text>
                <Text style={styles.cell}>₹{h.total_digital}</Text>
                <Text style={[styles.cell, styles.bold]}>
                  ₹{h.total}
                </Text>
                <Text style={styles.cell}>₹{h.cash_returned}</Text>
                <Text style={styles.cell}>
                  {new Date(h.created_at).toLocaleTimeString()}
                </Text>

                {/* View Action */}
                <View style={styles.cell}>
                <TouchableOpacity
  style={styles.iconBtn}
  onPress={() => onView(h)}
>
  <Ionicons name="eye" size={18} color="#ffffff" />
</TouchableOpacity>

                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =======================
   STYLES (BLUE THEME)
======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff6ff",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e40af",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#2563eb",
  },
  cell: {
    width: 120,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#1e3a8a",
    justifyContent: "center",
  },
  headerText: {
    fontWeight: "700",
    color: "#ffffff",
  },
  bold: {
    fontWeight: "700",
  },
  iconBtn: {
  backgroundColor: "#2563eb",
  padding: 8,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
},

  viewBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  viewText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
