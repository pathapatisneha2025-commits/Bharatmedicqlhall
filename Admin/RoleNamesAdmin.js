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
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const RoleScreen = () => {
  const navigation = useNavigation();

  const [roles, setRoles] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [editRole, setEditRole] = useState(null); // Store role object when editing
  const [loading, setLoading] = useState(false);

  // Fetch all roles
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/role/all`);
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  // Fetch role by ID (optional usage)
  const fetchRoleById = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/role/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert("Error", "Failed to fetch role by ID");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Add or Update Role
  const handleAddOrUpdate = async () => {
    if (!roleName.trim()) {
      Alert.alert("Validation", "Please enter a role name");
      return;
    }

    setLoading(true);
    try {
      if (editRole) {
        // Update role
        const response = await fetch(`${BASE_URL}/role/update/${editRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role_name: roleName }),
        });

        if (response.ok) {
          Alert.alert("Success", "Role updated successfully");
          fetchRoles();
          setEditRole(null);
        } else {
          Alert.alert("Error", "Failed to update role");
        }
      } else {
        // Add role
        const response = await fetch(`${BASE_URL}/role/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role_name: roleName }),
        });

        if (response.ok) {
          Alert.alert("Success", "Role added successfully");
          fetchRoles();
        } else {
          Alert.alert("Error", "Failed to add role");
        }
      }
      setRoleName("");
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Edit Role
  const handleEdit = (role) => {
    setRoleName(role.role_name);
    setEditRole(role);
  };

  // Delete Role
  const handleDelete = (id) => {
    Alert.alert(
      "Delete Role",
      "Are you sure you want to delete this role?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${BASE_URL}/role/delete/${id}`, {
                method: "DELETE",
              });

              if (response.ok) {
                Alert.alert("Success", "Role deleted successfully");
                fetchRoles();
              } else {
                Alert.alert("Error", "Failed to delete role");
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
  if (loading)
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading...</Text>
        </View>
      );

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.listText}>{item.role_name}</Text>
      <View style={styles.actionIcons}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.icon}>
          <Feather name="edit" size={20} color="#007bff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.icon}
        >
          <Ionicons name="trash-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.heading}>Role Management</Text>
        <View style={{ width: 24 }} /> {/* Placeholder for spacing */}
      </View>

      {/* Input and Add/Update Button */}
      <TextInput
        style={styles.input}
        placeholder="Enter Role Name"
        value={roleName}
        onChangeText={setRoleName}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddOrUpdate}>
        <Text style={styles.addButtonText}>
          {editRole ? "Update Role" : "Add Role"}
        </Text>
      </TouchableOpacity>

      {/* List of Roles */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={roles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No roles added yet</Text>
          }
        />
      )}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
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

export default RoleScreen;
