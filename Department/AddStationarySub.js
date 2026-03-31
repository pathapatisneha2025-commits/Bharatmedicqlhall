import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Platform,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com/doctorrequest";

export default function SubadminStationaryInventory() {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const navigation = useNavigation();

  const showAlert = (title, message, buttons) => {
    if (Platform.OS === "web") {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          const okBtn = buttons.find((b) => b.style !== "cancel");
          okBtn?.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/`);
      const data = await res.json();
      let fetchedItems = data.items || [];
      fetchedItems.sort((a, b) => Number(a.stock) - Number(b.stock));
      setItems(fetchedItems);
    } catch (err) {
      showAlert("Error", "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const pickImage = async () => {
    if (images.length >= 5) return showAlert("Limit Reached", "Max 5 images allowed.");
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return showAlert("Permission Denied", "Allow access to photos.");
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) setImages([...images, result.assets[0].uri]);
  };

  const takePhoto = async () => {
    if (images.length >= 5) return showAlert("Limit Reached", "Max 5 images allowed.");
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return showAlert("Permission Denied", "Allow camera access.");
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets?.[0]?.uri) setImages([...images, result.assets[0].uri]);
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!name || !stock || !price) return showAlert("Validation Error", "Fill all required fields");
    if (images.length === 0) return showAlert("Validation Error", "Select at least one image");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("stock", stock);
      formData.append("price", price);
      formData.append("supplier", supplier);
      images.forEach((uri, i) =>
        formData.append("images", { uri, type: "image/jpeg", name: `image_${i}.jpg` })
      );

      let res, data;
      if (editingId) {
        res = await fetch(`${BASE_URL}/update/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "multipart/form-data" },
          body: formData,
        });
      } else {
        res = await fetch(`${BASE_URL}/add`, {
          method: "POST",
          headers: { "Content-Type": "multipart/form-data" },
          body: formData,
        });
      }

      data = await res.json();
      if (res.ok) {
        showAlert("Success", data.message || (editingId ? "Updated!" : "Saved!"));
        setName(""); setStock(""); setPrice(""); setSupplier(""); setImages([]); setEditingId(null);
        fetchItems();
      } else {
        showAlert("Error", data.error || "Failed");
      }
    } catch (err) {
      showAlert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    showAlert("Confirm Delete", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/delete/${id}`, { method: "DELETE" });
            if (res.ok) { fetchItems(); showAlert("Deleted", "Item removed"); }
          } catch (err) { showAlert("Error", "Failed to delete"); }
        }
      }
    ]);
  };

  const handleEdit = (item) => {
    setName(item.name);
    setStock(item.stock.toString());
    setPrice(item.price.toString());
    setSupplier(item.supplier);
    setImages(item.images || []);
    setEditingId(item._id);
  };

  const renderItem = ({ item }) => {
    const isLowStock = Number(item.stock) <= 10;
    return (
      <View style={[styles.itemCard, isLowStock && styles.lowStockCard]}>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={[styles.itemName, isLowStock && { color: "#D32F2F" }]}>{item.name}</Text>
            {isLowStock && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningText}>LOW STOCK</Text>
              </View>
            )}
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock: <Text style={styles.detailValue}>{item.stock}</Text></Text>
            <Text style={styles.detailLabel}>Price: <Text style={styles.detailValue}>${item.price}</Text></Text>
          </View>
          <Text style={styles.supplierText}>Supplier: {item.supplier || "Not specified"}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.iconBtn, { backgroundColor: "#E3F2FD" }]}>
            <Feather name="edit-2" size={18} color="#1976D2" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={[styles.iconBtn, { backgroundColor: "#FFEBEE" }]}>
            <Feather name="trash-2" size={18} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{editingId ? "Update Item" : "New Inventory"}</Text>
            <Text style={styles.headerSub}>Stationary Management System</Text>
          </View>
        </View>

        {/* Input Form Card */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Details</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Item Name" placeholderTextColor="#94A3B8" />
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} value={stock} onChangeText={setStock} placeholder="Quantity" keyboardType="numeric" placeholderTextColor="#94A3B8" />
              <TextInput style={[styles.input, { flex: 1 }]} value={price} onChangeText={setPrice} placeholder="Price ($)" keyboardType="decimal-pad" placeholderTextColor="#94A3B8" />
            </View>
            <TextInput style={styles.input} value={supplier} onChangeText={setSupplier} placeholder="Supplier Name" placeholderTextColor="#94A3B8" />
          </View>

          <Text style={styles.label}>Visuals ({images.length}/5)</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, i) => (
              <View key={i} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImgBox} onPress={pickImage}>
                <Feather name="plus" size={24} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto}>
              <Feather name="camera" size={20} color="#1e293b" />
              <Text style={styles.cameraBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editingId ? "Update Item" : "Add to Stock"}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Inventory Section */}
        <View style={styles.listHeader}>
          <Text style={styles.heading}>Current Inventory</Text>
          <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{items.length}</Text></View>
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0288D1" />
            <Text style={styles.loaderText}>Syncing Inventory... {loadingCount}s</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            scrollEnabled={false}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 25, gap: 15 },
  backCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: "#0288D1", justifyContent: "center", alignItems: "center", elevation: 4 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B" },

  formCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 30 },
  label: { fontSize: 14, fontWeight: "700", color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: "#F1F5F9", padding: 14, borderRadius: 12, fontSize: 16, color: "#1E293B", marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" ,  outlineStyle: "none",   // ✅ removes web rectangle
},
  row: { flexDirection: "row" },

  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  imageWrapper: { position: "relative" },
  image: { width: 70, height: 70, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  removeBtn: { position: "absolute", top: -8, right: -8, backgroundColor: "#FFF", borderRadius: 10 },
  addImgBox: { width: 70, height: 70, borderRadius: 12, backgroundColor: "#F1F5F9", borderStyle: "dashed", borderWidth: 1, borderColor: "#CBD5E1", justifyContent: "center", alignItems: "center" },

  buttonRow: { flexDirection: "row", gap: 12 },
  cameraBtn: { flex: 1, flexDirection: "row", backgroundColor: "#F1F5F9", padding: 15, borderRadius: 12, justifyContent: "center", alignItems: "center", gap: 8 },
  cameraBtnText: { fontWeight: "700", color: "#1E293B" },
  submitBtn: { flex: 2, backgroundColor: "#0288D1", padding: 15, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  submitText: { color: "#FFF", fontWeight: "800", fontSize: 16 },

  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  heading: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  badgeCount: { backgroundColor: "#E2E8F0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeCountText: { fontSize: 12, fontWeight: "700", color: "#475569" },

  itemCard: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", borderLeftWidth: 5, borderLeftColor: "#0288D1", elevation: 2 },
  lowStockCard: { borderLeftColor: "#EF4444", backgroundColor: "#FFF5F5" },
  cardInfo: { flex: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  itemName: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  warningBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  warningText: { fontSize: 9, fontWeight: "900", color: "#EF4444" },
  detailRow: { flexDirection: "row", gap: 15 },
  detailLabel: { fontSize: 13, color: "#64748B" },
  detailValue: { fontWeight: "700", color: "#334155" },
  supplierText: { fontSize: 12, color: "#94A3B8", marginTop: 4 },

  cardActions: { gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  
  loaderContainer: { padding: 40, alignItems: "center" },
  loaderText: { marginTop: 10, color: "#64748B", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#94A3B8", marginTop: 20 }
});