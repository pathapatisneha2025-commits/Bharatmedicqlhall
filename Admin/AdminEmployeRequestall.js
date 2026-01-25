import React, { useEffect, useState } from "react"; 
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminRequestFormall() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ============================
       FETCH ALL REQUESTS
  ============================ */
  const loadRequests = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctorrequest/allrequest`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      Alert.alert("Error", "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  /* ============================
       APPROVE / REJECT HANDLER
  ============================ */
  const updateRequestStatus = async (id, status) => {
    try {
      const res = await fetch(
        `${BASE_URL}/doctorrequest/update-request/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (res.ok) {
        Alert.alert("Success", `Request ${status}`);
        loadRequests();
      } else {
        const data = await res.json();
        Alert.alert("Error", data.message || "Failed to update request");
      }
    } catch (error) {
      console.error("Error updating request:", error);
      Alert.alert("Error", "Server error");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ============================
       TABLE ROW
  ============================ */
  const renderRow = (item) => (
    <View style={styles.row} key={item.id}>
      <Text style={[styles.cell, { flex: 0.5 }]}>{item.id}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.employee_id}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.department}</Text>
      <Text style={[styles.cell, { flex: 2 }]} numberOfLines={2} ellipsizeMode="tail">
        {item.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
      </Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.status}</Text>
      <View style={[styles.cell, { flex: 2, flexDirection: "row", flexWrap: "wrap" }]}>
        {item.status === "pending" ? (
          <>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#10B981" }]}
              onPress={() => updateRequestStatus(item.id, "approved")}
            >
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#EF4444" }]}
              onPress={() => updateRequestStatus(item.id, "rejected")}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ fontWeight: "bold" }}>{item.status}</Text>
        )}
      </View>
    </View>
  );

  return (
  <ScrollView contentContainerStyle={{ padding: 10, alignItems: "center" }}>
      <ScrollView horizontal>
        <View style={[styles.container]}>
          {/* TABLE HEADER */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, { flex: 0.5 }]}>ID</Text>
            <Text style={[styles.cell, { flex: 1 }]}>Employee ID</Text>
            <Text style={[styles.cell, { flex: 1 }]}>Department</Text>
            <Text style={[styles.cell, { flex: 2 }]}>Items</Text>
            <Text style={[styles.cell, { flex: 1 }]}>Status</Text>
            <Text style={[styles.cell, { flex: 2 }]}>Action</Text>
          </View>

          {/* TABLE ROWS */}
          {requests.map((item) => renderRow(item))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

/* ============================
       STYLES
============================ */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F4F8FB",
    minWidth: 600, // ensures table looks good on wider screens
    marginTop:30,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 8,
    alignItems: "center",
  },
  headerRow: {
    backgroundColor: "#2563EB",
  },
  cell: {
    paddingHorizontal: 6,
    fontSize: 14,
    color: "#000",
    flexWrap: "wrap",
  },
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});
