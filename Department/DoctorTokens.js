import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DoctorTokenBookingScreen() {
  const navigation = useNavigation();

  const [bookings, setBookings] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [numberOfVisits, setNumberOfVisits] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");

  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.text === "Delete" || b.text === "OK");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  const fetchBookings = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${BASE_URL}/doctorbookingtoken/all`);
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      showAlert("Error", "Failed to fetch bookings");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctor/all`);
      const data = await res.json();
      setDoctors(data);
      if (data.length > 0 && !selectedDoctor) {
        setSelectedDoctor(data[0]);
        setDoctorEmail(data[0].email);
      }
    } catch (error) {
      showAlert("Error", "Failed to fetch doctors");
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchDoctors();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDoctor || !doctorEmail || !numberOfVisits) {
      showAlert("Validation Error", "Please fill all fields");
      return;
    }

    const payload = {
      doctor_email: doctorEmail,
      doctor_name: selectedDoctor.name,
      number_of_visits_per_day: Number(numberOfVisits),
    };

    try {
      setLoading(true);
      let res;
      if (editingId) {
        res = await fetch(`${BASE_URL}/doctorbookingtoken/update/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BASE_URL}/doctorbookingtoken/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      showAlert("Success", data.message || "Operation successful");
      resetForm();
      fetchBookings();
    } catch (error) {
      showAlert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (doctors.length > 0) {
      setSelectedDoctor(doctors[0]);
      setDoctorEmail(doctors[0].email);
    }
    setNumberOfVisits("");
    setEditingId(null);
  };

  const handleDelete = (id) => {
    showAlert("Confirm Delete", "Remove this configuration permanently?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/doctorbookingtoken/${id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              showAlert("Success", "Configuration removed");
              fetchBookings();
            }
          } catch (error) {
            showAlert("Error", "Delete failed");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleEdit = (item) => {
    const doctor = doctors.find((d) => d.email === item.doctor_email);
    if (doctor) setSelectedDoctor(doctor);
    setDoctorEmail(item.doctor_email);
    setNumberOfVisits(item.number_of_visits_per_day.toString());
    setEditingId(item.id);
  };

  const filteredData = bookings.filter(
    (b) =>
      b.doctor_name.toLowerCase().includes(searchText.toLowerCase()) ||
      b.doctor_email.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderTableRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { width: 60 }]}>#{index + 1}</Text>
      <Text style={[styles.tableCell, { width: 180, fontWeight: "700" }]}>{item.doctor_name}</Text>
      <Text style={[styles.tableCell, { width: 220 }]}>{item.doctor_email}</Text>
      <View style={{ width: 120 }}>
        <View style={styles.limitBadge}>
          <Text style={styles.limitText}>{item.number_of_visits_per_day} Tokens</Text>
        </View>
      </View>
      <View style={styles.actionCell}>
        <TouchableOpacity style={styles.actionIcon} onPress={() => handleEdit(item)}>
          <Feather name="edit-3" size={16} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionIcon, { backgroundColor: "#fee2e2" }]} onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loaderText}>Syncing Data... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.webWrapper}>
      <View style={styles.mainContent}>
        
        {/* HEADER SECTION */}
        <View style={styles.contentHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.mainTitle}>Token Management</Text>
              <Text style={styles.subTitle}>Configure daily visit capacities for hospital specialists</Text>
            </View>
          </View>
        </View>

        <View style={styles.flexRow}>
          {/* LEFT: CONFIGURATION FORM */}
          <View style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>{editingId ? "Modify Token Rule" : "Create Token Rule"}</Text>
            
            <Text style={styles.fieldLabel}>Select Specialist</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedDoctor ? selectedDoctor.email : ""}
                onValueChange={(val) => {
                  const doc = doctors.find((d) => d.email === val);
                  setSelectedDoctor(doc);
                  if (doc) setDoctorEmail(doc.email);
                }}
              >
                {doctors.map((doc) => (
                  <Picker.Item key={doc.id} label={doc.name} value={doc.email} />
                ))}
              </Picker>
            </View>

            <Text style={styles.fieldLabel}>Doctor Email</Text>
            <View style={styles.disabledInput}>
              <Feather name="mail" size={16} color="#94a3b8" />
              <TextInput style={styles.inputStyle} value={doctorEmail} editable={false} />
            </View>

            <Text style={styles.fieldLabel}>Daily Token Limit</Text>
            <View style={styles.activeInput}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={20} color="#2563eb" />
              <TextInput 
                style={styles.inputStyle} 
                placeholder="Enter max visits" 
                keyboardType="numeric" 
                value={numberOfVisits} 
                onChangeText={setNumberOfVisits} 
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{editingId ? "Update Capacity" : "Activate Capacity"}</Text>
            </TouchableOpacity>
            
            {editingId && (
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Discard Editing</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* RIGHT: TOKEN DIRECTORY */}
          <View style={styles.tableCard}>
            <View style={styles.tableCardHeader}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput 
                  placeholder="Filter directory..." 
                  style={styles.searchTextInput}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 60 }]}>S.No</Text>
                  <Text style={[styles.headerCell, { width: 180 }]}>Specialist</Text>
                  <Text style={[styles.headerCell, { width: 220 }]}>Email Address</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Max Visits</Text>
                  <Text style={[styles.headerCell, { width: 100, textAlign: 'center' }]}>Actions</Text>
                </View>
                <FlatList
                  data={filteredData}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderTableRow}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  ListEmptyComponent={<Text style={styles.emptyText}>No token configurations found.</Text>}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webWrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  mainContent: { flex: 1, padding: 32 },
  contentHeader: { marginBottom: 32 },
  circleBack: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  mainTitle: { fontSize: 26, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", marginTop: 4, fontSize: 14 },

  flexRow: { flexDirection: "row", gap: 24, flex: 1 },
  formCard: { width: 340, backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#e2e8f0", alignSelf: 'flex-start', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  tableCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: 'hidden' },
  tableCardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' },
  formHeaderTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b", marginBottom: 4 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#e2e8f0' },
  searchTextInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, marginTop: 18, textTransform: 'uppercase', letterSpacing: 0.8 },
  pickerWrapper: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, backgroundColor: "#f8fafc", overflow: 'hidden' },
  disabledInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12 },
  activeInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#2563eb", borderRadius: 10, paddingHorizontal: 12 },
  inputStyle: { flex: 1, height: 46, marginLeft: 10, color: "#1e293b", fontSize: 15 ,  outlineStyle: "none",   // ✅ removes web rectangle
},

  submitBtn: { backgroundColor: "#2563eb", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 24, elevation: 2 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { marginTop: 15, alignItems: "center" },
  cancelBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 13 },

  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  headerCell: { fontSize: 12, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  tableCell: { fontSize: 14, color: "#334155" },
  limitBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  limitText: { color: '#2563eb', fontWeight: '800', fontSize: 12 },
  
  actionCell: { width: 100, flexDirection: "row", justifyContent: "center", gap: 10 },
  actionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#f8fafc' },
  loaderText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14 }
});