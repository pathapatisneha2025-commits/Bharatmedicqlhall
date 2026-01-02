import React, { useState, useEffect, useMemo } from "react"; 
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";

export default function CRMScreen({ navigation }) {
  const [dashboardData, setDashboardData] = useState({
    patients: 0,
    appointmentsToday: 0,
    totalAppointments: 0,
    doctors: 0,
    waitTime: 18,
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

  // Fetch Appointments
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
            id: item.id,
            patientName: item.name,
            doctorName: item.doctorname,
            time: item.timeslot,
            date: item.date,
            status: item.status,
          })),
          ...doctorBookData.map((item) => ({
            id: item.id,
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
        console.error("Error fetching appointments:", error);
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, []);

  // Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("https://hospitaldatabasemanagement.onrender.com/doctor/all");
        const data = await res.json();
        setDoctorList(data);
        setFilteredDoctors(data);
        setDashboardData((prev) => ({ ...prev, doctors: data.length }));
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("https://hospitaldatabasemanagement.onrender.com/order-medicine/all");
        const data = await res.json();
        setMedicineOrders(data);
      } catch (error) {
        console.error("Error fetching medicine orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter Appointments
  const filteredAppointments = useMemo(() => {
    const month = appointmentMonth.month !== null ? Number(appointmentMonth.month) : null;
    const year = appointmentMonth.year !== null ? Number(appointmentMonth.year) : null;

    return appointments.filter((a) => {
      const d = parseDate(a.date);
      if (!d) return false;

      if (month !== null && d.getMonth() + 1 !== month) return false; // +1 because JS months are 0-indexed
      if (year !== null && d.getFullYear() !== year) return false;

      return true;
    });
  }, [appointments, appointmentMonth]);

  // Filter Medicine Orders by Month/Year
  const filteredMedicineOrders = useMemo(() => {
    const month = orderMonth.month !== null ? Number(orderMonth.month) : null;
    const year = orderMonth.year !== null ? Number(orderMonth.year) : null;

    return medicineOrders.filter((o) => {
      const d = parseDate(o.created_at || o.expected_delivery);
      if (!d) return false;

      if (month !== null && d.getMonth() + 1 !== month) return false; // JS months are 0-based
      if (year !== null && d.getFullYear() !== year) return false;

      return true;
    });
  }, [medicineOrders, orderMonth]);
const getLastMonth = () => {
  const today = new Date();
  const month = today.getMonth(); // 0-indexed (0 = Jan)
  const year = today.getFullYear();

  if (month === 0) {
    // If current month is January, last month is December of previous year
    return { month: 12, year: year - 1 };
  } else {
    return { month, year }; // month is 1-indexed for Picker/filter
  }
};

  // Search doctors
  const handleSearch = (text) => {
    if (!text) return setFilteredDoctors(doctorList);
    const filtered = doctorList.filter(
      (doc) =>
        doc.name?.toLowerCase().includes(text.toLowerCase()) ||
        doc.department?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredDoctors(filtered);
  };
  useEffect(() => {
  if (appointments.length === 0) return;

  const { month, year } = getLastMonth();
  const lastMonthAppointments = appointments.filter((a) => {
    const d = parseDate(a.date);
    if (!d) return false;
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  setDashboardData((prev) => ({
    ...prev,
    totalAppointments: lastMonthAppointments.length,
  }));
}, [appointments]);


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Hospital Management Dashboard</Text>
      <Text style={styles.subtitle}>Admin overview of hospital operations</Text>

      <View style={styles.statsContainer}>
        <Card icon="account-group" title="Total Patients" value={dashboardData.patients} color="#007bff" />
        <Card icon="calendar-today" title="Today's Appointments" value={dashboardData.appointmentsToday} color="#17a2b8" />
        <Card icon="calendar-month" title="Last Month Appointments" value={dashboardData.totalAppointments} color="#6f42c1" />
        <Card icon="stethoscope" title="Available Doctors" value={dashboardData.doctors} color="#28a745" />
      </View>

      {/* Appointments Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointments ({filteredAppointments.length})</Text>

        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <Picker
            selectedValue={appointmentMonth.month}
            style={{ flex: 1 }}
            onValueChange={(m) =>
              setAppointmentMonth((prev) => ({
                ...prev,
                month: m !== null ? Number(m) : null,
              }))
            }
          >
            <Picker.Item label="Month" value={null} />
            {[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ].map((month, index) => (
              <Picker.Item key={index} label={month} value={index + 1} />
            ))}
          </Picker>

          <Picker
            selectedValue={appointmentMonth.year}
            style={{ flex: 1 }}
            onValueChange={(y) =>
              setAppointmentMonth((prev) => ({
                ...prev,
                year: y !== null ? Number(y) : null,
              }))
            }
          >
            <Picker.Item label="Year" value={null} />
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <Picker.Item key={year} label={`${year}`} value={year} />;
            })}
          </Picker>
        </View>

        {loadingAppointments ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : filteredAppointments.length === 0 ? (
          <Text style={styles.emptyText}>No appointments found.</Text>
        ) : (
          filteredAppointments.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <View>
                <Text style={styles.listTitle}>{item.patientName}</Text>
                <Text style={styles.listSubtitle}>{item.doctorName}</Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.listTime}>{item.time}</Text>
                <Text
                  style={[
                    styles.status,
                    item.status?.toLowerCase() === "completed"
                      ? styles.confirmed
                      : item.status?.toLowerCase() === "progress"
                      ? styles.progress
                      : styles.waiting,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Doctors Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Doctors Available</Text>
        <TextInput placeholder="Search doctors or departments..." style={styles.searchBox} onChangeText={handleSearch} />
        {loadingDoctors ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : filteredDoctors.length === 0 ? (
          <Text style={styles.emptyText}>No doctors found.</Text>
        ) : (
          filteredDoctors.map((doc) => (
            <View key={doc.id} style={styles.doctorCard}>
              <View style={styles.doctorLeft}>
                <Icon name="doctor" size={36} color="#007bff" style={styles.doctorIcon} />
                <View>
                  <Text style={styles.doctorName}>{doc.name}</Text>
                  <Text style={styles.doctorDept}>{doc.department}</Text>
                  <Text style={styles.doctorExp}>Experience: {doc.experience || 5} yrs</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Medicine Orders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medicine Orders ({filteredMedicineOrders.length})</Text>

        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <Picker
            selectedValue={orderMonth.month}
            style={{ flex: 1 }}
            onValueChange={(m) =>
              setOrderMonth((prev) => ({
                ...prev,
                month: m !== null ? Number(m) : null,
              }))
            }
          >
            <Picker.Item label="Month" value={null} />
            {[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ].map((month, index) => (
              <Picker.Item key={index} label={month} value={index + 1} />
            ))}
          </Picker>

          <Picker
            selectedValue={orderMonth.year}
            style={{ flex: 1 }}
            onValueChange={(y) =>
              setOrderMonth((prev) => ({
                ...prev,
                year: y !== null ? Number(y) : null,
              }))
            }
          >
            <Picker.Item label="Year" value={null} />
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <Picker.Item key={year} label={`${year}`} value={year} />;
            })}
          </Picker>
        </View>

        {loadingOrders ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : filteredMedicineOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders found.</Text>
        ) : (
          filteredMedicineOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{order.address?.name || "Unknown Patient"}</Text>
                <Text style={styles.listSubtitle}>Payment: {order.payment_method?.replaceAll("_", " ")}</Text>
                <Text style={styles.listSubtitle}>Total: ₹{order.total}</Text>
                <Text style={styles.listSubtitle}>Expected: {order.expected_delivery?.split("T")[0]}</Text>
              </View>
              <Text
                style={[
                  styles.status,
                  order.status?.toLowerCase() === "delivered"
                    ? styles.confirmed
                    : order.status?.toLowerCase() === "processing"
                    ? styles.progress
                    : styles.waiting,
                ]}
              >
                {order.status}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Card Component
const Card = ({ icon, title, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Icon name={icon} size={28} color={color} />
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 15, marginTop: 30 },
  title: { fontSize: 22, fontWeight: "bold", color: "#212529" },
  subtitle: { fontSize: 14, color: "#6c757d", marginBottom: 15 },
  statsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    width: "48%",
    marginBottom: 15,
    borderLeftWidth: 5,
    elevation: 2,
  },
  cardContent: { marginTop: 8 },
  cardTitle: { fontSize: 14, color: "#6c757d" },
  cardValue: { fontSize: 20, fontWeight: "bold", color: "#212529" },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  listCard: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  listTitle: { fontWeight: "bold", fontSize: 14 },
  listSubtitle: { color: "#6c757d", fontSize: 13 },
  listRight: { alignItems: "flex-end" },
  listTime: { color: "#495057", fontSize: 13 },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    textAlign: "center",
    marginTop: 4,
  },
  confirmed: { backgroundColor: "#d4edda", color: "#155724" },
  progress: { backgroundColor: "#cce5ff", color: "#004085" },
  waiting: { backgroundColor: "#fff3cd", color: "#856404" },
  searchBox: { backgroundColor: "#f1f3f5", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 14 },
  doctorCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10, elevation: 3 },
  doctorLeft: { flexDirection: "row", alignItems: "center" },
  doctorIcon: { marginRight: 10, backgroundColor: "#e9f5ff", padding: 8, borderRadius: 50 },
  doctorName: { fontWeight: "bold", fontSize: 15, color: "#212529" },
  doctorDept: { color: "#6c757d", fontSize: 13 },
  doctorExp: { fontSize: 12, color: "#495057" },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  emptyText: { textAlign: "center", color: "#6c757d" },
});
