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
    useWindowDimensions,
  Platform,

} from "react-native";
import { Ionicons,Feather  } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const AdminListScreen = () => {
  const navigation = useNavigation();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
      const [loadingCount, setLoadingCount] = useState(0);

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
 const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 1000;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
    const isWeb = Platform.OS === "web";
  
  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== "cancel");
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
        showAlert("Error", "Failed to load admins");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showAlert("Network Error", "Could not connect to server");
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
      showAlert("Validation Error", "All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
     showAlert("Error", "Passwords do not match.");
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
        showAlert("Success", data.message);
        setModalVisible(false);
        fetchAdmins();
      } else {
        showAlert("Update Failed", data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Update error:", error);
      showAlert("Network Error", "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };
const exportAdmins = () => {
  const url = `${BASE_URL}/adminlogin/export`;

  if (Platform.OS === "web") {
    // On web, open in new tab
    window.open(url, "_blank");
  } else {
    // On mobile, use Linking
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
        else showAlert("Error", "Cannot open URL");
      })
      .catch((err) => showAlert("Error", err.message));
  }
};


  const handleDelete = async (id) => {
    showAlert("Confirm Delete", "Are you sure?", [
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
              showAlert("Deleted", "Admin deleted");
              fetchAdmins();
            } else {
              showAlert("Delete Failed", data.message);
            }
          } catch (error) {
            console.error("Delete error:", error);
            showAlert("Network Error", "Unable to connect.");
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
        <Text style={{ marginTop: 10 }}>Loading Admins{loadingCount}s</Text>
      </View>
    );
  }
 return (
    <View style={styles.webWrapper}>
  
      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        <View style={styles.contentHeader}>
<View style={styles.contentHeader}>
  {/* LEFT: Back + Title */}
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={22} color="#1e293b" />
    </TouchableOpacity>

    <View>
      <Text style={styles.mainTitle}>Admin Management</Text>
      <Text style={styles.subTitle}>
        Full control over administrative access and logs
      </Text>
    </View>
  </View>

  {/* RIGHT: Actions */}
 
</View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={exportAdmins} style={styles.exportBtn}>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.exportBtnText}>Export Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.cardTop}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInputWeb}
                placeholder="Search by name or email..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loaderText}>Loading Data ({loadingCount}s)...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.headerCell, { width: 60 }]}>ID</Text>
                  <Text style={[styles.headerCell, { width: 180 }]}>Name</Text>
                  <Text style={[styles.headerCell, { width: 220 }]}>Email</Text>
                  <Text style={[styles.headerCell, { width: 150 }]}>Joining Date</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Phone</Text>
                  <Text style={[styles.headerCell, { width: 180, textAlign: "center" }]}>Actions</Text>
                </View>

                <ScrollView>
                  {filteredAdmins.length === 0 ? (
                    <Text style={styles.emptyText}>No admins found.</Text>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <View key={admin.id} style={styles.tableBodyRow}>
                        <Text style={[styles.bodyCell, { width: 60 }]}>#{admin.id}</Text>
                        <Text style={[styles.bodyCell, { width: 180, fontWeight: "600" }]}>{admin.name}</Text>
                        <Text style={[styles.bodyCell, { width: 220 }]} numberOfLines={1}>{admin.email}</Text>
                        <Text style={[styles.bodyCell, { width: 150 }]}>{admin.joining_date?.split("T")[0]}</Text>
                        <Text style={[styles.bodyCell, { width: 140 }]}>{admin.phone}</Text>
                        <View style={[styles.actionCellWeb, { width: 180 }]}>
                          <TouchableOpacity style={styles.iconCircle} onPress={() => openViewModal(admin)}>
                            <Feather name="eye" size={16} color="#0ea5e9" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]} onPress={() => openEditModal(admin)}>
                            <Feather name="edit-2" size={16} color="#2563eb" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]} onPress={() => handleDelete(admin.id)}>
                            <Feather name="trash-2" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* VIEW MODAL */}
      <Modal visible={viewModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: containerWidth }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="information-circle-outline" size={28} color="#2563eb" />
              <Text style={styles.modalTitle}>Admin Details</Text>
            </View>
            {viewAdmin && (
              <View style={styles.viewContainer}>
                <Text style={styles.viewLabel}>Name</Text>
                <Text style={styles.viewValue}>{viewAdmin.name}</Text>
                <Text style={styles.viewLabel}>Email</Text>
                <Text style={styles.viewValue}>{viewAdmin.email}</Text>
                <Text style={styles.viewLabel}>Joining Date</Text>
                <Text style={styles.viewValue}>{viewAdmin.joining_date?.split("T")[0]}</Text>
                <Text style={styles.viewLabel}>Phone</Text>
                <Text style={styles.viewValue}>{viewAdmin.phone}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setViewModalVisible(false)}>
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: containerWidth }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="person-circle-outline" size={28} color="#2563eb" />
              <Text style={styles.modalTitle}>Edit Admin</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="mail-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Joining Date" value={joiningDate} onChangeText={setJoiningDate} />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#2563eb" />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelModalBtn, { flex: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  webWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },

  // Sidebar Styles
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
  logoutBtn: { flexDirection: "row", alignItems: "center", padding: 12 },
  logoutText: { marginLeft: 12, color: "#ef4444", fontWeight: "700" },

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  contentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4 },
  exportBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  exportBtnText: { color: "#fff", fontWeight: "600", marginLeft: 8 },

  // Table Card
  tableCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", elevation: 2, flex: 1 },
  cardTop: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 16, width: 350,outlineStyle: "none" },
  searchInputWeb: { paddingVertical: 10, marginLeft: 10, flex: 1, fontSize: 14 ,outlineStyle: "none"},
  table: { padding: 0 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableBodyRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  bodyCell: { fontSize: 14, color: "#334155" },
  actionCellWeb: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0f9ff", justifyContent: "center", alignItems: "center" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", width: "90%", borderRadius: 16, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10, color: "#1e293b" },
  viewContainer: { marginBottom: 20 },
  viewLabel: { fontSize: 12, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  viewValue: { fontSize: 16, color: "#1e293b", marginBottom: 12 },
  inputGroup: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  input: { flex: 1, height: 45, marginLeft: 10 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  saveBtn: { flex: 1, backgroundColor: "#2563eb", padding: 12, borderRadius: 8, alignItems: "center" },
  cancelModalBtn: { backgroundColor: "#ef4444", padding: 12, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 12, color: "#64748b" },
  emptyText: { textAlign: "center", padding: 40, color: "#94a3b8" },
  backBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#f1f5f9",
  justifyContent: "center",
  alignItems: "center",
},

});

export default AdminListScreen;