
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const BASE_URL = "https://hospitaldatabasemanagement.onrender.com";

export default function AddressChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/salesorders/delivery/address-change/all`
      );
      const data = await response.json();

      if (response.ok && data.requests) {
        setRequests(data.requests);
      } else {
        Alert.alert("Error", "Failed to load requests.");
      }
    } catch (error) {
      console.log("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };
 if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading...</Text>
      </View>
    );
  /* ----------------------------------------------------
     🔥 SINGLE FUNCTION: APPROVE + REJECT
  ---------------------------------------------------- */
  const updateStatus = async (id, status) => {
    Alert.alert(
      "Confirm",
      `Are you sure you want to ${status} this request?`,
      [
        { text: "Cancel" },
        {
          text: status === "approved" ? "Approve" : "Reject",
          onPress: async () => {
            try {
              const res = await fetch(
                `${BASE_URL}/salesorders/delivery/address-change/update/${id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status }),
                }
              );

              const data = await res.json();

              if (res.ok) {
                Alert.alert(
                  "Success",
                  status === "approved"
                    ? "Address updated successfully."
                    : "Request rejected successfully."
                );

                setSelected(null);
                fetchRequests();
              } else {
                Alert.alert("Error", data.error || "Status update failed.");
              }
            } catch (err) {
              console.log(err);
              Alert.alert("Error", "Server error.");
            }
          },
        },
      ]
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Address Change Requests</Text>

      {/* ---------- TABLE ---------- */}
      <ScrollView horizontal>
        <View>
          {/* HEADER */}
          <View style={styles.tableHeader}>
            <Text style={[styles.cellHeader, { width: 80 }]}>Order ID</Text>
            <Text style={[styles.cellHeader, { width: 160 }]}>Old Address</Text>
            <Text style={[styles.cellHeader, { width: 160 }]}>New Address</Text>
            <Text style={[styles.cellHeader, { width: 130 }]}>Landmark</Text>
            <Text style={[styles.cellHeader, { width: 100 }]}>Pincode</Text>
            <Text style={[styles.cellHeader, { width: 150 }]}>Requested By</Text>
            <Text style={[styles.cellHeader, { width: 150 }]}>Actions</Text>
          </View>

          {/* ROWS */}
          {requests.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cell, { width: 80 }]}>{item.order_id}</Text>
              <Text style={[styles.cell, { width: 160 }]}>{item.old_address}</Text>
              <Text style={[styles.cell, { width: 160 }]}>{item.new_address}</Text>
              <Text style={[styles.cell, { width: 130 }]}>
                {item.new_landmark || "N/A"}
              </Text>
              <Text style={[styles.cell, { width: 100 }]}>
                {item.new_pincode || "N/A"}
              </Text>
              <Text style={[styles.cell, { width: 150 }]}>
                {item.delivery_boy_name}
              </Text>

              {/* ACTION BUTTONS */}
              <View style={[styles.actionCell, { width: 150 }]}>
                <TouchableOpacity
                  style={styles.actionBtnView}
                  onPress={() => setSelected(item)}
                >
                  <Feather name="eye" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnApprove}
                  onPress={() => updateStatus(item.id, "approved")}
                >
                  <Feather name="check-circle" size={18} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnReject}
                  onPress={() => updateStatus(item.id, "rejected")}
                >
                  <Feather name="x-circle" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ---------- MODAL ---------- */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>Request Details</Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Order ID: </Text>
                {selected?.order_id}
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Old Address: </Text>
                {selected?.old_address}
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>New Address: </Text>
                {selected?.new_address}
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Landmark: </Text>
                {selected?.new_landmark || "N/A"}
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Pincode: </Text>
                {selected?.new_pincode || "N/A"}
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Reason: </Text>
                {selected?.reason}
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.approveBtnLarge}
                  onPress={() => updateStatus(selected.id, "approved")}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtnLarge}
                  onPress={() => updateStatus(selected.id, "rejected")}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelected(null)}
                >
                  <Text style={styles.btnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------------- STYLES ---------------------- */

const blue = "#0D47A1";
const skyBlue = "#1976D2";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: blue,
    marginBottom: 12,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: blue,
    paddingVertical: 10,
  },

  cellHeader: {
    color: "white",
    fontWeight: "bold",
    paddingHorizontal: 6,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    backgroundColor: "white",
  },

  cell: {
    paddingHorizontal: 6,
    color: "#222",
  },

  actionCell: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  actionBtnView: {
    backgroundColor: skyBlue,
    padding: 8,
    borderRadius: 6,
  },

  actionBtnApprove: {
    backgroundColor: "#2E7D32",
    padding: 8,
    borderRadius: 6,
  },

  actionBtnReject: {
    backgroundColor: "#C62828",
    padding: 8,
    borderRadius: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: blue,
    marginBottom: 10,
  },

  modalText: {
    marginBottom: 10,
    fontSize: 15,
  },

  bold: { fontWeight: "bold" },

  modalButtons: { marginTop: 20 },

  approveBtnLarge: {
    backgroundColor: "#2E7D32",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },

  rejectBtnLarge: {
    backgroundColor: "#C62828",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },

  closeBtn: {
    backgroundColor: skyBlue,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
