import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Screen = ({ title }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{title} Screen</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24 },
});

export default function ScreenComponent() {
  return <Screen title="Schedule" />; // Replace title for Alerts and Profile
}
