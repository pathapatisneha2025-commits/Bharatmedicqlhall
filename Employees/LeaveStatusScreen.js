// screens/LeaveStatusScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  BackHandler
} from 'react-native';
import { getEmployeeId } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const getStatusStyle = (status) => {
  if (!status) return { backgroundColor: '#6c757d', textColor: '#fff' };

  const normalizedStatus = status.trim().toLowerCase();
  switch (normalizedStatus) {
    case 'approved':
      return { backgroundColor: '#28a745', textColor: '#fff' };
    case 'rejected':
      return { backgroundColor: '#dc3545', textColor: '#fff' };
    case 'pending':
      return { backgroundColor: '#ffc107', textColor: '#212529' };
    case 'cancelled':
      return { backgroundColor: '#6c757d', textColor: '#fff' };
    default:
      return { backgroundColor: '#6c757d', textColor: '#fff' };
  }
};

const LeaveStatusScreen = () => {
  const [leaveData, setLeaveData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Fetch leaves on mount
  useEffect(() => {
    fetchLeaves();
  }, []);

  // Back handler on mount

   useEffect(() => {
      const backAction = () => {
        // Instead of going back step by step, reset navigation to Sidebar/Home
        navigation.reset({
          index: 0,
          routes: [{ name: "EmpSideBar" }], // <-- replace with your sidebar/home screen name
        });
        return true; // prevents default back behavior
      };
    
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
    
      return () => backHandler.remove(); // clean up on unmount
    }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const employeeId = await getEmployeeId();

      if (!employeeId) {
        Alert.alert('Error', 'Employee ID not found in storage');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/leaves/by-employee/${employeeId}`
      );

      const data = await response.json();

      if (response.ok && data.leaves) {
        setLeaveData(data.leaves);
        setSummary({
          allowedLeaves: data.allowedLeaves,
          usedLeavesMonth: data.usedLeavesMonth
            ? parseFloat(data.usedLeavesMonth).toFixed(2)
            : '0.00',
          unpaidLeaves: data.unpaidLeaves
            ? parseFloat(data.unpaidLeaves).toFixed(2)
            : '0.00',
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch leaves');
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      Alert.alert('Error', 'Something went wrong while fetching leaves');
    } finally {
      setLoading(false);
    }
  };

  // Render each leave item
  const renderItem = ({ item }) => {
    const startDate = item.start_date
      ? new Date(item.start_date).toISOString().split('T')[0]
      : 'N/A';
    const endDate = item.end_date
      ? new Date(item.end_date).toISOString().split('T')[0]
      : 'N/A';

    const { backgroundColor, textColor } = getStatusStyle(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.leaveType}>{item.leave_type || 'N/A'}</Text>
          <View style={[styles.statusContainer, { backgroundColor }]}>
            <Text style={[styles.statusText, { color: textColor }]}>
              {item.status || 'N/A'}
            </Text>
          </View>
        </View>

        <Text style={styles.date}>
          From: {startDate} | To: {endDate}
        </Text>
        <Text style={styles.reason}>Reason: {item.reason || 'N/A'}</Text>
        <Text style={styles.detail}>Department: {item.department || 'N/A'}</Text>
        <Text style={styles.detail}>
          Leave Taken: {item.leavestaken ? `${item.leavestaken} days` : 'N/A'}
        </Text>
        <Text style={styles.detail}>
          Salary Deduction: ₹
          {item.salary_deduction
            ? parseFloat(item.salary_deduction).toFixed(2)
            : '0.00'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>Leave Applications</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Allowed Leaves: {summary.allowedLeaves}
          </Text>
          <Text style={styles.summaryText}>
            Used This Month: {summary.usedLeavesMonth}
          </Text>
          <Text style={styles.summaryText}>
            Unpaid Leaves: {summary.unpaidLeaves}
          </Text>
        </View>
      )}

      {/* Leave list */}
      {leaveData.length === 0 ? (
        <Text style={styles.noDataText}>No leave records found.</Text>
      ) : (
        <FlatList
          data={leaveData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343a40',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#d1e7dd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b4332',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007bff',
  },
  date: {
    fontSize: 14,
    marginTop: 8,
    color: '#6c757d',
  },
  reason: {
    fontSize: 14,
    marginTop: 6,
    color: '#495057',
  },
  detail: {
    fontSize: 13,
    marginTop: 4,
    color: '#6c757d',
  },
  statusContainer: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#6c757d',
    fontSize: 16,
  },
});

export default LeaveStatusScreen;
