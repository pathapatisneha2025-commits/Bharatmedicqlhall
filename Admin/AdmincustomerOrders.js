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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";

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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deliveryAssignments, setDeliveryAssignments] = useState({});
  const [deliveryBoys, setDeliveryBoys] = useState([]); // ✅ fetched dynamically
const [pickers, setPickers] = useState([]);
const [pickerAssignments, setPickerAssignments] = useState({});

  // ✅ Fetch Orders
  const fetchOrders = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Delivery Boys
  const fetchDeliveryBoys = async () => {
    try {
      const response = await fetch(EMPLOYEES_URL);
      const data = await response.json();

      // Filter only "Hd delivery" employees
      const filtered = data.employees.filter(
        (emp) => emp.role?.toLowerCase() === "hd delivery"
      );

      // Format for dropdown
      const formatted = filtered.map((emp) => ({
        id: emp.id, // employee_id
        name: emp.full_name,
      }));

      setDeliveryBoys(formatted);
    } catch (error) {
      console.error("Error fetching delivery boys:", error);
      Alert.alert("Error", "Failed to fetch delivery boys");
    }
  };
  const fetchPickers = async () => {
  try {
    const response = await fetch(EMPLOYEES_URL);
    const data = await response.json();

    const filtered = data.employees.filter(
      (emp) => emp.role?.toLowerCase() === "picker"
    );

    const formatted = filtered.map((emp) => ({
      id: emp.id,
      name: emp.full_name,
    }));

    setPickers(formatted);
  } catch (error) {
    console.error("Error fetching pickers:", error);
    Alert.alert("Error", "Failed to fetch picker employees");
  }
};


 useEffect(() => {
  fetchOrders();
  fetchDeliveryBoys();
  fetchPickers();   // 👈 add this
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
        Alert.alert("✅ Success", data.message || `Order marked as ${status}`);
        fetchOrders();
      } else {
        Alert.alert("❌ Error", data.error || "Failed to update status");
      }
    } catch {
      Alert.alert("Error", "Something went wrong while updating order status.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Assign Delivery Boy
 const assignDeliveryBoy = async (orderId, employeeId) => {
  const selectedBoy = deliveryBoys.find((b) => b.id === employeeId);
  const boyName = selectedBoy ? selectedBoy.name : "Unknown";

  try {
    const res = await fetch(ASSIGN_DELIVERY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, employee_id: employeeId }),
    });

    const data = await res.json();

    if (res.ok) {
      setDeliveryAssignments((prev) => ({ ...prev, [orderId]: employeeId }));
      Alert.alert("✅ Assigned", `Delivery boy assigned: ${boyName}`);
      fetchOrders(); // 🔄 Refresh the list so updated info shows
    } else {
      Alert.alert("❌ Error", data.error || "Failed to assign delivery boy");
    }
  } catch (error) {
    console.error("Error assigning delivery boy:", error);
    Alert.alert("Error", "Something went wrong while assigning delivery boy.");
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
      Alert.alert("✅ Picker Assigned", `Picker assigned: ${pickerName}`);
      fetchOrders();
    } else {
      Alert.alert("❌ Error", data.error || "Failed to assign picker");
    }
  } catch (error) {
    console.error("Error assigning picker:", error);
    Alert.alert("Error", "Something went wrong while assigning picker.");
  }
};


  // ✅ Filter Orders
  const filteredOrders = orders.filter(
    (order) =>
      order.address?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.status?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Preview Modal
  const previewOrder = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

const editOrderAPI = async (orderId, updatedData) => {
  try {
    setLoading(true);

    const res = await fetch(EDIT_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        ...updatedData, // ✅ dynamic fields
      }),
    });

    const data = await res.json();

    if (res.ok) {
      Alert.alert("✅ Updated", data.message || "Order updated successfully");
      setModalVisible(false);
      fetchOrders(); // 🔄 refresh table
    } else {
      Alert.alert("❌ Error", data.error || "Failed to update order");
    }
  } catch (err) {
    console.error("Edit order error:", err);
    Alert.alert("Error", "Something went wrong while editing order");
  } finally {
    setLoading(false);
  }
};

  // ✅ Delete Order (local only)
 const deleteOrderAPI = (orderId) => {
  Alert.alert("Confirm Delete", "Are you sure you want to delete this order?", [
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
            Alert.alert("🗑️ Deleted", data.message || "Order deleted");
            setModalVisible(false);
            fetchOrders(); // 🔄 refresh list
          } else {
            Alert.alert("❌ Error", data.error || "Failed to delete order");
          }
        } catch (err) {
          console.error("Delete order error:", err);
          Alert.alert("Error", "Something went wrong while deleting order");
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

  Alert.alert(
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
        <Text style={{ marginTop: 10 }}>Loading orders...</Text>
      </View>
    );
  }

  // ✅ Render Row
  const renderRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.colSmall]}>{index + 1}</Text>
      <Text
        style={[
          styles.cell,
          styles.colMedium,
          item.status === "processing"
            ? styles.statusProcessing
            : item.status === "cancelled"
            ? styles.statusCancelled
            : item.status === "inprogress"
            ? styles.statusInProgress
            : item.status === "delivered"
            ? styles.statusDelivered
            : styles.statusDefault,
        ]}
      >
        {item.status}
      </Text>

      <Text style={[styles.cell, styles.colLarge]}>{item.address?.name}</Text>
      <Text style={[styles.cell, styles.colMedium]}>{item.address?.mobile}</Text>
      <Text style={[styles.cell, styles.colXLarge]} numberOfLines={2}>
        {item.address?.flat}, {item.address?.street}, {item.address?.landmark},{" "}
        {item.address?.city}, {item.address?.state} - {item.address?.pincode}
      </Text>
      <Text style={[styles.cell, styles.colMedium]}>{item.payment_method}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.subtotal}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.tax}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.delivery_fee}</Text>
      <Text style={[styles.cell, styles.colSmall]}>₹{item.total}</Text>
      <Text style={[styles.cell, styles.colMedium]}>
        {new Date(item.expected_delivery).toLocaleDateString()}
      </Text>
      <Text style={[styles.cell, styles.colLarge]} numberOfLines={2}>
        {item.order_summary?.map((m) => `${m.name} x${m.quantity}`).join(", ")}
      </Text>

      {/* ✅ Dynamic Delivery Boy Dropdown */}
      <View style={[styles.cell, styles.colMedium]}>
        <Picker
          selectedValue={deliveryAssignments[item.id] || ""}
          onValueChange={(value) => assignDeliveryBoy(item.id, value)}
          style={styles.picker}
        >
          <Picker.Item label="Select" value="" />
          {deliveryBoys.map((boy) => (
            <Picker.Item key={boy.id} label={boy.name} value={boy.id} />
          ))}
        </Picker>
      </View>
{/* ✅ Picker Dropdown */}
<View style={[styles.cell, styles.colMedium]}>
  <Picker
    selectedValue={pickerAssignments[item.id] || ""}
    onValueChange={(value) => assignPicker(item.id, value)}
    style={styles.picker}
  >
    <Picker.Item label="Select" value="" />
    {pickers.map((p) => (
      <Picker.Item key={p.id} label={p.name} value={p.id} />
    ))}
  </Picker>
</View>

      {/* ✅ Status Buttons */}
      <View style={[styles.cell, styles.colLarge, styles.statusBtnsContainer]}>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: "#2196F3" }]}
          onPress={() => updateOrderStatus(item.id, "inprogress")}
        >
          <Text style={styles.statusBtnText}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: "#4CAF50" }]}
          onPress={() => updateOrderStatus(item.id, "delivered")}
        >
          <Text style={styles.statusBtnText}>Delivered</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusBtn, { backgroundColor: "#f44336" }]}
          onPress={() => updateOrderStatus(item.id, "cancelled")}
        >
          <Text style={styles.statusBtnText}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.cell, styles.colSmall, styles.actionCell]}>
        <TouchableOpacity onPress={() => previewOrder(item)}>
          <FontAwesome name="eye" size={20} color="#2196F3" />
        </TouchableOpacity>
        
      </View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      {/* ✅ Header */}
     <View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={28} color="#fff" />
  </TouchableOpacity>

  <Text style={styles.headerTitle}>📦 Manage Orders</Text>


</View>

      {/* ✅ Search */}
   {/* 🔍 Search + Export Section */}
<View style={styles.topActions}>
  
  {/* Search Bar */}
  <View style={styles.searchBox}>
    <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
    
    <TextInput
      style={styles.searchInput}
      placeholder="Search by patient, mobile, or status"
      value={search}
      onChangeText={setSearch}
      placeholderTextColor="#888"
    />

    {search.length > 0 && (
      <TouchableOpacity onPress={() => setSearch("")}>
        <Ionicons name="close-circle" size={22} color="#777" />
      </TouchableOpacity>
    )}
  </View>

  {/* Export Button */}
  <TouchableOpacity style={styles.exportBtn} onPress={exportOrdersExcel}>
    <Ionicons name="download-outline" size={20} color="#fff" />
    <Text style={styles.exportBtnText}>Export</Text>
  </TouchableOpacity>

</View>


      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            {/* ✅ Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.headerCell, styles.colSmall]}>#</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Status</Text>
              <Text style={[styles.headerCell, styles.colLarge]}>Name</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Mobile</Text>
              <Text style={[styles.headerCell, styles.colXLarge]}>Address</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Payment</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Subtotal</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Tax</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Delivery</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Total</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Delivery Date</Text>
              <Text style={[styles.headerCell, styles.colLarge]}>Medicines</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Delivery Boy</Text>
              <Text style={[styles.headerCell, styles.colMedium]}>Picker</Text>

              <Text style={[styles.headerCell, styles.colLarge]}>Update Status</Text>
              <Text style={[styles.headerCell, styles.colSmall]}>Actions</Text>
            </View>

            <FlatList
              data={filteredOrders}
              renderItem={renderRow}
              keyExtractor={(item) => item.id.toString()}
            />
          </View>
        </ScrollView>
      )}

      {/* ✅ Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>

      <Text style={styles.modalTitle}>📦 Order Details</Text>

      {/* Scrollable details */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalText}>Order ID: {selectedOrder?.id}</Text>
        <Text style={styles.modalText}>Patient: {selectedOrder?.address?.name}</Text>
        <Text style={styles.modalText}>Mobile: {selectedOrder?.address?.mobile}</Text>
        <Text style={styles.modalText}>Payment: {selectedOrder?.payment_method}</Text>
        <Text style={styles.modalText}>Status: {selectedOrder?.status}</Text>
        <Text style={styles.modalText}>Total: ₹{selectedOrder?.total}</Text>

        <Text style={styles.modalSubtitle}>💊 Medicines</Text>
        {selectedOrder?.order_summary?.map((m, i) => (
          <Text key={i} style={styles.modalText}>
            • {m.name} × {m.quantity}
          </Text>
        ))}
      </ScrollView>

      {/* 🔥 ACTION BUTTONS (LIKE DRIVER MODAL) */}
      <View style={styles.modalActionRow}>
        {/* EDIT */}
        <TouchableOpacity
          style={[styles.modalBtn, { backgroundColor: "#4CAF50" }]}
          onPress={() => editOrderAPI(selectedOrder.id)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.modalBtnText}>Edit</Text>
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity
          style={[styles.modalBtn, { backgroundColor: "#f44336" }]}
          onPress={() => deleteOrderAPI(selectedOrder.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.modalBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* CLOSE */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>

    </ScrollView>
  );
};

// ✅ Styles (unchanged)
const styles = StyleSheet.create({
  header: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginLeft: 10 },
topActions: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 12,
  marginTop: 10,
},

searchBox: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderRadius: 12,
  paddingHorizontal: 10,
  height: 45,                 
  borderWidth: 1,
  borderColor: "#ccc",
  marginRight: 10,
  elevation: 2,
},

searchInput: {
  flex: 1,
  fontSize: 14,
  paddingVertical: 0,          
  color: "#333",
},


exportBtn: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#2196F3",
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 12,
  elevation: 3,
},

exportBtnText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 14,
  marginLeft: 6,
},

  tableContainer: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 15,
    elevation: 4,
    overflow: "hidden",
  },
  tableHeader: { backgroundColor: "#e3f2fd" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  headerCell: { padding: 8, fontWeight: "bold", fontSize: 13, textAlign: "center" },
  cell: { padding: 8, fontSize: 12, textAlign: "center" },
  colSmall: { width: 80 },
colMedium: { width: 200 },
  colLarge: { width: 220 },
  colXLarge: { width: 340 },
picker: {
  height: 45,
  width: "100%",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  backgroundColor: "#f9f9f9",
},
  statusBtnsContainer: { flexDirection: "row", justifyContent: "space-around" },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  statusBtnText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  actionCell: { flexDirection: "row", justifyContent: "space-around" },
 /* ===== MODAL STYLES ===== */

modalContainer: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.55)",
  justifyContent: "flex-end",   // bottom sheet style
},

modalContent: {
  backgroundColor: "#fff",
  paddingHorizontal: 20,
  paddingTop: 20,
  paddingBottom: 32,            // ✅ SAFE AREA for all mobiles
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  maxHeight: "85%",
  elevation: 10,
},

modalTitle: {
  fontSize: 22,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: 12,
},

modalSubtitle: {
  fontSize: 17,
  fontWeight: "600",
  marginTop: 14,
  marginBottom: 6,
},

modalText: {
  fontSize: 15,
  color: "#333",
  marginVertical: 3,
  lineHeight: 20,
},

/* Action buttons row (Edit / Delete) */
modalActionRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 18,
  marginBottom: 10,
},

modalBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  width: "48%",
  paddingVertical: 14,
  borderRadius: 12,
  elevation: 2,
},

modalBtnText: {
  color: "#fff",
  fontWeight: "600",
  marginLeft: 6,
  fontSize: 15,
},

/* Close button */
closeButton: {
  backgroundColor: "#2196F3",
  paddingVertical: 16,        // taller & touch-friendly
  borderRadius: 14,
  marginTop: 14,
  marginBottom: 16,          // ✅ KEY: avoids gesture bar overlap
  elevation: 3,
},

closeButtonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "700",
  textAlign: "center",
},

});

export default AdminManageOrdersScreen;
