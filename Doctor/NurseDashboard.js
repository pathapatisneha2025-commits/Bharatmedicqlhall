import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getEmployeeId, clearStorage } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";
const { width } = Dimensions.get("window");

export default function NurseDashboard() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true); // Initial load only
  const [refreshing, setRefreshing] = useState(false); // Pull-to-refresh
  const [assignedDoctors, setAssignedDoctors] = useState([]);
  const [doctorTokens, setDoctorTokens] = useState({});
  const [filteredDoctorTokens, setFilteredDoctorTokens] = useState({});
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date) => new Date(date).toISOString().split("T")[0];

  // ----------------------
  // Fetch assigned doctors
  // ----------------------
  const fetchAssignedDoctors = async (nurseId, showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/doctor/nurse/assigned-doctor/${nurseId}`);
      const data = await res.json();
      if (data.success && data.doctors?.length) {
        setAssignedDoctors(data.doctors);
        fetchDoctorWiseTokens(data.doctors, showLoader);
      } else {
        setAssignedDoctors([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // ----------------------
  // Fetch doctor tokens
  // ----------------------
  const fetchDoctorWiseTokens = async (doctors, showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let grouped = {};
      await Promise.all(
        doctors.map(async (doc) => {
          const [bookRes, bookingRes] = await Promise.all([
            fetch(`${BASE_URL}/book-appointment/doctor/${doc.id}`),
            fetch(`${BASE_URL}/doctorbooking/doctor/${doc.id}`),
          ]);
          const bookData = await bookRes.json();
          const bookingData = await bookingRes.json();

          const tokens = [
            ...(bookData || [])
              .map((i) => ({
                id: `b-${i.id}`,
                tokenId: i.tokenid,
                name: i.patient_name || i.name,
                date: i.date,
                time: i.timeslot,
                age: i.patient_age,
                gender: i.gender,
                reason: i.reason || "General Checkup",
                status: i.status || "pending",
              }))
              .filter((t) => t.status === "pending"),
            ...(bookingData || [])
              .map((i) => ({
                id: `d-${i.id}`,
                tokenId: i.daily_id,
                name: i.patient_name,
                date: i.appointment_date,
                time: i.appointment_time,
                age: i.patient_age,
                gender: i.patient_gender,
                reason: i.reason || "Consultation",
                status: i.status || "pending",
              }))
              .filter((t) => t.status === "pending"),
          ].sort((a, b) => Number(a.tokenId) - Number(b.tokenId));

          grouped[doc.name] = tokens;
        })
      );

      setDoctorTokens(grouped);
      applyFilters(grouped, selectedDate, searchText);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // ----------------------
  // Initialize data
  // ----------------------
  const initData = async (showLoader = false) => {
    const nurseId = await getEmployeeId();
    if (!nurseId) {
      Alert.alert("Error", "No nurse ID found");
      return;
    }
    fetchAssignedDoctors(nurseId, showLoader);
  };

  // ----------------------
  // Auto-refresh silently
  // ----------------------
  useEffect(() => {
    initData(true); // show loader only first time
    const interval = setInterval(() => initData(false), 10000); // silent auto-refresh
    return () => clearInterval(interval);
  }, []);

  // ----------------------
  // Pull-to-refresh
  // ----------------------
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    initData(true).finally(() => setRefreshing(false));
  }, []);

  // ----------------------
  // Filtering
  // ----------------------
  const applyFilters = (grouped, date, text) => {
    const selected = formatDate(date);
    const q = text.toLowerCase();
    let filtered = {};
    Object.keys(grouped).forEach((doctor) => {
      const list = grouped[doctor].filter((t) => {
        const matchesDate = formatDate(t.date) === selected;
        const matchesSearch =
          t.name?.toLowerCase().includes(q) ||
          String(t.tokenId).includes(q) ||
          t.reason?.toLowerCase().includes(q);
        return matchesDate && matchesSearch;
      });
      if (list.length) filtered[doctor] = list;
    });
    setFilteredDoctorTokens(filtered);
  };

  const onDateChange = (_, date) => {
    setShowPicker(false);
    if (date) {
      setSelectedDate(date);
      applyFilters(doctorTokens, date, searchText);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    applyFilters(doctorTokens, selectedDate, text);
  };

  const allTokens = Object.values(filteredDoctorTokens).flat();

  const handleLogout = async () => {
    await clearStorage();
    navigation.reset({ index: 0, routes: [{ name: "SelectRole" }] });
  };

  // ----------------------
  // Render
  // ----------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <Text style={styles.header}>👩‍⚕️ Nurse Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutSmall}>
          <Ionicons name="log-out-outline" size={24} color="#e53935" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.summaryRow}>
          <SummaryCard label="Total" value={allTokens.length} color="#2196F3" />
          <SummaryCard
            label="Waiting"
            value={allTokens.filter((t) => t.status === "pending").length}
            color="#FF9800"
          />
          <SummaryCard
            label="Done"
            value={allTokens.filter((t) => t.status === "completed").length}
            color="#4CAF50"
          />
        </View>

        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar" size={16} color="#555" />
            <Text style={styles.dateBtnText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={14} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        {showPicker && <DateTimePicker value={selectedDate} mode="date" onChange={onDateChange} />}

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.doctorGrid}>
            {Object.keys(filteredDoctorTokens).length === 0 ? (
              <Text style={styles.infoText}>No Active Patients</Text>
            ) : (
              Object.entries(filteredDoctorTokens).map(([doctorName, tokens]) => {
                const current = tokens[0];
                const others = tokens.slice(1);

                return (
                  <View key={doctorName} style={styles.doctorSectionSide}>
                    <Text style={styles.doctorNameHeader} numberOfLines={1}>
                      👨‍⚕️ {doctorName}
                    </Text>

                    {current ? (
                      <View style={styles.liveCard}>
                        <View style={styles.liveTag}>
                          <View style={styles.pulse} />
                          <Text style={styles.liveTagText}>IN CABIN</Text>
                        </View>
                        <Text style={styles.liveToken}>#{current.tokenId}</Text>
                        <Text style={styles.livePatient} numberOfLines={1}>
                          {current.name}
                        </Text>
                        <Text style={styles.liveDetails}>
                          {current.age}y | {current.gender}
                        </Text>
                        <Text style={styles.liveReason} numberOfLines={1}>
                          💬 {current.reason}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.noLiveCard}>
                        <Text style={styles.noLiveText}>No Active Patient</Text>
                      </View>
                    )}

                    {others.length > 0 && (
                      <>
                        <Text style={styles.waitingTitle}>Next in Queue</Text>
                        {others.map((t) => (
                          <View key={t.id} style={styles.miniCard}>
                            <View style={styles.miniTokenCircle}>
                              <Text style={styles.miniTokenText}>{t.tokenId}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 6 }}>
                              <Text style={styles.miniName} numberOfLines={1}>
                                {t.name}
                              </Text>
                              <Text style={styles.miniInfo}>
                                {t.time} • {t.gender[0]}
                              </Text>
                            </View>
                            <View style={[styles.miniStatus, styles.bgWait]}>
                              <Text style={styles.miniStatusText}>Wait</Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryCard = ({ label, value, color }) => (
  <View style={styles.summaryCard}>
    <Text style={[styles.summaryNumber, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F7FA" },
  fixedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  header: { fontSize: 18, fontWeight: "bold", color: "#333" },
  logoutSmall: { padding: 5 },
  scrollContent: { padding: 8 },

  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryCard: { backgroundColor: "#fff", width: "31%", padding: 10, borderRadius: 12, alignItems: "center", elevation: 1 },
  summaryNumber: { fontSize: 18, fontWeight: "bold" },
  summaryLabel: { fontSize: 10, color: "#777", marginTop: 2 },

  filterBar: { flexDirection: "row", marginBottom: 15, gap: 8 },
  dateBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 8, borderRadius: 10, flex: 0.4, elevation: 1 },
  dateBtnText: { marginLeft: 4, fontSize: 11, fontWeight: "700", color: "#444" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 10, borderRadius: 10, flex: 0.6, elevation: 1 },
  searchInput: { height: 35, fontSize: 12, flex: 1, marginLeft: 5 },

  doctorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  doctorSectionSide: {
    width: '49%', 
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
  },
  doctorNameHeader: { fontSize: 14, fontWeight: "bold", color: "#1E88E5", marginBottom: 10, textAlign: 'center' },

  liveCard: { backgroundColor: "#1E88E5", padding: 12, borderRadius: 12, alignItems: "center" },
  liveTag: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginBottom: 6 },
  pulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CAF50", marginRight: 4 },
  liveTagText: { color: "#fff", fontSize: 8, fontWeight: "bold" },
  
  // FONT REDUCED TO 22
  liveToken: { color: "#fff", fontSize: 15, fontWeight: "900", lineHeight: 28 },
  
  livePatient: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 2 },
  liveDetails: { color: "#E3F2FD", fontSize: 10, fontWeight: "500" },
  liveReason: { color: "#BBDEFB", fontSize: 9, fontStyle: 'italic', marginTop: 4 },

  noLiveCard: { padding: 25, backgroundColor: "#F5F5F5", borderRadius: 12, alignItems: "center" },
  noLiveText: { color: "#999", fontSize: 11, fontWeight: '600' },

  waitingTitle: { fontSize: 10, fontWeight: '800', color: '#555', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  miniCard: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  miniTokenCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#E3F2FD", justifyContent: 'center', alignItems: 'center' },
  miniTokenText: { color: "#1E88E5", fontWeight: "bold", fontSize: 9 },
  miniName: { fontSize: 10, fontWeight: "600", color: "#333" },
  miniInfo: { fontSize: 8, color: "#888" },
  miniStatus: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  miniStatusText: { fontSize: 7, fontWeight: 'bold' },
  bgDone: { backgroundColor: '#E8F5E9' },
  bgWait: { backgroundColor: '#FFF3E0' },

  moreText: { fontSize: 9, color: '#1E88E5', marginTop: 8, textAlign: 'center', fontWeight: '600' },
  infoText: { width: '100%', textAlign: 'center', marginTop: 50, color: "#999" },
});