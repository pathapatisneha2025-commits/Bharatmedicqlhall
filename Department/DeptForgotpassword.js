import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function DeptResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const handleResetPassword = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/subadmin/forgot-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            newpassword: password,
            confirmnewpassword: confirmPassword,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message || "Password reset successfully!");
        navigation.navigate("SubAdminLoginScreen");
      } else {
        Alert.alert("Error", data.error || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.mainWrapper}>
        {/* LEFT SIDE: FORM */}
        <View style={styles.leftSide}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity 
              style={styles.backLink} 
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="chevron-left" size={20} color="#718096" />
              <Text style={styles.backText}>Back to role selection</Text>
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>BM</Text>
              </View>
              <Text style={styles.brandName}>Bharat Medical Hall</Text>
            </View>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your credentials to update your account password</Text>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#718096" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#718096" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.submitBtnText}>Reset Password </Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* RIGHT SIDE: BLUE PANEL (Desktop only) */}
        {width > 768 && (
          <View style={styles.rightSide}>
            <View style={styles.welcomeBox}>
               <View style={styles.largeLogoBadge}>
                  <Text style={styles.largeLogoText}>BM</Text>
               </View>
               <Text style={styles.welcomeTitle}>Secure Your Account</Text>
               <Text style={styles.welcomeSubtitle}>
                 Access your healthcare management dashboard and stay connected with your medical records.
               </Text>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  leftSide: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? "10%" : 20,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  rightSide: {
    flex: 1,
    backgroundColor: "#0066FF",
    justifyContent: "center",
    alignItems: "center",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backText: {
    color: "#718096",
    fontSize: 14,
    marginLeft: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  logoBadge: {
    backgroundColor: "#0066FF",
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0066FF",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A202C",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
    marginBottom: 32,
  },
  formContainer: {
    maxWidth: 450,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A202C",
          outlineStyle: "none",   // ✅ removes web rectangle

  },
  submitBtn: {
    backgroundColor: "#00BCC9", // Teal color from screenshot
    height: 52,
    borderRadius: 30, // Rounded pill shape
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    shadowColor: "#00BCC9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  welcomeBox: {
    width: "70%",
    alignItems: "center",
  },
  largeLogoBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  largeLogoText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
  },
});