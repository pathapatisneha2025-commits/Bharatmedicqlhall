import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
    ActivityIndicator, // ✅ ADD THIS

} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function PatientSignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

  const validateFields = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!gender) newErrors.gender = 'Please select gender';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = 'Enter valid 10-digit phone number';
    if (!password.trim()) newErrors.password = 'Password is required';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Confirm your password';
    if (password && confirmPassword && password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSignup = async () => {
    if (!validateFields()) return;

    try {
      const response = await fetch("https://hospitaldatabasemanagement.onrender.com/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          gender,
          phone_number: phone,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) navigation.navigate("PatientLogin");
      else setErrors({ api: data.message || "Something went wrong" });
    } catch (error) {
      console.error(error);
      setErrors({ api: "Failed to connect to server" });
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: 'https://via.placeholder.com/96x96.png?text=Logo' }}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.heading}>Create Patient Account</Text>

      {/* ------- First Name ------- */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.textInput}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor="#6FA0D7"
        />
      </View>
      {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

      {/* ------- Last Name ------- */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.textInput}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor="#6FA0D7"
        />
      </View>
      {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

      {/* ------- Gender ------- */}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
          style={styles.picker}
          dropdownIconColor="#1A4C8C"
        >
          <Picker.Item label="Select Gender" value="" color="#6FA0D7" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>
      {errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

      {/* ------- Email ------- */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.textInput}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#6FA0D7"
        />
      </View>
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      {/* ------- Phone ------- */}
      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.textInput}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#6FA0D7"
        />
      </View>
      {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

      {/* ------- Password ------- */}
      <View style={styles.passwordContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#6FA0D7"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#1A4C8C" />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      {/* ------- Confirm Password ------- */}
      <View style={styles.passwordContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#1A4C8C" style={styles.icon} />
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor="#6FA0D7"
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#1A4C8C" />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

      {errors.api && <Text style={styles.apiError}>{errors.api}</Text>}

      <TouchableOpacity style={styles.button} onPress={onSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation?.navigate?.('PatientLogin')}>
        <Text style={styles.loginLink}>
          Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
    backgroundColor: '#F4F9FF',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A4C8C',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A4C8C',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 6,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A4C8C',
  },
  pickerWrapper: {
    ...Platform.select({
      android: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        elevation: 2,
        marginBottom: 6,
      },
      ios: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 6,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  picker: {
    height: 50,
    paddingHorizontal: 4,
    color: '#1A4C8C',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    marginLeft: 4,
    fontSize: 13,
  },
  apiError: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1A4C8C',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginLink: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4D7CC8',
  },
  loginLinkBold: {
    fontWeight: '700',
    color: '#1A4C8C',
  },
});
