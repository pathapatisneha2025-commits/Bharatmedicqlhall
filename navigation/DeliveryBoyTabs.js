import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screens
import DeliverBoyDashboard from "../DeliveryBoy/DeliveryBoyDashboard";  // 🏠 Home screen
import DeliverBoyOrders from "../DeliveryBoy/DleiveryBoyOrders";    // 📦 Orders screen
import DeliverBoyProfileScreen from "../DeliveryBoy/DeliveryBoyProfileScreen";      // 👤 Profile screen

const Tab = createBottomTabNavigator();

export default function DeliveryBoyTabs({ route, navigation }) {

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
            case "Orders":
              iconName = "file-tray-full-outline";
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
        component={DeliverBoyDashboard}
        options={{
          title: "Home",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("DeliverBoyDashboard");
          },
        })}
      />

      {/* 📦 Orders Tab */}
      <Tab.Screen
        name="Orders"
        component={ DeliverBoyOrders}
        options={{
          title: "Orders",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("DeliverBoyOrders");
          },
        })}
      />

      {/* 👤 Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={DeliverBoyProfileScreen}
        initialParams={{}}
        options={{
          title: "Profile",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("DeliverBoyProfileScreen");
          },
        })}
      />
    </Tab.Navigator>
  );
}
