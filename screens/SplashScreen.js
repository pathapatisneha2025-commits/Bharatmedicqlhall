import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
     <Image source={require('../assets/CompanyLogo.jpg')} style={{ width: 300, height: 100,marginBottom: 10 }} />
      <Text style={styles.title}>Welcome to Bharat Medical Hall</Text>
      <Text style={styles.subtitle}>Manage your appointments and tasks effortlessly</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('SelectRole')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 19,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
  },
});

export default WelcomeScreen;
