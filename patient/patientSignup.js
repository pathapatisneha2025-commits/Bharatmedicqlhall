import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH >= 1024;

  const handlePhoneChange = (text) => {
    let digits = text.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const validateFields = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'Required';
    if (!lastName.trim()) newErrors.lastName = 'Required';
    if (!gender) newErrors.gender = 'Required';
    if (!email.trim()) newErrors.email = 'Required';
    if (!phone.trim() || phone.length < 10) newErrors.phone = 'Invalid phone';
    if (!password.trim()) newErrors.password = 'Required';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
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

  // Replace with your actual logo URLs or local assets
const logoImage = require('../assets/Logo.jpg'); 

  return (
    <View style={styles.mainScreen}>
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        
        {/* LEFT COLUMN: FORM */}
        <View style={styles.formContainer}>
          <ScrollView contentContainerStyle={styles.formSide} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
               <Image source={logoImage} style={styles.miniLogoImage} resizeMode="contain" />
               <Text style={styles.brandTitle}>
                 <Text style={{color: '#0080FF'}}>Bharat Medical</Text> Hall
               </Text>
            </View>

            <Text style={styles.heading}>Patient Signup</Text>
            <Text style={styles.subtext}>Enter your details to create your dashboard</Text>

            {/* FORM FIELDS */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>First Name</Text>
                <TextInput style={styles.input} placeholder="John" value={firstName} onChangeText={setFirstName} />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput style={styles.input} placeholder="Doe" value={lastName} onChangeText={setLastName} />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker}>
                <Picker.Item label="Select Gender" value="" color="#94A3B8" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
              </Picker>
            </View>

            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} placeholder="john@example.com" value={email} onChangeText={setEmail} />

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputRow}>
               <Text style={styles.prefix}>+91</Text>
               <TextInput style={[styles.input, {flex: 1, borderWidth: 0}]} placeholder="9876543210" value={phone} onChangeText={handlePhoneChange} keyboardType="numeric" />
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrapper}>
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="••••••••" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordWrapper}>
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="••••••••" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                      <MaterialCommunityIcons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={onSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign Up →</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('PatientLogin')}>
              <Text style={styles.loginLink}>Already have an account? <Text style={styles.loginLinkBold}>Login here</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* RIGHT COLUMN: PREMIUM HERO */}
        {isDesktop && (
          <View style={styles.heroSide}>
            <View style={styles.heroContent}>
                <Image source={logoImage} style={styles.heroLogoImage} resizeMode="contain" />
                <Text style={styles.heroTitle}>Your Healthcare,{'\n'}Simplified.</Text>
                <Text style={styles.heroSubtitle}>
                  Join thousands of patients managing their health records securely in one place.
                </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, flexDirection: 'row' },
  desktopContainer: { width: '100%', height: '100%' },

  formContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  formSide: { padding: 40, width: '100%', maxWidth: 650 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  miniLogoImage: { width: 45, height: 45, borderRadius: 12, marginRight: 15 },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },

  heading: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  subtext: { fontSize: 16, color: '#64748B', marginBottom: 35 },

  label: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 8, marginTop: 18 },
  input: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' ,      outlineStyle: "none",   // ✅ removes web rectangle
},
  phoneInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9' },
  prefix: { paddingLeft: 16, fontSize: 16, color: '#1E293B', fontWeight: '700' },

  passwordWrapper: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  eyeIcon: { position: 'absolute', right: 16 },

  row: { flexDirection: 'row', gap: 16, width: '100%' },
  col: { flex: 1 },

  pickerWrapper: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  picker: { height: 55, color: '#1E293B' },

  button: { backgroundColor: '#00C2FF', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 40,
    ...Platform.select({ web: { boxShadow: '0px 10px 20px rgba(0, 194, 255, 0.3)' }, android: { elevation: 6 } }) },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  loginLink: { textAlign: 'center', marginTop: 25, color: '#64748B', fontSize: 15 },
  loginLinkBold: { color: '#0080FF', fontWeight: '800' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, fontWeight: '600' },

  heroSide: { flex: 1.2, backgroundColor: '#0080FF', justifyContent: 'center', alignItems: 'center' },
  heroContent: { alignItems: 'center', padding: 40 },
  heroLogoImage: { width: 150, height: 150, marginBottom: 40, borderRadius: 20 },
  heroTitle: { color: 'white', fontSize: 48, fontWeight: '900', textAlign: 'center', lineHeight: 56, marginBottom: 20 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 18, textAlign: 'center', lineHeight: 28, maxWidth: 400, marginBottom: 50 },
});
