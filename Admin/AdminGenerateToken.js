import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const GenerateTokenApp = () => {
      const navigation = useNavigation();

  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768; // Tablet or Web view

  const [form, setForm] = useState({
    companyCode: '',
    storeId: '',
    productCode: '',
    securityKey: ''
  });
 const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateToken = async () => {
    try {
      setLoading(true);
      setResponseData(null);

      // ✅ Call your backend POST route
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/ecogreen/generate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          c2Code: form.companyCode,
          storeId: form.storeId,
          prodCode: form.productCode,
          securityKey: form.securityKey,
        }),
      });

      const data = await res.json();

      console.log("Full API response:", data);

      if (data.code === "200" && data.apiKey) {
        setResponseData({ apiKey: data.apiKey });
      } else {
        setResponseData({ error: data.error || "Failed to generate token" });
      }
    } catch (error) {
      console.log("Token Error:", error);
      setResponseData({ error: "Failed to generate token" });
    } finally {
      setLoading(false);
    }
  };
  return (
    
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.headerTextContainer}>
<View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Feather name="arrow-left" size={24} color="#0f172a" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Generate Token</Text>
</View>   
        </View>

        {/* Main Flex Layout: Side-by-side on wide screens, Stacked on narrow */}
        <View style={[styles.contentBody, isLargeScreen && styles.rowLayout]}>
          
          {/* Section 1: Token Parameters Form */}
          <View style={[styles.card, isLargeScreen && styles.flexHalf]}>
            <Text style={styles.cardHeading}>Token Parameters</Text>
            
            <View style={styles.inputBox}>
              <Text style={styles.label}>
                Company Code (c2Code) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput 
                style={styles.input} 
                placeholder="Company Code (c2Code)" 
                placeholderTextColor="#94a3b8"
                value={form.companyCode}
                onChangeText={(t) => setForm({...form, companyCode: t})}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>
                Store ID (storeId) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput 
                style={styles.input} 
                placeholder="Store ID (storeId)" 
                placeholderTextColor="#94a3b8"
                value={form.storeId}
                onChangeText={(t) => setForm({...form, storeId: t})}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>
                Product Code (prodCode) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput 
                style={styles.input} 
                placeholder="Product Code (prodCode)" 
                placeholderTextColor="#94a3b8"
                value={form.productCode}
                onChangeText={(t) => setForm({...form, productCode: t})}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.label}>Security Key</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Security Key" 
                placeholderTextColor="#94a3b8"
                secureTextEntry
                value={form.securityKey}
                onChangeText={(t) => setForm({...form, securityKey: t})}
              />
            </View>

           <TouchableOpacity 
  style={styles.primaryBtn} 
  activeOpacity={0.8}
  onPress={generateToken}
>
  <Feather name="key" size={16} color="#fff" />
  <Text style={styles.btnText}>
    {loading ? "Generating..." : "Generate Token"}
  </Text>
</TouchableOpacity>
          </View>

          {/* Section 2: Response Placeholder */}
<View style={[styles.responseBox, isLargeScreen && styles.flexHalf]}>
  {loading && <Text style={styles.responseText}>Generating token...</Text>}

  {!loading && responseData?.apiKey && (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 16, color: "#16a34a", fontWeight: "600" }}>
        Token Generated Successfully
      </Text>

      <Text style={{ marginTop: 20, fontSize: 14, color: "#111827", textAlign: "center" }}>
        API Key:
      </Text>

      <Text
        selectable
        style={{ marginTop: 10, fontSize: 16, fontWeight: "bold", color: "#1d4ed8", textAlign: "center" }}
      >
        {responseData.apiKey}
      </Text>
    </View>
  )}

  {!loading && (!responseData || responseData.error) && (
    <Text style={styles.responseText}>
      {responseData?.error || "Generate a token to see the response"}
    </Text>
  )}
</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#e2e8f0'
},

headerTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginLeft: 12,
  color: '#0f172a'
},
  mainContent: { 
    flex: 1, 
    padding: 32 
  },
  scrollContent: {
    paddingBottom: 40
  },
  headerTextContainer: {
    marginBottom: 32
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#111827',
  },
  pageSubtitle: { 
    fontSize: 15, 
    color: '#6b7280', 
    marginTop: 6,
  },
  contentBody: {
    flexDirection: 'column',
  },
  rowLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flexHalf: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeading: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: 28 
  },
  inputBox: { 
    marginBottom: 24 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 10 
  },
  required: { 
    color: '#ef4444' 
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 14,
    fontSize: 15,
    color: '#111827'
  },
  primaryBtn: {
    backgroundColor: '#1d4ed8', // Darker blue to match screen button
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    marginTop: 10,
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '600', 
    marginLeft: 10,
    fontSize: 16
  },
  responseBox: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250, // Matches the height of the form area
  },
  responseText: { 
    color: '#6b7280', 
    fontSize: 16, 
    textAlign: 'center' 
  }
});

export default GenerateTokenApp;