import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const DashboardCard = ({ title, value, subValue, color }) => (
  <View style={[styles.card, { backgroundColor: color || colors.lightGray }]}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.value}>{value}</Text>
    {subValue && <Text style={styles.subValue}>{subValue}</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    color: colors.gray,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
  },
  subValue: {
    fontSize: 12,
    color: colors.gray,
  },
});

export default DashboardCard;
