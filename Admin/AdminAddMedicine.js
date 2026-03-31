import React, { useState, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useWindowDimensions,
  SafeAreaView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons, FontAwesome, Feather, MaterialCommunityIcons } from "@expo/vector-icons";import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/medicine";

const InputWithIcon = memo(
  ({ icon, placeholder, value, onChangeText, keyboardType, multiline, editable }) => (
    <View style={styles.inputContainer}>
      <FontAwesome name={icon} size={20} color="#0288D1" style={{ marginRight: 10 }} />
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: "top" }]}
        placeholder={placeholder}
        placeholderTextColor="#777"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        multiline={multiline || false}
        editable={editable}
        blurOnSubmit={false}
      />
    </View>
  )
);

export default function AdminAddMedicineScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const MAX_WIDTH = 420;
  const containerWidth = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH - 20;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [manualLoading, setManualLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [id, setId] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [packSize, setPackSize] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState([]);
const [dynamicFields, setDynamicFields] = useState([]);
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
  
// Fetch dynamic fields
useEffect(() => {
  fetchDynamicFields();
}, []);

const fetchDynamicFields = async () => {
  try {
    const res = await fetch("https://hospitaldatabasemanagement.onrender.com/addfields/all");
    const data = await res.json();
    
    // Initialize values for each field
    const fieldsWithValues = data.map(f => ({ ...f, value: "" }));
    setDynamicFields(fieldsWithValues);
  } catch (err) {
    showAlert("Error", "Failed to fetch dynamic fields");
  }
};
  
    useEffect(() => {
                let interval;
                if (loading) {
                  setLoadingCount(0);
                  interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
                } else clearInterval(interval);
                return () => clearInterval(interval);
              }, [loading]);
  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/all`);
      const data = await res.json();
      setMedicines(data);
    } catch {
      showAlert("Error", "Failed to fetch medicines.");
    } finally {
      setLoading(false);
    }
  };

  // Image pickers
  const pickImage = async () => {
    if (images.length >= 5) return showAlert("Limit Reached", "Max 5 images allowed.");
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return showAlert("Permission Denied");
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) setImages(prev => [...prev, result.assets[0].uri]);
  };

  const takePhoto = async () => {
    if (images.length >= 5) return showAlert("Limit Reached", "Max 5 images allowed.");
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return showAlert("Permission Denied");
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) setImages(prev => [...prev, result.assets[0].uri]);
  };

  const removeImage = index => setImages(prev => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setId(null);
    setName("");
    setCategory("");
    setManufacturer("");
    setBatchNumber("");
    setPackSize("");
    setDescription("");
    setPrice("");
    setStock("");
    setImages([]);
  };

  // Manual form submit
  const handleSubmit = async () => {
  // Check required static fields
  if (!name || !category || !manufacturer || !batchNumber || !packSize || !description || !price || !stock)
    return showAlert("Error", "Please fill all fields.");
  if (images.length === 0) return showAlert("Error", "Select at least one image.");

  // Check required dynamic fields
  for (let f of dynamicFields) {
    if (f.required && (!f.value || f.value.trim() === "")) {
      return showAlert("Error", `${f.field_name} is required.`);
    }
  }

  setManualLoading(true);
  try {
    const formData = new FormData();

    // Append static fields
    formData.append("name", name);
    formData.append("category", category);
    formData.append("manufacturer", manufacturer);
    formData.append("batch_number", batchNumber);
    formData.append("pack_size", packSize);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);

    // Append images
    images.forEach((img, i) =>
      formData.append("images", { uri: img, type: "image/jpeg", name: `image_${i}.jpg` })
    );

    // Append dynamic fields
    dynamicFields.forEach(f => {
      formData.append(f.field_name, f.value);
    });

    // Determine URL & method
    const url = id ? `${BASE_URL}/update/${id}` : `${BASE_URL}/add`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();

    if (res.ok) {
      showAlert("Success", data.message || "Medicine saved!");
      resetForm();
      fetchMedicines();
    } else showAlert("Error", data.message || "Failed to save medicine.");
  } catch (err) {
    console.error("Submit error:", err);
    showAlert("Error", "Something went wrong.");
  } finally {
    setManualLoading(false);
  }
};

const handleCsvUpload = async (event) => {
  try {
    setCsvLoading(true);

    const formData = new FormData();
    let fileName = "";

    if (Platform.OS === "web") {
      // Web: file comes from input element
      const file = event?.target?.files?.[0];
      if (!file) return showAlert("Error", "No file selected");

      formData.append("csv", file, file.name);
      fileName = file.name;
    } else {
      // Mobile: use DocumentPicker
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });
      if (result.type !== "success") return showAlert("Error", "No file selected");

      formData.append("csv", {
        uri: result.uri,
        name: result.name,
        type: "text/csv",
      });
      fileName = result.name;
    }

    const res = await fetch(`${BASE_URL}/bulk-upload`, {
      method: "POST",
      body: formData,
      headers: Platform.OS === "web" ? { Accept: "application/json" } : {}, // don't set Content-Type
    });

    // Read the body once
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text); // parse as JSON if possible
    } catch {
      data = { error: text || "Server returned invalid JSON" };
    }

    if (res.ok) {
      showAlert("Success", data.message || `Uploaded ${data.items?.length || 0} items!`);
      fetchMedicines();
    } else {
      console.error("CSV upload failed:", data);
      showAlert("Error", data.error || data.message || "CSV upload failed.");
    }
  } catch (err) {
    console.error("CSV upload error:", err);
    showAlert("Error", err.message || "CSV upload failed.");
  } finally {
    setCsvLoading(false);
  }
};







  const handleEdit = med => {
    setId(med.id);
    setName(med.name);
    setCategory(med.category);
    setManufacturer(med.manufacturer);
    setBatchNumber(med.batch_number);
    setPackSize(med.pack_size);
    setDescription(med.description);
    setPrice(med.price);
    setStock(med.stock.toString());
    setImages(med.images);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleDelete = medId => {
    showAlert("Confirm Delete", "Delete this medicine?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/${medId}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
              showAlert("Deleted", data.message || "Deleted!");
              fetchMedicines();
            } else showAlert("Error", data.message || "Failed.");
          } catch {
           showAlert("Error", "Something went wrong.");
          }
        },
      },
    ]);
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
           <ActivityIndicator size="large" color="#007bff" />
           <Text style={{ marginTop: 10 }}>Loading medicines{loadingCount}s</Text>
         </View>
  );
return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          
          {/* Dashboard Header Style */}
          <View style={styles.dashboardHeader}>
            <TouchableOpacity style={styles.backCircle} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View>
              <Text style={styles.mainTitle}>{id ? "Edit Medicine" : "Add Medicine"}</Text>
              <Text style={styles.subTitle}>Pharma Inventory Management</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <InputWithIcon icon="medkit" placeholder="Medicine Name" value={name} onChangeText={setName} />
            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <InputWithIcon icon="tags" placeholder="Category" value={category} onChangeText={setCategory} />
                </View>
                <View style={{ flex: 1 }}>
                    <InputWithIcon icon="barcode" placeholder="Batch #" value={batchNumber} onChangeText={setBatchNumber} />
                </View>
                <View style={{ flex: 1 }}>
                                    <InputWithIcon icon="barcode" placeholder="packsize" value={packSize} onChangeText={setPackSize} />
                                </View>
            </View>
            <InputWithIcon icon="industry" placeholder="Manufacturer" value={manufacturer} onChangeText={setManufacturer} />
            
            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <InputWithIcon icon="money" placeholder="Price ($)" value={price} onChangeText={setPrice} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                    <InputWithIcon icon="cubes" placeholder="Stock Qty" value={stock} onChangeText={setStock} keyboardType="numeric" />
                </View>
            </View>

            <InputWithIcon icon="file-text" placeholder="Full Description" value={description} onChangeText={setDescription} multiline />
{dynamicFields.map((field, index) => (
  <InputWithIcon
    key={field.id}
    icon={field.icon}
    placeholder={field.field_name + (field.required ? " *" : "")}
    value={field.value}
    onChangeText={(text) => {
      const updatedFields = [...dynamicFields];
      updatedFields[index].value = text;
      setDynamicFields(updatedFields);
    }}
    keyboardType={field.field_type === "number" ? "numeric" : "default"}
  />
))}
            <Text style={styles.inputLabel}>Product Images ({images.length}/5)</Text>
            <View style={styles.imageGrid}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                  <TouchableOpacity style={styles.addImgBox} onPress={pickImage}>
                      <Feather name="image" size={24} color="#94a3b8" />
                  </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
                <Feather name="camera" size={20} color="#1e293b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={manualLoading}>
                {manualLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{id ? "Update Medicine" : "Save Product"}</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* CSV SECTION */}
            <Text style={styles.inputLabel}>Bulk Upload</Text>
            {Platform.OS === "web" ? (
              <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={csvLoading} style={styles.webCsv} />
            ) : (
              <TouchableOpacity style={styles.csvButton} onPress={handleCsvUpload} disabled={csvLoading}>
                {csvLoading ? <ActivityIndicator color="#fff" /> : 
                <><FontAwesome name="file-excel-o" size={18} color="#fff" style={{ marginRight: 10 }} /><Text style={styles.csvText}>Upload Inventory CSV</Text></>}
              </TouchableOpacity>
            )}
          </View>

          {/* List Section */}
          <View style={styles.listHeader}>
            <Text style={styles.heading}>Current Inventory</Text>
            <View style={styles.countBadge}><Text style={styles.countText}>{medicines.length}</Text></View>
          </View>

{[...medicines]
  .sort((a, b) => Number(a.stock) - Number(b.stock)) // lowest stock first
  .map(med => {            const lowStock = Number(med.stock) <= 10;
            return (
              <View key={med.id} style={[styles.medCard, lowStock && styles.lowStockCard]}>
                <View style={styles.medMain}>
                  {med.images && med.images[0] ? (
                    <Image source={{ uri: med.images[0] }} style={styles.medImg} />
                  ) : (
                    <View style={styles.noImg}><Feather name="package" size={24} color="#cbd5e1" /></View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.medName, lowStock && { color: "#ef4444" }]}>{med.name}</Text>
                    <Text style={styles.medCat}>{med.category} • {med.manufacturer}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.medPrice}>${med.price}</Text>
                        <View style={[styles.stockTag, lowStock && { backgroundColor: "#fee2e2" }]}>
                            <Text style={[styles.stockText, lowStock && { color: "#ef4444" }]}>Stock: {med.stock}</Text>
                        </View>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => handleEdit(med)} style={styles.actionIcon}><Feather name="edit-2" size={18} color="#2563eb" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(med.id)} style={styles.actionIcon}><Feather name="trash-2" size={18} color="#ef4444" /></TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderText: { marginTop: 12, color: "#64748b", fontWeight: "600" },
  dashboardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 25, gap: 16 },
  backCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  mainTitle: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  subTitle: { fontSize: 13, color: "#64748b", marginTop: -2 },
  
  formCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 15 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, color: "#1e293b", paddingVertical: 12 , outlineStyle: "none",},
  row: { flexDirection: "row" },
  
  inputLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  imageWrapper: { position: "relative" },
  image: { width: 65, height: 65, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  addImgBox: { width: 65, height: 65, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: "#cbd5e1", justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  removeIcon: { position: "absolute", top: -8, right: -8, backgroundColor: "#fff", borderRadius: 12 },

  actionRow: { flexDirection: "row", gap: 10 },
  cameraBtn: { width: 54, height: 54, borderRadius: 12, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  submitButton: { flex: 1, backgroundColor: "#0288D1", borderRadius: 12, justifyContent: "center", alignItems: "center", height: 54 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 20 },
  csvButton: { backgroundColor: "#10B981", padding: 14, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  csvText: { color: "#fff", fontWeight: "700" },
  webCsv: { padding: 10, borderRadius: 8, backgroundColor: "#f1f5f9", width: "100%" },

  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  heading: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  countBadge: { backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 12, color: "#475569", fontWeight: "700" },

  medCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: "#0288D1" },
  lowStockCard: { borderLeftColor: "#ef4444", backgroundColor: "#fffafa" },
  medMain: { flexDirection: "row", alignItems: "center" },
  medImg: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  noImg: { width: 60, height: 60, borderRadius: 10, backgroundColor: "#f1f5f9", marginRight: 15, justifyContent: "center", alignItems: "center" },
  medName: { fontWeight: "700", fontSize: 16, color: "#1e293b" },
  medCat: { fontSize: 12, color: "#64748b", marginVertical: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  medPrice: { fontWeight: "800", color: "#1e293b", fontSize: 15 },
  stockTag: { backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  stockText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  cardActions: { gap: 10, marginLeft: 10 },
  actionIcon: { padding: 8, backgroundColor: "#f8fafc", borderRadius: 8 },
});