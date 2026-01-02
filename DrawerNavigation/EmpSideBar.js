import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const SidebarMenu = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.sidebarContainer}>
      <Text style={styles.header}>Menu</Text>
      <ScrollView showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="speedometer-outline" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TaskView')}>
          <MaterialIcons name="assignment" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Attendance')}>
          <FontAwesome name="check-square-o" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Attendanceoffduty')}>
          <MaterialIcons name="logout" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Attendance LogOut</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BreakInScreen')}>
          <Ionicons name="play-circle-outline" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Break In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('BreakOutScreen')}>
          <Ionicons name="stop-circle-outline" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Break Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('LeaveStatus')}>
          <MaterialIcons name="event-note" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Leave Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Leave')}>
          <Ionicons name="create-outline" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Leave Apply</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('payslip')}>
          <MaterialIcons name="receipt-long" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Payslips</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EmpPerformanceDashboard')}>
          <MaterialIcons name="insights" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>KPI/KPA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Billing')}>
          <MaterialIcons name="attach-money" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Billing</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DoctorRequestForm')}>
          <MaterialIcons name="request-page" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Employee Request Form</Text>
        </TouchableOpacity>
 <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EmployeeRequestListScreen')}>
          <MaterialIcons name="request-page" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Employee Request Form all</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DoctorAppointment')}>
          <MaterialIcons name="event-available" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Employee Booking</Text>
        </TouchableOpacity>
 <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddAllowanceUsageScreen')}>
          <MaterialIcons name="attach-money" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>EmployeeAllowanceUsageform</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileScreen')}>
          <Ionicons name="person-circle-outline" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Profile</Text>
        </TouchableOpacity>

        {/* Pharmacy Section */}
        <Text style={styles.subHeader}>Pharmacy</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PharmacyLogin')}>
          <Ionicons name="log-in-outline" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Pharmacy Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('InventoryManagement')}>
          <MaterialIcons name="inventory" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Inventory Management</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PharmacyBilling')}>
          <MaterialIcons name="point-of-sale" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Pharmacy Billing</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PharmacyOrders')}>
          <MaterialIcons name="shopping-cart" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>Pharmacy Orders</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    backgroundColor: '#1e1e2f',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00bcd4',
    marginTop: 30,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  icon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 18,
    color: '#fff',
  },
});

export default SidebarMenu;
