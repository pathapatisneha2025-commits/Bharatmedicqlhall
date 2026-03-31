import React, { useEffect, useState, useRef } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API_BASE = "https://hospitaldatabasemanagement.onrender.com";

const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export default function DeliveryBoyReportScreen() {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedBoy, setSelectedBoy] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [handovers, setHandovers] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const fetchDeliveryBoys = async () => {
      try {
        const res = await fetch(`${API_BASE}/employee/all`);
        const data = await res.json();
        const hdDeliveryBoys = data.employees.filter(
          (emp) => emp.role?.toLowerCase() === "hd delivery"
        );
        setDeliveryBoys(hdDeliveryBoys);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDeliveryBoys();
  }, []);

  const fetchReport = async () => {
    if (!selectedBoy || !selectedMonth) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/order-medicine/delivery/report?boyId=${selectedBoy}&month=${selectedMonth}`
      );
      const data = await res.json();
      setReport(data);

      const handoverRes = await fetch(`${API_BASE}/deliveryboy/handover/all`);
      const handoverData = await handoverRes.json();
      if (handoverData.success) {
        const filtered = handoverData.handovers.filter((h) => {
          const month = String(new Date(h.date).getMonth() + 1).padStart(2, "0");
          return h.deliveryboy_id == selectedBoy && month === selectedMonth;
        });
        setHandovers(filtered);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchLiveLocation = async (boyId) => {
    try {
      const res = await fetch(`${API_BASE}/deliveryboy/location/live?boyId=${boyId}`);
      const data = await res.json();
      if (data.success && data.location) {
        const loc = {
          lat: data.location.latitude,
          lng: data.location.longitude,
          status: data.location.status,
          name: deliveryBoys.find((b) => b.id == boyId)?.full_name || "Delivery Boy",
        };
        setLiveLocation(loc);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!liveLocation) return;
    const mapDiv = document.getElementById("map");
    if (!mapDiv) return;

    if (!mapRef.current) {
      mapRef.current = L.map("map", { scrollWheelZoom: true }).setView(
        [liveLocation.lat, liveLocation.lng],
        13
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Custom marker with popup
      markerRef.current = L.marker([liveLocation.lat, liveLocation.lng])
        .addTo(mapRef.current)
        .bindPopup(`<b>${liveLocation.name}</b><br>Status: ${liveLocation.status}`)
        .openPopup();
    } else {
      markerRef.current
        .setLatLng([liveLocation.lat, liveLocation.lng])
        .bindPopup(`<b>${liveLocation.name}</b><br>Status: ${liveLocation.status}`)
        .openPopup();
      mapRef.current.setView([liveLocation.lat, liveLocation.lng], 13);
    }
  }, [liveLocation]);

  useEffect(() => {
    if (!selectedBoy) return;
    fetchReport();
    fetchLiveLocation(selectedBoy);
    const interval = setInterval(() => fetchLiveLocation(selectedBoy), 5000);
    return () => clearInterval(interval);
  }, [selectedBoy, selectedMonth]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <h2 style={styles.title}>Delivery Boy Monthly Report</h2>

        <label>Select Delivery Boy:</label>
        <Picker selectedValue={selectedBoy} onValueChange={setSelectedBoy} style={styles.picker}>
          <Picker.Item label="Select" value="" />
          {deliveryBoys.map((boy) => (
            <Picker.Item key={boy.id} label={boy.full_name} value={boy.id} />
          ))}
        </Picker>

        <label>Select Month:</label>
        <Picker selectedValue={selectedMonth} onValueChange={setSelectedMonth} style={styles.picker}>
          <Picker.Item label="Select" value="" />
          {MONTHS.map((m) => (
            <Picker.Item key={m.value} label={m.label} value={m.value} />
          ))}
        </Picker>

        {loading && <ActivityIndicator size="large" color="blue" />}

        {report && (
          <div style={styles.reportContainer}>
            <p style={styles.reportText}>Total Orders: {report.totalOrders}</p>
            <p style={styles.reportText}>Total Revenue: ₹{report.totalRevenue}</p>

            <div
              id="map"
              style={{
                marginTop: 20,
                height: 500,
                width: "100%",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                overflow: "hidden",
                border: "1px solid #ddd",
              }}
            ></div>
          </div>
        )}

        {handovers.length > 0 && (
          <div style={styles.reportContainer}>
            <h3 style={styles.title}>Cash Handover</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Cash</th>
                  <th>Total Digital</th>
                  <th>Cash Returned</th>
                  <th>Cashier Photo</th>
                  <th>Signature</th>
                </tr>
              </thead>
              <tbody>
                {handovers.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.date).toLocaleDateString()}</td>
                    <td>₹{h.total_cash}</td>
                    <td>₹{h.total_digital}</td>
                    <td>₹{h.cash_returned}</td>
                    <td><img src={h.cashier_photo} style={{ width: 60, height: 60 }} /></td>
                    <td><img src={h.signature} style={{ width: 60, height: 60 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  picker: { marginVertical: 10, backgroundColor: "#fff" },
  reportContainer: { marginTop: 20, padding: 20, backgroundColor: "#fff", borderRadius: 10 },
  reportText: { fontSize: 18, marginBottom: 5 },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 10, textAlign: "center" },
};