import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  StyleSheet, 
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView, 
  ScrollView,
  Alert
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupLogin() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");

  const isLargeScreen = width > 768;

  useEffect(() => {
    AsyncStorage.getItem("employeeId").then((id) => {
      if (id) setIsLoggedIn(true);
    });
  }, []);

  const handleMarkAttendance = () => {
    if (!phone || phone.length !== 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
      return;
    }
    navigation.navigate("EmpAttendanceScreen", { phone });
  };

  const handleLogoutAttendance = () => {
    if (!phone || phone.length !== 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
      return;
    }
    navigation.navigate("Attendanceoffduty", { phone });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={[styles.mainWrapper, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          
          {/* LEFT SECTION: Interaction Form */}
          <View style={[styles.leftSection, { width: isLargeScreen ? '50%' : '100%' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Brand Header */}
              <View style={styles.headerRow}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoBadgeText}>BM</Text>
                </View>
                <Text style={styles.brandName}>Bharat Medical Hall</Text>
              </View>

              <Text style={styles.title}>Employee Portal</Text>
              <Text style={styles.subtitle}>Sign in to your account or mark quick attendance below.</Text>

              {/* AUTH BUTTONS */}
              <View style={styles.authRow}>
                <TouchableOpacity 
                  style={[styles.outlineButton, { flex: 1, marginRight: 10 }]} 
                  onPress={() => navigation.navigate("EmpSignUp")}
                >
                  <Text style={styles.outlineButtonText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.primaryButton, { flex: 1 }]} 
                  onPress={() => navigation.navigate("EmpLogin")}
                >
                  <Text style={styles.primaryButtonText}>Login</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>QUICK ATTENDANCE</Text>
                <View style={styles.line} />
              </View>

              {/* ATTENDANCE SECTION */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.attendanceButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.checkInBtn]} 
                  onPress={handleMarkAttendance}
                >
                  <Ionicons name="time-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Duty On</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.checkOutBtn]} 
                  onPress={handleLogoutAttendance}
                >
                  <Ionicons name="exit-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionButtonText}>Duty Off</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>

          {/* RIGHT SECTION: Branding (Visible on Tablets/Web) */}
          {isLargeScreen && (
            <View style={styles.rightSection}>
              <View style={styles.blueLogoBadge}>
                <Text style={styles.blueLogoText}>BM</Text>
              </View>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Efficiently manage your shifts and medical records in one secure place.
              </Text>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainWrapper: { flex: 1 },
  
  // Left Side
  leftSection: { paddingHorizontal: '8%', justifyContent: 'center', paddingVertical: 40 },
  scrollContent: { maxWidth: 450, alignSelf: 'center', width: '100%' },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  logoBadge: { backgroundColor: '#007AFF', padding: 8, borderRadius: 8, marginRight: 12 },
  logoBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  brandName: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  
  title: { fontSize: 32, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 35, lineHeight: 22 },

  // Auth Buttons
  authRow: { flexDirection: 'row', marginBottom: 40 },
  primaryButton: { backgroundColor: '#007AFF', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  outlineButton: { borderWidth: 1.5, borderColor: '#007AFF', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  outlineButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },

  // Divider
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { marginHorizontal: 15, color: '#999', fontSize: 12, fontWeight: '700' },

  // Attendance Input
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111'
  },

  // Attendance Buttons
  attendanceButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    height: 55, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  checkInBtn: { backgroundColor: '#00AEEF' },
  checkOutBtn: { backgroundColor: '#007AFF' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Right Side (Visual)
  rightSection: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  blueLogoBadge: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    width: 120, height: 120, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 40 
  },
  blueLogoText: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  welcomeTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  welcomeSubtitle: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 18, lineHeight: 28, maxWidth: 400 }
});