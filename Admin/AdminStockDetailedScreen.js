import React, { useState,useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
const StockDetailsScreen = () => {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState(''); // JSON string for bulk upload
  const navigation = useNavigation();
const fileInputRefStock = useRef(null);
  // Stock state
  const [stockData, setStockData] = useState([
 
  ]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(20);
const [filters, setFilters] = useState({
  inputDateTime: '', // initial value
  c2Code: '',
  storeId: '',
  prodCode: '',
  itemCodes: '',
  apiKey: '' // new field
});
  // Single item form state
  const [newStock, setNewStock] = useState({
    c_item_code: '',
    item_name: '',
    item_qty_per_box: '',
    batch_no: '',
    stock_bal_qty: '',
    expiry_date: ''
  });

  // Pagination logic
const indexOfLastItem = currentPage * rowsPerPage;
const indexOfFirstItem = indexOfLastItem - rowsPerPage;

const filteredData = stockData.filter(item =>
  item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
  item.c_item_code?.toLowerCase().includes(search.toLowerCase())
);

const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  // --- SINGLE STOCK ADD ---
  const handleSaveStock = async () => {
    try {
      const { c_item_code, item_name, item_qty_per_box, batch_no, stock_bal_qty, expiry_date } = newStock;
      if (!c_item_code || !item_name || !item_qty_per_box || !stock_bal_qty) {
        alert('Please fill all required fields.');
        return;
      }

      const response = await fetch('https://hospitaldatabasemanagement.onrender.com/ecogreensingleapis/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStock),
      });

      const data = await response.json();

      if (data.success) {
        alert('Stock added successfully!');
        setShowForm(false);

        setStockData(prev => [
          ...prev,
          {
            id: data.stock.id.toString(),
            code: data.stock.c_item_code,
            name: data.stock.item_name,
            qtyBox: data.stock.item_qty_per_box,
            batch: data.stock.batch_no,
            balance: data.stock.stock_bal_qty,
            expiry: data.stock.expiry_date,
            status: null,
            expiryStatus: null
          }
        ]);

        setNewStock({
          c_item_code: '',
          item_name: '',
          item_qty_per_box: '',
          batch_no: '',
          stock_bal_qty: '',
          expiry_date: ''
        });
      } else {
        alert(data.error || 'Failed to add stock.');
      }
    } catch (err) {
      console.error(err);
      alert('Server error. Please try again.');
    }
  };

  // --- BULK UPLOAD ---
const handleStockBulkUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file); // MUST match multer field name

  try {
    const response = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/ecogreenbulkupload/stockbulk-upload-csv",
      {
        method: "POST",
        body: formData,
      }
    );
    const result = await response.json();
    if (response.ok) {
      alert(`Successfully uploaded ${result.totalStocks} stock records!`);
    } else {
      alert(result.error || "Upload failed");
    }
  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }
};

// --- FETCH STOCK DATA ---
const handleFetchStock = async () => {
  try {
    setLoading(true);
    setCurrentPage(1);

    // Prepare itemCodes array
    const itemsArray = filters.itemCodes
      ? filters.itemCodes.split(',').map(code => code.trim()).filter(Boolean)
      : [];

    // Format inputDateTime
    const d = filters.inputDateTime ? new Date(filters.inputDateTime) : new Date();
    const pad = n => n.toString().padStart(2, '0');
    const formattedDateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    const requestBody = {
      c2Code: filters.c2Code || "",
      storeId: filters.storeId || "",
      prodCode: filters.prodCode || "",
      inputDateTime: formattedDateTime,
      itemCodes: itemsArray,
      apiKey: filters.apiKey || ""
    };

    console.log("REQUEST BODY:", requestBody);

    // Call backend
    const response = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/ecogreen/stock-details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("SERVER ERROR:", text);
      throw new Error("Server responded with error");
    }

    const data = await response.json();
    console.log("PARSED DATA:", data);

    // Use the new key `stockItems` from backend
    const stockArray = data.stockItems || [];
    console.log("STOCK ARRAY:", stockArray);

    if (!Array.isArray(stockArray) || stockArray.length === 0) {
      setStockData([]);
      Alert.alert("No Data", "No stock records found.");
      return;
    }

    // Format stock data
   const formattedStock = stockArray.map((item, index) => ({
  id: index.toString(),
  c_item_code: item.c_item_code,
  item_name: item.itemName,
  item_qty_per_box: item.itemQtyPerBox,
  batch_no: item.batchNo,
  stock_bal_qty: item.stockBalQty,
  expiry_date: item.expiryDate,
  // status: item.stockBalQty <= 5 ? 'Low' : null,
  // expiryStatus: null
}));

    console.log("FORMATTED STOCK:", formattedStock);
    setStockData(formattedStock);

  } catch (err) {
    console.error("FETCH ERROR:", err);
    Alert.alert("Error", "Failed to fetch stock data.");
  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={24} color="#1E293B" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Stock Details</Text>
              <Text style={styles.headerSubTitle}>View current stock levels and batch information</Text>
            </View>
          </View>

         {/* FILTERS */}
<View style={styles.card}>
  <Text style={styles.cardTitle}>Filters</Text>
  <View style={styles.filterRow}>
  <FilterInput
    label="c2Code"
    placeholder="c2Code"
    value={filters.c2Code}
    onChange={val => setFilters({ ...filters, c2Code: val })}
  />
  <FilterInput
    label="storeId"
    placeholder="storeId"
    value={filters.storeId}
    onChange={val => setFilters({ ...filters, storeId: val })}
  />
  <FilterInput
    label="prodCode"
    placeholder="prodCode"
    value={filters.prodCode}
    onChange={val => setFilters({ ...filters, prodCode: val })}
  />

   <FilterInput
  label="API Key"
  placeholder="Enter API Key"
  value={filters.apiKey}
  onChange={val => setFilters({ ...filters, apiKey: val })}
/>
  <FilterInput
    label="Item Codes"
    placeholder="ITM001,ITM002"
    value={filters.itemCodes}
    onChange={val => setFilters({ ...filters, itemCodes: val })}
  />
  <FilterInput
  label="Input Date/Time (with seconds)"
  type="datetime-local"
  value={filters.inputDateTime}
  onChange={val => setFilters({ ...filters, inputDateTime: val })}
  step="1"
/>
</View>
  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
   <TouchableOpacity style={styles.fetchButton} onPress={handleFetchStock}>
  <Text style={styles.fetchButtonText}>
    {loading ? "Fetching..." : "🔍 Fetch Stock"}
  </Text>
</TouchableOpacity>

    <TouchableOpacity style={[styles.fetchButton, { backgroundColor: '#10B981' }]} onPress={() => setShowForm(true)}>
      <Text style={styles.fetchButtonText}>➕ Add Stock</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.bulkUploadButton}
      onPress={() => fileInputRefStock.current.click()}
    >
      <Text style={styles.bulkUploadButtonText}>📦 Stock Bulk Upload</Text>
    </TouchableOpacity>

    <input
      type="file"
      accept=".xlsx,.xls,.csv"
      ref={fileInputRefStock}
      style={{ display: 'none' }}
      onChange={handleStockBulkUpload}
    />
  </View>
</View>

          {/* STOCK TABLE */}
      {/* STOCK TABLE */}
<ScrollView horizontal showsHorizontalScrollIndicator>
  <View>
    {/* Table Header */}
    <View style={styles.tableHeader}>
      <Text style={[styles.columnHeader, { width: 100 }]}>Item Code</Text>
      <Text style={[styles.columnHeader, { width: 200 }]}>Item Name</Text>
      <Text style={[styles.columnHeader, { width: 100 }]}>Qty/Box</Text>
      <Text style={[styles.columnHeader, { width: 120 }]}>Batch No</Text>
      <Text style={[styles.columnHeader, { width: 120 }]}>Balance</Text>
      <Text style={[styles.columnHeader, { width: 150 }]}>Expiry Date</Text>
    </View>

    {/* Table Rows */}
    {currentItems.map(item => (
      <View key={item.id} style={styles.tableRow}>
        <Text style={[styles.cellText, { width: 100 }]}>{item.code || item.c_item_code}</Text>
        <Text style={[styles.cellText, { width: 200 }]}>{item.name || item.item_name}</Text>
        <Text style={[styles.cellText, { width: 100 }]}>{item.qtyBox || item.item_qty_per_box}</Text>
        <Text style={[styles.cellText, { width: 120 }]}>{item.batch_no}</Text>
        <View style={[styles.cellContainer, { width: 120, flexDirection: 'row' }]}>
          <Text style={styles.cellText}>{item.balance || item.stock_bal_qty}</Text>
          {/* {item.status && <View style={styles.lowBadge}><Text style={styles.badgeText}>{item.status}</Text></View>} */}
        </View>
        <Text style={[styles.cellText, { width: 150 }]}>{item.expiry || item.expiry_date}</Text>
      </View>
    ))}
  </View>
</ScrollView>
          <View style={{ 
  flexDirection: 'row', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginTop: 15 
}}>
  
  <TouchableOpacity
    style={{
      padding: 10,
      backgroundColor: '#2563EB',
      borderRadius: 6,
      opacity: currentPage === 1 ? 0.5 : 1
    }}
    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
  >
    <Text style={{ color: '#fff' }}>⬅ Prev</Text>
  </TouchableOpacity>

  <Text>
    Page {currentPage} of {totalPages || 1}
  </Text>

  <TouchableOpacity
    style={{
      padding: 10,
      backgroundColor: '#2563EB',
      borderRadius: 6,
      opacity: currentPage === totalPages ? 0.5 : 1
    }}
    onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
  >
    <Text style={{ color: '#fff' }}>Next ➡</Text>
  </TouchableOpacity>

  {/* Rows per page */}
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <Text>Rows:</Text>
    <TextInput
      style={{
        borderWidth: 1,
        borderColor: '#E2E8F0',
        width: 50,
        textAlign: 'center',
        borderRadius: 5,
        padding: 4
      }}
      keyboardType="numeric"
      value={rowsPerPage.toString()}
      onChangeText={(val) => {
        const num = parseInt(val) || 1;
        setRowsPerPage(num);
        setCurrentPage(1);
      }}
    />
  </View>
</View>
        </ScrollView>
      </View>

      

      {/* SINGLE STOCK MODAL */}
      <Modal visible={showForm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentDesktop}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Stock Entry</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingVertical: 20 }}>
              <FormInput label="Item Code" value={newStock.c_item_code} onChangeText={t => setNewStock({ ...newStock, c_item_code: t })} />
              <FormInput label="Item Name" value={newStock.item_name} onChangeText={t => setNewStock({ ...newStock, item_name: t })} />
              <FormInput label="Qty Per Box" keyboardType="numeric" value={newStock.item_qty_per_box} onChangeText={t => setNewStock({ ...newStock, item_qty_per_box: t })} />
              <FormInput label="Batch Number" value={newStock.batch_no} onChangeText={t => setNewStock({ ...newStock, batch_no: t })} />
              <FormInput label="Stock Balance Qty" keyboardType="numeric" value={newStock.stock_bal_qty} onChangeText={t => setNewStock({ ...newStock, stock_bal_qty: t })} />
              <FormInput label="Expiry Date" placeholder="YYYY-MM-DD" value={newStock.expiry_date} onChangeText={t => setNewStock({ ...newStock, expiry_date: t })} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStock}><Text style={styles.saveBtnText}>Save Stock</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BULK UPLOAD MODAL */}
      {/* <Modal visible={showBulkModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentDesktop}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Upload Stocks</Text>
              <TouchableOpacity onPress={() => setShowBulkModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingVertical: 20 }}>
              <TextInput
                style={[styles.input, { height: 200 }]}
                placeholder='Enter JSON array of stock items'
                multiline
                value={bulkData}
                onChangeText={setBulkData}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBulkModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleBulkUpload}><Text style={styles.saveBtnText}>Upload Bulk</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> */}

    </View>
  );
};

const FilterInput = ({ label, placeholder, type = "text", value, onChange, step }) => (
  <View style={styles.filterItem}>
    <Text style={styles.filterLabel}>{label}</Text>
    {type === "datetime-local" ? (
      <input
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 6,
          border: '1px solid #E2E8F0',
          fontSize: 14,
          backgroundColor: '#F8FAFC',
          color: '#000'
        }}
        type={type}
        step={step || "1"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChange}
      />
    )}
  </View>
);
const FormInput = ({ label, ...props }) => (
  <View style={styles.formItem}>
    <Text style={styles.filterLabel}>{label}</Text>
    <TextInput style={styles.input} {...props} placeholderTextColor="#94A3B8" />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  mainContent: { flex: 1 },
  scrollContent: { padding: 25 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backButton: { marginRight: 15, padding: 6 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  headerSubTitle: { color: '#64748B', marginTop: 4, marginBottom: 25 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#334155' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  filterItem: { flex: 1, minWidth: 200 },
  filterLabel: { fontSize: 13, color: '#64748B', marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, padding: 10, fontSize: 14 },
  fetchButton: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, justifyContent: 'center' },
  fetchButtonText: { color: '#FFFFFF', fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderColor: '#F1F5F9', padding: 10, borderRadius: 6, marginBottom: 15, width: 300 },
  tableSearch: { marginLeft: 10, flex: 1 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 10 },
  columnHeader: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  cellText: { color: '#334155', fontSize: 14 },
  cellContainer: { alignItems: 'center' },
  lowBadge: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 5 },
  expiryBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 5 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContentDesktop: { backgroundColor: '#FFFFFF', width: '80%', maxWidth: 800, borderRadius: 12, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, maxHeight: '90%', display: 'flex', flexDirection: 'column' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  modalBody: { flexGrow: 1, paddingHorizontal: 20 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'flex-end', gap: 10, backgroundColor: '#F9FAFB' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600' },
   bulkUploadButton: { backgroundColor: '#F59E0B', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
bulkUploadButtonText: { color: 'white', fontWeight: '600' },
});

export default StockDetailsScreen;