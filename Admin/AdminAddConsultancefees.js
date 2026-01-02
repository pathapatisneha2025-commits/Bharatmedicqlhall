import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DoctorConsultantFeesScreen() {
  const [doctors, setDoctors] = useState([]);
  const [feesData, setFeesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [fees, setFees] = useState("");
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const navigation = useNavigation();

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${BASE_URL}/doctor/all`);
      const result = await response.json();
      setDoctors(result);

      if (result.length > 0) {
        const firstDoctor = result[0];
        setSelectedDoctorName(firstDoctor.name);
        setDoctorEmail(firstDoctor.email);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch doctors");
    }
  };

  // Fetch all fees
  const fetchFeesData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/doctorconsultancefee/all`);
      const result = await response.json();
      setFeesData(result);
      setFilteredData(result);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch fees data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchFeesData();
  }, []);

  const handleDoctorChange = (name) => {
    setSelectedDoctorName(name);
    const selectedDoc = doctors.find((doc) => doc.name === name);
    setDoctorEmail(selectedDoc ? selectedDoc.email : "");
  };

  const resetForm = () => {
    if (doctors.length > 0) {
      const firstDoctor = doctors[0];
      setSelectedDoctorName(firstDoctor.name);
      setDoctorEmail(firstDoctor.email);
    } else {
      setSelectedDoctorName("");
      setDoctorEmail("");
    }
    setFees("");
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!selectedDoctorName || !doctorEmail || !fees) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    const payload = {
      doctor_name: selectedDoctorName,
      email: doctorEmail,
      fees: parseInt(fees),
    };

    try {
      setLoading(true);
      const url = editId
        ? `${BASE_URL}/doctorconsultancefee/update/${editId}`
        : `${BASE_URL}/doctorconsultancefee/add`;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", editId ? "Updated successfully" : "Added successfully");
        resetForm();
        fetchFeesData();
      } else {
        Alert.alert("Error", result.error || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedDoctorName(item.doctor_name);
    setDoctorEmail(item.doctor_email);
    setFees(item.fees.toString());
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/doctorconsultancefee/delete/${id}`, {
              method: "DELETE",
            });
            const result = await response.json();
            if (response.ok) {
              Alert.alert("Success", "Record deleted successfully");
              fetchFeesData();
            } else {
              Alert.alert("Error", result.error || "Failed to delete");
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete data");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSearch = () => {
    const filtered = feesData.filter(
      (item) =>
        item.doctor_name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.doctor_email.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredData(filtered);
  };
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading doctors...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.header}>Doctor Consultant Fees</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#007BFF" style={{ marginLeft: 8 }} />
        <TextInput
          placeholder="Search by name or email"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Select Doctor</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedDoctorName} onValueChange={handleDoctorChange}>
            {doctors.length > 0
              ? doctors.map((doc) => <Picker.Item key={doc.id} label={doc.name} value={doc.name} />)
              : <Picker.Item label="No doctors found" value="" />}
          </Picker>
        </View>

        <View style={styles.inputWrapper}>
          <MaterialIcons name="email" size={20} color="#007BFF" style={{ marginRight: 8 }} />
          <TextInput style={styles.input} placeholder="Email" value={doctorEmail} editable={false} />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="cash-outline" size={20} color="#007BFF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Fees"
            keyboardType="numeric"
            value={fees}
            onChangeText={setFees}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{editId ? "Update" : "Add"}</Text>
        </TouchableOpacity>
      </View>

      {/* Records List */}
      <Text style={styles.subHeader}>All Records</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 10 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardText}><Text style={styles.bold}>Name:</Text> {item.doctor_name}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Email:</Text> {item.doctor_email}</Text>
                <Text style={styles.cardText}><Text style={styles.bold}>Fees:</Text> ₹{item.fees}</Text>
              </View>

              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={24} color="orange" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 10 }}>
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F0F4F8" , marginTop: 30},
  headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  header: { fontSize: 24, fontWeight: "bold", color: "#007BFF", textAlign: "center", flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 15,
    elevation: 2,
  },
  searchInput: { flex: 1, padding: 8, fontSize: 15 },
  searchButton: { backgroundColor: "#007BFF", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, marginLeft: 5 },
  searchButtonText: { color: "#fff", fontWeight: "bold" },
  form: { backgroundColor: "#fff", padding: 16, borderRadius: 12, elevation: 3, marginBottom: 15 },
  label: { fontWeight: "bold", marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, marginBottom: 10, backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 15, paddingVertical: 8 },
  button: { backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 5 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  subHeader: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardText: { fontSize: 15, color: "#333", marginBottom: 4 },
  bold: { fontWeight: "bold" },
  iconContainer: { flexDirection: "row", alignItems: "center" },
});
