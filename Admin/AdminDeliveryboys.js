import React, { useEffect, useState, useRef } from "react";
import { View, Text, Platform, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";

// Leaflet CSS for Web
if (Platform.OS === "web") {
  import("leaflet/dist/leaflet.css");
}

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AdminDeliveryBoyMapScreen() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [LeafletComponents, setLeafletComponents] = useState(null);
  const [RNMaps, setRNMaps] = useState(null);

  const mapRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const mapHeight = isDesktop ? height - 140 : height - 120;

  // ------------------ DYNAMIC IMPORTS ------------------
  useEffect(() => {
    async function loadMaps() {
      if (Platform.OS === "web") {
        try {
          const leafletModule = await import("react-leaflet");
          const L = await import("leaflet");

          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          });

          setLeafletComponents({
            MapContainer: leafletModule.MapContainer,
            TileLayer: leafletModule.TileLayer,
            Marker: leafletModule.Marker,
            Popup: leafletModule.Popup,
          });
        } catch (err) {
          console.error("Leaflet load error:", err);
        }
      } else {
        try {
          const RNMapsModule = await import("react-native-maps");
          setRNMaps({
            MapView: RNMapsModule.default,
            Marker: RNMapsModule.Marker,
            PROVIDER_GOOGLE: RNMapsModule.PROVIDER_GOOGLE,
          });
        } catch (err) {
          console.error("RNMaps load error:", err);
        }
      }
    }
    loadMaps();
  }, []);

  // ------------------ FETCH LOCATIONS ------------------
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`${BASE_URL}/deliveryboy/admin/deliveryboy-locations`);
        const json = await res.json();
        if (json.success) setLocations(json.data);
      } catch (err) {
        console.error("Location fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading delivery boy locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🚚 Delivery Boy Live Tracking</Text>
      </View>

      <View style={[styles.contentWrapper, { width: isDesktop ? "90%" : "100%" }]}>
        {/* WEB MAP */}
        {Platform.OS === "web" && LeafletComponents ? (
          <View style={{ height: mapHeight, width: "100%" }}>
            <LeafletComponents.MapContainer
              center={[17.6779, 83.1991]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
            >
              <LeafletComponents.TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              {locations.map((item) => (
                <LeafletComponents.Marker
                  key={item.delivery_boy_id}
                  position={[item.latitude, item.longitude]}
                >
                  <LeafletComponents.Popup>
                    <b>{item.full_name}</b> <br />
                    Status: {item.status} <br />
                    Updated: {new Date(item.updated_at).toLocaleTimeString()}
                  </LeafletComponents.Popup>
                </LeafletComponents.Marker>
              ))}
            </LeafletComponents.MapContainer>
          </View>
        ) : RNMaps ? (
          // ANDROID / iOS MAP
          <RNMaps.MapView
            ref={mapRef}
            provider={RNMaps.PROVIDER_GOOGLE}
            style={[styles.map, { height: mapHeight }]}
            initialRegion={{
              latitude: 17.6779,
              longitude: 83.1991,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
           {locations.map((item) => {
  // Choose pin color based on status
  let pinColor = "red"; // default offline/unavailable
  if (item.status === "online") pinColor = "green";
  else if (item.status === "moving") pinColor = "blue";

  // Create custom icon
  const L = window.L; // Leaflet reference for web
  const icon = L.icon({
    iconUrl: `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${pinColor.replace("#","")}`,
    iconSize: [21, 34],
    iconAnchor: [10, 34],
    popupAnchor: [0, -30],
  });

  return (
    <LeafletComponents.Marker
      key={item.delivery_boy_id}
      position={[item.latitude, item.longitude]}
      icon={icon}
    >
      {/* Permanent label */}
      <LeafletComponents.Tooltip permanent direction="top" offset={[0, -15]}>
        <span style={{
          backgroundColor: "white",
          padding: "3px 6px",
          borderRadius: "5px",
          fontSize: "12px",
          fontWeight: "bold",
          border: "1px solid #ccc"
        }}>
          {item.full_name}
        </span>
      </LeafletComponents.Tooltip>

      <LeafletComponents.Popup>
        <b>{item.full_name}</b> <br />
        Status: {item.status} <br />
        Updated: {new Date(item.updated_at).toLocaleTimeString()}
      </LeafletComponents.Popup>
    </LeafletComponents.Marker>
  );
})}
          </RNMaps.MapView>
        ) : (
          <Text>Loading map...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f6f8", alignItems: "center", marginTop: 30 },
  header: { width: "100%", paddingVertical: 16, paddingHorizontal: 20, backgroundColor: "#0A84FF", alignItems: "center" },
  headerText: { fontSize: 22, fontWeight: "700", color: "#fff" },
  contentWrapper: { flex: 1, alignSelf: "center", paddingVertical: 10 },
  map: { width: "100%", borderRadius: 12, overflow: "hidden" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  nameLabel: {
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
});