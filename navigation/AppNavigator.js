import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import MainTabs from './MainTabs';
import EmpSideBar from '../DrawerNavigation/EmpSideBar';
import LeaveApplyScreen from '../Employees/LeaveApplyScreen';
import LeaveConfirmationScreen from '../Employees/LeaveConfirmationScreen';
import DoctorDetailsScreen from '../patient/DoctorDetail';
import BookAppointmentScreen from "../patient/BookAppointment";
import PaymentScreen from "../patient/BookPaymentscreen";
import AppointmentConfirmation from "../patient/Appointmentconfirmationscreen";
import MedicineDetailsScreen from "../patient/Medicinedetailscreen";
import ShoppingCartScreen from "../patient/medicinecartscreen";
import DeliveryAddressScreen from "../patient/SelectDeliveryAddress";
import CheckoutScreen from "../patient/Checkoutscreen";
import OrderSuccessScreen from "../patient/customerordersucess";
import OrdersScreen from "../patient/Ordersscreen";
import DoctorsListScreen from '../Employees/EmpBookappointment';
import AppointmentPatientScreen from '../Employees/BookPatientScreen';
const Stack = createNativeStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="EmpSideBar" component={EmpSideBar} />
      <Stack.Screen name="Leave" component={LeaveApplyScreen} />
      <Stack.Screen name="doctordetail" component={DoctorDetailsScreen} />
      <Stack.Screen name="bookappointment" component={BookAppointmentScreen}/>
      <Stack.Screen name="bookconfimationop" component={AppointmentConfirmation} />
      <Stack.Screen name="paymentscreen" component={PaymentScreen} />
      <Stack.Screen name="LeaveConfirm" component={LeaveConfirmationScreen} />
      <Stack.Screen name="SubAdmin" component={SubAdminRegistration} />  
      <Stack.Screen name="medicaldetailscreen" component={MedicineDetailsScreen}/>
      <Stack.Screen name="shoppingcart" component={ShoppingCartScreen} />
      <Stack.Screen name="selectaddress" component={DeliveryAddressScreen} />
       <Stack.Screen name="selectaddress" component={DeliveryAddressScreen} />
        <Stack.Screen name="checkout" component={CheckoutScreen}/>
        <Stack.Screen name="ordersucess" component={OrderSuccessScreen}/>
        <Stack.Screen name="patient orders" component={OrdersScreen}/>
         <Stack.Screen name="DoctorAppointment" component={DoctorsListScreen} />
        <Stack.Screen name="Patientbookingappointment" component={AppointmentPatientScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
