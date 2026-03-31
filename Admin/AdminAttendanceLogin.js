import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAdminId } from '../utils/storage';

const AdminAttendanceScreen = () => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && SCREEN_WIDTH > 800;
  const navigation = useNavigation();

  const [permission, requestPermission] = useCameraPermissions();
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);

  const cameraRef = useRef(null);
  const FIXED_LATITUDE = 21.930424;
  const FIXED_LONGITUDE = 86.726709;
  const ALLOWED_RADIUS_METERS = 2000;

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const fetchAdmin = async () => {
      const id = await getAdminId();
      if (id) setAdminId(id);
      else showAlert('Error', 'Admin ID missing. Please log in again.');
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (!adminId) return;
    (async () => {
      try {
        setLoading(true);
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          showAlert('Permission denied', 'Location access required.');
          return setLoading(false);
        }
        if (!permission?.granted) await requestPermission();
        const current = await Location.getCurrentPositionAsync({});
        const distance = getDistance(FIXED_LATITUDE, FIXED_LONGITUDE, current.coords.latitude, current.coords.longitude);
        if (distance <= ALLOWED_RADIUS_METERS) {
          await verifyLocationAPI(current.coords.latitude, current.coords.longitude);
        } else {
          setLocationVerified(false);
          showAlert('Location Error', `Outside radius: ${Math.round(distance)}m`);
        }
      } catch (err) {
        console.log('Location Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [adminId]);

  const deg2rad = (deg) => deg * (Math.PI / 180);
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const verifyLocationAPI = async (lat, lon) => {
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, latitude: lat, longitude: lon }),
      });
      const data = await res.json();
      setLocationVerified(!!data.locationVerified);
    } catch (err) {
      setLocationVerified(false);
    }
  };

  const captureImage = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      setImageUri(photo.uri);
      setShowCamera(false);
      await verifyFaceAPI(photo.uri);
    }
  };

  const verifyFaceAPI = async (uri) => {
    try {
      setFaceLoading(true);
      const formData = new FormData();
      formData.append('adminId', adminId);
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-face', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
      });
      const data = await res.json();
      if (data.success) {
        setFaceVerified(true);
        setCapturedUrl(data.capturedUrl);
      } else {
        setFaceVerified(false);
        showAlert('Face Error', data.message || 'Face not recognized.');
      }
    } catch (err) {
      console.log('Face Verify Error:', err);
    } finally {
      setFaceLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!locationVerified || !faceVerified) return showAlert('Error', 'Complete all verifications.');
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, capturedUrl, faceVerified: true, locationVerified: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Attendance marked successfully!');
        showAlert('Success', data.message);
      }
    } catch (err) {
      console.log('Attendance Error:', err);
    }
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>Verifying position ({loadingCount}s)...</Text>
    </View>
  );

  if (showCamera) return (
    <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
      <View style={styles.cameraOverlay}>
        <TouchableOpacity style={styles.captureBtn} onPress={captureImage}>
          <Ionicons name="camera" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </CameraView>
  );

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />

      {/* LEFT BRAND SIDEBAR */}
      {isWeb && (
        <View style={styles.brandSidebar}>
          <View style={styles.brandContent}>
            <Text style={styles.brandTitle}>Admin Portal 🚀</Text>
            <Text style={styles.brandSub}>
              Ensure hospital security and staff integrity by completing the mandatory daily verification.
            </Text>

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>Geofenced location tracking</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>AI-powered face recognition</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>Instant attendance reporting</Text>
              </View>
            </View>

            <Text style={styles.copyright}>© 2026 Admin Panel. All rights reserved.</Text>
          </View>
        </View>
      )}

      {/* RIGHT FORM AREA */}
      <View style={[styles.formArea, { width: isWeb ? '55%' : '100%' }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.formHeader}>Daily Attendance</Text>
            <Text style={styles.formSubHeader}>Verify your identity to mark presence</Text>

            {/* Location Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Location</Text>
              <View style={styles.inputBox}>
                <Text style={[styles.inputText, { color: locationVerified ? '#10b981' : '#9ca3af' }]}>
                  {locationVerified ? 'Office Location Verified' : 'Awaiting GPS...'}
                </Text>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#9ca3af" />
              </View>
            </View>

            {/* Face Recognition Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Identity Verification</Text>
              <TouchableOpacity 
                style={styles.inputBox} 
                onPress={() => setShowCamera(true)}
                disabled={faceVerified}
              >
                <Text style={[styles.inputText, { color: faceVerified ? '#10b981' : '#9ca3af' }]}>
                  {faceLoading ? 'Scanning...' : faceVerified ? 'Face Confirmed' : 'Tap to start scan'}
                </Text>
                <Ionicons name="person-circle-outline" size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImg} />}

            <TouchableOpacity 
              style={[styles.submitBtn, (!locationVerified || !faceVerified) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!locationVerified || !faceVerified}
            >
              <Text style={styles.submitBtnText}>Submit Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
              <Text style={styles.backLinkText}>Return to <Text style={{fontWeight:'700', color:'#4361ee'}}>Dashboard</Text></Text>
            </TouchableOpacity>

            {message !== '' && <Text style={styles.successMsg}>{message}</Text>}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  
  // Sidebar (Blue)
  brandSidebar: { width: '45%', backgroundColor: '#4361ee', justifyContent: 'center', paddingHorizontal: 60 },
  brandContent: { maxWidth: 400 },
  brandTitle: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 20 },
  brandSub: { color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 26, marginBottom: 40 },
  bulletList: { marginBottom: 60 },
  bulletItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 15 },
  bulletText: { color: '#fff', fontSize: 15 },
  copyright: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  // Form (White)
  formArea: { backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 40 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  formHeader: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  formSubHeader: { fontSize: 14, color: '#6b7280', marginBottom: 35, textAlign: 'center' },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: { flex: 1, fontSize: 14 },

  submitBtn: { backgroundColor: '#4361ee', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnDisabled: { backgroundColor: '#cbd5e1' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  
  backLink: { marginTop: 25, alignSelf: 'center' },
  backLinkText: { color: '#6b7280', fontSize: 14 },

  previewImg: { width: '100%', height: 180, borderRadius: 12, marginVertical: 15 },
  successMsg: { marginTop: 20, textAlign: 'center', color: '#10b981', fontWeight: 'bold' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#4361ee', fontWeight: '600' },
  cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
});

export default AdminAttendanceScreen;