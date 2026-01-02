// NotificationScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getEmployeeId } from '../utils/storage'; // AsyncStorage helper

// Updated API Endpoint
const BASE_API = 'https://hospitalmanagement-gfgx.onrender.com/notifications';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);
  const navigation = useNavigation();
  const notificationListener = useRef();
  const responseListener = useRef();

  // --- Push Notification Config ---
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  useEffect(() => {
    const fetchEmployeeIdAndNotifications = async () => {
      setLoading(true);
      try {
        const id = await getEmployeeId();
        if (!id) {
          Alert.alert('Error', 'Employee ID not found. Please log in again.');
          setLoading(false);
          return;
        }
        setEmployeeId(id);

        // Register for Push Notifications
        const token = await registerForPushNotificationsAsync();
        console.log('Expo Push Token:', token);

        // Send push token to your backend to map with employee
        if (token) {
          await fetch(`${BASE_API}/register-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: id, pushToken: token }),
          });
        }

        await fetchNotifications(id);
      } catch (error) {
        console.error('Error loading employee ID or notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeIdAndNotifications();

    // Foreground listener
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
        const newNotif = {
          id: Date.now().toString(),
          message: notification.request.content.body,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
      });

    // When user taps on notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = async (id) => {
    try {
      const url = `${BASE_API}/${id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.log('Fetch Error:', await response.text());
        return;
      }

      const data = await response.json();
      console.log('Fetched notifications:', data.notifications);
      if (data.notifications && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Fetch Notifications Error:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!employeeId) {
      Alert.alert('Error', 'Employee ID not found.');
      return;
    }

    try {
      const deleteUrl = `${BASE_API}/${employeeId}/notification/${notificationId}`;
      console.log('Deleting notification:', deleteUrl);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        console.log('Delete Error:', errorMsg);
        Alert.alert('Delete Failed', errorMsg);
        return;
      }

      // Optimistic UI update
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId && notif._id !== notificationId)
      );
    } catch (error) {
      console.error('Delete Notification Error:', error);
      Alert.alert('Error', 'Unable to delete notification. Please try again.');
    }
  };

  // Swipeable Delete Button
  const renderRightActions = (itemId) => (
    <RectButton style={styles.deleteBtn} onPress={() => deleteNotification(itemId)}>
      <Ionicons name="trash" size={24} color="#fff" />
    </RectButton>
  );

  // Render each notification
  const renderItem = ({ item }) => {
    const notificationId = item.id || item._id;
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(notificationId)}
        overshootRight={false}
      >
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity onPress={() => deleteNotification(notificationId)}>
            <Ionicons name="trash" size={22} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Ionicons
          name="arrow-back"
          size={24}
          color="#000"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.header}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : notifications.length === 0 ? (
        <Text style={styles.noData}>No notifications found.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => (item.id || item._id).toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

// --- Register Push Notifications ---
async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    Alert.alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    marginRight: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#777',
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 10,
    marginVertical: 8,
  },
  noData: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});
