import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function SubAdminRegisterScreen() {
  const navigation = useNavigation();

  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});

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

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setJoiningDate(selectedDate);
  };

  const validateField = (field, value) => {
    let message = "";
    switch (field) {
      case "name":
        if (!value.trim()) message = "Full name is required";
        break;
      case "phone":
        if (!/^\d{10}$/.test(value)) message = "Phone must be 10 digits";
        break;
      case "email":
        if (!/\S+@\S+\.\S+/.test(value)) message = "Enter a valid email";
        break;
      case "password":
        if (value.length < 6) message = "At least 6 characters required";
        break;
      case "confirmPassword":
        if (value !== password) message = "Passwords do not match";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!image) newErrors.image = "Profile image required";
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!/^\d{10}$/.test(phone)) newErrors.phone = "Phone must be 10 digits";
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (password.length < 6) newErrors.password = "At least 6 characters required";
    if (confirmPassword !== password)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("cnfpass", confirmPassword);
    formData.append("joiningdate", joiningDate.toISOString().split("T")[0]);
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
      const res = await fetch(`${BASE_URL}/subadmin/register`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert("✅ Success", data.message || "Subadmin registered!");
        navigation.navigate("SubAdminLoginScreen");
      } else {
        Alert.alert("❌ Error", data.message || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={26} color="#1E88E5" />
      </TouchableOpacity>

      <Text style={styles.heading}>Sub Admin Registration</Text>

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

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChangeText={(text) => {
            setName(text);
            validateField("name", text);
          }}
        />
      </View>
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Phone Number"
          style={styles.input}
          keyboardType="numeric"
          maxLength={10}
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            validateField("phone", text);
          }}
        />
      </View>
      {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Email"
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            validateField("email", text);
          }}
        />
      </View>
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            validateField("password", text);
          }}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#777"
          />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <View style={styles.inputContainer}>
        <Ionicons name="lock-open-outline" size={20} color="#777" style={styles.icon} />
        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            validateField("confirmPassword", text);
          }}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#777"
          />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      )}

      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.dateInput}
      >
        <Ionicons name="calendar-outline" size={20} color="#1E88E5" />
        <Text style={styles.dateText}>
          {joiningDate ? joiningDate.toDateString() : "Select Joining Date"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={joiningDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text>Already have an account?</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("SubAdminLoginScreen")}
        >
          <Text style={styles.loginLink}> Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F9FAFB",
    flexGrow: 1,
  },
  backBtn: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E88E5",
    textAlign: "center",
    marginVertical: 15,
  },
  imagePicker: {
    alignSelf: "center",
    marginVertical: 10,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    padding: 12,
  },
  dateText: {
    marginLeft: 8,
    color: "#333",
  },
  button: {
    backgroundColor: "#1E88E5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#1E88E5",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginLeft: 4,
    fontSize: 12,
    marginTop: 2,
  },
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
