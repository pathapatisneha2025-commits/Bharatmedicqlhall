import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const API_BASE = "https://hospitaldatabasemanagement.onrender.com";

export default function DailyTokensReport({ role = "admin", doctorName }) {
  const [allTokens, setAllTokens] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState("All");
  const [dateFilter, setDateFilter] = useState("All"); // Today | All

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedDoctor, dateFilter, allTokens]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/book-appointment/all`);
      const json = await res.json();
      setAllTokens(json || []);
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const today = new Date().toISOString().split("T")[0];

    const filtered = allTokens.filter(t => {
      const apiDate = new Date(t.date).toISOString().split("T")[0];

      const dateMatch =
        dateFilter === "Today" ? apiDate === today : true;

      const doctorMatch =
        role === "admin"
          ? selectedDoctor === "All" || t.doctorname === selectedDoctor
          : t.doctorname === doctorName;

      return dateMatch && doctorMatch;
    });

    setTokens(filtered);
  };

  const getStatus = (status) => {
    if (!status) return "Waiting";
    const s = status.toLowerCase();
    if (s.includes("pending")) return "Waiting";
    if (s.includes("progress")) return "In Consultation";
    if (s.includes("complete")) return "Completed";
    return "Waiting";
  };

  // GROUP Doctor → Date
  const grouped = tokens.reduce((acc, t) => {
    const doctor = t.doctorname || "Unknown Doctor";
    const date = new Date(t.date).toLocaleDateString();
    if (!acc[doctor]) acc[doctor] = {};
    if (!acc[doctor][date]) acc[doctor][date] = [];
    acc[doctor][date].push(t);
    return acc;
  }, {});

  // UNIQUE DOCTORS
  const doctors = ["All", ...new Set(allTokens.map(t => t.doctorname))];

  const downloadCSV = async () => {
    if (!tokens.length) {
      Alert.alert("No data to download");
      return;
    }

    const header = ["Token No", "Doctor", "Patient", "Date", "Status"];
    const rows = tokens.map(t => [
      t.tokenid,
      t.doctorname,
      t.name,
      new Date(t.date).toLocaleDateString(),
      getStatus(t.status),
    ]);

    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");

    const fileUri = `${FileSystem.cacheDirectory}daily_tokens.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv);
    await Sharing.shareAsync(fileUri);
  };

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.title}>Daily Tokens Data</Text>

      {/* DATE FILTER */}
      <View style={styles.filterRow}>
        {["Today", "All"].map(d => (
          <TouchableOpacity
            key={d}
            style={[
              styles.filterBtn,
              dateFilter === d && styles.activeBtn,
            ]}
            onPress={() => setDateFilter(d)}
          >
            <Text style={dateFilter === d ? styles.activeText : styles.text}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DOCTOR FILTER (ADMIN ONLY) */}
      {role === "admin" && (
        <ScrollView
          horizontal
          contentContainerStyle={styles.filterRow}
          showsHorizontalScrollIndicator={false}
        >
          {doctors.map(d => (
            <TouchableOpacity
              key={d}
              style={[
                styles.filterBtn,
                selectedDoctor === d && styles.activeBtn,
              ]}
              onPress={() => setSelectedDoctor(d)}
            >
              <Text
                style={selectedDoctor === d ? styles.activeText : styles.text}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.downloadBtn} onPress={downloadCSV}>
        <Text style={styles.downloadText}>Download CSV</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0a66c2" />}

      {!loading &&
        Object.entries(grouped).map(([doctor, dates]) => (
          <View key={doctor} style={styles.card}>
            <Text style={styles.doctorName}>{doctor}</Text>

            {Object.entries(dates).map(([date, list]) => (
              <View key={date} style={styles.dateBox}>
                <Text style={styles.date}>{date}</Text>

                {list.map((t, i) => (
                  <View key={i} style={styles.row}>
                    <Text style={styles.col}>#{t.tokenid}</Text>
                    <Text style={styles.col}>{t.name}</Text>
                    <Text style={styles.col}>{getStatus(t.status)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f4f8ff",
    padding: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0a66c2",
    textAlign: "center",
    marginBottom: 10,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  filterBtn: {
    borderWidth: 1,
    borderColor: "#0a66c2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeBtn: {
    backgroundColor: "#0a66c2",
  },
  text: {
    color: "#0a66c2",
    fontWeight: "700",
  },
  activeText: {
    color: "#fff",
    fontWeight: "700",
  },

  downloadBtn: {
    alignSelf: "center",
    backgroundColor: "#0a66c2",
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  downloadText: {
    color: "#fff",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  dateBox: {
    backgroundColor: "#eef3ff",
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  date: {
    fontWeight: "700",
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  col: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
  },
});
