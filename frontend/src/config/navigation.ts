export interface NavItem {
  label: string;
  path: string;
  symbol: string;
  permission?: string;
  anyOf?: string[];
  section: "Clinical" | "Operations" | "Administration";
}

export const navigationItems: NavItem[] = [
  { label: "Dashboard", path: "/", symbol: "⌂", permission: "dashboard.view", section: "Clinical" },
  { label: "Patients", path: "/patients", symbol: "◉", permission: "patients.view", section: "Clinical" },
  { label: "Appointments", path: "/appointments", symbol: "▣", permission: "appointments.view", section: "Clinical" },
  { label: "OPD", path: "/opd", symbol: "✚", permission: "opd.view", section: "Clinical" },
  { label: "IPD", path: "/ipd", symbol: "▤", permission: "ipd.view", section: "Clinical" },
  { label: "Laboratory", path: "/laboratory", symbol: "◈", permission: "laboratory.view", section: "Clinical" },
  { label: "Radiology", path: "/radiology", symbol: "◎", permission: "radiology.view", section: "Clinical" },
  { label: "Pharmacy", path: "/pharmacy", symbol: "✦", permission: "pharmacy.view", section: "Operations" },
  { label: "Inventory", path: "/inventory", symbol: "▦", permission: "inventory.view", section: "Operations" },
  { label: "Billing", path: "/billing", symbol: "₹", permission: "billing.view", section: "Operations" },
  { label: "Operation Theatre", path: "/operation-theatre", symbol: "◇", permission: "operation_theatre.view", section: "Operations" },
  { label: "Reports & MIS", path: "/reports", symbol: "▥", permission: "reports.view", section: "Operations" },
  { label: "Notifications", path: "/notifications", symbol: "●", anyOf: ["communications.view", "dashboard.view"], section: "Operations" },
  { label: "Employees", path: "/employees", symbol: "♙", permission: "employees.view", section: "Administration" },
  { label: "Doctors", path: "/doctors", symbol: "♟", permission: "doctors.view", section: "Administration" },
  { label: "Departments", path: "/departments", symbol: "▧", permission: "departments.view", section: "Administration" },
  { label: "Users", path: "/users", symbol: "◌", permission: "users.view", section: "Administration" },
  { label: "Roles & Permissions", path: "/roles", symbol: "◆", anyOf: ["roles.view", "permissions.view"], section: "Administration" },
  { label: "Settings", path: "/settings", symbol: "⚙", permission: "settings.view", section: "Administration" },
];
