import React, { useState, useEffect } from "react";
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
  Platform,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const DepartmentScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 850;

  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const [searchText, setSearchText] = useState("");

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      const confirmAction = window.confirm(`${title}\n\n${message}`);
      if (confirmAction && buttons?.[1]?.onPress) {
        buttons[1].onPress();
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

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/department/all`);
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      showAlert("Error", "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddOrUpdate = async () => {
    if (!departmentName.trim()) {
      showAlert("Validation", "Please enter a department name");
      return;
    }

    setLoading(true);
    try {
      if (editIndex !== null) {
        const departmentId = departments[editIndex].id;
        const response = await fetch(`${BASE_URL}/department/update/${departmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_name: departmentName }),
        });

        if (response.ok) {
          showAlert("Success", "Department updated successfully");
          fetchDepartments();
          setEditIndex(null);
        }
      } else {
        const response = await fetch(`${BASE_URL}/department/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_name: departmentName }),
        });

        if (response.ok) {
          showAlert("Success", "Department added successfully");
          fetchDepartments();
        }
      }
    } catch (error) {
      showAlert("Error", "Something went wrong");
    } finally {
      setDepartmentName("");
      setLoading(false);
    }
  };

  const handleDelete = (index) => {
    const departmentId = departments[index].id;
    showAlert("Delete Department", "Are you sure you want to delete this department?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          setLoading(true);
          try {
            const response = await fetch(`${BASE_URL}/department/delete/${departmentId}`, {
              method: "DELETE",
            });
            if (response.ok) fetchDepartments();
          } catch (error) {
            showAlert("Error", "Something went wrong");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.department_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderTableRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { width: 50 }]}>{index + 1}</Text>
      <Text style={[styles.tableCell, { flex: 1, fontWeight: "600" }]}>
        {item.department_name}
      </Text>
      <View style={styles.actionCell}>
        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={() => {
            setDepartmentName(item.department_name);
            setEditIndex(index);
          }}
        >
          <Feather name="edit-3" size={16} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionIcon, { backgroundColor: "#fee2e2" }]}
          onPress={() => handleDelete(index)}
        >
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
              <Text style={styles.mainTitle}>Department Matrix</Text>
              <Text style={styles.subTitle}>Configure and organize hospital departments</Text>
            </View>
          </View>
        </View>

        <View style={[styles.layoutContainer, { flexDirection: isLargeScreen ? "row" : "column" }]}>
          
          {/* LEFT: FORM PANEL */}
          <View style={[styles.formCard, !isLargeScreen && { width: '100%', marginBottom: 24 }]}>
            <Text style={styles.formHeaderTitle}>
              {editIndex !== null ? "Modify Department" : "Register Department"}
            </Text>

            <Text style={styles.fieldLabel}>Department Name</Text>
            <View style={styles.activeInput}>
              <MaterialCommunityIcons name="hospital-building" size={20} color="#2563eb" />
              <TextInput
                style={styles.inputStyle}
                placeholder="e.g. Cardiology"
                value={departmentName}
                onChangeText={setDepartmentName}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddOrUpdate}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {editIndex !== null ? "Update Details" : "Save Department"}
                </Text>
              )}
            </TouchableOpacity>

            {editIndex !== null && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditIndex(null); setDepartmentName(""); }}>
                <Text style={styles.cancelBtnText}>Discard Changes</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* RIGHT: DATA TABLE */}
          <View style={styles.tableCard}>
            <View style={styles.tableCardHeader}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput
                  placeholder="Filter departments..."
                  style={styles.searchTextInput}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 50 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Department Title</Text>
              <Text style={[styles.headerCell, { width: 100, textAlign: "center" }]}>Actions</Text>
            </View>
  <View style={{ flex: 1, maxHeight: 400 }}> {/* or minHeight */}

            <FlatList
              data={filteredDepartments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTableRow}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matching departments found.</Text>
              }
            />
          </View>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  webWrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  mainContent: { flex: 1, padding: Platform.OS === 'web' ? 32 : 16 },
  contentHeader: { marginBottom: 24 },
  circleBack: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4,
  },
  mainTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  subTitle: { color: "#64748b", fontSize: 14 },

  layoutContainer: { gap: 24, flex: 1, alignItems: 'flex-start' },
  formCard: {
    width: 340, backgroundColor: "#fff", borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  tableCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden", width: '100%',
  },

  tableCardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  formHeaderTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 4 },

  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc",
    borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: "#e2e8f0",
  },
  searchTextInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#1e293b" },

  fieldLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8, marginTop: 20, textTransform: "uppercase" },
  activeInput: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#2563eb", borderRadius: 10, paddingHorizontal: 12,
  },
  inputStyle: { flex: 1, height: 48, marginLeft: 10, fontSize: 15, color: "#1e293b" },

  submitBtn: { backgroundColor: "#2563eb", height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 24 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: { marginTop: 16, alignItems: "center" },
  cancelBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 13 },

  tableHeader: {
    flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 14,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  headerCell: { fontSize: 12, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" },
  tableRow: {
    flexDirection: "row", paddingVertical: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center",
  },
  tableCell: { fontSize: 15, color: "#334155" },

  actionCell: { width: 100, flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },

  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 14 },
});

export default DepartmentScreen;