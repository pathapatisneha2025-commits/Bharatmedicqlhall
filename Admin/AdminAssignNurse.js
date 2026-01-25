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
  const [selectedDoctors, setSelectedDoctors] = useState([]); // <-- array now
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

  // Toggle doctor selection
  const toggleDoctor = (doctor) => {
    if (selectedDoctors.find((d) => d.id === doctor.id)) {
      setSelectedDoctors(selectedDoctors.filter((d) => d.id !== doctor.id));
    } else {
      setSelectedDoctors([...selectedDoctors, doctor]);
    }
  };

  // Assign doctors API
  const assignDoctors = async () => {
    if (!selectedNurse || selectedDoctors.length === 0) {
      Alert.alert("Missing Selection", "Please select a nurse and at least one doctor.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/doctor/assign-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nurseId: selectedNurse.id,
          doctorIds: selectedDoctors.map((d) => d.id), // send array
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", "Doctors assigned to nurse successfully.");
        setSelectedNurse(null);
        setSelectedDoctors([]);
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
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Assign Doctors to Nurse</Text>

      {/* Nurse Selection */}
      <Text style={styles.sectionTitle}>Select Nurse</Text>
      {nurses.map((nurse) => (
        <TouchableOpacity
          key={nurse.id}
          style={[styles.itemBox, selectedNurse?.id === nurse.id && styles.selectedBox]}
          onPress={() => setSelectedNurse(nurse)}
        >
          <Ionicons name="woman-outline" size={20} color="#555" />
          <Text style={styles.itemText}>{nurse.full_name}</Text>
        </TouchableOpacity>
      ))}

      {/* Doctors Selection */}
      <Text style={styles.sectionTitle}>Select Doctors</Text>
      {doctors.map((doctor) => {
        const isSelected = selectedDoctors.find((d) => d.id === doctor.id);
        return (
          <TouchableOpacity
            key={doctor.id}
            style={[styles.itemBox, isSelected && styles.selectedBox]}
            onPress={() => toggleDoctor(doctor)}
          >
            <Ionicons name="medkit-outline" size={20} color="#555" />
            <Text style={styles.itemText}>{doctor.name}</Text>
            {isSelected && <Ionicons name="checkmark-circle" size={20} color="#4a90e2" style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        );
      })}

      {/* Assign Button */}
      <TouchableOpacity
        style={styles.assignButton}
        onPress={assignDoctors}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.assignButtonText}>Assign Doctors</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f8f9fa" },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 25, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20 },
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
  selectedBox: { borderColor: "#4a90e2", backgroundColor: "#e8f2ff" },
  itemText: { marginLeft: 10, fontSize: 16 },
  assignButton: { backgroundColor: "#4a90e2", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 30 },
  assignButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
