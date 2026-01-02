import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEmployeeId } from '../utils/storage';   // ✅ IMPORT

const RequestForm = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [queryReason, setQueryReason] = useState('');
  const [loading, setLoading] = useState(false);

  /* ===================================================
        STEP 1: GET EMPLOYEE ID FROM STORAGE
  =================================================== */
  const loadEmployeeId = async () => {
    try {
      const id = await getEmployeeId();
      setEmployeeId(id);
      return id;
    } catch (err) {
      console.log("Error loading employeeId:", err);
    }
  };

  /* ===================================================
       STEP 2: FETCH EMPLOYEE DETAILS USING ID
  =================================================== */
  const fetchEmployeeDetails = async () => {
    try {
      const id = await loadEmployeeId();

      if (!id) {
        Alert.alert("Error", "Employee ID not found in storage");
        return;
      }

      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/employee/${id}`
      );

      const data = await response.json();

      if (response.ok) {
        setName(data.employee.full_name);
        setEmail(data.employee.email);
        setDepartment(data.employee.department);
      } else {
        Alert.alert('Error', 'Unable to fetch employee details');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load employee details');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, []);

  /* ===================================================
            SUBMIT REQUEST
  =================================================== */
  const handleSubmit = async () => {
    if (!queryReason) {
      Alert.alert('Error', 'Please enter your query reason');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/doctorrequest/add',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            department,
            email,
            query_reason: queryReason,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Request submitted successfully!');
        setQueryReason('');
      } else {
        Alert.alert('Error', result.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Request Form</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.heading}>Submit a Request</Text>

        {/* Name (Auto-filled) */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#2196F3" style={styles.icon} />
          <TextInput style={styles.input} value={name} editable={false} />
        </View>

        {/* Email (Auto-filled) */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#2196F3" style={styles.icon} />
          <TextInput style={styles.input} value={email} editable={false} />
        </View>

        {/* Department (Auto-filled) */}
        <View style={styles.inputContainer}>
          <Ionicons name="business-outline" size={20} color="#2196F3" style={styles.icon} />
          <TextInput style={styles.input} value={department} editable={false} />
        </View>

        {/* Query Reason */}
        <View style={[styles.inputContainer, { height: 120 }]}>
          <TextInput
            style={[styles.input, { height: 100, paddingTop: 12 }]}
            placeholder="Enter your query reason"
            value={queryReason}
            onChangeText={setQueryReason}
            multiline
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#F4F8FB',
    flex: 1,
     marginTop:20,
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    elevation: 4,
  },
  backButton: { marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scrollView: { padding: 20, paddingBottom: 50 },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
    color: '#1565C0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  icon: { marginHorizontal: 12 },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default RequestForm;
