import React, { useState ,useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, X } from 'lucide-react-native'; 

const ItemMasterScreen = () => {
  const navigation = useNavigation();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    c2Code: '', storeId: '', prodCode: '', dateTime: '',securityKey: ''
  });
  const fileInputRef = useRef(null);

const [tableData, setTableData] = useState([]);
const [loading, setLoading] = useState(false);
  // State for the Add Item Form
  const [newItem, setNewItem] = useState({
    item_code: '', item_name: '', item_short_name: '', item_full_name: '',
    brand_code: '', brand_name: '', category_code: '', category_name: '',
    content_code: '', content_name: '', pack_code: '', pack_name: '',
    item_qty_per_box: '', item_added_date: '', item_updated_date: '',
    hsn_sac_code: '', hsn_sac_name: ''
  });

  // Add pagination state at the top of your component
const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(20); // show 20 rows per page

// Compute paginated data
const indexOfLastItem = currentPage * rowsPerPage;
const indexOfFirstItem = indexOfLastItem - rowsPerPage;
const currentItems = tableData.slice(indexOfFirstItem, indexOfLastItem);

const totalPages = Math.ceil(tableData.length / rowsPerPage);

const handleNextPage = () => {
  if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
};

const handlePrevPage = () => {
  if (currentPage > 1) setCurrentPage(prev => prev - 1);
};
const handleBulkUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("https://hospitaldatabasemanagement.onrender.com/ecogreenbulkupload/upload-itemmaster", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    if (response.ok) {
      alert(`Successfully uploaded ${result.totalItems} items!`);
      // Optionally refresh tableData here
    } else {
      alert("Upload failed: " + result.error);
      console.error(result);
    }
  } catch (err) {
    console.error("Bulk upload error:", err);
    alert("Bulk upload failed. Check console for details.");
  }
};
  const handleGoBack = () => {
    navigation.canGoBack() ? navigation.goBack() : console.log('Back pressed');
  };
const handleSaveItem = async () => {
  if (!newItem.item_code) {
    alert("Item Code is required!");
    return;
  }

  try {
    const response = await fetch("https://hospitaldatabasemanagement.onrender.com/ecogreensingleapis/add-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newItem),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Item added successfully!");
      setShowForm(false);

      // Update tableData state to include the new item
      setTableData(prev => [
        ...prev,
        { ...newItem, id: (prev.length + 1).toString() } // give a temporary id
      ]);

      // Reset form
      setNewItem({
        item_code: '', item_name: '', item_short_name: '', item_full_name: '',
        brand_code: '', brand_name: '', category_code: '', category_name: '',
        content_code: '', content_name: '', pack_code: '', pack_name: '',
        item_qty_per_box: '', item_added_date: '', item_updated_date: '',
        hsn_sac_code: '', hsn_sac_name: ''
      });

    } else {
      alert("Failed to add item: " + (result.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Add Item API error:", err);
    alert("Something went wrong. Check console.");
  }
};
const fetchItemMaster = async () => {
  const { c2Code, storeId, prodCode, dateTime, securityKey } = filters;

  if (!c2Code || !storeId || !prodCode || !dateTime || !securityKey) {
    alert("Please fill all filter fields before fetching!");
    return;
  }

  try {
    setLoading(true);

    // Split date and time
    const [date, time] = dateTime.split('T');
    let formattedTime = time;
    if (time.split(':').length === 2) formattedTime += ":00"; // add seconds if missing
    const formattedDateTime = `${date} ${formattedTime}`;

    const body = {
      c2Code,
      storeId,
      prodCode,
      inputDateTime: formattedDateTime,
      apiKey: securityKey
    };

    console.log("Sending body:", body);

    const response = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/ecogreen/item-master",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert("Failed to fetch item master. See console for details.");
      console.error(result);
      return;
    }

    // Check if vendor returned items
    let itemsArray = [];
    if (Array.isArray(result.data)) {
      itemsArray = result.data;
    } else if (Array.isArray(result.insertedItems)) {
      itemsArray = result.insertedItems;
    } else {
      console.warn("Unexpected response format:", result);
    }

    // Map API response to tableData
    const mappedData = itemsArray.map(item => ({
      id: item.itemCode || item.itemCode,
      item_code: item.itemCode || item.itemCode,
      item_name: item.itemName || item.itemName,
      item_short_name: item.itemShortName || item.itemShortName,
      item_full_name: item.itemFullName || item.itemFullName,
      brand_code: item.brandCode ||item.brandCode,
      brand_name: item.brandName || item. brandName,
      category_code: item.categoryCode || item.categoryCode,
      category_name: item.categoryName || item.categoryName,
      content_code: item.contentCode || item.contentCode,
      content_name: item.contentName || item.contentName,
      pack_code: item.packCode || item. packCode,
      pack_name: item.packName || item.packName,
      item_qty_per_box: item.itemQtyPerBox || item.itemQtyPerBox,
      item_added_date: item.itemAddedDate || item.itemAddedDate,
      item_updated_date: item.itemUpdatedDate || item. itemUpdatedDate,
      hsn_sac_code: item.hsnSacCode || item.hsnSacCode,
      hsn_sac_name: item.hsnSacName || item.hsnSacName
    }));

    console.log("Mapped Data:", mappedData);
    setTableData(mappedData);

    alert(`Fetched ${mappedData.length} items successfully!`);

  } catch (err) {
    console.error("Fetch Item Master error:", err);
    alert("Error fetching item master. Check console.");
  } finally {
    setLoading(false);
  }
};

  // Updated Table Data with all fields
  // const tableData = [
  //   { 
  //     id: '1', 
  //     item_code: 'ITM001', 
  //     item_name: 'Paracetamol 500mg', 
  //     item_short_name: 'PCM500', 
  //     item_full_name: 'Paracetamol Tablets BP 500mg',
  //     brand_code: 'B001',
  //     brand_name: 'Cipla', 
  //     category_code: 'C001',
  //     category_name: 'Analgesics', 
  //     content_code: 'CN01',
  //     content_name: 'Paracetamol', 
  //     pack_code: 'P10',
  //     pack_name: 'Strip of 10', 
  //     item_qty_per_box: '100', 
  //     item_added_date: '2023-10-01',
  //     item_updated_date: '2023-10-05 14:30',
  //     hsn_sac_code: '30049099',
  //     hsn_sac_name: 'Medicaments consisting of mixed or unmixed products'
  //   }
  // ];

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <ScrollView style={styles.body}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <ArrowLeft size={20} color="#2563EB" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Item Master</Text>
          <Text style={styles.pageSubTitle}>Fetch and view item master data from Ecogreen ERP</Text>

          {/* Filters Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Filters</Text>
            <div style={styles.filterGrid}>
              <FilterInput label="c2Code" placeholder="c2Code" value={filters.c2Code} onChange={(val) => setFilters({ ...filters, c2Code: val })}/>
              <FilterInput label="storeId" placeholder="storeId" value={filters.storeId} onChange={(val) => setFilters({ ...filters, storeId: val })}/>
              <FilterInput label="prodCode" placeholder="prodCode" value={filters.prodCode} onChange={(val) => setFilters({ ...filters, prodCode: val })}/>
                 <FilterInput
    label="Security Key"
    placeholder="Security Key"
    value={filters.securityKey || ''}
    onChange={(val) => setFilters({ ...filters, securityKey: val })}
  />
<FilterInput
  label="Input Date/Time (with seconds)"
  type="datetime-local"
  value={filters.dateTime}
  onChange={(val) => setFilters({ ...filters, dateTime: val })}
  step="1"  // allows seconds
/>
         </div>

            <View style={styles.buttonRow}>
             <TouchableOpacity 
  style={styles.fetchButton} 
  onPress={fetchItemMaster}
>
  <Text style={styles.buttonText}>
    {loading ? "Fetching..." : "🔍 Fetch Item Master"}
  </Text>
</TouchableOpacity>
             <TouchableOpacity
  style={styles.bulkUploadButton}
  onPress={() => fileInputRef.current.click()}
>
  <Text style={styles.bulkUploadButtonText}>📥 Bulk Upload</Text>
</TouchableOpacity>

<input
  type="file"
  accept=".xlsx,.xls,.csv"
  ref={fileInputRef}
  style={{ display: 'none' }}
  onChange={handleBulkUpload}
/>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                <Text style={styles.addButtonText}>➕ Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Section */}
          <View style={[styles.card, { marginTop: 20, padding: 0 }]}>
            <View style={styles.tableSearchContainer}>
              <TextInput placeholder="Search..." style={styles.tableSearch} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Updated Table Header with all 17 fields */}
                <View style={styles.tableHeader}>
                  <TableHeader text="Item Code" />
                  <TableHeader text="Item Name" />
                  <TableHeader text="Short Name" />
                  <TableHeader text="Full Name" width={200} />
                  <TableHeader text="Brand Code" />
                  <TableHeader text="Brand Name" />
                  <TableHeader text="Cat. Code" />
                  <TableHeader text="Category Name" />
                  <TableHeader text="Cont. Code" />
                  <TableHeader text="Content Name" />
                  <TableHeader text="Pack Code" />
                  <TableHeader text="Pack Name" />
                  <TableHeader text="Qty/Box" />
                  <TableHeader text="Added Date" />
                  <TableHeader text="Updated Date" width={150} />
                  <TableHeader text="HSN Code" />
                  <TableHeader text="HSN Name" width={250} />
                </View>

                {/* Updated Table Rows mapping all fields */}
{currentItems.map(item => (                  <View key={item.id} style={styles.tableRow}>
                    <TableCell text={item.item_code} />
                    <TableCell text={item.item_name} />
                    <TableCell text={item.item_short_name} />
                    <TableCell text={item.item_full_name} width={200} />
                    <TableCell text={item.brand_code} />
                    <TableCell text={item.brand_name} />
                    <TableCell text={item.category_code} />
                    <TableCell text={item.category_name} />
                    <TableCell text={item.content_code} />
                    <TableCell text={item.content_name} />
                    <TableCell text={item.pack_code} />
                    <TableCell text={item.pack_name} />
                    <TableCell text={item.item_qty_per_box} />
                    <TableCell text={item.item_added_date} />
                    <TableCell text={item.item_updated_date} width={150} />
                    <TableCell text={item.hsn_sac_code} />
                    <TableCell text={item.hsn_sac_name} width={250} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
        {/* Pagination Controls */}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' }}>
  <TouchableOpacity 
    style={{ padding: 10, backgroundColor: '#2563EB', borderRadius: 8 }} 
    onPress={handlePrevPage}
    disabled={currentPage === 1}
  >
    <Text style={{ color: 'white' }}>⬅ Previous</Text>
  </TouchableOpacity>

  <Text>Page {currentPage} of {totalPages}</Text>

  <TouchableOpacity 
    style={{ padding: 10, backgroundColor: '#2563EB', borderRadius: 8 }} 
    onPress={handleNextPage}
    disabled={currentPage === totalPages}
  >
    <Text style={{ color: 'white' }}>Next ➡</Text>
  </TouchableOpacity>

  {/* Optional: Rows per page selector */}
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Text>Rows per page:</Text>
    <TextInput
      style={{ borderWidth: 1, borderColor: '#E2E8F0', width: 50, textAlign: 'center', borderRadius: 6, padding: 4 }}
      keyboardType="numeric"
      value={rowsPerPage.toString()}
      onChangeText={(val) => {
        const num = parseInt(val) || 1;
        setRowsPerPage(num);
        setCurrentPage(1); // reset to first page
      }}
    />
  </View>
</View>
      </View>

      {/* ADD ITEM FORM MODAL (Keep as is) */}
      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item Master</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <View style={styles.formGrid}>
                <FormInput label="Item Code *" value={newItem.item_code} onChange={(v) => setNewItem({...newItem, item_code: v})} />
                <FormInput label="Item Name" value={newItem.item_name} onChange={(v) => setNewItem({...newItem, item_name: v})} />
                <FormInput label="Short Name" value={newItem.item_short_name} onChange={(v) => setNewItem({...newItem, item_short_name: v})} />
                <FormInput label="Full Name" value={newItem.item_full_name} onChange={(v) => setNewItem({...newItem, item_full_name: v})} />
                <FormInput label="Brand Code" value={newItem.brand_code} onChange={(v) => setNewItem({...newItem, brand_code: v})} />
                <FormInput label="Brand Name" value={newItem.brand_name} onChange={(v) => setNewItem({...newItem, brand_name: v})} />
                <FormInput label="Category Code" value={newItem.category_code} onChange={(v) => setNewItem({...newItem, category_code: v})} />
                <FormInput label="Category Name" value={newItem.category_name} onChange={(v) => setNewItem({...newItem, category_name: v})} />
                <FormInput label="Content Code" value={newItem.content_code} onChange={(v) => setNewItem({...newItem, content_code: v})} />
                <FormInput label="Content Name" value={newItem.content_name} onChange={(v) => setNewItem({...newItem, content_name: v})} />
                <FormInput label="Pack Code" value={newItem.pack_code} onChange={(v) => setNewItem({...newItem, pack_code: v})} />
                <FormInput label="Pack Name" value={newItem.pack_name} onChange={(v) => setNewItem({...newItem, pack_name: v})} />
                <FormInput label="Qty Per Box" keyboardType="numeric" value={newItem.item_qty_per_box} onChange={(v) => setNewItem({...newItem, item_qty_per_box: v})} />
                <FormInput label="HSN/SAC Code" value={newItem.hsn_sac_code} onChange={(v) => setNewItem({...newItem, hsn_sac_code: v})} />
                <FormInput label="HSN/SAC Name" multiline value={newItem.hsn_sac_name} onChange={(v) => setNewItem({...newItem, hsn_sac_name: v})} />
                <FormInput label="Added Date" type="date" value={newItem.item_added_date} onChange={(v) => setNewItem({...newItem, item_added_date: v})} />
                <FormInput label="Updated Date" type="datetime-local" value={newItem.item_updated_date} onChange={(v) => setNewItem({...newItem, item_updated_date: v})} />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
             <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
  <Text style={styles.saveButtonText}>Save Item</Text>
</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Updated Table components to handle custom widths
const TableHeader = ({ text, width = 120 }) => (
  <Text style={[styles.headerCellText, { width }]}>{text}</Text>
);
const TableCell = ({ text, width = 120 }) => (
  <Text style={[styles.cellText, { width }]} numberOfLines={1}>{text || '-'}</Text>
);

// Form Components
const FormInput = ({ label, value, onChange, type = "text", ...props }) => (
  <View style={styles.formInputGroup}>
    <Text style={styles.label}>{label}</Text>
    {Platform.OS === 'web' && (type === 'date' || type === 'datetime-local') ? (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={webInputStyle} />
    ) : (
      <TextInput style={[styles.input, props.multiline && { height: 80 }]} value={value} onChangeText={onChange} {...props} />
    )}
  </View>
);

const FilterInput = ({ label, placeholder, value, onChange, type = 'text' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    {Platform.OS === 'web' && type === 'datetime-local' ? (
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step="1" // THIS enables seconds
        style={webInputStyle}
      />
    ) : (
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
      />
    )}
  </View>
);

const webInputStyle = {
  width: '100%', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0',
  backgroundColor: '#F8F9FC', fontSize: 14, outline: 'none'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },
  mainContent: { flex: 1 },
  body: { padding: 32 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButtonText: { marginLeft: 6, fontSize: 14, fontWeight: '500', color: '#2563EB' },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  pageSubTitle: { color: '#64748B', marginTop: 6, marginBottom: 32, fontSize: 15 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 24, color: '#1E293B' },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 8, fontWeight: '500', color: '#475569', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, backgroundColor: '#F8F9FC' },
  buttonRow: { flexDirection: 'row', marginTop: 24, gap: 12 },
  fetchButton: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  exportButton: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  addButton: { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
  exportButtonText: { color: '#475569', fontWeight: '600' },
  addButtonText: { color: 'white', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '90%', maxWidth: 800, maxHeight: '90%', borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  formScroll: { flex: 1 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  formInputGroup: { width: '48%', minWidth: 250, marginBottom: 15 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  cancelButtonText: { color: '#64748B', fontWeight: '600' },
  saveButton: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  saveButtonText: { color: 'white', fontWeight: '600' },

  tableSearchContainer: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tableSearch: { backgroundColor: '#F8F9FC', padding: 10, borderRadius: 8, width: 300, borderWidth: 1, borderColor: '#E2E8F0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8F9FC', paddingVertical: 12, paddingHorizontal: 16 },
  headerCellText: { fontWeight: '600', color: '#64748B', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cellText: { color: '#1E293B', fontSize: 14 },
  bulkUploadButton: { backgroundColor: '#F59E0B', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
bulkUploadButtonText: { color: 'white', fontWeight: '600' },
});

export default ItemMasterScreen;