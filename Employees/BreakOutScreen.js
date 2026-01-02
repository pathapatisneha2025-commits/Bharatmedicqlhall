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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getEmployeeId } from '../utils/storage';

const BreakOUTScreen = () => {
  const navigation = useNavigation();
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

  // ✅ Load employee ID and verify location
  useEffect(() => {
    const fetchEmployeeData = async () => {
      const id = await getEmployeeId();
      if (!id) {
        Alert.alert('Error', 'No employee ID found. Please log in again.');
        return;
      }
      setEmployeeId(id);
      await verifyCurrentLocation(id); // ✅ pass directly
    };
    fetchEmployeeData();
  }, []);

  // ✅ Verify current location with proper ID passing
  const verifyCurrentLocation = async (id) => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Denied', 'Please enable location access.');
        setLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = current.coords;
      const distance = getDistanceFromLatLonInMeters(
        FIXED_LATITUDE,
        FIXED_LONGITUDE,
        latitude,
        longitude
      );

      if (distance <= ALLOWED_RADIUS_METERS) {
        await verifyLocationAPI(latitude, longitude, id); // ✅ pass here too
      } else {
        setLocationVerified(false);
        Alert.alert('Outside Zone', `You are ${Math.round(distance)}m away from office.`);
      }
    } catch (e) {
      console.error('Location error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Distance calculator
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ✅ Location verification API
  const verifyLocationAPI = async (latitude, longitude, id) => {
    try {
      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/verify-location',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: id, latitude, longitude }),
        }
      );
      const data = await res.json();
      setLocationVerified(data.locationVerified || false);
    } catch (e) {
      console.error('Location verify API error:', e);
      setLocationVerified(false);
    }
  };

  // ✅ Capture photo
  const captureImage = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
    setImageUri(photo.uri);
    setShowCamera(false);
    await verifyFaceAPI(photo.uri);
  };

  // ✅ Face verification API
  const verifyFaceAPI = async (uri) => {
    try {
      setFaceLoading(true);
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });

      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/verify-face',
        {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
          body: formData,
        }
      );

      const data = await res.json();
      if (data.success && data.faceVerified) {
        setFaceVerified(true);
        setCapturedUrl(data.capturedUrl);
        Alert.alert('✅ Face Verified', `Confidence: ${data.message}%`);
      } else {
        setFaceVerified(false);
        Alert.alert('❌ Face Not Recognized');
      }
    } catch (e) {
      console.error('Face verify error:', e);
    } finally {
      setFaceLoading(false);
    }
  };

  // ✅ End Break Function
  const endBreak = async () => {
    if (!locationVerified) return Alert.alert('Location Error', 'Please verify your location.');
    if (!faceVerified) return Alert.alert('Face Error', 'Please verify your face.');

    try {
      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/breaks',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId,
            capturedUrl,
            locationVerified: true,
            faceVerified: true,
            breakType: 'Break Out',
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessage('🕒 Break Ended');
        Alert.alert('✅ Success', 'Break ended successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to end break.');
      }
    } catch (e) {
      console.error('End break error:', e);
      Alert.alert('Network Error', 'Please try again.');
    }
  };

  // ✅ UI Rendering
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Verifying location...</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning-outline" size={50} color="#ff5252" />
        <Text style={styles.permissionText}>Camera permission denied.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showCamera) {
    return (
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={captureImage}>
            <Ionicons name="camera" color="#fff" size={24} />
            <Text style={{ color: '#fff', marginLeft: 8, fontSize: 16 }}>Capture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Break Out Attendance</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Status Cards */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Ionicons
            name={locationVerified ? 'location' : 'location-outline'}
            size={28}
            color={locationVerified ? '#2ecc71' : '#FF0000'}
          />
          <Text style={styles.cardLabel}>GPS Location</Text>
          <Text style={[styles.cardStatus, { color: locationVerified ? '#2ecc71' : '#FF0000' }]}>
            {locationVerified ? 'Verified' : 'Not Verified'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Ionicons
            name={faceVerified ? 'happy' : 'sad-outline'}
            size={28}
            color={faceVerified ? '#2ecc71' : '#FF0000'}
          />
          <Text style={styles.cardLabel}>Face Verification</Text>
          <Text style={[styles.cardStatus, { color: faceVerified ? '#2ecc71' : '#FF0000' }]}>
            {faceLoading ? 'Verifying...' : faceVerified ? 'Verified' : 'Not Verified'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.primaryButton} onPress={() => setShowCamera(true)}>
        <Ionicons name="camera" color="#fff" size={20} />
        <Text style={styles.buttonText}>Open Front Camera</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
      )}

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: '#10b981' }]}
        onPress={endBreak}
      >
        <Ionicons name="pause-circle" color="#fff" size={20} />
        <Text style={styles.buttonText}>End Break</Text>
      </TouchableOpacity>

      {message !== '' && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export default BreakOUTScreen;

// ✅ Styles unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingTop: 35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6b7280' },
  permissionText: {
    marginTop: 10,
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 25,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  cardStatus: { fontSize: 15, fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#007BFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#059669',
    marginTop: 15,
    fontWeight: '600',
  },
  cameraButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 50,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 3,
  },
});
