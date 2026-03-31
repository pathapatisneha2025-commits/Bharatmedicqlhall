import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getEmployeeId } from '../utils/storage';

const BreakOUTScreen = () => {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && SCREEN_WIDTH > 800;

  // ========================== STATE (UNCHANGED) ==========================
  const [permission, requestPermission] = useCameraPermissions();
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faceLoading, setFaceLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [message, setMessage] = useState('');
  const cameraRef = useRef(null);

  const FIXED_LATITUDE = 21.930424;
  const FIXED_LONGITUDE = 86.726709;
  const ALLOWED_RADIUS_METERS = 2000;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  // ========================== LOGIC (UNCHANGED) ==========================
  useEffect(() => {
    const fetchEmployeeData = async () => {
      const id = await getEmployeeId();
      if (!id) {
        showAlert('Error', 'No employee ID found. Please log in again.');
        return;
      }
      setEmployeeId(id);
      await verifyCurrentLocation(id);
    };
    fetchEmployeeData();
  }, []);

  const verifyCurrentLocation = async (id) => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Location Permission Denied', 'Please enable location access.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = current.coords;
      const distance = getDistanceFromLatLonInMeters(FIXED_LATITUDE, FIXED_LONGITUDE, latitude, longitude);

      if (distance <= ALLOWED_RADIUS_METERS) {
        await verifyLocationAPI(latitude, longitude, id);
      } else {
        setLocationVerified(false);
        showAlert('Outside Zone', `You are ${Math.round(distance)}m away from office.`);
      }
    } catch (e) { console.error('Location error:', e); } finally { setLoading(false); }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const verifyLocationAPI = async (latitude, longitude, id) => {
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: id, latitude, longitude }),
      });
      const data = await res.json();
      setLocationVerified(data.locationVerified || false);
    } catch (e) { setLocationVerified(false); }
  };

  const captureImage = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
    setImageUri(photo.uri);
    setShowCamera(false);
    await verifyFaceAPI(photo.uri);
  };

  const verifyFaceAPI = async (uri) => {
    try {
      setFaceLoading(true);
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });

      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-face', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.faceVerified) {
        setFaceVerified(true);
        setCapturedUrl(data.capturedUrl);
      } else {
        setFaceVerified(false);
        showAlert('❌ Face Not Recognized');
      }
    } catch (e) { console.error('Face error:', e); } finally { setFaceLoading(false); }
  };

  const endBreak = async () => {
    if (!locationVerified) return showAlert('Location Error', 'Please verify your location.');
    if (!faceVerified) return showAlert('Face Error', 'Please verify your face.');
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/breaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, capturedUrl, locationVerified: true, faceVerified: true, breakType: 'Break Out' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('🕒 Break Ended Successfully');
        showAlert('✅ Success', 'Back on duty!');
      }
    } catch (e) { showAlert('Network Error', 'Please try again.'); }
  };

  // ========================== RENDERING (NEW UI) ==========================

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

      {/* Left Content */}
      <View style={[styles.leftContent, { width: isWeb ? '50%' : '100%' }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Ionicons name="chevron-back" size={16} color="#9ca3af" />
            <Text style={styles.backLinkText}>Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <View style={styles.logoBox}><Text style={styles.logoText}>BM</Text></View>
            <Text style={styles.logoTitle}>Bharat Medical Hall</Text>
          </View>

          <Text style={styles.mainTitle}>Break Out</Text>
          <Text style={styles.subTitle}>Ready to resume? Verify your identity to end your break and restart your work timer.</Text>

          {/* Verification Status List */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Location Check</Text>
            <View style={[styles.statusInput, locationVerified && styles.successBorder]}>
              <Ionicons name="location" size={20} color={locationVerified ? "#10b981" : "#9ca3af"} />
              <Text style={[styles.statusInputText, { color: locationVerified ? '#10b981' : '#374151' }]}>
                {locationVerified ? 'Office Location Verified' : 'Checking GPS...'}
              </Text>
              {locationVerified && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Biometric Check</Text>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setShowCamera(true)}
              style={[styles.statusInput, faceVerified && styles.successBorder]}
            >
              <Ionicons name="person" size={20} color={faceVerified ? "#10b981" : "#9ca3af"} />
              <Text style={[styles.statusInputText, { color: faceVerified ? '#10b981' : '#374151' }]}>
                {faceLoading ? 'Verifying...' : faceVerified ? 'Face Verified' : 'Tap to scan face'}
              </Text>
              <Ionicons name="camera-outline" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {imageUri && <Image source={{ uri: imageUri }} style={styles.facePreview} />}

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: '#0ea5e9' }]} 
            onPress={endBreak}
          >
            <Text style={styles.submitBtnText}>Resume Work →</Text>
          </TouchableOpacity>

          {message !== '' && <Text style={styles.bottomMsg}>{message}</Text>}
          
        </ScrollView>
      </View>

      {/* Right Content (Web Only) */}
      {isWeb && (
        <View style={styles.rightContent}>
          <View style={styles.brandCircle}>
            <Text style={styles.brandCircleText}>BM</Text>
          </View>
          <Text style={styles.welcomeHeading}>Welcome Back</Text>
          <Text style={styles.welcomeSub}>
            Finish your verification to resume your shift. We ensure every clock-in is secure and accurate.
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
  submitBtn: { paddingVertical: 16, borderRadius: 15, alignItems: 'center', marginTop: 20, elevation: 2 },
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

export default BreakOUTScreen;