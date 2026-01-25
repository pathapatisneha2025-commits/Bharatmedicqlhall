// screens/SetReminderScreen.js

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getEmployeeId } from "../utils/storage";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";

/* ---------------- NOTIFICATION HANDLER ---------------- */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SetReminderScreen = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState(null);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const scheduledIdsRef = useRef([]);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        // ✅ ANDROID ONLY notification channel
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        await ensurePermissions();

        const id = await getEmployeeId();
        setEmployeeId(id);

        const res = await fetch(
          `https://hospitaldatabasemanagement.onrender.com/employee/${id}`
        );
        const data = await res.json();

        if (
          data?.success &&
          data.employee?.schedule_in &&
          data.employee?.schedule_out
        ) {
          const [inH, inM] = data.employee.schedule_in
            .split(":")
            .map(Number);
          const [outH, outM] = data.employee.schedule_out
            .split(":")
            .map(Number);

          const start = new Date();
          start.setHours(inH, inM, 0, 0);

          const end = new Date();
          end.setHours(outH, outM, 0, 0);

          setStartTime(start);
          setEndTime(end);
        }

        const saved = await AsyncStorage.getItem("attendanceScheduledIds");
        scheduledIdsRef.current = saved ? JSON.parse(saved) : [];
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Initialization failed");
      }
    };

    init();

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen;
        if (screen === "Attendance") {
          navigation.navigate("Attendance");
        }
      }
    );

    return () => sub.remove();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const ensurePermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== "granted") {
        Alert.alert("Permission required", "Notifications are disabled");
      }
    }
  };

  const fmtHHMM = (d) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const cancelExistingScheduled = async () => {
    try {
      for (const id of scheduledIdsRef.current) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    } catch {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    scheduledIdsRef.current = [];
    await AsyncStorage.removeItem("attendanceScheduledIds");
  };

  const getTriggerDate = (baseDate, hour, minute) => {
    const d = new Date(baseDate);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const fiveMinutesBefore = (d) => {
    const t = new Date(d);
    t.setMinutes(t.getMinutes() - 5);
    return { hour: t.getHours(), minute: t.getMinutes() };
  };

  /* ---------------- SCHEDULER ---------------- */
const scheduleOneTimeNotifications = async () => {
  const startStr = fmtHHMM(startTime);
  const endStr = fmtHHMM(endTime);
  const now = new Date();

  const startDateTime = new Date(date);
  startDateTime.setHours(
    startTime.getHours(),
    startTime.getMinutes(),
    0,
    0
  );

  const endDateTime = new Date(date);
  endDateTime.setHours(
    endTime.getHours(),
    endTime.getMinutes(),
    0,
    0
  );

  // ⛔ SDK 54 requires future date
  if (startDateTime <= now) {
    throw new Error("Start time must be in the future");
  }

  const earlyStart = new Date(startDateTime);
  earlyStart.setMinutes(earlyStart.getMinutes() - 5);

  const earlyEnd = new Date(endDateTime);
  earlyEnd.setMinutes(earlyEnd.getMinutes() - 5);

  const ids = [];

  // 🔔 5 min before shift start
  ids.push(
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Upcoming Shift ⏰",
        body: `Your shift (${startStr} - ${endStr}) starts in 5 minutes`,
        data: { screen: "Attendance" },
        sound: "default",
        ...(Platform.OS === "android" && { channelId: "default" }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: earlyStart,
      },
    })
  );

  // 🔔 Shift start
  ids.push(
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Shift Started ✅",
        body: `Your shift (${startStr} - ${endStr}) has started`,
        data: { screen: "Attendance" },
        sound: "default",
        ...(Platform.OS === "android" && { channelId: "default" }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: startDateTime,
      },
    })
  );

  // 🔔 End reminders (only if valid)
  if (endDateTime > startDateTime) {
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Shift Ending Soon ⌛",
          body: `Your shift ends at ${endStr}`,
          data: { screen: "Attendance" },
          sound: "default",
          ...(Platform.OS === "android" && { channelId: "default" }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: earlyEnd,
        },
      })
    );

    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Shift Ended 🏁",
          body: "Your shift has ended",
          data: { screen: "Attendance" },
          sound: "default",
          ...(Platform.OS === "android" && { channelId: "default" }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: endDateTime,
        },
      })
    );
  }

  scheduledIdsRef.current = ids;
  await AsyncStorage.setItem(
    "attendanceScheduledIds",
    JSON.stringify(ids)
  );
};


  /* ---------------- SAVE ---------------- */
  const handleSaveReminder = async () => {
    if (!employeeId) {
      Alert.alert("Error", "Employee ID not found");
      return;
    }

    const selectedStart = new Date(date);
    selectedStart.setHours(
      startTime.getHours(),
      startTime.getMinutes(),
      0,
      0
    );

    if (selectedStart <= new Date()) {
      Alert.alert("Invalid Time", "Please select a future time");
      return;
    }

    try {
      setLoading(true);
      await cancelExistingScheduled();
      await scheduleOneTimeNotifications();
      setLoading(false);

      Alert.alert(
        "Success",
        "You will get a reminder 5 minutes before and at shift start time"
      );
    } catch (e) {
      console.error(e);
      setLoading(false);
      Alert.alert("Error", "Failed to set reminder");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} />
      </TouchableOpacity>

      <Text style={styles.title}>Set One-Time Reminder</Text>

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{date.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) setDate(d);
          }}
        />
      )}

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowStartPicker(true)}
      >
        <Text>Start Time: {fmtHHMM(startTime)}</Text>
      </TouchableOpacity>

      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour
          onChange={(e, t) => {
            setShowStartPicker(false);
            if (t) setStartTime(t);
          }}
        />
      )}

      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowEndPicker(true)}
      >
        <Text>End Time: {fmtHHMM(endTime)}</Text>
      </TouchableOpacity>

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour
          onChange={(e, t) => {
            setShowEndPicker(false);
            if (t) setEndTime(t);
          }}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveReminder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Reminder</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default SetReminderScreen;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  backButton: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
  },
  title: {
    marginTop: 60,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
