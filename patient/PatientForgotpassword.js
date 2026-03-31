import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function PatientForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth > 768;

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      showAlert("Error", "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://hospitaldatabasemanagement.onrender.com/patient/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        showAlert("Success", data.message || "Password reset successful!");
        navigation.navigate("PatientLogin");
      } else {
        showAlert("Failed", data.message || "Password reset failed");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      showAlert("Error", "Something went wrong. Please try again.");
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
              onPress={() => navigation.navigate("PatientLogin")}
            >
              <MaterialIcons name="chevron-left" size={20} color="#718096" />
              <Text style={styles.backText}>Back to login</Text>
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <div style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>BM</Text>
              </div>
              <Text style={styles.brandName}>Bharat Medical Hall</Text>
            </View>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Securely update your patient account credentials</Text>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Email"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter New Password"
                  placeholderTextColor="#A0AEC0"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#718096"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#A0AEC0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#718096"
                  />
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
               <Text style={styles.welcomeTitle}>Patient Care Portal</Text>
               <Text style={styles.welcomeSubtitle}>
                 Your health records and appointments are just a click away. Reset your password to stay connected with your care team.
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
    shadowColor: "#00BCC9",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
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