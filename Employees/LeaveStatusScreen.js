import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  BackHandler,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmployeeId } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const getStatusStyle = (status) => {
  if (!status) return { color: '#6b7280', bg: '#f3f4f6' };
  const normalizedStatus = status.trim().toLowerCase();
  switch (normalizedStatus) {
    case 'approved': return { color: '#10b981', bg: '#ecfdf5' };
    case 'rejected': return { color: '#ef4444', bg: '#fef2f2' };
    case 'pending': return { color: '#f59e0b', bg: '#fffbeb' };
    default: return { color: '#6b7280', bg: '#f3f4f6' };
  }
};

const LeaveStatusScreen = () => {
  const [leaveData, setLeaveData] = useState([]);
  const [summary, setSummary] = useState(null);
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && SCREEN_WIDTH > 800;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  useEffect(() => {
    const backAction = () => {
      navigation.reset({ index: 0, routes: [{ name: 'EmpSideBar' }] });
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedLeaves = await AsyncStorage.getItem('leaveData');
        const cachedSummary = await AsyncStorage.getItem('leaveSummary');
        const cachedMonth = await AsyncStorage.getItem('leaveMonth');
        const currentMonth = new Date().getMonth();

        if (cachedLeaves) setLeaveData(JSON.parse(cachedLeaves));

        if (cachedSummary) {
          const savedSummary = JSON.parse(cachedSummary);
          // Reset usedLeavesMonth and unpaidLeaves if month has changed
          if (cachedMonth && parseInt(cachedMonth) !== currentMonth) {
            savedSummary.usedLeavesMonth = '0';
            savedSummary.unpaidLeaves = '0';
          }
          setSummary(savedSummary);
        }

        fetchLeaves();
      } catch (error) {
        fetchLeaves();
      }
    };
    loadData();
  }, []);

  const fetchLeaves = async () => {
    try {
      const employeeId = await getEmployeeId();
      if (!employeeId) return;

      const response = await fetch(`https://hospitaldatabasemanagement.onrender.com/leaves/by-employee/${employeeId}`);
      const data = await response.json();

      if (response.ok && data.leaves) {
        setLeaveData(data.leaves);

      const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

let usedLeavesMonth = 0;

data.leaves.forEach((leave) => {
  if (leave.status?.toLowerCase() === "approved") {
    const leaveDate = new Date(leave.start_date);
    if (
      leaveDate.getMonth() === currentMonth &&
      leaveDate.getFullYear() === currentYear
    ) {
      usedLeavesMonth += parseFloat(leave.leavestaken || 0);
    }
  }
});
      const allowedLeaves = parseFloat(data.allowedLeaves || 0);

// Calculate unpaid leaves
let unpaidLeaves = usedLeavesMonth - allowedLeaves;

// If negative, set to 0
if (unpaidLeaves < 0) {
  unpaidLeaves = 0;
}

const summ = {
  allowedLeaves,
  usedLeavesMonth,
  unpaidLeaves,
};
        setSummary(summ);

        // Cache for next load
        await AsyncStorage.setItem('leaveData', JSON.stringify(data.leaves));
        await AsyncStorage.setItem('leaveSummary', JSON.stringify(summ));
        await AsyncStorage.setItem('leaveMonth', todayMonth.toString());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }) => {
    const { color, bg } = getStatusStyle(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.leaveType}>{item.leave_type || 'General Leave'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: bg }]}>
            <Text style={[styles.statusText, { color }]}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {item.start_date?.split('T')[0]} to {item.end_date?.split('T')[0]}
          </Text>
        </View>

        <Text style={styles.reasonText} numberOfLines={2}>
          <Text style={{fontWeight: '600', color: '#374151'}}>Reason: </Text>
          {item.reason || 'No reason provided'}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.footerDetail}>Taken: {item.leavestaken} days</Text>
          <Text style={styles.footerDetail}>Deduction: ₹{item.salary_deduction || '0'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.contentArea, { width: isWeb ? '50%' : '100%' }]}>
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.logoBox}><Text style={styles.logoText}>BM</Text></View>
        </View>

        <Text style={styles.screenTitle}>Leave Status</Text>
        <Text style={styles.screenSub}>Track your applications and view your remaining balance.</Text>

        {summary && (
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.statLabel}>Allowed</Text>
              <Text style={[styles.statValue, { color: '#10b981' }]}>{summary.allowedLeaves}</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#eff6ff' }]}>
              <Text style={styles.statLabel}>Used This month </Text>
              <Text style={[styles.statValue, { color: '#0ea5e9' }]}>{summary.usedLeavesMonth}</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#fef2f2' }]}>
              <Text style={styles.statLabel}>Unpaid</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{summary.unpaidLeaves}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>History</Text>
        {leaveData.length === 0 ? (
          <View style={styles.emptyContainer}>
             <Ionicons name="document-text-outline" size={40} color="#e5e7eb" />
             <Text style={styles.noDataText}>No leave records found.</Text>
          </View>
        ) : (
          <FlatList
            data={leaveData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {isWeb && (
        <View style={styles.sideBrand}>
          <View style={styles.brandCircle}><Text style={styles.brandCircleText}>BM</Text></View>
          <Text style={styles.brandHeading}>Management</Text>
          <Text style={styles.brandSub}>Review your leave history and plan your time off efficiently.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  contentArea: { paddingHorizontal: '6%', paddingTop: 50 },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  backBtn: { padding: 8, borderRadius: 10, backgroundColor: '#f9fafb' },
  logoBox: { backgroundColor: '#0ea5e9', padding: 8, borderRadius: 8 },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  screenTitle: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  screenSub: { fontSize: 14, color: '#6b7280', marginTop: 5, marginBottom: 25 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  statItem: { flex: 1, padding: 15, borderRadius: 16, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 15 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 15, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  leaveType: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoText: { fontSize: 13, color: '#6b7280' },
  reasonText: { fontSize: 14, color: '#4b5563', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  footerDetail: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  sideBrand: { flex: 1, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center', padding: 40 },
  brandCircle: { backgroundColor: 'rgba(255,255,255,0.2)', width: 100, height: 100, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  brandCircleText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  brandHeading: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  brandSub: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 15, lineHeight: 22, maxWidth: 300 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  noDataText: { color: '#9ca3af', marginTop: 10 },
});

export default LeaveStatusScreen;
