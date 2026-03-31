import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { useNavigation } from "@react-navigation/native";

const CustomerMasterScreen = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    brcode: '', lc_code: '', lc_name: '', added_date: '', age: '', gender: '',
    address1: '', address2: '', address3: '', city: '', pin: '', mobile_no: '', mail_id: '',
    parent_code: '', parent_name: ''
  });
const [filters, setFilters] = useState({
  c2Code: '',
  storeId: '',
  prodCode: '',
  securityKey: '',
  fromDate: '',
  toDate: ''
});
  const fileInputRef = useRef(null);

 // Inside CustomerMasterScreen

// --- Single Customer Save ---
const handleSaveCustomer = async () => {
  try {
    const res = await fetch('https://hospitaldatabasemanagement.onrender.com/ecogreensingleapis/local-customer/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer),
    });

    if (res.ok) {
      const savedCustomer = await res.json();
      setCustomers(prev => [...prev, savedCustomer]);
      setShowForm(false);
      setNewCustomer({
        brcode: '', lc_code: '', lc_name: '', added_date: '', age: '', gender: '',
        address1: '', address2: '', address3: '', city: '', pin: '', mobile_no: '', mail_id: '',
        parent_code: '', parent_name: ''
      });
      alert('Customer saved successfully!');
    } else {
      alert('Failed to save customer');
    }
  } catch (error) {
    console.error(error);
    alert('Error saving customer');
  }
};

// --- Bulk Upload ---
const handleBulkUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file); // ✅ MUST match backend: upload.single('file')

  try {
    const response = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/ecogreenbulkupload/local-customer/bulk",
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();
    console.log("CUSTOMER BULK RESPONSE:", result); // 👈 DEBUG

    if (response.ok) {
      alert(`✅ Successfully uploaded ${result.inserted} customers!`);
    } else {
      alert(result.error || "❌ Upload failed");
    }

  } catch (err) {
    console.error(err);
    alert("❌ Upload failed");
  }
};
// --- Fetch customers from backend (POST version) ---
const fetchCustomers = async () => {
  const { c2Code, storeId, prodCode, securityKey, fromDate, toDate } = filters;

  if (!c2Code || !storeId || !prodCode || !securityKey || !fromDate || !toDate) {
    alert("Please fill all filter fields!");
    return;
  }

  try {
    const res = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/ecogreen/local-customers",
      {
        method: "POST", // ✅ changed to POST
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          c2Code,
          storeId,
          prodCode,
          apiKey: securityKey, // match your backend field name
          fromDate,
          toDate
        })
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Failed to fetch customers");
    }

    const data = await res.json();
    setCustomers(data); // update state with fetched customers
    alert(`✅ Fetched ${data.length} customers successfully!`);
  } catch (err) {
    console.error("Fetch Customers Error:", err.message);
    alert("❌ Failed to fetch customers");
  }
};
  const customerData = [ { id: '1', brCode: 'BR001', lcCode: 'LC001', name: 'Rajesh Sharma', age: '45', gender: 'Male', city: 'Mumbai', pin: '400001', mobile: '9876543210', email: 'rajesh@email.com', parent: 'Sharma Enterprises' }, { id: '2', brCode: 'BR001', lcCode: 'LC002', name: 'Priya Patel', age: '32', gender: 'Female', city: 'Mumbai', pin: '400050', mobile: '9876543211', email: 'priya@email.com', parent: 'Medical' }, ];

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* HEADER */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back-outline" size={24} color="#1E293B" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Local Customer Master</Text>
              <Text style={styles.headerSubTitle}>View customer records from Ecogreen ERP</Text>
            </View>
          </View>

          {/* FILTER CARD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Filters</Text>
            <View style={styles.filterRow}>
            <FilterInput
  label="c2Code"
  placeholder="c2Code"
  value={filters.c2Code}
  onChange={(val) => setFilters({ ...filters, c2Code: val })}
/>

<FilterInput
  label="storeId"
  placeholder="storeId"
  value={filters.storeId}
  onChange={(val) => setFilters({ ...filters, storeId: val })}
/>

<FilterInput
  label="prodCode"
  placeholder="prodCode"
  value={filters.prodCode}
  onChange={(val) => setFilters({ ...filters, prodCode: val })}
/>

<FilterInput
  label="Security Key"
  placeholder="Security Key"
  value={filters.securityKey}
  onChange={(val) => setFilters({ ...filters, securityKey: val })}
/>

<FilterInput
  label="From Date"
  placeholder="dd-mm-yyyy"
  isDate
  value={filters.fromDate}
  onChange={(val) => setFilters({ ...filters, fromDate: val })}
/>

<FilterInput
  label="To Date"
  placeholder="dd-mm-yyyy"
  isDate
  value={filters.toDate}
  onChange={(val) => setFilters({ ...filters, toDate: val })}
/>
            </View>
        <TouchableOpacity style={styles.fetchButton} onPress={fetchCustomers}>
  <Text style={styles.fetchButtonText}>🔍 Fetch Customers</Text>
</TouchableOpacity>
          </View>

          {/* ACTION BUTTONS */}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.actionBtnText}>➕ Add Single Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]} onPress={() => fileInputRef.current.click()}>
              <Text style={styles.actionBtnText}>📦 Bulk Upload</Text>
            </TouchableOpacity>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleBulkUpload}
            />
          </View>

          {/* CUSTOMER TABLE */}
          <View style={[styles.card, { marginTop: 24, padding: 0 }]}>
            <View style={styles.searchBarWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.tableSearchInput}
                placeholder="Search..."
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={styles.tableHeader}>
                  {[
                    "BR Code","LC Code","Name","Added Date","Age","Gender",
                    "Address1","Address2","Address3","City","PIN","Mobile","Email",
                    "Parent Code","Parent Name"
                  ].map((h, i) => (
                    <Text key={i} style={[styles.columnHeader, { width: 120 }]}>{h}</Text>
                  ))}
                </View>

                {customers
  .filter(c => c.lcName?.toLowerCase().includes(search.toLowerCase()))
  .map((c, i) => (
    <View key={i} style={styles.tableRow}>
      {[
        c.brcode,
        c.lcCode,
        c.lcName,
        c.addedDate,
        c.age,
        c.gender,
        c.address1,
        c.address2,
        c.address3,
        c.city,
        c.pin,
        c.mobileNo,
        c.mailId,
        c.parentCode,
        c.parentName
      ].map((val, idx) => (
        <Text key={idx} style={[styles.cellText, { width: 120 }]}>{val}</Text>
      ))}
    </View>
))}
                  
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* SINGLE CUSTOMER MODAL */}
      <Modal visible={showForm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {Object.keys(newCustomer).map((field, idx) => (
                <View key={idx} style={{ marginBottom: 12 }}>
                  <Text style={{ marginBottom: 4, fontWeight: '500', color: '#475569' }}>{field.replace('_', ' ')}</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, padding: 10 }}
                    value={newCustomer[field]}
                    onChangeText={t => setNewCustomer({ ...newCustomer, [field]: t })}
                  />
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16 }}>
              <TouchableOpacity style={{ padding: 12 }} onPress={() => setShowForm(false)}>
                <Text style={{ color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 12, backgroundColor: '#2563EB', borderRadius: 6 }} onPress={handleSaveCustomer}>
                <Text style={{ color: '#fff' }}>Save Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const FilterInput = ({ label, placeholder, isDate, value, onChange }) => {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.filterItem}>
      <Text style={styles.filterLabel}>{label}</Text>

      {isDate && isWeb ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            padding: 12,
            fontSize: 14,
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            width: '100%',
          }}
        />
      ) : (
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={onChange}
          />
          {isDate && <Text style={styles.calendarIcon}>📅</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },
  mainContent: { flex: 1 },
  scrollContent: { padding: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1E293B' },
  headerSubTitle: { color: '#64748B', marginTop: 4, marginBottom: 32 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowOpacity: 0.02, shadowColor: '#000', elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 24, color: '#1E293B' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  filterItem: { flex: 1, minWidth: 180 },
  filterLabel: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 },
  input: { flex: 1, padding: 12, fontSize: 14, color: '#1E293B' },
  calendarIcon: { paddingRight: 12, color: '#64748B' },
  fetchButton: { backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignSelf: 'flex-start', marginTop: 24 },
  fetchButtonText: { color: '#FFFFFF', fontWeight: '600' },

  actionBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  actionBtnText: { color: '#fff', fontWeight: '600' },

  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  searchIcon: { marginRight: 12, color: '#94A3B8' },
  tableSearchInput: { flex: 1, fontSize: 14, maxWidth: 400 },

  tableHeader: { flexDirection: 'row', backgroundColor: '#F8F9FC', paddingVertical: 12 },
  columnHeader: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  cellText: { fontSize: 14, color: '#1E293B' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', width: '90%', maxHeight: '90%', borderRadius: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
});

export default CustomerMasterScreen;