import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Linking,
  StatusBar
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function EmployeePayslipScreen() {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 800;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();

  const [employeeId, setEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("current");

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const fetchEmployeeId = async () => {
      const id = await getEmployeeId();
      if (!id) return showAlert("Error", "Employee ID not found.");
      setEmployeeId(id);
    };
    fetchEmployeeId();
  }, []);

  const openPayslip = async (type) => {
    if (!employeeId) return showAlert("Error", "Employee ID missing.");

    const fetchYear = type === "last" ? lastMonthYear : year;
    const fetchMonth = type === "last" ? lastMonth : month;

    const url = `${BASE_URL}/payslips/pdf/${fetchYear}/${fetchMonth}/${employeeId}`;
    setSelectedMonth(type);

    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      try {
        setLoading(true);
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else showAlert("Error", "Unable to open PDF.");
      } catch {
        showAlert("Error", "Failed to open PDF.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0D6EFD" />
        <Text style={{ marginTop: 12, color: '#6c757d', fontWeight: '600' }}>Generating Secure PDF...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.mainWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        
        {/* LEFT BRANDING SIDE */}
        {isDesktop && (
          <View style={styles.brandingSide}>
            <View style={styles.brandOverlay}>
              <View style={styles.heroLogoBox}>
                <MaterialCommunityIcons name="wallet-membership" size={32} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Payroll &{"\n"}Earnings</Text>
              <Text style={styles.heroSubtitle}>Access your financial records.</Text>
              <View style={styles.heroDivider} />
              <Text style={styles.heroDescription}>
                Download and view your monthly payslips securely. Ensure your bank details are up to date for seamless transactions.
              </Text>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => navigation.goBack()}>
                <Text style={styles.actionBtnOutlineText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* RIGHT CONTENT SIDE */}
        <View style={[styles.dashboardSide, { width: isDesktop ? '65%' : '100%' }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerRow}>
               {!isDesktop && (
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                  </TouchableOpacity>
               )}
               <View>
                 <Text style={styles.welcomeText}>Salary Statements</Text>
                 <Text style={styles.dateSubtitle}>Financial Year {year}-{year+1}</Text>
               </View>
            </View>

            <View style={styles.mainCard}>
              <View style={styles.cardInfoSection}>
                <Ionicons name="information-circle-outline" size={20} color="#0D6EFD" />
                <Text style={styles.infoText}>Select a statement period to view or download your payslip in PDF format.</Text>
              </View>

              <Text style={styles.sectionLabel}>Available Statements</Text>
              
              <View style={styles.selectionGrid}>
                {/* Current Month */}
                <TouchableOpacity 
                  style={[styles.periodCard, selectedMonth === "current" && styles.activePeriodCard]}
                  onPress={() => setSelectedMonth("current")}
                >
                  <MaterialCommunityIcons 
                    name="calendar-check" 
                    size={28} 
                    color={selectedMonth === "current" ? "#0D6EFD" : "#adb5bd"} 
                  />
                  <Text style={[styles.periodMonth, selectedMonth === "current" && styles.activePeriodText]}>
                    {monthNames[month - 1]}
                  </Text>
                  <Text style={styles.periodYear}>{year}</Text>
                </TouchableOpacity>

                {/* Last Month */}
                <TouchableOpacity 
                  style={[styles.periodCard, selectedMonth === "last" && styles.activePeriodCard]}
                  onPress={() => setSelectedMonth("last")}
                >
                  <MaterialCommunityIcons 
                    name="calendar-clock" 
                    size={28} 
                    color={selectedMonth === "last" ? "#0D6EFD" : "#adb5bd"} 
                  />
                  <Text style={[styles.periodMonth, selectedMonth === "last" && styles.activePeriodText]}>
                    {monthNames[lastMonth - 1]}
                  </Text>
                  <Text style={styles.periodYear}>{lastMonthYear}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.downloadBtn}
                onPress={() => openPayslip(selectedMonth)}
              >
                <Ionicons name="cloud-download-outline" size={22} color="#fff" />
                <Text style={styles.downloadBtnText}>View Payslip PDF</Text>
              </TouchableOpacity>

              <View style={styles.securityNote}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color="#198754" />
                <Text style={styles.securityText}>End-to-end encrypted document access</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainWrapper: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Branding Side
  brandingSide: { flex: 1, backgroundColor: '#0D6EFD', padding: 40, justifyContent: 'center' },
  brandOverlay: { maxWidth: 400, alignSelf: 'center' },
  heroLogoBox: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', lineHeight: 40 },
  heroSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 25 },
  heroDescription: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24, marginBottom: 40 },
  actionBtnOutline: { borderWidth: 1, borderColor: '#fff', paddingVertical: 12, borderRadius: 10, alignItems: 'center', width: 180 },
  actionBtnOutlineText: { color: '#fff', fontWeight: '700' },

  // Content Side
  dashboardSide: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingHorizontal: '6%', paddingVertical: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  backCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  dateSubtitle: { fontSize: 14, color: '#6c757d', marginTop: 4 },

  mainCard: { backgroundColor: '#fff', borderRadius: 24, padding: 25, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  cardInfoSection: { flexDirection: 'row', backgroundColor: '#E7F1FF', padding: 15, borderRadius: 12, gap: 10, marginBottom: 25 },
  infoText: { flex: 1, color: '#0D6EFD', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  
  sectionLabel: { fontSize: 16, fontWeight: '800', color: '#495057', marginBottom: 15 },
  selectionGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  periodCard: { flex: 1, height: 120, borderRadius: 18, borderWidth: 2, borderColor: '#F1F3F5', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  activePeriodCard: { borderColor: '#0D6EFD', backgroundColor: '#fff' },
  periodMonth: { fontSize: 17, fontWeight: '800', color: '#495057', marginTop: 8 },
  activePeriodText: { color: '#0D6EFD' },
  periodYear: { fontSize: 12, color: '#adb5bd', fontWeight: '700', marginTop: 2 },

  downloadBtn: { backgroundColor: '#198754', flexDirection: 'row', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', gap: 10 },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  securityNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 6 },
  securityText: { fontSize: 12, color: '#6c757d', fontWeight: '600' }
});