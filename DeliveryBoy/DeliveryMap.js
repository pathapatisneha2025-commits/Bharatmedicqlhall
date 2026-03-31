import React from "react";
import { Dimensions, Platform, View } from "react-native";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GOOGLE_MAPS_API_KEY = "AIzaSyDqHcDP19qW9nuD5UO5M7f3v8eEUN9c5do"; // Replace with your API key

export default function DeliveryMap({ deliveryLocation, customerCoords }) {
  const mapWidth = Math.min(SCREEN_WIDTH - 32, 420);

  const deliveryLat = deliveryLocation?.latitude ?? 20.5937;
  const deliveryLng = deliveryLocation?.longitude ?? 78.9629;

  const customerLat = customerCoords?.latitude ?? 20.5937;
  const customerLng = customerCoords?.longitude ?? 78.9629;

  const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${deliveryLat},${deliveryLng}&destination=${customerLat},${customerLng}&mode=driving`;

  // Web
  if (Platform.OS === "web") {
    return (
      <div
        style={{
          width: mapWidth,
          height: 260,
          borderRadius: 12,
          overflow: "hidden",
          margin: "0 auto",
        }}
      >
        <iframe
          title="delivery-map"
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
        />
      </div>
    );
  }

  // Mobile
  return (
    <View
      style={{
        width: mapWidth,
        height: 260,
        borderRadius: 12,
        overflow: "hidden",
        alignSelf: "center",
      }}
    >
      <WebView source={{ uri: embedUrl }} javaScriptEnabled domStorageEnabled />
    </View>
  );
}