// components/DoctorCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DoctorCard = ({ doctor }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{doctor.name}</Text>
      <Text style={styles.designation}>{doctor.designation}</Text>
      <Text style={styles.qualification}>{doctor.qualification}</Text>

      <View style={styles.infoRow}>
        <Icon name="star" size={16} color="#F59E0B" />
        <Text style={styles.infoText}>{doctor.rating} ({doctor.reviews} reviews)</Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="hospital-building" size={16} color="#3B82F6" />
        <Text style={styles.infoText}>{doctor.hospital}</Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="briefcase-outline" size={16} color="#10B981" />
        <Text style={styles.infoText}>{doctor.experience} years experience</Text>
      </View>

      <Text style={styles.about}>{doctor.about}</Text>
    </View>
  );
};

export default DoctorCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 4 },
  designation: { fontSize: 16, color: '#6B7280', marginBottom: 2 },
  qualification: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoText: { marginLeft: 6, fontSize: 14, color: '#374151' },
  about: { marginTop: 8, fontSize: 14, color: '#4B5563' },
});
