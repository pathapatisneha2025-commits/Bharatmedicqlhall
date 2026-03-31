import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  BackHandler,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const [doctorRes, feeRes] = await Promise.all([
        fetch("https://hospitaldatabasemanagement.onrender.com/doctor/all"),
        fetch("https://hospitaldatabasemanagement.onrender.com/doctorconsultancefee/all"),
      ]);

      const doctors = await doctorRes.json();
      const fees = await feeRes.json();

      const feeMap = {};
      fees.forEach((f) => { feeMap[f.doctor_email] = f.fees; });

      const merged = doctors.map((doc) => ({
        ...doc,
        consultance_fee: feeMap[doc.email] ?? 0,
        experience: doc.experience || Math.floor(Math.random() * 15) + 2,
        rating: "4.9",
        reviews: "120"
      }));

      setDoctorsData(merged);
      const deptList = ["All", ...new Set(merged.map((d) => d.department).filter(Boolean))];
      setDepartments(deptList);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const filteredDoctors = useMemo(() => {
    return doctorsData.filter((doctor) => {
      const name = doctor.name ?? "";
      const dept = doctor.department ?? "";
      const matchesDept = selectedDepartment === "All" || dept === selectedDepartment;
      const matchesSearch = name.toLowerCase().includes(searchText.toLowerCase()) || 
                            dept.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesFee = true;
      const fee = doctor.consultance_fee;
      if (selectedFee === "0-500") matchesFee = fee <= 500;
      else if (selectedFee === "500-1000") matchesFee = fee > 500 && fee <= 1000;
      else if (selectedFee === "1000+") matchesFee = fee > 1000;

      return matchesDept && matchesSearch && matchesFee;
    });
  }, [doctorsData, selectedDepartment, searchText, selectedFee]);

  const renderDoctor = ({ item }) => (
    <View style={[styles.doctorCard, isDesktop && { width: '48%' }]}>
      <View style={styles.cardTop}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </Text>
          <View style={styles.onlineIndicator} />
        </View>
        <View style={styles.mainInfo}>
          <Text style={styles.nameText}>{item.name}</Text>
          <View style={styles.deptBadge}>
            <Text style={styles.deptBadgeText}>{item.department}</Text>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceLabel}>Fee</Text>
          <Text style={styles.priceValue}>₹{item.consultance_fee}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBottom}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="briefcase-outline" size={16} color="#64748B" />
            <Text style={styles.metaText}>{item.experience} Yrs Exp</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.metaText}>{item.rating} ({item.reviews})</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookActionBtn}
          onPress={() => navigation.navigate("doctordetail", { id: item.id })}
        >
          <Text style={styles.bookActionText}>Book Appointment</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* PROFESSIONAL HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Find a Specialist</Text>
          <Text style={styles.headerSubTitle}>{filteredDoctors.length} doctors available</Text>
        </View>
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.email}
        renderItem={renderDoctor}
        numColumns={isDesktop ? 2 : 1}
        columnWrapperStyle={isDesktop ? { justifyContent: 'space-between' } : null}
        ListHeaderComponent={
          <View style={styles.filterSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search by name, specialty..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.pickerRow}>
              <View style={[styles.pickerWrapper, { flex: 1.5 }]}>
                <Picker
                  selectedValue={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  style={styles.pickerStyle}
                >
                  {departments.map(dept => <Picker.Item key={dept} label={dept} value={dept} fontSize={14}/>)}
                </Picker>
              </View>
              <View style={[styles.pickerWrapper, { flex: 1 }]}>
                <Picker
                  selectedValue={selectedFee}
                  onValueChange={setSelectedFee}
                  style={styles.pickerStyle}
                >
                  {feeFilters.map(fee => <Picker.Item key={fee} label={fee === "All" ? "Price" : `₹${fee}`} value={fee} fontSize={14}/>)}
                </Picker>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No specialists match your criteria</Text>
            </View>
          )
        }
      />

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  headerSubTitle: { fontSize: 14, color: "#64748B", fontWeight: '500' },
  
  filterSection: { padding: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 15
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1E293B',outlineStyle: "none" },
  pickerRow: { flexDirection: 'row', gap: 12 },
  pickerWrapper: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center'
  },
  pickerStyle: { height: 50, width: '100%' },

  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { 
    width: 65, height: 65, borderRadius: 20, backgroundColor: '#EFF6FF', 
    justifyContent: 'center', alignItems: 'center', position: 'relative' 
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#3B82F6' },
  onlineIndicator: { 
    position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, 
    borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' 
  },
  mainInfo: { flex: 1, marginLeft: 15 },
  nameText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  deptBadge: { 
    alignSelf: 'flex-start', backgroundColor: '#F1F5F9', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 5 
  },
  deptBadgeText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  priceTag: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#10B981' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  bookActionBtn: { 
    backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, gap: 5 
  },
  bookActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  loaderOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)' }
});