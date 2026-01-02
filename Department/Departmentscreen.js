import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView 
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const DepartmentScreen = () => {
  const navigation = useNavigation();
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/department/all`);
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  // Fetch department by ID (optional usage)
  const fetchDepartmentById = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/department/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert("Error", "Failed to fetch department by ID");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Add or Update Department
  const handleAddOrUpdate = async () => {
    if (!departmentName.trim()) {
      Alert.alert("Validation", "Please enter a department name");
      return;
    }

    setLoading(true);
    try {
      if (editIndex !== null) {
        // Update department
        const departmentId = departments[editIndex].id;
        const response = await fetch(`${BASE_URL}/department/update/${departmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_name: departmentName }),
        });

        if (response.ok) {
          Alert.alert("Success", "Department updated successfully");
          fetchDepartments();
          setEditIndex(null);
        } else {
          Alert.alert("Error", "Failed to update department");
        }
      } else {
        // Add department
        const response = await fetch(`${BASE_URL}/department/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department_name: departmentName }),
        });

        if (response.ok) {
          Alert.alert("Success", "Department added successfully");
          fetchDepartments();
        } else {
          Alert.alert("Error", "Failed to add department");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setDepartmentName("");
      setLoading(false);
    }
  };

  // Edit Department
  const handleEdit = (index) => {
    setDepartmentName(departments[index].department_name);
    setEditIndex(index);
  };

  // Delete Department
  const handleDelete = (index) => {
    const departmentId = departments[index].id;
    Alert.alert(
      "Delete Department",
      "Are you sure you want to delete this department?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${BASE_URL}/department/delete/${departmentId}`, {
                method: "DELETE",
              });

              if (response.ok) {
                Alert.alert("Success", "Department deleted successfully");
                fetchDepartments();
              } else {
                Alert.alert("Error", "Failed to delete department");
              }
            } catch (error) {
              Alert.alert("Error", "Something went wrong");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.listItem}>
      <Text style={styles.listText}>{item.department_name}</Text>
      <View style={styles.actionIcons}>
        <TouchableOpacity onPress={() => handleEdit(index)} style={styles.icon}>
          <Feather name="edit" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(index)} style={styles.icon}>
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
  <View style={styles.container}>
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.heading}>Department Management</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter Department Name"
        value={departmentName}
        onChangeText={setDepartmentName}
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddOrUpdate}>
        <Text style={styles.addButtonText}>
          {editIndex !== null ? "Update Department" : "Add Department"}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={departments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No departments added yet</Text>}
          scrollEnabled={false} // ✅ disable FlatList’s internal scroll
        />
      )}
    </ScrollView>
  </View>
);

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  listText: {
    fontSize: 16,
  },
  actionIcons: {
    flexDirection: "row",
  },
  icon: {
    marginLeft: 15,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});

export default DepartmentScreen;
