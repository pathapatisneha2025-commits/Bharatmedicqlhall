import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getEmployeeId } from "../utils/storage";

/* 🔹 Skeleton Loader */
const BookingSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonLineShort} />
    <View style={styles.skeletonLine} />
    <View style={styles.skeletonLine} />
  </View>
);

const EmployeeDailyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  /* History calendar */
  const [historyDate, setHistoryDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const employeeId = await getEmployeeId();

      if (!employeeId) {
        setBookings([]);
        return;
      }

      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/doctorbooking/employee/${employeeId}`
      );

      const data = await response.json();
      setBookings(Array.isArray(data) ? data : data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };
const toLocalDateOnly = (dateStr) => {
  const d = new Date(dateStr);
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).toISOString().split("T")[0];
};


const todayStr = toLocalDateOnly(new Date());

const { todayBookings, todayRevenue } = useMemo(() => {
  const todayList = bookings.filter(
    (b) => toLocalDateOnly(b.appointment_date) === todayStr
  );

  const revenue = todayList.reduce(
    (sum, b) => sum + Number(b.doctor_consultant_fee || 0),
    0
  );

  return {
    todayBookings: todayList.length,
    todayRevenue: revenue,
  };
}, [bookings, todayStr]);

const historyDateStr = toLocalDateOnly(historyDate);

const historyBookings = useMemo(() => {
  return bookings.filter(
    (b) => toLocalDateOnly(b.appointment_date) === historyDateStr
  );
}, [bookings, historyDateStr]);


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>My Bookings</Text>

      {/* 🔷 DASHBOARD CARDS (TODAY ONLY) */}
      <View style={styles.dashboardRow}>
        <View style={[styles.dashboardCard, styles.cardBlue]}>
          <Text style={styles.cardTitle}>Today’s Bookings</Text>
          <Text style={styles.cardValue}>{todayBookings}</Text>
        </View>

        <View style={[styles.dashboardCard, styles.cardGreen]}>
          <Text style={styles.cardTitle}>Today’s Revenue</Text>
          <Text style={styles.cardValue}>₹ {todayRevenue}</Text>
        </View>
      </View>

      {/* 📜 HISTORY SECTION */}
      <Text style={styles.historyTitle}>Booking History</Text>

      {/* 📅 Calendar Filter */}
      <TouchableOpacity
        style={styles.calendarBtn}
        onPress={() => setShowCalendar(true)}
      >
        <Text style={styles.calendarText}>
          📅 {historyDate.toDateString()}
        </Text>
      </TouchableOpacity>

      {showCalendar && (
        <DateTimePicker
          value={historyDate}
          mode="date"
          display="calendar"
          onChange={(event, date) => {
            setShowCalendar(false);
            if (date) setHistoryDate(date);
          }}
        />
      )}

      {/* 🔹 HISTORY LIST */}
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <BookingSkeleton key={i} />
        ))
      ) : historyBookings.length === 0 ? (
        <Text style={styles.noBookings}>No bookings for this date.</Text>
      ) : (
        <FlatList
          data={historyBookings}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.service}>{item.patient_name}</Text>
                <Text style={styles.fee}>
                  ₹{item.doctor_consultant_fee}
                </Text>
              </View>

              <Text style={styles.subText}>
                Doctor: {item.doctor_name}
              </Text>
              <Text style={styles.subText}>
                {new Date(item.appointment_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
};

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },

  /* Dashboard Cards */
  dashboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dashboardCard: {
    width: "48%",
    padding: 16,
    borderRadius: 14,
    elevation: 4,
  },
  cardBlue: {
    backgroundColor: "#4e73df",
  },
  cardGreen: {
    backgroundColor: "#1cc88a",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
  },
  cardValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 6,
  },

  /* History */
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  calendarBtn: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  calendarText: {
    fontWeight: "600",
    fontSize: 14,
  },

  /* Booking Card */
  bookingCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  service: {
    fontWeight: "bold",
    fontSize: 16,
  },
  fee: {
    fontWeight: "bold",
    color: "#1cc88a",
  },
  subText: {
    fontSize: 13,
    color: "#555",
  },

  noBookings: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },

  /* Skeleton */
  skeletonCard: {
    backgroundColor: "#eee",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: "#ddd",
    marginBottom: 8,
    borderRadius: 6,
  },
  skeletonLineShort: {
    height: 12,
    width: "50%",
    backgroundColor: "#ddd",
    marginBottom: 8,
    borderRadius: 6,
  },
});

export default EmployeeDailyBookings;
