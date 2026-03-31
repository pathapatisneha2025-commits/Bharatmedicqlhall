import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

const BreakScreen = () => {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && SCREEN_WIDTH > 800;

  // ========================== STATE (UNCHANGED) ==========================
  const [locationVerified, setLocationVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);
  const [message, setMessage] = useState("");
  const [breakStartedToday, setBreakStartedToday] = useState(false);

  const FIXED_LATITUDE = 21.930424;
  const FIXED_LONGITUDE = 86.726709;
  const ALLOWED_RADIUS_METERS = 2000;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  // ========================== LOGIC (UNCHANGED) ==========================
  useEffect(() => {
    const fetchEmployeeId = async () => {
      const id = await getEmployeeId();
      if (!id) {
        showAlert("Error", "Employee ID not found. Please login again.");
        return;
      }
      setEmployeeId(id);
    };
    fetchEmployeeId();
  }, []);

  useEffect(() => {
    if (employeeId) verifyCurrentLocation(employeeId);
  }, [employeeId]);

  const verifyCurrentLocation = async (id) => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission Denied", "Enable location permission");
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = current.coords;
      const distance = getDistanceFromLatLonInMeters(FIXED_LATITUDE, FIXED_LONGITUDE, latitude, longitude);

      if (distance <= ALLOWED_RADIUS_METERS) {
        await verifyLocationAPI(latitude, longitude, id);
      } else {
        setLocationVerified(false);
        showAlert("Outside Office", `You are ${Math.round(distance)} meters away`);
      }
    } catch (err) {
      console.error("Location error:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyLocationAPI = async (latitude, longitude, id) => {
    try {
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/attendance/verify-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id, latitude, longitude }),
      });
      const data = await res.json();
      setLocationVerified(!!data.locationVerified);
    } catch (err) { setLocationVerified(false); }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const startBreak = async () => {
    if (!locationVerified) return showAlert("Location Error", "Location not verified");
    try {
      const res = await fetch("https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, locationVerified: true, breakType: "Break In" }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("🕒 Break Started Successfully");
        showAlert("Success", "Break started");
        setBreakStartedToday(true);
      } else {
        showAlert("Error", data.message || "Failed to start break");
      }
    } catch (err) { showAlert("Network Error", "Try again later"); }
  };

  useEffect(() => {
    if (!employeeId) return;
    const checkBreakToday = async () => {
      try {
        const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/${employeeId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const today = new Date().toISOString().split('T')[0];
          const breakInToday = data.data.some(record => {
            const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
            return record.break_type === "Break In" && recordDate === today;
          });
          if (breakInToday) {
            setBreakStartedToday(true);
            setMessage("🕒 Break already started today");
          }
        }
      } catch (err) { console.error("Error checking break status:", err); }
    };
    checkBreakToday();
  }, [employeeId]);

  // ========================== RENDERING (NEW UI) ==========================

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /><Text style={styles.loadingText}>Verifying location...</Text></View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Left Content Area */}
      <View style={[styles.leftContent, { width: isWeb ? '50%' : '100%' }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Ionicons name="chevron-back" size={16} color="#9ca3af" />
            <Text style={styles.backLinkText}>Back to Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <View style={styles.logoBox}><Text style={styles.logoText}>BM</Text></View>
            <Text style={styles.logoTitle}>Bharat Medical Hall</Text>
          </View>

          <Text style={styles.mainTitle}>Break In</Text>
          <Text style={styles.subTitle}>Take a breather. Record your break start time to maintain accurate shift logs.</Text>

          {/* Location Verification Input Style */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Required Workspace Check</Text>
            <View style={[styles.statusInput, locationVerified && styles.successBorder]}>
              <Ionicons name="location" size={20} color={locationVerified ? "#10b981" : "#9ca3af"} />
              <Text style={[styles.statusInputText, { color: locationVerified ? '#10b981' : '#374151' }]}>
                {locationVerified ? 'Workspace Verified' : 'Checking GPS Location...'}
              </Text>
              {locationVerified && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: breakStartedToday ? '#94d3a2' : '#0ea5e9' }]} 
            onPress={startBreak}
            disabled={breakStartedToday}
          >
            <Text style={styles.submitBtnText}>
              {breakStartedToday ? 'Break in Progress' : 'Start My Break →'}
            </Text>
          </TouchableOpacity>

          {message !== '' && <Text style={styles.bottomMsg}>{message}</Text>}
          
        </ScrollView>
      </View>

      {/* Right Brand Area (Web Only) */}
      {isWeb && (
        <View style={styles.rightContent}>
          <View style={styles.brandCircle}>
            <Text style={styles.brandCircleText}>BM</Text>
          </View>
          <Text style={styles.welcomeHeading}>Rest & Recharge</Text>
          <Text style={styles.welcomeSub}>
            Taking breaks improves productivity and focus. Your break time will be automatically recorded in the system.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  leftContent: { paddingHorizontal: '8%', justifyContent: 'center' },
  scrollPadding: { paddingVertical: 50 },
  rightContent: { flex: 1, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', padding: 40 },
  backLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backLinkText: { color: '#9ca3af', fontSize: 14, marginLeft: 5 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
  logoBox: { backgroundColor: '#10b981', padding: 8, borderRadius: 10, marginRight: 12 },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoTitle: { fontSize: 18, fontWeight: '700', color: '#10b981' },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subTitle: { fontSize: 15, color: '#6b7280', marginBottom: 35 },
  inputWrapper: { marginBottom: 30 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  statusInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  successBorder: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  statusInputText: { flex: 1, marginLeft: 12, fontSize: 15 },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  bottomMsg: { marginTop: 25, textAlign: 'center', color: '#10b981', fontWeight: '600', fontSize: 15 },
  brandCircle: { backgroundColor: 'rgba(255,255,255,0.2)', width: 120, height: 120, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  brandCircleText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  welcomeHeading: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 15 },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 16, lineHeight: 24, maxWidth: 400 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 15, color: '#6b7280' },
});

export default BreakScreen;