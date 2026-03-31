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
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/salarydeduction";

export default function SalaryDeductionsScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [deductionPerDay, setDeductionPerDay] = useState("");
  const [unauthorizedPenalty, setUnauthorizedPenalty] = useState("");
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = SCREEN_WIDTH > 800;

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.style !== "cancel");
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
    } catch (err) {
      showAlert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!minSalary || !deductionPerDay || !unauthorizedPenalty) {
      showAlert("Validation Error", "Required fields: Min Salary, Deduction, and Penalty.");
      return;
    }

    const payload = {
      min_salary: parseInt(minSalary),
      max_salary: maxSalary ? parseInt(maxSalary) : null,
      deduction_per_day: parseInt(deductionPerDay),
      unauthorized_penalty: parseInt(unauthorizedPenalty),
    };

    try {
      setLoading(true);
      const url = editId ? `${BASE_URL}/update/${editId}` : `${BASE_URL}/add`;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showAlert("Success", editId ? "Rule updated" : "Rule added");
        resetForm();
        fetchData();
      }
    } catch (err) {
      showAlert("Error", "Failed to save rule");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMinSalary("");
    setMaxSalary("");
    setDeductionPerDay("");
    setUnauthorizedPenalty("");
    setEditId(null);
  };

  const handleEdit = (item) => {
    setMinSalary(item.min_salary.toString());
    setMaxSalary(item.max_salary ? item.max_salary.toString() : "");
    setDeductionPerDay(item.deduction_per_day.toString());
    setUnauthorizedPenalty(item.unauthorized_penalty.toString());
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    showAlert("Confirm Delete", "Permanently remove this rule?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/delete/${id}`, { method: "DELETE" });
            if (response.ok) {
              showAlert("Success", "Rule removed");
              fetchData();
            }
          } catch (err) {
            showAlert("Error", "Failed to delete");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSearch = () => {
    const filtered = data.filter((item) =>
      item.min_salary.toString().includes(searchText) ||
      (item.max_salary ? item.max_salary.toString().includes(searchText) : false)
    );
    setFilteredData(filtered);
  };

  const renderItem = ({ item }) => (
    <View style={styles.ruleCard}>
      <View style={styles.cardInfo}>
        <View style={styles.badgeRow}>
          <View style={styles.rangeBadge}>
            <Text style={styles.rangeText}>
              ₹{item.min_salary} — {item.max_salary || "∞"}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Daily</Text>
            <Text style={styles.statValue}>₹{item.deduction_per_day}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderColor: '#e2e8f0' }]}>
            <Text style={styles.statLabel}>Penalty</Text>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>₹{item.unauthorized_penalty}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
          <Feather name="edit-3" size={16} color="#2563eb" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}>
          <Feather name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && loadingCount === 0) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Syncing Rules... {loadingCount}s</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.circleBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Deduction Rules</Text>
          <Text style={styles.headerSub}>Salary brackets and penalty configurations</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search by salary range..."
            value={searchText}
            onChangeText={(txt) => {
              setSearchText(txt);
              if (txt === "") setFilteredData(data);
            }}
            style={styles.searchTextInput}
          />
          <TouchableOpacity style={styles.goBtn} onPress={handleSearch}>
            <Text style={styles.goBtnText}>FIND</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.mainLayout, isWeb && styles.flexRow]}>
          
          {/* Form Card */}
          <View style={[styles.formCard, isWeb && { width: 350 }]}>
            <Text style={styles.formTitle}>{editId ? "Update Rule" : "New Configuration"}</Text>
            
            <View style={styles.inputGrid}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Min Salary</Text>
                <TextInput keyboardType="numeric" value={minSalary} onChangeText={setMinSalary} style={styles.modernInput} placeholder="Min" />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Max Salary</Text>
                <TextInput keyboardType="numeric" value={maxSalary} onChangeText={setMaxSalary} style={styles.modernInput} placeholder="Max" />
              </View>
            </View>

            <Text style={styles.label}>Daily Deduction (₹)</Text>
            <TextInput keyboardType="numeric" value={deductionPerDay} onChangeText={setDeductionPerDay} style={styles.modernInput} />

            <Text style={styles.label}>Unauthorized Penalty (₹)</Text>
            <TextInput keyboardType="numeric" value={unauthorizedPenalty} onChangeText={setUnauthorizedPenalty} style={styles.modernInput} />

            <TouchableOpacity style={[styles.submitBtn, editId && styles.updateBtn]} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{editId ? "Apply Changes" : "Save Rule"}</Text>
            </TouchableOpacity>
            
            {editId && (
              <TouchableOpacity onPress={resetForm} style={styles.cancelLink}>
                <Text style={styles.cancelLinkText}>Discard Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List Card */}
          <View style={[styles.listContainer, isWeb && { flex: 1 }]}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Existing Rules</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{filteredData.length} active</Text>
              </View>
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No rules found.</Text>}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: 20,
    gap: 15,
  },
  circleBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  headerSub: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 40 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 25,
    elevation: 2,
  },
  searchTextInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1e293b",outlineStyle: "none" },
  goBtn: { backgroundColor: "#1e293b", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  goBtnText: { color: "#fff", fontWeight: "800", fontSize: 11, letterSpacing: 0.5 },

  mainLayout: { gap: 20 },
  flexRow: { flexDirection: 'row', alignItems: 'flex-start' },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 3,
  },
  formTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 20 },
  inputGrid: { flexDirection: "row", gap: 15 },
  inputWrapper: { flex: 1 },
  label: { fontSize: 11, fontWeight: "800", color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  modernInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 18,
    fontSize: 15,
    color: "#1e293b",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  updateBtn: { backgroundColor: "#1e293b" },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelLink: { marginTop: 15, alignItems: "center" },
  cancelLinkText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },

  listContainer: { gap: 12 },
  listHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 10 },
  listTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  countBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 11, fontWeight: '700', color: '#64748b' },

  ruleCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  badgeRow: { marginBottom: 12 },
  rangeBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  rangeText: { color: "#2563eb", fontWeight: "800", fontSize: 13 },
  statsContainer: { flexDirection: 'row', gap: 20 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1e293b' },

  cardActions: { gap: 10, justifyContent: "center", paddingLeft: 15 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  loaderCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderText: { marginTop: 15, color: "#64748b", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 40, fontSize: 15 },
});