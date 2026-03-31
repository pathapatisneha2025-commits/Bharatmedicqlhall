import React, { useState ,useEffect} from "react";
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
  useWindowDimensions,
   KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
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
    const [loadingCount, setLoadingCount] = useState(0);
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const { width } = useWindowDimensions();
  
  // Logic for responsive grid
  const isDesktop = width > 768;
  const columnWidth = isDesktop ? "48%" : "100%";
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

   // Helper to format date for Web Input (YYYY-MM-DD)
  const formatDateForWeb = (date) => {
    return date.toISOString().split("T")[0];
  };
    useEffect(() => {
             let interval;
             if (loading) {
               setLoadingCount(0);
               interval = setInterval(() => setLoadingCount((c) => c + 1), 1000);
             } else clearInterval(interval);
             return () => clearInterval(interval);
           }, [loading]);
  // Open camera
 const takePhoto = async () => {
  // 🌐 WEB → open file picker (camera not supported)
  if (Platform.OS === "web") {
    await pickImage();
    return;
  }

  // 📱 MOBILE → use camera
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    showAlert("Camera permission required");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled && result.assets?.length) {
    setImage(result.assets[0].uri);
  }
};


  // Pick image from gallery
 const pickImage = async () => {
  // Permission needed only on mobile
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Denied", "Gallery permission is required");
      return;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled && result.assets?.length) {
    setImage(result.assets[0].uri);
  }
};

const chooseImage = () => {
  if (Platform.OS === "web") {
    pickImage(); // web only supports upload
  } else {
    showAlert("Profile Photo", "Choose an option", [
      { text: "Camera", onPress: takePhoto },
      { text: "Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  }
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
  if (Platform.OS === "web") {
    const response = await fetch(image);
    const blob = await response.blob();

    formData.append("image", blob, "profile.jpg");
  } else {
    formData.append("image", {
      uri: image,
      name: "profile.jpg",
      type: "image/jpeg",
    });
  }
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
        showAlert("Success", data.message || "Admin registered!", [
          { text: "OK", onPress: () => navigation.navigate("AdminLoginScreen") },
        ]);
      } else {
        showAlert("Error", data.message || "Registration failed.");
      }
    } catch (error) {
      setLoading(false);
      showAlert("Error", "Something went wrong.");
      console.error(error);
    }
  };
 if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading admin{loadingCount}s</Text>
      </View>
    );
  }
return (
    <View style={styles.mainContainer}>
      <View style={[styles.contentWrapper, { flexDirection: isDesktop ? "row" : "column-reverse" }]}>
        
        {/* LEFT SIDE: FORM */}
        <View style={styles.leftSection}>
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formContent}>
              <Text style={styles.mainTitle}>Admin Registration</Text>

              {/* Profile Image Section */}
              <View style={styles.imageSection}>
<TouchableOpacity onPress={chooseImage} style={styles.imagePicker}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={30} color="#1E88E5" />
                      <Text style={{ color: "#1E88E5", fontSize: 10 }}>Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
              </View>

              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter your name" 
                value={name} 
                onChangeText={setName} 
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={styles.input} 
                placeholder="john@example.com" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput 
                  style={[styles.input, { flex: 1, marginLeft: 10 }]} 
                  placeholder="9876543210" 
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        {/* Joining Date */}
<View style={{ width: columnWidth, marginTop: 15 }}>
  <Text style={styles.label}>Joining Date</Text>
  <View style={styles.dateInputWrapper}>
    <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 8 }} />
    
    {Platform.OS === "web" ? (
      <input
        type="date"
        value={formatDateForWeb(joiningDate)}
        onChange={(e) => setJoiningDate(new Date(e.target.value))}
        style={styles.webDateInput}
      />
    ) : (
      <TouchableOpacity
        style={{ flex: 1, justifyContent: "center" }}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: "#333" }}>{joiningDate.toDateString()}</Text>
      </TouchableOpacity>
    )}
  </View>
  {showDatePicker && Platform.OS !== "web" && (
    <DateTimePicker
      value={joiningDate}
      mode="date"
      display="default"
      onChange={onChangeDate}
      maximumDate={new Date()} // optional: prevent future dates
    />
  )}
</View>


              <View style={styles.passwordRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput 
                      style={styles.flexInput} 
                      placeholder="........" 
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#999" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Confirm</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput 
                      style={styles.flexInput} 
                      placeholder="........" 
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#999" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.signUpBtn}   onPress={handleRegister}>
                <Text style={styles.signUpText}>Sign Up →</Text>
              </TouchableOpacity>

              <View style={styles.loginFooter}>
                <Text style={styles.footerGrayText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("AdminLoginScreen")}>
                  <Text style={styles.loginLink}>Login here</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* RIGHT SIDE: BRANDING PANEL */}
        {isDesktop && (
          <View style={styles.rightSection}>
            <View style={styles.logoBox}>
               <Text style={styles.logoText}>BM</Text>
            </View>
            <Text style={styles.heroTitle}>Your Healthcare, Simplified.</Text>
            <Text style={styles.heroSubtitle}>
              Join thousands of patients managing their health records securely in one place.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default AdminRegisterScreen;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#fff" },
  contentWrapper: { flex: 1 },
  leftSection: { flex: 1, backgroundColor: "#fff" },
  rightSection: {
    flex: 1.2,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  formScroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 40 },
  formContent: { width: "85%", maxWidth: 420, alignSelf: "center" },
  mainTitle: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginBottom: 20 },
  imageSection: { alignItems: "center", marginBottom: 10 },
  imagePicker: { alignSelf: "center" },
  profileImage: { width: 80, height: 80, borderRadius: 40 },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f7ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0e3ff",
    borderStyle: "dashed",
  },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#efefef",
              outlineStyle: "none",   // ✅ removes web rectangle

  },
  phoneInputRow: { flexDirection: "row", alignItems: "center" },
  countryCode: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#efefef",
  },
  countryCodeText: { fontWeight: "700", fontSize: 15 },
  passwordRow: { flexDirection: "row" },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#efefef",
  },
  dateInputWrapper: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F8F9FA",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: Platform.OS === "web" ? 4 : 12,
  borderWidth: 1,
  borderColor: "#efefef",
},
webDateInput: {
  flex: 1,
  border: "none",
  backgroundColor: "transparent",
  fontSize: 15,
  paddingVertical: 6,
  outline: "none",
  color: "#333",
            outlineStyle: "none",   // ✅ removes web rectangle

},

  flexInput: { flex: 1, height: 48, fontSize: 15 },
  signUpBtn: {
    backgroundColor: "#00CCFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    elevation: 4,
    shadowColor: "#00CCFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  signUpText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loginFooter: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerGrayText: { color: "#777", fontSize: 14 },
  loginLink: { color: "#007AFF", fontWeight: "bold", fontSize: 14 },
  errorText: { color: "#ff4d4d", fontSize: 11, marginTop: 4 },
  logoBox: { backgroundColor: "#fff", padding: 25, borderRadius: 12, marginBottom: 40 },
  logoText: { fontSize: 48, fontWeight: "900", color: "#004085" },
  heroTitle: { color: "#fff", fontSize: 44, fontWeight: "900", textAlign: "center", marginBottom: 20 },
  heroSubtitle: { color: "#D1E9FF", fontSize: 19, textAlign: "center", lineHeight: 28, maxWidth: 400 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});