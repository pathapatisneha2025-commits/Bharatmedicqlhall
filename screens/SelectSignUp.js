import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  // Screen type logic
  const isLargeScreen = width > 768; // Tablets and Desktop

  const roles = [
    { key: 'patient', label: 'Patient Login', icon: 'person-outline' },
    { key: 'employee', label: 'Employee Login', icon: 'briefcase-outline' },
    { key: 'deptAdmin', label: 'Dept. Admin Login', icon: 'business-outline' },
    { key: 'superAdmin', label: 'Super Admin Login', icon: 'shield-checkmark-outline' },
    { key: 'doctor', label: 'Doctor Login', icon: 'person-add-outline' },
    { key: 'delivery', label: 'Delivery Boy Login', icon: 'bicycle-outline' },
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Wrapper: 
            On Mobile: width is 100%
            On Tablet/Desktop: width is fixed to 450px and centered
        */}
        <View style={[styles.mainWrapper, { width: isLargeScreen ? 450 : '100%' }]}>
          
          <Image
            source={require('../assets/Logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Bharat Medical Hall</Text>
          <Text style={styles.subtitle}>Login to Bharat Medical Hall</Text>
          <Text style={styles.subtext}>Select your role to continue</Text>

          <View style={styles.grid}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.card,
                  selectedRole === role.key && styles.cardSelected,
                ]}
                onPress={() => setSelectedRole(role.key)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={role.icon} size={32} color="#333" />
                </View>
                <Text style={styles.cardText}>{role.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
          >
            <Ionicons name="log-in-outline" size={22} color="#FFF" />
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
    backgroundColor: '#F8FAFC', // Soft light background
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center', // Centers the box vertically on Desktop
    paddingVertical: 40,
  },
  mainWrapper: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1565C0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1565C0',
    marginTop: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 32,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  card: {
    width: '48%', // Grid spacing for 2 columns
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16,
    // Native and Web Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.08)' }
    }),
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#1565C0',
    backgroundColor: '#D1E9FF',
  },
  iconCircle: {
    backgroundColor: '#FFFFFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  cardText: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});