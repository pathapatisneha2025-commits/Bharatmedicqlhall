import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const TaskItem = ({ task, status }) => (
  <View style={styles.container}>
    <Text style={styles.task}>{task}</Text>
    <View
      style={[
        styles.statusBox,
        { backgroundColor: status === 'Complete' ? colors.green : colors.yellow },
      ]}
    >
      <Text style={styles.statusText}>{status}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  task: {
    fontSize: 14,
    color: colors.black,
  },
  statusBox: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
  },
});

export default TaskItem;
