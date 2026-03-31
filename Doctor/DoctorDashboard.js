import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorId } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

const DoctorDashboard = () => {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  
  // Sidebar logic
  const isDesktop = SCREEN_WIDTH > 1024;

  const [doctorData, setDoctorData] = useState({
    totalPatients: 0,
    inQueue: 0,
    completed: 0,
  });
  const [summary, setSummary] = useState({
    weekly: 0,
    monthly: 0,
    total: 0,
  });
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
const [activeItem, setActiveItem] = useState("Dashboard");

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollHeight = useRef(0);
  const contentHeight = useRef(0);
  const animationRef = useRef(null);

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const startAutoScroll = () => {
    const distance = contentHeight.current - scrollHeight.current;
    if (distance <= 0) return;
    scrollY.setValue(0);
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollY, {
          toValue: -distance,
          duration: distance * 400,
          useNativeDriver: true,
        }),
        Animated.timing(scrollY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );
    animationRef.current.start();
  };

  useEffect(() => {
    if (tokens.length > 0 && contentHeight.current > scrollHeight.current) {
      startAutoScroll();
    }
    return () => {
      if (animationRef.current) animationRef.current.stop();
    };
  }, [tokens]);

  const fetchDoctorDetails = async () => {
    try {
      const storedDoctorId = await getDoctorId();
      if (!storedDoctorId) return;
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/doctor/${storedDoctorId}`);
      const data = await res.json();
      setDoctorInfo(data.doctor || data);
      await Promise.all([
        fetchDoctorAppointments(storedDoctorId),
        fetchSummaryData(storedDoctorId),
      ]);
    } catch (err) {
      console.error("❌ Error fetching doctor info:", err);
    }
  };

  const fetchSummaryData = async (doctorId) => {
    try {
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/doctor/appointments/summary/${doctorId}`);
      const data = await res.json();
      if (data.success && data.summary) {
        setSummary({
          weekly: data.summary.weekly_appointments || 0,
          monthly: data.summary.monthly_appointments || 0,
          total: data.summary.total_appointments || 0,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching summary:", error);
    }
  };

  const fetchDoctorAppointments = async (doctorId) => {
    try {
      const [bookRes, bookingRes] = await Promise.all([
        fetch(`https://hospitaldatabasemanagement.onrender.com/book-appointment/doctor/${doctorId}`),
        fetch(`https://hospitaldatabasemanagement.onrender.com/doctorbooking/doctor/${doctorId}`),
      ]);

      const [bookData, bookingData] = await Promise.all([bookRes.json(), bookingRes.json()]);

      const formattedBook = (bookData || []).map((item) => ({
        id: item.id,
        type: "book",
        tokenId: item.tokenid,
        name: item.patient_name || item.name || "Unknown",
        age: item.patient_age || item.age || "-",
        gender: item.gender || "-",
        bloodgroup: item.bloodgroup || "-",
        reason: item.reason || "General Checkup",
        date: item.date ? new Date(item.date) : null,
        time: item.timeslot || "N/A",
        status: item.status || "Pending",
      }));

      const formattedBooking = (bookingData || []).map((item) => ({
        id: item.id,
        type: "doctorbooking",
        dailyId: item.daily_id,
        name: item.patient_name || item.name || "Unknown",
        age: item.patient_age || item.age || "-",
        gender: item.patient_gender || "-",
        bloodgroup: item.patient_blood_group || "-",
        reason: item.reason || "Consultation",
        date: item.appointment_date ? new Date(item.appointment_date) : null,
        time: item.appointment_time || "N/A",
        status: item.status || "Pending",
      }));

      const allAppointments = [...formattedBook, ...formattedBooking];

      const sortedAppointments = allAppointments.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
      });

      sortedAppointments.forEach((item) => {
        if (item.date) item.date = item.date.toLocaleDateString();
      });

      setTokens(sortedAppointments);

      setDoctorData({
        totalPatients: sortedAppointments.length,
        inQueue: sortedAppointments.filter((a) =>
          ["pending", "in progress", "waiting"].includes((a.status || "pending").toLowerCase())
        ).length,
        completed: sortedAppointments.filter((a) => (a.status || "").toLowerCase() === "completed").length,
      });
    } catch (err) {
      console.error("❌ Error fetching appointments:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctorDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDoctorDetails();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return styles.completed;
      case "in progress": return styles.inProgress;
      case "waiting": return styles.waiting;
      default: return {};
    }
  };

  const showDetails = (token) => {
    showAlert("Patient Details", `👤 Name: ${token.name}\n📅 Date: ${token.date}\n🕒 Time: ${token.time}\n🎂 Age: ${token.age}\n⚧ Gender: ${token.gender}\n🩸 Blood Group: ${token.bloodgroup}\n💬 Reason: ${token.reason}\n📍 Status: ${token.status}`);
  };

  const SidebarItem = ({ icon, label, onPress }) => (
  <TouchableOpacity
    style={[styles.sidebarItem, activeItem === label && styles.sidebarItemActive]}
    onPress={() => {
      setActiveItem(label);
      if (onPress) onPress();
    }}
  >
    <Ionicons name={icon} size={20} color={activeItem === label ? "#fff" : "#718096"} />
    <Text style={[styles.sidebarLabel, activeItem === label && styles.sidebarLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

  return (
    <View style={styles.mainScreenWrapper}>
    {isDesktop && (
  <View style={styles.sidebar}>
    <View style={styles.brandContainer}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>BM</Text>
      </View>
      <Text style={styles.brandName}>Bharat Medical</Text>
    </View>

    {/* Dashboard, Appointments, Profile */}
    <SidebarItem
      icon="grid-outline"
      label="Dashboard"
      onPress={() => navigation.navigate("DoctorDashboard")} 
    />
    <SidebarItem
      icon="calendar-outline"
      label="Appointments"
      onPress={() => navigation.navigate("DoctorAppointmentsScreen")}
    />
    <SidebarItem
      icon="person-outline"
      label="Profile"
      onPress={() => navigation.navigate("DoctorProfile")}
    />

    <TouchableOpacity
      style={styles.logoutBtn}
      onPress={() => navigation.navigate("SelectRole")}
    >
      <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  </View>
)}

      {/* 🟧 Main Dashboard Content */}
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={28} color="#007bff" />
          </TouchableOpacity>
          <Ionicons name="pulse-outline" size={28} color="#007bff" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Bharat Medical Hall</Text>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.subTitle}>Doctor Dashboard</Text>
        </View>

        {doctorInfo && (
          <View style={styles.doctorInfoCard}>
            <Text style={styles.doctorName}>👨‍⚕️ {doctorInfo.name}</Text>
            <Text style={styles.doctorEmail}>📧 {doctorInfo.email}</Text>
            <Text style={styles.doctorRole}>🩺 Department: {doctorInfo.department || "N/A"}</Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Appointment Summary</Text>
          <Text style={styles.summaryText}>This Week: {summary.weekly}</Text>
          <Text style={styles.summaryText}>This Month: {summary.monthly}</Text>
          <Text style={styles.summaryText}>Total: {summary.total}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={22} color="#007bff" />
            <Text style={styles.statValue}>{doctorData.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color="#ffb300" />
            <Text style={styles.statValue}>{doctorData.inQueue}</Text>
            <Text style={styles.statLabel}>In Queue</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-outline" size={22} color="#28a745" />
            <Text style={styles.statValue}>{doctorData.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Live Token Queue</Text>

        {tokens.length > 0 ? (
          <View
            style={{ height: SCREEN_HEIGHT * 0.45, overflow: "hidden", marginBottom: 40 }}
            onLayout={(e) => {
              scrollHeight.current = e.nativeEvent.layout.height;
              if (contentHeight.current > scrollHeight.current && tokens.length > 0) startAutoScroll();
            }}
          >
            <Animated.View
              style={{ transform: [{ translateY: scrollY }] }}
              onLayout={(e) => {
                contentHeight.current = e.nativeEvent.layout.height;
                if (scrollHeight.current && contentHeight.current > scrollHeight.current) startAutoScroll();
              }}
            >
              {tokens.map((token) => (
                <View key={token.id} style={styles.tokenCard}>
                  <View style={styles.tokenLeft}>
                    <View style={styles.tokenCircle}>
                      <Text style={styles.tokenId}>{token.tokenId || token.dailyId}</Text>
                    </View>
                    <View style={{ marginLeft: 10, maxWidth: 180 }}>
                      <Text style={styles.name} numberOfLines={1}>{token.name}</Text>
                      <View style={styles.row}>
                        <Ionicons name="time-outline" size={14} color="#777" />
                        <Text style={styles.time}> {token.date} {token.time}</Text>
                      </View>
                      <Text style={styles.detail}>Age: {token.age} | Gender: {token.gender}</Text>
                      <Text style={styles.detail} numberOfLines={1}>Reason: {token.reason}</Text>
                    </View>
                  </View>
                  <View style={styles.tokenRight}>
                    <View style={[styles.statusBadge, getStatusColor(token.status)]}>
                      <Text style={styles.statusText}>{token.status}</Text>
                    </View>
                    <TouchableOpacity onPress={() => showDetails(token)}>
                      <Ionicons name="eye-outline" size={22} color="#007bff" style={styles.eyeIcon} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        ) : (
          <Text style={{ color: "#777", textAlign: "center", marginVertical: 10 }}>No appointments found</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainScreenWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#f8faff" },
  
  // Sidebar Styles
sidebar: { 
  width: 260, 
  backgroundColor: "#007BFF",  // <-- changed from white to blue
  borderRightWidth: 1, 
  borderColor: "#E2E8F0", 
  padding: 20 
},
  brandContainer: { flexDirection: "row", alignItems: "center", marginBottom: 40, paddingLeft: 10 },
  logoBox: { width: 32, height: 32, backgroundColor: "#007BFF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 10 },
  logoText: { color: "#fff", fontWeight: "bold" },
  brandName: { fontWeight: "bold", fontSize: 18, color: "#2D3748" },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 5 },
  sidebarItemActive: { backgroundColor: "#007BFF" },
  sidebarLabel: { marginLeft: 12, color: "#718096", fontWeight: "500" },
  sidebarLabelActive: { color: "#fff" },
  logoutBtn: { flexDirection: "row", alignItems: "center", marginTop: 'auto', padding: 12 },
  logoutText: { marginLeft: 12, color: "#E53E3E", fontWeight: "600" },

  // Original Styles
  container: { flex: 1, backgroundColor: "#f8faff", paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginLeft: 8, color: "#007bff" },
  subTitle: { color: "#666", fontSize: 16, marginVertical: 10 },
  doctorInfoCard: { backgroundColor: "#fff", padding: 20, borderRadius: 14, marginBottom: 20, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  doctorName: { fontSize: 18, fontWeight: "bold", color: "#007bff" },
  doctorEmail: { color: "#333", marginTop: 6, fontSize: 14 },
  doctorRole: { color: "#666", marginTop: 4, fontStyle: "italic", fontSize: 14 },
  summaryCard: { backgroundColor: "#e9f5ff", padding: 18, borderRadius: 14, marginBottom: 20, elevation: 2 },
  summaryTitle: { fontSize: 18, fontWeight: "bold", color: "#007bff", marginBottom: 8 },
  summaryText: { fontSize: 15, color: "#333", marginBottom: 4 },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  statCard: { backgroundColor: "#fff", borderRadius: 14, width: "31%", alignItems: "center", paddingVertical: 14, elevation: 3 },
  statValue: { fontSize: 20, fontWeight: "bold", marginTop: 6 },
  statLabel: { color: "#777", fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12, color: "#007bff" },
  tokenCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  tokenLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  tokenCircle: { backgroundColor: "#1E90FF", width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  tokenId: { color: "#fff", fontWeight: "bold" },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  time: { color: "#777", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  detail: { color: "#555", fontSize: 13, marginTop: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, alignSelf: "flex-end" },
  waiting: { backgroundColor: "#fff3cd" },
  inProgress: { backgroundColor: "#d6eaff" },
  completed: { backgroundColor: "#d4edda" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#333" },
  tokenRight: { alignItems: "center", justifyContent: "center" },
  eyeIcon: { marginTop: 6, padding: 6, backgroundColor: "#e9f5ff", borderRadius: 20, elevation: 2 },
});

export default DoctorDashboard;