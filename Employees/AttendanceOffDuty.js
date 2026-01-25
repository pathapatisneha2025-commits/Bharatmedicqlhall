import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
     Platform ,
ActivityIndicator,
  Image,
  StatusBar,
  ScrollView,
      useWindowDimensions,

} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getEmployeeId } from '../utils/storage';

const OffDutyScreen = () => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const MAX_WIDTH = 420; // maximum width for desktop/tablet
    const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [hoursData, setHoursData] = useState(null);

  const cameraRef = useRef(null);

 const FIXED_LATITUDE = 21.930424;
  const FIXED_LONGITUDE = 86.726709;
  const ALLOWED_RADIUS_METERS = 2000;
const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    // Web fallback
    window.alert(`${title}\n\n${message}`);
  } else {
    // Android / iOS native alert
    Alert.alert(title, message);
  }
};
  useEffect(() => {
    const fetchId = async () => {
      const id = await getEmployeeId();
      if (id) setEmployeeId(id.toString());
      else showAlert('Error', 'No employee ID found. Please log in again.');
    };
    fetchId();
  }, []);

  // ✅ Check location and camera permissions
  useEffect(() => {
    if (!employeeId) return;
    (async () => {
      try {
        setLoading(true);
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          showAlert('Permission denied', 'Location access is required.');
          setLoading(false);
          return;
        }

        if (!permission?.granted) await requestPermission();

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
         showAlert(
            'Location Error',
            `You are outside the allowed radius. Distance: ${Math.round(distance)}m`
          );
        }
      } catch (error) {
        console.error('Permission Error:', error);
        showAlert('Error', 'Permission request failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [employeeId]);

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const verifyLocationAPI = async (latitude, longitude) => {
    try {
      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/verify-location',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, latitude, longitude }),
        }
      );
      const data = await res.json();
      setLocationVerified(data.locationVerified);
      if (!data.locationVerified)  showAlert('❌ Location not verified');
    } catch (err) {
      console.error('Location Verify Error:', err);
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
      formData.append('employeeId', employeeId);
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });

      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/verify-face',
        { method: 'POST', body: formData, headers: { Accept: 'application/json' } }
      );

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
      console.error('Face Verify Error:', err);
      setFaceVerified(false);
    } finally {
      setFaceLoading(false);
    }
  };

  const handleOffDuty = async () => {
    if (!locationVerified) return  showAlert('Location Error', 'You are not in the allowed location.');
    if (!faceVerified || !capturedUrl) return  showAlert('Face Error', 'Please verify your face first.');

    try {
      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/logout',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId,
            capturedUrl,
            locationVerified: true,
            faceVerified: true,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessage('✅ Off Duty marked successfully!');
        setHoursData(data.data);
        showAlert('Success', data.message || 'Off Duty marked successfully');
      } else {
        setMessage('❌ Failed to mark Off Duty.');
        showAlert('Error', data.message || 'Failed to mark Off Duty.');
      }
    } catch (err) {
      console.error('Off Duty API Error:', err);
      setMessage('❌ Error marking Off Duty.');
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Verifying location...</Text>
      </View>
    );

  if (!permission?.granted)
    return (
      <View style={styles.centered}>
        <Ionicons name="warning-outline" size={50} color="#FF0000" />
        <Text style={styles.permissionText}>Camera permission denied.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );

  if (showCamera)
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View style={[styles.mainWrapper, { width: containerWidth, alignSelf: 'center' }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={26} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Off Duty</Text>
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
          <Text
            style={[
              styles.cardStatus,
              { color: locationVerified ? '#2ecc71' : '#FF0000' },
            ]}
          >
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
          <Text
            style={[
              styles.cardStatus,
              { color: faceVerified ? '#2ecc71' : '#FF0000' },
            ]}
          >
            {faceLoading ? 'Verifying...' : faceVerified ? 'Verified' : 'Not Verified'}
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowCamera(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" color="#fff" size={20} />
        <Text style={styles.buttonText}>Open Front Camera</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: '#10b981' }]}
        onPress={handleOffDuty}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-circle" color="#fff" size={20} />
        <Text style={styles.buttonText}>Submit Off Duty</Text>
      </TouchableOpacity>

      {message !== '' && <Text style={styles.message}>{message}</Text>}

      {hoursData && (
        <View style={styles.hoursBox}>
          <Text style={styles.hoursTitle}>📊 Work Hours Summary</Text>
          <Text style={styles.hoursText}>Session Hours: {hoursData.sessionHours}</Text>
          <Text style={styles.hoursText}>Daily Hours: {hoursData.dailyHours}</Text>
          <Text style={styles.hoursText}>Weekly Hours: {hoursData.weeklyHours}</Text>
          <Text style={styles.hoursText}>Monthly Hours: {hoursData.monthlyHours}</Text>
        </View>
      )}
      </View>
    </ScrollView>
  );
};

export default OffDutyScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  cardStatus: {
    fontSize: 15,
    fontWeight: '700',
  },
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
  hoursBox: {
    marginTop: 30,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 2,
  },
  hoursTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#1f2937' },
  hoursText: { fontSize: 15, color: '#4b5563', marginBottom: 4 },
});
