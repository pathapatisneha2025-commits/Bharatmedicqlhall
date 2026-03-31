import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Platform,
  useWindowDimensions,KeyboardAvoidingView, Keyboard, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import CheckBox from 'expo-checkbox';

export default function EmployeeRegistration() {
  const navigation = useNavigation();

  // -------------------- Image --------------------
  const [image, setImage] = useState(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // -------------------- Dates --------------------
  const [dob, setDob] = useState(new Date());
  const [dateOfJoining, setDateOfJoining] = useState(new Date());
 // -------------------- Schedule / Break --------------------
const [scheduleIn, setScheduleIn] = useState(null);
const [scheduleOut, setScheduleOut] = useState(null);
const [breakIn, setBreakIn] = useState(null);
const [breakOut, setBreakOut] = useState(null);

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showDojPicker, setShowDojPicker] = useState(false);
  
const [showScheduleInPicker, setShowScheduleInPicker] = useState(false);
const [showScheduleOutPicker, setShowScheduleOutPicker] = useState(false);
const [showBreakInPicker, setShowBreakInPicker] = useState(false);
const [showBreakOutPicker, setShowBreakOutPicker] = useState(false);

  const handleDateChange = (setter, setterVisible) => (event, selectedDate) => {
    setterVisible(false);
    if (selectedDate) setter(selectedDate);
  };

const formatTime = (d) => {
  if (!d) return '';
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

const handleTimeChange = (setter, setterVisible) => (event, selectedTime) => {
  setterVisible(false);
  if (selectedTime) setter(selectedTime);
};

  // -------------------- Fields --------------------
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mobile, setMobile] = useState('');
  const [familyNumber, setFamilyNumber] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [pan, setPan] = useState('');
  const [esiNumber, setEsiNumber] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [category, setCategory] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [branchName, setBranchName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // -------------------- Address --------------------
  const [tempStreet, setTempStreet] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempState, setTempState] = useState('');
  const [tempPincode, setTempPincode] = useState('');
  const [permStreet, setPermStreet] = useState('');
  const [permCity, setPermCity] = useState('');
  const [permState, setPermState] = useState('');
  const [permPincode, setPermPincode] = useState('');

  // -------------------- Dropdown Options --------------------
  const [departmentList, setDepartmentList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Apprentice'];
  const categoryTypes = ['Permanent', 'Temporary', 'Intern'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const [validationErrors, setValidationErrors] = useState({});
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
const isLargeScreen = SCREEN_WIDTH > 800; // <-- add this

   const showAlert = (title, message, buttons) => {
      if (Platform.OS === "web") {
        if (buttons && buttons.length > 1) {
          const confirmed = window.confirm(`${title}\n\n${message}`);
          if (confirmed) {
            const okBtn = buttons.find(b => b.style !== "cancel");
            okBtn?.onPress?.();
          }
        } else {
          window.alert(`${title}\n\n${message}`);
        }
      } else {
        Alert.alert(title, message, buttons);
      }
      };
  // -------------------- Validation --------------------
 const validateFields = () => {
  const errors = {};

  // Basic Info
  if (!fullName.trim()) errors.fullName = 'Full name required';
  if (!email.trim()) errors.email = 'Email required';
  else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email';

  if (!password.trim()) errors.password = 'Password required';
  else if (password.length < 6) errors.password = 'Min 6 characters';

  if (!confirmPassword.trim()) errors.confirmPassword = 'Confirm password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  if (!mobile.trim() || !/^\d{10}$/.test(mobile)) errors.mobile = 'Enter 10-digit mobile';
  if (familyNumber && !/^\d{10}$/.test(familyNumber)) errors.familyNumber = 'Enter valid family number';

  if (!age.trim() || isNaN(age) || age < 18 || age > 70) errors.age = 'Enter valid age (18-70)';
  if (experience && (isNaN(experience) || experience < 0)) errors.experience = 'Enter valid experience';

  // DOB
  if (!dob) errors.dob = 'Select Date of Birth';

  // Blood group
  if (!bloodGroup) errors.bloodGroup = 'Select blood group';

 if (!aadhar.trim()) errors.aadhar = 'Aadhar number required';
else if (!/^\d{12}$/.test(aadhar)) errors.aadhar = 'Aadhar must be 12 digits';

if (!pan.trim()) errors.pan = 'PAN number required';
else if (!/[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(pan)) errors.pan = 'Invalid PAN format (e.g. ABCDE1234F)';

if (!esiNumber.trim()) errors.esiNumber = 'ESI number required';
else if (esiNumber.length < 5) errors.esiNumber = 'Invalid ESI number';


  // Work Info
  if (!reportingManager.trim()) errors.reportingManager = 'Reporting manager required';
  if (!department) errors.department = 'Select department';
  if (!role) errors.role = 'Select role';
  if (!monthlySalary.trim() || isNaN(monthlySalary)) errors.monthlySalary = 'Enter valid salary';
  if (!employmentType) errors.employmentType = 'Select employment type';
  if (!category) errors.category = 'Select category';

  // Addresses
  if (!tempStreet.trim()) errors.tempStreet = 'Temporary street required';
  if (!tempCity.trim()) errors.tempCity = 'Temporary city required';
  if (!tempState.trim()) errors.tempState = 'Temporary state required';
  if (!tempPincode.trim() || !/^\d{6}$/.test(tempPincode)) errors.tempPincode = 'Enter 6-digit pincode';

  if (!permStreet.trim()) errors.permStreet = 'Permanent street required';
  if (!permCity.trim()) errors.permCity = 'Permanent city required';
  if (!permState.trim()) errors.permState = 'Permanent state required';
  if (!permPincode.trim() || !/^\d{6}$/.test(permPincode)) errors.permPincode = 'Enter 6-digit pincode';

  // Bank Info
  if (!ifsc.trim()) errors.ifsc = 'IFSC required';
  else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) errors.ifsc = 'Invalid IFSC code';
  if (!branchName.trim()) errors.branchName = 'Branch name required';
  if (!bankName.trim()) errors.bankName = 'Bank name required';
  if (!accountNumber.trim() || !/^\d{9,18}$/.test(accountNumber)) errors.accountNumber = 'Invalid account number';

  // Other
  
  if (!image) errors.image = 'Profile image required';

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};


  // -------------------- Fetch --------------------
  useEffect(() => {
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDeps(true);
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/department/all');
      const data = await res.json();
      if (Array.isArray(data)) setDepartmentList(data);
    } catch { }
    setLoadingDeps(false);
  };

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/role/all');
      const data = await res.json();
      if (Array.isArray(data)) setRoleList(data);
    } catch { }
    setLoadingRoles(false);
  };

  // -------------------- Register --------------------
 const handleRegister = async () => {
  // 1️⃣ Validate fields first
  if (!validateFields()) {
    console.log("Validation failed:", validationErrors);
    showAlert('Error', 'Please fix the highlighted errors.');
    return;
  }

  try {
    setLoading(true);

    // 2️⃣ Prepare body
    const body = {
      fullName, email, password, confirmPassword, mobile, familyNumber, age, experience,
      bloodGroup, aadhar, pan, esiNumber, reportingManager, department, role,
      dob: dob.toISOString().split('T')[0],
      scheduleIn: scheduleIn ? formatTime(scheduleIn) : '',
      scheduleOut: scheduleOut ? formatTime(scheduleOut) : '',
      breakIn: breakIn ? formatTime(breakIn) : '',
      breakOut: breakOut ? formatTime(breakOut) : '',
      monthlySalary, jobDescription, employmentType, category, ifsc,
      branchName, bankName, accountNumber,
      temporaryAddresses: [{ street: tempStreet, city: tempCity, state: tempState, pincode: tempPincode }],
      permanentAddresses: [{ street: permStreet, city: permCity, state: permState, pincode: permPincode }],
      dateOfJoining: dateOfJoining.toISOString().split('T')[0],
    };

    // 3️⃣ Prepare FormData
    const formData = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
      else formData.append(key, value);
    });

    // 4️⃣ Handle image correctly for Web and Native
    if (image) {
      let fileObj;
      if (Platform.OS === 'web') {
        // fetch blob for web
        const res = await fetch(image);
        const blob = await res.blob();
        fileObj = new File([blob], "profile.jpg", { type: "image/jpeg" });
      } else {
        fileObj = { uri: image, name: 'profile.jpg', type: 'image/jpeg' };
      }
      formData.append('image', fileObj);
    }

    // 5️⃣ Send POST request
    const res = await fetch('https://hospitaldatabasemanagement.onrender.com/employee/register', {
      method: 'POST',
      headers: { Accept: 'application/json' }, // Do NOT set Content-Type for FormData
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    setLoading(false);

    if (res.ok && data.success) {
      showAlert('Success', '✅ Registration Successful!');
      navigation.navigate('EmpLogin');
    } else {
      console.log('Server response:', data);
      showAlert('Error', data.message || 'Registration failed');
    }

  } catch (err) {
    setLoading(false);
    console.error('Registration error:', err);
    showAlert('Error', err.message || 'Something went wrong');
  }
};
  // Reusable Component for Input Pairs
  const GridInput = ({ label, children, error }) => (
    <View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  if (loading) return (
    <View style={styles.loader}><ActivityIndicator size="large" color="#007AFF" /><Text>Processing Registration...</Text></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.mainWrapper, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          
          {/* LEFT SECTION: FORM */}
          <View style={[styles.leftSection, { width: isLargeScreen ? '65%' : '100%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#007AFF" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Staff Registration</Text>
              <Text style={styles.subtitle}>Please fill in the professional details to create your profile.</Text>

              {/* Profile Photo */}
              <TouchableOpacity onPress={takePhoto} style={styles.photoContainer}>
                {image ? <Image source={{ uri: image }} style={styles.profileImage} /> : <Ionicons name="camera" size={30} color="#007AFF" />}
                <Text style={styles.photoLabel}>Upload Photo</Text>
              </TouchableOpacity>
              {validationErrors.image && <Text style={styles.errorText}>{validationErrors.image}</Text>}

              <View style={styles.formGrid}>
                {/* Personal Information */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput style={styles.input} placeholder="John Doe" value={fullName} onChangeText={setFullName} />
</View>
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput style={styles.input} placeholder="john@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput style={styles.input} placeholder="10-digit number" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput style={styles.input} placeholder="Emergency contact" value={familyNumber} onChangeText={setFamilyNumber} keyboardType="phone-pad" />
                </View>
{/* Experience */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput style={styles.input} placeholder="e.g. 5 years" value={experience} onChangeText={setExperience} />
</View>

{/* Age */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
</View>
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <View style={styles.passWrapper}>
                    <TextInput style={styles.passInput} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#999" /></TouchableOpacity>
                  </View>
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                   <View style={styles.passWrapper}>
                    <TextInput style={styles.passInput} secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}><Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#999" /></TouchableOpacity>
                  </View>
                </View>
{/* Date of Birth */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  {Platform.OS === 'web' ? (
    <input
      type="date"
      value={dob.toISOString().split('T')[0]}
      onChange={(e) => setDob(new Date(e.target.value))}
      style={{ padding: 12, borderRadius: 10, border: '1px solid #E9ECEF' }}
    />
  ) : (
    <TouchableOpacity style={styles.input} onPress={() => setShowDobPicker(true)}>
      <Text>{dob.toDateString()}</Text>
    </TouchableOpacity>
  )}
  {showDobPicker && Platform.OS !== 'web' && (
    <DateTimePicker
      value={dob}
      mode="date"
      display="calendar"
      onChange={handleDateChange(setDob, setShowDobPicker)}
      maximumDate={new Date()}
    />
  )}
</View>


<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <View style={styles.dropdown}><Picker selectedValue={bloodGroup} onValueChange={setBloodGroup}><Picker.Item label="Select" value="" />{bloodGroups.map(bg => <Picker.Item key={bg} label={bg} value={bg} />)}</Picker></View>
                </View>

                {/* Professional Information */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput style={styles.input} placeholder="12-digit number" value={aadhar} onChangeText={setAadhar} keyboardType="numeric" maxLength={12}/>
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput style={styles.input} placeholder="Pan Number" value={pan} onChangeText={setPan} autoCapitalize="characters" />
                </View>

                
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput style={styles.input} placeholder="ESI Number" value={esiNumber} onChangeText={setEsiNumber} />
</View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput style={styles.input} placeholder="Manager Name" value={reportingManager} onChangeText={setReportingManager} />
</View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput style={styles.input} placeholder="Street" value={tempStreet} onChangeText={setTempStreet} />
  <TextInput style={styles.input} placeholder="City" value={tempCity} onChangeText={setTempCity} />
  <TextInput style={styles.input} placeholder="State" value={tempState} onChangeText={setTempState} />
  <TextInput style={styles.input} placeholder="Pincode" value={tempPincode} onChangeText={setTempPincode} keyboardType="numeric" />
</View>


<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput style={styles.input} placeholder="Street" value={permStreet} onChangeText={setPermStreet} />
  <TextInput style={styles.input} placeholder="City" value={permCity} onChangeText={setPermCity} />
  <TextInput style={styles.input} placeholder="State" value={permState} onChangeText={setPermState} />
  <TextInput style={styles.input} placeholder="Pincode" value={permPincode} onChangeText={setPermPincode} keyboardType="numeric" />
</View>
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <View style={styles.dropdown}><Picker selectedValue={department} onValueChange={setDepartment}><Picker.Item label="Select" value="" />{departmentList.map(d => <Picker.Item key={d.id} label={d.department_name} value={d.department_name} />)}</Picker></View>
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <View style={styles.dropdown}><Picker selectedValue={role} onValueChange={setRole}><Picker.Item label="Select" value="" />{roleList.map(r => <Picker.Item key={r.id} label={r.role_name} value={r.role_name} />)}</Picker></View>
                </View>

                {/* Monthly Salary */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput
    style={styles.input}
    placeholder="Monthly Salary"
    value={monthlySalary}
    onChangeText={setMonthlySalary}
    keyboardType="numeric"
  />
</View>

{/* Employment Type */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <View style={styles.dropdown}>
    <Picker selectedValue={employmentType} onValueChange={setEmploymentType}>
      <Picker.Item label="Select Employment Type" value="" />
      {employmentTypes.map(e => (
        <Picker.Item key={e} label={e} value={e} />
      ))}
    </Picker>
  </View>
</View>

{/* Category */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <View style={styles.dropdown}>
    <Picker selectedValue={category} onValueChange={setCategory}>
      <Picker.Item label="Select Category" value="" />
      {categoryTypes.map(c => (
        <Picker.Item key={c} label={c} value={c} />
      ))}
    </Picker>
  </View>
</View>

{/* Job Description */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  <TextInput
    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
    placeholder="Job Description"
    value={jobDescription}
    onChangeText={setJobDescription}
    multiline
    numberOfLines={4}
  />
</View>


<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
  {Platform.OS === 'web' ? (
    <input
      type="date"
      value={dateOfJoining.toISOString().split('T')[0]}
      onChange={(e) => setDateOfJoining(new Date(e.target.value))}
      style={{
        padding: 12,
        borderRadius: 10,
        border: '1px solid #E9ECEF',
      }}
    />
  ) : (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowDojPicker(true)}>
        <Text>{dateOfJoining ? dateOfJoining.toDateString() : 'Select Date'}</Text>
      </TouchableOpacity>
      {showDojPicker && (
        <DateTimePicker
          value={dateOfJoining || new Date()}
          mode="date"
          display="calendar"
          onChange={handleDateChange(setDateOfJoining, setShowDojPicker)}
          maximumDate={new Date()} // Optional: prevent future dates
        />
      )}
    </>
  )}
</View>


                {/* Work Schedule */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>

    <Text style={styles.label}>Schedule In Time</Text>

  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={scheduleIn ? formatTime(scheduleIn) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh));
        d.setMinutes(parseInt(mm));
        setScheduleIn(d);
      }}
      style={{ padding: 12, borderRadius: 10, border: '1px solid #E9ECEF' }}
    />
  ) : (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowScheduleInPicker(true)}>
        <Text>{scheduleIn ? formatTime(scheduleIn) : 'Set Time'}</Text>
      </TouchableOpacity>
      {showScheduleInPicker && <DateTimePicker value={scheduleIn || new Date()} mode="time" onChange={handleTimeChange(setScheduleIn, setShowScheduleInPicker)} />}
    </>
  )}
</View>


                {/* Schedule Out */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
    <Text style={styles.label}>Schedule Out</Text>

  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={scheduleOut ? formatTime(scheduleOut) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh));
        d.setMinutes(parseInt(mm));
        setScheduleOut(d);
      }}
      style={{ padding: 12, borderRadius: 10, border: '1px solid #E9ECEF' }}
    />
  ) : (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowScheduleOutPicker(true)}>
        <Text>{scheduleOut ? formatTime(scheduleOut) : 'Set Time'}</Text>
      </TouchableOpacity>
      {showScheduleOutPicker && (
        <DateTimePicker
          value={scheduleOut || new Date()}
          mode="time"
          onChange={handleTimeChange(setScheduleOut, setShowScheduleOutPicker)}
        />
      )}
    </>
  )}
</View>

{/* Break In */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
    <Text style={styles.label}>Break In</Text>

  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={breakIn ? formatTime(breakIn) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh));
        d.setMinutes(parseInt(mm));
        setBreakIn(d);
      }}
      style={{ padding: 12, borderRadius: 10, border: '1px solid #E9ECEF' }}
    />
  ) : (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowBreakInPicker(true)}>
        <Text>{breakIn ? formatTime(breakIn) : 'Set Time'}</Text>
      </TouchableOpacity>
      {showBreakInPicker && (
        <DateTimePicker
          value={breakIn || new Date()}
          mode="time"
          onChange={handleTimeChange(setBreakIn, setShowBreakInPicker)}
        />
      )}
    </>
  )}
</View>

{/* Break Out */}
<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
    <Text style={styles.label}>Break Out</Text>

  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={breakOut ? formatTime(breakOut) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh));
        d.setMinutes(parseInt(mm));
        setBreakOut(d);
      }}
      style={{ padding: 12, borderRadius: 10, border: '1px solid #E9ECEF'}}
    />
  ) : (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowBreakOutPicker(true)}>
        <Text>{breakOut ? formatTime(breakOut) : 'Set Time'}</Text>
      </TouchableOpacity>
      {showBreakOutPicker && (
        <DateTimePicker
          value={breakOut || new Date()}
          mode="time"
          onChange={handleTimeChange(setBreakOut, setShowBreakOutPicker)}
        />
      )}
    </>
  )}
</View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="SBIN0001234" 
                    value={ifsc} 
                    onChangeText={setIfsc} 
                    autoCapitalize="characters"
                  />
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. State Bank of India" 
                    value={bankName} 
                    onChangeText={setBankName} 
                  />
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Downtown Branch" 
                    value={branchName} 
                    onChangeText={setBranchName} 
                  />
                </View>

<View style={[styles.inputWrapper, { width: isLargeScreen ? '48%' : '100%' }]}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Enter account number" 
                    value={accountNumber} 
                    onChangeText={setAccountNumber} 
                    keyboardType="numeric" 
                  />
                </View>
              </View>

             
              <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
                <Text style={styles.submitBtnText}>Add employee</Text>
              </TouchableOpacity>


            </ScrollView>
          </View>

          {/* RIGHT SECTION: BRANDING */}
          {isLargeScreen && (
            <View style={styles.rightSection}>
              <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>BM</Text></View>
              <Text style={styles.welcomeText}>Staff Portal</Text>
              <Text style={styles.welcomeSub}>Manage your profile, shift timings, and payroll securely.</Text>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mainWrapper: { flex: 1 },
  leftSection: { paddingHorizontal: '5%', paddingVertical: 40 },
  scrollContent: { maxWidth: 900, alignSelf: 'center', width: '100%' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { color: '#007AFF', marginLeft: 5, fontWeight: '600' },
  
  title: { fontSize: 32, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },

  photoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E9ECEF', marginBottom: 20, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  photoLabel: { position: 'absolute', bottom: -25, fontSize: 10, color: '#007AFF', fontWeight: 'bold' },

  formGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 10, padding: 12, fontSize: 15 },
  dropdown: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 10, overflow: 'hidden' },
  
  passWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', borderRadius: 10, paddingHorizontal: 12 },
  passInput: { flex: 1, paddingVertical: 12, fontSize: 15 },

  agreeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  agreeText: { marginLeft: 10, color: '#666' },
  errorText: { color: 'red', fontSize: 11, marginTop: 4 },

  submitBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 30, elevation: 2 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { color: '#666' },

  rightSection: { width: '35%', backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', padding: 40 },
  logoBadge: { backgroundColor: 'rgba(255,255,255,0.2)', width: 80, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  logoBadgeText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  welcomeText: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 }
});