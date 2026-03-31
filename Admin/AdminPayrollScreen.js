import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, TextInput, FlatList, SafeAreaView, Platform, Dimensions } from "react-native";

import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getEmployeeId } from "../utils/storage";

export default function AdminPayslipScreen() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCount, setLoadingCount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [subadminId, setSubadminId] = useState(null);
  
  const navigation = useNavigation();
const { width } = Dimensions.get("window");
const isDesktop = width > 768 || Platform.OS === "web";
 
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
  // Fetch subadmin ID
  useEffect(() => {
    const loadEmployeeId = async () => {
      const id = await getEmployeeId();
      setSubadminId(id);
    };
    loadEmployeeId();
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingCount(0);
      interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch all payslips
  useEffect(() => {
    const fetchPayslips = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://hospitaldatabasemanagement.onrender.com/payslips/all"
        );
        if (!response.ok) throw new Error("Failed to fetch payslips");
        const data = await response.json();

        const formattedData = await Promise.all(
          data.map(async (item) => {
            let latestStatus = item.status || "pending";
            try {
              const statusRes = await fetch(
                `https://hospitaldatabasemanagement.onrender.com/payslips/status/${item.employeeId}`
              );
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                latestStatus = statusData.status;
              }
            } catch (err) {
              console.log("Status fetch failed:", item.employeeId);
            }

            return {
              id: item.employeeId?.toString(),
              name: item.employee,
              designation: item.designation,
              basic: parseFloat(item.basicsalary),
              deductions: parseFloat(item.deductions),
              net: parseFloat(item.net_pay),
              status: latestStatus,
              date: item.date || "Current Month",
              pdfUrl: item.pdfUrl || "",
              year: item.year,
              month: item.month,
            };
          })
        );

        setEmployees(formattedData);
        setFilteredEmployees(formattedData);
      } catch (error) {
        showAlert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  const handleAction = async (employeeId, action) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/payslips/status/${employeeId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status.");
      
      const updatedList = employees.map((emp) =>
        emp.id === employeeId ? { ...emp, status: action } : emp
      );
      setEmployees(updatedList);
      setFilteredEmployees(updatedList);
      
      showAlert("Success", `Payslip ${action} successfully.`);
    } catch (error) {
      showAlert("Error", `Failed to ${action} payslip.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (employee) => {
    if (!employee.pdfUrl && employee.status !== "approved") return Alert.alert("Error", "PDF only available for approved payslips.");
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const url = `https://hospitaldatabasemanagement.onrender.com/payslips/pdf/${year}/${month}/${employee.id}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Failed to open PDF."));
  };

  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(text.toLowerCase()) || 
      emp.id.includes(text)
    );
    setFilteredEmployees(filtered);
  };
   const dynamicStyles = {
  mainContent: { flex: 1, padding: isDesktop ? 48 : 32 },
  searchBar: { ...styles.searchBar, width: isDesktop ? 480 : 320 },
  statsRow: { ...styles.statsRow, flexDirection: isDesktop ? 'row' : 'column' },
  tableCard: { ...styles.tableCard, minWidth: isDesktop ? 800 : 'auto' },
};

  const renderStatusBadge = (status) => {
    const config = {
      approved: { bg: "#ecfdf5", text: "#059669", label: "Approved" },
      rejected: { bg: "#fef2f2", text: "#dc2626", label: "Rejected" },
      pending: { bg: "#fffbeb", text: "#d97706", label: "Pending" }
    };
   
    const style = config[status] || config.pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
        <Text style={[styles.statusBadgeText, { color: style.text }]}>{style.label}</Text>
      </View>
    );
  };

  const renderRow = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { width: 60 }]}>#{index + 1}</Text>
      <View style={{ width: 180 }}>
        <Text style={styles.empNameText}>{item.name}</Text>
        <Text style={styles.empIdSubText}>ID: {item.id}</Text>
      </View>
      <Text style={[styles.tableCell, { width: 150 }]}>{item.designation}</Text>
      <Text style={[styles.tableCell, { width: 120, fontWeight: '700' }]}>₹{item.net.toLocaleString()}</Text>
      <View style={{ width: 120 }}>{renderStatusBadge(item.status)}</View>
      <View style={styles.actionCell}>
        {item.status === "pending" ? (
          <>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleAction(item.id, "approved")}>
              <Feather name="check" size={16} color="#16a34a" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleAction(item.id, "rejected")}>
              <Feather name="x" size={16} color="#dc2626" />
            </TouchableOpacity>
          </>
        ) : item.status === "approved" ? (
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#eff6ff', width: 80 }]} onPress={() => handleDownloadPDF(item)}>
            <Feather name="download" size={14} color="#2563eb" />
            <Text style={styles.downloadText}> PDF</Text>
          </TouchableOpacity>
        ) : (
            <Text style={styles.naText}>N/A</Text>
        )}
      </View>
    </View>
  );

  if (loading && employees.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Syncing Payroll... {loadingCount}s</Text>
      </View>
    );
  }

   return (
      <SafeAreaView style={styles.webWrapper}>
  <View style={dynamicStyles.mainContent}>
          {/* HEADER SECTION */}
          <View style={styles.contentHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBack}>
                <Ionicons name="arrow-back" size={22} color="#1e293b" />
              </TouchableOpacity>
              <View>
                <Text style={styles.mainTitle}>Payroll Dashboard</Text>
                <Text style={styles.subTitle}>Manage and authorize monthly employee payslips</Text>
              </View>
            </View>
          </View>
  
          {/* STATS OVERVIEW */}
          <View style={styles.statsRow}>
              <View style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}><Feather name="users" size={20} color="#2563eb" /></View>
                  <View><Text style={styles.statLabel}>Total Slips</Text><Text style={styles.statValue}>{employees.length}</Text></View>
              </View>
              <View style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#fffbeb' }]}><Feather name="clock" size={20} color="#d97706" /></View>
                  <View><Text style={styles.statLabel}>Pending</Text><Text style={styles.statValue}>{employees.filter(e => e.status === 'pending').length}</Text></View>
              </View>
              <View style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: '#ecfdf5' }]}><Feather name="check-circle" size={20} color="#059669" /></View>
                  <View><Text style={styles.statLabel}>Approved</Text><Text style={styles.statValue}>{employees.filter(e => e.status === 'approved').length}</Text></View>
              </View>
          </View>
  
          {/* TABLE CARD */}
          <View style={styles.tableCard}>
            <View style={styles.tableCardHeader}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput 
                  placeholder="Search employee or ID..." 
                  style={styles.searchTextInput}
                  value={searchText}
                  onChangeText={handleSearch}
                />
              </View>
            </View>
            
          {isDesktop ? (
    <View style={{ flex: 1 }}>
      <View style={styles.tableHeaderDesktop}>
        <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
        <Text style={[styles.headerCell, { flex: 2 }]}>Employee</Text>
        <Text style={[styles.headerCell, { flex: 1.5 }]}>Designation</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Net Salary</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Status</Text>
        <Text style={[styles.headerCell, { flex: 1, textAlign: "center" }]}>Actions</Text>
      </View>
  
      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.tableRowDesktop}>
            <Text style={[styles.tableCell, { flex: 0.5 }]}>#{index + 1}</Text>
  
            <View style={{ flex: 2 }}>
              <Text style={styles.empNameText}>{item.name}</Text>
              <Text style={styles.empIdSubText}>ID: {item.id}</Text>
            </View>
  
            <Text style={[styles.tableCell, { flex: 1.5 }]}>
              {item.designation}
            </Text>
  
            <Text style={[styles.tableCell, { flex: 1, fontWeight: "700" }]}>
              ₹{item.net.toLocaleString()}
            </Text>
  
            <View style={{ flex: 1 }}>
              {renderStatusBadge(item.status)}
            </View>
  
            <View style={[styles.actionCell, { flex: 1 }]}>
              {item.status === "pending" ? (
                <>
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: "#dcfce7" }]}
                    onPress={() => handleAction(item.id, "approved")}
                  >
                    <Feather name="check" size={16} color="#16a34a" />
                  </TouchableOpacity>
  
                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: "#fee2e2" }]}
                    onPress={() => handleAction(item.id, "rejected")}
                  >
                    <Feather name="x" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </>
              ) : item.status === "approved" ? (
                <TouchableOpacity
                  style={[
                    styles.iconBtn,
                    { backgroundColor: "#eff6ff", width: 90 },
                  ]}
                  onPress={() => handleDownloadPDF(item)}
                >
                  <Feather name="download" size={14} color="#2563eb" />
                  <Text style={styles.downloadText}> PDF</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.naText}>N/A</Text>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No payslips found for this criteria.
          </Text>
        }
      />
    </View>
  ) : (
    // ✅ MOBILE VIEW (keep your existing horizontal scroll)
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { width: 60 }]}>#</Text>
          <Text style={[styles.headerCell, { width: 180 }]}>Employee</Text>
          <Text style={[styles.headerCell, { width: 150 }]}>Designation</Text>
          <Text style={[styles.headerCell, { width: 120 }]}>Net Salary</Text>
          <Text style={[styles.headerCell, { width: 120 }]}>Status</Text>
          <Text style={[styles.headerCell, { width: 100, textAlign: "center" }]}>
            Actions
          </Text>
        </View>
  
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </ScrollView>
  )}
  
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    webWrapper: { flex: 1, backgroundColor: "#F8FAFC" },
    mainContent: { flex: 1, padding: 32 },
    contentHeader: { marginBottom: 24 },
    circleBack: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    mainTitle: { fontSize: 26, fontWeight: "800", color: "#1e293b" },
    subTitle: { color: "#64748b", marginTop: 4, fontSize: 14 },
  
    statsRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    statIconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    statValue: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  
    tableCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: 'hidden' },
    tableCardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#e2e8f0', width: 320 },
    searchTextInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1e293b' },
  tableHeaderDesktop: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  
  tableRowDesktop: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  
    tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
    headerCell: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
    tableRow: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
    tableCell: { fontSize: 14, color: "#334155" },
    
    empNameText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    empIdSubText: { fontSize: 11, color: '#94a3b8' },
  
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    statusBadgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    
    actionCell: { width: 100, flexDirection: "row", justifyContent: "center", gap: 8 },
    iconBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
    downloadText: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
    naText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#f8fafc' },
    loaderText: { marginTop: 12, color: '#2563eb', fontWeight: '600' },
    emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 14, width: 400 }
  });