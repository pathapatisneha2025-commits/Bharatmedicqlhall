import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;

  const roles = [
    { key: 'patient', label: 'Patient Login', sub: 'Book appointments, order medicines', icon: 'account-outline' },
    { key: 'employee', label: 'Employee Login', sub: 'Attendance, tasks, payroll', icon: 'briefcase-outline' },
    { key: 'deptAdmin', label: 'Dept. Admin Login', sub: 'Department management', icon: 'office-building-outline' },
    { key: 'superAdmin', label: 'Super Admin Login', sub: 'Full system access', icon: 'shield-check-outline' },
    { key: 'doctor', label: 'Doctor Login', sub: 'Appointments, patients', icon: 'stethoscope' },
    { key: 'delivery', label: 'Delivery Boy Login', sub: 'Order deliveries', icon: 'truck-delivery-outline' },
  ];

  const handleContinue = () => {
    if (!selectedRole) {
      Alert.alert('Selection Required', 'Please select a role to continue');
      return;
    }

    const routes = {
      patient: 'PatientSignUp',
      employee: 'signuplogin',
      deptAdmin: 'Dept',
      superAdmin: 'AdminRegisterScreen',
      doctor: 'DoctorRegister',
      delivery: 'DeliverBoyLogin',
    };

    navigation.navigate(routes[selectedRole]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
<View style={styles.header}>
  {/* Back Arrow */}
  <TouchableOpacity 
    style={styles.backButton} 
    onPress={() => navigation.goBack()}
  >
    <MaterialCommunityIcons name="arrow-left" size={28} color="#0080FF" />
  </TouchableOpacity>

  <Text style={styles.title}>
    <Text style={{ color: '#0080FF' }}>Bharat Medical</Text> Hall
  </Text>
  <Text style={styles.subtitle}>Login to Bharat Medical Hall</Text>
  <Text style={styles.subtext}>Select your role to continue</Text>
</View>

        {/* Grid Section */}
        <View style={[styles.grid, { maxWidth: isDesktop ? 850 : '100%' }]}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[
                styles.card,
                selectedRole === role.key && styles.cardSelected,
                { width: isDesktop ? '48%' : '100%' }
              ]}
              onPress={() => setSelectedRole(role.key)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons 
                  name={role.icon} 
                  size={32} 
                  color={selectedRole === role.key ? '#0080FF' : '#64748B'} 
                />
              </View>
              <Text style={styles.cardLabel}>{role.label}</Text>
              <Text style={styles.cardSub}>{role.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button Section */}
        <View style={[styles.buttonContainer, { width: isDesktop ? 850 : '90%' }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedRole && styles.buttonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedRole}
          >
            <MaterialCommunityIcons name="arrow-right" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  scrollContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
 // Header
header: {
  alignItems: 'center',
  marginBottom: 40,
  paddingTop: 40, // add space for the back button / safe area
  width: '100%',
  position: 'relative',
},

// Back button
backButton: {
  position: 'absolute',
  left: 20,
  top: 40, // move down to avoid overlap
  padding: 8, // increase touch area
  zIndex: 10,
  backgroundColor: 'rgba(0,0,0,0.05)', // optional subtle circle behind arrow
  borderRadius: 12,
},

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
 

  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0080FF',
    marginBottom: 5,
  },
  subtext: {
    fontSize: 16,
    color: '#94A3B8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' }
    }),
  },
  cardSelected: {
    borderColor: '#0080FF',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0px 10px 25px rgba(0, 128, 255, 0.1)' }
    })
  },
  iconCircle: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
    })
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#72E2E9', // Teal/Cyan gradient color from screenshot
    width: '100%',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
});