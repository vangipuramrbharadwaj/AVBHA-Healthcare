import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "src/routing/AppRouter.tsx");
if (!fs.existsSync(file)) {
  throw new Error("src/routing/AppRouter.tsx was not found.");
}

let source = fs.readFileSync(file, "utf8");

if (!source.includes("AppointmentsPage")) {
  const imports = [...source.matchAll(/^import .*;$/gm)];
  if (!imports.length) throw new Error("Router imports were not found.");
  const last = imports[imports.length - 1];
  const at = last.index + last[0].length;
  source =
    source.slice(0, at) +
    '\nimport AppointmentsPage from "../pages/AppointmentsPage";' +
    source.slice(at);
}

const placeholders = [
  '<Route path="appointments/*" element={modulePage("appointments.view","Appointments","Doctor schedules, bookings, queue and appointment operations.")}/>',
  '<Route path="appointments/*" element={modulePage("appointments.view", "Appointments", "Doctor schedules, bookings, queue and appointment operations.")} />',
];

if (!source.includes("<AppointmentsPage")) {
  const placeholder = placeholders.find((item) => source.includes(item));
  if (!placeholder) {
    throw new Error(
      "Existing Appointments placeholder route was not found. No route changes written.",
    );
  }

  source = source.replace(
    placeholder,
    '<Route path="appointments/*" element={<PermissionRoute permission="appointments.view"><AppointmentsPage /></PermissionRoute>} />',
  );
}

fs.writeFileSync(file, source);
console.log("Phase 4 Appointments route installed successfully.");
