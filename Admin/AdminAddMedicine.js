import React, { useState, useEffect, useRef } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/medicine";

export default function AdminAddMedicineScreen() {
  const navigation = useNavigation();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const scrollViewRef = useRef();

  useEffect(() => { fetchMedicines(); }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/all`);
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch medicines.");
    } finally { setLoading(false); }
  };

  const pickImage = async () => {
    if (images.length >= 5) { Alert.alert("Limit Reached", "You can only upload up to 5 images."); return; }
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert("Permission Denied", "Allow access to photos.");
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets?.[0]?.uri) setImages((prev) => [...prev, result.assets[0].uri]);
  };

  const takePhoto = async () => {
    if (images.length >= 5) { Alert.alert("Limit Reached", "You can only upload up to 5 images."); return; }
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert("Permission Denied", "Allow camera access.");
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) setImages((prev) => [...prev, result.assets[0].uri]);
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setId(null); setName(""); setCategory(""); setManufacturer("");
    setBatchNumber(""); setPackSize(""); setDescription(""); setPrice(""); setStock(""); setImages([]);
  };

  const handleSubmit = async () => {
    if (!name || !category || !manufacturer || !batchNumber || !packSize || !description || !price || !stock) {
      return Alert.alert("Error", "Please fill all fields.");
    }
    if (images.length === 0) return Alert.alert("Error", "Please select at least one image.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("manufacturer", manufacturer);
      formData.append("batch_number", batchNumber);
      formData.append("pack_size", packSize);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      images.forEach((img, i) => formData.append("images", { uri: img, type: "image/jpeg", name: `image_${i}.jpg` }));

      const url = id ? `${BASE_URL}/update/${id}` : `${BASE_URL}/add`;
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, { method, headers: { "Content-Type": "multipart/form-data" }, body: formData });
      const data = await response.json();

      if (response.ok) { Alert.alert("Success", data.message || "Medicine saved successfully."); resetForm(); fetchMedicines(); }
      else Alert.alert("Error", data.message || "Failed to save medicine.");
    } catch (error) { Alert.alert("Error", "Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleEdit = (medicine) => {
    setId(medicine.id); setName(medicine.name); setCategory(medicine.category);
    setManufacturer(medicine.manufacturer); setBatchNumber(medicine.batch_number);
    setPackSize(medicine.pack_size); setDescription(medicine.description);
    setPrice(medicine.price); setStock(medicine.stock.toString());
    setImages(medicine.images);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleDelete = async (medicineId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this medicine?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const response = await fetch(`${BASE_URL}/delete/${medicineId}`, { method: "DELETE" });
          const data = await response.json();
          if (response.ok) { Alert.alert("Deleted", data.message || "Medicine deleted successfully."); fetchMedicines(); }
          else Alert.alert("Error", data.message || "Failed to delete medicine.");
        } catch { Alert.alert("Error", "Something went wrong."); }
      }}
    ]);
  };
   if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading medicine...</Text>
      </View>
    );
  }

  const InputWithIcon = ({ icon, placeholder, value, onChangeText, keyboardType, multiline }) => (
    <View style={styles.inputContainer}>
      <FontAwesome name={icon} size={20} color="#0288D1" style={{ marginRight: 10 }} />
      <TextInput
        style={[styles.input, multiline && { height: 80 }]}
        placeholder={placeholder}
        placeholderTextColor="#777"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        multiline={multiline || false}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#E3F2FD" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{id ? "Edit Medicine" : "Add Medicine"}</Text>
          </View>

          <View style={styles.formCard}>
            <InputWithIcon icon="medkit" placeholder="Name" value={name} onChangeText={setName} />
            <InputWithIcon icon="tags" placeholder="Category" value={category} onChangeText={setCategory} />
            <InputWithIcon icon="industry" placeholder="Manufacturer" value={manufacturer} onChangeText={setManufacturer} />
            <InputWithIcon icon="barcode" placeholder="Batch Number" value={batchNumber} onChangeText={setBatchNumber} />
            <InputWithIcon icon="archive" placeholder="Pack Size" value={packSize} onChangeText={setPackSize} />
            <InputWithIcon icon="file-text" placeholder="Description" value={description} onChangeText={setDescription} multiline />
            <InputWithIcon icon="money" placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <InputWithIcon icon="cubes" placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />

            <Text style={styles.imageLabel}>Upload up to 5 images</Text>
            <View style={styles.imageRow}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={22} color="#f00" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <FontAwesome name="image" size={20} color="#01579B" style={{ marginRight: 8 }} />

                <Text style={styles.uploadText}>Upload Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <FontAwesome name="camera" size={20} color="#01579B" style={{ marginRight: 8 }} />

                <Text style={styles.uploadText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{id ? "Update Medicine" : "Add Medicine"}</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>All Medicines</Text>
          {loading && <ActivityIndicator size="large" color="#0288D1" style={{ marginTop: 20 }} />}
          {medicines.map((med) => (
            <View key={med.id} style={styles.medicineCard}>
              <Image source={{ uri: med.images?.[0] }} style={styles.cardImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.medicineName}>{med.name}</Text>
                <Text style={styles.medicineText}>Category: {med.category}</Text>
                <Text style={styles.medicineText}>Price: ₹{med.price}</Text>
                <Text style={styles.medicineText}>Stock: {med.stock}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={() => handleEdit(med)} style={{ marginRight: 12 }}>
                  <MaterialIcons name="edit" size={24} color="#0288D1" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(med.id)}>
                  <MaterialIcons name="delete" size={24} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#E3F2FD" , marginTop: 30,paddingBottom: 60, // extra space at the bottom
},
  headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, backgroundColor: "#0288D1", padding: 12, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  backButton: { backgroundColor: "#03A9F4", padding: 8, borderRadius: 50, marginRight: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },

  formCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 3, marginBottom: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9F9F9", borderRadius: 10, borderWidth: 1, borderColor: "#B2DFDB", paddingHorizontal: 12, marginBottom: 12, elevation: 1 },
  input: { flex: 1, fontSize: 16, color: "#000", paddingVertical: 12 },

  imageLabel: { marginBottom: 8, fontWeight: "600", color: "#555" },
  imageRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  imageWrapper: { position: "relative", marginRight: 10, marginBottom: 10 },
  image: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: "#B2DFDB" },
  removeIcon: { position: "absolute", top: -6, right: -6, backgroundColor: "#fff", borderRadius: 12 },

  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  uploadButton: { backgroundColor: "#81D4FA", padding: 12, borderRadius: 10, width: "48%", alignItems: "center" },
  uploadText: { fontWeight: "600", color: "#01579B" },

  submitButton: { backgroundColor: "#0288D1", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 10 },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#0288D1", marginBottom: 12, marginTop: 10 },
  medicineCard: { flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 12, backgroundColor: "#fff", borderRadius: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  cardImage: { width: 70, height: 70, borderRadius: 10 },
  medicineName: { fontWeight: "bold", fontSize: 16, color: "#333" },
  medicineText: { color: "#555", fontSize: 14 },
});
