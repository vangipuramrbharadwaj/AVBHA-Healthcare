import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const routerCandidates = [
  "src/routing/AppRouter.tsx",
  "src/router/AppRouter.tsx",
  "src/App.tsx",
];

const routerPath = routerCandidates
  .map((item) => path.join(cwd, item))
  .find((item) => fs.existsSync(item));

if (!routerPath) {
  console.error(
    "Could not find AppRouter.tsx or App.tsx. Add ReceptionOpdPage manually to your router.",
  );
  process.exit(1);
}

let source = fs.readFileSync(routerPath, "utf8");

if (!source.includes("ReceptionOpdPage")) {
  const imports = [...source.matchAll(/^import .*;$/gm)];
  if (!imports.length) {
    console.error("Could not safely locate router imports.");
    process.exit(1);
  }

  const lastImport = imports[imports.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;

  let relativeImport = "../pages/ReceptionOpdPage";
  const routerRel = path.relative(cwd, routerPath).replaceAll("\\", "/");

  if (routerRel === "src/App.tsx") {
    relativeImport = "./pages/ReceptionOpdPage";
  }

  source =
    source.slice(0, insertAt) +
    `\nimport ReceptionOpdPage from "${relativeImport}";` +
    source.slice(insertAt);
}

if (
  !source.includes('path="/reception"') &&
  !source.includes("path='reception'") &&
  !source.includes('path="reception"')
) {
  const routeMarkers = [
    '<Route path="/patients"',
    '<Route path="patients"',
    '<Route path="/dashboard"',
    '<Route path="dashboard"',
  ];

  const marker = routeMarkers.find((item) => source.includes(item));

  if (!marker) {
    console.error(
      "ReceptionOpdPage import was added, but route insertion was not safe. Add <Route path=\"reception\" element={<ReceptionOpdPage />} /> beside your existing app routes.",
    );
    fs.writeFileSync(routerPath, source);
    process.exit(2);
  }

  const markerIndex = source.indexOf(marker);
  const routeStart = source.lastIndexOf("<Route", markerIndex);

  const routeLine =
    marker.startsWith('<Route path="/')
      ? '\n        <Route path="/reception" element={<ReceptionOpdPage />} />\n'
      : '\n        <Route path="reception" element={<ReceptionOpdPage />} />\n';

  source =
    source.slice(0, routeStart) +
    routeLine +
    source.slice(routeStart);
}

fs.writeFileSync(routerPath, source);
console.log(`Phase 3 route installed in ${path.relative(cwd, routerPath)}`);
console.log("Route: Reception & OPD -> /reception");
