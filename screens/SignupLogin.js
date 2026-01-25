import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput,
  StyleSheet, 
  StatusBar, 
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  Platform
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';

export default function SignupLogin() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("employeeId").then((id) => {
      if (id) setIsLoggedIn(true);
    });
  }, []);

  // Scaling helpers
  const logoSize = Math.min(Math.max(width * 0.2, 140), 220); 
  const titleSize = Math.min(Math.max(width * 0.05, 24), 32);  
  const cardWidth = Math.min(Math.max(width * 0.8, 300), 500); 
  const buttonFontSize = Math.min(Math.max(width * 0.04, 16), 20); 
  const buttonHeight = Math.min(Math.max(height * 0.06, 45), 60); 

  const handleMarkAttendance = () => {
    navigation.navigate("EmpAttendanceScreen", { phone: isLoggedIn ? null : phone });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingHorizontal: width * 0.05 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Back Icon */}
      <TouchableOpacity 
        style={[styles.backButton, { top: Platform.OS === 'android' ? 20 : 10 }]} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      {/* Scrollable content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          {/* Logo */}
          <Image 
            source={require("../assets/CompanyLogo.jpg")}
            style={{ width: logoSize, height: logoSize, resizeMode: 'contain', marginBottom: 20 }}
          />

          {/* App Title */}
          <Text style={{ fontSize: titleSize, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>
            Bharat Medical Hall
          </Text>

          {/* Card */}
          <View style={[styles.card, { width: cardWidth, paddingVertical: 30, paddingHorizontal: 20 }]}>
            <Text style={[styles.cardTitle, { fontSize: buttonFontSize + 3 }]}>Welcome</Text>
            <Text style={[styles.cardSubtitle, { fontSize: buttonFontSize - 2 }]}>
              Please choose an option to continue
            </Text>

            {/* Sign Up */}
            <TouchableOpacity style={[styles.button, { height: buttonHeight }]} 
              onPress={() => navigation.navigate("EmpSignUp")}
            >
              <Text style={[styles.buttonText, { fontSize: buttonFontSize }]}>Sign Up</Text>
            </TouchableOpacity>

            {/* Login */}
            <TouchableOpacity style={[styles.button, styles.loginButton, { height: buttonHeight }]} 
              onPress={() => navigation.navigate("EmpLogin")}
            >
              <Text style={[styles.buttonText, { fontSize: buttonFontSize }]}>Login</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: "#ccc", width: "80%", marginVertical: 20 }} />

            {/* Mark Attendance */}
            {!isLoggedIn && (
              <TextInput
                placeholder="Enter Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  width: "85%",
                  marginBottom: 15,
                  textAlign: "center",
                }}
              />
            )}

            <TouchableOpacity style={[styles.button, { height: buttonHeight }]} onPress={handleMarkAttendance}>
              <Text style={[styles.buttonText, { fontSize: buttonFontSize }]}>Mark Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingBottom: 20 },
  innerContainer: { alignItems: 'center', width: '100%' },
  backButton: { position: "absolute", left: 15, zIndex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: "0px 6px 8px rgba(0,0,0,0.15)" },
    }),
  },
  cardTitle: { fontWeight: "600", marginBottom: 5 },
  cardSubtitle: { color: "gray", marginBottom: 20, textAlign: "center" },
  button: {
    width: "85%",
    backgroundColor: "#0000FF",
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: "#007BFF", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: "0px 3px 4px rgba(0,123,255,0.25)" },
    }),
  },
  loginButton: { backgroundColor: "#0000FF" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
