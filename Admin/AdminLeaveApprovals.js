// screens/SubadminLeavesScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const navigation = useNavigation();

  // Fetch all leaves
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/leaves/all"
      );
      if (!response.ok) throw new Error("Failed to fetch leaves.");
      const result = await response.json();
      setLeaves(result.leaves || []);
      setFilteredLeaves(result.leaves || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Filter leaves
  useEffect(() => {
    const filtered = leaves.filter((leave) => {
      const matchesSearch =
        leave.employee_name.toLowerCase().includes(searchText.toLowerCase()) ||
        leave.department.toLowerCase().includes(searchText.toLowerCase()) ||
        leave.leave_type.toLowerCase().includes(searchText.toLowerCase());

      const leaveStart = new Date(leave.start_date).setHours(0, 0, 0, 0);
      const leaveEnd = new Date(leave.end_date).setHours(0, 0, 0, 0);
      const matchesStartDate = startDate
        ? leaveStart >= startDate.setHours(0, 0, 0, 0)
        : true;
      const matchesEndDate = endDate
        ? leaveEnd <= endDate.setHours(0, 0, 0, 0)
        : true;

      return matchesSearch && matchesStartDate && matchesEndDate;
    });
    setFilteredLeaves(filtered);
  }, [searchText, startDate, endDate, leaves]);

  // Update leave status
  const updateLeaveStatus = async (id, status) => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/leaves/update-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        }
      );
      if (!response.ok) throw new Error("Failed to update leave status.");
      const result = await response.json();

      setLeaves((prev) =>
        prev.map((leave) =>
          leave.id === id ? { ...leave, status: status } : leave
        )
      );

      Alert.alert("Success", result.message || `Leave ${status} successfully.`);
    } catch (error) {
      Alert.alert("Error", `Failed to ${status} leave.`);
    } finally {
      setLoading(false);
    }
  };

  // Delete leave
  const deleteLeave = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this leave?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(
                `https://hospitaldatabasemanagement.onrender.com/leaves/delete/${id}`,
                { method: "DELETE" }
              );
              if (!response.ok) throw new Error("Failed to delete leave.");
              Alert.alert("Success", "Leave deleted successfully.");
              setLeaves((prev) => prev.filter((leave) => leave.id !== id));
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading leaves...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.heading}>Admin Leaves Dashboard</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by employee, department, or leave type..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Date Filters */}
      <View style={styles.dateFilterContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Text>
            {startDate
              ? `From: ${startDate.toLocaleDateString()}`
              : "Select Start Date"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Text>
            {endDate ? `To: ${endDate.toLocaleDateString()}` : "Select End Date"}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      {/* Scrollable Table */}
      <ScrollView style={{ flex: 1 }}>
        <ScrollView horizontal>
          <View>
            {/* Table Header */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.headerCell]}>Employee</Text>
              <Text style={[styles.cell, styles.headerCell]}>Department</Text>
              <Text style={[styles.cell, styles.headerCell]}>Type</Text>
              <Text style={[styles.cell, styles.headerCell]}>Start Date</Text>
              <Text style={[styles.cell, styles.headerCell]}>End Date</Text>
              <Text style={[styles.cell, styles.headerCell]}>Duration</Text>
              <Text style={[styles.cell, styles.headerCell]}>Salary Deduction</Text>
              <Text style={[styles.cell, styles.headerCell]}>Reason</Text>
              <Text style={[styles.cell, styles.headerCell]}>Status</Text>
              <Text style={[styles.cell, styles.headerCell]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredLeaves.length === 0 ? (
              <Text
                style={{ marginTop: 20, textAlign: "center", width: "100%" }}
              >
                No leaves found.
              </Text>
            ) : (
              filteredLeaves.map((leave) => (
                <View key={leave.id} style={styles.row}>
                  <Text style={styles.cell}>{leave.employee_name}</Text>
                  <Text style={styles.cell}>{leave.department}</Text>
                  <Text style={styles.cell}>{leave.leave_type}</Text>
                  <Text style={styles.cell}>
                    {new Date(leave.start_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.cell}>
                    {new Date(leave.end_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.cell}>{leave.leaves_duration}</Text>
                  <Text style={styles.cell}>₹{leave.salary_deduction}</Text>
                  <Text style={styles.cell}>{leave.reason}</Text>
                  <Text
                    style={[
                      styles.cell,
                      {
                        color:
                          leave.status.toLowerCase() === "approved"
                            ? "green"
                            : leave.status.toLowerCase() === "rejected"
                            ? "red"
                            : "#ff9900",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {leave.status.toUpperCase()}
                  </Text>

                  {/* Actions */}
                  <View style={[styles.cell, { flexDirection: "row" }]}>
                    {leave.status.toLowerCase() === "pending" && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            { backgroundColor: "#28a745" },
                          ]}
                          onPress={() => updateLeaveStatus(leave.id, "approved")}
                        >
                          <Text style={styles.actionText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            { backgroundColor: "#ffc107" },
                          ]}
                          onPress={() => updateLeaveStatus(leave.id, "rejected")}
                        >
                          <Text style={styles.actionText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* Delete */}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#dc3545" }]}
                      onPress={() => deleteLeave(leave.id)}
                    >
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>

                    {/* View Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#007bff" },
                      ]}
                      onPress={() => {
                        setSelectedLeave(leave);
                        setModalVisible(true);
                      }}
                    >
                      <Ionicons name="eye" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>

     {/* Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setModalVisible(false)}
      >
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.modalTitle}>Leave Details</Text>

      <ScrollView style={{ maxHeight: 300 }}>
        {selectedLeave && (
          <View style={styles.modalBody}>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Employee: </Text>
              {selectedLeave.employee_name}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Department: </Text>
              {selectedLeave.department}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Type: </Text>
              {selectedLeave.leave_type}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Duration: </Text>
              {selectedLeave.leaves_duration} days
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Start: </Text>
              {new Date(selectedLeave.start_date).toLocaleDateString()}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>End: </Text>
              {new Date(selectedLeave.end_date).toLocaleDateString()}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Salary Deduction: </Text>
              ₹{selectedLeave.salary_deduction}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Reason: </Text>
              {selectedLeave.reason}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Status: </Text>
              {selectedLeave.status.toUpperCase()}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 ,marginTop:30},
  backButton: { marginRight: 12 },
  heading: { fontSize: 20, fontWeight: "bold" },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dateFilterContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minWidth: 150,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    alignItems: "center",
  },
  headerRow: {
    backgroundColor: "#007bff",
  },
  cell: {
    minWidth: 120,
    paddingHorizontal: 5,
    textAlign: "center",
  },
  headerCell: {
    color: "#fff",
    fontWeight: "bold",
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  actionButton: {
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  actionText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
 
closeButton: {
  position: "absolute",
  top: 10,
  right: 10,
  backgroundColor: "#007bff",
  width: 30,
  height: 30,
  borderRadius: 15,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
},
modalBody: {
  paddingBottom: 10,
},
detailText: {
  fontSize: 16,
  marginBottom: 8,
  color: "#333",
},
detailLabel: {
  fontWeight: "bold",
  color: "#555",
},

});
