// screens/SetReminderScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmployeeId } from '../utils/storage';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

// Foreground notification behavior
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

  useEffect(() => {
  const init = async () => {
    try {
      const id = await getEmployeeId();
      const employee_id = id ;
      setEmployeeId(employee_id);

      await ensurePermissions();

      // ✅ Fetch employee data by ID instead of /all
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/employee/${employee_id}`
      );
      const data = await res.json();

      if (data.success && data.employee) {
        const emp = data.employee;

        // Extract schedule_in and schedule_out
        const [inH, inM] = emp.schedule_in.split(":").map(Number);
        const [outH, outM] = emp.schedule_out.split(":").map(Number);

        const now = new Date();
        const start = new Date(now);
        start.setHours(inH, inM, 0, 0);

        const end = new Date(now);
        end.setHours(outH, outM, 0, 0);

        setStartTime(start);
        setEndTime(end);
      } else {
        Alert.alert("Error", "Unable to fetch employee schedule.");
      }

      const saved = await AsyncStorage.getItem("attendanceScheduledIds");
      scheduledIdsRef.current = saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error("Error fetching employee schedule:", err);
      Alert.alert("Error", "Failed to fetch employee schedule.");
    }
  };

  init();

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen;
    if (screen === "Attendance") {
      navigation.navigate("Attendance");
    }
  });

  return () => sub.remove();
}, []);


  const ensurePermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Permission required', 'Notification permission is not granted.');
    }
  };

  const cancelExistingScheduled = async () => {
    try {
      for (const id of scheduledIdsRef.current) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    } catch (e) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    scheduledIdsRef.current = [];
    await AsyncStorage.removeItem('attendanceScheduledIds');
  };

  const fmtHHMM = (d) =>
    d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const getNextTriggerDate = (hour, minute) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1); // tomorrow if already passed
    }
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

  const scheduleOneTimeNotifications = async (startTime, endTime) => {
    const startStr = fmtHHMM(startTime);
    const endStr = fmtHHMM(endTime);

    const early = fiveMinutesBefore(startTime);
    const main = { hour: startTime.getHours(), minute: startTime.getMinutes() };

    const earlyTrigger = getNextTriggerDate(early.hour, early.minute);
    const mainTrigger = getNextTriggerDate(main.hour, main.minute);

    // Schedule "5 min before"
    const earlyId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Shift Reminder',
        body: `Your shift (${startStr} - ${endStr}) starts soon. Time to get ready!`,
        sound: 'default',
        data: { screen: 'Attendance', kind: 'early' },
      },
      trigger: earlyTrigger,
    });

    // Schedule "at start time"
    const mainId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Shift Started',
        body: `Your shift has started (${startStr} - ${endStr}). Please login now.`,
        sound: 'default',
        data: { screen: 'Attendance', kind: 'main' },
      },
      trigger: mainTrigger,
    });

    scheduledIdsRef.current = [earlyId, mainId];
    await AsyncStorage.setItem(
      'attendanceScheduledIds',
      JSON.stringify(scheduledIdsRef.current)
    );
  };

  const handleSaveReminder = async () => {
    if (!employeeId) {
      Alert.alert('Error', 'Employee ID not found.');
      return;
    }

    const reminderData = {
      employeeId,
      date: date.toLocaleDateString('en-CA'),
      startTime: fmtHHMM(startTime),
      endTime: fmtHHMM(endTime),
    };

    try {
      setLoading(true);
      await cancelExistingScheduled();
      await AsyncStorage.setItem('reminders', JSON.stringify([reminderData]));
      await scheduleOneTimeNotifications(startTime, endTime);

      setLoading(false);
      Alert.alert(
        'Success',
        `Reminder set for ${reminderData.startTime} - ${reminderData.endTime}.\nYou will get a notification 5 minutes before and at the start time.`
      );
      navigation.navigate('ReminderListScreen');
    } catch (error) {
      console.error(error);
      setLoading(false);
      Alert.alert('Error', 'Failed to save reminder.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Set One-Time Reminder</Text>

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{date.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
        <Text>Start Time: {fmtHHMM(startTime)}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedTime) => {
            setShowStartPicker(false);
            if (selectedTime) setStartTime(selectedTime);
          }}
        />
      )}

      <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
        <Text>End Time: {fmtHHMM(endTime)}</Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedTime) => {
            setShowEndPicker(false);
            if (selectedTime) setEndTime(selectedTime);
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
          <Text style={styles.buttonText}>Save One-Time Reminder</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default SetReminderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 35,
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 50, // extra spacing for back button
    textAlign: 'center',
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
