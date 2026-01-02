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

} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function UserEmployeeListScreen() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const navigation = useNavigation();

  const fetchEmployees = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/employee/all");
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.employees || []);
        setFilteredEmployees(data.employees || []);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch employees.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to fetch employees. Please try again.");
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
        Alert.alert("Success", data.message || `Employee ${status}`);
        fetchEmployees();
      } else {
        Alert.alert("Error", data.error || "Failed to update status");
      }
    } catch {
      Alert.alert("Error", "Something went wrong while updating!");
    } finally { setLoading(false); }
  };
// ⭐ SAME EXPORT FUNCTION
const exportToExcel = () => {
  const url = "https://hospitaldatabasemanagement.onrender.com/employee/export";

  Alert.alert(
    "Export CSV",
    "The file will open in your browser for download.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) }
    ]
  );
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
        Alert.alert("Deleted", data.message || "Employee deleted successfully");
        fetchEmployees();
      } else {
        Alert.alert("Error", data.error || "Failed to delete employee");
      }
    } catch {
      Alert.alert("Error", "Something went wrong while deleting!");
    } finally { setLoading(false); }
  };

  const handleDelete = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this employee?", [
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
          <Text>Loading...</Text>
        </View>
      );

  const renderRow = ({ item, index }) => {
    const isActionDisabled = loading || item.status === "approved" || item.status === "rejected";

    return (
      <View style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
        <Text style={[styles.cell, { width: 60 }]}>{index + 1}</Text>

        <View style={[styles.cell, { width: 70 }]}>
          <Image
            source={{ uri: item.image || "https://via.placeholder.com/40" }}
            style={styles.image}
          />
        </View>

        <Text style={[styles.cell, { width: 150 }]} numberOfLines={1}>{item.full_name}</Text>
        <Text style={[styles.cell, { width: 200 }]} numberOfLines={1}>{item.email}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.mobile}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.family_number}</Text>
        <Text style={[styles.cell, { width: 140 }]}>{item.department}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.role}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{item.blood_group}</Text>
        <Text style={[styles.cell, { width: 70 }]}>{item.age}</Text>
        <Text style={[styles.cell, { width: 130 }]}>{item.experience}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{item.monthly_salary}</Text>
        <Text style={[styles.cell, { width: 140 }]}>{item.employment_type}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.category}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.reporting_manager}</Text>
        <Text style={[styles.cell, { width: 150 }]}>{item.aadhar}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.pan}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{item.esi_number}</Text>
        <Text style={[styles.cell, { width: 130 }]}>{item.bank_name}</Text>
        <Text style={[styles.cell, { width: 160 }]}>{item.account_number}</Text>
        <Text style={[styles.cell, { width: 130 }]}>{item.ifsc}</Text>
        <Text style={[styles.cell, { width: 130 }]}>{item.branch_name}</Text>

        <Text style={[styles.cell, { width: 200 }]}>
          {item.temporary_addresses?.map(a => `${a.street}, ${a.city}`).join(" | ")}
        </Text>

        <Text style={[styles.cell, { width: 200 }]}>
          {item.permanent_addresses?.map(b => `${b.street}, ${b.city}`).join(" | ")}
        </Text>

        <Text style={[styles.cell, { width: 110 }]}>{item.schedule_in}</Text>
        <Text style={[styles.cell, { width: 110 }]}>{item.schedule_out}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{item.break_in}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{item.break_out}</Text>
        <Text style={[styles.cell, { width: 130 }]}>{item.date_of_joining?.slice(0, 10)}</Text>

        <Text style={[
          styles.cell,
          { width: 100 },
          item.status === "approved" ? styles.statusApproved :
          item.status === "rejected" ? styles.statusRejected :
          styles.statusPending,
        ]}>
          {item.status || "pending"}
        </Text>

        <View style={[styles.actionCell, { width: 200 }]}>
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
            style={[styles.iconBtn, { backgroundColor: "#d4edda" }]}
            disabled={isActionDisabled}
          >
            <Text style={{ color: "#155724", fontWeight: "bold" }}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => updateEmployeeStatus(item.id, "rejected")}
            style={[styles.iconBtn, { backgroundColor: "#f8d7da" }]}
            disabled={isActionDisabled}
          >
            <Text style={{ color: "#721c24", fontWeight: "bold" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>

        <Text style={styles.title}>Employee Directory</Text>
{/* EXPORT BUTTON */}
    <TouchableOpacity 
      style={[styles.addBtn, { backgroundColor: "#1e90ff", marginRight: 10 }]} 
      onPress={exportToExcel}
    >
      <MaterialIcons name="download" size={20} color="#fff" />
      <Text style={styles.addBtnText}>Export</Text>
    </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddUser}>
          <MaterialIcons name="person-add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={22} color="#007bff" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          placeholderTextColor="#000"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* TABLE */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : filteredEmployees.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#555" }}>
          No employees found.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
          <View>
            {renderHeader()}
            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderRow}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
          </View>
        </ScrollView>
      )}

      {/* VIEW MODAL */}
      {selectedEmployee && (
        <Modal visible={viewModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  onPress={() => setViewModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={28} color="#000" />
                </TouchableOpacity>

                <Image
                  source={{ uri: selectedEmployee.image || "https://via.placeholder.com/100" }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalTitle}>{selectedEmployee.full_name}</Text>

                {[
                  ["Email", selectedEmployee.email],
                  ["Mobile", selectedEmployee.mobile],
                  ["Family Number", selectedEmployee.family_number],
                  ["Department", selectedEmployee.department],
                  ["Role", selectedEmployee.role],
                  ["Blood Group", selectedEmployee.blood_group],
                  ["Age", selectedEmployee.age],
                  ["Experience (Years)", selectedEmployee.experience],
                  ["Monthly Salary", selectedEmployee.monthly_salary],
                  ["Employment Type", selectedEmployee.employment_type],
                  ["Category", selectedEmployee.category],
                  ["Reporting Manager", selectedEmployee.reporting_manager],
                  ["Aadhar", selectedEmployee.aadhar],
                  ["PAN", selectedEmployee.pan],
                  ["ESI Number", selectedEmployee.esi_number],
                  ["Bank Name", selectedEmployee.bank_name],
                  ["Account Number", selectedEmployee.account_number],
                  ["IFSC", selectedEmployee.ifsc],
                  ["Branch Name", selectedEmployee.branch_name],
                  [
                    "Temporary Address",
                    selectedEmployee.temporary_addresses
                      ?.map(a => `${a.street}, ${a.city}, ${a.state} - ${a.pincode}`)
                      .join(" | ")
                  ],
                  [
                    "Permanent Address",
                    selectedEmployee.permanent_addresses
                      ?.map(b => `${b.street}, ${b.city}, ${b.state} - ${b.pincode}`)
                      .join(" | ")
                  ],
                  ["Schedule In", selectedEmployee.schedule_in],
                  ["Schedule Out", selectedEmployee.schedule_out],
                  ["Break In", selectedEmployee.break_in],
                  ["Break Out", selectedEmployee.break_out],
                  ["Date of Joining", selectedEmployee.date_of_joining?.slice(0, 10)],
                  ["Status", selectedEmployee.status],
                ].map(([label, value], index) => (
                  <View style={styles.modalRow} key={index}>
                    <Text style={styles.modalLabel}>{label}:</Text>
                    <Text style={styles.modalValue}>{value && value !== "" ? value : "-"}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}


// Columns
const columns = [
  { label: "S.No", width: 60 },
  { label: "Image", width: 70 },
  { label: "Name", width: 150 },
  { label: "Email", width: 200 },
  { label: "Mobile", width: 120 },
  { label: "Family No", width: 120 },
  { label: "Department", width: 140 },
  { label: "Role", width: 120 },
  { label: "Blood Group", width: 100 },
  { label: "Age", width: 70 },
  { label: "Experience (Yrs)", width: 130 },
  { label: "Salary", width: 100 },
  { label: "Employment Type", width: 140 },
  { label: "Category", width: 120 },
  { label: "Manager", width: 120 },
  { label: "Aadhaar", width: 150 },
  { label: "PAN", width: 120 },
  { label: "ESI No", width: 120 },
  { label: "Bank Name", width: 130 },
  { label: "Account No", width: 160 },
  { label: "IFSC", width: 130 },
  { label: "Branch", width: 130 },
  { label: "Temp Addr", width: 200 },
  { label: "Perm Addr", width: 200 },
  { label: "Schedule In", width: 110 },
  { label: "Schedule Out", width: 110 },
  { label: "Break In", width: 100 },
  { label: "Break Out", width: 100 },
  { label: "Join Date", width: 130 },
  { label: "Status", width: 100 },
  { label: "Actions", width: 200 },
];


// ⭐ ALL STYLES ⭐
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8fb",
    padding: 10,
    marginTop: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  backBtn: { padding: 6 },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007bff",
    flex: 1,
    textAlign: "center",
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },

  addBtnText: { color: "#fff", marginLeft: 5, fontWeight: "600", fontSize: 14 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#cce0ff",
    elevation: 2,
  },

  searchInput: { flex: 1, fontSize: 15, color: "#333" },

  rowEven: { backgroundColor: "#f8fbff" },
  rowOdd: { backgroundColor: "#ffffff" },

  statusApproved: { color: "#2ecc71", fontWeight: "bold" },
  statusRejected: { color: "#e74c3c", fontWeight: "bold" },
  statusPending: { color: "#f39c12", fontWeight: "bold" },

  actionCell: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  iconBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: "#eaf3ff",
    marginHorizontal: 3,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    alignItems: "center",
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e3ecff",
  },

  cell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    fontSize: 12,
    textAlign: "center",
    color: "#333",
    borderRightWidth: 1,
    borderRightColor: "#e3ecff",
  },

  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    fontWeight: "700",
    fontSize: 13,
    color: "#fff",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)",
  },

  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#cce0ff",
  },

  // ⭐ MODAL STYLES ⭐
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

 modalContainer: {
  width: "90%",
  maxHeight: "85%",
  backgroundColor: "#fff",
  borderRadius: 15,
  elevation: 10,
  position: "relative",
  padding: 20,
},

modalScroll: {
  flexGrow: 0,
},

modalCloseBtn: {
  position: "absolute",
  top: 10,
  right: 10,
  backgroundColor: "#fff",
  padding: 6,
  borderRadius: 25,
  elevation: 5,
  zIndex: 999,
},



  modalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#007bff",
  },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  modalLabel: {
    fontWeight: "bold",
    color: "#333",
    width: "40%",
  },

  modalValue: {
    width: "60%",
    textAlign: "right",
    color: "#555",
  },
});
