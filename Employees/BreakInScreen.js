import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
   Platform ,
  ActivityIndicator,
  StatusBar,
        useWindowDimensions,

} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

const BreakScreen = () => {
  const navigation = useNavigation();
 const { width: SCREEN_WIDTH } = useWindowDimensions();
    const MAX_WIDTH = 420; // maximum width for desktop/tablet
    const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
  const [locationVerified, setLocationVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);
  const [message, setMessage] = useState("");
const [breakStartedToday, setBreakStartedToday] = useState(false);

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
  // 🔹 Load employee ID
  useEffect(() => {
    const fetchEmployeeId = async () => {
      const id = await getEmployeeId();
      if (!id) {
        showAlert("Error", "Employee ID not found. Please login again.");
        return;
      }
      setEmployeeId(id);
    };
    fetchEmployeeId();
  }, []);

  // 🔹 Verify location
  useEffect(() => {
    if (employeeId) verifyCurrentLocation(employeeId);
  }, [employeeId]);

  const verifyCurrentLocation = async (id) => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
       showAlert("Permission Denied", "Enable location permission");
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
        await verifyLocationAPI(latitude, longitude, id);
      } else {
        setLocationVerified(false);
        showAlert(
          "Outside Office",
          `You are ${Math.round(distance)} meters away`
        );
      }
    } catch (err) {
      console.error("Location error:", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyLocationAPI = async (latitude, longitude, id) => {
    try {
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/attendance/verify-location",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: id, latitude, longitude }),
        }
      );
      const data = await res.json();
      setLocationVerified(!!data.locationVerified);
    } catch (err) {
      console.error("Verify location API error:", err);
      setLocationVerified(false);
    }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const startBreak = async () => {
    if (!locationVerified) {
      return showAlert("Location Error", "Location not verified");
    }

    try {
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/breaks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId,
            locationVerified: true,
            breakType: "Break In",
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage("🕒 Break Started Successfully");
        showAlert("Success", "Break started");
      } else {
        showAlert("Error", data.message || "Failed to start break");
      }
    } catch (err) {
      console.error("Start break error:", err);
      showAlert("Network Error", "Try again later");
    }
  };
useEffect(() => {
  if (!employeeId) return;

  const checkBreakToday = async () => {
    try {
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/${employeeId}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const today = new Date().toISOString().split('T')[0];

        const breakInToday = data.data.some(record => {
          const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
          return record.break_type === "Break In" && recordDate === today;
        });

        if (breakInToday) {
          setBreakStartedToday(true);
          setMessage("🕒 Break already started today");
        }
      }
    } catch (err) {
      console.error("Error checking break status:", err);
    }
  };

  checkBreakToday();
}, [employeeId]); // ✅ run after employeeId is ready


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Verifying location...</Text>
      </View>
    );
  }


  // if (!permission?.granted) {
  //   return (
  //     <View style={styles.centered}>
  //       <Ionicons name="warning-outline" size={50} color="#ff5252" />
  //       <Text style={styles.permissionText}>Camera permission denied.</Text>
  //       <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
  //         <Text style={styles.buttonText}>Grant Camera Permission</Text>
  //       </TouchableOpacity>
  //     </View>
  //   );
  // }

  // if (showCamera) {
  //   return (
  //     <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
  //       <View style={styles.cameraButtonContainer}>
  //         <TouchableOpacity style={styles.captureButton} onPress={captureImage}>
  //           <Ionicons name="camera" color="#fff" size={24} />
  //           <Text style={{ color: "#fff", marginLeft: 8, fontSize: 16 }}>Capture</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </CameraView>
  //   );
  // }

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View style={[styles.mainWrapper, { width: containerWidth, alignSelf: 'center' }]}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#007BFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Break In Attendance</Text>
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
{/* 
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
      </View> */}

      {/* Actions */}
      {/* <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowCamera(true)}
      >
        <Ionicons name="camera" color="#fff" size={20} />
        <Text style={styles.buttonText}>Open Front Camera</Text>
      </TouchableOpacity>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
      )} */}


     <TouchableOpacity
  style={[
    styles.primaryButton,
    { backgroundColor: breakStartedToday ? "#94d3a2" : "#10b981" },
  ]}
  onPress={startBreak}
  disabled={breakStartedToday} // disables until next day
>
  <Ionicons name="cafe" color="#fff" size={20} />
  <Text style={styles.buttonText}>
    {breakStartedToday ? "Break Already Started" : "Start Break"}
  </Text>
</TouchableOpacity>


      {message !== "" && <Text style={styles.message}>{message}</Text>}
    </View>
    </View>
  );
};

export default BreakScreen;

// same styles as yours
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 20, paddingTop: 35 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 25, justifyContent: "space-between" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1f2937" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6b7280" },
  permissionText: { marginTop: 10, fontSize: 15, color: "#555", textAlign: "center", paddingHorizontal: 25 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { flex: 1, marginLeft: 10, fontSize: 16, color: "#374151", fontWeight: "600" },
  cardStatus: { fontSize: 15, fontWeight: "700" },
  primaryButton: { backgroundColor: "#007BFF", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: 12, marginVertical: 10, elevation: 3 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  previewImage: { width: "100%", height: 300, borderRadius: 14, marginVertical: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  message: { fontSize: 16, textAlign: "center", color: "#059669", marginTop: 15, fontWeight: "600" },
  cameraButtonContainer: { flex: 1, justifyContent: "flex-end", alignItems: "center", marginBottom: 50 },
  captureButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#007BFF", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 3 },
});
