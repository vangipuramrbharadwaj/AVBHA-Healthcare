import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const appPath = path.join(root, "backend/src/app.ts");
let app = fs.readFileSync(appPath, "utf8");

if (!app.includes('import { doctorsRouter } from "./modules/doctors";')) {
  const anchor = 'import { employeesRouter } from "./modules/employees";';
  if (!app.includes(anchor)) throw new Error("employeesRouter import not found.");
  app = app.replace(
    anchor,
    `${anchor}\nimport { doctorsRouter } from "./modules/doctors";`,
  );
}

if (!app.includes('app.use("/api/v1/doctors", doctorsRouter);')) {
  const anchor = 'app.use("/api/v1/employees", employeesRouter);';
  if (!app.includes(anchor)) throw new Error("employees route mount not found.");
  app = app.replace(
    anchor,
    `${anchor}\napp.use("/api/v1/doctors", doctorsRouter);`,
  );
}
fs.writeFileSync(appPath, app);

const routerPath = path.join(root, "frontend/src/routing/AppRouter.tsx");
let router = fs.readFileSync(routerPath, "utf8");

if (!router.includes('import DoctorsPage from "../pages/DoctorsPage";')) {
  const imports = [...router.matchAll(/^import .*;$/gm)];
  if (!imports.length) throw new Error("No imports found in AppRouter.tsx");
  const last = imports[imports.length - 1];
  const at = last.index + last[0].length;
  router =
    router.slice(0, at) +
    '\nimport DoctorsPage from "../pages/DoctorsPage";' +
    router.slice(at);
}

/* Replace any existing Doctors placeholder route first. */
router = router.replace(
  /<Route\s+path="\/?doctors\/?\*?"\s+element=\{modulePage\([\s\S]*?\)\}\s*\/>/g,
  '<Route path="doctors/*" element={<PermissionRoute permission="doctors.view"><DoctorsPage /></PermissionRoute>} />',
);

/* If there was no placeholder, insert beside Employees route. */
if (!router.includes("<DoctorsPage")) {
  const employeeRoute = router.match(
    /<Route\s+path="\/?employees\/?\*?"[\s\S]*?\/>/,
  );
  if (!employeeRoute) {
    throw new Error(
      "Could not safely locate Doctors placeholder or Employees route.",
    );
  }
  router = router.replace(
    employeeRoute[0],
    `${employeeRoute[0]}\n        <Route path="doctors/*" element={<PermissionRoute permission="doctors.view"><DoctorsPage /></PermissionRoute>} />`,
  );
}

fs.writeFileSync(routerPath, router);

console.log("Doctor Management fix integration applied.");
console.log("Backend: /api/v1/doctors");
console.log("Frontend: /doctors");
