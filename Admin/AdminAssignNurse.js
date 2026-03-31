import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
   useWindowDimensions,
  Platform,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminAssignDoctorScreen() {
  const [nurses, setNurses] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [selectedDoctors, setSelectedDoctors] = useState([]); // <-- array now
  const [loading, setLoading] = useState(false);
            const [loadingCount, setLoadingCount] = useState(0);
            const navigation = useNavigation();
            
const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };  

  useEffect(() => {
            let interval;
            if (loading) {
              setLoadingCount(0);
              interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
            } else clearInterval(interval);
            return () => clearInterval(interval);
          }, [loading]);
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
     showAlert("Missing Selection", "Please select a nurse and at least one doctor.");
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
        showAlert("Success", "Doctors assigned to nurse successfully.");
        setSelectedNurse(null);
        setSelectedDoctors([]);
      } else {
       showAlert("Error", data.message || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      showAlert("Error", "Network error");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading{loadingCount}s</Text>
      </View>
    );
  }

 return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.headerArea}>
        <TouchableOpacity style={styles.circleBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Assign Nurse</Text>
          <Text style={styles.headerSub}>Manage doctor-nurse pairing</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Nurse</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{nurses.length} Available</Text>
          </View>
        </View>

        {nurses.map((nurse) => (
          <TouchableOpacity
            key={nurse.id}
            activeOpacity={0.7}
            style={[styles.itemBox, selectedNurse?.id === nurse.id && styles.selectedBox]}
            onPress={() => setSelectedNurse(nurse)}
          >
            <View style={[styles.avatar, selectedNurse?.id === nurse.id && styles.selectedAvatar]}>
              <Ionicons name="person" size={18} color={selectedNurse?.id === nurse.id ? "#2563eb" : "#94a3b8"} />
            </View>
            <Text style={[styles.itemText, selectedNurse?.id === nurse.id && styles.selectedText]}>
              {nurse.full_name}
            </Text>
            {selectedNurse?.id === nurse.id && (
              <Ionicons name="radio-button-on" size={20} color="#2563eb" style={{ marginLeft: "auto" }} />
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Select Doctors</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{selectedDoctors.length} Selected</Text>
          </View>
        </View>

        {doctors.map((doctor) => {
          const isSelected = selectedDoctors.find((d) => d.id === doctor.id);
          return (
            <TouchableOpacity
              key={doctor.id}
              activeOpacity={0.7}
              style={[styles.itemBox, isSelected && styles.selectedBoxDoctor]}
              onPress={() => toggleDoctor(doctor)}
            >
              <View style={[styles.avatar, isSelected && styles.selectedAvatarDoctor]}>
                <Ionicons name="medical" size={18} color={isSelected ? "#1e293b" : "#94a3b8"} />
              </View>
              <Text style={[styles.itemText, isSelected && styles.selectedTextDoctor]}>
                {doctor.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkbox" size={22} color="#1e293b" style={{ marginLeft: "auto" }} />
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.assignButton} onPress={assignDoctors} disabled={loading}>
          <Text style={styles.assignButtonText}>Finalize Assignment</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  headerArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 40,
    paddingBottom: 20,
    gap: 15,
  },
  circleBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  headerSub: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 40 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", textTransform: "uppercase", letterSpacing: 0.5 },
  countBadge: { backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countText: { fontSize: 11, fontWeight: "700", color: "#64748b" },

  itemBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  selectedBox: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  selectedBoxDoctor: { borderColor: "#1e293b", backgroundColor: "#f8fafc" },
  
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  selectedAvatar: { backgroundColor: "#dbeafe" },
  selectedAvatarDoctor: { backgroundColor: "#e2e8f0" },
  
  itemText: { marginLeft: 12, fontSize: 15, fontWeight: "600", color: "#475569" },
  selectedText: { color: "#1d4ed8", fontWeight: "700" },
  selectedTextDoctor: { color: "#1e293b", fontWeight: "700" },

  assignButton: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    gap: 10,
    elevation: 4,
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  assignButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loaderCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderText: { marginTop: 15, color: "#64748b", fontWeight: "500" },
});