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
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getEmployeeId } from '../utils/storage';

const BASE_API = 'https://hospitaldatabasemanagement.onrender.com/notifications';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);

  const navigation = useNavigation();
  const notificationListener = useRef();
  const responseListener = useRef();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find(b => b.style !== 'cancel');
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const id = await getEmployeeId();
        if (!id) {
          showAlert('Error', 'Employee ID not found. Please log in again.');
          return;
        }
        setEmployeeId(id);

        if (Platform.OS !== 'web') {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await fetch(`${BASE_API}/register-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employeeId: id, pushToken: token }),
            });
          }
        }

        await fetchNotifications(id);
      } catch (err) {
        console.error('Init Error:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        const newNotif = {
          id: Date.now().toString(),
          message: notification.request.content.body || 'No message',
          created_at: new Date().toISOString(),
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      async response => {
        if (employeeId) await fetchNotifications(employeeId);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [employeeId]);

  const fetchNotifications = async id => {
    try {
      const res = await fetch(`${BASE_API}/${id}`);
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.notifications)) setNotifications(data.notifications);
      else setNotifications([]);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    }
  };

  const deleteNotification = async notificationId => {
    if (!employeeId) return;
    try {
      const res = await fetch(
        `${BASE_API}/${employeeId}/notification/${notificationId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setNotifications(prev =>
          prev.filter(n => (n.id || n._id) !== notificationId)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderItem = ({ item }) => {
    const notificationId = item.id || item._id;
    return (
      <View style={styles.notificationCard}>
        <View style={styles.iconContainer}>
          <View style={styles.bellCircle}>
            <Ionicons name="notifications" size={20} color="#2563eb" />
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.messageText}>{item.message ?? 'New system notification'}</Text>
          <Text style={styles.timeText}>
            {item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => deleteNotification(notificationId)}
        >
          <Feather name="trash-2" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* DESKTOP HEADER */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
          </TouchableOpacity>
          <View style={{ marginLeft: 16 }}>
            <Text style={styles.breadcrumb}>DASHBOARD / ALERTS</Text>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.countText}>{notifications.length} Total Alerts</Text>
          {notifications.length > 0 && (
             <TouchableOpacity style={styles.clearBtn} onPress={() => {/* logic to clear all */}}>
                <Text style={styles.clearText}>Mark all as read</Text>
             </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CONTENT AREA */}
      <View style={styles.contentArea}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Fetching updates...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerBox}>
            <View style={styles.emptyIllustration}>
              <Feather name="inbox" size={60} color="#e2e8f0" />
            </View>
            <Text style={styles.noDataTitle}>All caught up!</Text>
            <Text style={styles.noDataSub}>You don't have any new notifications at the moment.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item, index) => (item.id || item._id || index).toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

// --- Push Notification registration ---
async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }
  return token;
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#f8fafc" },
  
  // Header Bar
  headerBar: {
    height: 80,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  breadcrumb: { fontSize: 10, color: "#94a3b8", fontWeight: "700", letterSpacing: 1 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1e293b" },
  
  headerRight: { flexDirection: "row", alignItems: "center" },
  countText: { color: "#64748b", fontWeight: "600", marginRight: 20 },
  clearBtn: { backgroundColor: "#eff6ff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  clearText: { color: "#2563eb", fontWeight: "700", fontSize: 13 },

  // Content
  contentArea: { flex: 1, maxWidth: 1000, width: '100%', alignSelf: 'center', padding: 20 },
  listPadding: { paddingBottom: 40 },
  
  // Notification Cards
  notificationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      web: { cursor: 'default', transition: '0.2s' }
    })
  },
  iconContainer: { marginRight: 16 },
  bellCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eff6ff", justifyContent: 'center', alignItems: 'center' },
  contentContainer: { flex: 1 },
  messageText: { fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  timeText: { fontSize: 12, color: "#94a3b8" },
  actionButton: { padding: 8, borderRadius: 8 },

  // States
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "500" },
  emptyIllustration: { marginBottom: 20 },
  noDataTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  noDataSub: { fontSize: 14, color: "#94a3b8", marginTop: 4, textAlign: 'center' }
});