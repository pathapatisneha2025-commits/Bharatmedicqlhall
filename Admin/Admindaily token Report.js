import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com";

export default function DailyTokensReport({ role = "admin", doctorName }) {
  const [allTokens, setAllTokens] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [selectedDoctor, setSelectedDoctor] = useState("All");
  const [dateFilter, setDateFilter] = useState("All"); 

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = SCREEN_WIDTH > 800;

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedDoctor, dateFilter, allTokens]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/book-appointment/all`);
      const json = await res.json();
      setAllTokens(json || []);
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    const filtered = allTokens.filter(t => {
      const apiDate = new Date(t.date).toISOString().split("T")[0];
      const dateMatch = dateFilter === "Today" ? apiDate === today : true;
      const doctorMatch = role === "admin"
          ? selectedDoctor === "All" || t.doctorname === selectedDoctor
          : t.doctorname === doctorName;
      return dateMatch && doctorMatch;
    });
    setTokens(filtered);
  };

  const getStatusDetails = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s.includes("complete")) return { label: "Completed", color: "#10b981", bg: "#ecfdf5" };
    if (s.includes("progress")) return { label: "In Consultation", color: "#f59e0b", bg: "#fffbeb" };
    return { label: "Waiting", color: "#6366f1", bg: "#eef2ff" };
  };

  const grouped = tokens.reduce((acc, t) => {
    const doctor = t.doctorname || "Unknown Doctor";
    const date = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!acc[doctor]) acc[doctor] = {};
    if (!acc[doctor][date]) acc[doctor][date] = [];
    acc[doctor][date].push(t);
    return acc;
  }, {});

  const doctors = ["All", ...new Set(allTokens.map(t => t.doctorname))];

  const downloadCSV = async () => {
    if (!tokens.length) {
      Alert.alert("No data to download");
      return;
    }
    const header = ["Token No", "Doctor", "Patient", "Date", "Status"];
    const rows = tokens.map(t => [
      t.tokenid,
      t.doctorname,
      t.name,
      new Date(t.date).toLocaleDateString(),
      getStatusDetails(t.status).label,
    ]);
    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'daily_tokens.csv';
      a.click();
    } else {
      const fileUri = `${FileSystem.cacheDirectory}daily_tokens.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv);
      await Sharing.shareAsync(fileUri);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      {/* HEADER SECTION */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.mainTitle}>Appointment Tokens</Text>
            <Text style={styles.subTitle}>Daily booking activity and tracking</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadAction} onPress={downloadCSV}>
          <Feather name="download" size={18} color="#fff" />
          <Text style={styles.downloadText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* FILTERS PANEL */}
        <View style={styles.filterContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Timeframe</Text>
            <View style={styles.chipRow}>
              {["Today", "All"].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, dateFilter === d && styles.activeChip]}
                  onPress={() => setDateFilter(d)}
                >
                  <Text style={[styles.chipText, dateFilter === d && styles.activeChipText]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {role === "admin" && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Filter by Specialist</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {doctors.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, selectedDoctor === d && styles.activeChip]}
                    onPress={() => setSelectedDoctor(d)}
                  >
                    <Text style={[styles.chipText, selectedDoctor === d && styles.activeChipText]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loaderSub}>Fetching logs... {loadingCount}s</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([doctor, dates]) => (
            <View key={doctor} style={styles.doctorCard}>
              <View style={styles.doctorHeader}>
                <MaterialIcons name="person-pin" size={20} color="#2563eb" />
                <Text style={styles.doctorNameText}>{doctor}</Text>
              </View>

              {Object.entries(dates).map(([date, list]) => (
                <View key={date} style={styles.dateGroup}>
                  <View style={styles.dateDivider}>
                    <Text style={styles.dateText}>{date}</Text>
                    <View style={styles.line} />
                  </View>

                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 0.5 }]}>Token</Text>
                      <Text style={[styles.th, { flex: 1.5 }]}>Patient Name</Text>
                      <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Status</Text>
                    </View>

                    {list.map((t, i) => {
                      const status = getStatusDetails(t.status);
                      return (
                        <View key={i} style={styles.tableRow}>
                          <Text style={[styles.tdToken, { flex: 0.5 }]}>#{t.tokenid}</Text>
                          <Text style={[styles.tdName, { flex: 1.5 }]} numberOfLines={1}>{t.name}</Text>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
        
        {!loading && tokens.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Tokens Found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or date range</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#F8FAFC" },
  topHeader: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  mainTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  subTitle: { fontSize: 12, color: "#64748b" },
  downloadAction: { backgroundColor: "#2563eb", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  downloadText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  scrollContent: { padding: 20 },
  filterContainer: { marginBottom: 25, gap: 16 },
  filterSection: {},
  filterLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  activeChip: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  activeChipText: { color: "#fff" },

  doctorCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0", elevation: 2 },
  doctorHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  doctorNameText: { fontSize: 16, fontWeight: "700", color: "#1e293b" },

  dateGroup: { marginBottom: 20 },
  dateDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  dateText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  line: { flex: 1, height: 1, backgroundColor: "#f1f5f9" },

  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", padding: 12 },
  th: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: 'center' },
  tdToken: { fontSize: 13, fontWeight: "700", color: "#2563eb" },
  tdName: { fontSize: 14, color: "#334155", fontWeight: "500" },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },

  centerLoader: { marginTop: 50, alignItems: "center" },
  loaderSub: { marginTop: 10, color: "#64748b", fontWeight: "600" },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 10 },
  emptySub: { color: '#94a3b8', fontSize: 14 }
});