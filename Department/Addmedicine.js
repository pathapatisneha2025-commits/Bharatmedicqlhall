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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/medicine";

export default function AddMedicineScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields
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

  // ---------------- Fetch all medicines ----------------
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/all`);
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch medicines.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // ---------------- Pick image ----------------
  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can only upload up to 5 images.");
      return;
    }

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission Denied", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.6,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can only upload up to 5 images.");
      return;
    }

    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission Denied", "Please allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

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

  const handleSubmit = async () => {
    if (!name || !category || !manufacturer || !batchNumber || !packSize || !description || !price || !stock) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    if (images.length === 0) {
      Alert.alert("Error", "Please select at least one image.");
      return;
    }

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

      images.forEach((img, index) => {
        formData.append("images", { uri: img, type: "image/jpeg", name: `image_${index}.jpg` });
      });

      let url = `${BASE_URL}/add`;
      let method = "POST";
      if (id) {
        url = `${BASE_URL}/update/${id}`;
        method = "PUT";
      }

      const response = await fetch(url, { method, headers: { "Content-Type": "multipart/form-data" }, body: formData });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message || "Medicine saved successfully.");
        resetForm();
        fetchMedicines();
      } else {
        Alert.alert("Error", data.message || "Failed to save medicine.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine) => {
    setId(medicine.id);
    setName(medicine.name);
    setCategory(medicine.category);
    setManufacturer(medicine.manufacturer);
    setBatchNumber(medicine.batch_number);
    setPackSize(medicine.pack_size);
    setDescription(medicine.description);
    setPrice(medicine.price);
    setStock(medicine.stock.toString());
    setImages(medicine.images);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleDelete = async (medicineId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this medicine?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${BASE_URL}/delete/${medicineId}`, { method: "DELETE" });
            const data = await response.json();
            if (response.ok) {
              Alert.alert("Deleted", data.message || "Medicine deleted successfully.");
              fetchMedicines();
            } else {
              Alert.alert("Error", data.message || "Failed to delete medicine.");
            }
          } catch (error) {
            console.log(error);
            Alert.alert("Error", "Something went wrong.");
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 20}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>

          <Text style={styles.header}>{id ? "Edit Medicine" : "Add New Medicine"}</Text>

          {/* Form Fields */}
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
          <TextInput style={styles.input} placeholder="Manufacturer" value={manufacturer} onChangeText={setManufacturer} />
          <TextInput style={styles.input} placeholder="Batch Number" value={batchNumber} onChangeText={setBatchNumber} />
          <TextInput style={styles.input} placeholder="Pack Size" value={packSize} onChangeText={setPackSize} />
          <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />

          <Text style={{ marginBottom: 10 }}>Upload up to 5 images</Text>
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
              <Text style={styles.uploadText}>Upload Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Text style={styles.uploadText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{id ? "Update Medicine" : "Add Medicine"}</Text>}
          </TouchableOpacity>

          {/* List of Medicines */}
          <Text style={[styles.header, { marginTop: 20 }]}>All Medicines</Text>
          {loading && <ActivityIndicator size="large" color="#2196F3" />}
          {medicines.map((med) => (
            <View key={med.id} style={styles.medicineCard}>
              <Image source={{ uri: med.images?.[0] }} style={styles.cardImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontWeight: "bold" }}>{med.name}</Text>
                <Text>Category: {med.category}</Text>
                <Text>Price: ₹{med.price}</Text>
                <Text>Stock: {med.stock}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity onPress={() => handleEdit(med)} style={{ marginRight: 10 }}>
                  <MaterialIcons name="edit" size={24} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(med.id)}>
                  <MaterialIcons name="delete" size={24} color="red" />
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
  container: { padding: 16, backgroundColor: "#FAFAFA",marginTop:30 },
  backButton: { position: "absolute", top: 40, left: 16, zIndex: 10 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333" },
  input: { borderWidth: 1, borderColor: "turquoise", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#fff" },
  imageRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  imageWrapper: { position: "relative", marginRight: 10, marginBottom: 10 },
  image: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: "turquoise" },
  removeIcon: { position: "absolute", top: -6, right: -6, backgroundColor: "#fff", borderRadius: 12 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  uploadButton: { backgroundColor: "turquoise", padding: 12, borderRadius: 10, width: "48%", alignItems: "center" },
  uploadText: { fontWeight: "600", color: "#000" },
  submitButton: { backgroundColor: "#4CAF50", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 10 },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  medicineCard: { flexDirection: "row", alignItems: "center", padding: 10, marginBottom: 10, backgroundColor: "#fff", borderRadius: 8, elevation: 2 },
  cardImage: { width: 60, height: 60, borderRadius: 8 },
});
