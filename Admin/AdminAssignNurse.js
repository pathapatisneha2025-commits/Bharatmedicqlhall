import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminAssignDoctorScreen() {
  const [nurses, setNurses] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch nurses
  const fetchNurses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctor/employees/nurses`);
      const data = await res.json();
      setNurses(data);
    } catch (err) {
      console.log("Error loading nurses:", err);
    }
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctor/employees/doctors`);
      const data = await res.json();
      setDoctors(data);
    } catch (err) {
      console.log("Error loading doctors:", err);
    }
  };

  useEffect(() => {
    fetchNurses();
    fetchDoctors();
  }, []);

  // Assign doctor API
  const assignDoctor = async () => {
    if (!selectedNurse || !selectedDoctor) {
      Alert.alert("Missing Selection", "Please select both nurse and doctor.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/doctor/assign-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nurseId: selectedNurse.id,
          doctorId: selectedDoctor.id,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", "Doctor assigned to nurse successfully.");
        setSelectedDoctor(null);
        setSelectedNurse(null);
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Network error");
    }
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading Nurse...</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Assign Doctor to Nurse</Text>

      {/* Nurse Selection */}
      <Text style={styles.sectionTitle}>Select Nurse</Text>
      {nurses.map((nurse) => (
        <TouchableOpacity
          key={nurse.id}
          style={[
            styles.itemBox,
            selectedNurse?.id === nurse.id && styles.selectedBox,
          ]}
          onPress={() => setSelectedNurse(nurse)}
        >
          <Ionicons name="woman-outline" size={20} color="#555" />
          <Text style={styles.itemText}>{nurse.full_name}</Text>
        </TouchableOpacity>
      ))}

      {/* Doctor Selection */}
      <Text style={styles.sectionTitle}>Select Doctor</Text>
      {doctors.map((doctor) => (
        <TouchableOpacity
          key={doctor.id}
          style={[
            styles.itemBox,
            selectedDoctor?.id === doctor.id && styles.selectedBox,
          ]}
          onPress={() => setSelectedDoctor(doctor)}
        >
          <Ionicons name="medkit-outline" size={20} color="#555" />
          <Text style={styles.itemText}>{doctor.name} ({doctor.name})</Text>
        </TouchableOpacity>
      ))}

      {/* Button */}
      <TouchableOpacity
        style={styles.assignButton}
        onPress={assignDoctor}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.assignButtonText}>Assign Doctor</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 25,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  itemBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedBox: {
    borderColor: "#4a90e2",
    backgroundColor: "#e8f2ff",
  },
  itemText: {
    marginLeft: 10,
    fontSize: 16,
  },
  assignButton: {
    backgroundColor: "#4a90e2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
