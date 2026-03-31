import React, { useState } from 'react'; 
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SalesOrderStatusScreen = () => {
  const [orderNo, setOrderNo] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const navigation = useNavigation();

  const fetchStatus = async () => {
    if (!orderNo || !apiKey) {
      Alert.alert("Missing Info", "Please enter both Order No and API Key");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/ecogreen/sales-order-status', 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo, apiKey }),
        }
      );

      if (!response.ok) throw new Error('Failed to fetch data from server');

      const json = await response.json();

      if (json.code === "200") {
        setData(json);
      } else {
        Alert.alert("Error", json.message || "Order not found or invalid API key");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Unable to fetch data from server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Sales Order Tracking</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>Track Order</Text>
          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Order No</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 117"
                value={orderNo}
                onChangeText={setOrderNo}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="API Key"
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
              />
            </View>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={fetchStatus}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Check Status</Text>}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {data && (
          <View style={styles.resultsCard}>
            <View style={styles.orderHeaderCard}>
              <Text style={styles.orderHeaderText}>Order #{data.orderId}</Text>
              <Text style={styles.orderHeaderSub}>
                Customer: {data.custCode} | Type: {data.customerType}
              </Text>
            </View>

            {data.invoices?.map((inv, idx) => (
              <View key={idx} style={[
                styles.invoiceCard,
                inv.docStatus.toLowerCase().includes("pending") && { borderLeftColor: "#f43f5e", borderLeftWidth: 4 }
              ]}>
                <Text style={styles.invoiceTitle}>
                  Invoice: {inv.docNo} | Date: {inv.docDate} | Status: {inv.docStatus} | Created By: {inv.createdBy}
                </Text>

                {/* Horizontal Scroll Table */}
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.column, { width: 180 }]}>Product Name</Text>
                      <Text style={[styles.column, { width: 60 }]}>HSN</Text>
                      <Text style={[styles.column, { width: 60 }]}>Qty</Text>
                      <Text style={[styles.column, { width: 60 }]}>Qty/Box</Text>
                      <Text style={[styles.column, { width: 60 }]}>MRP</Text>
                      <Text style={[styles.column, { width: 60 }]}>Sale Rate</Text>
                      <Text style={[styles.column, { width: 60 }]}>Discount %</Text>
                      <Text style={[styles.column, { width: 80 }]}>Item Total</Text>
                      <Text style={[styles.column, { width: 80 }]}>Batch</Text>
                      <Text style={[styles.column, { width: 80 }]}>Expiry</Text>
                      <Text style={[styles.column, { width: 60 }]}>CGST %</Text>
                      <Text style={[styles.column, { width: 80 }]}>CGST Amt</Text>
                      <Text style={[styles.column, { width: 60 }]}>SGST %</Text>
                      <Text style={[styles.column, { width: 80 }]}>SGST Amt</Text>
                      <Text style={[styles.column, { width: 60 }]}>IGST %</Text>
                      <Text style={[styles.column, { width: 80 }]}>IGST Amt</Text>
                      <Text style={[styles.column, { width: 60 }]}>CESS %</Text>
                      <Text style={[styles.column, { width: 80 }]}>CESS Amt</Text>
                    </View>

                    {/* Table Rows */}
                    {inv.detail?.map((item, i) => (
                      <View
                        key={i}
                        style={[
                          styles.tableRow,
                          { backgroundColor: i % 2 === 0 ? "#f8fafc" : "#ffffff" }
                        ]}
                      >
                        <Text style={[styles.cell, { width: 180 }]}>{item.productName}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.hsnCode}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.qty}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.qtyPerBox}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.mrp}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.saleRate}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.discPer}</Text>
                        <Text style={[styles.cell, { width: 80 }]}>{parseFloat(item.itemTotal).toFixed(2)}</Text>
                        <Text style={[styles.cell, { width: 80 }]}>{item.batch || '-'}</Text>
                        <Text style={[styles.cell, { width: 80 }]}>{item.expiryDate || '-'}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.cgstPer}</Text>
                        <Text style={[styles.cell, { width: 80 }]}>{item.cgstAmt}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.sgstPer}</Text>
                        <Text style={[styles.cell, { width: 80 }]}>{item.sgstAmt}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.igstPer}</Text>
                        <Text style={[styles.cell, { width: 80 }]}>{item.igstAmt}</Text>
                        <Text style={[styles.cell, { width: 60 }]}>{item.cessPer}</Text>
                        <Text style={[styles.cell, { width: 80 }]}>{item.cessAmt}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Invoice Total */}
                <Text style={styles.invoiceTotal}>
                  Grand Total: ₹{parseFloat(inv.docTotal).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { padding: 16 },

  pageTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },

  searchCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#f9fafb' },
  searchBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  resultsCard: { marginTop: 16 },

  orderHeaderCard: { backgroundColor: '#e0f2fe', padding: 12, borderRadius: 12, marginBottom: 12 },
  orderHeaderText: { fontSize: 16, fontWeight: '700', color: '#0369a1' },
  orderHeaderSub: { fontSize: 14, color: '#075985', marginTop: 2 },

  invoiceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  invoiceTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#1e293b' },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 6, marginBottom: 6 },
  column: { fontWeight: '700', fontSize: 12, color: '#475569' },

  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cell: { fontSize: 12, color: '#0f172a', paddingHorizontal: 4 },

  invoiceTotal: { marginTop: 8, fontWeight: '700', textAlign: 'right', fontSize: 14, color: '#0369a1' },
});

export default SalesOrderStatusScreen;