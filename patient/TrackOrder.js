import React, { useEffect, useState, useRef } from "react";
import { View, Text, Platform, StyleSheet, ActivityIndicator, useWindowDimensions } from "react-native";

// Leaflet CSS
import "leaflet/dist/leaflet.css";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function TrackOrderScreen({ route }) {
  const { orderId } = route.params;
  const [location, setLocation] = useState(null);
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
          await import("leaflet/dist/leaflet.css");

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

  // ------------------ FETCH LOCATION ------------------
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`${BASE_URL}/deliveryboy/location/${orderId}`);
        const json = await res.json();
        if (json.success && json.location) {
          setLocation({
            latitude: Number(json.location.latitude),
            longitude: Number(json.location.longitude),
            updated_at: json.location.updated_at,
          });
        }
      } catch (err) {
        console.error("Location fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Fetching live location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loader}>
        <Text>Delivery boy location not available yet</Text>
      </View>
    );
  }

  // ------------------ WEB ------------------
  if (Platform.OS === "web" && LeafletComponents) {
    return (
      <View style={[styles.screen, { height: mapHeight }]}>
        <LeafletComponents.MapContainer
          center={[location.latitude, location.longitude]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <LeafletComponents.TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <LeafletComponents.Marker position={[location.latitude, location.longitude]}>
            <LeafletComponents.Popup>
              Delivery Boy<br />
              Updated: {new Date(location.updated_at).toLocaleTimeString()}
            </LeafletComponents.Popup>
          </LeafletComponents.Marker>
        </LeafletComponents.MapContainer>
      </View>
    );
  }

  // ------------------ MOBILE ------------------
  if (RNMaps) {
    return (
      <RNMaps.MapView
        ref={mapRef}
        provider={RNMaps.PROVIDER_GOOGLE}
        style={[styles.map, { height: mapHeight }]}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <RNMaps.Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={`Delivery Boy`}
          description={`Updated: ${new Date(location.updated_at).toLocaleTimeString()}`}
          pinColor="green"
        />
      </RNMaps.MapView>
    );
  }

  return <Text>Loading map...</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f4f6f8", alignItems: "center", marginTop: 20 },
  map: { width: "100%", borderRadius: 12, overflow: "hidden" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
