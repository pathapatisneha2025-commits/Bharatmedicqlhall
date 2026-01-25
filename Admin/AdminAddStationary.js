import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/doctorrequest";

export default function AdminAddStationaryInventory() {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== Image Handling =====
  const pickImage = async () => {
    if (images.length >= 5) return Alert.alert("Limit Reached", "You can only upload up to 5 images.");
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert("Permission Denied", "Allow access to photos.");
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) setImages([...images, result.assets[0].uri]);
  };

  const takePhoto = async () => {
    if (images.length >= 5) return Alert.alert("Limit Reached", "You can only upload up to 5 images.");
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert("Permission Denied", "Allow camera access.");
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) setImages([...images, result.assets[0].uri]);
  };

  const removeImage = index => setImages(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!name || !stock || !price) return Alert.alert("Please fill all required fields");
    if (images.length === 0) return Alert.alert("Select at least one image");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("stock", stock);
      formData.append("price", price);
      formData.append("supplier", supplier);
      images.forEach((uri, i) => formData.append("images", { uri, type: "image/jpeg", name: `image_${i}.jpg` }));

      const res = await fetch(`${BASE_URL}/add`, { method: "POST", headers: { "Content-Type": "multipart/form-data" }, body: formData });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message || "Saved!");
        setName(""); setStock(""); setPrice(""); setSupplier(""); setImages([]);
      } else Alert.alert("Error", data.error || "Failed to save");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Item Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Item Name" />

      <Text style={styles.label}>Stock Quantity</Text>
      <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="Stock" keyboardType="numeric" />

      <Text style={styles.label}>Price</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Price" keyboardType="decimal-pad" />

      <Text style={styles.label}>Supplier</Text>
      <TextInput style={styles.input} value={supplier} onChangeText={setSupplier} placeholder="Supplier Name" />

      <Text style={styles.label}>Images ({images.length}/5)</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
        {images.map((uri, i) => (
          <View key={i} style={{ position: "relative", marginRight: 8, marginBottom: 8 }}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={{ position: "absolute", top: -5, right: -5, backgroundColor: "#fff", borderRadius: 12 }}
              onPress={() => removeImage(i)}
            >
              <Text style={{ color: "red", fontWeight: "bold", padding: 2 }}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.buttonText}>Upload Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { marginBottom: 4, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 12, borderRadius: 6 },
  uploadButton: { flex: 1, backgroundColor: "#81D4FA", padding: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 4 },
  submitButton: { backgroundColor: "#0288D1", padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  image: { width: 60, height: 60, borderRadius: 6 },
});
