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
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAdminId } from '../utils/storage';

const AdminOffDutyScreen = () => {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && SCREEN_WIDTH > 800;

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
    const fetchId = async () => {
      try {
        const id = await getAdminId();
        if (id) setAdminId(id.toString());
        else showAlert('Error', 'No Admin ID found. Please log in again.');
      } catch (err) {
        console.error('Admin ID Fetch Error:', err);
      }
    };
    fetchId();
  }, []);

  useEffect(() => {
    if (!adminId) return;
    (async () => {
      try {
        setLoading(true);
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          showAlert('Permission denied', 'Location access is required.');
          return setLoading(false);
        }
        if (!permission?.granted) await requestPermission();
        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;
        const distance = getDistance(FIXED_LATITUDE, FIXED_LONGITUDE, latitude, longitude);

        if (distance <= ALLOWED_RADIUS_METERS) {
          await verifyLocationAPI(latitude, longitude);
        } else {
          setLocationVerified(false);
          showAlert('Location Error', `Outside 2km radius. Distance: ${Math.round(distance)}m`);
        }
      } catch (error) {
        showAlert('Error', 'Permission request failed');
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

  const verifyLocationAPI = async (latitude, longitude) => {
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, latitude, longitude }),
      });
      const data = await res.json();
      setLocationVerified(!!data.locationVerified);
    } catch (err) {
      setLocationVerified(false);
    }
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
      formData.append('adminId', adminId);
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/verify-face', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.faceVerified) {
        setFaceVerified(true);
        setCapturedUrl(data.capturedUrl);
      } else {
        setFaceVerified(false);
        showAlert('❌ Face not recognized');
      }
    } catch (err) {
      setFaceVerified(false);
    } finally {
      setFaceLoading(false);
    }
  };

  const handleOffDuty = async () => {
    if (!locationVerified) return showAlert('Location Error', 'Not in allowed location.');
    if (!faceVerified || !capturedUrl) return showAlert('Face Error', 'Face verify first.');
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/attendance/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, capturedUrl, locationVerified: true, faceVerified: true }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Off Duty marked successfully!');
      } else {
        setMessage('❌ Failed to mark Off Duty.');
      }
    } catch (err) {
      setMessage('❌ Error marking Off Duty.');
    }
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#4361ee" />
      <Text style={styles.loadingText}>Verifying position ({loadingCount}s)</Text>
    </View>
  );

  if (showCamera) return (
    <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
      <View style={styles.cameraOverlay}>
        <TouchableOpacity style={styles.captureBtn} onPress={captureImage}>
          <Ionicons name="camera" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </CameraView>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      {/* LEFT SIDE: BRANDING */}
      {isWeb && (
        <View style={styles.brandSection}>
          <View style={styles.brandContent}>
            <Text style={styles.brandTitle}>Finish your shift 🚀</Text>
            <Text style={styles.brandSub}>
              Ensure all your daily tasks are logged. Your off-duty status helps maintain accurate facility records.
            </Text>

            <View style={styles.listContainer}>
              <View style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>Secure identity check</Text>
              </View>
              <View style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>Location-based clock out</Text>
              </View>
              <View style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>Instant shift reporting</Text>
              </View>
            </View>

            <Text style={styles.footerBrand}>© 2026 Admin Portal. All rights reserved.</Text>
          </View>
        </View>
      )}

      {/* RIGHT SIDE: FORM */}
      <View style={[styles.formSection, { width: isWeb ? '55%' : '100%' }]}>
        <ScrollView contentContainerStyle={styles.scrollPadding}>
          <View style={styles.formCard}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            
            <Text style={styles.formHeading}>Mark Off Duty</Text>
            <Text style={styles.formDescription}>Complete the steps below to end your duty</Text>

            {/* GPS Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>GPS Verification</Text>
              <View style={styles.inputStyle}>
                <Text style={[styles.inputPlaceholder, locationVerified && { color: '#10b981' }]}>
                  {locationVerified ? 'Location Verified' : 'Awaiting location...'}
                </Text>
                <MaterialCommunityIcons name="map-marker-check" size={20} color={locationVerified ? '#10b981' : '#9ca3af'} />
              </View>
            </View>

            {/* Face Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Face ID</Text>
              <TouchableOpacity style={styles.inputStyle} onPress={() => setShowCamera(true)}>
                <Text style={[styles.inputPlaceholder, faceVerified && { color: '#10b981' }]}>
                  {faceLoading ? 'Verifying...' : faceVerified ? 'Identity Confirmed' : 'Scan face to verify'}
                </Text>
                <Ionicons name="person-outline" size={20} color={faceVerified ? '#10b981' : '#9ca3af'} />
              </TouchableOpacity>
            </View>

            {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}

            <TouchableOpacity 
              style={[styles.mainBtn, (!locationVerified || !faceVerified) && styles.disabledBtn]} 
              onPress={handleOffDuty}
              disabled={!locationVerified || !faceVerified}
            >
              <Text style={styles.btnText}>Submit Off Duty</Text>
            </TouchableOpacity>

            {message !== '' && <Text style={styles.resultMsg}>{message}</Text>}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  
  // Left Sidebar Styles
  brandSection: { width: '45%', backgroundColor: '#4361ee', justifyContent: 'center', paddingHorizontal: 60 },
  brandContent: { maxWidth: 400 },
  brandTitle: { color: '#fff', fontSize: 38, fontWeight: '800', marginBottom: 20 },
  brandSub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 26, marginBottom: 40 },
  listContainer: { marginBottom: 60 },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 15 },
  listText: { color: '#fff', fontSize: 15 },
  footerBrand: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  // Right Form Styles
  formSection: { backgroundColor: '#fff' },
  scrollPadding: { flexGrow: 1, justifyContent: 'center', padding: 40 },
  formCard: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  backButton: { marginBottom: 20 },
  formHeading: { fontSize: 26, fontWeight: '700', color: '#111827', marginBottom: 8 },
  formDescription: { fontSize: 14, color: '#6b7280', marginBottom: 35 },

  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputPlaceholder: { flex: 1, fontSize: 14, color: '#9ca3af' },

  mainBtn: { backgroundColor: '#4361ee', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  disabledBtn: { backgroundColor: '#cbd5e1' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  
  imagePreview: { width: '100%', height: 200, borderRadius: 12, marginVertical: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  resultMsg: { marginTop: 20, textAlign: 'center', color: '#10b981', fontWeight: 'bold' },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#4361ee', fontWeight: '600' },
  cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#4361ee', justifyContent: 'center', alignItems: 'center', borderWidth: 5, borderColor: 'rgba(255,255,255,0.3)' },
});

export default AdminOffDutyScreen;