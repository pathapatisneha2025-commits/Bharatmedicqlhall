import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { getDoctorId ,clearStorage} from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function DoctorUpdateScreen() {
  const navigation = useNavigation();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [scheduleIn, setScheduleIn] = useState("");
  const [scheduleOut, setScheduleOut] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [showPickerIn, setShowPickerIn] = useState(false);
  const [showPickerOut, setShowPickerOut] = useState(false);
  const [tempTimeIn, setTempTimeIn] = useState(new Date());
  const [tempTimeOut, setTempTimeOut] = useState(new Date());

  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const doctorId = await getDoctorId();
        if (!doctorId) throw new Error("Doctor ID not found");

        const response = await fetch(`${BASE_URL}/doctor/${doctorId}`);
        const data = await response.json();

        if (response.ok) {
          setDoctor(data);
          setName(data.name);
          setEmail(data.email);
          setPhoneNumber(data.phone_number);
          setDepartment(data.department);
          setScheduleIn(data.schedule_in);
          setScheduleOut(data.schedule_out);
        } else {
          Alert.alert("Error", data.message || "Failed to fetch doctor info");
        }
      } catch (err) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, []);

  const handleUpdate = async () => {
    if (!name || !email || !phoneNumber || !department) {
      Alert.alert("Validation Error", "All fields are required!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/doctor/update/${doctor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          department,
          scheduleIn,
          scheduleOut,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", data.message);
        setModalVisible(false);
        navigation.goBack();
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch (error) {
      Alert.alert("Network Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
const handleLogout = async () => {
    await clearStorage();
    navigation.reset({
      index: 0,
      routes: [{ name: "SelectRole" }],
    });
  };
  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1E88E5" />;

  if (!doctor) return <Text style={{ textAlign: "center", marginTop: 20 }}>Doctor not found</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#1E88E5" />
      </TouchableOpacity>

      <Text style={styles.title}>Doctor Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={22} color="#1E88E5" />
          <Text style={styles.profileValue}>{name}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={22} color="#1E88E5" />
          <Text style={styles.profileValue}>{email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business" size={22} color="#1E88E5" />
          <Text style={styles.profileValue}>{department}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={22} color="#1E88E5" />
          <Text style={styles.profileValue}>In: {scheduleIn}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={22} color="#1E88E5" />
          <Text style={styles.profileValue}>Out: {scheduleOut}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="create" size={22} color="#fff" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    {/* ✅ Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Doctor Details</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color="#1E88E5" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#1E88E5" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="call" size={20} color="#1E88E5" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="business" size={20} color="#1E88E5" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Department" value={department} onChangeText={setDepartment} />
              </View>

              <TouchableOpacity style={styles.timeButton} onPress={() => setShowPickerIn(true)}>
                <Ionicons name="time" size={20} color="#1E88E5" />
                <Text style={styles.timeText}>Schedule In: {scheduleIn || "Select Time"}</Text>
              </TouchableOpacity>
              {showPickerIn && (
                <DateTimePicker
                  value={tempTimeIn}
                  mode="time"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowPickerIn(Platform.OS === "ios");
                    if (selectedDate) {
                      setTempTimeIn(selectedDate);
                      setScheduleIn(formatTime(selectedDate));
                    }
                  }}
                />
              )}

              <TouchableOpacity style={styles.timeButton} onPress={() => setShowPickerOut(true)}>
                <Ionicons name="time-outline" size={20} color="#1E88E5" />
                <Text style={styles.timeText}>Schedule Out: {scheduleOut || "Select Time"}</Text>
              </TouchableOpacity>
              {showPickerOut && (
                <DateTimePicker
                  value={tempTimeOut}
                  mode="time"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowPickerOut(Platform.OS === "ios");
                    if (selectedDate) {
                      setTempTimeOut(selectedDate);
                      setScheduleOut(formatTime(selectedDate));
                    }
                  }}
                />
              )}

              <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>Update</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F0F4F8",
    flexGrow: 1,
  },
  backButton: { marginBottom: 15 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E88E5",
    textAlign: "center",
    marginBottom: 25,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E88E5",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 25,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "92%",
    padding: 22,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E88E5",
    textAlign: "center",
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: "#F7F9FB",
    borderWidth: 1,
    borderColor: "#E1E5EA",
    borderRadius: 12,
    paddingLeft: 40,
    paddingVertical: 12,
    fontSize: 16,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  timeText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  updateButton: {
    backgroundColor: "#1E88E5",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#E53935",
    fontSize: 16,
    fontWeight: "600",
  },
   logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 25,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
