// screens/RequestFormAllScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const RequestFormAllScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editRequest, setEditRequest] = useState(null);

  // ADD EMAIL + COUNT HERE
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");   // ⭐ NEW
  const [department, setDepartment] = useState("");
  const [queryReason, setQueryReason] = useState("");
  const [count, setCount] = useState("");   // ⭐ NEW (for edit screen)

  // Fetch Requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/doctorrequest/all"
      );
      const data = await response.json();
      if (response.ok) setRequests(data);
      else Alert.alert("Error", "Failed to load requests");
    } catch (error) {
      console.log("❌ Fetch requests error:", error);
      Alert.alert("Error", "Unable to fetch requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const deleteRequest = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(
              `https://hospitaldatabasemanagement.onrender.com/doctorrequest/delete/${id}`,
              { method: "DELETE" }
            );
            const data = await response.json();
            if (response.ok) {
              Alert.alert("Success", "Request deleted successfully");
              fetchRequests();
            } else Alert.alert("Error", data.message || "Failed to delete request");
          } catch (error) {
            console.log("❌ Delete request error:", error);
            Alert.alert("Error", "Unable to delete request");
          }
        },
      },
    ]);
  };

  const openEditModal = (req) => {
    setEditRequest(req);
    setName(req.name);
    setEmail(req.email);              // ⭐ NEW
    setDepartment(req.department);
    setQueryReason(req.query_reason);
    setCount(req.count?.toString() || ""); // ⭐ NEW
    setModalVisible(true);
  };

  const updateRequest = async () => {
    if (!editRequest || !name || !email || !department || !queryReason) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    const payload = {
      name,
      email,                 // ⭐ NEW
      department,
      query_reason: queryReason,
      count: Number(count),   // ⭐ NEW
    };

    try {
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/doctorrequest/update/${editRequest.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Request updated successfully");
        setModalVisible(false);
        fetchRequests();
      } else Alert.alert("Error", data.message || "Failed to update request");
    } catch (error) {
      console.log("❌ Update request error:", error);
      Alert.alert("Error", "Unable to update request");
    }
  };

  // ⭐ STATUS + COUNT update API
  const handleStatusChange = async (id, newStatus) => {
    try {
      Alert.alert(
        "Confirm Status Change",
        `Are you sure you want to mark this request as "${newStatus}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              const statusValue =
                newStatus.toLowerCase() === "completed"
                  ? "complete"
                  : newStatus.toLowerCase();

              const selected = requests.find((r) => r.id === id);
              const countValue = Number(selected?.count) || 0;

              const payload = {
                id: Number(id),
                status: statusValue,
                count: countValue,
              };

              const response = await fetch(
                "https://hospitaldatabasemanagement.onrender.com/doctorrequest/status",
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }
              );

              const data = await response.json();
              if (response.ok) {
                Alert.alert("Success", "Status & count updated successfully");
                fetchRequests();
              } else Alert.alert("Error", data.message || "Failed to update");
            },
          },
        ]
      );
    } catch (error) {
      console.log("❌ Status update error:", error);
      Alert.alert("Error", "Unable to update status");
    }
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading Doctors...</Text>
      </View>
    );
  }
  // ---------------------------------------------------
  // ⭐ render card
  // ---------------------------------------------------
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={styles.icons}>
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <MaterialIcons name="edit" size={22} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteRequest(item.id)}
            style={{ marginLeft: 15 }}
          >
            <MaterialIcons name="delete" size={22} color="red" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ⭐ EMAIL */}
      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={18} color="#007bff" style={{ marginRight: 5 }} />
        <Text style={styles.description}>{item.email}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="business-outline" size={18} color="#007bff" style={{ marginRight: 5 }} />
        <Text style={styles.description}>{item.department}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="document-text-outline" size={18} color="#007bff" style={{ marginRight: 5 }} />
        <Text style={styles.description}>{item.query_reason}</Text>
      </View>

      {/* ⭐ SHOW COUNT */}
      <View style={styles.infoRow}>
        <Ionicons name="calculator-outline" size={18} color="#007bff" style={{ marginRight: 5 }} />
        <Text style={styles.description}>Count: {item.count || 0}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="information-circle-outline" size={18} color="#007bff" style={{ marginRight: 5 }} />
        <Text style={styles.description}>Status: {item.status}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={18} color="#007bff" style={{ marginRight: 5 }} />
        <Text style={styles.description}>
          Created: {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

    {/* ⭐ COUNT INPUT FIELD */}
<View style={styles.inputWrapper}>
  <Ionicons
    name="calculator-outline"
    size={20}
    color="#007bff"
    style={styles.icon}
  />

  <TextInput
    style={styles.inputWithIcon}
    placeholder="Enter Count"
    value={item.count || ""}     // always empty unless user types
    keyboardType="numeric"
    onChangeText={(text) => {
      const updated = requests.map((req) =>
        req.id === item.id ? { ...req, count: text } : req
      );
      setRequests(updated);
    }}
  />
</View>


      {/* BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#ff4d4d" }]}
          onPress={() => handleStatusChange(item.id, "Cancelled")}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#ffcc00" }]}
          onPress={() => handleStatusChange(item.id, "Pending")}
        >
          <Text style={styles.buttonText}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
          onPress={() => handleStatusChange(item.id, "Completed")}
        >
          <Text style={styles.buttonText}>Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ----------------------------
  // MAIN SCREEN
  // ----------------------------
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Requests</Text>

        <TouchableOpacity
          style={{ marginLeft: "auto" }}
          onPress={() => navigation.navigate("DoctorRequestForm")}
        >
          <Ionicons name="add-circle-outline" size={28} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Request</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#007bff" style={styles.icon} />
            <TextInput
              style={styles.inputWithIcon}
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
            />
          </View>

          {/* ⭐ EMAIL FIELD */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#007bff" style={styles.icon} />
            <TextInput
              style={styles.inputWithIcon}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialIcons name="apartment" size={20} color="#007bff" style={styles.icon} />
            <TextInput
              style={styles.inputWithIcon}
              value={department}
              onChangeText={setDepartment}
              placeholder="Enter department"
            />
          </View>

          <View style={[styles.inputWrapper, { height: 120 }]}>
            <TextInput
              style={[styles.inputWithIcon, { height: 120, textAlignVertical: "top" }]}
              value={queryReason}
              onChangeText={setQueryReason}
              placeholder="Enter reason"
              multiline
            />
          </View>

          {/* ⭐ EDIT COUNT */}
          <View style={styles.inputWrapper}>
            <Ionicons name="calculator-outline" size={20} color="#007bff" style={styles.icon} />
            <TextInput
              style={styles.inputWithIcon}
              value={count}
              onChangeText={setCount}
              keyboardType="numeric"
              placeholder="Enter count"
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={updateRequest}>
            <Text style={styles.submitText}>Update Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: "gray", marginTop: 10 }]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.submitText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};

export default RequestFormAllScreen;

// ----------------------------
// STYLES
// ----------------------------
const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 30, backgroundColor: "#f9f9f9" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 6,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "bold", marginBottom: 4 },
  icons: { flexDirection: "row" },
  description: { color: "#555" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },

  modalContainer: { padding: 20, paddingBottom: 50 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    elevation: 1,
  },
  icon: { marginRight: 10 },
  inputWithIcon: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },

  submitButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold" },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
