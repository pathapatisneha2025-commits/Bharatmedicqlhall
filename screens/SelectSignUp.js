import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigation = useNavigation();

  const roles = [
    { key: 'patient', label: 'Patient Login', icon: 'person-outline' },
    { key: 'doctor', label: 'Employee Login', icon: 'medkit-outline' },
    { key: 'deptAdmin', label: 'Dept. Admin Login', icon: 'business-outline' },
    { key: 'superAdmin', label: 'Super Admin Login', icon: 'shield-checkmark-outline' },
    { key: 'DoctorLogin', label: 'Doctor Login', icon: 'person-add-outline' },
    { key: 'DeliveryBoy', label: 'Delivery Boy Login', icon: 'bicycle-outline' },
  ];

  const handleContinue = () => {
    if (!selectedRole) {
      Alert.alert('Please select a role to continue');
      return;
    }

    switch (selectedRole) {
      case 'patient':
        navigation.navigate('PatientSignUp');
        break;
      case 'doctor':
        navigation.navigate('signuplogin');
        break;
      case 'deptAdmin':
        navigation.navigate('Dept');
        break;
      case 'superAdmin':
        navigation.navigate('AdminRegisterScreen');
        break;
      case 'DoctorLogin':
        navigation.navigate('DoctorRegister');
        break;
      case 'DeliveryBoy':
        navigation.navigate('DeliverBoyLogin');
        break;
      default:
        Alert.alert('Navigation not set for this role');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../assets/Logo.jpg')}
        style={styles.logoImage}
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
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={role.icon}
                size={40}
                color={selectedRole === role.key ? '#0D47A1' : '#333'}
              />
            </View>
            <Text
              style={[
                styles.cardText,
                selectedRole === role.key && styles.cardTextSelected,
              ]}
            >
              {role.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Ionicons name="log-in-outline" size={18} color="#FFF" />
        <Text style={styles.buttonText}>  Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    marginTop: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0D47A1',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0D47A1',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  card: {
    width: '47%',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: 20,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#BBDEFB',
    borderWidth: 2,
    borderColor: '#0D47A1',
  },
  iconContainer: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 10,
    marginBottom: 8,
    elevation: 3,
  },
  cardText: {
    marginTop: 5,
    fontSize: 14,
    color: '#0D47A1',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardTextSelected: {
    color: '#0D47A1',
    fontWeight: '700',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
