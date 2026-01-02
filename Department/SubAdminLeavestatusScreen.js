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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SubadminLeavesScreen() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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

  // Filter leaves when search text or date changes
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
    Alert.alert("Confirm Delete", "Are you sure you want to delete this leave?", [
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
    ]);
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
<ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={[styles.header, { marginTop: 20 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.heading}>Subadmin Leaves Dashboard</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        style={[styles.searchInput, { marginTop: 15 }]}
        placeholder="Search by employee, department, or leave type..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Date Filters */}
      <View style={[styles.dateFilterContainer, { marginTop: 10 }]}>
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

      {/* Horizontal Scrollable Table */}
      <ScrollView horizontal style={{ marginTop: 15 }}>
        <View>
          {/* Table Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>
              Employee
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>
              Department
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 100 }]}>
              Type
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>
              Start Date
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>
              End Date
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 80 }]}>
              Duration
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>
              Salary Deduction
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 200 }]}>
              Reason
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 100 }]}>
              Status
            </Text>
            <Text style={[styles.cell, styles.headerCell, { width: 200 }]}>
              Actions
            </Text>
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
                <Text style={[styles.cell, { width: 120 }]}>{leave.employee_name}</Text>
                <Text style={[styles.cell, { width: 120 }]}>{leave.department}</Text>
                <Text style={[styles.cell, { width: 100 }]}>{leave.leave_type}</Text>
                <Text style={[styles.cell, { width: 120 }]}>
                  {new Date(leave.start_date).toLocaleDateString()}
                </Text>
                <Text style={[styles.cell, { width: 120 }]}>
                  {new Date(leave.end_date).toLocaleDateString()}
                </Text>
                <Text style={[styles.cell, { width: 80 }]}>{leave.leaves_duration}</Text>
                <Text style={[styles.cell, { width: 120 }]}>₹{leave.salary_deduction}</Text>
                <Text style={[styles.cell, { width: 200 }]}>{leave.reason}</Text>
                <Text
                  style={[
                    styles.cell,
                    { width: 100 },
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
                <View style={[styles.cell, { width: 200, flexDirection: "row" }]}>
                  {leave.status.toLowerCase() === "pending" && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: "#28a745" }]}
                        onPress={() => updateLeaveStatus(leave.id, "approved")}
                      >
                        <Text style={styles.actionText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: "#ffc107" }]}
                        onPress={() => updateLeaveStatus(leave.id, "rejected")}
                      >
                        <Text style={styles.actionText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#dc3545" }]}
                    onPress={() => deleteLeave(leave.id)}
                  >
                    <Text style={styles.actionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
  
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 10, marginTop: 20 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center" },
  backButton: { marginRight: 10 },
  heading: { fontSize: 20, fontWeight: "bold", flex: 1, textAlign: "center", color: "#2F80ED" },
  searchInput: {
    height: 45,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  dateFilterContainer: { flexDirection: "row", justifyContent: "space-between" },
  dateButton: {
    padding: 10,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    minWidth: 150,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    alignItems: "center",
  },
  headerRow: { backgroundColor: "#f2f2f2" },
  cell: { textAlign: "center", paddingHorizontal: 5 },
  headerCell: { fontWeight: "bold" },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});
