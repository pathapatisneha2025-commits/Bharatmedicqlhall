import React from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar 
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons"; // Back icon

export default function SignupLogin({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Back Icon */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      {/* Logo at Top */}
      <Image 
        source={require("../assets/CompanyLogo.jpg")} // Local image
        style={styles.logo} 
      />

      {/* App Title */}
      <Text style={styles.title}>Bharat Medical Hall</Text>

      {/* Card Container */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome</Text>
        <Text style={styles.cardSubtitle}>Please choose an option to continue</Text>

        {/* Buttons */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate("EmpSignUp")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.loginButton]} 
          onPress={() => navigation.navigate("EmpLogin")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginTop: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
  },
  button: {
    width: "85%",
    backgroundColor: "#0000FF",
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#007BFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loginButton: {
    backgroundColor: "#0000FF", // Green for Login
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});
