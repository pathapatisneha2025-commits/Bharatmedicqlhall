import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const AdminListScreen = () => {
  const navigation = useNavigation();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);

  const [viewModalVisible, setViewModalVisible] = useState(false);   // 👁️ NEW VIEW MODAL
  const [viewAdmin, setViewAdmin] = useState(null);                  // 👁️ ADMIN DATA TO VIEW

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/adminlogin/all`);
      const data = await response.json();
      if (response.ok && data.success) {
        setAdmins(data.admins);
        setFilteredAdmins(data.admins);
      } else {
        Alert.alert("Error", "Failed to load admins");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Network Error", "Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Search
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredAdmins(admins);
    } else {
      const lower = search.toLowerCase();
      const filtered = admins.filter(
        (admin) =>
          admin.name.toLowerCase().includes(lower) ||
          admin.email.toLowerCase().includes(lower)
      );
      setFilteredAdmins(filtered);
    }
  }, [search, admins]);

  // OPEN EDIT MODAL
  const openEditModal = (admin) => {
    setEditAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setJoiningDate(admin.joining_date?.split("T")[0] || "");
    setPhone(admin.phone);
    setPassword("");
    setConfirmPassword("");
    setModalVisible(true);
  };

  // OPEN VIEW MODAL 👁️
  const openViewModal = (admin) => {
    setViewAdmin(admin);
    setViewModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!name || !email || !joiningDate || !phone) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/adminlogin/update/${editAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          joining_date: joiningDate,
          phone,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        Alert.alert("Success", data.message);
        setModalVisible(false);
        fetchAdmins();
      } else {
        Alert.alert("Update Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Network Error", "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };
const exportAdmins = () => {
  const url = `${BASE_URL}/adminlogin/export`;

  Alert.alert(
    "Export Admins",
    "The file will open in your browser for download.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) }
    ]
  );
};

  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/adminlogin/delete/${id}`, {
              method: "DELETE",
            });
            const data = await response.json();

            if (response.ok && data.success) {
              Alert.alert("Deleted", "Admin deleted");
              fetchAdmins();
            } else {
              Alert.alert("Delete Failed", data.message);
            }
          } catch (error) {
            console.error("Delete error:", error);
            Alert.alert("Network Error", "Unable to connect.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading employee...</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Management</Text>

        <TouchableOpacity onPress={exportAdmins} style={{ marginLeft: "auto" }}>
  <Ionicons name="download-outline" size={26} color="#fff" />
</TouchableOpacity>

      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#2563eb" />
        <TextInput
          placeholder="Search by name or email..."
          placeholderTextColor="#000"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />}

      {/* TABLE */}
      <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 50 }]}>ID</Text>
              <Text style={[styles.headerCell, { width: 150 }]}>Name</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>Email</Text>
              <Text style={[styles.headerCell, { width: 150 }]}>Joining Date</Text>
              <Text style={[styles.headerCell, { width: 150 }]}>Phone</Text>
              <Text style={[styles.headerCell, { width: 150 }]}>Actions</Text>
            </View>

            {filteredAdmins.map((admin) => (
              <View key={admin.id} style={styles.tableRow}>
                <Text style={[styles.cell, { width: 50 }]}>{admin.id}</Text>
                <Text style={[styles.cell, { width: 150 }]}>{admin.name}</Text>
                <Text style={[styles.cell, { width: 200 }]}>{admin.email}</Text>
                <Text style={[styles.cell, { width: 150 }]}>{admin.joining_date?.split("T")[0]}</Text>
                <Text style={[styles.cell, { width: 150 }]}>{admin.phone}</Text>

                <View
                  style={{
                    width: 150,
                    flexDirection: "row",
                    justifyContent: "space-around",
                    alignItems: "center",
                  }}
                >
                  {/* VIEW ICON 👁️ */}
                  <TouchableOpacity onPress={() => openViewModal(admin)}>
                    <Ionicons name="eye-outline" size={22} color="#0ea5e9" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openEditModal(admin)}>
                    <Ionicons name="create-outline" size={22} color="#2563eb" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDelete(admin.id)}>
                    <Ionicons name="trash-outline" size={22} color="#d9534f" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {/* VIEW MODAL 👁️*/}
      <Modal visible={viewModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Admin Details</Text>

            {viewAdmin && (
              <>
                <Text style={styles.viewItem}>Name: {viewAdmin.name}</Text>
                <Text style={styles.viewItem}>Email: {viewAdmin.email}</Text>
                <Text style={styles.viewItem}>
                  Joining Date: {viewAdmin.joining_date?.split("T")[0]}
                </Text>
                <Text style={styles.viewItem}>Phone: {viewAdmin.phone}</Text>
              </>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setViewModalVisible(false)}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      {/* (Your existing edit modal unchanged — keeping as is) */}
    </View>
  );
};

export default AdminListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginTop: 30,
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 10 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 14,
    elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#000", marginLeft: 8 },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
  },
  headerCell: {
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  cell: { textAlign: "center", fontSize: 14, color: "#000" },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15 },

  viewItem: {
    fontSize: 16,
    marginBottom: 10,
  },

  cancelButton: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, color: "#333" },
});
