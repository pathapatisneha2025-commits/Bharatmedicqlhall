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
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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

  // Fetch employee details
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const storedEmpId = await getEmployeeId();
        if (!storedEmpId) return Alert.alert("Error", "Employee ID not found.");
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
        Alert.alert("✅ Success", data.message || "Leave submitted successfully.");
        navigation.navigate("LeaveConfirm", { leave: data.leave });
      } else {
        Alert.alert("❌ Error", data.message || "Failed to submit leave");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong while submitting leave.");
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async () => {
  try {
    setLoading(true);

    if (!empId) return Alert.alert("Error", "Employee ID not found.");
    if (!reason.trim()) {
      Alert.alert("Validation", "Please provide a reason for leave.");
      setLoading(false);
      return;
    }

    if (leaveDurationType === "hourly" && parseFloat(leaveHours) > 10) {
      Alert.alert("Validation", "Hourly leave cannot exceed 10 hours.");
      setLoading(false);
      return;
    }

    // Check department limits
  const deptCheck = checkDepartmentLimit();
  if (!deptCheck.allowed) {
    Alert.alert(
      "Department Limit Reached",
      `The department limit for ${department} is ${deptCheck.limit} per day.\nAlready ${deptCheck.leavesTaken} leave(s) taken on ${deptCheck.date.toDateString()}.`
    );
    setLoading(false);
    return;
  }


    // Check if employee already applied leave for the start date
    if (isDuplicateLeave()) {
      Alert.alert("Duplicate Leave", "You have already applied for leave on this day.");
      setLoading(false);
      return;
    }

    if (salaryData && salaryData.remainingPaidLeaves <= 0) {
      const deductionAmount = salaryData.deductionPerDay || 0;
      Alert.alert(
        "Paid Leaves Completed",
        `Your paid leaves are completed.\n💰 Salary deduction of ₹${deductionAmount} will be applied for this leave.\nDo you still want to continue?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setLoading(false) },
          { text: "Proceed", onPress: submitLeave },
        ]
      );
    } else {
      await submitLeave();
      setAppliedLeaves(prev => [...prev, startDate.toDateString()]);
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Something went wrong.");
    setLoading(false);
  }
};


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
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#1976D2" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Apply for Leave</Text>

      <Text style={styles.label}>Employee Name</Text>
      <TextInput style={styles.input} value={employeeName} editable={false} />

      <Text style={styles.label}>Department</Text>
      <TextInput style={styles.input} value={department} editable={false} />

      <Text style={styles.label}>Leave Type</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={leaveType} onValueChange={setLeaveType}>
          <Picker.Item label="Sick Leave" value="Sick Leave" />
          <Picker.Item label="Casual Leave" value="Casual Leave" />
          <Picker.Item label="Emergency Leave" value="Emergency Leave" />
        </Picker>
      </View>

      <Text style={styles.label}>Leave Duration</Text>
      <View style={styles.pickerContainer}>
      <Picker
  selectedValue={leaveDurationType}
  onValueChange={(value) => {
    setLeaveDurationType(value); // triggers useEffect for deduction
  }}
>
  <Picker.Item label="Hourly" value="hourly" />
  <Picker.Item label="First half" value="firsthalf" />
  <Picker.Item label="Second half" value="secondhalf" />
  <Picker.Item label="Full Day" value="fullDay" />
  <Picker.Item label="Multiple Days" value="multipleDays" />
</Picker>

      </View>

      {/* Date Section */}
      {leaveDurationType === "multipleDays" ? (
        <>
          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowStartDatePicker(true)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text>{startDate.toDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color="#1976D2" />
            </View>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) {
                  setStartDate(date);
                  if (date > endDate) setEndDate(date);
                }
              }}
            />
          )}

          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowEndDatePicker(true)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text>{endDate.toDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color="#1976D2" />
            </View>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </>
      ) : (
        <View style={styles.input}>
          <Text>{new Date().toDateString()}</Text>
        </View>
      )}

      {leaveDurationType === "hourly" && (
        <>
          <Text style={styles.label}>Leave Hours</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter hours"
            value={leaveHours}
            onChangeText={setLeaveHours}
            keyboardType="numeric"
          />
        </>
      )}

      <Text style={styles.label}>Reason</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Reason for leave..."
        multiline
        value={reason}
        onChangeText={setReason}
      />

      <View style={styles.deductionCard}>
        {deductionLoading ? (
          <ActivityIndicator />
        ) : salaryData ? (
          <>
            <Text style={styles.deductionText}>Monthly Salary: ₹{salaryData.monthlySalary}</Text>
            <Text style={styles.deductionText}>Paid Leaves: {salaryData.paidLeaves}</Text>
            <Text style={styles.deductionText}>Used Leaves: {salaryData.usedLeaves}</Text>
            <Text style={styles.deductionText}>Remaining Paid Leaves: {salaryData.remainingPaidLeaves}</Text>
            <Text style={styles.deductionText}>Deduction Per Day: ₹{salaryData.deductionPerDay}</Text>
            <Text style={styles.deductionText}>Unauthorized Leaves: {salaryData.UnauthorizedLeaves}</Text>
            <Text style={styles.deductionText}>Unpaid Days: {salaryData.unpaidDays}</Text>
            <Text style={styles.deductionText}>Salary Deduction: ₹{salaryData.salaryDeduction}</Text>
            <Text style={styles.deductionText}>Total Penalty: ₹{salaryData.totalPenalty}</Text>
          </>
        ) : (
          <Text>No deduction data available.</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default LeaveApplyScreen;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F5F6FA", flexGrow: 1 },
  backButton: { marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#1976D2", marginBottom: 10 },
  label: { marginTop: 10, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginTop: 5, backgroundColor: "#fff" },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, marginTop: 5, backgroundColor: "#fff" },
  deductionCard: { backgroundColor: "#FFF3E0", padding: 12, borderRadius: 10, marginVertical: 15, borderWidth: 1, borderColor: "#FFB74D" },
  deductionText: { fontSize: 14, color: "#E65100", marginBottom: 5 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancelBtn: { flex: 0.45, padding: 15, borderRadius: 10, backgroundColor: "#B0BEC5", alignItems: "center" },
  submitBtn: { flex: 0.45, padding: 15, borderRadius: 10, backgroundColor: "#1976D2", alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
