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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAdminId } from '../utils/storage'; // ✅ Admin ID import

const AdminOffDutyScreen = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);

  const cameraRef = useRef(null);

  // ✅ Fixed office coordinates
  const FIXED_LATITUDE = 17.677829;
  const FIXED_LONGITUDE = 83.198689;
  const ALLOWED_RADIUS_METERS = 2000; // 2 km

  // ------------------- GET ADMIN ID -------------------
  useEffect(() => {
    const fetchId = async () => {
      try {
        const id = await getAdminId();
        if (id) setAdminId(id.toString());
        else Alert.alert('Error', 'No Admin ID found. Please log in again.');
      } catch (err) {
        console.error('Admin ID Fetch Error:', err);
      }
    };
    fetchId();
  }, []);

  // ------------------- VERIFY LOCATION -------------------
  useEffect(() => {
    if (!adminId) return;

    (async () => {
      try {
        setLoading(true);

        const { status: locStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted') {
          Alert.alert('Permission denied', 'Location access is required.');
          return setLoading(false);
        }

        if (!permission?.granted) await requestPermission();

        const currentLocation = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = currentLocation.coords;

        const distance = getDistance(
          FIXED_LATITUDE,
          FIXED_LONGITUDE,
          latitude,
          longitude
        );

        if (distance <= ALLOWED_RADIUS_METERS) {
          await verifyLocationAPI(latitude, longitude);
        } else {
          setLocationVerified(false);
          Alert.alert(
            'Location Error',
            `You are outside the allowed 2km radius. Distance: ${Math.round(
              distance
            )}m`
          );
        }
      } catch (error) {
        console.error('Permission Error:', error);
        Alert.alert('Error', 'Permission request failed');
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
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const verifyLocationAPI = async (latitude, longitude) => {
    try {
      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/verify-location',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId, latitude, longitude }),
        }
      );
      const data = await res.json();
      setLocationVerified(!!data.locationVerified);
      if (!data.locationVerified) Alert.alert('❌ Location not verified');
    } catch (err) {
      console.error('Location Verify Error:', err);
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

      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/verify-face',
        { method: 'POST', body: formData, headers: { Accept: 'application/json' } }
      );

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
      console.error('Face Verify Error:', err);
      setFaceVerified(false);
    } finally {
      setFaceLoading(false);
    }
  };

  const handleOffDuty = async () => {
    if (!locationVerified) {
      return Alert.alert('Location Error', 'You are not in the allowed location.');
    }
    if (!faceVerified || !capturedUrl) {
      return Alert.alert('Face Error', 'Please capture and verify your face first.');
    }

    try {
      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/logout',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminId,
            capturedUrl,
            locationVerified: true,
            faceVerified: true,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessage('✅ Off Duty marked successfully!');
        Alert.alert('Success', data.message || 'Off Duty marked successfully');
      } else {
        setMessage('❌ Failed to mark Off Duty.');
        Alert.alert('Error', data.message || 'Failed to mark Off Duty.');
      }
    } catch (err) {
      console.error('Off Duty API Error:', err);
      setMessage('❌ Error marking Off Duty.');
      Alert.alert('Error', 'Something went wrong while marking Off Duty.');
    }
  };

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
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Off Duty</Text>
        <View style={{ width: 28 }} />
      </View>

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

      <TouchableOpacity style={styles.button} onPress={handleOffDuty}>
        <Text style={styles.buttonText}>Submit Off Duty</Text>
      </TouchableOpacity>

      {message !== '' && <Text style={styles.message}>{message}</Text>}
    </ScrollView>
  );
};

export default AdminOffDutyScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f4f6f8', paddingHorizontal: 20, marginTop: 35, paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  permissionText: { marginTop: 10, fontSize: 16, color: '#ff0000', textAlign: 'center', paddingHorizontal: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 15, borderRadius: 10, backgroundColor: '#fff', elevation: 2 },
  statusText: { fontSize: 16, fontWeight: '600', marginRight: 8, color: '#333' },
  button: { backgroundColor: '#007BFF', padding: 15, marginVertical: 10, borderRadius: 10, alignItems: 'center', elevation: 2 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  previewImage: { width: '100%', height: 300, borderRadius: 10, marginVertical: 10, borderWidth: 1, borderColor: '#ddd' },
  message: { fontSize: 18, textAlign: 'center', color: 'green', marginTop: 15 },
  cameraButtonContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 40 },
  captureButton: { backgroundColor: '#007BFF', padding: 15, borderRadius: 50 },
});
