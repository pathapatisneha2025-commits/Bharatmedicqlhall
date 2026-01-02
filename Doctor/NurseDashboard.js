import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getEmployeeId, clearStorage } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function NurseDashboard() {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const navigation = useNavigation();

  // Format date → YYYY-MM-DD
  const formatDate = (date) =>
    new Date(date).toISOString().split("T")[0];

  // Get Nurse ID
  useEffect(() => {
    (async () => {
      const id = await getEmployeeId();
      if (id) {
        fetchAssignedDoctor(id);
      } else {
        Alert.alert("Error", "No nurse ID found");
      }
    })();
  }, []);

  // Fetch assigned doctor
  const fetchAssignedDoctor = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/doctor/nurse/assigned-doctor/${id}`);
      const data = await res.json();

      if (data.success) {
        setAssignedDoctor(data.doctor);
        fetchTokens(data.doctor.doctor_id);
      } else {
        Alert.alert("Not Assigned", "Admin has not assigned any doctor yet");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch tokens
  const fetchTokens = async (doctorId) => {
    setLoading(true);
    try {
      const [bookRes, bookingRes] = await Promise.all([
        fetch(`${BASE_URL}/book-appointment/doctor/${doctorId}`),
        fetch(`${BASE_URL}/doctorbooking/doctor/${doctorId}`),
      ]);

      const [bookData, bookingData] = await Promise.all([
        bookRes.json(),
        bookingRes.json(),
      ]);

      const formattedBook = (bookData || []).map((i) => ({
        id: i.id,
        tokenId: i.tokenid,
        name: i.patient_name || i.name,
        date: i.date,
        time: i.timeslot,
        age: i.patient_age,
        gender: i.gender,
        reason: i.reason || "General Checkup",
        status: i.status || "pending",
      }));

      const formattedBooking = (bookingData || []).map((i) => ({
        id: i.id,
        tokenId: i.daily_id,
        name: i.patient_name,
        date: i.appointment_date,
        time: i.appointment_time,
        age: i.patient_age,
        gender: i.patient_gender,
        reason: i.reason || "Consultation",
        status: i.status || "pending",
      }));

      const all = [...formattedBook, ...formattedBooking].sort(
        (a, b) => Number(a.tokenId) - Number(b.tokenId)
      );

      setTokens(all);
      applyDateFilter(all, selectedDate);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Apply date filter
  const applyDateFilter = (allTokens, date) => {
    const selected = formatDate(date);
    const filtered = allTokens.filter(
      (t) => formatDate(t.date) === selected
    );
    setFilteredTokens(filtered);
  };

  // Date change
  const onDateChange = (event, date) => {
    setShowPicker(false);
    if (date) {
      setSelectedDate(date);
      applyDateFilter(tokens, date);
    }
  };

  // Search
  const handleSearch = (text) => {
    setSearchText(text);
    const q = text.toLowerCase();

    const filtered = tokens.filter(
      (t) =>
        formatDate(t.date) === formatDate(selectedDate) &&
        (
          t.name?.toLowerCase().includes(q) ||
          String(t.tokenId).includes(q) ||
          t.reason?.toLowerCase().includes(q)
        )
    );

    setFilteredTokens(filtered);
  };

  const handleLogout = async () => {
    await clearStorage();
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>👩‍⚕️ Nurse Dashboard</Text>

        {assignedDoctor && (
          <Text style={styles.subHeader}>
            Assigned Doctor: {assignedDoctor.doctor_name}
          </Text>
        )}

        {/* SUMMARY CARDS */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{filteredTokens.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {filteredTokens.filter(t => t.status === "pending").length}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {filteredTokens.filter(t => t.status === "Completed").length}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

{/* DATE PICKER */}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#fff" />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#555" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search token / name / reason"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" />
        ) : filteredTokens.length === 0 ? (
          <Text style={styles.infoText}>No tokens found</Text>
        ) : (
          filteredTokens.map((t) => (
            <View key={t.id} style={styles.card}>
              <Text style={styles.token}>Token: {t.tokenId}</Text>
              <Text style={styles.name}>👤 {t.name}</Text>
              <Text style={styles.text}>📅 {t.date}</Text>
              <Text style={styles.text}>🕒 {t.time}</Text>
              <Text style={styles.text}>🎂 {t.age} | ⚧ {t.gender}</Text>
              <Text style={styles.text}>💬 {t.reason}</Text>

              <Text
                style={[
                  styles.status,
                  t.status === "completed"
                    ? styles.completed
                    : t.status === "inProgress"
                    ? styles.inProgress
                    : styles.pending,
                ]}
              >
                {t.status}
              </Text>
            </View>
          ))
        )}

        {/* LOGOUT */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { padding: 15 },
  header: { fontSize: 24, fontWeight: "bold", color: "#2196F3" },
  subHeader: { fontSize: 18, marginBottom: 10 },

  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryCard: {
    backgroundColor: "#fff",
    width: "32%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 3,
  },
  summaryNumber: { fontSize: 20, fontWeight: "bold", color: "#1E88E5" },
  summaryLabel: { fontSize: 12, color: "#555" },

  dateButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  dateText: { color: "#fff", marginLeft: 8, fontWeight: "600" },

  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  searchInput: { marginLeft: 10, flex: 1 },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    elevation: 3,
  },
  token: { fontWeight: "bold", fontSize: 16 },
  name: { fontWeight: "600", marginTop: 4 },
  text: { color: "#555" },

  status: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: "600",
  },
  pending: { backgroundColor: "#fff3cd", color: "#856404" },
  inProgress: { backgroundColor: "#d1ecf1", color: "#0c5460" },
  completed: { backgroundColor: "#d4edda", color: "#155724" },

  infoText: { textAlign: "center", marginTop: 20 },

  logoutContainer: { alignItems: "flex-end", marginTop: 10 },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#e53935",
    padding: 8,
    borderRadius: 8,
  },
  logoutText: { color: "#fff", marginLeft: 6 },
});
