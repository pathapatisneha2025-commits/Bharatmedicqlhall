import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";

// Use @expo/vector-icons for better web support if using Expo
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

// Determine if running on desktop/web dynamically
const isWeb = Platform.OS === "web";
const getIsDesktop = () => {
  if (isWeb) return window.innerWidth > 768;
  return Dimensions.get("window").width > 768;
};

export default function CRMScreen({ navigation }) {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop());

  useEffect(() => {
    if (!isWeb) return;
    const handleResize = () => setIsDesktop(getIsDesktop());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [dashboardData, setDashboardData] = useState({
    patients: 0,
    appointmentsToday: 0,
    totalAppointments: 0,
    doctors: 0,
  });

  const [doctorList, setDoctorList] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentMonth, setAppointmentMonth] = useState({ month: null, year: null });

  const [medicineOrders, setMedicineOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderMonth, setOrderMonth] = useState({ month: null, year: null });

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Fetch data functions
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const [bookRes, doctorBookRes] = await Promise.all([
          fetch("https://hospitaldatabasemanagement.onrender.com/book-appointment/all"),
          fetch("https://hospitaldatabasemanagement.onrender.com/doctorbooking/all"),
        ]);
        const bookData = await bookRes.json();
        const doctorBookData = await doctorBookRes.json();
        const combinedData = [
          ...bookData.map((item) => ({
            id: `book-${item.id}`,
            patientName: item.name,
            doctorName: item.doctorname,
            time: item.timeslot,
            date: item.date,
            status: item.status,
          })),
          ...doctorBookData.map((item) => ({
            id: `doctor-${item.id}`,
            patientName: item.patient_name,
            doctorName: item.doctor_name,
            time: item.appointment_time,
            date: item.appointment_date,
            status: item.status,
          })),
        ];
        setAppointments(combinedData);
        setDashboardData((prev) => ({ ...prev, patients: combinedData.length }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("https://hospitaldatabasemanagement.onrender.com/doctor/all");
        const data = await res.json();
        setDoctorList(data);
        setFilteredDoctors(data);
        setDashboardData((prev) => ({ ...prev, doctors: data.length }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("https://hospitaldatabasemanagement.onrender.com/order-medicine/all");
        const data = await res.json();
        setMedicineOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  // Filtered lists
  const filteredAppointments = useMemo(() => {
    const month = appointmentMonth.month ? Number(appointmentMonth.month) : null;
    const year = appointmentMonth.year ? Number(appointmentMonth.year) : null;
    return appointments.filter((a) => {
      const d = parseDate(a.date);
      if (!d) return false;
      if (month && d.getMonth() + 1 !== month) return false;
      if (year && d.getFullYear() !== year) return false;
      return true;
    });
  }, [appointments, appointmentMonth]);

  const filteredMedicineOrders = useMemo(() => {
    const month = orderMonth.month ? Number(orderMonth.month) : null;
    const year = orderMonth.year ? Number(orderMonth.year) : null;
    return medicineOrders.filter((o) => {
      const d = parseDate(o.created_at || o.expected_delivery);
      if (!d) return false;
      if (month && d.getMonth() + 1 !== month) return false;
      if (year && d.getFullYear() !== year) return false;
      return true;
    });
  }, [medicineOrders, orderMonth]);

  // Last month calculation
  const getLastMonth = () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    return month === 0 ? { month: 12, year: year - 1 } : { month, year };
  };

  useEffect(() => {
    if (!appointments.length) return;
    const { month, year } = getLastMonth();
    const lastMonthAppointments = appointments.filter((a) => {
      const d = parseDate(a.date);
      if (!d) return false;
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    setDashboardData((prev) => ({ ...prev, totalAppointments: lastMonthAppointments.length }));
  }, [appointments]);

  const handleSearch = (text) => {
    if (!text) return setFilteredDoctors(doctorList);
    const filtered = doctorList.filter(
      (doc) =>
        doc.name?.toLowerCase().includes(text.toLowerCase()) ||
        doc.department?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredDoctors(filtered);
  };

  // Helper: render Picker as web <select> if on web
  const WebPicker = ({ options, value, onChange }) => {
    if (!isWeb) return <Picker selectedValue={value} onValueChange={onChange}>{options}</Picker>;
    return (
      <select
        style={{ width: "100%", padding: 8, borderRadius: 8 }}
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value) || null)}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value ?? ""}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
       <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1e293b" />
            </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Hospital Management Dashboard</Text>
          <Text style={styles.subtitle}>Admin overview of hospital operations</Text>
        </View>
        {isDesktop && (
          <View style={styles.desktopUser}>
            <Icon name="account-circle" size={30} color="#6b7280" />
            <Text style={styles.userName}>Administrator</Text>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card icon="account-group" title="Total Patients" value={dashboardData.patients} color="#007bff" />
        <Card icon="calendar-today" title="Today's Appointments" value={dashboardData.appointmentsToday} color="#17a2b8" />
        <Card icon="calendar-month" title="Last Month Appointments" value={dashboardData.totalAppointments} color="#6f42c1" />
        <Card icon="stethoscope" title="Available Doctors" value={dashboardData.doctors} color="#28a745" />
      </View>

      {/* Sections */}
      <View style={isDesktop ? styles.desktopGrid : styles.mobileStack}>
        {/* Appointments Section */}
        <View style={isDesktop ? styles.desktopSection : styles.section}>
          <Text style={styles.sectionTitle}>Appointments ({filteredAppointments.length})</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerWrapper}>
              <WebPicker
                value={appointmentMonth.month}
                onChange={(m) => setAppointmentMonth((prev) => ({ ...prev, month: m }))}
                options={[{ label: "Month", value: null }].concat(
                  ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>({label:m,value:i+1}))
                )}
              />
            </View>
            <View style={styles.pickerWrapper}>
              <WebPicker
                value={appointmentMonth.year}
                onChange={(y) => setAppointmentMonth((prev) => ({ ...prev, year: y }))}
                options={[{ label: "Year", value: null }].concat(
                  Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return { label: `${year}`, value: year };
                  })
                )}
              />
            </View>
          </View>

          {loadingAppointments ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : filteredAppointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointments found.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 400, flexGrow: 1 }}>
              {filteredAppointments.map((item) => (
                <View key={item.id} style={styles.listCard}>
                  <View>
                    <Text style={styles.listTitle}>{item.patientName}</Text>
                    <Text style={styles.listSubtitle}>{item.doctorName}</Text>
                  </View>
                  <View style={styles.listRight}>
                    <Text style={styles.listTime}>{item.time}</Text>
                    <Text style={[
                      styles.status,
                      item.status?.toLowerCase() === "completed"
                        ? styles.confirmed
                        : item.status?.toLowerCase() === "progress"
                        ? styles.progress
                        : styles.waiting
                    ]}>{item.status}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Doctors Section */}
        <View style={isDesktop ? styles.desktopSection : styles.section}>
          <Text style={styles.sectionTitle}>Doctors Available</Text>
          <TextInput
            placeholder="Search doctors or departments..."
            style={styles.searchBox}
            onChangeText={handleSearch}
          />
          {loadingDoctors ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : filteredDoctors.length === 0 ? (
            <Text style={styles.emptyText}>No doctors found.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 400, flexGrow: 1 }}>
              {filteredDoctors.map((doc) => (
                <View key={doc.id} style={styles.doctorCard}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon name="doctor" size={36} color="#007bff" style={styles.doctorIcon} />
                    <View>
                      <Text style={styles.doctorName}>{doc.name}</Text>
                      <Text style={styles.doctorDept}>{doc.department}</Text>
                      <Text style={styles.doctorExp}>Exp: {doc.experience || 5} yrs</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Medicine Orders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medicine Orders ({filteredMedicineOrders.length})</Text>
        <View style={styles.pickerRow}>
          <View style={styles.pickerWrapper}>
            <WebPicker
              value={orderMonth.month}
              onChange={(m) => setOrderMonth((prev) => ({ ...prev, month: m }))}
              options={[{ label: "Month", value: null }].concat(
                ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>({label:m,value:i+1}))
              )}
            />
          </View>
          <View style={styles.pickerWrapper}>
            <WebPicker
              value={orderMonth.year}
              onChange={(y) => setOrderMonth((prev) => ({ ...prev, year: y }))}
              options={[{ label: "Year", value: null }].concat(
                Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return { label: `${year}`, value: year };
                })
              )}
            />
          </View>
        </View>

        {loadingOrders ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : filteredMedicineOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders found.</Text>
        ) : (
          <View style={isDesktop ? styles.desktopOrderGrid : null}>
            {filteredMedicineOrders.map((order) => (
              <View key={order.id} style={isDesktop ? styles.desktopOrderCard : styles.orderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{order.address?.name || "Unknown Patient"}</Text>
                  <Text style={styles.listSubtitle}>Payment: {order.payment_method?.replaceAll("_", " ")}</Text>
                  <Text style={styles.listSubtitle}>Total: ₹{order.total} | Expected: {order.expected_delivery?.split("T")[0]}</Text>
                </View>
                <Text style={[
                  styles.status,
                  order.status?.toLowerCase() === "delivered"
                    ? styles.confirmed
                    : order.status?.toLowerCase() === "processing"
                    ? styles.progress
                    : styles.waiting
                ]}>{order.status}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Card Component
const Card = ({ icon, title, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color, width: isWeb ? "23.5%" : "48%" }]}>
    <Icon name={icon} size={28} color={color} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

// Styles remain mostly unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  contentContainer: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 50 },
  backBtn: { padding: 8, marginRight: 12, borderRadius: 8, backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280" },
  desktopUser: { flexDirection: "row", alignItems: "center", gap: 10 },
  userName: { fontWeight: "600", color: "#374151" },
  statsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 20, marginBottom: 14, borderLeftWidth: 5 },
  cardContent: { marginTop: 10 },
  cardTitle: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  cardValue: { fontSize: 26, fontWeight: "800", color: "#111827", marginTop: 4 },
  desktopGrid: { flexDirection: "row", justifyContent: "space-between", gap: 20 },
  mobileStack: { flexDirection: "column" },
  desktopSection: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  section: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 15 },
  pickerRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  pickerWrapper: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, backgroundColor: "#f9fafb" },
  listCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  listTitle: { fontWeight: "700", fontSize: 15, color: "#111827" },
  listSubtitle: { color: "#6b7280", fontSize: 13 },
  listRight: { alignItems: "flex-end" },
  listTime: { color: "#374151", fontSize: 13, fontWeight: "500" },
  status: { fontSize: 11, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, textTransform: "uppercase" },
  confirmed: { backgroundColor: "#dcfce7", color: "#166534" },
  progress: { backgroundColor: "#dbeafe", color: "#1e40af" },
  waiting: { backgroundColor: "#fef3c7", color: "#92400e" },
  searchBox: { backgroundColor: "#f9fafb", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  doctorCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 10 },
  doctorIcon: { marginRight: 12, backgroundColor: "#fff", padding: 8, borderRadius: 50 },
  doctorName: { fontWeight: "700", fontSize: 15 },
  doctorDept: { color: "#3b82f6", fontSize: 12, fontWeight: "600" },
  doctorExp: { fontSize: 12, color: "#6b7280" },
  desktopOrderGrid: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  desktopOrderCard: { width: "48.5%", backgroundColor: "#f9fafb", borderRadius: 12, padding: 15, flexDirection: "row", alignItems: "center" },
  orderCard: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 20 },
});
