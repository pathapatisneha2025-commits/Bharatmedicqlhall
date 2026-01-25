import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
          BackHandler,


} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const feeFilters = ["All", "0-500", "500-1000", "1000+"];

export default function DoctorAppointmentScreen() {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [selectedFee, setSelectedFee] = useState("All");
  const [doctorsData, setDoctorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState(["All"]);

  const navigation = useNavigation();

  // ✅ FIXED – MERGING BOTH APIS
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const doctorRes = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/doctor/all"
      );
      const doctors = await doctorRes.json();

      const feeRes = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/doctorconsultancefee/all"
      );
      const fees = await feeRes.json();

      // Merge using doctor.id === doctor_id
      const merged = doctors.map((doc) => {
        const feeRecord = fees.find((f) => f.doctor_id === doc.id);
        return {
          ...doc,
          consultance_fee: feeRecord ? feeRecord.fees : 0, // default if missing
        };
      });

      setDoctorsData(merged);

      // Build department list
      const deptList = [
        "All",
        ...new Set(merged.map((doc) => doc.department).filter(Boolean)),
      ];
      setDepartments(deptList);
    } catch (error) {
      console.log("Error merging data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filterByFee = (fee) => {
    const consultationFee = parseFloat(fee);
    if (selectedFee === "All") return true;
    if (selectedFee === "0-500") return consultationFee <= 500;
    if (selectedFee === "500-1000") return consultationFee > 500 && consultationFee <= 1000;
    if (selectedFee === "1000+") return consultationFee > 1000;
    return true;
  };

  // UPDATED: API uses "name" not "doctor_name"
  const filteredDoctors = doctorsData.filter((doctor) => {
    const matchesDepartment =
      selectedDepartment === "All" || doctor.department === selectedDepartment;

    const matchesSearch =
      doctor.name.toLowerCase().includes(searchText.toLowerCase()) ||
      doctor.department.toLowerCase().includes(searchText.toLowerCase());

    return matchesDepartment && matchesSearch && filterByFee(doctor.consultance_fee);
  });
  useEffect(() => {
        const backAction = () => {
          // Instead of going back step by step, reset navigation to Sidebar/Home
          navigation.reset({
            index: 0,
            routes: [{ name: "bottomtab" }], // <-- replace with your sidebar/home screen name
          });
          return true; // prevents default back behavior
        };
      
        const backHandler = BackHandler.addEventListener(
          "hardwareBackPress",
          backAction
        );
      
        return () => backHandler.remove(); // clean up on unmount
      }, []);
  const renderDoctor = ({ item }) => {
    const initials = item.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
 if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );

    return (
      <View style={styles.doctorCard}>
        <LinearGradient
          colors={["#F5F9FF", "#FFFFFF"]}
          style={styles.gradientCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.doctorInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialty}>{item.department}</Text>

            <Text style={styles.fee}>₹{item.consultance_fee} Consultation Fee</Text>

            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => navigation.navigate("doctordetail", { id: item.id })}
            >
              <LinearGradient
                colors={["#4A90E2", "#0D47A1"]}
                style={styles.bookGradient}
              >
                <Text style={styles.bookText}>Book Appointment</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#E3F2FD", "#FFFFFF"]}
      style={[styles.container, { paddingTop: Platform.OS === "ios" ? 50 : 16 }]}
    >
      {/* Header */}
      <LinearGradient colors={["#4A90E2", "#0D47A1"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Doctors</Text>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search by name or department"
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
      </View>

      {/* Department Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Select Department:</Text>
        <LinearGradient colors={["#F5F9FF", "#FFFFFF"]} style={styles.pickerBox}>
          <Picker
            selectedValue={selectedDepartment}
            onValueChange={(value) => setSelectedDepartment(value)}
            style={styles.picker}
            dropdownIconColor="#0D47A1"
          >
            {departments.map((dept) => (
              <Picker.Item key={dept} label={dept} value={dept} />
            ))}
          </Picker>
        </LinearGradient>
      </View>

      {/* Fee Filters */}
      <View style={styles.filterContainer}>
        {feeFilters.map((fee) => (
          <TouchableOpacity
            key={fee}
            style={[styles.filterChip, selectedFee === fee && styles.activeFilter]}
            onPress={() => setSelectedFee(fee)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFee === fee && styles.activeFilterText,
              ]}
            >
              {fee === "All" ? "All Fees" : `₹${fee}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 40 }} />
      ) : filteredDoctors.length > 0 ? (
        <FlatList
          data={filteredDoctors}
          renderItem={renderDoctor}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.noResult}>
          <Ionicons name="sad-outline" size={40} color="#0D47A1" />
          <Text style={styles.noResultText}>No doctors found.</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 36,
    paddingBottom: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 12,
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#000",
    fontSize: 14,
  },
  dropdownContainer: { marginBottom: 12 },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0D47A1",
    marginBottom: 6,
  },
  pickerBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CDE2F5",
    overflow: "hidden",
    height: 60,
    justifyContent: "center",
    marginBottom: 12,
  },
  picker: {
    height: Platform.OS === "android" ? 60 : 50,
    width: "100%",
    color: "#0D47A1",
  },
  filterContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 24,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#007BFF33",
  },
  filterText: { fontSize: 12, color: "#007BFF", fontWeight: "500" },
  activeFilter: {
    backgroundColor: "#FF7043",
    borderColor: "#E64A19",
  },
  activeFilterText: { color: "#fff", fontWeight: "bold" },
  doctorCard: {
    borderRadius: 18,
    marginBottom: 14,
    elevation: 3,
  },
  gradientCard: { borderRadius: 18, padding: 16, flexDirection: "row" },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  doctorInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold", color: "#0D47A1" },
  specialty: { fontSize: 14, color: "#555" },
  fee: { fontSize: 13, color: "#0D47A1", fontWeight: "600", marginTop: 6 },
  bookBtn: { marginTop: 10 },
  bookGradient: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  bookText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  noResult: { alignItems: "center", marginTop: 40 },
  noResultText: { color: "#555", fontSize: 16, marginTop: 8 },
});
