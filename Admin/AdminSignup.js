import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

const AdminRegisterScreen = () => {
  const navigation = useNavigation();

  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Open camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll permission is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || joiningDate;
    setShowDatePicker(Platform.OS === "ios");
    setJoiningDate(currentDate);
  };

  const validateFields = () => {
    let tempErrors = {};

    if (!image) tempErrors.image = "Profile image is required.";
    if (!name.trim()) tempErrors.name = "Full name is required.";
    else if (name.length < 3) tempErrors.name = "Name must be at least 3 characters.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) tempErrors.email = "Email is required.";
    else if (!emailRegex.test(email)) tempErrors.email = "Enter a valid email.";
if (!password.trim()) tempErrors.password = "Password is required.";
else if (password.length < 6) tempErrors.password = "Password must be at least 6 characters.";

if (!confirmPassword.trim()) tempErrors.confirmPassword = "Please confirm your password.";
else if (password !== confirmPassword) tempErrors.confirmPassword = "Passwords do not match.";

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone.trim()) tempErrors.phone = "Phone number is required.";
    else if (!phoneRegex.test(phone)) tempErrors.phone = "Enter a valid 10-digit phone number.";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateFields()) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirm_password", confirmPassword);
    formData.append("joining_date", joiningDate.toISOString().split("T")[0]);
    formData.append("phone", phone);

    if (image) {
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("image", {
        uri: image,
        name: `profile.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      });
    }

    try {
      const response = await fetch(`${BASE_URL}/adminlogin/register`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        Alert.alert("Success", data.message || "Admin registered!", [
          { text: "OK", onPress: () => navigation.navigate("AdminLoginScreen") },
        ]);
      } else {
        Alert.alert("Error", data.message || "Registration failed.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Something went wrong.");
      console.error(error);
    }
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading admin...</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Registration</Text>

      {/* Profile Image with options */}
       <TouchableOpacity onPress={takePhoto} style={styles.imagePicker}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={40} color="#1E88E5" />
            <Text style={{ color: "#1E88E5", fontSize: 12 }}>Upload Photo</Text>
          </View>
        )}
      </TouchableOpacity>
      {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}

      {/* Inputs */}
      <View style={styles.inputWrapper}>
        <Ionicons name="person" size={20} color="#4a90e2" />
        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
      </View>
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <View style={styles.inputWrapper}>
        <Ionicons name="mail" size={20} color="#4a90e2" />
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed" size={20} color="#4a90e2" />
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#4a90e2" />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed" size={20} color="#4a90e2" />
        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#4a90e2" />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      <View style={styles.inputWrapper}>
        <Ionicons name="call" size={20} color="#4a90e2" />
        <TextInput
          placeholder="Phone Number"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      {/* Joining Date */}
      <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar" size={20} color="#4a90e2" />
        <Text style={styles.dateText}>
          Joining Date: {joiningDate.toISOString().split("T")[0]}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={joiningDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register Admin</Text>}
      </TouchableOpacity>

       <View style={styles.loginContainer}>
        <Text>Already have an account?</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("AdminLoginScreen")}
        >
          <Text style={styles.loginLink}> Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AdminRegisterScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#333" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#ddd", paddingHorizontal: 10, marginBottom: 10 },
  input: { flex: 1, padding: 14, fontSize: 16 },
  errorText: { color: "red", marginLeft: 5, marginBottom: 5 },
  datePicker: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#ddd", padding: 14, marginBottom: 20 },
  dateText: { marginLeft: 10, fontSize: 16, color: "#333" },
  button: { backgroundColor: "#4a90e2", padding: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  imagePicker: { alignSelf: "center", marginBottom: 20, alignItems: "center" },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" },
 
   loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginLink: {
    color: "#1E88E5",
    fontWeight: "bold",
  },
});
