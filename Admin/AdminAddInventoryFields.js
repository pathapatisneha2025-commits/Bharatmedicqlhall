import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions
} from "react-native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/addfields";

export default function AdminManageFieldsScreen() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("string");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [saving, setSaving] = useState(false);
const [newFieldIcon, setNewFieldIcon] = useState("");
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
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/all`);
      const data = await res.json();
      setFields(data);
    } catch (err) {
      showAlert("Error", "Failed to fetch fields");
    } finally {
      setLoading(false);
    }
  };

 const addField = async () => {
  if (!newFieldName) return showAlert("Error", "Field name is required");
  setSaving(true);
  try {
    const res = await fetch(`${BASE_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field_name: newFieldName,
        field_type: newFieldType,
        required: newFieldRequired,
        icon: newFieldIcon // ✅ include icon here
      }),
    });
    if (res.ok) {
      setNewFieldName("");
      setNewFieldRequired(false);
      setNewFieldIcon(""); // ✅ reset input
      fetchFields();
    }
  } finally {
    setSaving(false);
  }
};
  const removeField = (id) => {
    showAlert("Confirm", "Deactivate this field?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        onPress: async () => {
          await fetch(`${BASE_URL}/delete/${id}`, { method: "DELETE" });
          fetchFields();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.mainWrapper}>
      <View style={styles.webContainer}>
        
        {/* LEFT SECTION: Management Form */}
        <View style={styles.leftContent}>
          <TouchableOpacity style={styles.backLink}>
            <Text style={styles.backText}>‹ Back to Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}><Text style={styles.logoText}>BM</Text></View>
            <Text style={styles.brandTitle}>Bharat Medical Hall</Text>
          </View>

          <Text style={styles.formTitle}>Manage Fields</Text>
          <Text style={styles.formSubtitle}>Configure medicine data structures</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Field Name</Text>
            <TextInput
              placeholder="e.g. Expiry Date"
              style={styles.webInput}
              value={newFieldName}
              onChangeText={setNewFieldName}
            />

            <Text style={styles.label}>Data Type</Text>
            <TextInput
              placeholder="string, number, or date"
              style={styles.webInput}
              value={newFieldType}
              onChangeText={setNewFieldType}
            />
            <Text style={styles.label}>Icon Name</Text>
<TextInput
  placeholder="e.g. calendar"
  style={styles.webInput}
  value={newFieldIcon}
  onChangeText={setNewFieldIcon}
/>

            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setNewFieldRequired(!newFieldRequired)}
            >
              <View style={[styles.checkbox, newFieldRequired && styles.checked]}>
                {newFieldRequired && <Text style={{color: '#fff'}}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Mark as Required Field</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={addField} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Field →</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT SECTION: Visual Sidebar & Live List */}
        <View style={styles.rightSidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.largeLogo}><Text style={styles.largeLogoText}>BM</Text></View>
            <Text style={styles.sidebarTitle}>Live Schema</Text>
            <Text style={styles.sidebarDesc}>Currently active fields in your inventory management system.</Text>
          </View>

          <View style={styles.listContainer}>
            {loading ? (
               <ActivityIndicator color="#fff" />
            ) : (
              <FlatList
                data={fields}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.glassCard}>
                    <View style={{flex: 1}}>
                      <Text style={styles.cardFieldName}>{item.field_name}</Text>
                      <Text style={styles.cardFieldType}>{item.field_type.toUpperCase()} {item.required ? '• REQUIRED' : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeField(item.id)}>
                      <Text style={styles.deleteLink}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: "#fff" },
  webContainer: { flex: 1, flexDirection: "row" },
  
  // Left Side Styles
  leftContent: { flex: 1.2, paddingHorizontal: '8%', justifyContent: 'center', backgroundColor: '#fff' },
  backLink: { marginBottom: 30 },
  backText: { color: '#64748b', fontSize: 14 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  logoBadge: { width: 36, height: 36, backgroundColor: '#0288D1', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  brandTitle: { fontSize: 18, fontWeight: '700', color: '#0288D1' },
  formTitle: { fontSize: 32, fontWeight: '800', color: '#1e293b' },
  formSubtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 30 },
  
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  webInput: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 16 },
  
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#0288D1', borderColor: '#0288D1' },
  checkboxLabel: { color: '#64748b' },

  submitBtn: { backgroundColor: "#00CFD5", borderRadius: 12, paddingVertical: 18, alignItems: "center", shadowColor: "#00CFD5", shadowOpacity: 0.3, shadowRadius: 10 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 18 },

  // Right Side Styles
  rightSidebar: { flex: 1, backgroundColor: '#0288D1', padding: 40, justifyContent: 'center' },
  sidebarHeader: { alignItems: 'center', marginBottom: 40 },
  largeLogo: { width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  largeLogoText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  sidebarTitle: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginBottom: 10 },
  sidebarDesc: { color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24 },

  listContainer: { height: 300 },
  glassCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  cardFieldName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cardFieldType: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, letterSpacing: 1 },
  deleteLink: { color: '#ffcfcf', fontSize: 12, fontWeight: '600' }
});