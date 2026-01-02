import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screens
import PickerDashboardScreen from "../DeliveryBoy/PickerDashboard"
import PickerAvailableDeliveryBoyScreen from "../DeliveryBoy/PickerAvailableDeliveryBoys";
import PickerProfileScreen from "../DeliveryBoy/PickerprofileScreen";
import CheckerScreen from "../DeliveryBoy/CheckerScreen";
const Tab = createBottomTabNavigator();

export default function PickerTabs({ route, navigation }) {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          elevation: 5,
          height:80,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: "#2c7be5",
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = "home-outline";
              break;
            case "Deliveryboys":
              iconName = "bicycle-outline";
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
      {/* 🏠 Home Tab */}
      <Tab.Screen
        name="Home"
        component={PickerDashboardScreen}
        options={{
          title: "Home",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("PickerDashboardScreen");
          },
        })}
      />

     
      <Tab.Screen
        name="checkerScreen"
        component={CheckerScreen}
        options={{
          title: "Checker",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("CheckerScreen");
          },
        })}
      />

      {/* 👤 Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={PickerProfileScreen}
        initialParams={{}}
        options={{
          title: "Profile",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("PickerProfileScreen");
          },
        })}
      />
    </Tab.Navigator>
  );
}
