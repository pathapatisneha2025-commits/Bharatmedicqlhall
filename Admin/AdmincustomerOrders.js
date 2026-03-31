import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Ionicons, Feather } from "@expo/vector-icons";import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://hospitaldatabasemanagement.onrender.com/order-medicine/all";
const UPDATE_STATUS_URL =
  "https://hospitaldatabasemanagement.onrender.com/order-medicine/update-status";
const EMPLOYEES_URL =
  "https://hospitaldatabasemanagement.onrender.com/employee/all"; // ✅ Employees API
const ASSIGN_DELIVERY_URL =
  "https://hospitaldatabasemanagement.onrender.com/deliveryboy/assign-delivery"; // ✅ hypothetical endpoint
const ASSIGN_PICKER_URL =
  "https://hospitaldatabasemanagement.onrender.com/picker/assign-picker";
const EDIT_ORDER_URL =
  "https://hospitaldatabasemanagement.onrender.com/order-medicine/update";
const DELETE_ORDER_URL =
  "https://hospitaldatabasemanagement.onrender.com/order-medicine/delete";
const AdminManageOrdersScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
          const [loadingCount, setLoadingCount] = useState(0);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deliveryAssignments, setDeliveryAssignments] = useState({});
  const [deliveryBoys, setDeliveryBoys] = useState([]); // ✅ fetched dynamically
const [pickers, setPickers] = useState([]);
const [pickerAssignments, setPickerAssignments] = useState({});
const [editFields, setEditFields] = useState({
  patientName: "",
  mobile: "",
  flat: "",
  street: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  payment_method: "",
  payment_status: "",   // new
  payment_mode: "",     // new
  amount_received: 0,   // new
  deliverytype: "",     // new
});

const [editMedicines, setEditMedicines] = useState([]);

const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 420;
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
  // ✅ Fetch Orders
  const fetchOrders = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      showAlert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Delivery Boys
//   const fetchDeliveryBoys = async () => {
//     try {
//       const response = await fetch(EMPLOYEES_URL);
//       const data = await response.json();

//       // Filter only "Hd delivery" employees
//       const filtered = data.employees.filter(
//         (emp) => emp.role?.toLowerCase() === "hd delivery"
//       );

//       // Format for dropdown
//       const formatted = filtered.map((emp) => ({
//         id: emp.id, // employee_id
//         name: emp.full_name,
//       }));

//       setDeliveryBoys(formatted);
//     } catch (error) {
//       console.error("Error fetching delivery boys:", error);
//       showAlert("Error", "Failed to fetch delivery boys");
//     }
//   };
//   const fetchPickers = async () => {
//   try {
//     const response = await fetch(EMPLOYEES_URL);
//     const data = await response.json();

//     const filtered = data.employees.filter(
//       (emp) => emp.role?.toLowerCase() === "picker"
//     );

//     const formatted = filtered.map((emp) => ({
//       id: emp.id,
//       name: emp.full_name,
//     }));

//     setPickers(formatted);
//   } catch (error) {
//     console.error("Error fetching pickers:", error);
//    showAlert("Error", "Failed to fetch picker employees");
//   }
// };


 const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ordersRes, employeesRes] = await Promise.all([fetch(API_URL), fetch(EMPLOYEES_URL)]);
      const ordersData = await ordersRes.json();
      const employeesData = await employeesRes.json();

      setOrders(ordersData);

      const deliveryBoysData = employeesData.employees.filter((e) => e.role?.toLowerCase() === "hd delivery");
      setDeliveryBoys(deliveryBoysData.map((e) => ({ id: e.id, name: e.full_name })));

      const pickersData = employeesData.employees.filter((e) => e.role?.toLowerCase() === "picker");
      setPickers(pickersData.map((e) => ({ id: e.id, name: e.full_name })));
    } catch (error) {
      console.error(error);
      showAlert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ✅ Update Order Status
  const updateOrderStatus = async (orderId, status) => {
    try {
      setLoading(true);
      const res = await fetch(UPDATE_STATUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("✅ Success", data.message || `Order marked as ${status}`);
        fetchOrders();
      } else {
        showAlert("❌ Error", data.error || "Failed to update status");
      }
    } catch {
      showAlert("Error", "Something went wrong while updating order status.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Assign Delivery Boy
  // ✅ Assign Delivery Boy
const assignDeliveryBoy = async (orderId, employeeId) => {
  const selectedBoy = deliveryBoys.find(
    (b) => String(b.id) === String(employeeId)
  );

  const boyName = selectedBoy ? selectedBoy.name : "Unknown";

  try {
    const res = await fetch(ASSIGN_DELIVERY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, employee_id: employeeId }),
    });

    const data = await res.json();

    if (res.ok) {
      setDeliveryAssignments((prev) => ({
        ...prev,
        [orderId]: employeeId,
      }));

      showAlert("✅ Assigned", `Delivery boy assigned: ${boyName}`);
      fetchOrders();
    } else {
      showAlert("❌ Error", data.error || "Failed to assign delivery boy");
    }
  } catch (error) {
    console.error(error);
    showAlert("Error", "Something went wrong.");
  }
};
const assignPicker = async (orderId, employeeId) => {
  const selectedPicker = pickers.find((p) => p.id === employeeId);
  const pickerName = selectedPicker ? selectedPicker.name : "Unknown";

  try {
    const res = await fetch(ASSIGN_PICKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, employee_id: employeeId }),
    });

    const data = await res.json();

    if (res.ok) {
      setPickerAssignments((prev) => ({ ...prev, [orderId]: employeeId }));
      showAlert("✅ Picker Assigned", `Picker assigned: ${pickerName}`);
      fetchOrders();
    } else {
      showAlert("❌ Error", data.error || "Failed to assign picker");
    }
  } catch (error) {
    console.error("Error assigning picker:", error);
    showAlert("Error", "Something went wrong while assigning picker.");
  }
};

const previewOrder = (order) => {
  setSelectedOrder(order);

  setEditFields({
    patientName: order.address?.name || "",
    mobile: order.address?.mobile || "",
    flat: order.address?.flat || "",
    street: order.address?.street || "",
    landmark: order.address?.landmark || "",
    city: order.address?.city || "",
    state: order.address?.state || "",
    pincode: order.address?.pincode || "",
    payment_method: order.payment_method || "",
    payment_status: order.payment_status || "",
    payment_mode: order.payment_mode || "",
    amount_received: order.amount_received || 0,
    deliverytype: order.deliverytype || "",
  });

  setEditMedicines(
    order.order_summary?.map((m) => ({
      id: m.id || Math.random().toString(),
      name: m.name,
      quantity: m.quantity,
    })) || []
  );

  setModalVisible(true);
};

  // ✅ Filter Orders
  const filteredOrders = orders.filter(
    (order) =>
      order.address?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.status?.toLowerCase().includes(search.toLowerCase())
  );

 

const editOrderAPI = async (orderId, updatedData) => {
  try {
    setLoading(true);

    const res = await fetch(`${EDIT_ORDER_URL}/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });

    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      console.warn("Failed to parse response JSON", err);
    }

    if (res.ok) {
      showAlert("✅ Updated", data.message || "Order updated successfully");
      setModalVisible(false);
      fetchOrders();
    } else {
      showAlert("❌ Error", data.error || "Failed to update order");
    }
  } catch (err) {
    console.error("Edit order error:", err);
    showAlert("Error", "Something went wrong while editing order");
  } finally {
    setLoading(false);
  }
};


  // ✅ Delete Order (local only)
 const deleteOrderAPI = (orderId) => {
  showAlert("Confirm Delete", "Are you sure you want to delete this order?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          setLoading(true);

          const res = await fetch(`${DELETE_ORDER_URL}/${orderId}`, {
            method: "DELETE",
          });

          const data = await res.json();

          if (res.ok) {
           showAlert("🗑️ Deleted", data.message || "Order deleted");
            setModalVisible(false);
            fetchOrders(); // 🔄 refresh list
          } else {
           showAlert("❌ Error", data.error || "Failed to delete order");
          }
        } catch (err) {
          console.error("Delete order error:", err);
          showAlert("Error", "Something went wrong while deleting order");
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};
  const exportOrdersExcel = () => {
  const url =
    "https://hospitaldatabasemanagement.onrender.com/order-medicine/export";

  showAlert(
    "Export Orders",
    "Your Excel file will download in the browser.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) },
    ]
  );
};
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading orders{loadingCount}s</Text>
      </View>
    );
  }
const renderRow = ({ item, index }) => (
    <View style={[styles.tableRow, index % 2 !== 0 && { backgroundColor: "#f8fafc" }]}>
      <Text style={[styles.cell, styles.colSmall]}>{index + 1}</Text>
      <Text style={[styles.cell, styles.colMedium, styles.statusLabel, 
        item.status === "delivered" ? styles.statusDelivered : 
        item.status === "cancelled" ? styles.statusCancelled : styles.statusDefault]}>
        {item.status}
      </Text>
      <Text style={[styles.cell, styles.colLarge, { fontWeight: "600" }]}>{item.address?.name}</Text>
      <Text style={[styles.cell, styles.colMedium]}>{item.address?.mobile}</Text>
      <Text style={[styles.cell, styles.colXLarge]} numberOfLines={2}>
        {item.address?.flat}, {item.address?.street}, {item.address?.city}
      </Text>
      <Text style={[styles.cell, styles.colMedium]}>{item.payment_method}</Text>
      <Text style={[styles.cell, styles.colSmall, { fontWeight: "700" }]}>₹{item.total}</Text>
      <Text style={[styles.cell, styles.colMedium]}>
        {new Date(item.expected_delivery).toLocaleDateString()}
      </Text>
      
      <View style={[styles.cell, styles.colMedium]}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={deliveryAssignments[item.id] || ""}
            onValueChange={(value) => assignDeliveryBoy(item.id, value)}
            style={styles.picker}
          >
            <Picker.Item label="Assign Boy" value="" />
            {deliveryBoys.map((boy) => <Picker.Item key={boy.id} label={boy.name} value={boy.id} />)}
          </Picker>
        </View>
      </View>

      <View style={[styles.cell, styles.colMedium]}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={pickerAssignments[item.id] || ""}
            onValueChange={(value) => assignPicker(item.id, value)}
            style={styles.picker}
          >
            <Picker.Item label="Assign Picker" value="" />
            {pickers.map((p) => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
          </Picker>
        </View>
      </View>

   <View style={[styles.cell, styles.colLarge, styles.statusBtnsContainer]}>
  
  <TouchableOpacity
    style={[styles.statusBtn, { backgroundColor: "#3b82f6" }]}
    onPress={() => updateOrderStatus(item.id, "inprogress")}
  >
    <Text style={styles.statusBtnText}>Progress</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.statusBtn, { backgroundColor: "#10b981" }]}
    onPress={() => updateOrderStatus(item.id, "delivered")}
  >
    <Text style={styles.statusBtnText}>Done</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.statusBtn, { backgroundColor: "#ef4444" }]}
    onPress={() => updateOrderStatus(item.id, "cancelled")}
  >
    <Text style={styles.statusBtnText}>Cancel</Text>
  </TouchableOpacity>

</View>


      <View style={[styles.cell, styles.colSmall, styles.actionCell]}>
        <TouchableOpacity onPress={() => previewOrder(item)} style={styles.viewIconBtn}>
          <Feather name="eye" size={18} color="#2563eb" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.headerArea}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Order Management</Text>
            <Text style={styles.headerSub}>Control pharmacy shipments</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnExport} onPress={exportOrdersExcel}>
          <Feather name="download" size={18} color="#fff" />
          <Text style={styles.btnExportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topActions}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, mobile or status..."
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 10, color: "#64748b" }}>Syncing... {loadingCount}s</Text>
        </View>
      ) : (
        <View style={styles.cardTable}>
       <ScrollView horizontal showsHorizontalScrollIndicator={!isWeb}>
  <View>
    <View style={styles.tableHeaderRow}>
      {/* header cells */}
    </View>
    <View style={{ height: 500 }}> {/* fixed height for FlatList */}
      <FlatList
        data={filteredOrders}
        renderItem={renderRow}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  </View>
</ScrollView>

        </View>
      )}

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: SCREEN_WIDTH > 420 ? 420 : SCREEN_WIDTH - 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📦 Order Editor</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.modalSubtitle}>Patient Information</Text>
              <TextInput style={styles.modalInput} value={editFields.patientName} onChangeText={(t) => setEditFields({ ...editFields, patientName: t })} placeholder="Name" />
              <TextInput style={styles.modalInput} value={editFields.mobile} onChangeText={(t) => setEditFields({ ...editFields, mobile: t })} placeholder="Mobile" keyboardType="phone-pad" />

              <Text style={styles.modalSubtitle}>Medicine List</Text>
              {editMedicines.map((med, i) => (
                <View key={med.id} style={styles.medicineRow}>
                  <TextInput style={[styles.modalInput, { flex: 2 }]} value={med.name} placeholder="Item" onChangeText={(t) => { const u = [...editMedicines]; u[i].name = t; setEditMedicines(u); }} />
                  <TextInput style={[styles.modalInput, { flex: 1, marginLeft: 5 }]} value={String(med.quantity)} placeholder="Qty" keyboardType="numeric" onChangeText={(t) => { const u = [...editMedicines]; u[i].quantity = parseInt(t) || 0; setEditMedicines(u); }} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#10b981" }]} onPress={() => editOrderAPI(selectedOrder.id, { address: { name: editFields.patientName, mobile: editFields.mobile }, order_summary: editMedicines })}>
                <Text style={styles.modalBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ef4444" }]} onPress={() => deleteOrderAPI(selectedOrder.id)}>
                <Text style={styles.modalBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F1F5F9", padding: 16 },
  headerArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  circleBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  headerSub: { color: "#64748b", fontSize: 13 },
  btnExport: { flexDirection: "row", alignItems: "center", backgroundColor: "#334155", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnExportText: { color: "#fff", fontWeight: "600", marginLeft: 8 },

  topActions: { marginBottom: 15 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: "#e2e8f0" },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#1e293b" ,outlineStyle: "none"},

  cardTable: { backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: "#e2e8f0", flex: 1, overflow: "hidden", elevation: 3 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", textAlign: "center" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center", paddingVertical: 10 },
  cell: { fontSize: 13, color: "#475569", textAlign: "center" },

  colSmall: { width: 60 }, colMedium: { width: 150 }, colLarge: { width: 200 }, colXLarge: { width: 280 },

  statusLabel: { fontWeight: "700", fontSize: 11, textTransform: "uppercase" },
  statusDelivered: { color: "#10b981" }, statusCancelled: { color: "#ef4444" }, statusDefault: { color: "#f59e0b" },

  pickerWrapper: { backgroundColor: "#f8fafc", borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", marginHorizontal: 5 },
  picker: { height: 40, width: "100%" },

  statusBtnsContainer: { flexDirection: "row", gap: 8, justifyContent: "center" },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  statusBtnText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  actionCell: { justifyContent: "center", alignItems: "center" },
  viewIconBtn: { padding: 8, backgroundColor: "#eff6ff", borderRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24, elevation: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  modalSubtitle: { fontSize: 14, fontWeight: "700", color: "#64748b", marginBottom: 10, marginTop: 15 },
  modalInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 },
  medicineRow: { flexDirection: "row", marginBottom: 5 },
  modalActionRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "700" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" }
});

export default AdminManageOrdersScreen;