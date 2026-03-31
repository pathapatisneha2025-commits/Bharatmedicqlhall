import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
      BackHandler,
 Platform,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { getEmployeeId, storeEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const PatientDetailsScreen = ({ navigation, route }) => {
  const { cartItems = [], totalAmount = 0 } = route.params || [];
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [contact, setContact] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(true);
const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 768; // Standard breakpoint for desktop/tablet

  // Dynamic width for grid items: 2 columns on desktop, 1 on mobile
  const itemWidth = isDesktop ? "48%" : "100%";
  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        let storedEmpId = await getEmployeeId();
        if (!storedEmpId) {
          const res = await fetch(`${BASE_URL}/employee/employeeid`);
          const data = await res.json();
          if (res.ok && data?.success && data?.employee) {
            storedEmpId = data.employee.id;
            await storeEmployeeId(storedEmpId);
            setEmployeeId(storedEmpId);
            setEmployeeName(data.employee.full_name);
          } else {
            throw new Error(data?.message || "Failed to fetch employee info");
          }
        } else {
          setEmployeeId(storedEmpId);
          const res = await fetch(`${BASE_URL}/employee/${storedEmpId}`);
          const data = await res.json();
          if (res.ok && data?.employee) {
            setEmployeeName(data.employee.full_name);
          } else {
            throw new Error("Failed to fetch employee details");
          }
        }
      } catch (err) {
        console.error(err);
       showAlert("Error", err.message || "Unable to fetch employee details.");
      } finally {
        setEmployeeLoading(false);
      }
    };
    fetchEmployee();
  }, []);

  const validateFields = () => {
    if (!fullName.trim() || !age.trim() || !contact.trim()) {
      showAlert("Validation Error", "Please fill all fields.");
      return false;
    }
    if (isNaN(age) || parseInt(age) <= 0) {
      showAlert("Validation Error", "Age must be a positive number.");
      return false;
    }
    if (!/^\d{10}$/.test(contact)) {
      showAlert("Validation Error", "Contact must be 10 digits.");
      return false;
    }
    if (!employeeId) {
      showAlert("Validation Error", "Employee not loaded yet.");
      return false;
    }
    if (!cartItems || cartItems.length === 0) {
      showAlert("Validation Error", "Cart is empty.");
      return false;
    }
    return true;
  };

  const handleGenerateInvoice = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        employeeId: parseInt(employeeId),
        date: today,
        patientName: fullName,
        patientAge: parseInt(age),
        patientPhone: contact,
        paymentMode: paymentType,
        items: cartItems,
        totalAmount: totalAmount,
      };

      const response = await fetch(`${BASE_URL}/invoice/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success && result.data) {
        navigation.navigate("invoice", { invoiceData: result.data });
      } else {
        showAlert("Error", result.message || "Failed to generate invoice.");
      }
    } catch (err) {
      console.error("Invoice Error:", err);
      showAlert("Error", "Failed to generate invoice.");
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
      const backAction = () => {
        // Instead of going back step by step, reset navigation to Sidebar/Home
        navigation.reset({
          index: 0,
          routes: [{ name: "Dashboard" }], // <-- replace with your sidebar/home screen name
        });
        return true; // prevents default back behavior
      };
    
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
    
      return () => backHandler.remove(); // clean up on unmount
    }, []);
    
  if (employeeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F80ED" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#555" }}>
          Loading employee info...
        </Text>
      </View>
    );
  }

return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.mainWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        
        {/* BRANDING SIDE (Left) */}
        {isDesktop && (
          <View style={styles.brandingSide}>
            <View style={styles.brandOverlay}>
              <View style={styles.heroLogoBox}>
                <Text style={styles.heroLogoText}>BM</Text>
              </View>
              <Text style={styles.heroTitle}>Bharat Medical Hall</Text>
              <Text style={styles.heroSubtitle}>Invoice Generation Terminal</Text>
              <Text style={styles.heroDescription}>
                Complete the patient profile to finalize the billing process. This information will be printed on the official medical invoice.
              </Text>
              
              <View style={styles.empInfoCard}>
                <MaterialIcons name="verified-user" size={24} color="#0D6EFD" />
                <View style={{marginLeft: 15}}>
                  <Text style={styles.empCardLabel}>ACTIVE COUNTER OPERATOR</Text>
                  <Text style={styles.empCardName}>{employeeName}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* FORM SIDE (Right) */}
        <View style={[styles.formSide, { width: isDesktop ? '60%' : '100%' }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color="#0D6EFD" />
              <Text style={styles.backText}>Return to Dashboard</Text>
            </TouchableOpacity>

            <View style={styles.formHeader}>
              <Text style={styles.title}>Patient Details</Text>
              <Text style={styles.subtitle}>Provide accurate information for billing records</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter patient's full name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#adb5bd"
                />
              </View>

              <View style={styles.row}>
                {/* Age */}
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Years"
                    value={age}
                    keyboardType="numeric"
                    onChangeText={setAge}
                    placeholderTextColor="#adb5bd"
                  />
                </View>
                {/* Contact */}
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>Contact Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    value={contact}
                    keyboardType="numeric"
                    maxLength={10}
                    onChangeText={setContact}
                    placeholderTextColor="#adb5bd"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Mode</Text>
                <View style={styles.pickerWrapper}>
                  <Picker 
                    selectedValue={paymentType} 
                    onValueChange={setPaymentType}
                    style={Platform.OS === 'web' ? {outline: 'none', border: 'none', height: 54, width: '100%'} : {height: 54}}
                  >
                    <Picker.Item label="Cash Payment" value="Cash" />
                    <Picker.Item label="Card Payment" value="Card" />
                    <Picker.Item label="UPI Transfer" value="UPI" />
                  </Picker>
                </View>
              </View>

              <View style={styles.totalBox}>
                 <Text style={styles.totalLabel}>Grand Total</Text>
                 <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.8 }]}
                onPress={handleGenerateInvoice}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="receipt" size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.buttonText}>GENERATE INVOICE</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default PatientDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainWrapper: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Left Sidebar Styling
  brandingSide: { flex: 1, backgroundColor: '#0D6EFD', padding: 40, justifyContent: 'center' },
  brandOverlay: { maxWidth: 450, alignSelf: 'center' },
  heroLogoBox: { width: 70, height: 70, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  heroLogoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroTitle: { fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 10 },
  heroSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: 20 },
  heroDescription: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, marginBottom: 40 },
  empInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 5 },
  empCardLabel: { color: '#adb5bd', fontSize: 10, fontWeight: '800' },
  empCardName: { color: '#1A1A1A', fontSize: 18, fontWeight: '700' },

  // Right Form Side Styling
  formSide: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: '12%', paddingVertical: 60 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backText: { fontSize: 14, color: '#0D6EFD', fontWeight: '700', marginLeft: 8 },
  formHeader: { marginBottom: 35 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 15, color: '#6c757d', marginTop: 8 },
  formContainer: { maxWidth: 500 },

  inputGroup: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '700', color: '#495057', marginBottom: 10, marginLeft: 2 },
  input: { 
    height: 54, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', 
    borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: '#212529' 
  },
  row: { flexDirection: 'row', marginBottom: 5 },
  pickerWrapper: { 
    backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 14, overflow: 'hidden' 
  },
  totalBox: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F1F3F5', padding: 20, borderRadius: 16, marginTop: 10, marginBottom: 30 
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#495057' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  
  button: {
    height: 60, backgroundColor: '#0D6EFD', borderRadius: 30, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0D6EFD', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 1 },
});