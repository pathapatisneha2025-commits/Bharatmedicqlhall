import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

const BASE_URL = 'https://hospitaldatabasemanagement.onrender.com';

const SubAdminDashboardScreen = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, leaveRes, taskRes] = await Promise.all([
          axios.get(`${BASE_URL}/employee/all`),
          axios.get(`${BASE_URL}/leaves/all`),
          axios.get(`${BASE_URL}/task/all`)
        ]);

        setEmployees(empRes.data.employees || []);
        setLeaves(leaveRes.data.leaves || []);
        setTasks(taskRes.data.tasks || []);
      } catch (error) {
        console.log('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Department-wise grouping
  const departments = {};
  employees.forEach(emp => {
    if (!departments[emp.department]) {
      departments[emp.department] = [];
    }
    departments[emp.department].push(emp);
  });

  // Leave counts
  const onDutyCount = employees.filter(emp => emp.status === 'on_duty').length;
  const onLeaveCount = employees.filter(emp => emp.status === 'on_leave').length;
  const pendingCount = employees.filter(emp => emp.status === 'pending').length;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("SubAdmin")}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.subAdmin}>Sub Admin</Text>
        </View>
        <View style={styles.rightIcons}>
          <Ionicons name="notifications-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
          <Image source={require('../assets/Logo.jpg')} style={styles.avatar} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={styles.activeTab}>
          <Ionicons name="grid-outline" size={16} color="#2563eb" />
          <Text style={styles.activeTabText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="people-outline" size={16} color="#6b7280" />
          <Text style={styles.tabText}>Staff</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="document-text-outline" size={16} color="#6b7280" />
          <Text style={styles.tabText}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Staff Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#e0f2fe' }]}
          onPress={() => navigation.navigate('TotalStaff')}
        >
          <Text style={styles.cardTitle}>Total Staff</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardValue}>{employees.length}</Text>
            <Ionicons name="people" size={24} color="#1e3a8a" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#dcfce7' }]}
          onPress={() => navigation.navigate('OnDuty')}
        >
          <Text style={styles.cardTitle}>On Duty</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardValue}>{onDutyCount}</Text>
            <Ionicons name="person" size={24} color="#15803d" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#fef3c7' }]}
          onPress={() => navigation.navigate('OnLeave')}
        >
          <Text style={styles.cardTitle}>On Leave</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardValue}>{onLeaveCount}</Text>
            <Ionicons name="calendar" size={24} color="#d97706" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#fee2e2' }]}
          onPress={() => navigation.navigate('Pending')}
        >
          <Text style={styles.cardTitle}>Pending</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardValue}>{pendingCount}</Text>
            <Ionicons name="time" size={24} color="#b91c1c" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Departments */}
      <Text style={styles.sectionTitle}>Departments</Text>
      {Object.keys(departments).map((dept, index) => (
        <TouchableOpacity
          key={index}
          style={styles.departmentCard}
          onPress={() => navigation.navigate('Departmentchart', { department: dept, members: departments[dept] })}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
            <FontAwesome5 name="building" size={18} color="#000" />
          </View>
          <View>
            <Text style={styles.departmentName}>{dept}</Text>
            <Text style={styles.departmentMembers}>{departments[dept].length} staff members</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      ))}

      {/* Leave Requests */}
      <Text style={styles.sectionTitle}>
        Leave Requests <Text style={styles.pendingBadge}>{leaves.filter(l => l.status.toLowerCase() === 'pending').length} Pending</Text>
      </Text>
      {leaves.filter(l => l.status.toLowerCase() === 'pending').map((leave, index) => (
        <TouchableOpacity
          key={index}
          style={styles.leaveRequest}
          onPress={() => navigation.navigate('subAdminleavestatus', { leave })}
        >
          <Image source={{ uri: employees.find(e => e.id === leave.employee_id)?.image || '' }} style={styles.leaveAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.leaveName}>{leave.employee_name}</Text>
            <Text style={styles.leaveReason}>{leave.reason}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="close-circle" size={24} color="#dc2626" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {/* Recent Tasks */}
      <Text style={styles.sectionTitle}>Recent Task Assignments</Text>
      {tasks.slice(-5).map((task, index) => (
        <TouchableOpacity
          key={index}
          style={styles.taskCard}
          onPress={() => navigation.navigate('taskScreen', { task })}
        >
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={[styles.badge, { backgroundColor: task.status === 'pending' ? '#e0f2fe' : '#dcfce7' }]}>
            <Text style={[styles.badgeText, { color: task.status === 'pending' ? '#2563eb' : '#15803d' }]}>{task.status === 'pending' ? 'Active' : 'Complete'}</Text>
          </View>
          <Text style={styles.taskAssigned}>Assigned to: {task.assignto.join(', ')}</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBar, { backgroundColor: task.status === 'pending' ? '#3b82f6' : '#22c55e', width: task.status === 'pending' ? '60%' : '100%' }]} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginBottom: 10,
  },
  subAdmin: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  tab: { alignItems: 'center' },
  tabText: { color: '#6b7280', fontSize: 12 },
  activeTab: { alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 4 },
  activeTabText: { color: '#2563eb', fontSize: 12, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', padding: 16, borderRadius: 10, marginBottom: 10 },
  cardTitle: { fontSize: 12, color: '#374151' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardValue: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  pendingBadge: {
    fontSize: 12, color: '#dc2626', backgroundColor: '#fee2e2',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden',
  },
  departmentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    padding: 12, borderRadius: 10, marginBottom: 8,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  departmentName: { fontWeight: 'bold' },
  departmentMembers: { fontSize: 12, color: '#6b7280' },
  leaveRequest: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  leaveAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  leaveName: { fontWeight: 'bold' },
  leaveReason: { fontSize: 12, color: '#6b7280' },
  taskCard: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 12 },
  taskTitle: { fontWeight: 'bold' },
  taskAssigned: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  badge: { position: 'absolute', right: 10, top: 10, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { fontSize: 12 },
  progressBarBackground: { backgroundColor: '#e5e7eb', height: 6, borderRadius: 3, marginTop: 8 },
  progressBar: { height: 6, borderRadius: 3 },
});

export default SubAdminDashboardScreen;
