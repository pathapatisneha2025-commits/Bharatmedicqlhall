import React, { useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const SidebarMenu = () => {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  // Device type
  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  // Scaling
  const fontSize = isMobile ? 22 : isTablet ? 18 : 20;
  const iconSize = isMobile ? 22 : isTablet ? 24 : 26;
  const itemSpacing = isMobile ? 15 : isTablet ? 18 : 22;
  const containerPadding = isMobile ? 20 : 30;

  // Fix width: same for tablet and desktop for consistent center
  const contentWidth = isMobile ? '100%' : 400;

  useEffect(() => {
    const backAction = () => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <View
      style={[
        styles.outerContainer,
        { minHeight: height }
      ]}
    >
      <ScrollView 
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',  // center vertically
          alignItems: 'center',      // center horizontally
          paddingVertical: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: contentWidth, paddingHorizontal: containerPadding }}>
          <Text style={[styles.header, { fontSize: fontSize + 6 }]}>Menu</Text>

          {/* Main Menu Items */}
          {[
            { name: 'Dashboard', icon: <Ionicons name="speedometer-outline" size={iconSize} color="#fff" /> },
            { name: 'TaskView', icon: <MaterialIcons name="assignment" size={iconSize} color="#fff" />, label: 'Tasks' },
            { name: 'Attendance', icon: <FontAwesome name="check-square-o" size={iconSize} color="#fff" /> },
            { name: 'Attendanceoffduty', icon: <MaterialIcons name="logout" size={iconSize} color="#fff" />, label: 'Attendance LogOut' },
            { name: 'BreakInScreen', icon: <Ionicons name="play-circle-outline" size={iconSize} color="#fff" />, label: 'Break In' },
            { name: 'BreakOutScreen', icon: <Ionicons name="stop-circle-outline" size={iconSize} color="#fff" />, label: 'Break Out' },
            { name: 'LeaveStatus', icon: <MaterialIcons name="event-note" size={iconSize} color="#fff" />, label: 'Leave Status' },
            { name: 'Leave', icon: <Ionicons name="create-outline" size={iconSize} color="#fff" />, label: 'Leave Apply' },
            { name: 'payslip', icon: <MaterialIcons name="receipt-long" size={iconSize} color="#fff" />, label: 'Payslips' },
            { name: 'EmpPerformanceDashboard', icon: <MaterialIcons name="insights" size={iconSize} color="#fff" />, label: 'KPI/KPA' },
            { name: 'Billing', icon: <MaterialIcons name="attach-money" size={iconSize} color="#fff" />, label: 'Billing' },
            { name: 'DoctorRequestForm', icon: <MaterialIcons name="request-page" size={iconSize} color="#fff" />, label: 'Employee Request Form' },
            { name: 'EmployeeRequestListScreen', icon: <MaterialIcons name="request-page" size={iconSize} color="#fff" />, label: 'Employee Request Form all' },
            { name: 'DoctorAppointment', icon: <MaterialIcons name="event-available" size={iconSize} color="#fff" />, label: 'Employee Booking' },
            { name: 'EmployeeDailyBookings', icon: <MaterialIcons name="event-available" size={iconSize} color="#fff" />, label: 'DailyBookings' },
            { name: 'AddAllowanceUsageScreen', icon: <MaterialIcons name="attach-money" size={iconSize} color="#fff" />, label: 'EmployeeAllowanceUsageform' },
            { name: 'EmployeeAllowanceall', icon: <MaterialIcons name="attach-money" size={iconSize} color="#fff" />, label: 'EmployeeAllowanceUsageall' },
            { name: 'ProfileScreen', icon: <Ionicons name="person-circle-outline" size={iconSize} color="#fff" />, label: 'Profile' },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, { marginVertical: itemSpacing }]}
              onPress={() => navigation.navigate(item.name)}
            >
              {item.icon}
              <Text style={[styles.menuText, { fontSize }]}>{item.label || item.name}</Text>
            </TouchableOpacity>
          ))}

          {/* Pharmacy Section */}
          <Text style={[styles.subHeader, { fontSize: fontSize + 2, marginTop: itemSpacing * 2 }]}>Pharmacy</Text>
          {[
            { name: 'PharmacyLogin', icon: <Ionicons name="log-in-outline" size={iconSize} color="#fff" />, label: 'Pharmacy Login' },
            { name: 'InventoryManagement', icon: <MaterialIcons name="inventory" size={iconSize} color="#fff" />, label: 'Inventory Management' },
            { name: 'PharmacyBilling', icon: <MaterialIcons name="point-of-sale" size={iconSize} color="#fff" />, label: 'Pharmacy Billing' },
            { name: 'PharmacyOrders', icon: <MaterialIcons name="shopping-cart" size={iconSize} color="#fff" />, label: 'Pharmacy Orders' },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, { marginVertical: itemSpacing }]}
              onPress={() => navigation.navigate(item.name)}
            >
              {item.icon}
              <Text style={[styles.menuText, { fontSize }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#1e1e2f',
  },
  header: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  subHeader: {
    fontWeight: 'bold',
    color: '#00bcd4',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    color: '#fff',
    marginLeft: 15,
  },
});

export default SidebarMenu;
