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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";

export default function EmployeeRequestListScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);

  // Edit modal states
  const [editModal, setEditModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editReason, setEditReason] = useState("");

  useEffect(() => {
    (async () => {
      const id = await getEmployeeId();
      if (id) {
        setEmployeeId(id);
        fetchRequests(id);
      } else {
        Alert.alert("Error", "Employee ID not found");
      }
    })();
  }, []);

  const fetchRequests = async (id) => {
    try {
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/doctorrequest/employee/${id}`
      );
      const data = await response.json();

      if (response.ok) setRequests(data);
      else Alert.alert("Error", data.message || "Failed to load");
    } catch (error) {
      Alert.alert("Error", "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = (id) => {
    Alert.alert("Confirm Delete", "Delete this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `https://hospitaldatabasemanagement.onrender.com/doctorrequest/delete/${id}`,
              { method: "DELETE" }
            );
            const data = await res.json();

            if (res.ok) {
              Alert.alert("Success", "Request deleted");
              fetchRequests(employeeId);
            } else Alert.alert("Error", data.message || "Delete failed");
          } catch (error) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  const openEditModal = (item) => {
    setSelectedReq(item);
    setEditName(item.name);
    setEditEmail(item.email);
    setEditDept(item.department);
    setEditReason(item.query_reason);
    setEditModal(true);
  };

  const updateRequest = async () => {
    if (!editName || !editEmail || !editDept || !editReason) {
      Alert.alert("Error", "All fields required");
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
        Alert.alert("Success", "Updated");
        setEditModal(false);
        fetchRequests(employeeId);
      } else Alert.alert("Error", data.message || "Update failed");
    } catch (error) {
      Alert.alert("Error", "Failed to update");
    }
  };
  if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="person-outline" size={22} color="#1565C0" />
        <Text style={styles.nameText}>{item.name}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="mail-outline" size={20} color="#555" />
        <Text style={styles.subText}>{item.email}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="business-outline" size={20} color="#222" />
        <Text style={styles.department}>{item.department}</Text>
      </View>

      <View style={[styles.row, { marginTop: 10 }]}>
        <Ionicons name="document-text-outline" size={20} color="#444" />
        <Text style={styles.reason}>{item.query_reason}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Ionicons
          name={
            item.status === "pending"
              ? "time-outline"
              : item.status === "complete"
              ? "checkmark-circle-outline"
              : "close-circle-outline"
          }
          size={18}
          color={
            item.status === "pending"
              ? "orange"
              : item.status === "complete"
              ? "green"
              : "red"
          }
        />
        <Text
          style={[
            styles.statusText,
            item.status === "pending"
              ? { color: "orange" }
              : item.status === "complete"
              ? { color: "green" }
              : { color: "red" },
          ]}
        >
          {item.status}
        </Text>
      </View>

      {/* NEW BUTTON UI */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteRequest(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
      ) : requests.length === 0 ? (
        <Text style={styles.noData}>No requests found.</Text>
      ) : (
      <FlatList
  data={requests}
  keyExtractor={(item) => item.id.toString()}
  renderItem={renderItem}
  contentContainerStyle={{ 
    padding: 15,
    paddingBottom: 80,   // ⬅️ Increase scroll length here
  }}
/>

      )}

      {/* EDIT MODAL */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Request</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={26} color="#555" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editEmail}
              onChangeText={setEditEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Department"
              value={editDept}
              onChangeText={setEditDept}
            />

            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Query Reason"
              multiline
              value={editReason}
              onChangeText={setEditReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={updateRequest}>
                <Text style={styles.saveText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =======================
      STYLES
========================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8FB" ,     marginTop:20,},

  header: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 10,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 15,
    marginBottom: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  nameText: { fontSize: 18, fontWeight: "700", color: "#1565C0" },
  subText: { fontSize: 14, color: "#444" },
  department: { fontSize: 15, color: "#222", fontWeight: "600" },
  reason: { fontSize: 15, color: "#444", flexShrink: 1 },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginTop: 12,
    alignSelf: "flex-start",
    gap: 6,
  },
  statusText: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },

  /* NEW BUTTON UI */
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1565C0",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    elevation: 2,
    gap: 6,
  },
  editText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    elevation: 2,
    gap: 6,
  },
  deleteText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  noData: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 17,
    color: "#777",
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "92%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1565C0" },

  input: {
    backgroundColor: "#f1f3f4",
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    marginTop: 10,
    elevation: 1,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
    gap: 10,
  },

  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
  },
  cancelText: { fontSize: 15, color: "#333", fontWeight: "600" },

  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#1565C0",
    borderRadius: 10,
  },
  saveText: { fontSize: 15, color: "#fff", fontWeight: "700" },
});
