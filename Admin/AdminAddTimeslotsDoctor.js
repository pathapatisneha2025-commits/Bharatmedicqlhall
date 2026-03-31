import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminDoctortimeSlotScreen() {
  const { width } = useWindowDimensions();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorEmail, setDoctorEmail] = useState("");

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);

  const [newSlot, setNewSlot] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

 useEffect(() => {
  fetchDoctors();
  fetchSlots();   // 👈 add this
}, []);


  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${BASE_URL}/doctor/all`);
      const data = await res.json();
      setDoctors(data);
      if (data.length > 0) {
        setSelectedDoctor(data[0]);
        setDoctorEmail(data[0].email);
      }
    } catch {
      showAlert("Error", "Failed to fetch doctors");
    }
  };

 const fetchSlots = async () => {
  try {
    const res = await fetch(`${BASE_URL}/doctorslots/all`);
    const data = await res.json();
    setSlots(data); // NOT data.slots
  } catch {
    showAlert("Error", "Failed to fetch slots");
  }
};


  // ADD SLOT
  const addSlot = async () => {
    if (!newSlot) return showAlert("Error", "Enter slot time");

    await fetch(`${BASE_URL}/doctorslots/add-slot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_id: selectedDoctor.id,
        date,
        slot: newSlot,
      }),
    });

    setNewSlot("");
    fetchSlots();
  };

  // DELETE SLOT
const deleteSlot = async (slotId) => {
  try {
    await fetch(`${BASE_URL}/doctorslots/delete-slot/${slotId}`, {
      method: "DELETE",
    });

    fetchSlots();
  } catch {
    showAlert("Error", "Failed to delete slot");
  }
};
  // EDIT SLOT SAVE
  const saveEdit = async (oldSlot) => {
    await fetch(`${BASE_URL}/doctorslots/edit-slot`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_id: selectedDoctor.id,
        date,
        oldSlot,
        newSlot: editingValue,
      }),
    });

    setEditingIndex(null);
    setEditingValue("");
    fetchSlots();
  };

const renderRow = ({ item, index }) => (
  <View style={styles.tableRow}>
    <Text style={{ width: 40 }}>{index + 1}</Text>

    <Text style={{ width: 120 }}>{item.doctor_name}</Text>

    <Text style={{ width: 120 }}>
      {item.slot_date?.split("T")[0]}
    </Text>

    {editingIndex === index ? (
      <TextInput
        style={[styles.inputInline, { width: 160 }]}
        value={editingValue}
        onChangeText={setEditingValue}
      />
    ) : (
      <Text style={{ width: 160 }}>{item.slot_time}</Text>
    )}

    {editingIndex === index ? (
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => saveEdit(item)}
      >
        <Feather name="check" size={16} color="green" />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => {
          setEditingIndex(index);
          setEditingValue(item.slot_time);
        }}
      >
        <Feather name="edit" size={16} color="#2563eb" />
      </TouchableOpacity>
    )}

    <TouchableOpacity
      style={styles.iconBtn}
onPress={() => deleteSlot(item.id)}
    >
      <Feather name="trash-2" size={16} color="#ef4444" />
    </TouchableOpacity>
  </View>
);

 return (
  <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Doctor Slot Management</Text>

    <View
      style={[
        styles.mainWrapper,
        { flexDirection: width > 900 ? "row" : "column" },
      ]}
    >
      {/* LEFT COLUMN - Form Section */}
      <View
        style={[
          styles.leftColumn,
          { width: width > 900 ? "40%" : "100%" },
        ]}
      >
        {/* Doctor Selection */}
        <Text style={styles.label}>Select Doctor</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedDoctor?.email || ""}
            onValueChange={(val) => {
              const doc = doctors.find((d) => d.email === val);
              setSelectedDoctor(doc);
              setDoctorEmail(doc.email);
            }}
          >
            {doctors.map((doc) => (
              <Picker.Item
                key={doc.id}
                label={doc.name}
                value={doc.email}
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={fetchSlots}>
          <Text style={styles.btnText}>Load Slots</Text>
        </TouchableOpacity>

        {/* Add Slot */}
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="9:00 AM - 10:00 AM"
            value={newSlot}
            onChangeText={setNewSlot}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addSlot}>
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* RIGHT COLUMN - Table Section */}
      <View
        style={[
          styles.rightColumn,
          { width: width > 900 ? "60%" : "100%" },
        ]}
      >
       <View style={styles.tableHeader}>
  <Text style={[styles.headerCell, { width: 40 }]}>#</Text>
  <Text style={[styles.headerCell, { width: 120 }]}>Doctor</Text>
  <Text style={[styles.headerCell, { width: 120 }]}>Date</Text>
  <Text style={[styles.headerCell, { width: 160 }]}>Slot</Text>
  <Text style={[styles.headerCell, { width: 60 }]}>Edit</Text>
  <Text style={[styles.headerCell, { width: 60 }]}>Delete</Text>
</View>


        <FlatList
          data={slots}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderRow}
          ListEmptyComponent={
            <Text style={styles.empty}>No slots found</Text>
          }
        />
      </View>
    </View>
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8fafc" },
  mainWrapper: {
  flex: 1,
  gap: 30,
},

leftColumn: {
  backgroundColor: "#ffffff",
  padding: 20,
  borderRadius: 10,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 5,
  elevation: 3,
},

rightColumn: {
  backgroundColor: "#ffffff",
  padding: 20,
  borderRadius: 10,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 5,
  elevation: 3,
},

  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  label: { fontWeight: "600", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    marginTop: 5,
  },
  primaryBtn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  addRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  addBtn: {
    backgroundColor: "#16a34a",
    padding: 12,
    marginLeft: 10,
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: "row",
    marginTop: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerCell: { fontWeight: "bold" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  tableCell: {},
  iconBtn: { width: 60 },
  inputInline: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    padding: 5,
    borderRadius: 5,
  },
  empty: { marginTop: 20, textAlign: "center", color: "#94a3b8" },
});
