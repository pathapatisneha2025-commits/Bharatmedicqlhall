import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// Screens
import DoctorDashboard from "../Doctor/DoctorDashboard";
import DoctorProfile from "../Doctor/DoctorProfile";
import MyAppointmentsScreen from "../Doctor/DoctorAppointments";

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 0,
            elevation: 5,
            height: 70, // increased height
            paddingBottom: 10, // extra safe space
          },
          tabBarActiveTintColor: "#2c7be5",
          tabBarInactiveTintColor: "#888",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 5,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;

            switch (route.name) {
              case "Home":
                iconName = "home-outline";
                break;
              case "BookAppointment":
                iconName = "calendar-outline";
                break;
              case "Profile":
                iconName = "person-circle-outline";
                break;
              default:
                iconName = "ellipse-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={DoctorDashboard} options={{ title: "Home" }} />
        <Tab.Screen name="BookAppointment" component={MyAppointmentsScreen} options={{ title: "Book Appointment" }} />
        <Tab.Screen name="Profile" component={DoctorProfile} options={{ title: "Profile" }} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
