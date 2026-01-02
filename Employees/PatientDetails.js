import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
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
        Alert.alert("Error", err.message || "Unable to fetch employee details.");
      } finally {
        setEmployeeLoading(false);
      }
    };
    fetchEmployee();
  }, []);

  const validateFields = () => {
    if (!fullName.trim() || !age.trim() || !contact.trim()) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return false;
    }
    if (isNaN(age) || parseInt(age) <= 0) {
      Alert.alert("Validation Error", "Age must be a positive number.");
      return false;
    }
    if (!/^\d{10}$/.test(contact)) {
      Alert.alert("Validation Error", "Contact must be 10 digits.");
      return false;
    }
    if (!employeeId) {
      Alert.alert("Validation Error", "Employee not loaded yet.");
      return false;
    }
    if (!cartItems || cartItems.length === 0) {
      Alert.alert("Validation Error", "Cart is empty.");
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
        Alert.alert("Error", result.message || "Failed to generate invoice.");
      }
    } catch (err) {
      console.error("Invoice Error:", err);
      Alert.alert("Error", "Failed to generate invoice.");
    } finally {
      setLoading(false);
    }
  };

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#2F80ED" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {/* Employee Info */}
        <View style={styles.employeeCard}>
          <MaterialIcons name="person-outline" size={24} color="#2F80ED" />
          <Text style={styles.employeeInfo}>
            {employeeName} (ID: {employeeId})
          </Text>
        </View>

        {/* Full Name */}
        <View style={styles.inputWrapper}>
          <Ionicons name="person" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Age */}
        <View style={styles.inputWrapper}>
          <Ionicons name="calendar" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={age}
            keyboardType="numeric"
            onChangeText={setAge}
          />
        </View>

        {/* Contact */}
        <View style={styles.inputWrapper}>
          <Ionicons name="call" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Contact Number"
            value={contact}
            keyboardType="numeric"
            maxLength={10}
            onChangeText={setContact}
          />
        </View>

        {/* Payment Mode */}
        <Text style={styles.label}>Payment Mode</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={paymentType} onValueChange={setPaymentType}>
            <Picker.Item label="Cash" value="Cash" />
            <Picker.Item label="Card" value="Card" />
            <Picker.Item label="UPI" value="UPI" />
          </Picker>
        </View>

        {/* Button */}
    <TouchableOpacity
  style={styles.button}
  onPress={handleGenerateInvoice}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons name="receipt-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.buttonText}>Generate Invoice</Text>
    </View>
  )}
</TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default PatientDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#2F80ED",
  },
  formContainer: { padding: 20, paddingBottom: 40 },
  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeInfo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2F80ED",
    marginLeft: 8,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: "#2F80ED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2F80ED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
  },
});
