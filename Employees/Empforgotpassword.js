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
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function EmpResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();

  // Desktop check
  const isDesktop = windowWidth > 768;

  const showAlert = (title, message) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      showAlert("Validation", "Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("Validation", "Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Validation", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/employee/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            newPassword,
            confirmNewPassword: confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        showAlert("Success", data.message || "Password reset successfully!");
        navigation.navigate("EmpLogin");
      } else {
        showAlert("Error", data.message || data.error || "Failed to reset password.");
      }
    } catch (error) {
      showAlert("Error", "Something went wrong. Please try again later.");
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
              <Text style={styles.backText}>Back to login</Text>
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>BM</Text>
              </View>
              <Text style={styles.brandName}>Bharat Medical Hall</Text>
            </View>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your registered email and set a new password</Text>

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
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#718096" />
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

        {/* RIGHT SIDE: BLUE PANEL */}
        {isDesktop && (
          <View style={styles.rightSide}>
            <View style={styles.welcomeBox}>
               <View style={styles.largeLogoBadge}>
                  <Text style={styles.largeLogoText}>BM</Text>
               </View>
               <Text style={styles.welcomeTitle}>Employee Portal</Text>
               <Text style={styles.welcomeSubtitle}>
                 Manage your workspace and healthcare records through our secure employee dashboard.
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
    backgroundColor: "#fff",
    paddingHorizontal: Platform.OS === 'web' ? "10%" : 20,
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
    backgroundColor: "#00BCC9",
    height: 52,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
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
  },
  welcomeSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
  },
});