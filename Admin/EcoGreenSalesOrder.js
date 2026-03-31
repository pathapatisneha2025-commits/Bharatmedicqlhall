import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Plus, Trash2, Calendar, Clock, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
const WebDateTimeInput = ({ label, value, onChange, type = "date" }) => (
  <div style={{ flex: 1, marginBottom: 10 }}>
    <label
      style={{
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 4,
        display: 'block'
      }}
    >
      {label}
    </label>
    <input
      type={type} // "date" or "time"
      step={type === "time" ? 1 : undefined} // show seconds for time
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '90%',
        padding: 8,
        borderRadius: 4,
        border: '1px solid #cbd5e1',
        fontSize: 13,
        backgroundColor: '#fff',
        color: '#334155',
      }}
    />
  </div>
);
const InputField = ({ label, placeholder, value, onChange, keyboardType = 'default' }) => (
  <View style={{ flex: 1, marginBottom: 10 }}>
    <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4 }}>
      {label}
    </Text>
    <TextInput
      style={{
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        padding: 8,
        fontSize: 13,
        backgroundColor: '#fff',
        color: '#334155',
      }}
      placeholder={placeholder}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const EcoGreenCreateSalesOrder = () => {
  const navigation = useNavigation();
  const [orderDate, setOrderDate] = useState('');
const [orderTime, setOrderTime] = useState('');
const [c2Code, setC2Code] = useState('');
const [storeId, setStoreId] = useState('');
const [prodCode, setProdCode] = useState('');
const [apiKey, setApiKey] = useState('');
const [ipNo, setIpNo] = useState('');
const [mobileNo, setMobileNo] = useState('');
const [patientName, setPatientName] = useState('');
const [patientAddress, setPatientAddress] = useState('');
const [patientEmail, setPatientEmail] = useState('');
const [counterSale, setCounterSale] = useState('');
const [userId, setUserId] = useState('');
const [actCode, setActCode] = useState('');
const [actName, setActName] = useState('');
const [drCode, setDrCode] = useState('');
const [drName, setDrName] = useState('');
const [drAddress, setDrAddress] = useState('');
const [drRegNo, setDrRegNo] = useState('');
const [drOfficeCode, setDrOfficeCode] = useState('');
const [dmanCode, setDmanCode] = useState('');
const [orderTotal, setOrderTotal] = useState('');
const [orderDiscPer, setOrderDiscPer] = useState('');
const [refNo, setRefNo] = useState('');
const [orderId, setOrderId] = useState('');
const [remark, setRemark] = useState('');
const [urgentFlag, setUrgentFlag] = useState('');
const [ordConversionFlag, setOrdConversionFlag] = useState('');
const [dcConversionFlag, setDcConversionFlag] = useState('');
const [ordRefNo, setOrdRefNo] = useState('');
const [sysName, setSysName] = useState('');
const [sysIp, setSysIp] = useState('');
const [sysUser, setSysUser] = useState('');
    const [materialItems, setMaterialItems] = useState([
    { id: Date.now(), itemCode: '', looseQty: '', schQty: '', serviceQty: '', saleRate: '', disc: '', schDisc: '' }
  ]);

  const addItem = () => {
    setMaterialItems([...materialItems, { id: Date.now(), itemCode: '', looseQty: '', schQty: '', serviceQty: '', saleRate: '', disc: '', schDisc: '' }]);
  };

  const updateItem = (id, field, value) => {
    setMaterialItems(materialItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    setMaterialItems(materialItems.filter(item => item.id !== id));
  };
  const submitSalesOrder = async () => {
  try {
    // Prepare material items array
    const materialInfo = materialItems.map((item, index) => ({
      itemSeq: index + 1,
      itemcode: item.itemCode,
      totalLooseQty: parseFloat(item.looseQty) || 0,
      totalLooseSchQty: parseFloat(item.schQty) || 0,
      serviceQty: parseFloat(item.serviceQty) || 0,
      saleRate: item.saleRate || "0",
      discPer: item.disc || "0",
      schDiscPer: item.schDisc || "0",
    }));

    // Prepare payload
    const payload = {
      c2Code: c2Code,
      storeId: storeId,
      prodCode: prodCode,
      apiKey: apiKey,
      ipNo: ipNo,
      mobileNo: mobileNo,
      patientName: patientName,
      patientAddress: patientAddress,
      patientEmail: patientEmail,
      counterSale: counterSale,
      ordDate: orderDate,       // format: YYYY-MM-DD
      ordTime: orderTime,       // format: HH:mm:ss
      userId: userId,
      actCode: actCode,
      actName: actName,
      drCode: drCode,
      drName: drName,
      drAddress: drAddress,
      drRegNo: drRegNo,
      drOfficeCode: drOfficeCode,
      dmanCode: dmanCode,
      orderTotal: orderTotal,
      orderDiscPer: orderDiscPer,
      refNo: refNo,
      orderId: orderId,
      remark: remark,
      urgentFlag: urgentFlag,
      ordConversionFlag: ordConversionFlag,
      dcConversionFlag: dcConversionFlag,
      ordRefNo: ordRefNo,
      sysName: sysName,
      sysIp: sysIp,
      sysUser: sysUser,
      materialInfo: materialInfo
    };

    const response = await fetch('https://hospitaldatabasemanagement.onrender.com/ecogreen/create_sales_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      alert('Sales order submitted successfully!');
      console.log('Response:', data);
    } else {
      alert('Failed to submit sales order. Check logs.');
      console.log('Error response:', data);
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('Error submitting sales order. See console.');
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
       <View style={styles.headerRow}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <ArrowLeft size={24} color="#0f172a" />
  </TouchableOpacity>

  <View>
    <Text style={styles.header}>Create Sales Order</Text>
    <Text style={styles.subHeader}>
      Submit a new sales order to Ecogreen ERP
    </Text>
  </View>
</View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          {/* Row 1: Codes */}
          <View style={styles.row}>
           <InputField label="c2Code" placeholder="c2Code" value={c2Code} onChange={setC2Code} />
<InputField label="storeId" placeholder="storeId" value={storeId} onChange={setStoreId} />
<InputField label="prodCode" placeholder="prodCode" value={prodCode} onChange={setProdCode} />
          </View>

          {/* Row 2: Auth & Mobile */}
        <View style={styles.row}>
  <InputField label="API Key" placeholder="API Key" value={apiKey} onChange={setApiKey} />
  <InputField label="IP No" placeholder="IP No" value={ipNo} onChange={setIpNo} />
  <InputField label="Mobile No" placeholder="Mobile No" keyboardType="phone-pad" value={mobileNo} onChange={setMobileNo} />
</View>

          {/* Row 3: Patient Info */}
          <View style={styles.row}>
  <InputField
    label="Patient Name"
    placeholder="Patient Name"
    value={patientName}
    onChange={setPatientName}
  />
  <InputField
    label="Patient Address"
    placeholder="Patient Address"
    value={patientAddress}
    onChange={setPatientAddress}
  />
  <InputField
    label="Patient Email"
    placeholder="Patient Email"
    keyboardType="email-address"
    value={patientEmail}
    onChange={setPatientEmail}
  />
</View>

          {/* Row 4: Sale & Time */}
          <View style={styles.row}>
            <InputField label="Counter Sale" placeholder="Counter Sale" />
<WebDateTimeInput label="Order Date" type="date" value={orderDate} onChange={setOrderDate} />
       
<WebDateTimeInput label="Order Time" type="time" value={orderTime} onChange={setOrderTime} /> </View>

          {/* Row 5: User & Account */}
         <View style={styles.row}>
  <InputField
    label="User ID"
    placeholder="User ID"
    value={userId}
    onChange={setUserId}
  />
  <InputField
    label="Account Code"
    placeholder="Account Code"
    value={actCode}
    onChange={setActCode}
  />
  <InputField
    label="Account Name"
    placeholder="Account Name"
    value={actName}
    onChange={setActName}
  />
</View>

          {/* Row 6: Doctor Info */}
       <View style={styles.row}>
  <InputField
    label="Doctor Code"
    placeholder="Doctor Code"
    value={drCode}
    onChange={setDrCode}
  />
  <InputField
    label="Doctor Name"
    placeholder="Doctor Name"
    value={drName}
    onChange={setDrName}
  />
  <InputField
    label="Doctor Address"
    placeholder="Doctor Address"
    value={drAddress}
    onChange={setDrAddress}
  />
</View>

          {/* Row 7: Doctor Reg & Delivery */}
         <View style={styles.row}>
  <InputField
    label="Doctor Reg No"
    placeholder="Doctor Reg No"
    value={drRegNo}
    onChange={setDrRegNo}
  />
  <InputField
    label="Doctor Office Code"
    placeholder="Doctor Office Code"
    value={drOfficeCode}
    onChange={setDrOfficeCode}
  />
  <InputField
    label="Delivery Man Code"
    placeholder="Delivery Man Code"
    value={dmanCode}
    onChange={setDmanCode}
  />
</View>
          {/* Row 8: Financials */}
<View style={styles.row}>
  <InputField
    label="Order Total"
    placeholder="Order Total"
    keyboardType="numeric"
    value={orderTotal}
    onChange={setOrderTotal}
  />
  <InputField
    label="Order Disc %"
    placeholder="Order Disc %"
    keyboardType="numeric"
    value={orderDiscPer}
    onChange={setOrderDiscPer}
  />
  <InputField
    label="Ref No"
    placeholder="Ref No"
    value={refNo}
    onChange={setRefNo}
  />
</View>
       {/* Row 9: Status Flags */}
<View style={styles.row}>
  <InputField
    label="Order ID"
    placeholder="Order ID"
    value={orderId}
    onChange={setOrderId}
  />
  <InputField
    label="Remark"
    placeholder="Remark"
    value={remark}
    onChange={setRemark}
  />
  <InputField
    label="Urgent Flag"
    placeholder="Urgent Flag"
    value={urgentFlag}
    onChange={setUrgentFlag}
  />
</View>
         {/* Row 10: Conversion Flags */}
<View style={styles.row}>
  <InputField
    label="Ord Conversion Flag"
    placeholder="Ord Conversion Flag"
    value={ordConversionFlag}
    onChange={setOrdConversionFlag}
  />
  <InputField
    label="DC Conversion Flag"
    placeholder="DC Conversion Flag"
    value={dcConversionFlag}
    onChange={setDcConversionFlag}
  />
  <InputField
    label="Ord Ref No"
    placeholder="Ord Ref No"
    value={ordRefNo}
    onChange={setOrdRefNo}
  />
</View>
         {/* Row 11: System Info */}
<View style={styles.row}>
  <InputField
    label="System Name"
    placeholder="System Name"
    value={sysName}
    onChange={setSysName}
  />
  <InputField
    label="System IP"
    placeholder="System IP"
    value={sysIp}
    onChange={setSysIp}
  />
  <InputField
    label="System User"
    placeholder="System User"
    value={sysUser}
    onChange={setSysUser}
  />
</View>
        </View>

        {/* Material Items Table Section */}
        <View style={styles.card}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.sectionTitle}>Material Items</Text>
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <Plus size={16} color="#2563eb" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              <View style={styles.tableHead}>
                <Text style={[styles.headText, { width: 30 }]}>#</Text>
                <Text style={[styles.headText, { width: 100 }]}>Item Code</Text>
                <Text style={[styles.headText, { width: 80 }]}>Loose Qty</Text>
                <Text style={[styles.headText, { width: 80 }]}>Sch Qty</Text>
                <Text style={[styles.headText, { width: 80 }]}>Service Qty</Text>
                <Text style={[styles.headText, { width: 90 }]}>Sale Rate</Text>
                <Text style={[styles.headText, { width: 70 }]}>Disc %</Text>
                <Text style={[styles.headText, { width: 90 }]}>Sch Disc %</Text>
                <View style={{ width: 40 }} />
              </View>

              {materialItems.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={{ width: 30 }}>{index + 1}</Text>
                  <TextInput style={[styles.tableInput, { width: 100 }]} value={item.itemCode} onChangeText={(v) => updateItem(item.id, 'itemCode', v)} />
                  <TextInput style={[styles.tableInput, { width: 80 }]} keyboardType="numeric" value={item.looseQty} onChangeText={(v) => updateItem(item.id, 'looseQty', v)} />
                  <TextInput style={[styles.tableInput, { width: 80 }]} keyboardType="numeric" value={item.schQty} onChangeText={(v) => updateItem(item.id, 'schQty', v)} />
                  <TextInput style={[styles.tableInput, { width: 80 }]} keyboardType="numeric" value={item.serviceQty} onChangeText={(v) => updateItem(item.id, 'serviceQty', v)} />
                  <TextInput style={[styles.tableInput, { width: 90 }]} keyboardType="numeric" value={item.saleRate} onChangeText={(v) => updateItem(item.id, 'saleRate', v)} />
                  <TextInput style={[styles.tableInput, { width: 70 }]} keyboardType="numeric" value={item.disc} onChangeText={(v) => updateItem(item.id, 'disc', v)} />
                  <TextInput style={[styles.tableInput, { width: 90 }]} keyboardType="numeric" value={item.schDisc} onChangeText={(v) => updateItem(item.id, 'schDisc', v)} />
                  <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

       <TouchableOpacity style={styles.submitButton} onPress={submitSalesOrder}>
  <Text style={styles.submitButtonText}>Submit Sales Order</Text>
</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { padding: 12 },
  header: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginBottom: 10,
},
  subHeader: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  inputContainer: { marginBottom: 10 },
  label: { fontSize: 11, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
    fontSize: 13,
    backgroundColor: '#fff',
    color: '#334155'
  },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  addButtonText: { fontSize: 13, fontWeight: '600', color: '#2563eb', marginLeft: 4 },
  tableHead: { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: 5, fontSize: 12, backgroundColor: '#fff', marginRight: 6 },
  deleteBtn: { padding: 4 },
 submitButton: { 
    flexDirection: 'row',
    backgroundColor: '#1d4ed8', // Matches the vibrant blue in screenshot
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-start', // Aligns left like the web button
    marginTop: 20,
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
});

export default EcoGreenCreateSalesOrder;