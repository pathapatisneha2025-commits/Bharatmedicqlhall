import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getSubadminId } from '../utils/storage'; 

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const SubadminBreakInScreen = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faceLoading, setFaceLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [subadminId, setSubadminId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [message, setMessage] = useState('');
  const cameraRef = useRef(null);

  const FIXED_LATITUDE = 21.930424;
  const FIXED_LONGITUDE = 86.726709;
  const ALLOWED_RADIUS_METERS = 2000;

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isLargeScreen = SCREEN_WIDTH > 768;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const fetchId = async () => {
      const id = await getSubadminId();
      if (id) setSubadminId(id);
      else showAlert('Error', 'No subadmin ID found. Please log in again.');
    };
    fetchId();
  }, []);

  useEffect(() => {
    if (subadminId) verifyCurrentLocation();
  }, [subadminId]);

  const verifyCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        showAlert('Permission Denied', 'Location access is required.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const distance = getDistanceFromLatLonInMeters(FIXED_LATITUDE, FIXED_LONGITUDE, latitude, longitude);

      if (distance <= ALLOWED_RADIUS_METERS) {
        await verifyLocationAPI(latitude, longitude);
      } else {
        setLocationVerified(false);
        showAlert('Location Error', `You are outside the allowed radius.`);
      }
    } catch (err) {
      showAlert('Error', 'Failed to get location.');
    } finally {
      setLoading(false);
    }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const verifyLocationAPI = async (latitude, longitude) => {
    try {
      const res = await fetch(`${BASE_URL}/attendance/verify-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subadminId, latitude, longitude }),
      });
      const data = await res.json();
      if (data.locationVerified) setLocationVerified(true);
      else setLocationVerified(false);
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
      formData.append('subadminId', subadminId);
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });

      const res = await fetch(`${BASE_URL}/attendance/verify-face`, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
      });

      const data = await res.json();
      if (data.success && data.faceVerified) {
        setFaceVerified(true);
        setCapturedUrl(data.capturedUrl);
        showAlert('✅ Face Verified', `Confidence: ${data.message}%`);
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

  const startBreak = async () => {
    if (!locationVerified || !faceVerified) return showAlert('Error', 'Please verify location and face.');

    try {
      const res = await fetch(`${BASE_URL}/BreakIn-attendance/breaks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subadminId,
          capturedUrl,
          locationVerified: true,
          faceVerified: true,
          breakType: 'Break In',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('🕒 Break Started');
        showAlert('✅ Success', 'Break started successfully!');
      } else {
        showAlert('Error', data.message || 'Failed to start break.');
      }
    } catch (err) {
      showAlert('Network Error', 'Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Validating current location...</Text>
      </View>
    );
  }

  if (showCamera) {
    return (
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={captureImage}>
            <Ionicons name="camera" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.leftColumn} contentContainerStyle={styles.leftContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRole}>
          <Ionicons name="chevron-back" size={16} color="#64748b" />
          <Text style={styles.backRoleText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>BM</Text></View>
          <Text style={styles.brandNameText}>Bharat Medical Hall</Text>
        </View>

        <Text style={styles.loginTitle}>Break Initiation</Text>
        <Text style={styles.loginSub}>Verify yourself to record your break time</Text>

        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <View style={[styles.iconBox, { backgroundColor: locationVerified ? '#f0fdf4' : '#fff1f2' }]}>
              <Ionicons name="location" size={24} color={locationVerified ? '#22c55e' : '#ef4444'} />
            </View>
            <Text style={styles.cardLabel}>GPS</Text>
            <Text style={[styles.cardStatus, { color: locationVerified ? '#22c55e' : '#ef4444' }]}>
              {locationVerified ? 'Verified' : 'Required'}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <View style={[styles.iconBox, { backgroundColor: faceVerified ? '#f0fdf4' : '#fff1f2' }]}>
              <MaterialIcons name="face" size={24} color={faceVerified ? '#22c55e' : '#ef4444'} />
            </View>
            <Text style={styles.cardLabel}>Identity</Text>
            <Text style={[styles.cardStatus, { color: faceVerified ? '#22c55e' : '#ef4444' }]}>
              {faceLoading ? '...' : faceVerified ? 'Verified' : 'Required'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={() => setShowCamera(true)}>
          <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.scanButtonText}>Scan Face</Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

        <TouchableOpacity 
          style={[styles.submitButton, (!locationVerified || !faceVerified) && { opacity: 0.6 }]} 
          onPress={startBreak}
        >
          <Text style={styles.submitButtonText}>Start Break Now</Text>
          <Ionicons name="timer-outline" size={20} color="#fff" style={{marginLeft: 10}} />
        </TouchableOpacity>

        {message !== '' && <Text style={styles.message}>{message}</Text>}
      </ScrollView>

      {isLargeScreen && (
        <View style={styles.rightColumn}>
          <View style={styles.brandContent}>
            <View style={styles.largeLogo}><Text style={styles.largeLogoText}>BM</Text></View>
            <Text style={styles.welcomeText}>Rest Period</Text>
            <Text style={styles.welcomeSub}>
              Take a breather. Your break session will be recorded and logged for payroll accuracy.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default SubadminBreakInScreen;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  leftColumn: { flex: 1, backgroundColor: '#fff' },
  leftContent: { padding: 40, maxWidth: 500, alignSelf: 'center', width: '100%' },
  backRole: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backRoleText: { color: '#64748b', fontSize: 14, marginLeft: 5 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  logoBadge: { backgroundColor: '#0ea5e9', padding: 8, borderRadius: 8, marginRight: 12 },
  logoBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  brandNameText: { fontSize: 18, fontWeight: '700', color: '#0ea5e9' },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  loginSub: { fontSize: 16, color: '#64748b', marginBottom: 40 },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statusCard: { width: '48%', padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  cardStatus: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  scanButton: { flexDirection: 'row', backgroundColor: '#64748b', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  scanButtonText: { color: '#fff', fontWeight: '600' },
  submitButton: { flexDirection: 'row', backgroundColor: '#22c55e', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20, backgroundColor: '#f8fafc' },
  message: { fontSize: 15, textAlign: 'center', color: '#22c55e', marginTop: 15, fontWeight: '700' },
  rightColumn: { flex: 1.2, backgroundColor: '#0070f3', justifyContent: 'center', alignItems: 'center' },
  brandContent: { width: '75%', alignItems: 'center' },
  largeLogo: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 30, borderRadius: 24, marginBottom: 40 },
  largeLogoText: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  welcomeText: { color: '#fff', fontSize: 42, fontWeight: 'bold', marginBottom: 20 },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 18, textAlign: 'center', lineHeight: 28 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#64748b' },
  cameraButtonContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  captureButton: { backgroundColor: '#0ea5e9', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
});