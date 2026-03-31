import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getPatientId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  background: "#f8fafc",
  white: "#ffffff",
  textDark: "#1e293b",
  textLight: "#64748b",
  border: "#e2e8f0",
  warning: "#f59e0b",
  error: "#ef4444",
};

const PatientAppointmentsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  // Desktop Responsive Logic
  const isDesktop = SCREEN_WIDTH >= 1024;
  const isTablet = SCREEN_WIDTH >= 768 && SCREEN_WIDTH < 1024;
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const containerWidth = isDesktop ? "90%" : "100%";

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const loadPatientId = async () => {
      try {
        const storedId = await getPatientId();
        if (storedId) setPatientId(storedId);
        else {
          showAlert("Session Expired", "Please log in again.");
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };
    loadPatientId();
  }, []);

  const fetchAppointments = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/book-appointment/patient/${patientId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch (error) {
      showAlert("Error", "Unable to load appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (patientId) fetchAppointments();
    }, [patientId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return { bg: "#fef3c7", text: COLORS.warning };
    if (s === "confirmed" || s === "completed") return { bg: "#dcfce7", text: COLORS.secondary };
    return { bg: "#fee2e2", text: COLORS.error };
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    const isPaid = item.paymentstatus?.toLowerCase() === "paid";

    return (
      <View style={[styles.card, { flex: 1 / numColumns }]}>
        <View style={styles.cardHeader}>
          <View style={styles.doctorInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.doctorname.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.doctorName} numberOfLines={1}>{item.doctorname}</Text>
              <Text style={styles.specialityText}>{item.department}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status || "Scheduled"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailValue}>{new Date(item.date).toLocaleDateString("en-IN")}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Text style={styles.detailValue}>{item.timeslot}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.feeLabel}>Fee Paid</Text>
            <Text style={styles.feeValue}>₹{item.consultantfees}</Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: isPaid ? '#ecfdf5' : '#fff1f2', borderColor: isPaid ? COLORS.secondary : COLORS.error }]}>
            <Text style={[styles.paymentText, { color: isPaid ? COLORS.secondary : COLORS.error }]}>
              {isPaid ? "PAID" : "UNPAID"}
            </Text>
          </View>
        </View>

        <View style={styles.tokenFooter}>
          <Text style={styles.tokenLabel}>Token: <Text style={styles.tokenValue}>{item.tokenid || "N/A"}</Text></Text>
          <Text style={styles.appointmentId}>#{item.id}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Desktop Navigation Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Appointment Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage your clinical visits and schedules</Text>
          </View>
        </View>
        
        {/* <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={COLORS.white} />
          <Text style={styles.refreshBtnText}>Sync Data</Text>
        </TouchableOpacity> */}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching your records...</Text>
        </View>
      ) : (
        <FlatList
          key={numColumns} // Force re-render when switching layouts
          numColumns={numColumns}
          data={appointments}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { width: containerWidth, alignSelf: 'center' }]}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-search" size={80} color={COLORS.border} />
              <Text style={styles.emptyTextTitle}>No Appointments Found</Text>
              <Text style={styles.emptyTextSub}>Your scheduled visits will appear here once booked.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default PatientAppointmentsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
        web: { position: 'sticky', top: 0, zIndex: 10 }
    })
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark },
  headerSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  iconBtn: { backgroundColor: COLORS.background, padding: 8, borderRadius: 10 },
  refreshBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    gap: 8 
  },
  refreshBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  
  listContent: { padding: 24, paddingBottom: 100 },
  columnWrapper: { gap: 20 }, // Spacing between columns on desktop

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      web: { transition: 'transform 0.2s ease', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
      default: { elevation: 3 }
    })
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  doctorInfo: { flexDirection: 'row', gap: 12, alignItems: 'center', flex: 1 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.primary, fontWeight: '800', fontSize: 18 },
  doctorName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  specialityText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 15 },
  
  detailsGrid: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 10, marginBottom: 15 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  feeLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', textTransform: 'uppercase' },
  feeValue: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
  paymentBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  paymentText: { fontSize: 10, fontWeight: '800' },
  
  tokenFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  tokenLabel: { fontSize: 12, color: COLORS.textLight },
  tokenValue: { color: COLORS.secondary, fontWeight: '800' },
  appointmentId: { fontSize: 11, color: COLORS.textLight, opacity: 0.6 },
  
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyTextTitle: { marginTop: 20, fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  emptyTextSub: { marginTop: 8, color: COLORS.textLight, fontSize: 15, textAlign: 'center' }
});