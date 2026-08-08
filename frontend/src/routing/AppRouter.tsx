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
            <Route path="ipd/*" element={modulePage("ipd.view","IPD","Admissions, beds, nursing, rounds and inpatient management.")}/>
            <Route path="laboratory/*" element={modulePage("laboratory.view","Laboratory","Lab catalog, orders, samples, results and verification.")}/>
            <Route path="radiology/*" element={modulePage("radiology.view","Radiology","Imaging orders, studies, contrast administration and reports.")}/>
            <Route path="pharmacy/*" element={modulePage("pharmacy.view","Pharmacy","Medicines, batches, purchasing, dispensing and pharmacy sales.")}/>
            <Route path="inventory/*" element={modulePage("inventory.view","Inventory","Central stores, stock, materials, purchases and transfers.")}/>
            <Route path="billing/*" element={modulePage("billing.view","Billing & Payments","Invoices, payments, advances, refunds and patient ledger.")}/>
            <Route path="operation-theatre/*" element={modulePage("operation_theatre.view","Operation Theatre","OT rooms, bookings, theatre workflow and recovery.")}/>
            <Route path="reports/*" element={modulePage("reports.view","Reports & MIS","Operational reports, analytics and management information.")}/>
            <Route path="notifications/*" element={<ModulePlaceholderPage title="Notifications" description="In-app alerts and communication centre."/>}/>
            <Route path="employees/*" element={modulePage("employees.view","Employees","Employee administration and workforce records.")}/>
            <Route path="doctors/*" element={<PermissionRoute permission="doctors.view"><DoctorsPage /></PermissionRoute>} />
            <Route path="departments/*" element={modulePage("departments.view","Departments","Hospital department master and organizational structure.")}/>
            <Route path="users/*" element={modulePage("users.view","Users","Application user accounts and access administration.")}/>
            <Route path="roles/*" element={<PermissionRoute anyOf={["roles.view","permissions.view"]}><ModulePlaceholderPage title="Roles & Permissions" description="Role-based access control and application permissions."/></PermissionRoute>}/>
            <Route path="settings/*" element={modulePage("settings.view","Settings","Hospital application and operational configuration.")}/>
            <Route path="403" element={<AccessDeniedPage/>}/>
            <Route path="*" element={<NotFoundPage/>}/>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>
  );
}
