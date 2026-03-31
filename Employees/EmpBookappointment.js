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
  Platform,
  TextInput,
  useWindowDimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function DoctorsListScreen() {
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [count, setCount] = useState(0);
  const [searchText, setSearchText] = useState("");

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 768;
  const containerWidth = isDesktop ? 1000 : SCREEN_WIDTH - 20;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCount((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const fetchDoctors = async () => {
    try {
      const doctorRes = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/doctor/all"
      );
      const doctorsList = await doctorRes.json();

      const feeRes = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/doctorconsultancefee/all"
      );
      const feesList = await feeRes.json();

      const mergedData = doctorsList.map(doc => {
        const feeRecord = feesList.find(f => f.doctor_email === doc.email);
        return {
          ...doc,
          consultance_fee: feeRecord ? feeRecord.fees : 0,
        };
      });

      setDoctors(mergedData);
      setFilteredDoctors(mergedData); // initialize filtered list
    } catch (error) {
      showAlert("Error", "Failed to load doctors list.");
      console.error("API Merge Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle search filter
  const handleSearch = (text) => {
    setSearchText(text);
    if (text === "") {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doc =>
        doc.name.toLowerCase().includes(text.toLowerCase()) ||
        (doc.department?.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredDoctors(filtered);
    }
  };

  const renderDoctor = ({ item }) => (
    <View style={styles.doctorListItem}>
      <View style={styles.itemBadge}>
        <Text style={styles.badgeText}>{item.department?.toUpperCase() || 'GENERAL'}</Text>
      </View>
      <View style={styles.itemBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>Dr. {item.name}</Text>
          <Text style={styles.subtext}>{item.role} • {item.experience} yrs exp</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Fee</Text>
          <Text style={styles.feeValue}>₹{item.consultance_fee}</Text>
        </View>
      </View>
      <View style={styles.itemFooter}>
        <Text style={styles.footerInfo}>Available for Consultation</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate("Patientbookingappointment", { doctor: item })}
        >
          <Text style={styles.actionButtonText}>Book Now</Text>
          <Ionicons name="chevron-forward" size={14} color="#0D6EFD" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0D6EFD" />
        <Text style={styles.loaderText}>Loading doctors... {count}s</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.mainWrapper, { width: isDesktop ? 1000 : '100%', alignSelf: 'center' }]}>
        {/* TOP NAV */}
        <View style={styles.topNav}>
          <View>
            <Text style={styles.pageTitle}>Doctors List</Text>
            <Text style={styles.pageSubtitle}>Schedule a consultation with our experts</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Dashboard")} style={styles.iconBtn}>
            <Ionicons name="close-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={{ marginLeft: 10 }} />
          <TextInput
            placeholder="Search by name or department..."
            value={searchText}
            onChangeText={handleSearch}
            style={styles.searchInput}
          />
        </View>

        {/* LIST SECTION */}
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderDoctor}
          ListHeaderComponent={<Text style={styles.sectionTitle}>All Specialists</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No doctors available.</Text>}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  mainWrapper: { flex: 1 },
  topNav: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
    paddingHorizontal: 24, paddingTop: 50, paddingBottom: 20, backgroundColor: '#fff' 
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A" },
  pageSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f0f0f0' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15 },
  searchContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    borderRadius: 12, marginHorizontal: 20, marginBottom: 16, 
    paddingVertical: 8, borderWidth: 1, borderColor: '#ddd'
  },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, color: '#333' , outlineStyle: "none", },
  doctorListItem: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, 
    borderWidth: 1, borderColor: '#F0F0F0' 
  },
  itemBadge: { 
    backgroundColor: '#F0F7FF', alignSelf: 'flex-start', paddingHorizontal: 8, 
    paddingVertical: 4, borderRadius: 4, marginBottom: 12 
  },
  badgeText: { color: '#0D6EFD', fontSize: 10, fontWeight: '800' },
  itemBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  doctorName: { fontSize: 17, fontWeight: '700', color: '#333' },
  subtext: { fontSize: 13, color: '#666', marginTop: 2 },
  description: { fontSize: 13, color: '#888', marginTop: 8, lineHeight: 18 },
  feeContainer: { alignItems: 'flex-end' },
  feeLabel: { fontSize: 11, color: '#999', fontWeight: '600' },
  feeValue: { fontSize: 16, fontWeight: '700', color: '#28A745' },
  itemFooter: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 15 
  },
  footerInfo: { fontSize: 12, color: '#999' },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionButtonText: { color: '#0D6EFD', fontWeight: '700', fontSize: 14, marginRight: 4 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loaderText: { fontSize: 15, color: "#666", marginTop: 12 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40 },
});