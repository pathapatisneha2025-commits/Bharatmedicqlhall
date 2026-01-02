// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storeEmployeeId } from '../utils/storage'; // ✅ Make sure this path is correct
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Handle Login
  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Missing Fields', 'Please enter both email and password');
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(
      "https://hospitaldatabasemanagement.onrender.com/employee/login",
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();
    setLoading(false);

    if (res.ok && data.employee) {
      const employee = data.employee;

      // 🔒 Check if approved
      if (employee.status !== "approved") {
        Alert.alert(
          "⏳ Pending Approval",
          "Admin has not approved your credentials yet."
        );
        return;
      }

      // 💾 Save Employee ID locally
      await storeEmployeeId(employee.id);



      // ✅ ROLE BASED NAVIGATION
if (employee.role === "pune") {
  navigation.reset({
    index: 0,
    routes: [{ name: "NurseDashboard", params: { employee } }],
  });
} else {
  navigation.reset({
    index: 0,
    routes: [{ name: "Dashboard", params: { employee } }],
  });
}

    } else {
      Alert.alert('❌ Login Failed', data.message || 'Invalid email or password.');
    }
  } catch (error) {
    setLoading(false);
    Alert.alert('❌ Error', error.message || 'Something went wrong');
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.heading}>Employee Login</Text>
      <Text style={styles.description}>
        Sign in to access the hospital management system
      </Text>

      {/* 📧 Email Input with Icon */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* 🔐 Password Input with Icon */}
      <View style={styles.passwordContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#888" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter your password"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("EmpResetPasswordScreen")}
        style={styles.forgotButton}
      >
        <Text style={styles.forgotButtonText}>Forgot Password</Text>
      </TouchableOpacity>

      {/* 🔘 Login Button */}
      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Login →</Text>
        )}
      </TouchableOpacity>

      {/* 📌 Footer */}
      <Text style={styles.footer}>
        Don’t have an account?{' '}
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('EmpSignUp')}
        >
          Sign Up
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 20,
    color: '#1E88E5',
  },
  description: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    width: '90%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    width: '100%',
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    width: '100%',
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    elevation: 2,
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1E88E5',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
    elevation: 3,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  link: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  forgotButton: {
    marginLeft: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: "center",
  },
  forgotButtonText: {
    color: "#4a90e2",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});