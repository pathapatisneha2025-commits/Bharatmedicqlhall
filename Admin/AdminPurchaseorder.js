import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import * as XLSX from "xlsx";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminPurchaseOrder() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [newPO, setNewPO] = useState({ supplier: "", delivery_type: "", received_date: "" });
  const [itemInputs, setItemInputs] = useState([{ medicine_id: "", stock: "", unitPrice: "" }]);
  const [medicines, setMedicines] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});

  // ========== ALERT ==========
  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      alert(`${title}\n\n${message}`);
    }
  };

  // ========== FETCH DATA ==========
  const fetchMedicines = async () => {
    try {
      const res = await fetch(`${BASE_URL}/medicine/all`);
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchPOs = async () => {
    try {
      const res = await fetch(`${BASE_URL}/purchase-orders/all`);
      const data = await res.json();
      if (data.success) setPurchaseOrders(data.data);
    } catch (err) {
      showAlert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryBoys = async () => {
    try {
      const res = await fetch(`${BASE_URL}/employee/all`);
      const data = await res.json();
      if (data.success) {
        const deliveryBoysData = data.employees
          .filter((e) => e.role?.toLowerCase() === "hd delivery")
          .map((e) => ({ id: e.id, name: e.full_name }));
        setDeliveryBoys(deliveryBoysData);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const res = await fetch(`${BASE_URL}/purchaseorderfields/all`);
      const data = await res.json();
      if (data.success) {
        setCustomFields(data.fields || []);
        const initialValues = {};
        (data.fields || []).forEach((f) => (initialValues[f.key] = ""));
        setCustomFieldValues(initialValues);
      }
    } catch (err) {
      console.error("Failed to fetch custom fields:", err);
    }
  };

  useEffect(() => {
    fetchPOs();
    fetchMedicines();
    fetchDeliveryBoys();
    fetchCustomFields();
  }, []);

  // ========== INPUT ROWS ==========
  const removeInputRow = (index) => setItemInputs(itemInputs.filter((_, i) => i !== index));
  const addInputRow = () => setItemInputs([...itemInputs, { medicine_id: "", stock: "", unitPrice: "" }]);
  const updateInputRow = (index, field, value) => {
    const updated = [...itemInputs];
    updated[index][field] = value;
    setItemInputs(updated);
  };

  // ========== CREATE SINGLE PO ==========
  const handleAddPO = async () => {
    const filledItems = itemInputs.map((item) => {
      const selectedMedicine = medicines.find((med) => med.id === parseInt(item.medicine_id));
      return {
        medicine_id: parseInt(item.medicine_id),
        name: selectedMedicine?.name || "",
        stock: parseInt(item.stock),
        unitPrice: parseFloat(item.unitPrice),
      };
    });

    if (!newPO.supplier || !newPO.delivery_type || filledItems.length === 0) {
      showAlert("Validation", "Supplier, delivery type, and at least one item are required");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/purchase-orders/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: newPO.supplier,
          delivery_type: newPO.delivery_type,
          received_date: newPO.received_date,
          assignedto: newPO.delivery_boy || null,
          status: "Pending",
          items: filledItems,
          custom_fields: customFieldValues,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalVisible(false);
        setNewPO({ supplier: "", delivery_type: "", received_date: "" });
        setItemInputs([{ medicine_id: "", stock: "", unitPrice: "" }]);
        fetchPOs();
        showAlert("Success", "Purchase Order created");
      } else {
        showAlert("Error", "Failed: " + (data.message || ""));
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to create purchase order");
    }
  };

  // ========== RECEIVE PO ==========
  const handleReceivePO = async (po) => {
    try {
      if (!po.purchase_items || po.purchase_items.length === 0) {
        showAlert("Error", "No items in this PO to receive.");
        return;
      }
      const stockUpdates = po.purchase_items.map((item) => ({
        medicine_id: item.medicine_id,
        stock: item.stock,
      }));

      const res = await fetch(`${BASE_URL}/purchase-orders/receive/${po.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          received_date: new Date().toISOString(),
          items: stockUpdates,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showAlert("Success", "Purchase order received and stock updated.");
        fetchPOs();
        fetchMedicines();
      } else {
        showAlert("Error", data.message || "Failed to receive PO");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Something went wrong while receiving PO");
    }
  };

  // ========== STATUS BADGE ==========
  const StatusBadge = ({ status }) => (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        backgroundColor: status === "Received" ? "#DCFCE7" : "#FEF3C7",
        fontWeight: "700",
        fontSize: 11,
      }}
    >
      {status}
    </span>
  );

  // ===================== FILE UPLOAD ==========
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = async (evt) => {
    const data = evt.target.result;
    
    // Use cellDates to handle Excel dates properly
    const workbook = XLSX.read(data, { type: "binary", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const formattedOrders = sheetData.map((row) => {
      // Robust Date Handling
      let formattedDate = row.received_date;
      if (row.received_date instanceof Date) {
        formattedDate = row.received_date.toISOString();
      } else if (!row.received_date) {
        formattedDate = new Date().toISOString(); // Fallback
      }

      return {
        supplier: String(row.supplier || "Unknown"),
        delivery_type: String(row.delivery_type || "Standard"),
        received_date: formattedDate,
        assignedto: row.delivery_boy ? String(row.delivery_boy) : null,
        status: "Pending",
        // Ensure numbers are actually numbers and strings are strings
        purchase_items: [
          {
            medicine_id: parseInt(row.medicine_id, 10),
            stock: parseInt(row.stock, 10) || 0,
            unitPrice: parseFloat(row.unitPrice) || 0,
            name: String(row.medicine_name || "")
          }
        ]
      };
    });

    try {
      const res = await fetch(`${BASE_URL}/purchase-orders/bulk-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Ensure the entire payload is a clean JSON string
        body: JSON.stringify({ purchaseOrders: formattedOrders }),
      });
      
      const result = await res.json();
      if (result.success) {
        alert("Bulk purchase orders inserted successfully");
        fetchPOs(); 
      } else {
        alert("Server Error: " + (result.detail || result.message));
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Network error: Could not reach the server.");
    }
  };
  reader.readAsBinaryString(file);
};
  // ===================== RENDER =====================
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F1F5F9" }}>
      {/* SIDEBAR */}
      <div style={{ width: 300, backgroundColor: "#0288D1", padding: 30, display: "flex", flexDirection: "column" }}>
        <div style={{ width: 50, height: 50, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, justifyContent: "center", alignItems: "center", display: "flex", marginBottom: 20 }}>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: 20 }}>BM</span>
        </div>
        <h2 style={{ color: "#fff", fontSize: 28, marginBottom: 15 }}>Purchase Dashboard</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 40 }}>Manage procurement and track vendor delivery status.</p>
        <div style={{ backgroundColor: "rgba(0,0,0,0.1)", padding: 20, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, textTransform: "uppercase" }}>Total Orders</div>
          <div style={{ color: "#fff", fontSize: 32, fontWeight: "bold" }}>{purchaseOrders.length}</div>
        </div>
        <button style={{ backgroundColor: "#00CFD5", padding: 18, borderRadius: 12, color: "#fff", fontWeight: "bold", cursor: "pointer" }} onClick={() => setModalVisible(true)}>+ Create New PO</button>
        <div style={{ marginTop: 20 }}>
          <label style={{ color: "#fff", fontWeight: "bold" }}>Import CSV/Excel</label>
          <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} style={{ marginTop: 10 }} />
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, padding: 40, overflow: "auto" }}>
        <div style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", minWidth: "100%" }}>
          {/* TABLE HEADER */}
          <div style={{ display: "flex", backgroundColor: "#F8FAFC", padding: 20, borderBottom: "1px solid #E2E8F0", fontWeight: "700", fontSize: 13, color: "#64748b" }}>
            <div style={{ flex: 0.8 }}>PO #</div>
            <div style={{ flex: 1.5 }}>Supplier</div>
            <div style={{ flex: 1.2 }}>Delivery</div>
            <div style={{ flex: 1 }}>Status</div>
            <div style={{ flex: 2 }}>Items Summary</div>
            <div style={{ flex: 1, textAlign: "right" }}>Actions</div>
          </div>

          {loading ? (
            <div style={{ margin: 50, textAlign: "center" }}><span>Loading...</span></div>
          ) : (
            purchaseOrders.map((item, index) => (
              <div key={item.id} style={{ display: "flex", padding: 20, alignItems: "center", backgroundColor: index % 2 === 0 ? "#fff" : "#FBFDFF", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ flex: 0.8, fontWeight: "bold" }}>{item.purchase_no}</div>
                <div style={{ flex: 1.5 }}>{item.supplier}</div>
                <div style={{ flex: 1.2 }}>{item.delivery_type}</div>
                <div style={{ flex: 1 }}><StatusBadge status={item.status} /></div>
                <div style={{ flex: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.purchase_items?.map((i) => `${i.name} (${i.stock})`).join(", ")}
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  {item.status !== "Received" && <button style={{ backgroundColor: "#E0F2FE", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }} onClick={() => handleReceivePO(item)}>Receive</button>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalVisible && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", width: "90%", maxWidth: 800, maxHeight: "85%", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 24, borderBottom: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 20, fontWeight: "bold" }}>Create New Purchase Order</h3>
              <button onClick={() => setModalVisible(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><Ionicons name="close" size={24} color="#64748b" /></button>
            </div>
            <div style={{ padding: 24, overflow: "auto", flex: 1 }}>
              {/* Basic Info */}
              <label style={{ fontWeight: "600", color: "#64748b", marginBottom: 12 }}>Supplier Name</label>
              <input type="text" value={newPO.supplier} onChange={(e) => setNewPO({ ...newPO, supplier: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 15, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <label style={{ fontWeight: "600", color: "#64748b", marginBottom: 12 }}>Delivery Type</label>
              <input type="text" value={newPO.delivery_type} onChange={(e) => setNewPO({ ...newPO, delivery_type: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 15, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <label style={{ fontWeight: "600", color: "#64748b", marginBottom: 12 }}>Expected Date (YYYY-MM-DD)</label>
              <input type="text" value={newPO.received_date} onChange={(e) => setNewPO({ ...newPO, received_date: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 15, borderRadius: 8, border: "1px solid #E2E8F0" }} />

              <label style={{ fontWeight: "600", color: "#64748b", marginBottom: 12 }}>Assign Delivery Boy</label>
              <select value={newPO.delivery_boy || ""} onChange={(e) => setNewPO({ ...newPO, delivery_boy: e.target.value })} style={{ width: "100%", padding: 12, marginBottom: 15, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <option value="">Select Delivery Boy</option>
                {deliveryBoys.map((boy) => <option key={boy.id} value={boy.id}>{boy.name}</option>)}
              </select>

              {/* Custom Fields */}
       {customFields.length > 0 && customFields.map((field) => (
  <div key={field.field_name}>
    <label style={{ fontWeight: "600", color: "#64748b", marginBottom: 12 }}>
      {field.field_name} {/* display the field name */}
      {field.is_required ? " *" : ""}
    </label>
    <input
      type={field.field_type || "text"} // use type from API
      value={customFieldValues[field.field_name] || ""}
      onChange={(e) =>
        setCustomFieldValues({ ...customFieldValues, [field.field_name]: e.target.value })
      }
      style={{
        width: "100%",
        padding: 12,
        marginBottom: 15,
        borderRadius: 8,
        border: "1px solid #E2E8F0",
      }}
    />
  </div>
))}

              {/* Order Items */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: "600", color: "#64748b" }}>Order Items</span>
                <button onClick={addInputRow} style={{ color: "#0288D1", fontWeight: "bold", background: "none", border: "none", cursor: "pointer" }}>+ Add Row</button>
              </div>
              {itemInputs.map((item, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 10 }}>
                  <select value={item.medicine_id} onChange={(e) => updateInputRow(index, "medicine_id", e.target.value)} style={{ flex: 3, padding: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                    <option value="">Select Medicine</option>
                    {medicines.map((med) => <option key={med.id} value={med.id}>{med.name}</option>)}
                  </select>
                  <input type="number" placeholder="Stock" value={item.stock} onChange={(e) => updateInputRow(index, "stock", e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <input type="number" placeholder="Price" value={item.unitPrice} onChange={(e) => updateInputRow(index, "unitPrice", e.target.value)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <button onClick={() => removeInputRow(index)} style={{ color: "red", fontWeight: "bold", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: 24, gap: 15, borderTop: "1px solid #F1F5F9" }}>
              <button onClick={() => setModalVisible(false)} style={{ padding: 15 }}>Cancel</button>
              <button onClick={handleAddPO} style={{ backgroundColor: "#0288D1", padding: "15px 25px", borderRadius: 10, color: "#fff", fontWeight: "bold" }}>Create Purchase Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#F1F5F9" },
  webContainer: { flex: 1, flexDirection: "row" },
  sidebar: { width: 300, backgroundColor: "#0288D1", padding: 30, justifyContent: "center" },
  logoBadge: { width: 50, height: 50, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  logoText: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  sidebarTitle: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 15 },
  sidebarDesc: { color: "rgba(255,255,255,0.7)", lineHeight: 22, marginBottom: 40 },
  statsCard: { backgroundColor: "rgba(0,0,0,0.1)", padding: 20, borderRadius: 12, marginBottom: 20 },
  statsLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, textTransform: "uppercase" },
  statsValue: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  newOrderBtn: { backgroundColor: "#00CFD5", padding: 18, borderRadius: 12, alignItems: "center" },
  newOrderBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  contentArea: { flex: 1, padding: 40 },
  tableCard: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F8FAFC", padding: 20, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  headerCell: { fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", padding: 20, alignItems: "center", borderBottomWidth: 1, borderColor: "#F1F5F9" },
  rowEven: { backgroundColor: "#fff" },
  rowOdd: { backgroundColor: "#FBFDFF" },
  cell: { fontSize: 15, color: "#334155" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeSuccess: { backgroundColor: "#DCFCE7" },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#92400E" },
  actionBtn: { backgroundColor: "#E0F2FE", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { color: "#0369A1", fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: "70%", maxHeight: "85%", borderRadius: 16, overflow: "hidden" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", padding: 24, borderBottomWidth: 1, borderColor: "#F1F5F9" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1E293B" },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 12 },
  formGrid: { flexDirection: "row", gap: 15 },
  webInput: { flex: 1, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", padding: 12, borderRadius: 8, marginBottom: 15 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 20 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addLink: { color: "#0288D1", fontWeight: "bold" },
  itemRow: { flexDirection: "row", alignItems: "center" },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", padding: 24, borderTopWidth: 1, borderColor: "#F1F5F9", gap: 15 },
  cancelBtn: { padding: 15 },
  submitBtn: { backgroundColor: "#0288D1", paddingHorizontal: 25, paddingVertical: 15, borderRadius: 10 },
  submitBtnText: { color: "#fff", fontWeight: "bold" },
});