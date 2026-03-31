import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  useWindowDimensions,
  Platform,
    FlatList,   // 👈 REQUIRED

} from "react-native";
import { Feather } from "@expo/vector-icons";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AddressChangeRequests({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
   const [loadingCount, setLoadingCount] = useState(0);
  
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const MAX_TABLE_WIDTH = 800; // wider for desktop
  const containerWidth = SCREEN_WIDTH > MAX_TABLE_WIDTH ? MAX_TABLE_WIDTH : SCREEN_WIDTH - 20;

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

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${BASE_URL}/salesorders/delivery/address-change/all`);
      const data = await response.json();
      if (response.ok && data.requests) setRequests(data.requests);
      else showAlert("Error", "Failed to load requests.");
    } catch (error) {
      console.log("Fetch Error:", error);
      showAlert("Error", "Server error.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    showAlert(
      "Confirm",
      `Are you sure you want to ${status} this request?`,
      [
        { text: "Cancel" },
        {
          text: status === "approved" ? "Approve" : "Reject",
          onPress: async () => {
            try {
              const res = await fetch(
                `${BASE_URL}/salesorders/delivery/address-change/update/${id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status }),
                }
              );
              const data = await res.json();
              if (res.ok) {
                showAlert(
                  "Success",
                  status === "approved"
                    ? "Address updated successfully."
                    : "Request rejected successfully."
                );
                setSelected(null);
                fetchRequests();
              } else showAlert("Error", data.error || "Status update failed.");
            } catch (err) {
              console.log(err);
              showAlert("Error", "Server error.");
            }
          },
        },
      ]
    );
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading{loadingCount}s</Text>
      </View>
    );

 return (
    <View style={styles.webWrapper}>
    

      {/* MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
      <View style={styles.contentHeader}>
  <View style={styles.headerRow}>
    <TouchableOpacity
      onPress={() => navigation?.goBack()}
      style={styles.backBtn}
      activeOpacity={0.7}
    >
      <Feather name="arrow-left" size={22} color="#1e293b" />
    </TouchableOpacity>

    <View>
      <Text style={styles.mainTitle}>Address Change Requests</Text>
      <Text style={styles.subTitle}>
        Review and approve delivery address updates
      </Text>
    </View>
  </View>
</View>


        {/* TABLE CARD */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.hCell, { width: 80 }]}>Order ID</Text>
                <Text style={[styles.hCell, { width: 180 }]}>Requested By</Text>
                <Text style={[styles.hCell, { width: 220 }]}>Old Address</Text>
                <Text style={[styles.hCell, { width: 220 }]}>New Address</Text>
                <Text style={[styles.hCell, { width: 120 }]}>Pincode</Text>
                <Text style={[styles.hCell, { width: 120, textAlign: "center" }]}>Actions</Text>
              </View>

              <FlatList
                data={requests}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.tableRow,
                      index % 2 === 0 && { backgroundColor: "#fcfcfc" },
                    ]}
                  >
                    <Text style={[styles.rCell, { width: 80 }]}>#{item.order_id}</Text>
                    <Text style={[styles.rCell, { width: 180, fontWeight: "600" }]}>
                      {item.delivery_boy_name}
                    </Text>
                    <Text style={[styles.rCell, { width: 220 }]} numberOfLines={1}>
                      {item.old_address}
                    </Text>
                    <Text style={[styles.rCell, { width: 220 }]} numberOfLines={1}>
                      {item.new_address}
                    </Text>
                    <Text style={[styles.rCell, { width: 120 }]}>
                      {item.new_pincode || "N/A"}
                    </Text>

                    <View style={[styles.actionCell, { width: 120 }]}>
                      <TouchableOpacity
                        style={styles.actionIconView}
                        onPress={() => setSelected(item)}
                      >
                        <Feather name="eye" size={16} color="#2563eb" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconApprove}
                        onPress={() => updateStatus(item.id, "approved")}
                      >
                        <Feather name="check" size={16} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconReject}
                        onPress={() => updateStatus(item.id, "rejected")}
                      >
                        <Feather name="x" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* DETAIL MODAL */}
      <Modal visible={!!selected} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView style={styles.modalBody}>
                <DetailRow label="Order ID" value={`#${selected.order_id}`} />
                <DetailRow label="Requested By" value={selected.delivery_boy_name} />
                <DetailRow label="Old Address" value={selected.old_address} />
                <DetailRow label="New Address" value={selected.new_address} />
                <DetailRow label="Landmark" value={selected.new_landmark || "N/A"} />
                <DetailRow label="Pincode" value={selected.new_pincode || "N/A"} />
                <DetailRow label="Reason" value={selected.reason || "No reason provided"} />

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.modalApproveBtn}
                    onPress={() => updateStatus(selected.id, "approved")}
                  >
                    <Text style={styles.btnText}>Approve Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalRejectBtn}
                    onPress={() => updateStatus(selected.id, "rejected")}
                  >
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  webWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},

backBtn: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: "#f1f5f9",
  justifyContent: "center",
  alignItems: "center",
},

  sidebar: { width: 260, backgroundColor: "#fff", borderRightWidth: 1, borderRightColor: "#e2e8f0", padding: 24 },
  sidebarBrand: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: "#2563EB", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  brandLetter: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  brandSub: { fontSize: 12, color: "#64748b", marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: "#2563EB" },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: "#64748b", fontWeight: "600" },
  sidebarLabelActive: { color: "#fff" },
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 12, marginTop: 20 },
  logoutText: { marginLeft: 12, color: "#ef4444", fontWeight: "700" },

  mainContent: { flex: 1, padding: 32 },
  contentHeader: { marginBottom: 24 },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4 },

  tableCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden", flex: 1 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  hCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  rCell: { fontSize: 14, color: "#334155" },

  actionCell: { flexDirection: "row", justifyContent: "center", gap: 8 },
  actionIconView: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },
  actionIconApprove: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#ecfdf5", justifyContent: "center", alignItems: "center" },
  actionIconReject: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#fef2f2", justifyContent: "center", alignItems: "center" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: 500, borderRadius: 16, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  modalBody: { maxHeight: 400 },
  detailRow: { marginBottom: 16 },
  detailLabel: { color: "#64748b", fontWeight: "600", fontSize: 13, marginBottom: 4 },
  detailValue: { color: "#1e293b", fontWeight: "600", fontSize: 15 },
  modalActionRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalApproveBtn: { flex: 2, backgroundColor: "#10b981", padding: 14, borderRadius: 10, alignItems: "center" },
  modalRejectBtn: { flex: 1, backgroundColor: "#ef4444", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
});