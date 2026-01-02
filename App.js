import React, { useEffect, useState } from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from "react-native";

import store from './utils/storage';
// Screens
import SplashScreen from './screens/SplashScreen';
import AttendanceNotificationScreen from './screens/AttendanceNotificationScreen';
import DashboardScreen from './screens/DashboardScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import AlertsScreen from './screens/AlertsScreen';
import ProfileScreen from './patient/Profilescreen';
import PatientAppointmentsScreen from './patient/BookingIDScreen';
import SignupLogin from './screens/SignupLogin';
import PatientSignupScreen from './patient/patientSignup';
import PatientLoginScreen from './patient/PatientLogin';
import EmpSignUp from './Employees/EmpSignUp';
import EmpLoginScreen from './Employees/EmpLoginScreen';
import EmpSideBar from './DrawerNavigation/EmpSideBar';
import SubAdminsidebar from './DrawerNavigation/SubAdminSideBar';
import Adminsidebar from './DrawerNavigation/AdminSidebar';
import TaskScreen from './Employees/TaskScreen';
import tasknotificationemp from './Employees/tasknotificationemp';
import LeaveApplyScreen from './Employees/LeaveApplyScreen';
import LeaveStatusScreen from './Employees/LeaveStatusScreen';
import Attendance from './Employees/Attendance';
import MainTabs from './navigation/MainTabs';
import SelectSignUp from './screens/SelectSignUp';
import PayslipScreen from './Employees/PayslipScreen';
import LeaveConfirmationScreen from './Employees/LeaveConfirmationScreen';
import EmployeeProfileScreen from './Employees/EmployeeProfileScreen';
import TimeSchedular from './Employees/TimeScheduler';
import Editempprofile from './Employees/EditEmployee';
import createtaskemployee from './Employees/createtaskemployee';
import DeptSignUp from './Department/DeptSignUp';
import SubAdminLoginScreen from './Department/SubAdminLogin';
import SubAdminDashboardScreen from './Department/SubadminDashboard';
import UpdateEmployeeScreen from './Department/UpdateEmpScreen';
import AdminPanelScreen from './Admin/AdminPanelScreen';
import EmployeeListScreen from './Department/EmpListScreen';
import SubAdminAddEmployee from "./Department/SubadminAddEmployee";
import AttendanceScreen from './Department/AttendanceScreen';
import CreateNewTask from './Department/CreateNewTask';
import TasksScreen from './Department/TasksAllScreen';
import SubAdminLeaveStatusScreen from './Department/SubAdminLeavestatusScreen';
import DepartmentScreen from './Department/Departmentscreen';
import SubAdminProfileScreen from './Department/Subadminprofile';
import AddMedicineScreen from './Department/Addmedicine';
import RoleScreen from './Department/RoleNamescreen';
import DoctorFeeScreen from './Department/DoctorAdding';
import SubadminPayslipScreen from './Department/subadminpayslip';
import ManageCustomerScreen from './Department/patients';
import ManageOrdersScreen from './Department/Orders';
import BookedAppointmentsScreen from './Department/BookedAppiontment';
import DoctorsListScreen from './Employees/EmpBookappointment';
import AppointmentPatientScreen from './Employees/BookPatientScreen';
import PatientBookingConfirmationScreen from './Employees/PatientBookingConfirmation';
import AdminRegisterScreen from './Admin/AdminSignup';
import AdminProfileScreen from './Admin/AdminProfile';
import AdminLoginScreen  from './Admin/AdminLogin';
import AdminListScreen from './Admin/AdminAllEmployees';
import UserManagementScreen from './Admin/UserManagementScreen';
import AttendanceLogsScreen from './Admin/AttendanceLogsScreen';
import TaskManagement from './Admin/AdminTaskManagement';
import SettingsScreen from './Admin/AdminSettingsscreen';
import PayrollScreen from './Admin/AdminPayrollScreen';
import LeaveApprovals from './Admin/AdminLeaveApprovals';
import kpiscreen from "./Admin/Adminkpiscreen";
import AdminBookedAppointmentsScreen from "./Admin/AdminBookingApointment";
import AdminAddMedicineScreen from "./Admin/AdminAddMedicine";
import AdminManageCustomerScreen from "./Admin/AdminAllPatients";
import AdminManageOrdersScreen from "./Admin/AdmincustomerOrders";
import AdminDoctorFeeScreen from "./Admin/AdminDoctorAdding";
import ReportScreen from "./Admin/AdminreportScreen";
import AdminBreakLogsScreen from "./Admin/AdminBreakLogsScreen";
import AdminEmployeeAttendanceRecords from "./Admin/AdminEmployeeAttendancetracking";
import BreakPenaltyScreen from "./Admin/AllEmployeeBreakPenality";
import AdminAddEmployee from "./Admin/AdminAddEmployee";
import AdminUpdateEmployeeScreen from "./Admin/AdminUpdateEmployee";
import AdminEmpAllowanceScreen from "./Admin/AdminEmployeeAllowances";
import OffDutyScreen from "./Employees/AttendanceOffDuty";
import HomeScreen from "./patient/PatientHome";
import DoctorAppointmentScreen from "./patient/DoctorScreen";
import DoctorDetailsScreen from "./patient/DoctorDetail";
import BookAppointmentScreen from "./patient/BookAppointment";
import PaymentScreen from "./patient/BookPaymentscreen";
import AppointmentConfirmation from "./patient/Appointmentconfirmationscreen";
import ShoppingCartScreen from "./patient/medicinecartscreen";
import AddDeliveryAddressScreen from "./patient/AddAddress";
import DeliveryAddressScreen from "./patient/SelectDeliveryAddress";
import CheckoutScreen from "./patient/Checkoutscreen";
import OrderSuccessScreen from "./patient/customerordersucess";
import OrdersScreen from "./patient/Ordersscreen";
import MedicineDetailsScreen from "./patient/Medicinedetailscreen";
import DepartmentChartScreen from "./Department/DepartmentChart";
import DoctorTokenBookingScreen from "./Department/DoctorTokens";
import MedicineProductsScreen from "./Employees/MedicineProducts";
import CartProductsScreen from "./Employees/CartScreen";
import PatientDetailsScreen from "./Employees/PatientDetails";
import SubAdminAllEmpListScreen from "./Admin/SubAdminAllemp";
import AdminREcurringAddTaskScreen from "./Admin/CreateRecurssiontask";
import RecurringAdminTasksScreen from "./Admin/RecurringAllTasks";
import AdminDoctorTokenScreen from "./Admin/AdminDoctortokens";
import invoice from "./Employees/Invoice";
import BottomTabs from "./navigation/BottomTabs";
import DoctorTabs from "./navigation/DoctorTabs";
import DoctorDashboard from "./Doctor/DoctorDashboard";
import DoctorProfile from "./Doctor/DoctorProfile";
import MyAppointmentsScreen from "./Doctor/DoctorAppointments";
import DoctorLoginScreen from "./Doctor/DoctorSignin";
import DoctorRegisterScreen from "./Doctor/DoctorSignup";
import DoctorForgotPasswordScreen from "./Doctor/DoctorForgotPassword";
import PatientForgotPasswordScreen from "./patient/PatientForgotpassword";
import EmpResetPasswordScreen from "./Employees/Empforgotpassword";
import DeptResetPasswordScreen from "./Department/DeptForgotpassword";
import RequestForm from "./Employees/EmployeeDoctorrequestform";
import EmployeeRequestListScreen from "./Employees/EmployeeRequestFormall";
import  RequestFormAllScreen from "./Admin/AdminDoctorrequestall";
import EmployeeWorkingDaysScreen from "./Admin/EmpWorkingdays";
import EmpPerformanceDashboard from "./Employees/EmpKpiKpa";
import BreakScreen from"./Employees/BreakInScreen";
import BreakOutScreen from "./Employees/BreakOutScreen";
import BreakLogsScreen from "./Department/BreakLogsScreen";
import SubadminAttendanceScreen from "./Department/Attendancelogin";
import SubadminOffDutyScreen from "./Department/AttendanceLogout";
import SubadminBreakInScreen from "./Department/SubadminBreakInScreen";
import SubadminBreakOutScreen from"./Department/SubadminBreakoutScreen";
import LatePenaltyScreen from "./Admin/LatePenalityScreen";
import EmployeeAttendancetracker from "./Department/EmployeeAttandencetracking";
import EmployeePerformance from "./Admin/EmployeePerformance";
import CRMScreen from"./Admin/CRMScreen";
import BreakTimeScheduler from "./Employees/BreakTimeScheduler";
import DeliveryBoyDashboard from "./DeliveryBoy/DeliveryBoyDashboard";
import DeliveryBoyLoginScreen from "./DeliveryBoy/DeliveryBoyLogin";
import DeliveryBoyProfileScreen from "./DeliveryBoy/DeliveryBoyProfileScreen";
import DeliveryBoyEdit from "./DeliveryBoy/DeliveryBoyEdit";
import DeliveryBoyTabs from "./navigation/DeliveryBoyTabs";
import DeliveryBoyOrders from "./DeliveryBoy/DleiveryBoyOrders";
import AddAllowanceUsageScreen from "./Employees/EmployeeAllowanceUsageform";
import AllowanceUsageListScreen from "./Admin/AdminEmpAllowanceUsageall";
import SubAdminEmpAllowanceScreen from "./Department/SubAdminEmployeeallowances";
import DoctorConsultantFeesScreen from "./Admin/AdminAddConsultancefees";
import SubAdminConsultantFeesScreen from "./Department/SubAdminAddConsultanceFee";
import AdminSalaryDeductionsScreen from "./Admin/AdminSalarayDeductionScreen";
import OrdersKpiScreen from "./Admin/OrdersKpiScreen";
import EmployeedeductionsFormScreen from "./Admin/Employeedeductionsform";
import AdminAttendanceScreen from "./Admin/AdminAttendanceLogin";
import AdminOffDutyScreen from "./Admin/AdminAttendanceLogout"
import PickerDashboardScreen from "./DeliveryBoy/PickerDashboard";
import AssignDeliveryBoyScreen from "./DeliveryBoy/AssignDeliveryBoyScreen";
import PickerAvailableDeliveryBoyScreen from "./DeliveryBoy/PickerAvailableDeliveryBoys";
import PickerProfileScreen from "./DeliveryBoy/PickerprofileScreen";
import PickerUpdateScreen from "./DeliveryBoy/PickerProfileEdit";
import IndividualOrderScreen from "./DeliveryBoy/InduvidualOrderScreen";
import PaymentCollectionScreen from "./DeliveryBoy/DeliveryBoyPymentcollection";
import BusDeliveryScreen from "./DeliveryBoy/DeliveryBoyBusDelivery";
import CashHandOverScreen from "./DeliveryBoy/CashHandoverScreen";
import CheckerScreen from "./DeliveryBoy/CheckerScreen";
import PickerTabs from "./navigation/PickerTabs";
import AdminBusDeliveredOrdersScreen from "./Admin/AdminBusDeliveryOrderScreen";
import OrdersDeliverdByDeliveryBoy from "./Admin/OrdersDeliverdByDeliverBoy";
import SalesOrderForm from "./Admin/CreateSalesOrderform";
import AddressChangeRequestScreen from "./DeliveryBoy/AddressesChangeRequestForm";
import AddressChangeRequests from "./Admin/DeliveryBoyAddresseschange";
import NurseDashboard from "./Doctor/NurseDashboard";
import AdminAssignDoctorScreen from "./Admin/AdminAssignNurse";
import DoctorApprovalScreen from "./Admin/AdminDoctorsAppprove";
import AdnminAddDoctor from "./Admin/AdminAddDoctor";
// 📦 Storage imports
import {
  getPatientId,
  getEmployeeId,
  getDoctorId,
  getSubadminId,
  getAdminId,
  getDeliveryAddressId, // optional if delivery boy has ID
} from "./utils/storage";

const Stack = createNativeStackNavigator();


export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
useEffect(() => {
  const checkUserLogin = async () => {
    try {
      const [
        patientId,
        employeeId,
        doctorId,
        subadminId,
        adminId,
      ] = await Promise.all([
        getPatientId(),
        getEmployeeId(),
        getDoctorId(),
        getSubadminId(),
        getAdminId(),
      ]);

      let route = "Splash";

      if (adminId) {
        route = "Adminsidebar";
      } else if (subadminId) {
        route = "SubAdmin";
      } else if (doctorId) {
        route = "DoctorsHome";
      } else if (employeeId) {
        console.log("Employee ID exists:", employeeId);

        try {
          const response = await fetch(
            `https://hospitaldatabasemanagement.onrender.com/employee/${employeeId}`
          );
          const data = await response.json();
          console.log("Employee fetch data:", data);

          const employee = data.employee;
          if (!employee) {
            console.log("No employee returned from API");
          }

          const role = employee?.role?.replace(/\s+/g, " ").trim().toLowerCase();
          console.log("Normalized role:", role);

          if (role === "hd delivery") {
      route = "DeliverBoyTabs";

    } else if (role === "picker") {   // ✅ NEW CONDITION ADDED
      route = "PickerTabs";           // <-- Change to your picker navigation screen

    } else {
      route = "EmpSideBar";
    }
        } catch (err) {
          console.log("Error fetching employee:", err);
        }
      } else if (patientId) {
        console.log("Patient ID exists:", patientId);
        route = "bottomtab"; // ✅ Your patient navigation screen
      }

      setInitialRoute(route);
    } catch (err) {
      console.error("Error checking login:", err);
      setInitialRoute("Splash");
    }
  };

  checkUserLogin();
}, []);




  if (!initialRoute) {
    // ⏳ Show loading screen while checking AsyncStorage
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }
  return (
    <NavigationContainer>
    <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
              <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="DoctorsHome" component={DoctorTabs} />
        <Stack.Screen name="shoppingcart" component={ShoppingCartScreen} />
        <Stack.Screen name="selectaddress" component={DeliveryAddressScreen} />
        <Stack.Screen name="checkout" component={CheckoutScreen}/>
        <Stack.Screen name="ordersucess" component={OrderSuccessScreen}/>
        <Stack.Screen name="patientorders" component={OrdersScreen}/>
        <Stack.Screen name="DoctorAppointment" component={DoctorsListScreen} />
        <Stack.Screen name="Patientbookingappointment" component={AppointmentPatientScreen} />
        <Stack.Screen name="AttendanceNotification" component={AttendanceNotificationScreen} />
        <Stack.Screen name="bottomtab" component={BottomTabs} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="Alerts" component={AlertsScreen} />
        <Stack.Screen name="PatientProfile" component={ProfileScreen} />
        <Stack.Screen name="SelectRole" component={SelectSignUp} />
        <Stack.Screen name="signuplogin" component={SignupLogin} />
        <Stack.Screen name="PatientSignUp" component={PatientSignupScreen} />
        <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
        <Stack.Screen name="EmpSignUp" component={EmpSignUp} />
        <Stack.Screen name="EmpLogin" component={EmpLoginScreen} />
        <Stack.Screen name="EmpSideBar" component={EmpSideBar} />
        <Stack.Screen name="Attendanceoffduty" component={OffDutyScreen} />
        <Stack.Screen name="TaskView" component={TaskScreen} />
        <Stack.Screen name="tasknotification" component={tasknotificationemp} />
        <Stack.Screen name="timeSchedular" component={TimeSchedular} />
        <Stack.Screen name="Attendance" component={Attendance} />
        <Stack.Screen name="payslip" component={PayslipScreen} />
        <Stack.Screen name="Leave" component={LeaveApplyScreen} />
        <Stack.Screen name="LeaveConfirm" component={LeaveConfirmationScreen} />
        <Stack.Screen name="LeaveStatus" component={LeaveStatusScreen} />
        <Stack.Screen name="createtaskemp" component={createtaskemployee} />
        <Stack.Screen name="ProfileScreen" component={EmployeeProfileScreen} />
        <Stack.Screen name="Dept" component={DeptSignUp} />
        <Stack.Screen name="DeptDashboard" component={SubAdminDashboardScreen} />
                <Stack.Screen name="UpdateEmployeeScreen" component={UpdateEmployeeScreen} />

        <Stack.Screen name="AdminDashboard" component={AdminPanelScreen} />
        <Stack.Screen name="SubAdmin" component={SubAdminsidebar} />
        <Stack.Screen name="SubAdminAddEmployee" component={SubAdminAddEmployee} /> 

        <Stack.Screen name="EmpList" component={EmployeeListScreen} /> 
        <Stack.Screen name="subadminedit" component={UpdateEmployeeScreen} />
        <Stack.Screen name="attendanceall" component={AttendanceScreen} />
        <Stack.Screen name="editemployeeprofilescreen" component={Editempprofile} />
        <Stack.Screen name="taskScreen" component={TasksScreen} />
        <Stack.Screen name="CreateTask" component={CreateNewTask} />
        <Stack.Screen name="subAdminleavestatus" component={SubAdminLeaveStatusScreen} />
        <Stack.Screen name="Adminsidebar" component={Adminsidebar} />
        <Stack.Screen name="subadminpayslip" component={SubadminPayslipScreen} />
        <Stack.Screen name="department" component={DepartmentScreen} />
        <Stack.Screen name="rolename" component={RoleScreen} />
        <Stack.Screen name="Adminallemployees" component={UserManagementScreen} />
        <Stack.Screen name="Adminattendancelogs" component={AttendanceLogsScreen} />
        <Stack.Screen name="Admintaskmanagement" component={TaskManagement} />
        <Stack.Screen name="Adminsettings" component={SettingsScreen} />
        <Stack.Screen name="AdminPayroll" component={PayrollScreen} />
        <Stack.Screen name="AdminLeaveApproval" component={LeaveApprovals} />
        <Stack.Screen name="AdminkpiScreen" component={kpiscreen} />
        <Stack.Screen name="Adminreportscreen" component={ReportScreen}/>
        <Stack.Screen name="AdminBreakLogsScreen" component={AdminBreakLogsScreen}/>
         <Stack.Screen name="AdminDoctorTokenScreen" component={AdminDoctorTokenScreen}/>
         <Stack.Screen name="AdminEmployeeAttendanceRecords" component={AdminEmployeeAttendanceRecords}/>
         <Stack.Screen name="BreakPenaltyScreen" component={BreakPenaltyScreen}/>
         <Stack.Screen name="AdminAddEmployee" component={AdminAddEmployee}/>
         <Stack.Screen name="AdminUpdateEmployeeScreen" component={ AdminUpdateEmployeeScreen}/>
         <Stack.Screen name="AdminEmpAllowanceScreen" component={ AdminEmpAllowanceScreen}/>

        <Stack.Screen name="patienthomescreen" component={HomeScreen}/>
        <Stack.Screen name="medicaldetailscreen" component={MedicineDetailsScreen}/>
        <Stack.Screen name="DoctorScreen" component={DoctorAppointmentScreen}/>
        <Stack.Screen name="doctordetail" component={DoctorDetailsScreen}/>
        <Stack.Screen name="bookappointment" component={BookAppointmentScreen}/>
        <Stack.Screen name="paymentscreen" component={PaymentScreen} />
        <Stack.Screen name="bookconfimationop" component={AppointmentConfirmation} />
        <Stack.Screen name="Doctorfeeadding" component={DoctorFeeScreen} />
        <Stack.Screen name="Addmedicine" component={AddMedicineScreen} />
        <Stack.Screen name="addaddress" component={AddDeliveryAddressScreen} />
        <Stack.Screen name="AllPatients" component={ManageCustomerScreen} />
        <Stack.Screen name="AllOrders" component={ManageOrdersScreen} />
        <Stack.Screen name="BookedAppointment" component={BookedAppointmentsScreen} />
        <Stack.Screen name="PatientBookingConfirmationScreen" component={PatientBookingConfirmationScreen}/>
        <Stack.Screen name="Departmentchart" component={DepartmentChartScreen} />
        <Stack.Screen name="Billing" component={MedicineProductsScreen} />
        <Stack.Screen name="billingcart" component={CartProductsScreen} />
        <Stack.Screen name="PatientDetailsScreen" component={PatientDetailsScreen} />
        <Stack.Screen name="invoice" component={invoice}/>
        <Stack.Screen name="BookAppointment" component={AdminBookedAppointmentsScreen}/>
        <Stack.Screen name="AdminAddMedicineScreen" component={AdminAddMedicineScreen}/>
        <Stack.Screen name="AdminAllPatients" component={AdminManageCustomerScreen}/>
        <Stack.Screen name="AdminCustomerOrders" component={AdminManageOrdersScreen}/>
        <Stack.Screen name="AddDoctors" component={AdminDoctorFeeScreen}/>
        <Stack.Screen name="SubAdminLoginScreen" component={SubAdminLoginScreen}/>
        <Stack.Screen name="AdminRegisterScreen" component={AdminRegisterScreen}/>
        <Stack.Screen name="AdminLoginScreen" component={AdminLoginScreen}/>
        <Stack.Screen name="AdminListScreen" component={AdminListScreen}/>
        <Stack.Screen name="SubAdminAllEmpListScreen" component={SubAdminAllEmpListScreen} />
        <Stack.Screen name="SubAdminProfileScreen" component={SubAdminProfileScreen}/>
        <Stack.Screen name="subadminDoctorTokenBookingScreen" component={DoctorTokenBookingScreen}/>
        <Stack.Screen name="AdminProfileScreen" component={AdminProfileScreen}/>
        <Stack.Screen name="PatientAppointmentsScreen" component={PatientAppointmentsScreen}/>
        <Stack.Screen name="createRecurringTaskScreen" component={AdminREcurringAddTaskScreen}/>
        <Stack.Screen name="RecurringAllTasks" component={RecurringAdminTasksScreen}/>
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboard}/>
        <Stack.Screen name="DoctorProfile" component={DoctorProfile}/>
        <Stack.Screen name="DoctorAppointmentsScreen" component={MyAppointmentsScreen}/>
        <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen}/>
        <Stack.Screen name="PatientForgotPasswordScreen" component={PatientForgotPasswordScreen}/>
        <Stack.Screen name="EmpResetPasswordScreen" component={EmpResetPasswordScreen}/>
        <Stack.Screen name="DeptResetPasswordScreen" component={DeptResetPasswordScreen}/>
        <Stack.Screen name="DoctorRegister" component={DoctorRegisterScreen} />
       <Stack.Screen name="DoctorRequestForm" component={RequestForm} />
       <Stack.Screen name="EmployeeRequestListScreen" component={EmployeeRequestListScreen} />

        <Stack.Screen name="DoctorForgotPasswordScreen" component={DoctorForgotPasswordScreen} />

     <Stack.Screen name="empworkingdays" component={EmployeeWorkingDaysScreen}/>
  <Stack.Screen name="DoctorRequestFormall" component={RequestFormAllScreen} />
  <Stack.Screen name="EmpPerformanceDashboard" component={EmpPerformanceDashboard}/>
 <Stack.Screen name="BreakInScreen" component={BreakScreen}/>
  <Stack.Screen name="BreakOutScreen" component={BreakOutScreen}/>
  <Stack.Screen name="BreakLogsScreen" component={BreakLogsScreen}/>
  <Stack.Screen name="subadminAttendanceloginScreen" component={SubadminAttendanceScreen}/>
   <Stack.Screen name="subadminAttendancelogoutScreen" component={SubadminOffDutyScreen}/>
   <Stack.Screen name="subadminBreakInScreen" component={ SubadminBreakInScreen}/>
<Stack.Screen name="subadminBreakoutScreen" component={  SubadminBreakOutScreen}/>
<Stack.Screen name="EmployeeAtendanceTracker" component={  EmployeeAttendancetracker}/>
<Stack.Screen name="EmployeeLatepenality" component={LatePenaltyScreen}/>
<Stack.Screen name="EmployeePerformance" component={EmployeePerformance}/>
<Stack.Screen name="CRMScreen" component={ CRMScreen}/>
<Stack.Screen name="breakTimeScheduler" component={BreakTimeScheduler}/>
<Stack.Screen name="DeliverBoyDashboard" component={DeliveryBoyDashboard}/>
<Stack.Screen name="DeliverBoyLogin" component={DeliveryBoyLoginScreen}/>
<Stack.Screen name="DeliverBoyTabs" component={DeliveryBoyTabs}/>
<Stack.Screen name="DeliverBoyProfileScreen" component={ DeliveryBoyProfileScreen}/>
<Stack.Screen name="DeliverBoyEdit" component={ DeliveryBoyEdit}/>
<Stack.Screen name="DeliverBoyOrders" component={ DeliveryBoyOrders}/>
<Stack.Screen name="AddAllowanceUsageScreen" component={ AddAllowanceUsageScreen}/>
<Stack.Screen name="AllowanceUsageListScreen" component={AllowanceUsageListScreen}/>
<Stack.Screen name="SubAdminEmpAllowanceScreen" component={SubAdminEmpAllowanceScreen}/>
<Stack.Screen name="AddDoctorConsultantFeesScreen" component={DoctorConsultantFeesScreen}/>
<Stack.Screen name="SubAdminConsultantFeesScreen" component={SubAdminConsultantFeesScreen}/>
<Stack.Screen name="AdminSalaryDeductionsScreen" component={AdminSalaryDeductionsScreen}/>
<Stack.Screen name="OrdersKpiScreen" component={OrdersKpiScreen}/>
<Stack.Screen name="EmployeedeductionsFormScreen" component={EmployeedeductionsFormScreen}/>
<Stack.Screen name="AdminAttendanceScreen" component={AdminAttendanceScreen}/>
<Stack.Screen name="AdminOffDutyScreen" component={AdminOffDutyScreen}/>
<Stack.Screen name="PickerDashboardScreen" component={PickerDashboardScreen}/>
<Stack.Screen name="AssignDeliveryBoyScreen" component={AssignDeliveryBoyScreen}/>
<Stack.Screen name="PickerAvailableDeliveryBoyScreen" component={PickerAvailableDeliveryBoyScreen}/>
<Stack.Screen name="PickerProfileScreen" component={PickerProfileScreen}/>
<Stack.Screen name="PickerUpdateScreen" component={PickerUpdateScreen}/>
<Stack.Screen name="IndividualOrderScreen" component={IndividualOrderScreen}/>
<Stack.Screen name="PaymentCollectionScreen" component={PaymentCollectionScreen}/>
<Stack.Screen name="BusDeliveryScreen" component={BusDeliveryScreen}/>
<Stack.Screen name="CashHandOverScreen" component={CashHandOverScreen}/>
<Stack.Screen name="CheckerScreen" component={CheckerScreen}/>

<Stack.Screen name="PickerTabs" component={PickerTabs}/>
<Stack.Screen name="AdminBusDeliveredOrdersScreen" component={AdminBusDeliveredOrdersScreen}/>
<Stack.Screen name=" OrdersDeliverdByDeliveryBoy" component={ OrdersDeliverdByDeliveryBoy}/>
<Stack.Screen name="SalesOrderForm" component={SalesOrderForm}/>
<Stack.Screen name="AddressChangeRequestScreen" component={AddressChangeRequestScreen}/>
<Stack.Screen name="AddressChangeRequests" component={AddressChangeRequests}/>
<Stack.Screen name="NurseDashboard" component={NurseDashboard}/>
<Stack.Screen name="AdminAssignDoctorScreen" component={AdminAssignDoctorScreen}/>

<Stack.Screen name="DoctorApprovalScreen" component={DoctorApprovalScreen}/>
<Stack.Screen name="AdnminAddDoctor" component={AdnminAddDoctor}/>



      </Stack.Navigator>
      
    </NavigationContainer>
  );
}
