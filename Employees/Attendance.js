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
    useWindowDimensions,

} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmployeeId } from '../utils/storage';

const EmpAttendanceScreen = () => {
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
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [phone, setPhone] = useState(null);

const route = useRoute();
const phoneFromRoute = route.params?.phone || null;

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
  const fetchAttendance = async () => {
    const id = await getEmployeeId();

if (id) {
  setEmployeeId(id);
} else if (phoneFromRoute) {
  setPhone(phoneFromRoute);
} else {
 showAlert('Error', 'No employee ID or phone found');
  return;
}

    setEmployeeId(id);

    try {
      const res = await fetch(`https://hospitaldatabasemanagement.onrender.com/attendance/employee/${id}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const today = new Date().toISOString().split('T')[0];

        // Check if any attendance record is for today
        const hasAttendanceToday = data.data.some(record => {
          const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
          return recordDate === today;
        });

        if (hasAttendanceToday) {
          setAttendanceMarked(true);
          setMessage('✅ Attendance already marked today.');
        }
      }
    } catch (err) {
      console.error('Error fetching last attendance:', err);
    }
  };

  fetchAttendance();
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
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
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
body: JSON.stringify({
  employeeId: employeeId || null,
  phone: phone || null,
  latitude,
  longitude,
}),
          }
      );
      const data = await res.json();
      setLocationVerified(data.locationVerified);
      if (!data.locationVerified) Alert.alert('❌ Location not verified');
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
if (employeeId) {
  formData.append('employeeId', employeeId);
} else {
  formData.append('phone', phone);
}
      formData.append('image', { uri, type: 'image/jpeg', name: 'face.jpg' });

      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/verify-face',
        {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
        }
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

  const checkLateCount = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/attendance/employee/${employeeId}/${year}/${month}`
      );

      const data = await res.json();
      if (data.success) return data.lateCount || 0;
      return 0;
    } catch (err) {
      console.error('Late Count Error:', err);
      return 0;
    }
  };

  const handleSubmit = async () => {
    if (attendanceMarked) return; // safety check
    if (!locationVerified) {
      showAlert('Location Error', 'You are not in the allowed location.');
      return;
    }
    if (!faceVerified || !capturedUrl) {
      showAlert('Face Error', 'Please capture and verify your face first.');
      return;
    }

    try {
      const lateDays = await checkLateCount();

      const res = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/attendance/mark-attendance',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
  employeeId: employeeId || null,
  phone: phone || null,
  capturedUrl,
  locationVerified: true,
  faceVerified: true,
}),

        }
      );
      const data = await res.json();

      if (data.success) {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(`attendance_${employeeId}`, today); // save today
        setAttendanceMarked(true);

        setMessage('✅ Attendance marked successfully!');
        showAlert('Success', data.message || 'Attendance marked successfully');

        if (data.status === 'Late' && lateDays + 1 >= 3) {
          showAlert(
            '⚠️ Final Warning',
            'This late mark has reached your 3 free late limits. Further lateness may result in penalties.'
          );
        }
      } else {
        setMessage('❌ Failed to mark attendance.');
        showAlert('Error', data.message || 'Failed to mark attendance.');
      }
    } catch (err) {
      console.error('Mark Attendance Error:', err);
      setMessage('❌ Error marking attendance.');
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
        <Ionicons name="warning-outline" size={50} color="#ff5252" />
        <Text style={styles.permissionText}>
          Camera permission denied. Please enable it in settings.
        </Text>
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
            <Text style={{ color: "#fff", marginLeft: 8, fontSize: 16 }}>Capture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View style={[styles.mainWrapper, { width: containerWidth, alignSelf: 'center' }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={26} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Status Cards */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Ionicons
            name={locationVerified ? "location" : "location-outline"}
            size={28}
            color={locationVerified ? "#2ecc71" : "#FF0000"}
          />
          <Text style={styles.cardLabel}>GPS Location</Text>
          <Text
            style={[
              styles.cardStatus,
              { color: locationVerified ? "#2ecc71" : "#FF0000" },
            ]}
          >
            {locationVerified ? "Verified" : "Not Verified"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Ionicons
            name={faceVerified ? "happy" : "sad-outline"}
            size={28}
            color={faceVerified ? "#2ecc71" : "#FF0000"}
          />
          <Text style={styles.cardLabel}>Face Verification</Text>
          <Text
            style={[
              styles.cardStatus,
              { color: faceVerified ? "#2ecc71" : "#FF0000" },
            ]}
          >
            {faceLoading ? "Verifying..." : faceVerified ? "Verified" : "Not Verified"}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowCamera(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" color="#fff" size={20} />
        <Text style={styles.buttonText}>Open Front Camera</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: attendanceMarked ? "#94d3a2" : "#10b981" },
        ]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={attendanceMarked}
      >
        <Ionicons name="checkmark-circle" color="#fff" size={20} />
        <Text style={styles.buttonText}>
          {attendanceMarked ? "Attendance Marked" : "Submit Attendance"}
        </Text>
      </TouchableOpacity>

      {message !== "" && <Text style={styles.message}>{message}</Text>}
    </View>
    </View>
  );
};

export default EmpAttendanceScreen;

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 20,
    paddingTop: 35,
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6b7280" },
  permissionText: {
    marginTop: 10,
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 25,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  cardStatus: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#007BFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#059669",
    marginTop: 15,
    fontWeight: "600",
  },
  cameraButtonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 50,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 3,
  },
});
