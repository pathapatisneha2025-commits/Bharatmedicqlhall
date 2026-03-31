import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function PatientHistory() {
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allTokens, setAllTokens] = useState([]);
  const [searchText, setSearchText] = useState("");

  const safeFetch = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Fetch failed for ${url}: ${res.status}`);
        return [];
      }
      const data = await res.json();
      return data.data || [];
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      return [];
    }
  };

  const fetchAssignedDoctors = async (nurseId) => {
    setLoadingDoctors(true);
    try {
      const res = await fetch(`${BASE_URL}/doctor/nurse/assigned-doctor/${nurseId}`);
      const data = await res.json();
      if (!data.success || !data.doctors) return [];
      return data.doctors;
    } catch (err) {
      console.error("Error fetching assigned doctors:", err);
      return [];
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchDoctorTokens = async (doctors) => {
    setLoadingTokens(true);
    try {
      let allTokensTemp = [];

      await Promise.all(
        doctors.map(async (doc) => {
          try {
            const safeFetchArray = async (url) => {
              const res = await fetch(url);
              const data = await res.json();
              if (!res.ok) return [];
              return Array.isArray(data) ? data : data.data || [];
            };

            const bookData = await safeFetchArray(`${BASE_URL}/book-appointment/doctor/${doc.id}`);
            const bookingData = await safeFetchArray(`${BASE_URL}/doctorbooking/doctor/${doc.id}`);

            const tokens = [
              ...bookData.map((i) => ({
    id: i.id,
                tokenId: i.tokenid,
                name: i.patient_name || i.name || "Unknown",
                age: i.patient_age || i.age || "-",
                gender: i.patient_gender || i.gender || "-",
                doctor: doc.name || "Unknown",
                date: i.date || "-",
                time: i.timeslot || "",
                status: (i.status || "pending").toLowerCase(),
                    source: "book-appointment", // <-- important

              })),
              ...bookingData.map((i) => ({
    id: i.id,
                tokenId: i.daily_id,
                name: i.patient_name || "Unknown",
                age: i.patient_age || "-",
                gender: i.patient_gender || "-",
                doctor: doc.name || "Unknown",
                date: i.appointment_date || "-",
                time: i.appointment_time || "",
                status: (i.status || "pending").toLowerCase(),
                    source: "doctorbooking", // <-- important

              })),
            ];

            allTokensTemp.push(...tokens);
          } catch (err) {
            console.error(`Error fetching tokens for ${doc.name}:`, err);
          }
        })
      );

      // Sort by date and time
      allTokensTemp.sort((a, b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time));
      setAllTokens(allTokensTemp);
    } catch (err) {
      console.error("Error fetching doctor tokens:", err);
      setAllTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchData = async () => {
    const nurseId = await getEmployeeId();
    if (!nurseId) return;

    const doctors = await fetchAssignedDoctors(nurseId);
    if (doctors.length === 0) {
      setAllTokens([]);
      return;
    }

    await fetchDoctorTokens(doctors);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, []);

 const search = searchText.trim().toLowerCase();

const filteredTokens = allTokens.filter((t) => {
  if (!search) return true;

  // Use word boundaries (\b) to match full words only
  const regex = new RegExp(`\\b${search}\\b`, "i"); // 'i' = case-insensitive

  const doctorMatch = regex.test(t.doctor || "");
  const patientMatch = regex.test(t.name || "");

  return doctorMatch || patientMatch;
});
const handleDateChange = async (token, newDate) => {
  try {
    // Format date as YYYY-MM-DD
    const formattedDate = new Date(newDate).toISOString().split("T")[0];

    // Determine which API and payload based on token source
    let endpoint = "";
    let payload = {};

    if (token.source === "book-appointment") {
      endpoint = `/book-appointment/upcomingvisits/update/${token.id}`;
      payload = { date: formattedDate };
    } else if (token.source === "doctorbooking") {
      endpoint = `/doctorbooking/upcomingvisits/update/${token.id}`;
      payload = { appointment_date: formattedDate };
    } else {
      console.warn("Unknown token type:", token);
      return;
    }

    console.log("Updating:", endpoint, payload);

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      alert("Date updated successfully!");
      fetchData(); // refresh after update
    } else {
      alert("Failed to update date: " + (data.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Error updating date:", err);
    alert("Error updating date");
  }
};
  const loading = loadingDoctors || loadingTokens;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7FA" }}>
      <View style={{ flex: 1, padding: 10 }}>
       <TextInput
  placeholder="Search by doctor or patient name"
  style={styles.searchInput}
  value={searchText}
  onChangeText={setSearchText}
/>

        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" />
        ) : (
          <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.th}>Token</Text>
                <Text style={styles.th}>Patient</Text>
                <Text style={styles.th}>Age</Text>
                <Text style={styles.th}>Gender</Text>
                <Text style={styles.th}>Doctor</Text>
                <Text style={styles.th}>Date</Text>
                <Text style={styles.th}>Time</Text>
                <Text style={styles.th}>Status</Text>
              </View>

              {filteredTokens.map((t) => (
                <View key={t.id} style={styles.tableRow}>
                  <Text style={styles.td}>{t.tokenId}</Text>
                  <Text style={styles.td}>{t.name}</Text>
                  <Text style={styles.td}>{t.age}</Text>
                  <Text style={styles.td}>{t.gender}</Text>
                  <Text style={styles.td}>{t.doctor}</Text>

                  {/* Editable Date */}
                  <div style={{ width: 100 }}>
                    <input
                      type="date"
                      value={t.date && t.date !== "-" ? new Date(t.date).toISOString().split("T")[0] : ""}
                      onChange={(e) => handleDateChange(t, e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>

                 <Text style={[styles.td, styles.tdWithSpace]}>{t.time}</Text>

  <Text
    style={[
      styles.td,
      t.status === "completed" ? { color: "green" } : { color: "orange" },
    ]}
  >
    {t.status}
  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = {
  searchInput: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  table: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingVertical: 5,
  },
  th: { width: 100, fontWeight: "bold", fontSize: 12 },
  td: { width: 100, fontSize: 12 },
  tdWithSpace: { width: 100, fontSize: 12, marginLeft: 10 }, // new style
};