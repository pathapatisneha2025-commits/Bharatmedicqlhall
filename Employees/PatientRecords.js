import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Modal,
  TextInput
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getEmployeeId } from "../utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Picker } from '@react-native-picker/picker';

const EmployeeDailyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // cash handover state
  const [cashHandovers, setCashHandovers] = useState([]);
  const [loadingHandovers, setLoadingHandovers] = useState(true);

  const [showHandover, setShowHandover] = useState(false);
  const [handoverReceiver, setHandoverReceiver] = useState('');
  const [handoverAmount, setHandoverAmount] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [allReceivers, setAllReceivers] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);  
  const [employeeName, setEmployeeName] = useState('');
  const [loadingHandover, setLoadingHandover] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isHandoverDone, setIsHandoverDone] = useState(false);
  
  const receiverId = selectedAdminId || selectedEmployeeId;

  const navigation = useNavigation();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const isDesktop = SCREEN_WIDTH > 768;
  const MAX_WIDTH = isDesktop ? 900 : 420; 
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 40;

  // LOAD BOOKINGS & CASH HANDOVERS
 useEffect(() => { 
  loadBookings(); 
  loadCashHandovers();
  fetchReceivers();
}, [isHandoverDone]); // add dependency here
 const loadBookings = async () => {
  try {
    setLoading(true);
    const employeeId = await getEmployeeId();
    if (!employeeId) { setBookings([]); return; }

    const response = await fetch(
      `https://hospitaldatabasemanagement.onrender.com/doctorbooking/employee/${employeeId}`
    );
    let data = await response.json();
    let bookingsList = Array.isArray(data) ? data : data.bookings || [];

    if (isHandoverDone) {
      const todayStr = new Date().toISOString().split("T")[0];
      bookingsList = bookingsList.filter(
        b => new Date(b.appointment_date).toISOString().split("T")[0] !== todayStr
      );
    }

    setBookings(bookingsList);

    const empRes = await fetch(`https://hospitaldatabasemanagement.onrender.com/employee/${employeeId}`);
    const empData = await empRes.json();
    setEmployeeName(empData.employee.full_name || 'Employee');
  } catch (error) {
    console.error("Error fetching bookings:", error);
    setBookings([]);
    setEmployeeName('Employee');
  } finally { setLoading(false); }
};

  // LOAD CASH HANDOVERS
  const loadCashHandovers = async () => {
    setLoadingHandovers(true);
    try {
      const employeeId = await getEmployeeId();
      if (!employeeId) { setCashHandovers([]); return; }

      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/employee/cashhandover/${employeeId}`
      );
      const data = await res.json();
      if (data.success) setCashHandovers(data.handovers || []);
      else setCashHandovers([]);
    } catch (err) {
      console.error("Error fetching cash handovers:", err);
      setCashHandovers([]);
    } finally {
      setLoadingHandovers(false);
    }
  };

  const fetchReceivers = async () => {
    try {
      const [empRes, adminRes] = await Promise.all([
        fetch('https://hospitaldatabasemanagement.onrender.com/employee/all'),
        fetch('https://hospitaldatabasemanagement.onrender.com/adminlogin/all')
      ]);

      const empData = await empRes.json();
      const adminData = await adminRes.json();

      setEmployees(empData.employees || []);
      setAdmins(adminData.admins || []);

      setAllReceivers([
        ...(empData.employees || []).map(e => ({ id: e.id, name: e.full_name, role: 'Employee' })),
        ...(adminData.admins || []).map(a => ({ id: a.id, name: a.name, role: 'Admin' })),
      ]);
    } catch (err) {
      console.error("Failed to fetch employees/admins", err);
      setEmployees([]);
      setAdmins([]);
      setAllReceivers([]);
    }
  };

  const toLocalDateOnly = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
      .toISOString().split("T")[0];
  };

  const todayStr = toLocalDateOnly(new Date());
  const { todayBookings, todayRevenue, pendingAmount } = useMemo(() => {
  if (isHandoverDone) return { todayBookings: 0, todayRevenue: 0, pendingAmount: 0 };

  const todayList = bookings.filter(
    (b) => toLocalDateOnly(b.appointment_date) === todayStr
  );
  const revenue = todayList.reduce((sum, b) => sum + Number(b.doctor_consultant_fee || 0), 0);

  const handedOver = cashHandovers
    .filter(h => toLocalDateOnly(h.handover_date) === todayStr && h.status === 'complete')
    .reduce((sum, h) => sum + Number(h.amount || 0), 0);

  const pending = revenue - handedOver;

  return { todayBookings: todayList.length, todayRevenue: revenue, pendingAmount: pending };
}, [bookings, cashHandovers, todayStr, isHandoverDone]);

  const historyDateStr = toLocalDateOnly(historyDate);
  const historyBookings = useMemo(() => {
    return bookings.filter(
      (b) => toLocalDateOnly(b.appointment_date) === historyDateStr
    );
  }, [bookings, historyDateStr]);

  const onDateChange = (event, selectedDate) => {
    setShowCalendar(Platform.OS === 'ios');
    if (selectedDate) setHistoryDate(selectedDate);
    if (Platform.OS === 'android' || Platform.OS === 'web') setShowCalendar(false);
  };

  useEffect(() => { setHandoverAmount(todayRevenue); }, [todayRevenue]);

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loaderText}>Loading Bookings...</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.mainWrapper, { width: containerWidth }]}>
        {/* HEADER */}
        <View style={styles.topNav}>
          <View>
            <Text style={styles.title}>{employeeName}'s Daily Bookings</Text>
            <Text style={styles.subtitle}>Track patient appointments and daily revenue</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F1FF' }]}>
              <Ionicons name="calendar" size={20} color="#0D6EFD" />
            </View>
            <Text style={styles.statLabel}>Today's Count</Text>
            <Text style={styles.statValue}>{todayBookings}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E7F9ED' }]}>
              <Ionicons name="wallet" size={20} color="#28A745" />
            </View>
            <Text style={styles.statLabel}>Today's Revenue</Text>
            <Text style={styles.statValue}>₹{todayRevenue}</Text>
          </View>

        <View style={styles.statCard}>
  <View style={[styles.iconCircle, { backgroundColor: '#FFF8E6' }]}>
    <Ionicons name="time-outline" size={20} color="#FFA500" />
  </View>
  <Text style={styles.statLabel}>Pending</Text>
  <Text style={styles.statValue}>₹{pendingAmount}</Text>
</View>

          <TouchableOpacity style={styles.handoverBtn} onPress={() => setShowHandover(true)}>
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text style={styles.handoverBtnText}>Handover Cash</Text>
          </TouchableOpacity>
        </View>

        {/* CALENDAR + BOOKING LIST */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Booking Logs</Text>
          <TouchableOpacity style={styles.calendarTrigger} onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={18} color="#0D6EFD" />
            <Text style={styles.calendarTriggerText}>{historyDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>

        {showCalendar && (
          Platform.OS === "web" ? (
            <View style={styles.webDateContainer}>
              <input
                type="date"
                style={styles.htmlDateInput}
                value={historyDate.toISOString().split("T")[0]}
                onChange={(e) => { setHistoryDate(new Date(e.target.value)); setShowCalendar(false); }}
              />
            </View>
          ) : (
            <DateTimePicker value={historyDate} mode="date" display="calendar" onChange={onDateChange} />
          )
        )}

        <View style={styles.listContainer}>
          {historyBookings.length === 0 ? (
            <Text style={styles.noBookings}>No records found for this date.</Text>
          ) : (
            historyBookings.map((item, idx) => (
              <View key={idx} style={styles.bookingListItem}>
                <View style={styles.itemBadge}><Text style={styles.badgeText}>APPOINTMENT</Text></View>
                <View style={styles.itemBody}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{item.patient_name}</Text>
                    <Text style={styles.doctorSubtext}>Dr. {item.doctor_name}</Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>₹{item.doctor_consultant_fee}</Text>
                  </View>
                </View>
                <View style={styles.itemFooter}>
                  <Text style={styles.dateFooter}>Date: {new Date(item.appointment_date).toDateString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* CASH HANDOVER HISTORY */}
        <View style={{ marginTop: 30 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Cash Handover History</Text>
          {loadingHandovers ? (
            <ActivityIndicator size="small" color="#0D6EFD" />
          ) : cashHandovers.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#999", marginTop: 10 }}>No handovers yet.</Text>
          ) : (
            cashHandovers.map((h) => (
              <View key={h.id} style={{
                backgroundColor: '#fff',
                padding: 15,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#F0F0F0'
              }}>
                <Text style={{ fontWeight: '700', fontSize: 14 }}>Receiver: {h.receiver_name || h.receiver}</Text>
                <Text style={{ fontSize: 13, color: '#555' }}>Amount: ₹{h.amount}</Text>
                <Text style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
                  Date: {new Date(h.handover_date).toLocaleString()}
                </Text>
<Text
  style={{
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    color: h.status === 'complete' ? '#28A745' : '#FFA500', // green for complete, orange for pending
  }}
>
  Status: {h.status === 'complete' ? 'Completed' : 'Pending'}
</Text>
              </View>
            ))
          )}
        </View>
      </View>

{/* HANDOVER MODAL */}
<Modal
  visible={showHandover}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setShowHandover(false)}
>
  <View style={styles.handoverModal}>
    <View style={styles.handoverBox}>
      <Text style={styles.handoverTitle}>Handover Cash</Text>

      {/* Admin Picker */}
      <Text style={styles.label}>Select Admin</Text>
      <Picker
        selectedValue={selectedAdminId ?? ""}
        onValueChange={(val) => {
          setSelectedAdminId(val || null);
          setSelectedEmployeeId(null); // reset employee
          if (!val) {
            setHandoverReceiver('');
            return;
          }
          const admin = admins.find(a => a.id == val); // loose equality allows string-number match
          setHandoverReceiver(admin ? admin.name : '');
        }}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}
      >
        <Picker.Item label="Select Admin" value="" />
        {admins.map(a => (
          <Picker.Item key={a.id} label={a.name} value={a.id} />
        ))}
      </Picker>

      {/* Employee Picker */}
      <Text style={styles.label}>Select Employee</Text>
      <Picker
        selectedValue={selectedEmployeeId ?? ""}
        onValueChange={(val) => {
          setSelectedEmployeeId(val || null);
          setSelectedAdminId(null); // reset admin
          if (!val) {
            setHandoverReceiver('');
            return;
          }
          const emp = employees.find(e => e.id == val); // loose equality
          setHandoverReceiver(emp ? emp.full_name : '');
        }}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}
      >
        <Picker.Item label="Select Employee" value="" />
        {employees.map(e => (
          <Picker.Item key={e.id} label={e.full_name} value={e.id} />
        ))}
      </Picker>

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={handoverAmount ? handoverAmount.toString() : ''}
        onChangeText={(val) => setHandoverAmount(Number(val))}
        keyboardType="numeric"
      />

      {/* Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: '#6c757d' }]}
          onPress={() => {
            setShowHandover(false);
            setSelectedAdminId(null);
            setSelectedEmployeeId(null);
            setHandoverReceiver('');
          }}
        >
          <Text style={styles.submitText}>Cancel</Text>
        </TouchableOpacity>

      <TouchableOpacity
  style={styles.submitBtn}
  onPress={async () => {
    if (!receiverId) {
      alert('Please select a receiver (Admin or Employee)');
      return;
    }
    if (handoverAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoadingHandover(true);

    try {
      const employeeId = await getEmployeeId();
      const response = await fetch(
        'https://hospitaldatabasemanagement.onrender.com/employee/cashhandover/add',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: receiverId,
            receiverName: handoverReceiver,
            amount: Number(handoverAmount),
            handedBy: Number(employeeId),
            date: new Date(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`Cash handed over to ${handoverReceiver} successfully`);

        // Close modal & reset selection
        setShowHandover(false);
        setSelectedAdminId(null);
        setSelectedEmployeeId(null);
        setHandoverReceiver('');
        setHandoverAmount(0);

        // Reset today's bookings
        const todayStr = new Date().toISOString().split('T')[0];
        setBookings(prev =>
          prev.filter(b => new Date(b.appointment_date).toISOString().split('T')[0] !== todayStr)
        );

        // ✅ Mark that today's handover is done, so revenue & pending reset to 0
        setIsHandoverDone(true);

        // Reload cash handovers to include the new entry
        loadCashHandovers();
      } else {
        alert(data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to hand over cash');
    } finally {
      setLoadingHandover(false);
    }
  }}
  disabled={loadingHandover}
>
  <Text style={styles.submitText}>
    {loadingHandover ? 'Processing...' : 'Submit'}
  </Text>
</TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </ScrollView>
  );
};





const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  mainWrapper: { alignSelf: "center", paddingVertical: 40, paddingHorizontal: 15 },
  
  topNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A" },
  subtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  backBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { 
    backgroundColor: '#fff', width: '31%', padding: 18, borderRadius: 15, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
handoverBtn: {
  marginTop: 12,
  backgroundColor: '#28A745',
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 10,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
handoverBtnText: {
  color: '#fff',
  fontWeight: '700',
  marginLeft: 6,
  fontSize: 13,
},
handoverModal: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},
handoverBox: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  width: '90%',
},
handoverTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
label: { fontSize: 13, fontWeight: '600', marginTop: 10, color: '#333' },
input: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  padding: 10,
  marginTop: 5,
  backgroundColor: '#fff',
},
submitBtn: { backgroundColor: '#28A745', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
submitText: { color: '#fff', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  calendarTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  calendarTriggerText: { marginLeft: 8, color: '#0D6EFD', fontWeight: '600', fontSize: 13 },

  listContainer: { width: '100%' },
  bookingListItem: { 
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, 
    borderWidth: 1, borderColor: '#F0F0F0' 
  },
  itemBadge: { backgroundColor: '#F0F7FF', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 12 },
  badgeText: { color: '#0D6EFD', fontSize: 10, fontWeight: '800' },
  itemBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#333' },
  doctorSubtext: { fontSize: 13, color: '#777', marginTop: 2 },
  priceTag: { backgroundColor: '#E7F9ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceText: { color: '#28A745', fontWeight: '700', fontSize: 14 },
  
  itemFooter: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 12 
  },
  dateFooter: { fontSize: 12, color: '#999' },
  actionText: { color: '#0D6EFD', fontWeight: '600', fontSize: 13 },

  webDateContainer: { alignSelf: 'flex-end', marginBottom: 10 },
  htmlDateInput: { padding: 8, borderRadius: 5, border: '1px solid #ddd' },
  noBookings: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#F8F9FA' },
  loaderText: { marginTop: 12, fontSize: 14, color: "#666" },
});

export default EmployeeDailyBookings;