import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import colors from '../constants/colors';

const WelcomeScreen = ({ navigation }) => {
  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/Logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.heartBadge}>
               <MaterialCommunityIcons name="heart" size={16} color="white" />
            </View>
          </View>

          <Text style={styles.title}>
            <Text style={styles.titleBlue}>Bharat Medical</Text> Hall
          </Text>
          
          <Text style={styles.subtitle}>
            Complete healthcare management solution for{'\n'}hospitals, doctors, and patients
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.replace('SelectRole')}
          >
            <Text style={styles.buttonText}>Get Started  →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.infoCard}>
            <View style={[styles.cardIcon, { backgroundColor: '#eef2ff' }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.cardTitle}>Secure</Text>
            <Text style={styles.cardSubtitle}>HIPAA Compliant</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.cardIcon, { backgroundColor: '#f0fdf4' }]}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#22c55e" />
            </View>
            <Text style={styles.cardTitle}>24/7</Text>
            <Text style={styles.cardSubtitle}>Always Available</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.cardIcon, { backgroundColor: '#eff6ff' }]}>
              <MaterialCommunityIcons name="heart-outline" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.cardTitle}>Care</Text>
            <Text style={styles.cardSubtitle}>Patient First</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 20,
  },
  heartBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: '#2DD4BF',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 15,
    textAlign: 'center',
  },
  titleBlue: {
    color: '#0080FF',
  },
  subtitle: {
    fontSize: 20,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#00C2FF',
    paddingVertical: 18,
    paddingHorizontal: 45,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap', // ensures cards wrap on smaller screens
  },
  infoCard: {
    backgroundColor: 'white',
    width: 200,
    padding: 25,
    margin: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
});

export default WelcomeScreen;