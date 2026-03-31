import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";


const MEDICINE_API = "https://hospitaldatabasemanagement.onrender.com/medicine/all";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
const [patient, setPatient] = useState(null);
const [loadingPatient, setLoadingPatient] = useState(true);
const getPatientId = async () => await AsyncStorage.getItem("patientId");
const [orders, setOrders] = useState([]);
const [upcomingOrders, setUpcomingOrders] = useState([]);
const [appointments, setAppointments] = useState([]);
const [upcomingVisits, setUpcomingVisits] = useState(0);
const [upcomingAppointments, setUpcomingAppointments] = useState([]);
const [searchQuery, setSearchQuery] = useState("");
const [filteredMedicines, setFilteredMedicines] = useState([]);
const [filteredDoctors, setFilteredDoctors] = useState([]);


useEffect(() => {
  if (!searchQuery) {
    // No query → show all
    setFilteredMedicines(medicines);
    setFilteredDoctors(doctors);
    return;
  }

  const lowerQuery = searchQuery.toLowerCase();

  setFilteredMedicines(
    medicines.filter((m) => m.name.toLowerCase().includes(lowerQuery))
  );

  setFilteredDoctors(
    doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.department.toLowerCase().includes(lowerQuery)
    )
  );
}, [searchQuery, medicines, doctors]);


const fetchAppointments = async () => {
  try {
    const patientId = await AsyncStorage.getItem("patientId");
    if (!patientId) return;

    const response = await fetch(
      `https://hospitaldatabasemanagement.onrender.com/book-appointment/patient/${patientId}`
    );

    const data = await response.json();
    if (!data.appointments) return;

    const today = new Date();

   const upcoming = data.appointments.filter(appt => {
  const today = new Date();
  today.setHours(0,0,0,0); // remove time

  const apptDate = new Date(appt.date);
  apptDate.setHours(0,0,0,0);

  return (
    apptDate >= today &&
    appt.status?.toLowerCase() !== "cancelled" &&
    appt.status?.toLowerCase() !== "completed"
  );
});

    setUpcomingVisits(upcoming.length);
    setUpcomingAppointments(upcoming.slice(0, 3)); // show top 3 in dashboard

  } catch (error) {
    console.error("Fetch Appointments Error:", error);
  }
};
// Call this inside useEffect
useEffect(() => {
  fetchAppointments();

  const interval = setInterval(() => {
    fetchAppointments();
  }, 60000); // every 1 minute

  return () => clearInterval(interval);
}, []);
const fetchOrders = async () => {
  try {
    const patientId = await getPatientId();
    if (!patientId) return;

    const response = await fetch(`https://hospitaldatabasemanagement.onrender.com/order-medicine/patient/${patientId}`);
    const data = await response.json();
    const ordersData = Array.isArray(data) ? data : [];

    setOrders(ordersData);

    // Filter upcoming orders
    const upcoming = ordersData.filter(order =>
      ["pending", "processing", "in transit"].includes(order.status?.toLowerCase())
    );
    setUpcomingOrders(upcoming);

  } catch (error) {
    console.error("Fetch Orders Error:", error);
  }
};

const fetchPatientProfile = async () => {
  try {
    setLoadingPatient(true);
    const patientId = await getPatientId();
    if (!patientId) {
      console.warn("No patient ID found.");
      return;
    }
    const response = await fetch(`https://hospitaldatabasemanagement.onrender.com/patient/${patientId}`);
    const data = await response.json();
    if (response.ok && data.patient) {
      setPatient(data.patient);
    }
  } catch (error) {
    console.error("Fetch Patient Error:", error);
  } finally {
    setLoadingPatient(false);
  }
};

  const fetchData = async () => {
    try {
      const [medRes, docRes, feeRes] = await Promise.all([
        fetch(MEDICINE_API),
        fetch("https://hospitaldatabasemanagement.onrender.com/doctor/all"),
        fetch("https://hospitaldatabasemanagement.onrender.com/doctorconsultancefee/all"),
      ]);
      const meds = await medRes.json();
      const docs = await docRes.json();
      const fees = await feeRes.json();

      setMedicines(meds);
      setDoctors(
        docs.map((doc) => {
          const feeRecord = fees.find((f) => f.doctor_email === doc.email);
          return { ...doc, consultance_fee: feeRecord ? feeRecord.fees : 0 };
        })
      );
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoadingMedicines(false);
      setLoadingDoctors(false);
    }
  };
useFocusEffect(
  useCallback(() => {
    const parent = navigation.getParent('BottomTabs'); // <-- use your TabNavigator name
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }

    return () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: { display: 'flex' } });
      }
    };
  }, [navigation])
);



useEffect(() => {
  fetchData();          // Existing medicines & doctors fetch
  fetchPatientProfile(); // Fetch patient profile
  fetchOrders();        // Fetch orders for upcoming orders
}, []);



  const SidebarItem = ({ icon, label, screen, active = false }) => (
    <TouchableOpacity
      style={[styles.sidebarItem, active && styles.sidebarItemActive]}
      onPress={() => navigation.navigate(screen)}
    >
      <Icon name={icon} size={22} color={active ? "#fff" : "#BFDBFE"} />
      <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      {/* LEFT SIDEBAR - STATIC ON DESKTOP */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Image
            source={require("../assets/Logo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandMain}>Bharat Medical</Text>
            <Text style={styles.brandSub}>Patient Portal</Text>
          </View>
        </View>

   <View style={styles.sidebarMenu}>
  <TouchableOpacity
    style={styles.sidebarItem}
    onPress={() => navigation.replace("patienthomescreen")}
  >
    <Icon name="grid-outline" size={22} color="#BFDBFE" />
    <Text style={styles.sidebarLabel}>Dashboard</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarItem}
    onPress={() => navigation.navigate("DoctorScreen")}
  >
    <Icon name="people-outline" size={22} color="#BFDBFE" />
    <Text style={styles.sidebarLabel}>Find Doctor</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarItem}
    onPress={() => navigation.navigate("PatientAppointmentsScreen")}
  >
    <Icon name="calendar-outline" size={22} color="#BFDBFE" />
    <Text style={styles.sidebarLabel}>Appointments</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarItem}
    onPress={() => navigation.navigate("MedicineScreen")}
  >
    <Icon name="cart-outline" size={22} color="#BFDBFE" />
    <Text style={styles.sidebarLabel}>Medicine Store</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarItem}
    onPress={() => navigation.navigate("patientorders")}
  >
    <Icon name="bag-handle-outline" size={22} color="#BFDBFE" />
    <Text style={styles.sidebarLabel}>My Orders</Text>
  </TouchableOpacity>


  <TouchableOpacity
    style={styles.sidebarItem}
    onPress={() => navigation.navigate("PatientProfile")}
  >
    <Icon name="person-outline" size={22} color="#BFDBFE" />
    <Text style={styles.sidebarLabel}>Profile Settings</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.sidebarItem}
    onPress={() => navigation.navigate("SelectRole")}
  >
    <Icon name="log-out-outline" size={22} color="#BFDBFE" />
    <Text style={styles.sidebarLabel}>Logout</Text>
  </TouchableOpacity>
</View>

      </View>

      {/* MAIN VIEWPORT */}
      <View style={styles.contentArea}>
        {/* TOP SEARCH & NAVIGATION */}
        <View style={styles.navbar}>
          <View style={styles.searchWrapper}>
            <Icon name="search-outline" size={20} color="#94A3B8" />
           <TextInput
  placeholder="Search doctors, clinical records, or medicines..."
  style={styles.navSearch}
  placeholderTextColor="#94A3B8"
  value={searchQuery}
  onChangeText={setSearchQuery}
/>
          </View>
          <View style={styles.navActions}>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => navigation.navigate("shoppingcart")}>
              <Icon name="cart-outline" size={24} color="#1E293B" />
              {/* <View style={styles.badge}><Text style={styles.badgeText}></Text></View> */}
            </TouchableOpacity>
            <View style={styles.userProfileMini}>
  <View style={styles.miniAvatar}>
    <Text style={styles.miniAvatarText}>
      {patient
        ? `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase()
        : "P"}
    </Text>
  </View>
  <Text style={styles.userName}>
    {loadingPatient
      ? "Loading..."
      : patient
        ? `${patient.first_name} ${patient.last_name}`
        : "Patient User"}
  </Text>
</View>


          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          {/* TOP STATS CARDS */}
       {/* TOP STATS CARDS */}
<View style={styles.statsRow}>
  <View style={[styles.statCard, { borderLeftColor: "#3B82F6" }]}>
    <Icon name="medical-outline" size={24} color="#3B82F6" style={{marginBottom: 10}} />
    <Text style={styles.statLabel}>Available Medicines</Text>
    <Text style={styles.statValue}>{medicines.length}</Text>
  </View>
  <View style={[styles.statCard, { borderLeftColor: "#10B981" }]}>
    <Icon name="person-add-outline" size={24} color="#10B981" style={{marginBottom: 10}} />
    <Text style={styles.statLabel}>On-call Specialists</Text>
    <Text style={styles.statValue}>{doctors.length}</Text>
  </View>
  <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
    <Icon name="receipt-outline" size={24} color="#F59E0B" style={{marginBottom: 10}} />
    <Text style={styles.statLabel}>Active Orders</Text>
    <Text style={styles.statValue}>{upcomingOrders.length}</Text>
  </View>
  
  {/* Upcoming Visits Card - turns red if there are upcoming visits */}
  <View style={[
      styles.statCard, 
      { borderLeftColor: upcomingVisits > 0 ? "#EF4444" : "#8B5CF6" } // red if visits exist, else purple
    ]}>
    <Icon name="time-outline" size={24} color={upcomingVisits > 0 ? "#EF4444" : "#8B5CF6"} style={{ marginBottom: 10 }} />
    <Text style={styles.statLabel}>Upcoming Visits</Text>
    <Text style={styles.statValue}>{upcomingVisits}</Text>

    {upcomingAppointments.length > 0 && (
      <Text style={{ color: "#64748B", marginTop: 8 }}>
        Next: {new Date(upcomingAppointments[0].date).toLocaleDateString()}
      </Text>
    )}

    <TouchableOpacity
      style={{ marginTop: 12 }}
      onPress={() => navigation.navigate("PatientAppointmentsScreen")}
    >
      <Text style={{ color: "#3B82F6", fontWeight: "700" }}>
        View Details →
      </Text>
    </TouchableOpacity>
  </View>
</View>

          {/* QUICK ACTIONS GRID */}
          <Text style={styles.sectionTitle}>Dashboard Shortcuts</Text>
          <View style={styles.quickActions}>
            {[
              { title: "Book Appointment", icon: "calendar", screen: "DoctorScreen", bg: "#E0F2FE", col: "#0284C7" },
              { title: "Buy Medicines", icon: "medkit", screen: "MedicineScreen", bg: "#DCFCE7", col: "#16A34A" },
              { title: "Order History", icon: "receipt", screen: "patientorders", bg: "#FEF3C7", col: "#D97706" },
              // { title: "Video Consult", icon: "videocam", screen: "Home", bg: "#F1F5F9", col: "#475569" },
            ].map((action, idx) => (
              <TouchableOpacity key={idx} style={styles.actionBox} onPress={() => navigation.navigate(action.screen)}>
                <View style={[styles.actionIconWrapper, { backgroundColor: action.bg }]}>
                  <Icon name={action.icon} size={28} color={action.col} />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* RECOMMENDED DOCTORS ROW */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Recommended Specialists</Text>
            <TouchableOpacity onPress={() => navigation.navigate("DoctorScreen")}>
              <Text style={styles.viewAllBtn}>Explore all doctors →</Text>
            </TouchableOpacity>
          </View>

          {loadingDoctors ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <FlatList
              horizontal
  data={filteredDoctors} // ✅ use filteredDoctors
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <View style={styles.docCard}>
                  {/* {index < 2 && (
                    <View style={styles.featuredBadge}><Text style={styles.featuredText}>TOP RATED</Text></View>
                  )} */}
                  <View style={styles.docAvatarContainer}>
                    <Text style={styles.docInitials}>
                      {item.name ? item.name.split(" ").map(n => n[0]).join("") : "DR"}
                    </Text>
                    <View style={styles.statusIndicator} />
                  </View>
                  <Text style={styles.docName}>{item.name}</Text>
                  <Text style={styles.deptText}>{item.department}</Text>
                  <View style={styles.ratingRow}>
                    <Icon name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>4.9 (120+ Visits)</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookBtn} 
                    onPress={() => navigation.navigate("DoctorScreen", { doctor: item })}
                  >
                    <Text style={styles.bookBtnText}>Request Appointment</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

{/* PHARMACY PRODUCTS GRID */}
<View style={[styles.sectionTitleRow, { marginTop: 40 }]}>
  <Text style={styles.sectionTitle}>New Pharmacy Arrivals</Text>
  <TouchableOpacity onPress={() => navigation.navigate("MedicineScreen")}>
    <Text style={styles.viewAllBtn}>Explore all medicines →</Text>
  </TouchableOpacity>
</View>
          
          <View style={styles.medicineGrid}>
            {loadingMedicines ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
  (filteredMedicines.slice(0, 10)).map((item, idx) => (
                <View key={idx} style={styles.medItem}>
                  <Image source={{ uri: item.images[0] }} style={styles.medImg} resizeMode="contain" />
                  <View style={styles.medInfo}>
                    <Text style={styles.medName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.medPrice}>₹{item.price}</Text>
                  </View>
                  
                  <TouchableOpacity style={styles.addCartBtn} onPress={() => navigation.navigate("MedicineScreen")}
>
                    <Icon name="cart-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: "row", backgroundColor: "#F8FAFC" },
  
  // SIDEBAR
  sidebar: { width: 280, backgroundColor: "#3B82F6", padding: 25, height: "100%" },
  sidebarHeader: { flexDirection: "row", alignItems: "center", marginBottom: 40, gap: 12 },
  logo: { width: 45, height: 45, borderRadius: 10, backgroundColor: "#fff" },
  brandMain: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  brandSub: { fontSize: 12, color: "#BFDBFE" },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8 },
  sidebarItemActive: { backgroundColor: "#2563EB", ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}) },
  sidebarLabel: { marginLeft: 12, fontSize: 14, fontWeight: "600", color: "#BFDBFE" },
  sidebarLabelActive: { color: "#fff" },
  menuDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 20 },

  // CONTENT AREA
  contentArea: { flex: 1 },
  navbar: { height: 80, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 40, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", paddingHorizontal: 15, borderRadius: 12, width: "40%", outlineStyle: "none" },
  navSearch: { flex: 1, padding: 10, fontSize: 14, color: "#1E293B" , outlineStyle: "none"},
  navActions: { flexDirection: "row", alignItems: "center", gap: 25 },
  navIconBtn: { padding: 8, position: "relative" },
  badge: { position: "absolute", top: 0, right: 0, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  userProfileMini: { flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingLeft: 20 },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { color: '#fff', fontWeight: 'bold' },
  userName: { fontWeight: '600', color: '#1E293B' },

  scrollPadding: { padding: 40, paddingBottom: 100 },

  // STATS
  statsRow: { flexDirection: "row", gap: 20, marginBottom: 40 },
  statCard: { flex: 1, backgroundColor: "#fff", padding: 20, borderRadius: 16, borderLeftWidth: 5, elevation: 2, ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}) },
  statLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  statValue: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginTop: 5 },

  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 20 },
  sectionTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  viewAllBtn: { color: "#3B82F6", fontWeight: "700" },

  // DOCTOR CARDS
  docCard: { width: 260, backgroundColor: "#fff", borderRadius: 20, padding: 25, marginRight: 20, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9", ...Platform.select({ web: { transition: '0.3s', cursor: 'default' }}) },
  featuredBadge: { position: "absolute", top: 15, right: 15, backgroundColor: "#10B981", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  featuredText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  docAvatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginBottom: 15 },
  docInitials: { fontSize: 22, fontWeight: "bold", color: "#3B82F6" },
  statusIndicator: { position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: "#10B981", borderWidth: 2, borderColor: "#fff" },
  docName: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  deptText: { fontSize: 13, color: "#3B82F6", fontWeight: "600", marginTop: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 },
  ratingText: { fontSize: 12, color: "#64748B" },
  bookBtn: { marginTop: 20, backgroundColor: "#3B82F6", paddingVertical: 10, borderRadius: 10, width: "100%", alignItems: "center" },
  bookBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // QUICK ACTIONS
  quickActions: { flexDirection: "row", gap: 20, marginBottom: 40 },
  actionBox: { flex: 1, backgroundColor: "#fff", padding: 20, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  actionIconWrapper: { padding: 15, borderRadius: 15, marginBottom: 12 },
  actionText: { fontSize: 14, fontWeight: "700", color: "#1E293B" },

  // MEDICINE GRID
  medicineGrid: { flexDirection: "row", gap: 15, flexWrap: "wrap" },
  medItem: { width: '18.5%', backgroundColor: "#fff", padding: 15, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9" },
  medImg: { width: 80, height: 80, marginBottom: 10 },
  medInfo: { alignItems: "center" },
  medName: { fontSize: 13, fontWeight: "700", color: "#1E293B" },
  viewAllBtn: {
  color: "#3B82F6",
  fontWeight: "800",
  fontSize: 14,
},

  medPrice: { color: "#10B981", fontWeight: "800", fontSize: 14, marginTop: 4 },
  addCartBtn: { position: "absolute", top: 10, right: 10, backgroundColor: "#3B82F6", borderRadius: 8, padding: 6 },
});

export default HomeScreen;