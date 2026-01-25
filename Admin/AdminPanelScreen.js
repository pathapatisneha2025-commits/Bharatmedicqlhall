import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import axios from 'axios';

const BASE_URL = 'https://hospitaldatabasemanagement.onrender.com';

const AdminPanelScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);

  const [doctorCount, setDoctorCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ======================
     FAST DASHBOARD FETCH
  ======================= */
  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        doctorsRes,
        employeesRes,
        patientsRes,
        appointmentsRes,
        ordersRes,
        leavesRes,
        tasksRes,
      ] = await Promise.all([
        fetch(`${BASE_URL}/consultancefee/all`),
        fetch(`${BASE_URL}/employee/all`),
        fetch(`${BASE_URL}/patient/all`),
        fetch(`${BASE_URL}/book-appointment/all`),
        fetch(`${BASE_URL}/order-medicine/all`),
        fetch(`${BASE_URL}/leaves/all`),
        fetch(`${BASE_URL}/task/all`),
      ]);

      const doctors = await doctorsRes.json();
      const employees = await employeesRes.json();
      const patients = await patientsRes.json();
      const appointments = await appointmentsRes.json();
      const orders = await ordersRes.json();
      const leavesData = await leavesRes.json();
      const tasksData = await tasksRes.json();

      setDoctorCount(Array.isArray(doctors) ? doctors.length : 0);
      setEmployeeCount(employees?.employees?.length || 0);
      setPatientCount(patients?.patients?.length || 0);

      const appointmentTotal = Array.isArray(appointments)
        ? appointments.reduce(
            (sum, i) => sum + Number(i.consultantfees || 0),
            0
          )
        : 0;

      const orderTotal = Array.isArray(orders)
        ? orders.reduce((sum, i) => sum + Number(i.total || 0), 0)
        : 0;

      setTotalRevenue(appointmentTotal + orderTotal);
      setLeaves(leavesData?.leaves || []);
      setTasks(tasksData?.tasks || []);

      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      Alert.alert("Error", "Failed to load dashboard");
    }
  };

  /* ======================
     LEAVE ACTION
  ======================= */
  const handleLeaveAction = async (id, status) => {
    try {
      await fetch(`${BASE_URL}/leaves/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );

      Alert.alert("Success", `Leave ${status}`);
    } catch {
      Alert.alert("Error", "Update failed");
    }
  };
 
  
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Adminsidebar')}>
          <Entypo name="menu" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications" size={24} color="black" />
          <View style={styles.notificationDot}>
            <Text style={styles.notificationText}>3</Text>
          </View>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100' }}
            style={styles.profileImage}
          />
        </View>
      </View>

      {/* Top Stats */}
      <View style={styles.statsRow}>
        <StatCard
          title="Total Doctors"
          value={doctorCount}
          icon="account"
          color="#E1E9FF"
          onPress={() => navigation.navigate('AddDoctors')}
        />
        <StatCard
          title="Employees"
          value={employeeCount}
          icon="account-group"
          color="#E5FFF2"
          onPress={() => navigation.navigate('AdminListScreen')}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          title="Patients"
          value={patientCount}
          icon="account-heart"
          color="#F3E9FF"
          onPress={() => navigation.navigate('AdminAllPatients')}
        />
        <StatCard
          title="Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          icon="currency-inr"
          color="#FFF7D9"
          onPress={() => navigation.navigate('AdminCustomerOrders')}
        />
      </View>

      {/* Pending Leaves */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pending Approvals</Text>
        {leaves
          .filter((item) => item.status.toLowerCase() === 'pending')
          .map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.approvalItem}
              onPress={() => navigation.navigate('AdminLeaveApproval', { leave: item })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.approvalName}>{item.employee_name}</Text>
                <Text style={styles.approvalText}>
                  {item.leave_type} ({item.leavestaken} days)
                </Text>
                <Text style={styles.approvalText}>Status: {item.status}</Text>
              </View>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleLeaveAction(item.id, 'approved')}
              >
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleLeaveAction(item.id, 'cancelled')}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
      </View>

      {/* Recent Tasks */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {tasks.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.activityItem}
            onPress={() => navigation.navigate('Admintaskmanagement', { task: item })}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: item.priority === 'High' ? 'red' : 'blue' }
              ]}
            />
            <View>
              <Text style={styles.activityText}>{item.title}</Text>
              <Text style={styles.timeText}>Due: {item.due_date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

// Reusable components
const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: color }]} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={28} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 50, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notificationDot: { backgroundColor: 'red', borderRadius: 8, paddingHorizontal: 5, marginLeft: -10, marginRight: 8 },
  notificationText: { color: '#fff', fontSize: 10 },
  profileImage: { width: 30, height: 30, borderRadius: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { flex: 1, margin: 5, padding: 15, borderRadius: 12, alignItems: 'center' },
  statTitle: { fontSize: 13, marginTop: 5 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginVertical: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  approvalItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  approvalName: { fontWeight: 'bold' },
  approvalText: { color: '#777', fontSize: 13 },
  approveBtn: { backgroundColor: '#28a745', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginLeft: 5 },
  rejectBtn: { backgroundColor: '#dc3545', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginLeft: 5 },
  btnText: { color: '#fff', fontSize: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  activityText: { fontSize: 14 },
  timeText: { fontSize: 12, color: '#777' }
});

export default AdminPanelScreen;
