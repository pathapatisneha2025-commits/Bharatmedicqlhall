// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

/** 🔐 Auth Token */
export const storeAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem("authToken", token);
  } catch (e) {
    console.log("❌ Error storing auth token:", e);
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem("authToken");
  } catch (e) {
    console.log("❌ Error getting auth token:", e);
    return null;
  }
};

/** 🩺 Patient ID */
export const storePatientId = async (id) => {
  try {
    await AsyncStorage.setItem("patientId", id.toString());
  } catch (e) {
    console.log("❌ Error storing patient ID:", e);
  }
};

export const getPatientId = async () => {
  try {
    return await AsyncStorage.getItem("patientId");
  } catch (e) {
    console.log("❌ Error getting patient ID:", e);
    return null;
  }
};

/** 👨‍⚕️ Employee ID */
export const storeEmployeeId = async (id) => {
  try {
    await AsyncStorage.setItem("employeeId", id.toString());
  } catch (e) {
    console.log("❌ Error storing employee ID:", e);
  }
};

export const getEmployeeId = async () => {
  try {
    return await AsyncStorage.getItem("employeeId");
  } catch (e) {
    console.log("❌ Error getting employee ID:", e);
    return null;
  }
};

/** 🧑‍💼 Subadmin ID */
export const storeSubadminId = async (id) => {
  try {
    await AsyncStorage.setItem("subadminId", id.toString());
  } catch (e) {
    console.log("❌ Error storing subadmin ID:", e);
  }
};

export const getSubadminId = async () => {
  try {
    return await AsyncStorage.getItem("subadminId");
  } catch (e) {
    console.log("❌ Error getting subadmin ID:", e);
    return null;
  }
};

/** 👨‍💼 Admin ID */
export const storeAdminId = async (id) => {
  try {
    await AsyncStorage.setItem("adminId", id.toString());
  } catch (e) {
    console.log("❌ Error storing admin ID:", e);
  }
};

export const getAdminId = async () => {
  try {
    return await AsyncStorage.getItem("adminId");
  } catch (e) {
    console.log("❌ Error getting admin ID:", e);
    return null;
  }
};
/** 💊 Medicine ID */
export const storeMedicineId = async (id) => {
  try {
    await AsyncStorage.setItem("medicineId", id.toString());
  } catch (e) {
    console.log("❌ Error storing medicine ID:", e);
  }
};

export const getMedicineId = async () => {
  try {
    return await AsyncStorage.getItem("medicineId");
  } catch (e) {
    console.log("❌ Error getting medicine ID:", e);
    return null;
  }
};
/** 🏠 Delivery Address ID */
export const storeDeliveryAddressId = async (id) => {
  try {
    await AsyncStorage.setItem("deliveryAddressId", id.toString());
  } catch (e) {
    console.log("❌ Error storing delivery address ID:", e);
  }
};

export const getDeliveryAddressId = async () => {
  try {
    return await AsyncStorage.getItem("deliveryAddressId");
  } catch (e) {
    console.log("❌ Error getting delivery address ID:", e);
    return null;
  }
};
export const storeOrderId = async (orderId) => {
  try {
    await AsyncStorage.setItem("lastOrderId", orderId);
  } catch (e) {
    console.log("❌ Error storing order ID:", e);
  }
};

/** 🔑 Get last order ID */
export const getOrderId = async () => {
  try {
    return await AsyncStorage.getItem("lastOrderId");
  } catch (e) {
    console.log("❌ Error getting order ID:", e);
    return null;
  }
};
/** 👨‍⚕️ Doctor ID */
export const storeDoctorId = async (id) => {
  try {
    await AsyncStorage.setItem("doctorId", id.toString());
  } catch (e) {
    console.log("❌ Error storing doctor ID:", e);
  }
};

export const getDoctorId = async () => {
  try {
    return await AsyncStorage.getItem("doctorId");
  } catch (e) {
    console.log("❌ Error getting doctor ID:", e);
    return null;
  }
};

/** 🧹 Clear All */
export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.log("❌ Error clearing storage:", e);
  }
};
