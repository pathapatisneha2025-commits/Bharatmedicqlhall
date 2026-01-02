import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Picker,
} from 'react-native';

const SettingsScreen = () => {
  const [fullName, setFullName] = useState('John Admin');
  const [email, setEmail] = useState('john@company.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [department, setDepartment] = useState('Administration');

  const handleSaveChanges = () => {
    console.log('Changes saved:', { fullName, email, phone, department });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Settings</Text>
        <Text style={styles.subHeader}>
          Manage your account and system preferences
        </Text>

        <View style={styles.menu}>
          {['Profile', 'Notifications', 'Security', 'System', 'Email', 'Appearance', 'Localization'].map((item, index) => (
            <TouchableOpacity key={index} style={[styles.menuItem, index === 0 && styles.activeMenuItem]}>
              <Text style={[styles.menuText, index === 0 && styles.activeMenuText]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.profileContainer}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            <Picker
              selectedValue={department}
              style={styles.input}
              onValueChange={(itemValue) => setDepartment(itemValue)}
            >
              <Picker.Item label="Administration" value="Administration" />
              <Picker.Item label="HR" value="HR" />
              <Picker.Item label="IT" value="IT" />
            </Picker>
          </View>

          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePicContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB',marginTop: 30 },
  scrollContainer: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subHeader: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  menu: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 20 },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  activeMenuItem: { backgroundColor: '#E0F2FE' },
  menuText: { fontSize: 16, color: '#374151' },
  activeMenuText: { fontWeight: 'bold', color: '#1D4ED8' },
  profileContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 10 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 10, fontSize: 14 },
  profilePicContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarIcon: { fontSize: 28, color: '#6B7280' },
  uploadButton: { backgroundColor: '#3B82F6', padding: 8, borderRadius: 6, marginRight: 8 },
  uploadButtonText: { color: '#fff', fontSize: 14 },
  removeButton: { backgroundColor: '#E5E7EB', padding: 8, borderRadius: 6 },
  removeButtonText: { fontSize: 14, color: '#374151' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  cancelButton: { padding: 10, marginRight: 10 },
  cancelButtonText: { fontSize: 14, color: '#374151' },
  saveButton: { backgroundColor: '#2563EB', padding: 12, borderRadius: 6 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default SettingsScreen;
