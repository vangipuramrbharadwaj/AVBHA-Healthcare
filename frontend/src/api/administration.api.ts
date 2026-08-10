import { apiRequest } from "./http";

export type Paged<T> = {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type BranchRecord = {
  id: string;
  branchCode: string;
  branchName: string;
  branchType: string;
  email?: string | null;
  phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isMainBranch: boolean;
  status: string;
};

export type DepartmentRecord = {
  id: string;
  branchId?: string | null;
  departmentCode: string;
  departmentName: string;
  departmentType: string;
  description?: string | null;
  status: string;
  branch?: { id: string; branchCode: string; branchName: string } | null;
  _count?: { employees: number; doctors: number; designations: number };
};

export type DesignationRecord = {
  id: string;
  departmentId?: string | null;
  designationCode: string;
  designationName: string;
  description?: string | null;
  status: string;
  department?: { id: string; departmentCode: string; departmentName: string } | null;
};

export type EmployeeRecord = {
  id: string;
  branchId?: string | null;
  departmentId: string;
  designationId: string;
  reportingManagerId?: string | null;
  employeeCode: string;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  mobile: string;
  email?: string | null;
  employmentType: string;
  joiningDate: string;
  basicSalary?: string | number | null;
  status: string;
  branch?: BranchRecord | null;
  department: DepartmentRecord;
  designation: DesignationRecord;
  reportingManager?: {
    id: string;
    employeeCode: string;
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
  } | null;
  _count?: { documents: number; directReports: number };
};

export type PermissionRecord = {
  id: string;
  permissionCode: string;
  moduleCode: string;
  actionCode: string;
  description?: string | null;
};

export type RoleRecord = {
  id: string;
  hospitalId?: string | null;
  roleCode: string;
  roleName: string;
  description?: string | null;
  isSystemRole: boolean;
  dataScope: string;
  status: string;
  rolePermissions: Array<{ permissionId: string; permission: PermissionRecord }>;
  _count?: { userRoles: number };
};

export type UserRecord = {
  id: string;
  branchId?: string | null;
  employeeId?: string | null;
  fullName: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  mustChangePassword: boolean;
  failedLoginCount: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  sessionTimeoutMinutes: number;
  twoFactorEnabled: boolean;
  status: string;
  branch?: BranchRecord | null;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    middleName?: string | null;
    lastName?: string | null;
    departmentId: string;
    designationId: string;
  } | null;
  userRoles: Array<{ roleId: string; role: RoleRecord }>;
};

export type HospitalProfile = {
  id: string;
  hospitalCode: string;
  legalName: string;
  displayName: string;
  registrationNumber?: string | null;
  gstin?: string | null;
  pan?: string | null;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  currencyCode: string;
  logoPath?: string | null;
  active: boolean;
};

const qs = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([k, v]) => v && params.set(k, v));
  const value = params.toString();
  return value ? `?${value}` : "";
};

export const listBranchesAdmin = () =>
  apiRequest<Paged<BranchRecord>>("/branches?page=1&pageSize=100");
export const createBranchAdmin = (body: unknown) =>
  apiRequest<BranchRecord>("/branches", { method: "POST", body });
export const updateBranchAdmin = (id: string, body: unknown) =>
  apiRequest<BranchRecord>(`/branches/${id}`, { method: "PATCH", body });

export const listDepartmentsAdmin = (search?: string) =>
  apiRequest<Paged<DepartmentRecord>>(`/departments${qs({ page:"1", pageSize:"100", search })}`);
export const createDepartmentAdmin = (body: unknown) =>
  apiRequest<DepartmentRecord>("/departments", { method: "POST", body });
export const updateDepartmentAdmin = (id: string, body: unknown) =>
  apiRequest<DepartmentRecord>(`/departments/${id}`, { method: "PATCH", body });

export const listDesignationsAdmin = () =>
  apiRequest<Paged<DesignationRecord>>("/designations?page=1&pageSize=100");
export const createDesignationAdmin = (body: unknown) =>
  apiRequest<DesignationRecord>("/designations", { method: "POST", body });

export const listEmployeesAdmin = (search?: string) =>
  apiRequest<Paged<EmployeeRecord>>(`/employees${qs({ page:"1", pageSize:"100", search })}`);
export const createEmployeeAdmin = (body: unknown) =>
  apiRequest<EmployeeRecord>("/employees", { method: "POST", body });
export const updateEmployeeAdmin = (id: string, body: unknown) =>
  apiRequest<EmployeeRecord>(`/employees/${id}`, { method: "PATCH", body });
export const updateEmployeeStatusAdmin = (id: string, status: string) =>
  apiRequest<EmployeeRecord>(`/employees/${id}/status`, {
    method: "PATCH",
    body: { status },
  });

export const listUsersAdmin = (search?: string) =>
  apiRequest<Paged<UserRecord>>(`/users${qs({ page:"1", pageSize:"100", search })}`);
export const createUserAdmin = (body: unknown) =>
  apiRequest<UserRecord>("/users", { method: "POST", body });
export const updateUserAdmin = (id: string, body: unknown) =>
  apiRequest<UserRecord>(`/users/${id}`, { method: "PATCH", body });
export const updateUserStatusAdmin = (id: string, status: string) =>
  apiRequest<UserRecord>(`/users/${id}/status`, { method:"PATCH", body:{status} });
export const setUserRolesAdmin = (id: string, roleIds: string[]) =>
  apiRequest<UserRecord>(`/users/${id}/roles`, { method:"PUT", body:{roleIds} });
export const resetUserPasswordAdmin = (
  id: string,
  temporaryPassword: string,
) => apiRequest<UserRecord>(`/users/${id}/reset-password`, {
  method:"POST",
  body:{ temporaryPassword, mustChangePassword:true },
});

export const listRolesAdmin = () => apiRequest<RoleRecord[]>("/roles");
export const createRoleAdmin = (body: unknown) =>
  apiRequest<RoleRecord>("/roles", { method:"POST", body });
export const updateRoleAdmin = (id:string, body:unknown) =>
  apiRequest<RoleRecord>(`/roles/${id}`, { method:"PATCH", body });
export const setRolePermissionsAdmin = (id:string, permissionIds:string[]) =>
  apiRequest<RoleRecord>(`/roles/${id}/permissions`, {
    method:"PUT",
    body:{ permissionIds },
  });
export const listPermissionsAdmin = () =>
  apiRequest<PermissionRecord[]>("/permissions");

export const getHospitalSettings = () =>
  apiRequest<HospitalProfile>("/hospitals/me");
export const updateHospitalSettings = (body: unknown) =>
  apiRequest<HospitalProfile>("/hospitals/me", { method:"PATCH", body });
