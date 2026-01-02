// screens/LeaveConfirmationScreen.js

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LeaveConfirmationScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leave Request Submitted</Text>
      <Text style={styles.subtitle}>
        Your leave request has been submitted.
      </Text>
      <Text style={styles.subtitle}>
        Please wait while the sub-admin reviews and approves it.
      </Text>

      {/* Leave Status Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LeaveStatus')}
      >
        <Text style={styles.buttonText}>View Leave Status</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LeaveConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    marginTop: 25,
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
