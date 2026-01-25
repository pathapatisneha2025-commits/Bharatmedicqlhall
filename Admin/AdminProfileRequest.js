import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminProfileApprovalScreen() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/employee/pending_approve_update`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.employees || []);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch requests");
      }
    } catch (err) {
      console.log("Fetch error:", err);
      Alert.alert("Error", "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const approveRequest = async (employeeId) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/employee/approve-update/${employeeId}`, {
        method: "PUT",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === employeeId ? { ...emp, status: "approved" } : emp
          )
        );
        Alert.alert("Success", "Employee update approved");
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (err) {
      console.log("Approve error:", err);
      Alert.alert("Error", "Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.tableRow, styles.headerRow]}>
      <Text style={[styles.cell, { width: 150, fontWeight: "bold", color: "#fff" }]}>
        Name
      </Text>
      <Text style={[styles.cell, { width: 250, fontWeight: "bold", color: "#fff" }]}>
        Email
      </Text>
      <Text style={[styles.cell, { width: 120, fontWeight: "bold", color: "#fff" }]}>
        Department
      </Text>
      <Text style={[styles.cell, { width: 120, fontWeight: "bold", color: "#fff" }]}>
        Role
      </Text>
      <Text style={[styles.cell, { width: 100, fontWeight: "bold", color: "#fff" }]}>
        Status
      </Text>
      <Text style={[styles.cell, { width: 100, fontWeight: "bold", color: "#fff" }]}>
        Action
      </Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, { width: 150 }]}>{item.full_name}</Text>
      <Text style={[styles.cell, { width: 250 }]}>{item.email}</Text>
      <Text style={[styles.cell, { width: 120 }]}>{item.department}</Text>
      <Text style={[styles.cell, { width: 120 }]}>{item.role}</Text>
      <Text style={[styles.cell, { width: 100 }]}>
        {item.status === "approved" ? "✅ Approved" : "⏳ Pending"}
      </Text>
      <TouchableOpacity
        style={[
          styles.approveButton,
          {
            width: 100,
            backgroundColor: item.status === "approved" ? "#c0c0c0" : "#007BFF",
          },
        ]}
        onPress={() => approveRequest(item.id)}
        disabled={item.status === "approved"}
      >
        <Text style={styles.approveText}>Approve</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && employees.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <Text style={styles.title}>Employee Updates</Text>
      {employees.length === 0 ? (
        <Text>No requests available.</Text>
      ) : (
        <ScrollView horizontal>
          <View style={{ minWidth: 840 }}>
            {renderHeader()}
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  headerRow: {
    backgroundColor: "#007BFF",
  },
  cell: {
    fontSize: 14,
    paddingHorizontal: 5,
  },
  approveButton: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  approveText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
