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
import { useNavigation } from "@react-navigation/native"; // <-- import hook

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminDoctorTokenScreen() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
const navigation = useNavigation();

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [numberOfVisits, setNumberOfVisits] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");

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

  const handleEdit = (item) => {
    const doctor = doctors.find((d) => d.email === item.doctor_email);
    if (doctor) setSelectedDoctor(doctor);
    setDoctorEmail(item.doctor_email);
    setNumberOfVisits(item.number_of_visits_per_day.toString());
    setEditingId(item.id);
  };

  const handleSearch = () => {
    const filtered = bookings.filter(
      (b) =>
        b.doctor_name.toLowerCase().includes(searchText.toLowerCase()) ||
        b.doctor_email.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredBookings(filtered);
  };
   if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading doctor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
<View style={styles.header}>
 <TouchableOpacity
      onPress={() => navigation.navigate("AdminDashboard")} // navigate to AdminSidebar
      style={styles.backButton}
    >          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Token Booking</Text>
      </View>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={{ marginLeft: 10 }} />
        <TextInput
          placeholder="Search by name or email"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Doctor Picker */}
        <Text style={styles.label}>Select Doctor</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons name="medkit-outline" size={20} color="#777" style={{ marginLeft: 10 }} />
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
        </View>

        {/* Doctor Email */}
        <View style={styles.inputWithIcon}>
          <Ionicons name="mail-outline" size={20} color="#777" style={{ marginLeft: 10 }} />
          <TextInput
            placeholder="Doctor Email"
            value={doctorEmail}
            onChangeText={setDoctorEmail}
            style={styles.inputFlex}
          />
        </View>

        {/* Number of Visits */}
        <View style={styles.inputWithIcon}>
          <Ionicons name="calendar-outline" size={20} color="#777" style={{ marginLeft: 10 }} />
          <TextInput
            placeholder="Number of Visits per Day"
            value={numberOfVisits}
            onChangeText={setNumberOfVisits}
            keyboardType="numeric"
            style={styles.inputFlex}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {editingId ? "Update Booking" : "Add Booking"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id.toString()}
          style={{ marginTop: 20 }}
          renderItem={({ item }) => (
            <View style={styles.bookingItem}>
              <View>
                <Text style={styles.bookingText}>{item.doctor_name}</Text>
                <Text style={styles.bookingSubText}>{item.doctor_email}</Text>
                <Text style={styles.bookingSubText}>Visits per day: {item.number_of_visits_per_day}</Text>
              </View>
              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={24} color="orange" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={{ marginLeft: 15 }}
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
  container: { flex: 1, padding: 20, backgroundColor: "#f0f3f7" ,marginTop: 30},
   header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  backButton: { marginRight: 10 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    marginBottom: 15,
    height: 45,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#1E88E5",
    padding: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  form: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 3,
  },
  label: { fontWeight: "700", marginBottom: 5, fontSize: 14, color: "#333" },
  pickerContainer: {
    flex: 1,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
  },
  inputFlex: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  button: {
    backgroundColor: "#1E88E5",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  bookingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
  },
  bookingText: { fontWeight: "700", fontSize: 16, color: "#333" },
  bookingSubText: { fontSize: 13, color: "#555" },
  iconContainer: { flexDirection: "row", alignItems: "center" },
});
