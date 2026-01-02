import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getPatientId } from "../utils/storage"; // ✅ Fetch patient ID from AsyncStorage

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const PatientAppointmentsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [patientId, setPatientId] = useState(null);

  // ✅ Load patient ID from AsyncStorage
  useEffect(() => {
    const loadPatientId = async () => {
      try {
        const storedId = await getPatientId();
        if (storedId) {
          console.log("✅ Loaded Patient ID:", storedId);
          setPatientId(storedId);
        } else {
          Alert.alert("Session Expired", "Please log in again.");
          setLoading(false);
        }
      } catch (error) {
        console.log("❌ Error loading patient ID:", error);
        setLoading(false);
      }
    };
    loadPatientId();
  }, []);

  // ✅ Fetch appointments for this patient
  const fetchAppointments = async () => {
    if (!patientId) {
      console.log("⚠️ Patient ID not available yet");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/book-appointment/patient/${patientId}`
      );

      console.log(
        "🌐 Fetching:",
        `${BASE_URL}/book-appointment/patient/${patientId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ API Error:", errorText);
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      console.log("✅ API Response:", JSON.stringify(data, null, 2));

      if (data && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.log("❌ Fetch Error:", error);
      Alert.alert("Error", "Unable to load appointments. Please try again.");
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Re-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (patientId) {
        fetchAppointments();
      }
    }, [patientId])
  );

  // ✅ Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // ✅ Loading Spinner
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // ✅ No appointments found
  if (!appointments || appointments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <TouchableOpacity onPress={fetchAppointments} style={styles.retryButton}>
          <Text style={{ color: "#007bff", fontSize: 16 }}>
            No appointments found. Tap to refresh 🔄
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Appointment card
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.doctor}>{item.doctorname}</Text>
      <Text style={styles.speciality}>{item.department}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>
          {new Date(item.date).toLocaleDateString("en-IN")}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Time:</Text>
        <Text style={styles.value}>{item.timeslot}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fee:</Text>
        <Text style={styles.value}>₹{item.consultantfees}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Payment:</Text>
        <Text
          style={[
            styles.value,
            {
              color:
                item.paymentstatus.toLowerCase() === "paid"
                  ? "green"
                  : "red",
            },
          ]}
        >
          {item.paymentstatus}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <Text
          style={[
            styles.value,
            {
              color:
                item.status?.toLowerCase() === "pending"
                  ? "#ff9800"
                  : "green",
            },
          ]}
        >
          {item.status || "N/A"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Token ID:</Text>
        <Text style={[styles.value, { fontWeight: "bold", color: "#2e7d32" }]}>
          {item.tokenid || "N/A"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Appointment ID:</Text>
        <Text style={[styles.value, { fontWeight: "bold", color: "#004aad" }]}>
          {item.id}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      {/* Appointment List */}
      <FlatList
        data={appointments}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

export default PatientAppointmentsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  retryButton: { padding: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    elevation: 3,
    marginBottom: 5,
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#007bff" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  doctor: { fontSize: 16, fontWeight: "bold", color: "#004aad" },
  speciality: { fontSize: 14, color: "#555", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  label: { fontSize: 14, fontWeight: "500", color: "#333" },
  value: { fontSize: 14, color: "#444" },
});
