import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function DoctorsListScreen() {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

 const fetchDoctors = async () => {
  try {
    // Fetch doctors list
    const doctorRes = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/doctor/all"
    );
    const doctorsList = await doctorRes.json();

    // Fetch doctor fees
    const feeRes = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/doctorconsultancefee/all"
    );
    const feesList = await feeRes.json();

    // Merge based on email
    const mergedData = doctorsList.map(doc => {
      const feeRecord = feesList.find(f => f.doctor_email === doc.email);
      return {
        ...doc,
        consultance_fee: feeRecord ? feeRecord.fees : 0,
      };
    });

    setDoctors(mergedData);
  } catch (error) {
    Alert.alert("Error", "Failed to load doctors list.");
    console.error("API Merge Error:", error);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchDoctors();
  }, []);

  const renderDoctor = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>👨‍⚕️ {item.name}</Text>
        <Text style={styles.detail}>🏥 Department: {item.department}</Text>
        <Text style={styles.detail}>🎓 Role: {item.role}</Text>
        <Text style={styles.detail}>📅 Experience: {item.experience} yrs</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.fee}>💰 Consultation Fee: ₹{item.consultance_fee}</Text>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() =>
            navigation.navigate("Patientbookingappointment", { doctor: item })
          }
        >
          <Text style={styles.bookButtonText}> Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00bcd4" />
        <Text style={{ marginTop: 10, color: "#555", fontSize: 16 }}>
          Loading doctors...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F8FF" />

      {/* 🔙 Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#0077B6" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Doctors List</Text>
      </View>

      {/* 📌 Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}> Booking Appointment for Patients</Text>
        <Text style={styles.subtitle}>
          Select your preferred doctor and schedule a consultation easily.
        </Text>
      </View>

      {/* 👨‍⚕️ Doctors List */}
      <FlatList
        data={doctors}
        keyExtractor={(item, index) =>
          item.id ? item.id.toString() : index.toString()
        }
        renderItem={renderDoctor}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No doctors available.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FCFF", marginTop: 15 },

  // 🔙 Top Bar with Back Button
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#E8F8FF",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0077B6",
  },

  // Header Section
  header: {
    backgroundColor: "#E8F8FF",
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0077B6",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginTop: 8,
  },

  // Doctor Card
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  info: { flex: 1 },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0C3B5D",
    marginBottom: 6,
  },
  detail: {
    fontSize: 15,
    color: "#444",
    marginTop: 3,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    fontStyle: "italic",
    lineHeight: 20,
  },
  fee: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00bcd4",
    marginTop: 10,
  },

  // Book Button
  bookButton: {
    backgroundColor: "#00bcd4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00bcd4",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Loading & Empty States
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FCFF",
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 30,
    fontSize: 16,
  },
});
