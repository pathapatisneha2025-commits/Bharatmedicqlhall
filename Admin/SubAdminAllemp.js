import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Linking } from "react-native";

const BASE_URL = 'https://hospitaldatabasemanagement.onrender.com';

const SubAdminAllEmpListScreen = () => {
  const navigation = useNavigation();
  const [subadmins, setSubadmins] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSubadmin, setEditSubadmin] = useState(null);

  // Fetch all subadmins
  const fetchSubadmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/subadmin/all`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSubadmins(data.data);
        setFiltered(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch subadmins');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while fetching subadmins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubadmins();
  }, []);

  // Search filter
  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(subadmins);
    } else {
      const lower = search.toLowerCase();
      const results = subadmins.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.email.toLowerCase().includes(lower)
      );
      setFiltered(results);
    }
  }, [search, subadmins]);

  // Update status
  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${BASE_URL}/subadmin/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id.toString(), status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Success', data.message);
        setSubadmins((prev) =>
          prev.map((sub) =>
            sub.id === id ? { ...sub, status: data.data.status } : sub
          )
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete subadmin
  const deleteSubadmin = async (id) => {
    Alert.alert('Confirm', 'Are you sure you want to delete this subadmin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/subadmin/delete/${id}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (res.ok && data.success) {
              Alert.alert('Deleted', data.message);
              setSubadmins((prev) => prev.filter((sub) => sub.id !== id));
            } else {
              Alert.alert('Error', data.message || 'Failed to delete subadmin');
            }
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong while deleting');
          }
        },
      },
    ]);
  };
  const exportToExcel = () => {
  const url = "https://hospitaldatabasemanagement.onrender.com/subadmin/export";

  Alert.alert(
    "Export CSV",
    "The file will open in your browser for download.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Download", onPress: () => Linking.openURL(url) }
    ]
  );
};


  // Open edit modal
  const openEditModal = (sub) => {
    setEditSubadmin({
      id: sub.id,
      name: sub.name,
      email: sub.email,
      phone: sub.phone,
      joining_date: sub.joining_date.split('T')[0],
      status: sub.status,
      password: '',
      confirm_password: '',
    });
    setModalVisible(true);
  };

  // Save changes
  const handleSaveChanges = async () => {
    try {
      const res = await fetch(`${BASE_URL}/subadmin/update/${editSubadmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSubadmin),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('Success', data.message);
        setModalVisible(false);
        fetchSubadmins();
      } else {
        Alert.alert('Error', data.message || 'Failed to update subadmin');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong while updating');
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
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.header}>SubAdmin List</Text>
        <View style={{ width: 24 }} />
<TouchableOpacity onPress={exportToExcel} style={{ padding: 4 }}>
  <Ionicons name="download-outline" size={26} color="#2563eb" />
</TouchableOpacity>


      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#6b7280" />
        <TextInput
          placeholder="Search by name or email..."
          placeholderTextColor="#000"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Table */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell, { minWidth: 60 }]}>ID</Text>
              <Text style={[styles.cell, styles.headerCell, { minWidth: 150 }]}>Name</Text>
              <Text style={[styles.cell, styles.headerCell, { minWidth: 220 }]}>Email</Text>
              <Text style={[styles.cell, styles.headerCell, { minWidth: 150 }]}>Phone</Text>
              <Text style={[styles.cell, styles.headerCell, { minWidth: 180 }]}>Joining Date</Text>
              <Text style={[styles.cell, styles.headerCell, { minWidth: 150 }]}>Status</Text>
              <Text style={[styles.cell, styles.headerCell, { minWidth: 300 }]}>Actions</Text>
            </View>

            {/* DATA ROWS */}
            {filtered.map((sub) => {
              
              const isDisabled = updatingId === sub.id;  // FIXED ⭐

              return (
                <View key={sub.id} style={styles.row}>
                  <Text style={[styles.cell, { minWidth: 60 }]}>{sub.id}</Text>
                  <Text style={[styles.cell, { minWidth: 150 }]}>{sub.name}</Text>
                  <Text style={[styles.cell, { minWidth: 220 }]}>{sub.email}</Text>
                  <Text style={[styles.cell, { minWidth: 150 }]}>{sub.phone}</Text>
                  <Text style={[styles.cell, { minWidth: 180 }]}>
                    {new Date(sub.joining_date).toLocaleDateString()}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      { minWidth: 150, color: sub.status === 'approved' ? '#16a34a' : '#dc2626' },
                    ]}
                  >
                    {sub.status || 'Pending'}
                  </Text>

                  {/* ACTION BUTTONS */}
                  <View style={[styles.cell, styles.actionCell, { minWidth: 300 }]}>

                    {/* APPROVE */}
                    <TouchableOpacity
                      style={[styles.button, styles.approveBtn, 
                        (sub.status === 'approved' || sub.status === 'cancelled') && styles.disabledButton
                      ]}
                      onPress={() => updateStatus(sub.id, 'approved')}
                      disabled={sub.status === 'approved' || sub.status === 'cancelled'}
                    >
                      <Text style={styles.btnText}>Approve</Text>
                    </TouchableOpacity>

                    {/* CANCEL */}
                    <TouchableOpacity
                      style={[styles.button, styles.cancelBtn, 
                        (sub.status === 'approved' || sub.status === 'cancelled') && styles.disabledButton
                      ]}
                      onPress={() => updateStatus(sub.id, 'cancelled')}
                      disabled={sub.status === 'approved' || sub.status === 'cancelled'}
                    >
                      <Text style={styles.btnText}>Cancel</Text>
                    </TouchableOpacity>

                    {/* EYE (VIEW) */}
                   <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(sub)}>
  <Ionicons name="eye-outline" size={22} color="#2563eb" />
</TouchableOpacity>


                    {/* EDIT (NEVER DISABLED) */}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(sub)}>
                      <Ionicons name="create-outline" size={22} color="#2563eb" />
                    </TouchableOpacity>

                    {/* DELETE (NEVER DISABLED) */}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => deleteSubadmin(sub.id)}>
                      <Ionicons name="trash-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Ionicons name="person-circle-outline" size={28} color="#2563eb" />
              <Text style={styles.modalTitle}>Edit Subadmin</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={18} color="#2563eb" />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={editSubadmin?.name}
                  onChangeText={(t) => setEditSubadmin({ ...editSubadmin, name: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons name="mail-outline" size={18} color="#2563eb" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={editSubadmin?.email}
                  onChangeText={(t) => setEditSubadmin({ ...editSubadmin, email: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={18} color="#2563eb" />
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  value={editSubadmin?.phone}
                  onChangeText={(t) => setEditSubadmin({ ...editSubadmin, phone: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                <TextInput
                  style={styles.input}
                  placeholder="Joining Date"
                  value={editSubadmin?.joining_date}
                  onChangeText={(t) => setEditSubadmin({ ...editSubadmin, joining_date: t })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges}>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

export default SubAdminAllEmpListScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
    marginTop: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  backButton: { padding: 4 },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'center',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  table: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    minWidth: 1200,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    alignItems: 'center',
  },
  headerRow: { backgroundColor: '#2563eb' },
  cell: { paddingHorizontal: 6, fontSize: 13, textAlign: 'center' },
  headerCell: { color: '#fff', fontWeight: 'bold' },
  actionCell: { flexDirection: 'row', justifyContent: 'space-around' },

  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  approveBtn: { backgroundColor: '#22c55e' },
  cancelBtn: { backgroundColor: '#ef4444' },
  disabledButton: { backgroundColor: '#94a3b8' },

  iconBtn: { paddingHorizontal: 4 },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    width: '95%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2563eb', marginLeft: 6 },
  inputGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  input: { flex: 1, height: 40 },
  modalActions: { flexDirection: 'row', marginTop: 16 },
  saveBtn: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 8,
  },
  cancelModalBtn: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 8,
  },
});
