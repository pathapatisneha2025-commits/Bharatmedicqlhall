import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import Signature from "react-native-signature-canvas";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function CashHandoverScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { deliveryBoyId } = route.params;

  const [collections, setCollections] = useState({
    total_cash: 0,
    total_digital: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);

  const cameraRef = useRef(null);
  const signatureRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `https://hospitaldatabasemanagement.onrender.com/deliveryboy/${deliveryBoyId}/collections?date=${date}`
      );
      const data = await res.json();

      if (data.success) {
        setCollections({
          total_cash: data.total_cash || 0,
          total_digital: data.total_digital || 0,
        });
      } else {
        Alert.alert("Error", "Failed to fetch collections");
      }
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totalCollected =
    Number(collections.total_cash) + Number(collections.total_digital);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const result = await cameraRef.current.takePictureAsync({ quality: 0.6 });
    setPhoto(result.uri);
    setShowCamera(false);
  };

  const saveSignature = (sig) => {
    setSignature(sig);
    Alert.alert("Success", "Signature saved");
  };

  const handleHandover = async () => {
  if (!photo) {
    Alert.alert("Required", "Please take cashier photo");
    return;
  }
  if (!signature) {
    Alert.alert("Required", "Please save cashier signature");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("cashier_photo", {
      uri: photo,
      type: "image/jpeg",
      name: "cashier.jpg",
    });
    formData.append("signature", {
      uri: signature,
      type: "image/png",
      name: "signature.png",
    });
    formData.append("date", new Date().toISOString().split("T")[0]);
    formData.append("total_cash", collections.total_cash);
    formData.append("total_digital", collections.total_digital);
    formData.append("cash_returned", collections.total_cash);

    const res = await fetch(
      `https://hospitaldatabasemanagement.onrender.com/deliveryboy/${deliveryBoyId}/handover`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (data.success) {
      Alert.alert("Success", "Cash handover completed", [
        {
          text: "OK",
          onPress: () => {
            // ✅ Reset collections to 0
            setCollections({ total_cash: 0, total_digital: 0 });

            // ✅ Redirect back to DeliveryBoyDashboard
            navigation.navigate("DeliverBoyDashboard");
          },
        },
      ]);
    } else {
      Alert.alert("Error", data.message || "Failed");
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Submission failed");
  }
};


  if (loading)
        return (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text>Loading...</Text>
          </View>
        );
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* SCROLLABLE CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={26} />
              </TouchableOpacity>
              <View>
                <Text style={styles.title}>Payment Settlement</Text>
                <Text style={styles.subText}>Daily cash reconciliation</Text>
              </View>
            </View>

            {/* Total */}
            <View style={styles.statCard}>
              <Text style={styles.subText}>Total Collected Today</Text>
              <Text style={styles.total}>₹{totalCollected}</Text>
            </View>

            {/* Breakdown */}
            <View style={styles.card}>
              <Row label="Cash Received" value={`₹${collections.total_cash}`} />
              <Row
                label="Digital Payments"
                value={`₹${collections.total_digital}`}
              />
            </View>

            {/* Camera */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cashier Photo</Text>

              {showCamera ? (
                <>
                  {!permission?.granted && (
                    <TouchableOpacity onPress={requestPermission}>
                      <Text style={styles.permissionText}>
                        Grant Camera Permission
                      </Text>
                    </TouchableOpacity>
                  )}
                  <CameraView ref={cameraRef} style={styles.camera} />
                  <PrimaryButton text="Capture Photo" onPress={takePhoto} />
                </>
              ) : (
                <PrimaryButton
                  text={photo ? "Retake Photo" : "Take Photo"}
                  onPress={() => setShowCamera(true)}
                />
              )}

              {photo && (
                <Image source={{ uri: photo }} style={styles.preview} />
              )}
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Once submitted, this settlement cannot be edited.
              </Text>
            </View>

            {/* Spacer for sticky signature */}
            <View style={{ height: 300 }} />
          </ScrollView>

          {/* 🔒 STICKY SIGNATURE */}
          <View style={styles.stickySignature}>
            <Text style={styles.sectionTitle}>Cashier Signature</Text>

            <View style={styles.signatureWrapper}>
              <Signature
                ref={signatureRef}
                onOK={saveSignature}
                onEmpty={() => Alert.alert("Signature required")}
                autoClear={false}
                webStyle={signatureStyle}
              />
            </View>

            <View style={styles.signatureButtons}>
              <PrimaryButton
                text="Clear"
                onPress={() => {
                  signatureRef.current?.clearSignature();
                  setSignature(null);
                }}
              />
              <PrimaryButton
                text="Save"
                onPress={() => signatureRef.current?.readSignature()}
              />
            </View>

            <PrimaryButton
              text="Confirm Handover & Close"
              onPress={handleHandover}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}



/* ----------------- Components ----------------- */

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const PrimaryButton = ({ text, onPress }) => (
  <TouchableOpacity style={styles.btn} onPress={onPress}>
    <Text style={styles.btnText}>{text}</Text>
  </TouchableOpacity>
);

/* ----------------- Styles ----------------- */

const signatureStyle = `
  .m-signature-pad { box-shadow: none; border: none; }
  .m-signature-pad--body { border: 2px dashed #cbd5e1; border-radius: 12px; }
  .m-signature-pad--footer { display: none; }
`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scrollContent: { padding: 16 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", gap: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  subText: { color: "#6b7280" },

  statCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  total: { fontSize: 32, fontWeight: "700", color: "#16a34a" },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  label: { color: "#6b7280" },
  value: { fontWeight: "700" },

  btn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
    flex: 1,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  camera: { height: 220, borderRadius: 12, overflow: "hidden" },
  preview: { height: 120, marginTop: 10, borderRadius: 10 },

  stickySignature: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
  },

  signatureWrapper: {
    height: 180,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    overflow: "hidden",
  },
  signatureButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  permissionText: { color: "#b91c1c" },

  infoBox: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 12,
  },
  infoText: { color: "#166534", textAlign: "center" },
});
