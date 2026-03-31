import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Alert,
    Platform,
  useWindowDimensions,
StatusBar,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons,MaterialCommunityIcons } from "@expo/vector-icons";
import { getEmployeeId } from "../utils/storage";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const LeaveApplyScreen = () => {
  const navigation = useNavigation();

  const [department, setDepartment] = useState("");
  const [leaveType, setLeaveType] = useState("Sick Leave");
  const [leaveDurationType, setLeaveDurationType] = useState("fullDay");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [leaveHours, setLeaveHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [deductionLoading, setDeductionLoading] = useState(false);
  const [appliedLeaves, setAppliedLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [departmentLimits, setDepartmentLimits] = useState([]);

  const [employeeName, setEmployeeName] = useState("");
  const [empId, setEmpId] = useState(null);
  const [salaryData, setSalaryData] = useState(null);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const MAX_WIDTH = 1500;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;
const gridStyle = {
  flexDirection: SCREEN_WIDTH > 800 ? "row" : "column", // row for desktop, column for mobile
  justifyContent: "space-between",
  gap: SCREEN_WIDTH > 800 ? 20 : 0, // gap works on web
};

const columnStyle = {
  flex: 1,
  minWidth: 300, // prevent columns from shrinking too much
};
const isDesktop = SCREEN_WIDTH > 800;


  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };
  // Fetch employee details
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const storedEmpId = await getEmployeeId();
        if (!storedEmpId) return showAlert("Error", "Employee ID not found.");
        const idNum = Number(storedEmpId);
        setEmpId(idNum);

        const res = await fetch(`${BASE_URL}/employee/${idNum}`);
        const data = await res.json();

        if (data?.success && data?.employee) {
          setEmployeeName(data.employee.full_name || "");
          setDepartment(data.employee.department || "");
        } else {
          console.warn("Employee fetch response:", data);
        }
      } catch (error) {
        console.error("Fetch employee error:", error);
      }
    };
    fetchEmployee();
  }, []);

  // Auto-set current date for non-multiple-day leaves
  useEffect(() => {
    if (
      leaveDurationType === "hourly" ||
      leaveDurationType === "fullDay" ||
      leaveDurationType === "firsthalf" ||
      leaveDurationType === "secondhalf"
    ) {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
      setLeaveHours("");
    }
  }, [leaveDurationType]);

  // Calculate leave count in days
  const leaveCount = useMemo(() => {
    if (leaveDurationType === "hourly") {
      const hours = parseFloat(leaveHours) || 0;
      return +(hours / 10).toFixed(2); // 10 hours = 1 day
    } else if (leaveDurationType === "firsthalf" || leaveDurationType === "secondhalf") {
      return 0.5;
    } else if (leaveDurationType === "fullDay") {
      return 1;
    } else if (leaveDurationType === "multipleDays") {
      const s = new Date(startDate);
      const e = new Date(endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);
      const diffTime = e - s;
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1));
    }
    return 0;
  }, [leaveDurationType, leaveHours, startDate, endDate]);

  // Fetch salary deduction
 // Fetch salary deduction whenever leave duration or hours change
useEffect(() => {
  if (!empId || !employeeName) return;

  // For hourly leave, ensure hours > 0
  if (leaveDurationType === "hourly" && (!leaveHours || parseFloat(leaveHours) <= 0)) return;

  const fetchSalaryDeduction = async () => {
    setDeductionLoading(true);
    try {
      const endDateForHourly = new Date(startDate);
      if (leaveDurationType === "hourly") {
        endDateForHourly.setHours(endDateForHourly.getHours() + parseFloat(leaveHours));
      }

      const payload = {
        employeeId: empId,
        employeeName,
        leaveDuration: leaveDurationType,
        startDate: startDate.toISOString(),
        endDate: leaveDurationType === "hourly" ? endDateForHourly.toISOString() : endDate.toISOString(),
      };

      const res = await fetch(`${BASE_URL}/leaves/salary-deduction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data) {
        setSalaryData(data); // ✅ update state immediately
      }
    } catch (error) {
      console.error("Salary deduction fetch error:", error);
      setSalaryData(null);
    } finally {
      setDeductionLoading(false);
    }
  };

  fetchSalaryDeduction();
}, [empId, employeeName, leaveDurationType, leaveHours, startDate, endDate]);
const handleWebDateChange = (type, value) => {
  const date = new Date(value);

  if (type === "start") {
    setStartDate(date);

    // ✅ DESKTOP CONDITION
    if (date > endDate) {
      setEndDate(date);
    }
  } else {
    // prevent end date < start date
    if (date < startDate) {
      showAlert("Invalid Date", "End date cannot be before start date");
      return;
    }
    setEndDate(date);
  }
};


  // Fetch applied leaves
  useEffect(() => {
    if (!empId) return;
    const fetchExistingLeaves = async () => {
      try {
        const res = await fetch(`${BASE_URL}/leaves/by-employee/${empId}`);
        const data = await res.json();
        if (res.ok && data.leaves) {
          const dates = data.leaves.map(l => new Date(l.start_date).toDateString());
          setAppliedLeaves(dates);
        }
      } catch (err) {
        console.error("Fetch leaves error:", err);
      }
    };
    fetchExistingLeaves();
  }, [empId]);

  // Fetch all leaves for department calculation
  useEffect(() => {
    const fetchAllLeaves = async () => {
      try {
        const res = await fetch(`${BASE_URL}/leaves/all`);
        const data = await res.json();
        if (res.ok && data.leaves) setAllLeaves(data.leaves);
      } catch (err) {
        console.error("Fetch all leaves error:", err);
      }
    };
    fetchAllLeaves();
  }, []);

  // Fetch department limits
  useEffect(() => {
    const fetchDepartmentLimits = async () => {
      try {
        const res = await fetch(`${BASE_URL}/leavelimit/all`);
        const data = await res.json();
        setDepartmentLimits(data);
      } catch (err) {
        console.error("Failed to fetch department limits:", err);
      }
    };
    fetchDepartmentLimits();
  }, []);

// Returns true if leave can be applied without exceeding department limit



  const isDuplicateLeave = () => {
    const dateStr = startDate.toDateString();
    return appliedLeaves.includes(dateStr);
  };

// Returns department limit for the current department
const getDepartmentLimit = () => {
  if (!departmentLimits || departmentLimits.length === 0) return 0;

  // Find the limit for the employee's department
  const dept = departmentLimits.find(d => d.department === department);
  return dept ? Number(dept.max_leaves_per_day) : 0; // Adjust 'limit' if your API returns a different field
};

const getLeavesTakenForDate = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  let total = 0;

  allLeaves.forEach(l => {
    const start = new Date(l.start_date);
    const end = new Date(l.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // ✅ NO STATUS CHECK
    if (l.department === department && day >= start && day <= end) {
      if (l.leaves_duration === "hourly") {
        total += (parseFloat(l.leavestaken) || 0) / 10;
      } else if (
        l.leaves_duration === "firsthalf" ||
        l.leaves_duration === "secondhalf"
      ) {
        total += 0.5;
      } else {
        total += parseFloat(l.leavestaken) || 1;
      }
    }
  });

  return total;
};


// Checks if leave can be applied without exceeding department limit
const checkDepartmentLimit = () => {
  const limit = getDepartmentLimit();
  if (!limit || limit <= 0) return { allowed: true };

  // Multiple day leaves
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const leavesTaken = getLeavesTakenForDate(d);
    // Add leaveCount for the day (1 day for fullDay, 0.5 for half, etc)
    const currentLeaveCount = leaveDurationType === "multipleDays" ? 1 : leaveCount;

    console.log("Dept:", department, "Date:", d.toDateString(), "Taken:", leavesTaken, "Limit:", limit, "Adding:", currentLeaveCount);

    if (leavesTaken + currentLeaveCount > limit) {
      return {
        allowed: false,
        date: new Date(d),
        leavesTaken,
        limit,
      };
    }
  }

  return { allowed: true };
};




  const submitLeave = async () => {
    try {
      const payload = {
        employee_id: empId,
        employee_name: employeeName,
        department,
        leave_type: leaveType,
        start_date: startDate.toISOString(),
        end_date:
          leaveDurationType === "hourly"
            ? new Date(startDate.getTime() + parseFloat(leaveHours) * 60 * 60 * 1000).toISOString()
            : endDate.toISOString(),
        leave_hours: leaveDurationType === "hourly" ? parseFloat(leaveHours) : 0,
        reason,
        status: "Pending",
        leavestaken: leaveCount,
        leaves_duration: leaveDurationType,
        salary_deduction: salaryData?.salaryDeduction ?? 0,
        unpaid_days: leaveDurationType === "hourly" ? leaveCount : 0,
      };

      const res = await fetch(`${BASE_URL}/leaves/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
       showAlert("✅ Success", data.message || "Leave submitted successfully.");
        navigation.navigate("LeaveConfirm", { leave: data.leave });
      } else {
        showAlert("❌ Error", data.message || "Failed to submit leave");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Something went wrong while submitting leave.");
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async () => {
  try {
    setLoading(true);

    if (!empId) return showAlert("Error", "Employee ID not found.");
    if (!reason.trim()) {
      showAlert("Validation", "Please provide a reason for leave.");
      setLoading(false);
      return;
    }

    if (leaveDurationType === "hourly" && parseFloat(leaveHours) > 10) {
      showAlert("Validation", "Hourly leave cannot exceed 10 hours.");
      setLoading(false);
      return;
    }

    // Check department limits
    const deptCheck = checkDepartmentLimit();
    if (!deptCheck.allowed) {
      showAlert(
        "Department Limit Reached",
        `The department limit for ${department} is ${deptCheck.limit} per day.\nAlready ${deptCheck.leavesTaken} leave(s) taken on ${deptCheck.date.toDateString()}.`
      );
      setLoading(false);
      return;
    }

    // Check if duplicate leave
    if (isDuplicateLeave()) {
      showAlert("Duplicate Leave", "You have already applied for leave on this day.");
      setLoading(false);
      return;
    }

    // Paid leave confirmation
    const proceedWithLeave = async () => {
      await submitLeave();
      setAppliedLeaves(prev => [...prev, startDate.toDateString()]);
    };

    if (salaryData && salaryData.remainingPaidLeaves <= 0) {
      const deductionAmount = salaryData.deductionPerDay || 0;

      if (Platform.OS === "web") {
        // Web: use confirm dialog
        const confirmed = window.confirm(
          `Your paid leaves are completed.\n💰 Salary deduction of ₹${deductionAmount} will be applied for this leave.\nDo you want to continue?`
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
        await proceedWithLeave();
      } else {
        // Android/iOS: use Alert.alert with buttons
        Alert.alert(
          "Paid Leaves Completed",
          `Your paid leaves are completed.\n💰 Salary deduction of ₹${deductionAmount} will be applied for this leave.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => setLoading(false) },
            { text: "Proceed", onPress: proceedWithLeave },
          ]
        );
      }
    } else {
      await proceedWithLeave();
    }
  } catch (error) {
    console.error(error);
    showAlert("Error", "Something went wrong.");
    setLoading(false);
  }
};

const isSingleDateLeave =
  leaveDurationType === "fullDay" ||
  leaveDurationType === "firsthalf" ||
  leaveDurationType === "secondhalf";


useEffect(() => {
  const backAction = () => {
    // Instead of going back step by step, reset navigation to Sidebar/Home
    navigation.reset({
      index: 0,
      routes: [{ name: "EmpSideBar" }], // <-- replace with your sidebar/home screen name
    });
    return true; // prevents default back behavior
  };

  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    backAction
  );

  return () => backHandler.remove(); // clean up on unmount
}, []);

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading...</Text>
      </View>
    );


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={[styles.mainWrapper, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        
        {/* LEFT BRANDING PANEL (Visible on Desktop) */}
        {isDesktop && (
          <View style={styles.brandingSide}>
            <View style={styles.brandOverlay}>
              <View style={styles.heroLogoBox}>
                <Ionicons name="calendar" size={32} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>Leave{"\n"}Management</Text>
              <Text style={styles.heroSubtitle}>Hospital HR Portal</Text>
              <View style={styles.heroDivider} />
              <Text style={styles.heroDescription}>
                Submit your time-off requests, view automated salary impact calculations, and track department limits.
              </Text>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => navigation.goBack()}>
                <Text style={styles.actionBtnOutlineText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* RIGHT CONTENT FORM */}
        <View style={styles.dashboardSide}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              {!isDesktop && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                  <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.welcomeText}>Apply for Leave</Text>
                <Text style={styles.dateSubtitle}>{new Date().toDateString()}</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Employee Details</Text>
                <View style={styles.readOnlyRow}>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput style={[styles.textInput, styles.disabledInput]} value={employeeName} editable={false} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Department</Text>
                        <TextInput style={[styles.textInput, styles.disabledInput]} value={department} editable={false} />
                    </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Leave Configuration</Text>
                <View style={styles.row}>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Type of Leave</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker selectedValue={leaveType} onValueChange={setLeaveType}>
                                <Picker.Item label="Sick Leave" value="Sick Leave" />
                                <Picker.Item label="Casual Leave" value="Casual Leave" />
                                  <Picker.Item label="Emergency Leave" value="Emergency Leave" />
                                
                            </Picker>
                        </View>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Duration</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker selectedValue={leaveDurationType} onValueChange={setLeaveDurationType}>
                                <Picker.Item label="Hourly" value="hourly" />
                                               <Picker.Item label="First half" value="firsthalf" />
                                               <Picker.Item label="Second half" value="secondhalf" />
                                               <Picker.Item label="Full Day" value="fullDay" />
                                               <Picker.Item label="Multiple Days" value="multipleDays" />
                            </Picker>
                        </View>
                    </View>
                </View>
{/* Date Selection is now visible for ALL types, including Hourly */}
{/* 1. Show Date Selection for everything EXCEPT hourly */}
{leaveDurationType !== "hourly" && (
  <View style={[styles.dateGrid, { marginTop: 15 }]}>
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>
        {leaveDurationType === "multipleDays" ? "Start Date" : "Leave Date"}
      </Text>
      {Platform.OS === 'web' ? (
        <input 
          type="date" 
          value={startDate.toISOString().split('T')[0]} 
          style={styles.webDateInput} 
          onChange={(e) => handleWebDateChange('start', e.target.value)} 
        />
      ) : (
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartDatePicker(true)}>
          <Text style={styles.dateBtnText}>{startDate.toLocaleDateString()}</Text>
          <Ionicons name="calendar-outline" size={18} color="#0D6EFD" />
        </TouchableOpacity>
      )}
    </View>

    {/* End Date only for Multiple Days */}
    {leaveDurationType === "multipleDays" && (
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>End Date</Text>
        {Platform.OS === 'web' ? (
          <input 
            type="date" 
            value={endDate.toISOString().split('T')[0]}
            style={styles.webDateInput} 
            onChange={(e) => handleWebDateChange('end', e.target.value)} 
          />
        ) : (
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndDatePicker(true)}>
            <Text style={styles.dateBtnText}>{endDate.toLocaleDateString()}</Text>
            <Ionicons name="calendar-outline" size={18} color="#0D6EFD" />
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
)}

{/* 2. Show ONLY Number of Hours when Hourly is selected */}
{leaveDurationType === "hourly" && (
  <View style={{ marginTop: 15 }}>
    <Text style={styles.label}>Number of Hours</Text>
    <TextInput 
      style={styles.textInput} 
      placeholder="Enter hours (e.g. 4)" 
      keyboardType="numeric" 
      value={leaveHours} 
      onChangeText={setLeaveHours} 
    />
  </View>
)}
                <Text style={styles.label}>Reason for Request</Text>
                <TextInput style={[styles.textInput, {height: 80}]} multiline placeholder="Please explain..." value={reason} onChangeText={setReason} />
              </View>

              {/* SALARY SUMMARY CARD */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                   <MaterialCommunityIcons name="calculator-variant" size={24} color="#0D6EFD" />
                   <Text style={styles.summaryTitle}>Calculated Impact</Text>
                </View>
                {deductionLoading ? <ActivityIndicator color="#0D6EFD" /> : (
                    <View style={styles.summaryGrid}>
    {/* Leave Summary */}
    <SummaryRow label="Total Days" value={`${leaveCount} Days`} />
    <SummaryRow label="Paid Leaves" value={salaryData?.paidLeaves || "0"} />
    <SummaryRow label="Used Leaves" value={salaryData?.usedLeaves || "0"} />
    <SummaryRow label="Remaining Paid" value={salaryData?.remainingPaidLeaves || "0"} />
    
    <View style={styles.totalDivider} />
    
    {/* Financial Details */}
    <SummaryRow label="Monthly Salary" value={`₹${salaryData?.monthlySalary || "0"}`} />
    <SummaryRow label="Deduction Per Day" value={`₹${salaryData?.deductionPerDay || "0"}`} />
    {/* <SummaryRow label="Unauthorized Leaves" value={salaryData?.UnauthorizedLeaves || "0"} /> */}
    <SummaryRow label="Unpaid Days" value={salaryData?.unpaidDays || "0"} />
    <SummaryRow label="Total Penalty" value={`₹${salaryData?.totalPenalty || "0"}`} />
    
    <View style={styles.totalDivider} />
    
    {/* Final Calculation */}
    <View style={styles.totalRow}>
        <View>
            <Text style={styles.totalLabel}>Salary Deduction</Text>
            <Text style={styles.dateSubtitle}>Estimated for this request</Text>
        </View>
        <Text style={styles.totalVal}>₹{salaryData?.salaryDeduction || "0"}</Text>
    </View>
</View>
                )}
              </View>

              <View style={styles.buttonRow}>
                 <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelBtnText}>Back</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Application</Text>}
                 </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

     {showStartDatePicker && (
      <DateTimePicker
        value={startDate}
        mode="date"
        minimumDate={new Date()}
        onChange={(event, date) => {
          setShowStartDatePicker(false);
          if (!date) return;

          setStartDate(date);

          // keep end date valid
          if (date > endDate) {
            setEndDate(date);
          }
        }}
      />
    )}

    {showEndDatePicker && (
      <DateTimePicker
        value={endDate}
        mode="date"
        minimumDate={startDate}
        onChange={(event, date) => {
          setShowEndDatePicker(false);
          if (date) setEndDate(date);
        }}
      />
    )}
  </View>
);
  
};

const SummaryRow = ({label, value}) => (
    <View style={styles.summaryItem}>
        <Text style={styles.sumLabel}>{label}</Text>
        <Text style={styles.sumValText}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainWrapper: { flex: 1 },
  
  // Left Side
  brandingSide: { width: '35%', backgroundColor: '#0D6EFD', padding: 40, justifyContent: 'center' },
  brandOverlay: { maxWidth: 350, alignSelf: 'center' },
  heroLogoBox: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  heroTitle: { fontSize: 40, fontWeight: '800', color: '#fff', lineHeight: 46 },
  heroSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 10 },
  heroDivider: { height: 3, width: 40, backgroundColor: '#fff', marginVertical: 30, borderRadius: 2 },
  heroDescription: { fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 26, marginBottom: 40 },
  actionBtnOutline: { borderWidth: 1.5, borderColor: '#fff', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnOutlineText: { color: '#fff', fontWeight: '700' },

  // Right Side
  dashboardSide: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: '6%', paddingVertical: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  backCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  dateSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500' },

  formContainer: { gap: 20 },
  formSection: { backgroundColor: '#fff', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  readOnlyRow: { flexDirection: 'row', gap: 15 },
  row: { flexDirection: 'row', gap: 15 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 5 },
  textInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC', padding: 12, fontSize: 15 ,outlineStyle: "none"},
  disabledInput: { color: '#94A3B8', backgroundColor: '#F1F5F9' },
  pickerWrapper: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC', overflow: 'hidden' },
  dateGrid: { flexDirection: 'row', gap: 15 },
  datePickerBtn: { height: 50, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  dateBtnText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  webDateInput: { height: 50, border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0 12px', width: '100%', backgroundColor: '#fff', outline: 'none' },

  // Summary Card
  summaryCard: { backgroundColor: '#fff', padding: 22, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 8, borderLeftColor: '#0D6EFD' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sumLabel: { fontSize: 14, color: '#64748B' },
  sumValText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  totalDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  totalVal: { fontSize: 20, fontWeight: '900', color: '#0D6EFD' },

  buttonRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  cancelBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' },
  cancelBtnText: { fontWeight: '700', color: '#475569' },
  submitBtn: { flex: 2, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D6EFD' },
  submitBtnText: { fontWeight: '800', color: '#fff', fontSize: 16 }
});

export default LeaveApplyScreen;