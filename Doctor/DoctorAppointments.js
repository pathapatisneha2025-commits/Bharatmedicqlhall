import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDoctorId } from "../utils/storage";

export default function MyAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);

  // Responsive logic
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;

  // ------------------------------
  // Logic (Unchanged as requested)
  // ------------------------------
  const parseDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const formatDateToYYYYMMDD = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  const loadDoctorId = async () => {
    try {
      setLoading(true);
      const storedDoctorId = await getDoctorId();
      if (!storedDoctorId) {
        setLoading(false);
        return;
      }
      setDoctorId(storedDoctorId);
      await fetchDoctorAppointments(storedDoctorId);
    } catch (err) {
      console.error("❌ Error loading doctor ID:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedAppointments = async (doctorId) => {
    try {
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/book-appointment/doctor/${doctorId}`);
      const data = await res.json();
      return (data || []).map((item, index) => ({
        id: item.tokenid || `${index + 1}`,
        _key: `book-${item.tokenid}-${item.date}`,
        doctor: item.doctorname || "Unknown",
        specialization: item.department || "-",
        rawDate: item.date,
        date: item.date ? new Date(item.date).toLocaleDateString() : "-",
        time: item.timeslot || "N/A",
        fee: item.consultantfees ? `₹${item.consultantfees}` : "-",
        payment: item.paymentstatus?.toLowerCase() || "pending",
        source: "bookAppointment",
        name: item.patient_name || item.name || "Unknown",
        age: item.patient_age || item.age || "-",
        gender: item.gender || "-",
        bloodgroup: item.bloodgroup || "-",
        reason: item.reason || "General Checkup",
        status: item.status || "Pending",
      }));
    } catch (err) { return []; }
  };

  const fetchDoctorBookings = async (doctorId) => {
    try {
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/doctorbooking/doctor/${doctorId}`);
      const data = await res.json();
      return (data || []).map((item, index) => ({
        id: item.daily_id || `${index + 1}`,
        _key: `doctor-${item.daily_id}-${item.appointment_date}`,
        doctor: item.doctor_name || "Unknown",
        specialization: item.specialization || "-",
        rawDate: item.appointment_date,
        date: item.appointment_date ? new Date(item.appointment_date).toLocaleDateString() : "-",
        time: item.appointment_time || "N/A",
        fee: item.doctor_consultant_fee ? `₹${item.doctor_consultant_fee}` : "-",
        payment: item.paymentStatus?.toLowerCase() || "pending",
        source: "doctorBooking",
        name: item.patient_name || item.name || "Unknown",
        age: item.patient_age || item.age || "-",
        gender: item.patient_gender || "-",
        bloodgroup: item.patient_blood_group || "-",
        reason: item.reason || "Consultation",
        status: item.status || "Pending",
      }));
    } catch (err) { return []; }
  };

 // STEP 3: Combine both bookings and sort by newest appointment date first
const fetchDoctorAppointments = async (doctorId) => {
  try {
    // 1️⃣ Fetch both types of appointments
    const [bookedAppointments, doctorBookings] = await Promise.all([
      fetchBookedAppointments(doctorId),
      fetchDoctorBookings(doctorId),
    ]);

    // 2️⃣ Merge both arrays
    const mergedAppointments = [...bookedAppointments, ...doctorBookings];

    // 3️⃣ Sort by appointment date (newest first) using rawDate
    mergedAppointments.sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate) : null;
      const dateB = b.rawDate ? new Date(b.rawDate) : null;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // push invalid/missing dates to the end
      if (!dateB) return -1;

      return dateB - dateA; // newest first
    });

    // 4️⃣ Set state
    setAppointments(mergedAppointments);
  } catch (err) {
    console.error("❌ Error fetching doctor appointments:", err);
    setAppointments([]);
  }
};

  useEffect(() => { loadDoctorId(); }, []);

  const handleStatusChange = async (id, status, source, appointmentDate, key) => {
  try {
    const formattedDate = appointmentDate.includes('/')
      ? formatDateToYYYYMMDD(parseDDMMYYYY(appointmentDate))
      : appointmentDate;

    const body =
      source === "bookAppointment"
        ? { tokenid: id, status, date: formattedDate, doctorId }
        : { daily_id: id, status, date: formattedDate, doctorId };

    console.log("Sending body:", body);

    const response = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/book-appointment/update-status",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();
    console.log("Server response:", result);

    if (response.ok) {
      setAppointments(prev =>
        prev.map(item =>
          item._key === key ? { ...item, status } : item
        )
      );
    } else {
      console.log("Update failed:", result.error);
    }

  } catch (error) {
    console.error("❌ Error updating status:", error);
  }
};

  // ------------------------------
  // UI Components (Dashboard UI)
  // ------------------------------
 
  const renderAppointment = ({ item }) => (
    <View style={[styles.card, isDesktop && { width: '48.5%' }]}>
      <View style={styles.cardHeader}>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenText}>ID: {item.id}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: item.status === "Completed" ? "#C6F6D5" : "#FEEBC8" }]}>
          <Text style={[styles.statusPillText, { color: item.status === "Completed" ? "#2F855A" : "#C05621" }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.patientMainInfo}>
        <View style={styles.avatarCircle}><Ionicons name="person" size={24} color="#007BFF" /></View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.patientNameText}>{item.name}</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.timeText}>{item.time}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Age/Gender</Text><Text style={styles.infoVal}>{item.age} / {item.gender}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Blood Group</Text><Text style={styles.infoVal}>{item.bloodgroup}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Payment Status</Text><Text style={[styles.infoVal, { color: item.payment === "pending" ? "#E53E3E" : "#38A169" }]}>{item.payment}</Text></View>
        <View style={styles.infoItem}><Text style={styles.infoLabel}>Total Fee</Text><Text style={styles.infoVal}>{item.fee}</Text></View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => handleStatusChange(item.id, "Cancelled", item.source, item.rawDate, item._key)}>
          <Ionicons name="close-circle-outline" size={18} color="#E53E3E" />
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleStatusChange(item.id, "Completed", item.source, item.rawDate, item._key)}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.completeBtnText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.mainScreenWrapper}>
   

      {/* 🟧 Content Area */}
      <View style={styles.contentArea}>
    <View style={styles.headerNav}>
  {/* Back arrow + title */}
  <View style={styles.backWrapper}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
      <Ionicons name="arrow-back" size={28} color="#007BFF" />
    </TouchableOpacity>
    <View>
      <Text style={styles.pageTitle}>Appointments Overview</Text>
      <Text style={styles.pageSub}>Manage and track your patient visits effortlessly</Text>
    </View>
  </View>

  {/* Right icons (search + notifications) */}
  <View style={styles.navRight}>
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={18} color="#A0AEC0" />
      <TextInput placeholder="Search by patient ID or name..." style={styles.searchInput} />
    </View>
    <TouchableOpacity style={styles.iconBtn}>
      <Ionicons name="notifications-outline" size={20} color="#4A5568" />
    </TouchableOpacity>
  </View>
</View>


        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={{ marginTop: 10, color: "#718096" }}>Processing Records... {loadingCount}s</Text>
          </View>
        ) : appointments.length > 0 ? (
          <FlatList
            data={appointments}
            keyExtractor={(item) => item._key}
            renderItem={renderAppointment}
            numColumns={isDesktop ? 2 : 1}
            key={isDesktop ? 'desktop-grid' : 'mobile-list'}
            contentContainerStyle={{ paddingBottom: 40 }}
            columnWrapperStyle={isDesktop ? { justifyContent: 'space-between' } : null}
          />
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={64} color="#E2E8F0" />
            <Text style={styles.emptyText}>No appointments scheduled for today</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreenWrapper: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  
  // Sidebar
  sidebar: { width: 260, backgroundColor: "#fff", borderRightWidth: 1, borderColor: "#E2E8F0", padding: 25 },
  brandContainer: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  logoBox: { width: 32, height: 32, backgroundColor: "#007BFF", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
  logoText: { color: "#fff", fontWeight: "bold" },
  brandName: { fontWeight: "bold", fontSize: 18, color: "#2D3748" },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 8 },
  sidebarItemActive: { backgroundColor: "#007BFF" },
  sidebarLabel: { marginLeft: 12, color: "#718096", fontWeight: "500" },
  sidebarLabelActive: { color: "#fff" },
  logoutBtn: { flexDirection: "row", alignItems: "center", marginTop: 'auto', padding: 12 },
  logoutText: { marginLeft: 12, color: "#E53E3E", fontWeight: "600" },
backWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
backBtn: { padding: 4 },

  // Content Area
  contentArea: { flex: 1, padding: Platform.OS === 'web' ? 35 : 15 },
  headerNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: 'wrap', gap: 15 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#1A202C" },
  pageSub: { color: "#718096", fontSize: 14, marginTop: 4 },
  navRight: { flexDirection: "row", alignItems: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 15, height: 45, width: 280, marginRight: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14, outlineStyle: 'none' },
  iconBtn: { width: 45, height: 45, borderRadius: 12, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },

  // Cards
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#EDF2F7", ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 3 }, web: { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' } }) },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  tokenBadge: { backgroundColor: "#EBF8FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tokenText: { color: "#007BFF", fontWeight: "bold", fontSize: 12 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: "bold" },
  
  patientMainInfo: { flexDirection: "row", alignItems: "center" },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  patientNameText: { fontSize: 17, fontWeight: "bold", color: "#1E293B" },
  reasonText: { color: "#64748B", fontSize: 13, marginTop: 2 },
  timeText: { fontSize: 14, fontWeight: "bold", color: "#0F172A" },
  dateText: { fontSize: 12, color: "#94A3B8" },

  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 15 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  infoItem: { width: "50%", marginBottom: 12 },
  infoLabel: { fontSize: 11, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 },
  infoVal: { fontSize: 14, fontWeight: "600", color: "#334155", marginTop: 2 },

  buttonRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  completeBtn: { backgroundColor: "#007BFF" },
  completeBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  cancelBtn: { backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FED7D7" },
  cancelBtnText: { color: "#E53E3E", fontWeight: "bold", marginLeft: 8 },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  emptyText: { color: "#94A3B8", marginTop: 15, fontSize: 16 },
});