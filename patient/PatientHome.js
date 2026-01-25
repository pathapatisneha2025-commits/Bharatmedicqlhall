import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const MEDICINE_API = "https://hospitaldatabasemanagement.onrender.com/medicine/all";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingMedicines, setLoadingMedicines] = useState(true);

  const scrollX = useRef(new Animated.Value(0)).current;

  // --- Fetch Medicines ---
  const fetchMedicines = async () => {
    try {
      const res = await fetch(MEDICINE_API);
      const data = await res.json();
      setMedicines(data);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoadingMedicines(false);
    }
  };

  // --- Fetch Doctors + Fees in parallel ---
  const fetchDoctors = async () => {
    try {
      const [doctorRes, feeRes] = await Promise.all([
        fetch("https://hospitaldatabasemanagement.onrender.com/doctor/all"),
        fetch("https://hospitaldatabasemanagement.onrender.com/doctorconsultancefee/all"),
      ]);

      const doctorsList = await doctorRes.json();
      const feesList = await feeRes.json();

      const mergedData = doctorsList.map(doc => {
        const feeRecord = feesList.find(f => f.doctor_email === doc.email);
        return { ...doc, consultance_fee: feeRecord ? feeRecord.fees : 0 };
      });

      setDoctors(mergedData);
    } catch (error) {
      console.error("Error merging doctors:", error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // --- Load data on mount ---
  useEffect(() => {
    fetchMedicines();
    fetchDoctors();
  }, []);

  // --- Continuous doctor scroll animation ---
  useEffect(() => {
    if (!loadingDoctors && doctors.length > 0) {
      const loopAnimation = () => {
        scrollX.setValue(0);
        Animated.timing(scrollX, {
          toValue: -doctors.length * 190, // adjust based on card width + margin
          duration: 20000,
          useNativeDriver: true,
        }).start(() => loopAnimation());
      };
      loopAnimation();
    }
  }, [loadingDoctors, doctors]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Bharat Medical Hall</Text>
        <TouchableOpacity onPress={() => navigation.navigate("shoppingcart")}>
          <Icon name="cart-outline" size={28} color="#2E86C1" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Icon name="search-outline" size={20} color="#777" />
        <TextInput
          placeholder="Search doctors, medicines..."
          placeholderTextColor="#999"
          style={styles.searchInput}
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {[
          { title: "Book Appointment", icon: "calendar-outline", screen: "DoctorScreen" },
          { title: "Order Medicine", icon: "medkit-outline", screen: "MedicineScreen" },
          { title: "My Orders", icon: "bag-handle-outline", screen: "Orders" },
        ].map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.actionBox}
            onPress={() => navigation.navigate(action.screen)}
          >
            <View style={styles.actionIconWrapper}>
              <Icon name={action.icon} size={24} color="#2E86C1" />
            </View>
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Doctors Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Doctors Booking</Text>
        <TouchableOpacity onPress={() => navigation.navigate("DoctorScreen")}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {loadingDoctors ? (
        <ActivityIndicator size="small" color="#2E86C1" />
      ) : (
        <View style={{ overflow: "hidden", height: 230 }}>
          <Animated.View
            style={{
              flexDirection: "row",
              transform: [{ translateX: scrollX }],
            }}
          >
            {[...doctors, ...doctors].map((doctor, idx) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.speciality}>
                  {doctor.department} - {doctor.role}
                </Text>
                <Text style={styles.fee}>₹{doctor.consultance_fee}</Text>
                <Text style={styles.experience}>{doctor.experience} yrs experience</Text>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => navigation.navigate("DoctorScreen", { doctor })}
                >
                  <Text style={styles.btnText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        </View>
      )}

      {/* Medicines Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Medicines</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Medicines")}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {loadingMedicines ? (
        <ActivityIndicator size="small" color="#2E86C1" />
      ) : (
        <FlatList
          horizontal
          data={medicines}
          keyExtractor={item => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.medicineCard}>
              <Image source={{ uri: item.images[0] }} style={styles.medicineImg} />
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.medicineCategory}>{item.category}</Text>
              <Text style={styles.medicinePrice}>₹{item.price}</Text>
              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => navigation.navigate("Medicines", { medicine: item })}
              >
                <Text style={styles.buyText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Health Offers */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health Offers</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={[
          { title: "Free Health Checkup", desc: "50+ tests included", color: "#E8F6F3", screen: "DoctorScreen" },
          { title: "Medicine Discounts", desc: "Up to 20% off", color: "#EBF5FB", screen: "Medicines" },
          { title: "Doctor Consultation", desc: "Flat ₹100 off", color: "#FDEDEC", screen: "DoctorScreen" },
        ]}
        keyExtractor={(_, idx) => idx.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.offerCard, { backgroundColor: item.color }]}
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
            <Text style={styles.offerTitle}>{item.title}</Text>
            <Text style={styles.offerDesc}>{item.desc}</Text>
            <View style={styles.learnBtn}>
              <Text style={styles.learnText}>Learn More</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
};

// --- Styles remain mostly the same ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FBFD", padding: 15, marginTop: 20 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  appName: { fontSize: 22, fontWeight: "700", color: "#2E86C1", letterSpacing: 0.5 },

  searchBox: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", elevation: 3, marginBottom: 15 },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 14, color: "#333" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A5276" },
  viewAll: { color: "#2E86C1", fontWeight: "600", fontSize: 13 },

  quickActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 10 },
  actionBox: { backgroundColor: "#fff", width: "48%", borderRadius: 14, paddingVertical: 20, alignItems: "center", marginVertical: 6, elevation: 3 },
  actionIconWrapper: { backgroundColor: "#EAF2FD", padding: 12, borderRadius: 50, marginBottom: 8 },
  actionText: { fontSize: 13, fontWeight: "600", color: "#333", textAlign: "center" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginRight: 14, alignItems: "center", elevation: 4, width: 180, borderWidth: 1, borderColor: "#D6EAF8" },
  doctorName: { fontWeight: "700", fontSize: 15, color: "#1E3A8A" },
  speciality: { fontSize: 12.5, color: "#555", marginTop: 4, textAlign: "center" },
  fee: { color: "#1A5276", fontWeight: "bold", fontSize: 14, marginTop: 6 },
  experience: { fontSize: 12, color: "#777" },
  btn: { backgroundColor: "#003366", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, marginTop: 10 },
  btnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  medicineCard: { backgroundColor: "#fff", borderRadius: 16, padding: 12, marginRight: 12, alignItems: "center", elevation: 4, width: 150 },
  medicineImg: { width: 80, height: 80, borderRadius: 10 },
  medicineName: { fontWeight: "700", marginTop: 6, textAlign: "center", color: "#2E86C1" },
  medicineCategory: { fontSize: 12, color: "#777" },
  medicinePrice: { fontWeight: "bold", color: "#1A5276", marginTop: 4 },
  buyBtn: { marginTop: 8, backgroundColor: "#28B463", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  buyText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  offersScroll: { marginTop: 10 },
  offerCard: { borderRadius: 16, padding: 15, marginRight: 12, elevation: 3, width: 220 },
  offerTitle: { fontSize: 16, fontWeight: "700", color: "#1A5276" },
  offerDesc: { fontSize: 13, color: "#333", marginVertical: 5 },
  learnBtn: { backgroundColor: "#2E86C1", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, alignSelf: "flex-start" },
  learnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});

export default HomeScreen;
