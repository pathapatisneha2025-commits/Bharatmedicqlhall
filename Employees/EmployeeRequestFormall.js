import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  useWindowDimensions,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";

export default function EmployeeRequestListScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  const [employeeId, setEmployeeId] = useState(null);

  // Edit modal states
  const [editModal, setEditModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editReason, setEditReason] = useState("");

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 768;
  const MAX_CONTENT_WIDTH = 1000;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    setLoading(true);
    setLoadingCount(0);
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setLoadingCount(count);
    }, 500);

    const init = async () => {
      try {
        const id = await getEmployeeId();
        if (!id) {
          showAlert("Error", "Employee ID not found");
          setLoading(false);
          clearInterval(interval);
          return;
        }
        setEmployeeId(id);
        await fetchRequests(id);
      } catch (e) {
        showAlert("Error", "Something went wrong");
      } finally {
        setLoading(false);
        clearInterval(interval);
      }
    };
    init();
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async (id) => {
    try {
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/doctorrequest/employee/${id}`
      );
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        showAlert("Error", data.message || "Failed to load");
      }
    } catch (error) {
      showAlert("Error", "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async () => {
    if (!editName || !editEmail || !editDept || !editReason) {
      showAlert("Error", "All fields required");
      return;
    }
    try {
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/doctorrequest/update/${selectedReq.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            email: editEmail,
            department: editDept,
            query_reason: editReason,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showAlert("Success", "Updated");
        setEditModal(false);
        fetchRequests(employeeId);
      } else Alert.alert("Error", data.message || "Update failed");
    } catch (error) {
      showAlert("Error", "Failed to update");
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return { bg: "#E7F9ED", text: "#28A745", icon: "checkmark-circle" };
      case "pending":
        return { bg: "#FFF4E5", text: "#FF9800", icon: "time" };
      default:
        return { bg: "#FEECEB", text: "#DC3545", icon: "close-circle" };
    }
  };

  const renderItem = ({ item }) => {
    const status = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#E8F1FF" }]}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={22}
                color="#0D6EFD"
              />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{item.department}</Text>
              <Text style={styles.cardSub}>ID: #{item.id}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.text} />
            <Text style={[styles.statusLabel, { color: status.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.bodyLabel}>Requested Items:</Text>
          {item.items.map((i, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>{i.name || "General Item"}</Text>
              <Text style={styles.itemQty}>Qty: {i.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            <Ionicons name="calendar-outline" size={12} />{" "}
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedReq(item);
              setEditName(item.name);
              setEditEmail(item.email);
              setEditDept(item.department);
              setEditReason(item.query_reason);
              setEditModal(true);
            }}
            style={styles.detailBtn}
          >
            <Text style={styles.detailBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingCount}>{loadingCount}%</Text>
      <ActivityIndicator size="large" color="#0D6EFD" />
      <Text style={styles.loadingText}>Fetching your requests...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {Platform.OS !== "web" && (
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      )}

      <View style={styles.topNav}>
        <View>
          <Text style={styles.pageTitle}>My Requests</Text>
          <Text style={styles.pageSubtitle}>
            Track your department requisitions
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.contentWrapper,
          { width: isDesktop ? MAX_CONTENT_WIDTH : "100%" },
        ]}
      >
        {loading ? (
          renderLoading()
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#DDE0E3" />
            <Text style={styles.noData}>No requests found for your ID.</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={requests}
              keyExtractor={(item, idx) =>
                item.id ? item.id.toString() : idx.toString()
              }
              renderItem={renderItem}
              contentContainerStyle={styles.listPadding}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>

      {/* Edit/View Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { width: isDesktop ? 500 : "90%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Requester Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={editEmail}
                  onChangeText={setEditEmail}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason / Query</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                  multiline
                  value={editReason}
                  onChangeText={setEditReason}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.closeBtn, { marginRight: 10 }]}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={updateRequest}>
                <Text style={styles.saveText}>Update Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  topNav: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A", textAlign: "right" },
  pageSubtitle: { fontSize: 13, color: "#666", textAlign: "right" },
  backBtn: { padding: 8, borderRadius: 10, backgroundColor: "#F0F0F0" },

  contentWrapper: { alignSelf: "center", flex: 1 },
  listPadding: { padding: 16, paddingBottom: 100 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEF0F2",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  cardSub: { fontSize: 12, color: "#999", marginTop: 2 },

  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusLabel: { fontSize: 12, fontWeight: "700", marginLeft: 4, textTransform: "uppercase" },

  cardBody: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 15 },
  bodyLabel: { fontSize: 12, fontWeight: "600", color: "#888", marginBottom: 8 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  itemName: { fontSize: 14, color: "#444", fontWeight: "500" },
  itemQty: { fontSize: 14, color: "#0D6EFD", fontWeight: "700" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F3F5",
  },
  dateText: { fontSize: 12, color: "#999" },
  detailBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  detailBtnText: { color: "#0D6EFD", fontWeight: "700", fontSize: 13 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingCount: { fontSize: 42, fontWeight: "800", color: "#0D6EFD", marginBottom: 10 },
  loadingText: { fontSize: 14, color: "#666" },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  noData: { marginTop: 15, fontSize: 15, color: "#999" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", padding: 24, borderRadius: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: "600", color: "#999", marginBottom: 6, textTransform: "uppercase" },
  input: { backgroundColor: "#F9FAFB", padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: "#EEF0F2" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  closeBtn: { padding: 14 },
  closeBtnText: { color: "#666", fontWeight: "600" },
  saveBtn: { backgroundColor: "#0D6EFD", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  saveText: { color: "#fff", fontWeight: "700" },
});
