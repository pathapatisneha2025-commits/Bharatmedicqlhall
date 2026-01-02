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
import { getSubadminId } from '../utils/storage'; // ✅ Fetch subadmin ID

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

  // ✅ Office Location (change as needed)
 const FIXED_LATITUDE = 21.930424;
  const FIXED_LONGITUDE = 86.726709;
  const ALLOWED_RADIUS_METERS = 2000;

  useEffect(() => {
    const fetchId = async () => {
      const id = await getSubadminId();
      if (id) setSubadminId(id);
      else Alert.alert('Error', 'No subadmin ID found. Please log in again.');
    };
    fetchId();
  }, []);

  useEffect(() => {
    if (subadminId) verifyCurrentLocation();
  }, [subadminId]);

  // ✅ Verify Current Location
  const verifyCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const distance = getDistanceFromLatLonInMeters(
        FIXED_LATITUDE,
        FIXED_LONGITUDE,
        latitude,
        longitude
      );

      if (distance <= ALLOWED_RADIUS_METERS) {
        await verifyLocationAPI(latitude, longitude);
      } else {
        setLocationVerified(false);
        Alert.alert('Location Error', `You are outside the allowed radius (${Math.round(distance)}m)`);
      }
    } catch (err) {
      console.error('Location Error:', err);
      Alert.alert('Error', 'Failed to get location.');
    } finally {
      setLoading(false);
    }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  // ✅ Verify Location with Backend
  const verifyLocationAPI = async (latitude, longitude) => {
    try {
      const res = await fetch(`${BASE_URL}/attendance/verify-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subadminId, latitude, longitude }),
      });
      const data = await res.json();
      if (data.locationVerified) setLocationVerified(true);
      else {
        setLocationVerified(false);
        Alert.alert('❌ Location not verified');
      }
    } catch (err) {
      console.error('Verify Location Error:', err);
      setLocationVerified(false);
    }
  };

  // ✅ Capture Image
  const captureImage = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      setImageUri(photo.uri);
      setShowCamera(false);
      await verifyFaceAPI(photo.uri);
    }
  };

  // ✅ Face Verification
  const verifyFaceAPI = async (uri) => {
    try {
      setFaceLoading(true);
      const formData = new FormData();
      formData.append('subadminId', subadminId);
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'face.jpg',
      });

      const res = await fetch(`${BASE_URL}/attendance/verify-face`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await res.json();
      if (data.success && data.faceVerified) {
        setFaceVerified(true);
        setCapturedUrl(data.capturedUrl);
        Alert.alert('✅ Face Verified', `Confidence: ${data.message}%`);
      } else {
        setFaceVerified(false);
        Alert.alert('❌ Face not recognized');
      }
    } catch (err) {
      console.error('Verify Face Error:', err);
      setFaceVerified(false);
    } finally {
      setFaceLoading(false);
    }
  };

  // ✅ Break In for Subadmin
  const startBreak = async () => {
    if (!locationVerified)
      return Alert.alert('Location Error', 'Location not verified.');
    if (!faceVerified || !capturedUrl)
      return Alert.alert('Face Error', 'Please verify your face first.');

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
        Alert.alert('✅ Success', data.message || 'Break started successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to start break.');
      }
    } catch (err) {
      console.error('Start Break Error:', err);
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
        <Ionicons name="warning-outline" size={40} color="red" />
        <Text style={styles.permissionText}>Camera permission denied.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
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
            <Text style={{ color: '#fff', fontSize: 16 }}>📸 Capture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subadmin Break In</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* GPS Status */}
      <View style={styles.infoBox}>
        <Text style={styles.statusText}>GPS Status:</Text>
        <Ionicons
          name={locationVerified ? 'location' : 'location-outline'}
          size={28}
          color={locationVerified ? 'green' : 'red'}
        />
        <Text style={{ color: locationVerified ? 'green' : 'red', marginLeft: 8 }}>
          {locationVerified ? 'Verified' : 'Not Verified'}
        </Text>
      </View>

      {/* Face Status */}
      <View style={styles.infoBox}>
        <Text style={styles.statusText}>Face Status:</Text>
        {faceLoading ? (
          <Text style={{ color: '#555', marginLeft: 8 }}>⏳ Verifying...</Text>
        ) : (
          <>
            <Ionicons
              name={faceVerified ? 'checkmark-circle' : 'close-circle'}
              size={28}
              color={faceVerified ? 'green' : 'red'}
            />
            <Text style={{ color: faceVerified ? 'green' : 'red', marginLeft: 8 }}>
              {faceVerified ? 'Verified' : 'Not Verified'}
            </Text>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={() => setShowCamera(true)}>
        <Text style={styles.buttonText}>Open Front Camera</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#28a745' }]}
        onPress={startBreak}
      >
        <Text style={styles.buttonText}>Start Break</Text>
      </TouchableOpacity>

      {message !== '' && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export default SubadminBreakInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    paddingHorizontal: 20,
    marginTop: 35,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  permissionText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: { fontSize: 16, fontWeight: '600', marginRight: 8, color: '#333' },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  message: { fontSize: 18, textAlign: 'center', color: 'green', marginTop: 15 },
  cameraButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: { backgroundColor: '#007BFF', padding: 15, borderRadius: 50 },
});
