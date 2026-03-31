import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Platform 
} from "react-native";
// Note: In RN Web, you can use Lucide-react or @expo/vector-icons
import { Trash2, PlusCircle, LayoutGrid, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminPurchaseOrderFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    field_name: "",
    field_type: "text",
    is_required: false,
  });

  const fetchFields = async () => {
    try {
      const res = await fetch(`${BASE_URL}/purchaseorderfields/all`);
      const data = await res.json();
      setFields(data.fields || []);
    } catch (error) {
      console.error("Error fetching fields:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleAdd = async () => {
    if (!form.field_name) return alert("Please enter a field name");
    
    await fetch(`${BASE_URL}/purchaseorderfields/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ field_name: "", field_type: "text", is_required: false });
    fetchFields();
  };

  const handleDelete = async (id) => {
    await fetch(`${BASE_URL}/purchaseorderfields/delete/${id}`, {
      method: "DELETE",
    });
    fetchFields();
  };

  return (
    <View style={styles.screen}>
      {/* SIDEBAR / CONFIG PANEL */}
      <View style={styles.sidebar}>
        <View style={styles.headerContainer}>
          <View style={styles.tag}>
            <LayoutGrid size={16} color="#2563eb" />
            <Text style={styles.tagText}>ADMIN PORTAL</Text>
          </View>
          <Text style={styles.title}>Field Settings</Text>
          <Text style={styles.subtitle}>Configure custom input fields for purchase orders.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Field Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Supplier Batch ID"
            value={form.field_name}
            onChangeText={(text) => setForm({ ...form, field_name: text })}
          />

          <Text style={styles.label}>Data Type</Text>
          <View style={styles.pickerContainer}>
            <select 
              value={form.field_type} 
              onChange={(e) => setForm({...form, field_type: e.target.value})}
              style={styles.webSelect}
            >
              <option value="text">Short Text</option>
              <option value="number">Numeric Value</option>
              <option value="date">Date Picker</option>
            </select>
          </View>

          <TouchableOpacity 
            style={styles.checkboxRow} 
            onPress={() => setForm({ ...form, is_required: !form.is_required })}
          >
            <View style={[styles.toggleBackground, form.is_required && styles.toggleActive]}>
              <View style={[styles.toggleCircle, form.is_required && styles.toggleCircleActive]} />
            </View>
            <Text style={styles.checkboxLabel}>Mark as Required</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <PlusCircle size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Configuration</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT / DATA TABLE */}
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 0.5 }]}>ID</Text>
            <Text style={[styles.columnHeader, { flex: 2 }]}>NAME</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>TYPE</Text>
            <Text style={[styles.columnHeader, { flex: 1, textAlign: 'center' }]}>REQ</Text>
            <Text style={[styles.columnHeader, { flex: 0.5, textAlign: 'right' }]}></Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={{ margin: 40 }} />
          ) : fields.length === 0 ? (
            <Text style={styles.emptyText}>No custom fields defined yet.</Text>
          ) : (
            fields.map((field) => (
              <View key={field.id} style={styles.tableRow}>
                <Text style={[styles.cellId, { flex: 0.5 }]}>#{field.id}</Text>
                <Text style={[styles.cellName, { flex: 2 }]}>{field.field_name}</Text>
                <View style={{ flex: 1 }}>
                   <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{field.field_type}</Text>
                   </View>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  {field.is_required ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (
                    <XCircle size={18} color="#cbd5e1" />
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => handleDelete(field.id)}
                  style={[styles.deleteBtn, { flex: 0.5 }]}
                >
                  <Trash2 size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: "#f8fafc",
  },
  sidebar: {
    width: Platform.OS === 'web' ? 400 : '100%',
    backgroundColor: "#fff",
    padding: 32,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    justifyContent: "center",
    ...Platform.select({
      web: { boxShadow: '10px 0 15px -3px rgba(0, 0, 0, 0.05)' }
    })
  },
  headerContainer: {
    marginBottom: 32,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    outlineStyle: 'none',
  },
  pickerContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: 'hidden'
  },
  webSelect: {
    padding: 14,
    fontSize: 16,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    cursor: 'pointer'
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 10,
  },
  toggleBackground: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: "#2563eb",
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  addButton: {
    backgroundColor: "#06b6d4", // Cyan like your screenshot
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(to right, #2563eb, #06b6d4)' }
    })
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
    padding: 40,
  },
  scrollContent: {
    alignItems: "center",
  },
  tableCard: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cellId: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#94a3b8",
  },
  cellName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  typeBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  typeBadgeText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textTransform: 'capitalize'
  },
  deleteBtn: {
    alignItems: 'flex-end',
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    padding: 40,
    color: "#94a3b8",
    fontStyle: "italic",
  }
});