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
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons ,Feather} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = 'https://hospitaldatabasemanagement.onrender.com';

const SubAdminAllEmpListScreen = () => {
  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;

  const [subadmins, setSubadmins] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  
  const [updatingId, setUpdatingId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSubadmin, setEditSubadmin] = useState(null);

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

 useEffect(() => {
          let interval;
          if (loading) {
            setLoadingCount(0);
            interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
          } else clearInterval(interval);
          return () => clearInterval(interval);
        }, [loading]);
const fetchSubadmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/subadmin/all`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSubadmins(data.data);
        setFiltered(data.data);
      } else {
        showAlert('Error', data.message || 'Failed to fetch subadmins');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Something went wrong while fetching subadmins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubadmins();
  }, []);

  // Search filter
  useEffect(() => {
    if (!search.trim()) setFiltered(subadmins);
    else {
      const lower = search.toLowerCase();
      setFiltered(subadmins.filter(s => s.name.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower)));
    }
  }, [search, subadmins]);

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
        showAlert('Success', data.message);
        setSubadmins(prev => prev.map(sub => sub.id === id ? { ...sub, status: data.data.status } : sub));
      } else {
        showAlert('Error', data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Something went wrong while updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteSubadmin = async (id) => {
   showAlert('Confirm', 'Are you sure you want to delete this subadmin?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/subadmin/delete/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
              showAlert('Deleted', data.message);
              setSubadmins(prev => prev.filter(sub => sub.id !== id));
            } else {
              showAlert('Error', data.message || 'Failed to delete subadmin');
            }
          } catch (error) {
            console.error(error);
            showAlert('Error', 'Something went wrong while deleting');
          }
        },
      },
    ]);
  };

  const exportToExcel = () => {
    const url = "https://hospitaldatabasemanagement.onrender.com/subadmin/export";
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  };

 const openEditModal = (sub) => {
  setEditSubadmin({
    id: sub.id,
    name: sub.name,
    email: sub.email,
    phone: sub.phone,
    joining_date: sub.joining_date ? sub.joining_date.split('T')[0] : '', // <-- safe fallback
    status: sub.status,
    password: '',
    confirm_password: '',
  });
  setModalVisible(true);
};


  const handleSaveChanges = async () => {
    try {
      const res = await fetch(`${BASE_URL}/subadmin/update/${editSubadmin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSubadmin),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('Success', data.message);
        setModalVisible(false);
        fetchSubadmins();
      } else {
        showAlert('Error', data.message || 'Failed to update subadmin');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Something went wrong while updating');
    }
  };

  return (
    <View style={styles.webWrapper}>
    
      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        <View style={styles.contentHeader}>
        <View style={styles.headerLeft}>
  <TouchableOpacity
    style={styles.backBtn}
    onPress={() => navigation.goBack()}
  >
    <Ionicons name="arrow-back" size={22} color="#1e293b" />
  </TouchableOpacity>

  <View>
    <Text style={styles.mainTitle}>SubAdmin Management</Text>
    <Text style={styles.subTitle}>
      Manage and approve sub-administrative accounts
    </Text>
  </View>
</View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={exportToExcel} style={styles.exportBtn}>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.exportBtnText}>Export Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.cardTop}>
             <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInputWeb}
                placeholder="Search by name or email..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loaderText}>Loading Data ({loadingCount}s)...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.headerCell, { width: 60 }]}>ID</Text>
                  <Text style={[styles.headerCell, { width: 180 }]}>Name</Text>
                  <Text style={[styles.headerCell, { width: 220 }]}>Email</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Phone</Text>
                  <Text style={[styles.headerCell, { width: 140 }]}>Joining Date</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Status</Text>
                  <Text style={[styles.headerCell, { width: 280, textAlign: 'center' }]}>Actions</Text>
                </View>

                <ScrollView>
                  {filtered.length === 0 ? (
                    <Text style={styles.emptyText}>No subadmins found.</Text>
                  ) : (
                    filtered.map(sub => (
                      <View key={sub.id} style={styles.tableBodyRow}>
                        <Text style={[styles.bodyCell, { width: 60 }]}>#{sub.id}</Text>
                        <Text style={[styles.bodyCell, { width: 180, fontWeight: '600' }]}>{sub.name}</Text>
                        <Text style={[styles.bodyCell, { width: 220 }]} numberOfLines={1}>{sub.email}</Text>
                        <Text style={[styles.bodyCell, { width: 140 }]}>{sub.phone}</Text>
                        <Text style={[styles.bodyCell, { width: 140 }]}>{new Date(sub.joining_date).toLocaleDateString()}</Text>
                        <View style={{ width: 120 }}>
                          <View style={[styles.statusBadge, sub.status === 'approved' ? styles.statusApproved : styles.statusPending]}>
                            <Text style={[styles.statusText, sub.status === 'approved' ? styles.statusTextApproved : styles.statusTextPending]}>
                              {sub.status || 'Pending'}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.actionCellWeb, { width: 280 }]}>
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.btnApprove, (sub.status === 'approved' || sub.status === 'cancelled') && styles.btnDisabled]} 
                            onPress={() => updateStatus(sub.id, 'approved')}
                            disabled={sub.status === 'approved' || sub.status === 'cancelled'}
                          >
                            <Text style={styles.actionBtnText}>Approve</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.btnCancel, (sub.status === 'approved' || sub.status === 'cancelled') && styles.btnDisabled]} 
                            onPress={() => updateStatus(sub.id, 'cancelled')}
                            disabled={sub.status === 'approved' || sub.status === 'cancelled'}
                          >
                            <Text style={styles.actionBtnText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.iconCircle} onPress={() => openEditModal(sub)}>
                            <Feather name="edit-2" size={16} color="#2563eb" />
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]} onPress={() => deleteSubadmin(sub.id)}>
                            <Feather name="trash-2" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* EDIT MODAL - REUSED FROM YOUR CODE */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <ScrollView style={styles.modalBox} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.modalHeader}>
                <Ionicons name="person-circle-outline" size={28} color="#2563eb" />
                <Text style={styles.modalTitle}>Edit Subadmin</Text>
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Full Name" value={editSubadmin?.name} onChangeText={(t) => setEditSubadmin({ ...editSubadmin, name: t })} />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="mail-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Email" value={editSubadmin?.email} onChangeText={(t) => setEditSubadmin({ ...editSubadmin, email: t })} />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={18} color="#2563eb" />
                <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={editSubadmin?.phone} onChangeText={(t) => setEditSubadmin({ ...editSubadmin, phone: t })} />
              </View>
              
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges}>
                  <Text style={styles.btnText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  webWrapper: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  
  // Sidebar Styles
  sidebar: { width: 260, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 24 },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  brandIcon: { width: 38, height: 38, backgroundColor: '#2563EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandLetter: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  brandTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  brandSub: { fontSize: 12, color: '#64748b', marginTop: -4 },
  sidebarMenu: { flex: 1 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 6 },
  sidebarItemActive: { backgroundColor: '#2563EB' },
  sidebarLabel: { marginLeft: 12, fontSize: 15, color: '#64748b', fontWeight: '600' },
  sidebarLabelActive: { color: '#fff' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  logoutText: { marginLeft: 12, color: '#ef4444', fontWeight: '700' },

  // Main Content Styles
  mainContent: { flex: 1, padding: 32 },
  contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b' },
  subTitle: { color: '#64748b', marginTop: 4 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  exportBtnText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  // Table Card Styles
  tableCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.02, elevation: 2, flex: 1 },
  cardTop: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, width: 350 },
  searchInputWeb: { paddingVertical: 10, marginLeft: 10, flex: 1, fontSize: 14 ,outlineStyle: "none"},

  // Table Core
  table: { padding: 0 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerCell: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  tableBodyRow: { flexDirection: 'row', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  bodyCell: { fontSize: 14, color: '#334155' },

  // Badges & Actions
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  statusApproved: { backgroundColor: '#dcfce7' },
  statusPending: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextApproved: { color: '#16a34a' },
  statusTextPending: { color: '#ef4444' },

  actionCellWeb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  btnApprove: { backgroundColor: '#22c55e' },
  btnCancel: { backgroundColor: '#ef4444' },
  btnDisabled: { backgroundColor: '#cbd5e1' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },

  // Loader & Others
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 12, color: '#64748b' },
  emptyText: { textAlign: 'center', padding: 40, color: '#94a3b8' },

  // Modal (Existing logic preserved)
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", padding: 20 },
  modalBox: { backgroundColor: "#fff", width: "100%", maxWidth: 450, borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, marginBottom: 15 },
  input: { flex: 1, height: 45, marginLeft: 10 },
  modalActions: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelModalBtn: { flex: 1, backgroundColor: '#ef4444', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
});

export default SubAdminAllEmpListScreen;