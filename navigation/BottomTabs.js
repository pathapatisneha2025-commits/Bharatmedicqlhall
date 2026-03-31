import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Platform } from "react-native"; // Added Platform here

// Screens
import HomeScreen from "../patient/PatientHome";
import DoctorsScreen from "../patient/DoctorScreen";
import OrdersScreen from "../patient/Ordersscreen";
import MedicinesScreen from "../patient/Medicinescreen";
import ProfileScreen from "../patient/Profilescreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          // --- HIDE ON DESKTOP LOGIC ---
          display: Platform.OS === "web" ? "none" : "flex", 
          // -----------------------------
          position: "absolute",
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          height: 80,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
          borderTopWidth: 0,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: -4,
          fontWeight: "500",
        },
        tabBarActiveTintColor: "#2c7be5",
        tabBarInactiveTintColor: "#999",
        tabBarIcon: ({ color, focused }) => {
          let icon;
          switch (route.name) {
            case "Home":
              icon = <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />;
              break;
            case "Doctors":
              icon = <MaterialCommunityIcons name="stethoscope" size={26} color={color} />;
              break;
            case "Orders":
              icon = <FontAwesome5 name="clipboard-list" size={23} color={color} />;
              break;
            case "Medicines":
              icon = <FontAwesome5 name="pills" size={22} color={color} />;
              break;
            case "Profile":
              icon = <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={26} color={color} />;
              break;
            default:
              icon = <Ionicons name="ellipse-outline" size={26} color={color} />;
          }

          return (
            <View style={{ alignItems: "center", justifyContent: "center", top: 3 }}>
              {icon}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Doctors" component={DoctorsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Medicines" component={MedicinesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}