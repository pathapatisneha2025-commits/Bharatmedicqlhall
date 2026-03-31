import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { createPortal } from "react-dom";

const LOGIN_API = "https://hospitaldatabasemanagement.onrender.com/attendance/login/all";
const LOGOUT_API = "https://hospitaldatabasemanagement.onrender.com/attendance/logout/all";
const BREAK_API = "https://hospitaldatabasemanagement.onrender.com/BreakIn-attendance/employee/all";
const TASK_API = "https://hospitaldatabasemanagement.onrender.com/task/all";
const BOOKING_API_EMP = "https://hospitaldatabasemanagement.onrender.com/doctorbooking/all";
const LEAVES_API = "https://hospitaldatabasemanagement.onrender.com/leaves/all";
const STATIONARY_API = "https://hospitaldatabasemanagement.onrender.com/doctorrequest/allrequest";




const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const modules = ["Attendance History", "Break History", "Task History", "Patient Booking", "Leave History", "Employee Stationary"];
const AdminEmployeeHistory = () => {
  const [employeeList, setEmployeeList] = useState([]);
  const [loginData, setLoginData] = useState([]);
  const [logoutData, setLogoutData] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [breakData, setBreakData] = useState([]);
  const [mergedBreaks, setMergedBreaks] = useState([]);
  const [mergedTasks, setMergedTasks] = useState([]);

  const [filteredData, setFilteredData] = useState([]);
  const [filteredBreaks, setFilteredBreaks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
 const [filteredBookings, setFilteredBookings] = useState([]);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedModule, setSelectedModule] = useState("Attendance History");

  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
const [employeeBookings, setEmployeeBookings] = useState([]);
const [leaveData, setLeaveData] = useState([]);
const [filteredLeaves, setFilteredLeaves] = useState([]);
const [stationaryData, setStationaryData] = useState([]);
const [filteredStationary, setFilteredStationary] = useState([]);
  const employeeRef = useRef(null);
  const monthRef = useRef(null);
  const moduleRef = useRef(null);

  const getUnifiedId = (row) => row.employee_id ?? row.phone;
const getCompletionDuration = (createdAt, completedTime) => {
  if (!createdAt || !completedTime) return "--";

  const start = new Date(createdAt);
  const end = new Date(completedTime);

  const diffMs = end - start;

  if (diffMs <= 0) return "--";

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;

  if (days > 0) return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  return `${minutes}m`;
};
const formatTimeOnly =  (timestamp) => {
  if (!timestamp) return "--";
  return timestamp.split("T")[1].split(".")[0];
};
  // ===== Fetch Employees =====
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("https://hospitaldatabasemanagement.onrender.com/employee/all");
        const json = await res.json();
        if (json.success)
          setEmployeeList(json.employees.map(emp => ({ id: emp.id, name: emp.full_name })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  // ===== Fetch Attendance =====
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const [loginRes, logoutRes] = await Promise.all([fetch(LOGIN_API), fetch(LOGOUT_API)]);
        const loginJson = await loginRes.json();
        const logoutJson = await logoutRes.json();
        if (loginJson.success) setLoginData(loginJson.data || []);
        if (logoutJson.success) setLogoutData(logoutJson.data?.attendance?.all || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAttendance();
  }, []);

  // ===== Merge Attendance =====
  useEffect(() => {
    if (!loginData.length && !logoutData.length) return;

    const getDateOnly = ts => ts ? new Date(ts).toLocaleDateString("en-IN") : null;
    const mergedMap = {};

    loginData.forEach(login => {
      const key = `${getUnifiedId(login)}-${getDateOnly(login.timestamp)}`;
      mergedMap[key] = {
        employee_id: login.employee_id,
        name: login.full_name,
        date: getDateOnly(login.timestamp),
        checkInTime: new Date(login.timestamp).toLocaleTimeString(),
        checkOutTime: "--",
        status: "On Duty",
      };
    });

    logoutData.forEach(logout => {
      const key = `${getUnifiedId(logout)}-${getDateOnly(logout.timestamp)}`;
      if (!mergedMap[key]) {
        mergedMap[key] = {
          employee_id: logout.employee_id,
          name: logout.full_name,
          date: getDateOnly(logout.timestamp),
          checkInTime: "--",
          checkOutTime: new Date(logout.timestamp).toLocaleTimeString(),
          status: "Off Duty",
        };
      } else {
mergedMap[key].checkOutTime = formatTimeOnly(logout.timestamp);
        mergedMap[key].status = "Off Duty";
      }
    });

    const merged = Object.values(mergedMap);
    setMergedData(merged);
    setFilteredData(merged);
  }, [loginData, logoutData]);

  // ===== Fetch Break Data =====
  useEffect(() => {
    const fetchBreaks = async () => {
      try {
        const res = await fetch(BREAK_API);
        const json = await res.json();
        if (json.success) setBreakData(json.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBreaks();
  }, []);

  // ===== Merge Breaks =====
  useEffect(() => {
    if (!breakData.length) return;

    const getTimeOnly = (timestamp) => {
      if (!timestamp || timestamp === "--") return "--";
      try {
        const timePart = timestamp.split("T")[1] || timestamp.split(" ")[1];
        return timePart ? timePart.substring(0, 8) : "--";
      } catch {
        return "--";
      }
    };

    const sorted = [...breakData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const grouped = {};
    sorted.forEach((item) => {
      const empId = item.employee_id;
      if (!grouped[empId]) grouped[empId] = [];
      grouped[empId].push(item);
    });

    const merged = [];
    Object.keys(grouped).forEach(empId => {
      const logs = grouped[empId];
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        if (log.break_type === "Break In") {
          const breakOut = logs.slice(i + 1).find(l => l.break_type === "Break Out");
          merged.push({
            employee_id: empId,
            employee_name: log.user_name,
            breakInTime: getTimeOnly(log.timestamp),
            breakOutTime: breakOut ? getTimeOnly(breakOut.timestamp) : "--",
            breakInImage: log.image_url,
            breakOutImage: breakOut ? breakOut.image_url : null,
            status: breakOut ? breakOut.status : log.status,
            timestamp: log.timestamp,
          });
        }
      }
    });

    setMergedBreaks(merged);
    setFilteredBreaks(merged);
  }, [breakData]);

  // ===== Fetch Tasks once =====
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(TASK_API);
        const json = await res.json();
        if (json.success) {
        const merged = json.tasks.map(task => ({
  employee_id: task.assignto
    ?.flatMap(a => a.split(",").map(e => e.trim()))[0] || "N/A",

  employee_name: task.assignees?.[0] || "N/A",
  task_name: task.title,
  task_status: task.status,

  // 👇 NEW FIELD
  completed_duration: getCompletionDuration(
    task.created_at,
    task.completed_time
  ),

  // keep for filtering
  timestamp: task.created_at,
}));
          setMergedTasks(merged);
          setFilteredTasks(merged);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
  }, []);
  useEffect(() => {
    const fetchBookings = async () => {
      setLoadingBooking(true);
      try {
        const res = await fetch(BOOKING_API_EMP);
        const json = await res.json();
        setEmployeeBookings(json || []);
        setFilteredBookings(json || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBookings();
  }, []);
  useEffect(() => {
  const fetchLeaves = async () => {
    try {
      const res = await fetch(LEAVES_API);
      const json = await res.json();
      if (json.message === "All leaves fetched successfully.") {
        setLeaveData(json.leaves || []);
        setFilteredLeaves(json.leaves || []);
      }
    } catch (err) {
      console.error(err);
    }
  };
  fetchLeaves();
}, []);
useEffect(() => {
  const fetchStationary = async () => {
    try {
      const res = await fetch(STATIONARY_API);
      const json = await res.json();
      if (json.requests) {
        // Flatten items for easier display
       const flattened = json.requests.flatMap(req => 
  req.items.map(item => ({
    request_id: req.id,
    employee_id: req.employee_id,
    department: req.department,
    item_name: item.name || `Item ${item.item_id}`,
    quantity: item.quantity,
    status: req.status,
    created_at: req.created_at
  }))
);
setStationaryData(flattened);
setFilteredStationary(flattened);
      }
    } catch (err) {
      console.error(err);
    }
  };
  fetchStationary();
}, []);

 useEffect(() => { 
  const monthNum = selectedMonth !== "All" ? Number(selectedMonth) : null;

  // Attendance
  if (selectedModule === "Attendance History") {
    let filtered = [...mergedData];
    if (selectedEmployee !== "All") filtered = filtered.filter(i => String(i.employee_id) === String(selectedEmployee));
    if (monthNum !== null) filtered = filtered.filter(i => {
      const [day, month, year] = i.date.split("/").map(Number);
      return month - 1 === monthNum;
    });
    setFilteredData(filtered);
  }

  // Breaks
  if (selectedModule === "Break History") {
    let filtered = [...mergedBreaks];
    if (selectedEmployee !== "All") filtered = filtered.filter(i => String(i.employee_id) === String(selectedEmployee));
    if (monthNum !== null) filtered = filtered.filter(i => new Date(i.timestamp).getMonth() === monthNum);
    setFilteredBreaks(filtered);
  }

  // Tasks
  if (selectedModule === "Task History") {
    let filtered = [...mergedTasks];
    if (selectedEmployee !== "All") {
      const selectedEmpName = employeeList.find(
        e => String(e.id) === String(selectedEmployee)
      )?.name;
      filtered = filtered.filter(i =>
        i.employee_name?.toLowerCase().includes(selectedEmpName?.toLowerCase())
      );
    }
    if (monthNum !== null) filtered = filtered.filter(i => new Date(i.timestamp).getMonth() === monthNum);
    setFilteredTasks(filtered);
  }

  // Patient Bookings
  if (selectedModule === "Patient Booking") {
    let filtered = [...employeeBookings];
    if (selectedEmployee !== "All") {
      filtered = filtered.filter(b => String(b.employee_id) === String(selectedEmployee));
    }
    if (monthNum !== null) {
      filtered = filtered.filter(b => new Date(b.appointment_date || b.date).getMonth() === monthNum);
    }
    setFilteredBookings(filtered);
  }

  // Leave History
  if (selectedModule === "Leave History") {
    let filtered = [...leaveData];

    if (selectedEmployee !== "All") {
      filtered = filtered.filter(l => String(l.employee_id) === String(selectedEmployee));
    }

    if (selectedMonth !== "All") {
      const monthNum = Number(selectedMonth);
      filtered = filtered.map(l => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);

        // Calculate overlap days in selected month
        const startOfMonth = new Date(start.getFullYear(), monthNum, 1);
        const endOfMonth = new Date(start.getFullYear(), monthNum + 1, 0);

        const overlapStart = start > startOfMonth ? start : startOfMonth;
        const overlapEnd = end < endOfMonth ? end : endOfMonth;

        const timeDiff = overlapEnd - overlapStart;
        const days = timeDiff >= 0 ? Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1 : 0; 
        return { ...l, leavestaken: days };
      }).filter(l => l.leavestaken > 0); // Keep only leaves in the month
    }

    setFilteredLeaves(filtered);
  }

  // ===== Employee Stationary / Doctor Requests =====
  if (selectedModule === "Employee Stationary") {
    let filtered = [...stationaryData];

    if (selectedEmployee !== "All") {
      filtered = filtered.filter(item => String(item.employee_id) === String(selectedEmployee));
    }

    if (monthNum !== null) {
      filtered = filtered.filter(item => new Date(item.created_at).getMonth() === monthNum);
    }

    setFilteredStationary(filtered);
  }

}, [selectedEmployee, selectedMonth, selectedModule, mergedData, mergedBreaks, mergedTasks, employeeBookings, leaveData, stationaryData]);
  // ===== Reset Filter =====
  const resetFilter = () => {
    setSelectedEmployee("All");
    setSelectedMonth("All");
    setSelectedModule("Attendance History");
    setFilteredData(mergedData);
    setFilteredBreaks(mergedBreaks);
    setFilteredTasks(mergedTasks);
  };
const totalLeavesUsed = filteredLeaves.reduce((total, leave) => {
  return total + (Number(leave.leavestaken) || 0);
}, 0);
// Total Salary Deduction for selected employee & month
const maxSalaryDeduction = Math.max(
  ...filteredLeaves.map(leave => parseFloat(leave.salary_deduction) || 0)
);

  // ===== Dropdown Component =====
  const Dropdown = ({ items, selected, onSelect, parentRef }) => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const rect = parentRef?.current?.getBoundingClientRect();
      return createPortal(
        <div style={{
          position: "absolute",
          top: rect ? rect.bottom + window.scrollY : 0,
          left: rect ? rect.left + window.scrollX : 0,
          width: rect?.width || 200,
          maxHeight: 200,
          overflowY: "auto",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: 8,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          zIndex: 9999
        }}>
          {items.map(item => (
            <div key={item.key.toString()} style={{
              padding: 10,
              borderBottom: "1px solid #eee",
              fontWeight: item.value === selected ? "700" : "400",
              cursor: "pointer"
            }} onClick={() => onSelect(item.value)}>{item.label}</div>
          ))}
        </div>, document.body
      );
    }

    return (
      <View style={styles.dropdownListWrapper}>
        <ScrollView style={styles.dropdownList}>
          {items.map(item => (
            <TouchableOpacity key={item.key.toString()} onPress={() => onSelect(item.value)}>
              <Text style={[styles.dropdownItem, item.value === selected && { fontWeight: "700" }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ===== Table Renderers =====
  const renderAttendanceTable = () => (
    <View style={styles.tableContainer}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.headerCell]}>Employee</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Date</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Status</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Check In</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Check Out</Text>
      </View>
      {filteredData.length === 0 ? (
        <Text style={{ padding: 10, textAlign: "center" }}>No records found</Text>
      ) : (
        filteredData.map((item, index) => (
          <View key={index} style={[styles.tableRow, index % 2 === 0 && { backgroundColor: "#f1f5f9" }]}>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{item.date}</Text>
            <Text style={styles.tableCell}>{item.status}</Text>
            <Text style={styles.tableCell}>{item.checkInTime}</Text>
            <Text style={styles.tableCell}>{item.checkOutTime}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderTaskTable = () => (
    <View style={styles.tableContainer}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.headerCell]}>Employee</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Task</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Status</Text>
<Text style={[styles.tableCell, styles.headerCell]}>Completed Time</Text>      </View>
      {filteredTasks.length === 0 ? (
        <Text style={{ padding: 10, textAlign: "center" }}>No records found</Text>
      ) : (
        filteredTasks.map((item, idx) => (
          <View key={idx} style={[styles.tableRow, idx % 2 === 0 && { backgroundColor: "#f1f5f9" }]}>
            <Text style={styles.tableCell}>{item.employee_name}</Text>
            <Text style={styles.tableCell}>{item.task_name}</Text>
            <Text style={styles.tableCell}>{item.task_status}</Text>
<Text style={styles.tableCell}>
  {item.completed_duration}
</Text>          </View>
        ))
      )}
    </View>
  );

  const renderBookingTable = () => (
  <View style={styles.tableContainer}>
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.tableCell, styles.headerCell]}>Date</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Patient</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Service</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Fee</Text>
    </View>
    {loadingBooking ? (
      <Text style={{ padding: 10, textAlign: "center" }}>Loading...</Text>
    ) : filteredBookings.length === 0 ? (
      <Text style={{ padding: 10, textAlign: "center" }}>No bookings found</Text>
    ) : (
      filteredBookings.map((b, idx) => (
        <View key={idx} style={[styles.tableRow, idx % 2 === 0 && { backgroundColor:"#f1f5f9" }]}>
          <Text style={styles.tableCell}>{new Date(b.appointment_date || b.date).toLocaleDateString()}</Text>
          <Text style={styles.tableCell}>{b.patient_name}</Text>
          <Text style={styles.tableCell}>{b.specialization}</Text>
          <Text style={styles.tableCell}>₹{b.doctor_consultant_fee}</Text>
        </View>
      ))
    )}
  </View>
);
const renderLeaveTable = () => (
  <View style={styles.tableContainer}>
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.tableCell, styles.headerCell]}>Employee</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Type</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Start</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>End</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Duration</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Status</Text>
    </View>
    {filteredLeaves.length === 0 ? (
      <Text style={{ padding: 10, textAlign: "center" }}>No leaves found</Text>
    ) : filteredLeaves.map((l, idx) => {
      let displayStatus = l.leaves_duration;
      let statusColor = "#000"; // default black

      // Map leave duration to display text and color
      switch(l.leaves_duration){
        case "fullDay":
          displayStatus = "Absent (On Leave Fullday)";
          statusColor = "#EF4444"; // red
          break;
        case "multipleDays":
          displayStatus = "Absent (Multi-Day Leave)";
          statusColor = "#EF4444"; // red
          break;
        case "firsthalf":
          displayStatus = "Present (Leave 1st Half)";
          statusColor = "#22C55E"; // green
          break;
        case "secondhalf":
          displayStatus = "Present (Leave 2nd Half)";
          statusColor = "#22C55E"; // green
          break;
        case "hourly":
          displayStatus = "Present (Hourly Leave)";
          statusColor = "#22C55E"; // green
          break;
        default:
          statusColor = "#000"; // black
      }

      return (
        <View key={idx} style={[styles.tableRow, idx % 2 === 0 && { backgroundColor: "#f1f5f9" }]}>
          <Text style={styles.tableCell}>{l.employee_name}</Text>
          <Text style={styles.tableCell}>{l.leave_type}</Text>
          <Text style={styles.tableCell}>{new Date(l.start_date).toLocaleDateString()}</Text>
          <Text style={styles.tableCell}>{new Date(l.end_date).toLocaleDateString()}</Text>
          <Text style={styles.tableCell}>{l.leavestaken} days</Text>
          <Text style={[styles.tableCell, { color: statusColor }]}>{displayStatus}</Text>
        </View>
      );
    })}
  </View>
);


const renderStationaryTable = () => (
  <ScrollView horizontal style={{ marginTop: 10 }}>
    <View style={{ minWidth: 800 }}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.headerCell]}>Employee</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Department</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Item</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Quantity</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Status</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Requested On</Text>
      </View>
      {filteredStationary.length === 0 ? (
        <Text style={{ padding: 10, textAlign: "center" }}>No records found</Text>
      ) : (
        filteredStationary.map((item, idx) => {
          let statusColor = "#000";
          if(item.status === "approved") statusColor = "#22C55E"; // green
          else if(item.status === "rejected") statusColor = "#EF4444"; // red
          else if(item.status === "pending") statusColor = "#F59E0B"; // orange

          return (
            <View key={idx} style={[styles.tableRow, idx % 2 === 0 && { backgroundColor: "#f1f5f9" }]}>
              <Text style={styles.tableCell}>{item.employee_name || item.employee_id}</Text>
              <Text style={styles.tableCell}>{item.department}</Text>
              <Text style={styles.tableCell}>{item.item_name}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { color: statusColor }]}>{item.status}</Text>
              <Text style={styles.tableCell}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          );
        })
      )}
    </View>
  </ScrollView>
);
  const renderBreakTable = () => (
    <ScrollView horizontal style={{ marginTop: 10 }}>
      <View style={{ minWidth: 900 }}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.headerCell]}>S.No</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Employee</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Break In</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Break Out</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Status</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Break In Image</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Break Out Image</Text>
        </View>
        {filteredBreaks.length === 0 ? (
          <Text style={{ padding: 10, textAlign: "center" }}>No records found</Text>
        ) : (
          filteredBreaks.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 0 && { backgroundColor: "#f1f5f9" }]}>
              <Text style={styles.tableCell}>{idx + 1}</Text>
              <Text style={styles.tableCell}>{item.employee_name}</Text>
              <Text style={styles.tableCell}>{item.breakInTime}</Text>
              <Text style={styles.tableCell}>{item.breakOutTime}</Text>
              <Text style={styles.tableCell}>{item.status}</Text>
              <View style={{ width: 50, height: 50 }}>
                {item.breakInImage && <Image source={{ uri: item.breakInImage }} style={{ width:50, height:50 }} />}
              </View>
              <View style={{ width: 50, height: 50 }}>
                {item.breakOutImage && <Image source={{ uri: item.breakOutImage }} style={{ width:50, height:50 }} />}
              </View>
            </View>
          ))
        )}
      </View>

      
    </ScrollView>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Filter Records</Text>
      <View style={styles.filterContainer}>
        {/* Employee Dropdown */}
        <View style={styles.filterItem} ref={employeeRef}>
          <Text style={styles.label}>Employee</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}>
            <Text>{selectedEmployee === "All" ? "All Employees" : employeeList.find(e => e.id === selectedEmployee)?.name}</Text>
          </TouchableOpacity>
          {showEmployeeDropdown && <Dropdown
            items={[{ key:"all", label:"All Employees", value:"All" }, ...employeeList.map(emp=>({ key:`emp-${emp.id}`, label:emp.name, value:emp.id }))]}
            selected={selectedEmployee}
            onSelect={val => { setSelectedEmployee(val); setShowEmployeeDropdown(false); }}
            parentRef={employeeRef}
          />}
        </View>

        {/* Month Dropdown */}
        <View style={styles.filterItem} ref={monthRef}>
          <Text style={styles.label}>Month</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowMonthDropdown(!showMonthDropdown)}>
            <Text>{selectedMonth === "All" ? "All Months" : months[selectedMonth]}</Text>
          </TouchableOpacity>
          {showMonthDropdown && <Dropdown
            items={[{ key:"all", label:"All Months", value:"All" }, ...months.map((m,i)=>({ key:`month-${i}`, label:m, value:i }))]}
            selected={selectedMonth}
            onSelect={val => { setSelectedMonth(val); setShowMonthDropdown(false); }}
            parentRef={monthRef}
          />}
        </View>

        {/* Module Dropdown */}
        <View style={styles.filterItem} ref={moduleRef}>
          <Text style={styles.label}>Module</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowModuleDropdown(!showModuleDropdown)}>
            <Text>{selectedModule}</Text>
          </TouchableOpacity>
          {showModuleDropdown && <Dropdown
            items={modules.map((m,i)=>({ key:`module-${i}`, label:m, value:m }))}
            selected={selectedModule}
            onSelect={val => { setSelectedModule(val); setShowModuleDropdown(false); }}
            parentRef={moduleRef}
          />}
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
          <Feather name="refresh-ccw" size={16} color="#fff" />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>
       {selectedModule === "Leave History" && (
  <View style={{ marginBottom: 10, padding: 10, backgroundColor: "#e0f2fe", borderRadius: 8 }}>
    <Text style={{ fontWeight: "700", fontSize: 14 }}>
      Total Leaves Used: {totalLeavesUsed} days
    </Text>
    <Text style={{ fontWeight: "700", fontSize: 14 }}>
  Total Salary Deduction: ₹{maxSalaryDeduction.toFixed(2)}
</Text>
  </View>
)}
{selectedModule === "Attendance History" ? renderAttendanceTable() :
 selectedModule === "Break History" ? renderBreakTable() :
 selectedModule === "Task History" ? renderTaskTable() :
 selectedModule === "Patient Booking" ? renderBookingTable() :
 selectedModule === "Leave History" ? renderLeaveTable() :
 selectedModule === "Employee Stationary" ? renderStationaryTable() :
 null} 
 </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:"#F8FAFC" },
  title:{ fontSize:22, fontWeight:"800", marginBottom:20 },
  filterContainer:{ backgroundColor:"#fff", padding:16, borderRadius:16, marginBottom:20, gap:12, overflow:"visible" },
  filterItem:{ marginBottom:10, position:"relative" },
  label:{ fontSize:12, fontWeight:"700", marginBottom:5, color:"#64748B" },
  dropdown:{ backgroundColor:"#F1F5F9", borderRadius:10, padding:10 },
  dropdownListWrapper:{ position:"absolute", width:"100%", maxHeight:200, backgroundColor:"#fff", borderRadius:8, borderWidth:1, borderColor:"#ddd", marginTop:4, zIndex:999 },
  dropdownList:{ maxHeight:200 },
  dropdownItem:{ padding:10 },
  resetBtn:{ flexDirection:"row", backgroundColor:"#ef4444", padding:12, borderRadius:10, justifyContent:"center", alignItems:"center", marginTop:10 },
  resetText:{ color:"#fff", marginLeft:6, fontWeight:"700" },

  // Table
  tableContainer:{ borderRadius:12, overflow:"hidden", marginBottom:20, borderWidth:1, borderColor:"#ddd" },
  tableRow:{ flexDirection:"row", paddingVertical:10, paddingHorizontal:5, alignItems:"center" },
  tableHeader:{ backgroundColor:"#2563EB" },
  tableCell:{ flex:1, textAlign:"center", fontSize:12, padding:4 },
  headerCell:{ color:"#fff", fontWeight:"700" },
});

export default AdminEmployeeHistory;