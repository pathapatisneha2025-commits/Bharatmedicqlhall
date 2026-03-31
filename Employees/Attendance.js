import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  StatusBar,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getEmployeeId } from '../utils/storage'; 

const EmpAttendanceScreen = () => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && SCREEN_WIDTH > 800;
  const navigation = useNavigation();
  const route = useRoute();

  // ========================== STATE (UNCHANGED) ==========================
  const [permission, requestPermission] = useCameraPermissions();
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [phone, setPhone] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const cameraRef = useRef(null);
  const FIXED_LATITUDE = 21.930424;
  const FIXED_LONGITUDE = 86.726709;
  const ALLOWED_RADIUS_METERS = 2000;

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${msg || ''}`);
    else Alert.alert(title, msg || '');
  };

  // ========================== LOGIC (UNCHANGED) ==========================
  useEffect(() => {
    const fetchAndVerify = async () => {
      try {
        const storedId = await getEmployeeId();
        const routePhone = route.params?.phone || null;
        setEmployeeId(storedId || null);
        setPhone(routePhone || null);
        if (!storedId && !routePhone) return;
        await verifyLocation(storedId || null, routePhone || null);
      } catch (err) {
        console.error('Error fetching employee ID:', err);
      }
    };
    fetchAndVerify();
  }, [route.params]);

  const verifyLocation = async (empId, phoneNumber) => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission denied', 'Location access is required.');
        return;
      }
      let location = await Location.getLastKnownPositionAsync();
      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          maximumAge: 10000,
          timeout: 5000,
        });
      }
      const { latitude, longitude } = location.coords;
      const distance = getDistanceFromLatLonInMeters(FIXED_LATITUDE, FIXED_LONGITUDE, latitude, longitude);
      if (distance <= ALLOWED_RADIUS_METERS) {
        await verifyLocationAPI(empId, phoneNumber, latitude, longitude);
      } else {
        setLocationVerified(false);
        showAlert('Location Error', `Outside radius (${Math.round(distance)}m)`);
      }
    } catch (err) {
      setLocationVerified(false);
      showAlert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const deg2rad = deg => deg * (Math.PI / 180);

  const verifyLocationAPI = async (empId, phoneNumber, latitude, longitude) => {
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, phone: phoneNumber, latitude, longitude }),
      });
      const data = await res.json();
      setLocationVerified(data.locationVerified);
      if (!data.locationVerified) showAlert('❌ Location not verified');
    } catch (err) { setLocationVerified(false); }
  };

  const captureImage = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
    setImageUri(photo.uri);
    setShowCamera(false);
    await verifyFaceAPI(photo.uri);
  };

  const verifyFaceAPI = async uri => {
    try {
      setFaceLoading(true);
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('phone', phone);
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-face', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
      });
      const data = await res.json();
      if (data.success && data.faceVerified) {
        setFaceVerified(true);
        setCapturedUrl(data.capturedUrl);
        showAlert('✅ Face Verified');
      } else {
        setFaceVerified(false);
        showAlert('❌ Face not recognized');
      }
    } catch (err) { setFaceVerified(false); } finally { setFaceLoading(false); }
  };

  const handleSubmit = async () => {
    if (attendanceMarked) return;
    if (!locationVerified) return showAlert('Location Error', 'Not in allowed location.');
    if (!faceVerified || !capturedUrl) return showAlert('Face Error', 'Verify face first.');
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, phone, capturedUrl, locationVerified: true, faceVerified: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAttendanceMarked(true);
        setMessage('✅ Attendance marked successfully!');
      }
    } catch (err) { setMessage('❌ Error marking attendance.'); }
  };

  useEffect(() => {
    const fetchEmployeeAttendance = async () => {
      try {
        const empId = await getEmployeeId();
        if (!empId) return;
        const empRes = await fetch(`https://hospitaldatabasemanagement.onrender.com/employee/${empId}`);
        const empData = await empRes.json();
        if (!empData.success) return;
        const phone = empData.employee?.mobile || null;
        const [idRes, phoneRes] = await Promise.all([
          fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/employee/${empId}`),
          phone ? fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/employee/phone/${phone}`) : Promise.resolve({ json: async () => ({ success: false, data: [] }) }),
        ]);
        const [idData, phoneData] = await Promise.all([idRes.json(), phoneRes.json()]);
        let allAttendance = [];
        if (idData.success && idData.data) allAttendance.push(...(Array.isArray(idData.data) ? idData.data : [idData.data]));
        if (phoneData.success && phoneData.data) allAttendance.push(...(Array.isArray(phoneData.data) ? phoneData.data : [phoneData.data]));
        const todayString = new Date().toDateString();
        const todayRecord = allAttendance.find(rec => new Date(rec.timestamp).toDateString() === todayString);
        setAttendanceMarked(!!todayRecord);
      } catch (err) { console.error('Fetch attendance error:', err); }
    };
    fetchEmployeeAttendance();
  }, []);

  // ========================== RENDERING ==========================

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#007BFF" /><Text style={styles.loadingText}>Verifying location...</Text></View>
  );

  if (showCamera) return (
    <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
      <View style={styles.cameraActionContainer}>
        <TouchableOpacity style={styles.captureCircle} onPress={captureImage}>
          <Ionicons name="camera" color="#fff" size={30} />
        </TouchableOpacity>
      </View>
    </CameraView>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* Left Content Area */}
      <View style={[styles.leftContent, { width: isWeb ? '50%' : '100%' }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Ionicons name="chevron-back" size={16} color="#9ca3af" />
            <Text style={styles.backLinkText}>Back to role selection</Text>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <View style={styles.logoBox}><Text style={styles.logoText}>BM</Text></View>
            <Text style={styles.logoTitle}>Bharat Medical Hall</Text>
          </View>

          <Text style={styles.mainTitle}>Mark Attendance</Text>
          <Text style={styles.subTitle}>Verify your details to record your daily attendance</Text>

          {/* Verification "Inputs" */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Location Verification</Text>
            <View style={[styles.statusInput, locationVerified && styles.successBorder]}>
              <Ionicons name="location" size={20} color={locationVerified ? "#10b981" : "#9ca3af"} />
              <Text style={[styles.statusInputText, { color: locationVerified ? '#10b981' : '#374151' }]}>
                {locationVerified ? 'Location Verified' : 'Checking GPS...'}
              </Text>
              {locationVerified && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Face Identity</Text>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setShowCamera(true)}
              style={[styles.statusInput, faceVerified && styles.successBorder]}
            >
              <Ionicons name="person" size={20} color={faceVerified ? "#10b981" : "#9ca3af"} />
              <Text style={[styles.statusInputText, { color: faceVerified ? '#10b981' : '#374151' }]}>
                {faceLoading ? 'Verifying...' : faceVerified ? 'Identity Verified' : 'Tap to scan face'}
              </Text>
              <Ionicons name="eye-outline" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {imageUri && <Image source={{ uri: imageUri }} style={styles.facePreview} />}

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: attendanceMarked ? '#94d3a2' : '#0ea5e9' }]} 
            onPress={handleSubmit}
            disabled={attendanceMarked}
          >
            <Text style={styles.submitBtnText}>
              {attendanceMarked ? 'Attendance Marked' : 'Confirm Attendance →'}
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
          <Text style={styles.welcomeHeading}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>
            Access your healthcare management dashboard and stay connected with your medical records.
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
  rightContent: { flex: 1, backgroundColor: '#007BFF', justifyContent: 'center', alignItems: 'center', padding: 40 },
  backLink: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backLinkText: { color: '#9ca3af', fontSize: 14, marginLeft: 5 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
  logoBox: { backgroundColor: '#007BFF', padding: 8, borderRadius: 10, marginRight: 12 },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoTitle: { fontSize: 18, fontWeight: '700', color: '#007BFF' },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subTitle: { fontSize: 15, color: '#6b7280', marginBottom: 35 },
  inputWrapper: { marginBottom: 20 },
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
    marginTop: 20,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  facePreview: { width: '100%', height: 200, borderRadius: 12, marginTop: 10, marginBottom: 10 },
  bottomMsg: { marginTop: 20, textAlign: 'center', color: '#10b981', fontWeight: 'bold' },
  brandCircle: { backgroundColor: 'rgba(255,255,255,0.2)', width: 120, height: 120, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  brandCircleText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  welcomeHeading: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 15 },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 16, lineHeight: 24, maxWidth: 400 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#6b7280' },
  cameraActionContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 50 },
  captureCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#007BFF', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
});

export default EmpAttendanceScreen;