// screens/DoctorDashboard.js
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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorId, clearStorage } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";

const { height } = Dimensions.get("window");

const DoctorDashboard = () => {
    const navigation = useNavigation();

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

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollHeight = useRef(0);
  const contentHeight = useRef(0);

  // ✅ Auto-scroll animation logic (very slow)
  useEffect(() => {
    if (tokens.length === 0) return;

    const startAutoScroll = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollY, {
            toValue: contentHeight.current - scrollHeight.current,
            duration: (contentHeight.current - scrollHeight.current) * 90, // ⚡ Very slow speed
            useNativeDriver: true,
          }),
          Animated.delay(1000), // pause at end
          Animated.timing(scrollY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(20), // pause at top
        ])
      ).start();
    };

    startAutoScroll();
  }, [tokens]);

  // ✅ Fetch doctor details
 const fetchDoctorDetails = async () => {
  try {
    const storedDoctorId = await getDoctorId();  // ✅ Directly use doctorId
    if (!storedDoctorId) {
      console.log("❌ No doctor ID found in storage");
      return;
    }

    // ✅ Fetch doctor info
    const res = await fetch(
      `https://hospitaldatabasemanagement.onrender.com/doctor/${storedDoctorId}`
    );

    const data = await res.json();
    const doctor = data.doctor || data;
    setDoctorInfo(doctor);

    // ✅ DIRECTLY use storedDoctorId for summary & appointments
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
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/doctor/appointments/summary/${doctorId}`
      );
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
        fetch(
          `https://hospitaldatabasemanagement.onrender.com/book-appointment/doctor/${doctorId}`
        ),
        fetch(
          `https://hospitaldatabasemanagement.onrender.com/doctorbooking/doctor/${doctorId}`
        ),
      ]);

      const [bookData, bookingData] = await Promise.all([
        bookRes.json(),
        bookingRes.json(),
      ]);

      const formattedBook = (bookData || []).map((item) => ({
        id: item.id,
        type: "book",
        tokenId: item.tokenid,
        name: item.patient_name || item.name || "Unknown",
        age: item.patient_age || item.age || "-",
        gender: item.gender || "-",
        bloodgroup: item.bloodgroup || "-",
        reason: item.reason || "General Checkup",
        date: item.date ? new Date(item.date).toLocaleDateString() : "-",
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
        date: item.appointment_date
          ? new Date(item.appointment_date).toLocaleDateString()
          : "-",
        time: item.appointment_time || "N/A",
        status: item.status || "Pending",
      }));

      const allAppointments = [...formattedBook, ...formattedBooking];
      const sortedAppointments = allAppointments.sort((a, b) => {
        const idA = Number(a.tokenId || a.dailyId || 0);
        const idB = Number(b.tokenId || b.dailyId || 0);
        return idA - idB;
      });

      setTokens(sortedAppointments);

      setDoctorData({
        totalPatients: sortedAppointments.length,
        inQueue: sortedAppointments.filter((a) =>
          ["pending", "in progress", "waiting"].includes(
            (a.status || "pending").toLowerCase()
          )
        ).length,
        completed: sortedAppointments.filter(
          (a) => (a.status || "").toLowerCase() === "completed"
        ).length,
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
      case "completed":
        return styles.completed;
      case "in progress":
        return styles.inProgress;
      case "waiting":
        return styles.waiting;
      default:
        return {};
    }
  };

  const showDetails = (token) => {
    Alert.alert(
      "Patient Details",
      `👤 Name: ${token.name}\n📅 Date: ${token.date}\n🕒 Time: ${token.time}\n🎂 Age: ${token.age}\n⚧ Gender: ${token.gender}\n🩸 Blood Group: ${token.bloodgroup}\n💬 Reason: ${token.reason}\n📍 Status: ${token.status}`,
      [{ text: "Close", style: "cancel" }]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Ionicons name="pulse-outline" size={28} color="#007bff" />
        <Text style={styles.title}>Bharat Medical Hall</Text>
      </View>

<View style={styles.subHeader}>
  <Text style={styles.subTitle}>Doctor Dashboard</Text>
 
</View>

      {doctorInfo && (
        <View style={styles.doctorInfoCard}>
          <Text style={styles.doctorName}>👨‍⚕️ {doctorInfo.name}</Text>
          <Text style={styles.doctorEmail}>📧 {doctorInfo.email}</Text>
          <Text style={styles.doctorRole}>
            🩺 Department: {doctorInfo.department || "N/A"}
          </Text>
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

      {/* Auto scrolling Animated View */}
      <View
        style={{ height: height * 0.45, overflow: "hidden", marginBottom: 40 }}
        onLayout={(e) => (scrollHeight.current = e.nativeEvent.layout.height)}
      >
        <Animated.View
          style={{
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, contentHeight.current || 1],
                  outputRange: [0, -contentHeight.current || -1],
                }),
              },
            ],
          }}
          onLayout={(e) => (contentHeight.current = e.nativeEvent.layout.height)}
        >
          {tokens.length > 0 ? (
            tokens.map((token) => (
              <View key={token.id} style={styles.tokenCard}>
                <View style={styles.tokenLeft}>
                  <View style={styles.tokenCircle}>
                    <Text style={styles.tokenId}>
                      {token.tokenId || token.dailyId}
                    </Text>
                  </View>
                  <View style={{ marginLeft: 10, maxWidth: 180 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {token.name}
                    </Text>
                    <View style={styles.row}>
                      <Ionicons name="time-outline" size={14} color="#777" />
                      <Text style={styles.time}>
                        {" "}
                        {token.date} {token.time}
                      </Text>
                    </View>
                    <Text style={styles.detail}>
                      Age: {token.age} | Gender: {token.gender}
                    </Text>
                    <Text style={styles.detail} numberOfLines={1}>
                      Reason: {token.reason}
                    </Text>
                  </View>
                </View>

                <View style={styles.tokenRight}>
                  <View
                    style={[styles.statusBadge, getStatusColor(token.status)]}
                  >
                    <Text style={styles.statusText}>{token.status}</Text>
                  </View>
                  <TouchableOpacity onPress={() => showDetails(token)}>
                    <Ionicons
                      name="eye-outline"
                      size={22}
                      color="#007bff"
                      style={styles.eyeIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text
              style={{ color: "#777", textAlign: "center", marginVertical: 10 }}
            >
              No appointments found
            </Text>
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8faff", paddingHorizontal: 15 },
  header: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginLeft: 8, color: "#007bff" },
  subTitle: { color: "#666", marginBottom: 10 },
  doctorInfoCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  doctorName: { fontSize: 18, fontWeight: "bold", color: "#007bff" },
  doctorEmail: { color: "#333", marginTop: 5 },
  doctorRole: { color: "#666", marginTop: 5, fontStyle: "italic" },
  summaryCard: {
    backgroundColor: "#e9f5ff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 8,
  },
  summaryText: { fontSize: 15, color: "#333", marginBottom: 3 },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "31%",
    alignItems: "center",
    paddingVertical: 12,
    elevation: 3,
  },
  statValue: { fontSize: 20, fontWeight: "bold", marginTop: 5 },
  statLabel: { color: "#777", fontSize: 13 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007bff",
  },
  tokenCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  tokenLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  tokenCircle: {
    backgroundColor: "#1E90FF",
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  tokenId: { color: "#fff", fontWeight: "bold" },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  time: { color: "#777", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center" },
  detail: { color: "#555", fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignSelf: "flex-end",
  },
  waiting: { backgroundColor: "#fff3cd" },
  inProgress: { backgroundColor: "#d6eaff" },
  completed: { backgroundColor: "#d4edda" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#333" },
  tokenRight: { alignItems: "center", justifyContent: "center" },
  eyeIcon: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#e9f5ff",
    borderRadius: 20,
    elevation: 2,
  },
  
});

export default DoctorDashboard;
