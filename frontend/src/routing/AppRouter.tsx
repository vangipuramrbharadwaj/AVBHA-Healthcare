import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { ChangePasswordPage } from "../pages/ChangePasswordPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ModulePlaceholderPage } from "../pages/ModulePlaceholderPage";
import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PatientsPage } from "../pages/PatientsPage";
import { PatientCreatePage } from "../pages/PatientCreatePage";
import { PatientDetailPage } from "../pages/PatientDetailPage";
import { PatientEditPage } from "../pages/PatientEditPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PermissionRoute } from "./PermissionRoute";
import ReceptionOpdPage from "../pages/ReceptionOpdPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import DoctorsPage from "../pages/DoctorsPage";
import OpdPage from "../pages/OpdPage";
import IpdPage from "../pages/IpdPage";
import PharmacyPage from "../pages/PharmacyPage";
import InventoryPage from "../pages/InventoryPage";
import LaboratoryPage from "../pages/LaboratoryPage";
import RadiologyPage from "../pages/RadiologyPage";
import BillingPage from "../pages/BillingPage";
import OperationTheatrePage from "../pages/OperationTheatrePage";
import EmployeesPage from "../pages/EmployeesPage";
import DepartmentsPage from "../pages/DepartmentsPage";
import UsersPage from "../pages/UsersPage";
import RolesPermissionsPage from "../pages/RolesPermissionsPage";
import SettingsPage from "../pages/SettingsPage";



const modulePage=(permission:string,title:string,description:string)=><PermissionRoute permission={permission}><ModulePlaceholderPage title={title} description={description}/></PermissionRoute>;

export function AppRouter(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route element={<ProtectedRoute/>}>
          <Route path="/change-password" element={<ChangePasswordPage/>}/>
          <Route element={<AppLayout/>}>
            <Route index element={<PermissionRoute permission="dashboard.view"><DashboardPage/></PermissionRoute>}/>
            
        <Route path="reception" element={<ReceptionOpdPage />} />
<Route path="patients" element={<PermissionRoute permission="patients.view"><PatientsPage/></PermissionRoute>}/>
            <Route path="patients/new" element={<PermissionRoute permission="patients.create"><PatientCreatePage/></PermissionRoute>}/>
            <Route path="patients/:id" element={<PermissionRoute permission="patients.view"><PatientDetailPage/></PermissionRoute>}/>
            <Route path="patients/:id/edit" element={<PermissionRoute permission="patients.update"><PatientEditPage/></PermissionRoute>}/>
            <Route path="appointments/*" element={<PermissionRoute permission="appointments.view"><AppointmentsPage /></PermissionRoute>} />
            <Route path="opd/*" element={<PermissionRoute permission="opd.view"><OpdPage /></PermissionRoute>}/>
            <Route path="ipd/*" element={<PermissionRoute permission="ipd.view"><IpdPage /></PermissionRoute>}/>
            <Route path="laboratory/*" element={<PermissionRoute permission="laboratory.view"><LaboratoryPage /></PermissionRoute>}/>
            <Route path="radiology/*" element={<PermissionRoute permission="radiology.view"><RadiologyPage /></PermissionRoute>}/>
            <Route path="pharmacy/*" element={<PermissionRoute permission="pharmacy.view"><PharmacyPage /></PermissionRoute>}/>
            <Route path="inventory/*" element={<PermissionRoute permission="inventory.view"><InventoryPage /></PermissionRoute>}/>
            <Route path="billing/*" element={<PermissionRoute permission="billing.view"><BillingPage /></PermissionRoute>}/>
            <Route path="operation-theatre/*" element={<PermissionRoute permission="operation_theatre.view"><OperationTheatrePage /></PermissionRoute>}/>
            <Route path="reports/*" element={modulePage("reports.view","Reports & MIS","Operational reports, analytics and management information.")}/>
            <Route path="notifications/*" element={<ModulePlaceholderPage title="Notifications" description="In-app alerts and communication centre."/>}/>
            <Route path="employees/*" element={<PermissionRoute permission="employees.view"><EmployeesPage /></PermissionRoute>}/>
            <Route path="doctors/*" element={<PermissionRoute permission="doctors.view"><DoctorsPage /></PermissionRoute>} />
            <Route path="departments/*" element={<PermissionRoute permission="departments.view"><DepartmentsPage /></PermissionRoute>}/>
            <Route path="users/*" element={<PermissionRoute permission="users.view"><UsersPage /></PermissionRoute>}/>
            <Route path="roles/*" element={<PermissionRoute anyOf={["roles.view","permissions.view"]}><RolesPermissionsPage /></PermissionRoute>}/>
            <Route path="settings/*" element={<PermissionRoute anyOf={["settings.view","hospitals.view","branches.view"]}><SettingsPage /></PermissionRoute>}/>
            <Route path="403" element={<AccessDeniedPage/>}/>
            <Route path="*" element={<NotFoundPage/>}/>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}
