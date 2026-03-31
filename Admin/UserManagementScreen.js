// YOUR COMPLETE UPDATED CODE WITH VIEW MODAL
import React, { useEffect, useState, useCallback } from "react"; 
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  RefreshControl,
  TextInput,
  Modal,
    Linking,   // <-- ADD THIS
     Platform,
  useWindowDimensions,

} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function UserEmployeeListScreen() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
   const [loadingCount, setLoadingCount] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const navigation = useNavigation();
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
const MODAL_MAX_WIDTH = 400; // max width for modal
const modalWidth = SCREEN_WIDTH > MODAL_MAX_WIDTH ? MODAL_MAX_WIDTH : SCREEN_WIDTH * 0.9;
const modalMaxHeight = SCREEN_HEIGHT * 0.85; // 
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
  const fetchEmployees = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/employee/all");
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.employees || []);
        setFilteredEmployees(data.employees || []);
      } else {
        showAlert("Error", data.error || "Failed to fetch employees.");
      }
    } catch (error) {
      showAlert("Error", "Unable to fetch employees. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            emp.full_name?.toLowerCase().includes(query) ||
            emp.email?.toLowerCase().includes(query) ||
            emp.department?.toLowerCase().includes(query) ||
            emp.mobile?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, employees]);

  const updateEmployeeStatus = async (id, status) => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/employee/update-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        }
      );
      const data = await res.json();
      if (res.ok) {
       showAlert("Success", data.message || `Employee ${status}`);
        fetchEmployees();
      } else {
        showAlert("Error", data.error || "Failed to update status");
      }
    } catch {
      showAlert("Error", "Something went wrong while updating!");
    } finally { setLoading(false); }
  };
// ⭐ SAME EXPORT FUNCTION
const exportToExcel = async () => {
  const url = "https://hospitaldatabasemanagement.onrender.com/employee/export";

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      showAlert("Error", "Cannot open download link");
    }
  } catch (err) {
    showAlert("Error", "Failed to export file");
  }
};


  const deleteEmployee = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/employee/delete/${id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) {
        showAlert("Deleted", data.message || "Employee deleted successfully");
        fetchEmployees();
      } else {
        showAlert("Error", data.error || "Failed to delete employee");
      }
    } catch {
      showAlert("Error", "Something went wrong while deleting!");
    } finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    showAlert("Confirm Delete", "Are you sure you want to delete this employee?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEmployee(id) },
    ]);
  };

  const handleAddUser = () => navigation.navigate("AdminAddEmployee");

  const renderHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      {columns.map((col, index) => (
        <Text
          key={index}
          style={[styles.headerCell, { width: col.width, textAlign: col.align || "center" }]}
        >
          {col.label}
        </Text>
      ))}
    </View>
  );
  if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading{loadingCount}s</Text>
        </View>
      );

 
//   const SidebarItem = ({ icon, label, active, onPress }) => (
//   <TouchableOpacity
//     onPress={onPress}
//     style={[
//       styles.sidebarItem,
//       active && styles.sidebarItemActive
//     ]}
//   >
//     <MaterialIcons
//       name={icon}
//       size={20}
//       color={active ? "#fff" : "#64748b"}
//     />
//     <Text
//       style={[
//         styles.sidebarLabel,
//         active && styles.sidebarLabelActive
//       ]}
//     >
//       {label}
//     </Text>
//   </TouchableOpacity>
// );


const renderRow = ({ item, index }) => {
  const isActionDisabled =
    loading ||
    item.status === "approved" ||
    item.status === "rejected";

  return (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
  
    <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      <Text style={[styles.cell, { width: 60 }]}>{index + 1}</Text>
      <View style={[styles.cell, { width: 70 }]}><Image source={{ uri: item.image || "https://via.placeholder.com/40" }} style={styles.image} /></View>
      <Text style={[styles.cell, { width: 150 }]}>{item.full_name}</Text>
      <Text style={[styles.cell, { width: 200 }]}>{item.email}</Text>
      <Text style={[styles.cell, { width: 120 }]}>{item.mobile}</Text>
      <Text style={[styles.cell, { width: 140 }]}>{item.department}</Text>
      <Text style={[styles.cell, { width: 120 }]}>{item.role}</Text>
     <Text style={[
                  styles.cell,
                  { width: 100 },
                  item.status === "approved" ? styles.statusApproved :
                  item.status === "rejected" ? styles.statusRejected :
                  styles.statusPending,
                ]}>{item.status || "pending"}</Text>
        
    <View style={[styles.actionCell]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 10, minWidth: 250 }} // ensure all buttons visible
        >
          <TouchableOpacity
            onPress={() => { setSelectedEmployee(item); setViewModalVisible(true); }}
            style={styles.iconBtn}
          >
            <MaterialIcons name="visibility" size={20} color="#28a745" />
          </TouchableOpacity>
      
          <TouchableOpacity
                onPress={() => navigation.navigate("AdminUpdateEmployeeScreen", { id: item.id })}
                style={styles.iconBtn}
              >
            <MaterialIcons name="edit" size={20} color="#007bff" />
          </TouchableOpacity>
      
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.iconBtn}
          >
            <MaterialIcons name="delete" size={20} color="#e63946" />
          </TouchableOpacity>
      
          <TouchableOpacity
            onPress={() => updateEmployeeStatus(item.id, "approved")}
            style={[styles.iconBtn, { backgroundColor: "#d4edda", minWidth: 80, justifyContent: "center" }]}
            disabled={isActionDisabled}
          >
            <Text style={{ color: "#155724", fontWeight: "bold", textAlign: "center" }}>Approve</Text>
          </TouchableOpacity>
      
          <TouchableOpacity
            onPress={() => updateEmployeeStatus(item.id, "rejected")}
            style={[styles.iconBtn, { backgroundColor: "#f8d7da", minWidth: 80, justifyContent: "center" }]}
            disabled={isActionDisabled}
          >
            <Text style={{ color: "#721c24", fontWeight: "bold", textAlign: "center" }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
      </View>
  );
};
  

  return (
    <View style={styles.webContainer}>
     
      {/* MAIN CONTENT AREA */}
<ScrollView
  style={styles.mainContent}
  contentContainerStyle={{ paddingBottom: 40 }}
>
       <View style={styles.contentHeader}>
  <View style={styles.titleRow}>
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
      accessibilityLabel="Go back"
    >
      <MaterialIcons name="arrow-back" size={24} color="#1e293b" />
    </TouchableOpacity>

    <View>
      <Text style={styles.mainTitle}>Employee Management</Text>
      <Text style={styles.subTitle}>
        View and manage your hospital staff directory
      </Text>
    </View>
  </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.exportBtn} onPress={exportToExcel}>
              <MaterialIcons name="download" size={20} color="#1e293b" />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("AdminAddEmployee")}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add Employee</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH & TABLE CARD */}
        <View style={styles.tableCard}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search by name, email or department..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ margin: 40 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                {renderHeader()}
                <FlatList
                  data={filteredEmployees}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderRow}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* VIEW MODAL (Logic unchanged) */}
      {selectedEmployee && (
        <Modal visible={viewModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { width: modalWidth, maxHeight: modalMaxHeight }]}>
              <TouchableOpacity onPress={() => setViewModalVisible(false)} style={styles.closeBtn}><MaterialIcons name="close" size={24} /></TouchableOpacity>
              <ScrollView>
                <Image source={{ uri: selectedEmployee.image }} style={styles.modalImage} />
                <Text style={styles.modalName}>{selectedEmployee.full_name}</Text>
                {Object.entries(selectedEmployee).map(([key, val]) => (
                    typeof val === 'string' && <View key={key} style={styles.modalRow}><Text style={styles.modalLabel}>{key}:</Text><Text>{val}</Text></View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const columns = [
  { label: "S.No", width: 60 }, { label: "Avatar", width: 70 },
  { label: "Full Name", width: 150 }, { label: "Email Address", width: 200 },
  { label: "Phone", width: 120 }, { label: "Department", width: 140 },
  { label: "Role", width: 120 }, { label: "Status", width: 100 },
  { label: "Actions", width: 200 },
];

const styles = StyleSheet.create({
  webContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  // Sidebar
  sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 24 },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: '#2563EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandLetter: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  brandSub: { fontSize: 12, color: '#64748b', marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: '#2563EB' },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: '#64748b', fontWeight: '600' },
  sidebarLabelActive: { color: '#fff' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutText: { marginLeft: 12, color: '#ef4444', fontWeight: '700' },

  // Main Content
  mainContent: { flex: 1, padding: 32 },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subTitle: { color: '#64748b', marginTop: 4 },
  headerActions: { flexDirection: 'row' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 12, backgroundColor: '#fff' },
  exportBtnText: { marginLeft: 8, fontWeight: '600', color: '#1e293b' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: '#fff', marginLeft: 8, fontWeight: '600' },

  // Table Card
  tableCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', elevation: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', outlineStyle: "none" },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, outlineStyle: "none" },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerCell: { padding: 16, fontWeight: '700', color: '#64748b', fontSize: 13, textAlign: 'left' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowEven: { backgroundColor: '#fff' },
  rowOdd: { backgroundColor: '#fcfdfe' },
  cell: { padding: 16, fontSize: 14, color: '#334155', justifyContent: 'center' },
  image: { width: 36, height: 36, borderRadius: 18 },
  statusApproved: { color: '#10b981', fontWeight: '700' },
  statusRejected: { color: '#ef4444', fontWeight: '700' },
  actionCell: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  iconBtn: { width: 32, height: 32, backgroundColor: '#f1f5f9', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  closeBtn: { alignSelf: 'flex-end' },
  modalImage: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center' },
  modalName: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalLabel: { fontWeight: 'bold', color: '#64748b' }
});