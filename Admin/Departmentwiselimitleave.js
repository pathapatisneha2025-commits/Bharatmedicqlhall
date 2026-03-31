import React, { useEffect, useState } from "react";
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
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/leavelimit";

export default function AdminDepartmentLimitScreen() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [department, setDepartment] = useState("");
  const [maxLeaves, setMaxLeaves] = useState("");
  const [maxBreaks, setMaxBreaks] = useState("");
  const [editDept, setEditDept] = useState(null);
  const [searchText, setSearchText] = useState("");
  
  const navigation = useNavigation();

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.text === "Delete" || b.style !== "cancel");
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/all`);
      const result = await res.json();
      setData(result);
      setFilteredData(result);
    } catch {
      showAlert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!department.trim() || maxLeaves === "" || maxBreaks === "") {
      showAlert("Validation", "All fields are required!");
      return;
    }

    const payload = {
      department: department.trim(),
      maxLeavesPerDay: Number(maxLeaves),
      maxBreaksPerDay: Number(maxBreaks),
    };

    const url = editDept ? `${BASE_URL}/update/${editDept}` : `${BASE_URL}/add`;
    const method = editDept ? "PUT" : "POST";

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        showAlert("Success", editDept ? "Config Updated" : "Config Added");
        resetForm();
        fetchData();
      } else {
        showAlert("Error", result.message);
      }
    } catch {
      showAlert("Error", "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDepartment("");
    setMaxLeaves("");
    setMaxBreaks("");
    setEditDept(null);
  };

  const handleEdit = (item) => {
    setDepartment(item.department);
    setMaxLeaves(item.max_leaves_per_day.toString());
    setMaxBreaks(item.max_breaks_per_day.toString());
    setEditDept(item.department);
  };

  const handleDelete = (dept) => {
    showAlert("Confirm Delete", `Permanently remove ${dept} limits?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setLoading(true);
            await fetch(`${BASE_URL}/delete/${dept}`, { method: "DELETE" });
            fetchData();
          } catch {
            showAlert("Error", "Delete failed");
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = data.filter((d) =>
      d.department.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const renderTableRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { width: 60 }]}>#{index + 1}</Text>
      <Text style={[styles.tableCell, { width: 200, fontWeight: "700" }]}>{item.department}</Text>
      <View style={{ width: 140 }}>
        <View style={styles.limitBadge}>
          <Text style={styles.limitText}>{item.max_leaves_per_day} Leaves</Text>
        </View>
      </View>
      <View style={{ width: 140 }}>
        <View style={[styles.limitBadge, { backgroundColor: '#fff7ed' }]}>
          <Text style={[styles.limitText, { color: '#ea580c' }]}>{item.max_breaks_per_day} Breaks</Text>
        </View>
      </View>
      <View style={styles.actionCell}>
        <TouchableOpacity style={styles.actionIcon} onPress={() => handleEdit(item)}>
          <Feather name="edit-3" size={16} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionIcon, { backgroundColor: "#fee2e2" }]} onPress={() => handleDelete(item.department)}>
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && data.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loaderText}>Syncing... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.webWrapper}>
      <View style={styles.mainContent}>
        
        {/* HEADER */}
        <View style={styles.contentHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
              <Ionicons name="arrow-back" size={22} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.mainTitle}>Department Quotas</Text>
              <Text style={styles.subTitle}>Set global leave and break thresholds by medical department</Text>
            </View>
          </View>
        </View>

        <View style={styles.flexRow}>
          {/* LEFT: FORM CARD */}
          <View style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>{editDept ? "Update Department" : "New Department Limit"}</Text>
            
            <Text style={styles.fieldLabel}>Department Name</Text>
            <View style={[styles.activeInput, editDept && styles.disabledInput]}>
              <MaterialIcons name="apartment" size={18} color={editDept ? "#94a3b8" : "#2563eb"} />
              <TextInput 
                style={styles.inputStyle} 
                placeholder="e.g. Cardiology" 
                value={department} 
                onChangeText={setDepartment} 
                editable={!editDept}
              />
            </View>

            <Text style={styles.fieldLabel}>Daily Leave Limit</Text>
            <View style={styles.activeInput}>
              <Feather name="calendar" size={18} color="#2563eb" />
              <TextInput 
                style={styles.inputStyle} 
                placeholder="Max staff on leave" 
                keyboardType="numeric" 
                value={maxLeaves} 
                onChangeText={setMaxLeaves} 
              />
            </View>

            <Text style={styles.fieldLabel}>Daily Break Limit</Text>
            <View style={styles.activeInput}>
              <Feather name="clock" size={18} color="#2563eb" />
              <TextInput 
                style={styles.inputStyle} 
                placeholder="Max staff on break" 
                keyboardType="numeric" 
                value={maxBreaks} 
                onChangeText={setMaxBreaks} 
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{editDept ? "Update Configuration" : "Save Configuration"}</Text>
            </TouchableOpacity>
            
            {editDept && (
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancel Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* RIGHT: DATA TABLE */}
          <View style={styles.tableCard}>
            <View style={styles.tableCardHeader}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput 
                  placeholder="Search departments..." 
                  style={styles.searchTextInput}
                  value={searchText}
                  onChangeText={handleSearch}
                />
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 60 }]}>ID</Text>
                  <Text style={[styles.headerCell, { width: 200 }]}>Department</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Max Leaves</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Max Breaks</Text>
                  <Text style={[styles.headerCell, { width: 100, textAlign: 'center' }]}>Manage</Text>
                </View>
                <FlatList
                  data={filteredData}
                  keyExtractor={(item) => item.department}
                  renderItem={renderTableRow}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  ListEmptyComponent={<Text style={styles.emptyText}>No department limits defined.</Text>}
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
  tableCardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  formHeaderTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b", marginBottom: 4 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#e2e8f0' },
  searchTextInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', marginBottom: 8, marginTop: 18, textTransform: 'uppercase', letterSpacing: 0.8 },
  disabledInput: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
  activeInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, paddingHorizontal: 12 },
  inputStyle: { flex: 1, height: 46, marginLeft: 10, color: "#1e293b", fontSize: 15 },

  submitBtn: { backgroundColor: "#2563eb", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 24 },
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