import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEmployeeId } from "../utils/storage";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";

// Set up notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BreakTimeScheduler = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState(null);
  const [breakIn, setBreakIn] = useState(new Date());
  const [breakOut, setBreakOut] = useState(new Date());
  const [showBreakIn, setShowBreakIn] = useState(false);
  const [showBreakOut, setShowBreakOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const scheduledIdsRef = useRef([]);

  useEffect(() => {
    const init = async () => {
      try {
        const id = await getEmployeeId();
        if (!id) return;
        setEmployeeId(id);
        await ensurePermissions();

        // Fetch employee break schedule from backend
        const res = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/employee/${id}`
        );
        const data = await res.json();

        if (data.success && data.employee) {
          const emp = data.employee;
          if (emp.break_in && emp.break_out) {
            const [inH, inM] = emp.break_in.split(":").map(Number);
            const [outH, outM] = emp.break_out.split(":").map(Number);

            const now = new Date();
            const bIn = new Date(now);
            bIn.setHours(inH, inM, 0, 0);
            const bOut = new Date(now);
            bOut.setHours(outH, outM, 0, 0);

            setBreakIn(bIn);
            setBreakOut(bOut);
          }
        }

        const saved = await AsyncStorage.getItem("breakScheduledIds");
        scheduledIdsRef.current = saved ? JSON.parse(saved) : [];
      } catch (err) {
        console.error("Error fetching break schedule:", err);
      }
    };

    init();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === "BreakScreen") {
        navigation.navigate("BreakScreen");
      }
    });

    return () => sub.remove();
  }, []);

  const ensurePermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        Alert.alert("Permission required", "Please enable notifications.");
      }
    }
  };

  const cancelExistingScheduled = async () => {
    try {
      for (const id of scheduledIdsRef.current) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    } catch {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    scheduledIdsRef.current = [];
    await AsyncStorage.removeItem("breakScheduledIds");
  };

  const fmtHHMM = (d) =>
    d.toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" });

  const getNextTriggerDate = (hour, minute) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  };

  const fiveMinutesBefore = (d) => {
    let hour = d.getHours();
    let minute = d.getMinutes() - 5;
    if (minute < 0) {
      minute += 60;
      hour = (hour - 1 + 24) % 24;
    }
    return { hour, minute };
  };

  const scheduleBreakNotifications = async (breakInTime, breakOutTime) => {
    const inStr = fmtHHMM(breakInTime);
    const outStr = fmtHHMM(breakOutTime);

    const inEarly = fiveMinutesBefore(breakInTime);
    const outEarly = fiveMinutesBefore(breakOutTime);

    const inEarlyTrigger = getNextTriggerDate(inEarly.hour, inEarly.minute);
    const inTrigger = getNextTriggerDate(breakInTime.getHours(), breakInTime.getMinutes());
    const outEarlyTrigger = getNextTriggerDate(outEarly.hour, outEarly.minute);
    const outTrigger = getNextTriggerDate(breakOutTime.getHours(), breakOutTime.getMinutes());

    const notifications = [];

    // Before Break In
    notifications.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Break Starting Soon 🍴",
          body: `Your break starts at ${inStr}`,
          data: { screen: "BreakScreen" },
        },
        trigger: inEarlyTrigger,
      })
    );

    // At Break In
    notifications.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Break Time!",
          body: `Time to take your break (${inStr} - ${outStr}).`,
          data: { screen: "BreakScreen" },
        },
        trigger: inTrigger,
      })
    );
    

    // Before Break Out
    notifications.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Break Ending Soon ⏳",
          body: `Your break ends at ${outStr}`,
          data: { screen: "BreakScreen" },
        },
        trigger: outEarlyTrigger,
      })
    );

    // At Break Out
    notifications.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Break Over ✅",
          body: "Break time is over. Please resume work.",
          data: { screen: "BreakScreen" },
        },
        trigger: outTrigger,
      })
    );

    scheduledIdsRef.current = notifications;
    await AsyncStorage.setItem("breakScheduledIds", JSON.stringify(notifications));
  };

  const handleSave = async () => {
    if (!employeeId) {
      Alert.alert("Error", "Employee ID not found.");
      return;
    }

    try {
      setLoading(true);
      await cancelExistingScheduled();
      await scheduleBreakNotifications(breakIn, breakOut);
      setLoading(false);

      Alert.alert("Success", "Break reminders have been set successfully!");
      navigation.navigate("DashboardScreen");
    } catch (err) {
      console.error(err);
      setLoading(false);
      Alert.alert("Error", "Failed to schedule break reminders.");
    }
  };
  if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Set Break Time Reminders</Text>

      <TouchableOpacity onPress={() => setShowBreakIn(true)} style={styles.input}>
        <Text>Break In: {fmtHHMM(breakIn)}</Text>
      </TouchableOpacity>
      {showBreakIn && (
        <DateTimePicker
          value={breakIn}
          mode="time"
          is24Hour={true}
          onChange={(e, time) => {
            setShowBreakIn(false);
            if (time) setBreakIn(time);
          }}
        />
      )}

      <TouchableOpacity onPress={() => setShowBreakOut(true)} style={styles.input}>
        <Text>Break Out: {fmtHHMM(breakOut)}</Text>
      </TouchableOpacity>
      {showBreakOut && (
        <DateTimePicker
          value={breakOut}
          mode="time"
          is24Hour={true}
          onChange={(e, time) => {
            setShowBreakOut(false);
            if (time) setBreakOut(time);
          }}
        />
      )}


      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#1e90ff" }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Save Break Reminders</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default BreakTimeScheduler;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backButton: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 10,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 50,
    textAlign: "center",
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
