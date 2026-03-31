import React, { useState, useRef } from 'react';import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  Modal,  
  Alert  // <-- add this

} from 'react-native';
import { 
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  Plus,
  Upload,
  X,
  Trash2
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
const { width } = Dimensions.get('window');

const EcoGreenPurchaseorders = ({ navigation }) => {
  // const [orders] = useState([
  //   { id: '1', brCode: 'BR001', year: '2026', prefix: 'PO', srNo: '001', customer: 'Cipla Ltd', ref: 'Q1 Supply', total: '₹1,25,000' },
  //   { id: '2', brCode: 'BR001', year: '2026', prefix: 'PO', srNo: '002', customer: 'Sun Pharma', ref: 'Monthly Stock', total: '₹89,000' },
  //   { id: '3', brCode: 'BR002', year: '2026', prefix: 'PO', srNo: '003', customer: 'Dr. Reddy\'s', ref: 'Emergency Order', total: '₹54,000' },
  //   { id: '4', brCode: 'BR003', year: '2026', prefix: 'PO', srNo: '004', customer: 'Lupin Pharma', ref: 'Q1 Restock', total: '₹67,500' },
  // ]);
const fileInputRef = useRef(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
const [bulkFile, setBulkFile] = useState(null);
  // New State for Modal and Form
  const [isModalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('single'); // 'single' or 'bulk'
  const [formData, setFormData] = useState({
    br_code: "",
    year: "",
    prefix: "",
    srno: "",
    custcode: "",
    custname: "",
    refcode: "",
    refname: "",
    total: "",
    details: [{ itemCode: "196110", itemName: "1 AL AX CAP 10'S", Qty: 100, schemeQty: 0, rate: 0 }]
  });
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(false);
const [filters, setFilters] = useState({
  c2Code: "",
  storeId: "",
  prodCode: "",
  apiKey: "",
  fromDate: "",
  toDate: ""
});

const [expandedRows, setExpandedRows] = useState([]);

const toggleRow = (id) => {
  if (expandedRows.includes(id)) {
    setExpandedRows(expandedRows.filter(rowId => rowId !== id));
  } else {
    setExpandedRows([...expandedRows, id]);
  }
};
  const addDetailRow = () => {
    setFormData({
      ...formData,
      details: [...formData.details, { itemCode: "", itemName: "", Qty: 0, schemeQty: 0, rate: 0 }]
    });
  };
   const submitSingleOrder = async () => {
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/ecogreensingleapis/purchase-order/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
    if (data.success) {
  window.alert('Purchase order created!');
  setModalVisible(false);
} else {
  window.alert(data.message || 'Error creating order');
}
    } catch (err) {
      console.error(err);
      window.alert('Error', 'Server error');
    }
  };

 
// -----------------------------
// BULK ORDER SUBMIT (CSV + Excel)
// -----------------------------
const selectBulkFile = async () => {
  if (Platform.OS === 'web') {
    // Trigger hidden input for web
    if (fileInputRef.current) fileInputRef.current.click();
  } else {
    // Use expo-document-picker for mobile
    const result = await DocumentPicker.getDocumentAsync({ 
      type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'] 
    });
    
    if (result.type === 'success') setBulkFile(result);
  }
};



// Handle file selection
const onFileChangeWeb = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'xls', 'xlsx'].includes(ext)) {
    return alert('Please select a CSV or Excel file');
  }

  setBulkFile(file);
  submitBulkOrderWeb(file); // immediately upload
};

const submitBulkOrderWeb = async (file) => {
  const form = new FormData();
  form.append('file', file);

  try {
    const res = await fetch('https://hospitaldatabasemanagement.onrender.com/ecogreenbulkupload/purchase-order/bulk', {
      method: 'POST',
      body: form,
    });

    const data = await res.json();
    if (data.success) {
      alert(`Success! ${data.inserted} purchase orders uploaded`);
      setBulkFile(null);
      setModalVisible(false);
      fetchOrders(); // refresh list
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
};
const fetchOrders = async () => {
  const { c2Code, storeId, prodCode, apiKey, fromDate, toDate } = filters;

  if (!c2Code || !storeId || !prodCode || !apiKey || !fromDate || !toDate) {
    return alert("All filter fields are required!");
  }

  setLoading(true);
  try {
    const res = await fetch('https://hospitaldatabasemanagement.onrender.com/ecogreen/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c2Code, storeId, prodCode, apiKey, fromDate, toDate })
    });

    const data = await res.json();

    if (data.success) {
      setOrders(data.data);
    } else {
      alert(data.error || 'Failed to fetch purchase orders');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.contentArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <ChevronLeft size={24} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.breadcrumb}>View purchase orders from Ecogreen ERP</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Filters</Text>
            <View style={styles.filterGrid}>
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>c2Code</Text>
<TextInput
  style={styles.input}
  placeholder="c2Code"
  value={filters.c2Code}
  onChangeText={(text) => setFilters({...filters, c2Code: text})}
/>              </View>
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>storeId</Text>
<TextInput
  style={styles.input}
  placeholder="storeId"
  value={filters.storeId}
  onChangeText={(text) => setFilters({...filters, storeId: text})}
/>              </View>
              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>prodCode</Text>
<TextInput
  style={styles.input}
  placeholder="prodCode"
  value={filters.prodCode}
  onChangeText={(text) => setFilters({...filters, prodCode: text})}
/>              </View>
               <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>securityKey</Text>
<TextInput
  style={styles.input}
  placeholder="securityKey"
  value={filters.apiKey}
  onChangeText={(text) => setFilters({...filters, apiKey: text})}
/>              </View>

              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>From Date</Text>
                {Platform.OS === 'web' ? (
<input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} style={styles.webDateInput} />
                ) : (
                  <View style={styles.dateInput}>
                    <Text style={styles.datePlaceholder}>{fromDate || 'dd-mm-yyyy'}</Text>
                    <CalendarIcon size={14} color="#64748b" />
                  </View>
                )}
              </View>

              <View style={styles.filterInputGroup}>
                <Text style={styles.inputLabel}>To Date</Text>
                {Platform.OS === 'web' ? (
<input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} style={styles.webDateInput} />                ) : (
                  <View style={styles.dateInput}>
                    <Text style={styles.datePlaceholder}>{toDate || 'dd-mm-yyyy'}</Text>
                    <CalendarIcon size={14} color="#64748b" />
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <TouchableOpacity style={styles.fetchButton} onPress={fetchOrders}>
  <Search color="#fff" size={16} style={{ marginRight: 8 }} />
  <Text style={styles.fetchButtonText}>
    {loading ? "Fetching..." : "Fetch Purchase Orders"}
  </Text>
</TouchableOpacity>

              {/* NEW BUTTON ADDED HERE */}
              <TouchableOpacity 
                style={[styles.fetchButton, { backgroundColor: '#0f172a', marginLeft: 12 }]}
                onPress={() => setModalVisible(true)}
              >
                <Plus color="#fff" size={16} style={{marginRight: 8}} />
                <Text style={styles.fetchButtonText}>Create / Bulk Upload</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <View style={{width: 40}} />
              <Text style={styles.headerCell}>BR Code</Text>
              <Text style={styles.headerCell}>Year</Text>
              <Text style={styles.headerCell}>Prefix</Text>
              <Text style={styles.headerCell}>SR No</Text>
                <Text style={[styles.headerCell, {flex: 2}]}>Customer Code</Text>

              <Text style={[styles.headerCell, {flex: 2}]}>Customer</Text>
               <Text style={[styles.headerCell, {flex: 2}]}>Ref Code</Text>

              <Text style={[styles.headerCell, {flex: 2}]}>Ref Name</Text>
              <Text style={[styles.headerCell, {textAlign: 'right'}]}>Total</Text>
            </View>

         {orders.map((item) => (
  <View key={item.id}>
    <TouchableOpacity 
      style={styles.tableRow} 
      onPress={() => toggleRow(item.id)}
    >
      <View style={{width: 40, alignItems: 'center'}}>
          <ChevronLeft size={14} color="#64748b" />
      </View>
      <Text style={styles.cellText}>{item.br_code}</Text>
      <Text style={styles.cellText}>{item.year}</Text>
      <Text style={styles.cellText}>{item.prefix}</Text>
      <Text style={styles.cellText}>{item.srno}</Text>
      <Text style={styles.cellText}>{item.custcode}</Text>
      <Text style={[styles.cellText, {flex: 2}]}>{item.custname }</Text>
      <Text style={styles.cellText}>{item.refcode}</Text>
      <Text style={[styles.cellText, {flex: 2}]}>{item.refname}</Text>
      <Text style={[styles.cellText, {fontWeight: '600', textAlign: 'right'}]}>{item.total}</Text>
    </TouchableOpacity>

    {/* Nested Details Table */}
    {expandedRows.includes(item.id) && (
      <View style={{ marginLeft: 40, marginRight: 10, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: '#e2e8f0', paddingLeft: 10 }}>
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 5 }}>
          <Text style={[styles.headerCell, {flex: 1}]}>Item Code</Text>
          <Text style={[styles.headerCell, {flex: 2}]}>Item Name</Text>
          <Text style={[styles.headerCell, {flex: 1}]}>Qty</Text>
          <Text style={[styles.headerCell, {flex: 1}]}>Scheme Qty</Text>
          <Text style={[styles.headerCell, {flex: 1}]}>Rate</Text>
        </View>
        {item.details.map((detail, idx) => (
          <View key={idx} style={{ flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
            <Text style={[styles.cellText, {flex: 1}]}>{detail.itemCode}</Text>
            <Text style={[styles.cellText, {flex: 2}]}>{detail.itemName}</Text>
            <Text style={[styles.cellText, {flex: 1}]}>{detail.Qty}</Text>
            <Text style={[styles.cellText, {flex: 1}]}>{detail.schemeQty}</Text>
            <Text style={[styles.cellText, {flex: 1}]}>{detail.rate}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* NEW MODAL FOR ADDING PO */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.cardTitle}>Manage Purchase Orders</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, formType === 'single' && styles.activeTab]} 
                onPress={() => setFormType('single')}
              >
                <Text style={formType === 'single' ? styles.activeTabText : styles.tabText}>Single Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, formType === 'bulk' && styles.activeTab]} 
                onPress={() => setFormType('bulk')}
              >
                <Text style={formType === 'bulk' ? styles.activeTabText : styles.tabText}>Bulk Upload</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {formType === 'single' ? (
                <View>
                  <View style={styles.filterGrid}>
                    {['br_code', 'year', 'prefix', 'srno', 'custcode', 'custname', 'refcode', 'refname', 'total'].map((field) => (
                      <View key={field} style={styles.filterInputGroup}>
                        <Text style={styles.inputLabel}>{field.replace('_', ' ').toUpperCase()}</Text>
                        <TextInput 
                          style={styles.input} 
                          value={String(formData[field])}
                          onChangeText={(text) => setFormData({...formData, [field]: text})}
                        />
                      </View>
                    ))}
                  </View>
                  
                  <Text style={[styles.inputLabel, {marginTop: 10}]}>ITEM DETAILS</Text>
                  {formData.details.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                       <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Code" value={item.itemCode} />
                       <TextInput style={[styles.input, {flex: 2, marginRight: 5}]} placeholder="Item Name" value={item.itemName} />
                       <TextInput style={[styles.input, {flex: 0.8}]} placeholder="Qty" keyboardType="numeric" value={String(item.Qty)} />
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addButton} onPress={addDetailRow}>
                    <Plus size={14} color="#2563eb" />
                    <Text style={{color: '#2563eb', marginLeft: 5}}>Add Item</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.bulkContainer}>
                  <Upload size={40} color="#94a3b8" />
                  <Text style={{marginTop: 10, color: '#64748b'}}>Drag & Drop or Click to Upload CSV</Text>
             <View style={{ marginTop: 20, width: '100%' }}>
  <TouchableOpacity
    style={[styles.fetchButton, { alignSelf: 'flex-start' }]}
    onPress={selectBulkFile}
  >
    <Text style={styles.fetchButtonText}>
      {bulkFile ? bulkFile.name : 'Select File'}
    </Text>
  </TouchableOpacity>

  {Platform.OS === 'web' && (
    <input
      type="file"
      ref={fileInputRef}
      style={{ display: 'none' }}
      accept=".csv,.xls,.xlsx"
      onChange={onFileChangeWeb}
    />
  )}
</View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
 <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={formType === 'single' ? submitSingleOrder : submitBulkOrderWeb}
              >                <Text style={styles.fetchButtonText}>Submit Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9' },
  contentArea: { flex: 1 },
  topHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 25 },
  breadcrumb: { color: '#64748b', fontSize: 13 },
  scrollContent: { padding: 25 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 25, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 22, fontWeight: '600', color: '#1e293b', marginBottom: 25 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  filterInputGroup: { flex: 1, minWidth: 160, paddingHorizontal: 6, marginBottom: 15 },
  inputLabel: { fontSize: 13, color: '#334155', fontWeight: '600', marginBottom: 10 },
  input: { height: 42, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#1e293b' },
  dateInput: { height: 42, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datePlaceholder: { color: '#94a3b8', fontSize: 14 },
  webDateInput: { height: 42, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, fontSize: 14, color: '#1e293b' },
  fetchButton: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, alignSelf: 'flex-start', marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  fetchButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  tableCard: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerCell: { flex: 1, fontSize: 13, fontWeight: '600', color: '#64748b' },
  tableRow: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc', alignItems: 'center' },
  cellText: { flex: 1, fontSize: 14, color: '#334155' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: width > 800 ? 700 : '90%', maxHeight: '85%', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 20 },
  tab: { paddingVertical: 12, marginRight: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { color: '#64748b', fontWeight: '500' },
  activeTabText: { color: '#2563eb', fontWeight: '600' },
  itemRow: { flexDirection: 'row', marginBottom: 8 },
  addButton: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  bulkContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'flex-end' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 }
});

export default EcoGreenPurchaseorders;