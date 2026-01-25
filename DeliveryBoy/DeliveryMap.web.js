import React from "react";
import { Dimensions, Text } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DeliveryMap({ deliveryLocation, customer }) {
  const mapWidth = Math.min(SCREEN_WIDTH - 24, 600);

  const lat = deliveryLocation?.latitude || customer?.latitude || 20.5937;
  const lng = deliveryLocation?.longitude || customer?.longitude || 78.9629;

  return (
    <iframe
      width={mapWidth}
      height="260"
      style={{ borderRadius: 12, border: 0 }}
      src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
      loading="lazy"
    ></iframe>
  );
}
