import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Platform,
  useWindowDimensions,KeyboardAvoidingView
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
  const [showDOJPicker, setShowDOJPicker] = useState(false);
  
const [showScheduleInPicker, setShowScheduleInPicker] = useState(false);
const [showScheduleOutPicker, setShowScheduleOutPicker] = useState(false);
const [showBreakInPicker, setShowBreakInPicker] = useState(false);
const [showBreakOutPicker, setShowBreakOutPicker] = useState(false);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };
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
  if (!agree) errors.agree = 'Accept terms';
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
    if (!validateFields()) return;
    try {
      setLoading(true);
      const body = {
        fullName, email, password, confirmPassword, mobile, familyNumber, age, experience,
        bloodGroup, aadhar, pan, esiNumber, reportingManager, department, role,
        dob: dob.toISOString().split('T')[0],
        scheduleIn: formatTime(scheduleIn),
        scheduleOut: formatTime(scheduleOut),
        breakIn: formatTime(breakIn),
        breakOut: formatTime(breakOut),
        monthlySalary, jobDescription, employmentType, category, ifsc,
        branchName, bankName, accountNumber,
        temporaryAddresses: [{ street: tempStreet, city: tempCity, state: tempState, pincode: tempPincode }],
        permanentAddresses: [{ street: permStreet, city: permCity, state: permState, pincode: permPincode }],
        dateOfJoining: dateOfJoining.toISOString().split('T')[0]
      };

      const formData = new FormData();
      Object.entries(body).forEach(([key, value]) => {
        if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
        else formData.append(key, value);
      });
      formData.append('image', { uri: image, name: 'profile.jpg', type: 'image/jpeg' });

      const res = await fetch('https://hospitaldatabasemanagement.onrender.com/employee/register', {
        method: 'POST', headers: { Accept: 'application/json' }, body: formData
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.success) {
       showAlert('Success', '✅ Registration Successful!');
        navigation.navigate('EmpLogin');
      } else showAlert('Error', data.message || 'Failed');
    } catch (err) {
      setLoading(false);
      showAlert('Error', err.message);
    }
  };

  // -------------------- UI --------------------
  return (
   <KeyboardAvoidingView
  style={{ flex: 1, backgroundColor: '#fff' }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // <--- 'height' for Android
  keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // adjust if you have a header
>
   <ScrollView contentContainerStyle={styles.container}>
    {/* <View
                                    style={[
                                      styles.mainWrapper,
                                      { width: containerWidth, alignSelf: "center", flex: 1 },
                                    ]}
                                  > */}
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={24} color="#333" />
  </TouchableOpacity>

  <Text style={styles.heading}>Employee Registration</Text>

  <TouchableOpacity onPress={takePhoto} style={styles.imagePicker}>
    {image ? (
      <Image source={{ uri: image }} style={styles.profileImage} />
    ) : (
      <Ionicons name="camera-outline" size={80} color="#1E88E5" />
    )}
  </TouchableOpacity>
  {validationErrors.image && <Text style={styles.error}>{validationErrors.image}</Text>}

  <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
  {validationErrors.fullName && <Text style={styles.error}>{validationErrors.fullName}</Text>}

  <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
  {validationErrors.email && <Text style={styles.error}>{validationErrors.email}</Text>}

  <TextInput style={styles.input} placeholder="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
  {validationErrors.mobile && <Text style={styles.error}>{validationErrors.mobile}</Text>}

  <TextInput style={styles.input} placeholder="Family Contact" value={familyNumber} onChangeText={setFamilyNumber} keyboardType="phone-pad" />
  {validationErrors.familyNumber && <Text style={styles.error}>{validationErrors.familyNumber}</Text>}

  <TextInput style={styles.input} placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
  {validationErrors.age && <Text style={styles.error}>{validationErrors.age}</Text>}

  <TextInput style={styles.input} placeholder="Experience" value={experience} onChangeText={setExperience} />
  {validationErrors.experience && <Text style={styles.error}>{validationErrors.experience}</Text>}

  <View style={styles.passwordContainer}>
    <TextInput style={styles.passwordInput} placeholder="Password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
    </TouchableOpacity>
  </View>
  {validationErrors.password && <Text style={styles.error}>{validationErrors.password}</Text>}

  <View style={styles.passwordContainer}>
    <TextInput style={styles.passwordInput} placeholder="Confirm Password" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
      <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
    </TouchableOpacity>
  </View>
  {validationErrors.confirmPassword && <Text style={styles.error}>{validationErrors.confirmPassword}</Text>}

  <TouchableOpacity style={styles.input} onPress={() => setShowDobPicker(true)}>
    <Text>{dob.toDateString()}</Text>
  </TouchableOpacity>
  {showDobPicker && <DateTimePicker value={dob} mode="date" display="calendar" onChange={handleDateChange(setDob, setShowDobPicker)} maximumDate={new Date()} />}
  {validationErrors.dob && <Text style={styles.error}>{validationErrors.dob}</Text>}

  <View style={styles.dropdown}>
    <Picker selectedValue={bloodGroup} onValueChange={setBloodGroup}>
      <Picker.Item label="Select Blood Group" value="" />
      {bloodGroups.map(bg => <Picker.Item key={bg} label={bg} value={bg} />)}
    </Picker>
  </View>
  {validationErrors.bloodGroup && <Text style={styles.error}>{validationErrors.bloodGroup}</Text>}

  <TextInput style={styles.input} placeholder="Aadhar Number" value={aadhar} onChangeText={setAadhar} keyboardType="numeric" />
  {validationErrors.aadhar && <Text style={styles.error}>{validationErrors.aadhar}</Text>}

  <TextInput style={styles.input} placeholder="PAN Number" value={pan} onChangeText={setPan} />
  {validationErrors.pan && <Text style={styles.error}>{validationErrors.pan}</Text>}

  <TextInput style={styles.input} placeholder="ESI Number" value={esiNumber} onChangeText={setEsiNumber} />
  {validationErrors.esiNumber && <Text style={styles.error}>{validationErrors.esiNumber}</Text>}

  <TextInput style={styles.input} placeholder="Reporting Manager" value={reportingManager} onChangeText={setReportingManager} />
  {validationErrors.reportingManager && <Text style={styles.error}>{validationErrors.reportingManager}</Text>}

  <Text style={styles.subheading}>Temporary Address</Text>
  <TextInput style={styles.input} placeholder="Street" value={tempStreet} onChangeText={setTempStreet} />
  {validationErrors.tempStreet && <Text style={styles.error}>{validationErrors.tempStreet}</Text>}

  <TextInput style={styles.input} placeholder="City" value={tempCity} onChangeText={setTempCity} />
  {validationErrors.tempCity && <Text style={styles.error}>{validationErrors.tempCity}</Text>}

  <TextInput style={styles.input} placeholder="State" value={tempState} onChangeText={setTempState} />
  {validationErrors.tempState && <Text style={styles.error}>{validationErrors.tempState}</Text>}

  <TextInput style={styles.input} placeholder="Pincode" value={tempPincode} onChangeText={setTempPincode} keyboardType="numeric" />
  {validationErrors.tempPincode && <Text style={styles.error}>{validationErrors.tempPincode}</Text>}

  <Text style={styles.subheading}>Permanent Address</Text>
  <TextInput style={styles.input} placeholder="Street" value={permStreet} onChangeText={setPermStreet} />
  {validationErrors.permStreet && <Text style={styles.error}>{validationErrors.permStreet}</Text>}

  <TextInput style={styles.input} placeholder="City" value={permCity} onChangeText={setPermCity} />
  {validationErrors.permCity && <Text style={styles.error}>{validationErrors.permCity}</Text>}

  <TextInput style={styles.input} placeholder="State" value={permState} onChangeText={setPermState} />
  {validationErrors.permState && <Text style={styles.error}>{validationErrors.permState}</Text>}

  <TextInput style={styles.input} placeholder="Pincode" value={permPincode} onChangeText={setPermPincode} keyboardType="numeric" />
  {validationErrors.permPincode && <Text style={styles.error}>{validationErrors.permPincode}</Text>}

  <View style={styles.dropdown}>
    <Picker selectedValue={department} onValueChange={setDepartment}>
      <Picker.Item label={loadingDeps ? 'Loading departments...' : 'Select Department'} value="" />
      {departmentList.map(d => (
        <Picker.Item key={d.id} label={d.department_name} value={d.department_name} />
      ))}
    </Picker>
  </View>
  {validationErrors.department && <Text style={styles.error}>{validationErrors.department}</Text>}

  <View style={styles.dropdown}>
    <Picker selectedValue={role} onValueChange={setRole}>
      <Picker.Item label={loadingRoles ? 'Loading roles...' : 'Select Role'} value="" />
      {roleList.map(r => (
        <Picker.Item key={r.id} label={r.role_name} value={r.role_name} />
      ))}
    </Picker>
  </View>
  {validationErrors.role && <Text style={styles.error}>{validationErrors.role}</Text>}

  <TextInput style={styles.input} placeholder="Monthly Salary" value={monthlySalary} onChangeText={setMonthlySalary} keyboardType="numeric" />
  {validationErrors.monthlySalary && <Text style={styles.error}>{validationErrors.monthlySalary}</Text>}

  <View style={styles.dropdown}>
    <Picker selectedValue={employmentType} onValueChange={setEmploymentType}>
      <Picker.Item label="Select Employment Type" value="" />
      {employmentTypes.map(e => <Picker.Item key={e} label={e} value={e} />)}
    </Picker>
  </View>
  {validationErrors.employmentType && <Text style={styles.error}>{validationErrors.employmentType}</Text>}

  <View style={styles.dropdown}>
    <Picker selectedValue={category} onValueChange={setCategory}>
      <Picker.Item label="Select Category" value="" />
      {categoryTypes.map(c => <Picker.Item key={c} label={c} value={c} />)}
    </Picker>
  </View>
  {validationErrors.category && <Text style={styles.error}>{validationErrors.category}</Text>}
  {/* Job Description */}
<TextInput
  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
  placeholder="Job Description"
  value={jobDescription}
  onChangeText={setJobDescription}
  multiline
  numberOfLines={4}
/>
{validationErrors.jobDescription && <Text style={styles.error}>{validationErrors.jobDescription}</Text>}
 {/* DOB */}
<TouchableOpacity
  style={styles.input}
  onPress={() => Platform.OS !== 'web' && setShowDobPicker(true)}
>
  {Platform.OS === 'web' ? (
    <input
      type="date"
      value={dob.toISOString().split('T')[0]}
      onChange={(e) => setDob(new Date(e.target.value))}
      style={{  padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1 }}
    />
  ) : (
    <Text>{dob.toDateString()}</Text>
  )}
</TouchableOpacity>
{showDobPicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={dob}
    mode="date"
    display="calendar"
    onChange={handleDateChange(setDob, setShowDobPicker)}
    maximumDate={new Date()}
  />
)}

{/* Schedule In */}
<TouchableOpacity
  style={styles.input}
  onPress={() => Platform.OS !== 'web' && setShowScheduleInPicker(true)}
>
  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={scheduleIn ? formatTime(scheduleIn) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh), parseInt(mm));
        setScheduleIn(d);
      }}
      style={{  padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1 }}
    />
  ) : (
    <Text>{scheduleIn ? formatTime(scheduleIn) : 'Select Schedule In'}</Text>
  )}
</TouchableOpacity>
{showScheduleInPicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={scheduleIn || new Date()}
    mode="time"
    display="spinner"
    onChange={handleTimeChange(setScheduleIn, setShowScheduleInPicker)}
  />
)}

{/* Schedule Out */}
<TouchableOpacity
  style={styles.input}
  onPress={() => Platform.OS !== 'web' && setShowScheduleOutPicker(true)}
>
  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={scheduleOut ? formatTime(scheduleOut) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh), parseInt(mm));
        setScheduleOut(d);
      }}
      style={{  padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1 }}
    />
  ) : (
    <Text>{scheduleOut ? formatTime(scheduleOut) : 'Select Schedule Out'}</Text>
  )}
</TouchableOpacity>
{showScheduleOutPicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={scheduleOut || new Date()}
    mode="time"
    display="spinner"
    onChange={handleTimeChange(setScheduleOut, setShowScheduleOutPicker)}
  />
)}

{/* Break In */}
<TouchableOpacity
  style={styles.input}
  onPress={() => Platform.OS !== 'web' && setShowBreakInPicker(true)}
>
  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={breakIn ? formatTime(breakIn) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh), parseInt(mm));
        setBreakIn(d);
      }}
      style={{ padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1 }}
    />
  ) : (
    <Text>{breakIn ? formatTime(breakIn) : 'Select Break In'}</Text>
  )}
</TouchableOpacity>
{showBreakInPicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={breakIn || new Date()}
    mode="time"
    display="spinner"
    onChange={handleTimeChange(setBreakIn, setShowBreakInPicker)}
  />
)}

{/* Break Out */}
<TouchableOpacity
  style={styles.input}
  onPress={() => Platform.OS !== 'web' && setShowBreakOutPicker(true)}
>
  {Platform.OS === 'web' ? (
    <input
      type="time"
      value={breakOut ? formatTime(breakOut) : ''}
      onChange={(e) => {
        const [hh, mm] = e.target.value.split(':');
        const d = new Date();
        d.setHours(parseInt(hh), parseInt(mm));
        setBreakOut(d);
      }}
      style={{  padding: 10, borderRadius: 8, borderColor: '#ccc', borderWidth: 1 }}
    />
  ) : (
    <Text>{breakOut ? formatTime(breakOut) : 'Select Break Out'}</Text>
  )}
</TouchableOpacity>
{showBreakOutPicker && Platform.OS !== 'web' && (
  <DateTimePicker
    value={breakOut || new Date()}
    mode="time"
    display="spinner"
    onChange={handleTimeChange(setBreakOut, setShowBreakOutPicker)}
  />
)}

{validationErrors.breakOut && <Text style={styles.error}>{validationErrors.breakOut}</Text>}
{validationErrors.breakOut && <Text style={styles.error}>{validationErrors.breakOut}</Text>}



  <TextInput style={styles.input} placeholder="IFSC" value={ifsc} onChangeText={setIfsc} />
  {validationErrors.ifsc && <Text style={styles.error}>{validationErrors.ifsc}</Text>}

  <TextInput style={styles.input} placeholder="Branch Name" value={branchName} onChangeText={setBranchName} />
  {validationErrors.branchName && <Text style={styles.error}>{validationErrors.branchName}</Text>}

  <TextInput style={styles.input} placeholder="Bank Name" value={bankName} onChangeText={setBankName} />
  {validationErrors.bankName && <Text style={styles.error}>{validationErrors.bankName}</Text>}

  <TextInput style={styles.input} placeholder="Account Number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
  {validationErrors.accountNumber && <Text style={styles.error}>{validationErrors.accountNumber}</Text>}

  <View style={styles.agreeContainer}>
    <CheckBox value={agree} onValueChange={setAgree} />
    <Text style={styles.agreeText}>I agree to the terms & conditions</Text>
  </View>
  {validationErrors.agree && <Text style={styles.error}>{validationErrors.agree}</Text>}

 <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ADD</Text>}
</TouchableOpacity>
{/* </View> */}

</ScrollView>
</KeyboardAvoidingView>

  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  subheading: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginTop: 5 },
  dropdown: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginTop: 5 },
  imagePicker: { alignSelf: 'center', marginVertical: 10 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginTop: 5 },
  passwordInput: { flex: 1, padding: 10 },
  agreeContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  agreeText: { marginLeft: 10 },
  button: { backgroundColor: '#1E88E5', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
 
    error: { color: 'red', fontSize: 13, marginTop: 2, marginBottom: 4 },

});
