// screens/ReminderListScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ReminderListScreen = ({ navigation }) => {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchReminders = async () => {
      let savedReminders = await AsyncStorage.getItem('reminders');
      savedReminders = savedReminders ? JSON.parse(savedReminders) : [];
      setReminders(savedReminders);
      await scheduleNotifications(savedReminders);
    };

    const unsubscribe = navigation.addListener('focus', fetchReminders);
    return unsubscribe;
  }, [navigation]);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      Alert.alert('Error', 'Push notifications only work on a physical device.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Push notification permissions are required.');
      return false;
    }

    return true;
  };

  const scheduleNotifications = async (reminderList) => {
    const permissionGranted = await registerForPushNotificationsAsync();
    if (!permissionGranted) return;

    await Notifications.cancelAllScheduledNotificationsAsync(); // avoid duplicates

    for (const reminder of reminderList) {
      const notificationTime = new Date(reminder.date);
      const [hour, minute] = reminder.startTime.split(':').map(Number);
      notificationTime.setHours(hour);
      notificationTime.setMinutes(minute);
      notificationTime.setSeconds(0);

      const delayInSeconds = Math.floor((notificationTime.getTime() - Date.now()) / 1000);

      if (delayInSeconds > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Reminder',
            body: `Reminder for ${reminder.startTime} - ${reminder.endTime}`,
            sound: true,
          },
          trigger: { seconds: delayInSeconds },
        });
      }
    }
  };

  const clearReminders = async () => {
    await AsyncStorage.removeItem('reminders');
    setReminders([]);
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert('Cleared', 'All reminders have been deleted.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Reminders</Text>
      {reminders.length === 0 ? (
        <Text style={styles.empty}>No reminders saved.</Text>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.text}>Date: {item.date}</Text>
              <Text style={styles.text}>Time: {item.startTime} - {item.endTime}</Text>
              <Text style={styles.text}>Employee ID: {item.employeeId}</Text>
            </View>
          )}
        />
      )}
      <TouchableOpacity style={styles.clearButton} onPress={clearReminders}>
        <Text style={styles.clearText}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReminderListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  empty: { textAlign: 'center', fontSize: 16, marginTop: 20, color: '#777' },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  text: { fontSize: 16 },
  clearButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  clearText: { color: '#fff', fontWeight: 'bold' },
});
