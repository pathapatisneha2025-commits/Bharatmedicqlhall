import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DoctorTokenBookingScreen() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Form states
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [numberOfVisits, setNumberOfVisits] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Fetch all bookings
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/doctorbookingtoken/all`);
      const data = await res.json();
      setBookings(data);
      setFilteredBookings(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all doctors
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctor/all`);
      const data = await res.json();
      setDoctors(data);
      if (!selectedDoctor && data.length > 0) {
        setSelectedDoctor(data[0]);
        setDoctorEmail(data[0].email);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch doctors");
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchDoctors();
  }, []);

  // Add or Update booking
  const handleSubmit = async () => {
    if (!selectedDoctor || !doctorEmail || !numberOfVisits) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    const payload = {
      doctor_email: doctorEmail,
      doctor_name: selectedDoctor.name,
      number_of_visits_per_day: Number(numberOfVisits),
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${BASE_URL}/doctorbookingtoken/update/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BASE_URL}/doctorbookingtoken/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      Alert.alert("Success", data.message);
      resetForm();
      fetchBookings();
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  const resetForm = () => {
    setSelectedDoctor(doctors.length > 0 ? doctors[0] : null);
    setDoctorEmail(doctors.length > 0 ? doctors[0].email : "");
    setNumberOfVisits("");
    setEditingId(null);
  };

  // Delete booking
  const handleDelete = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this booking?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/doctorbookingtoken/${id}`, {
              method: "DELETE",
            });
            const data = await res.json();
            Alert.alert("Success", data.message);
            fetchBookings();
          } catch (error) {
            Alert.alert("Error", "Failed to delete booking");
          }
        },
      },
    ]);
  };

  // Edit booking
  const handleEdit = (item) => {
    const doctor = doctors.find((d) => d.email === item.doctor_email);
    if (doctor) setSelectedDoctor(doctor);
    setDoctorEmail(item.doctor_email);
    setNumberOfVisits(item.number_of_visits_per_day.toString());
    setEditingId(item.id);
  };

  // Search bookings
  const handleSearch = () => {
    const filtered = bookings.filter(
      (b) =>
        b.doctor_name.toLowerCase().includes(searchText.toLowerCase()) ||
        b.doctor_email.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredBookings(filtered);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
    <Icon name="arrow-back" size={26} color="#000" />
  </TouchableOpacity>
    
      <Text style={styles.heading}>Doctor Token Booking</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by name or email"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Select Doctor</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDoctor ? selectedDoctor.email : ""}
            onValueChange={(itemValue) => {
              const doctor = doctors.find((d) => d.email === itemValue);
              setSelectedDoctor(doctor);
              if (doctor) setDoctorEmail(doctor.email);
            }}
          >
            {doctors.map((doctor) => (
              <Picker.Item key={doctor.id} label={doctor.name} value={doctor.email} />
            ))}
          </Picker>
        </View>

        <TextInput
          placeholder="Doctor Email"
          value={doctorEmail}
          onChangeText={setDoctorEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Number of Visits per Day"
          value={numberOfVisits}
          onChangeText={setNumberOfVisits}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {editingId ? "Update Booking" : "Add Booking"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id.toString()}
          style={{ marginTop: 20 }}
          renderItem={({ item }) => (
            <View style={styles.bookingItem}>
              <View>
                <Text style={styles.bookingText}>
                  {item.doctor_name} 
                </Text>
                  <Text style={styles.bookingText}>
                  ({item.doctor_email})
                </Text>
                <Text>Visits per day: {item.number_of_visits_per_day}</Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={24} color="orange" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  heading: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  searchContainer: { flexDirection: "row", marginBottom: 15 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  searchButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    marginLeft: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  form: { backgroundColor: "#fff", padding: 15, borderRadius: 8, elevation: 3 },
  label: { fontWeight: "bold", marginBottom: 5 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  bookingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  bookingText: { fontWeight: "bold", fontSize: 16 },
  iconContainer: { flexDirection: "row", alignItems: "center" },
});
