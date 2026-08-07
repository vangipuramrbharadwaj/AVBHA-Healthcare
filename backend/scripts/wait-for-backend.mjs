import process from "node:process";

const baseUrl =
  process.env.E2E_BASE_URL ??
  "http://localhost:4000";

const timeoutMs = Number(
  process.env.RELEASE_GATE_STARTUP_TIMEOUT_MS ??
    "30000",
);

const startedAt = Date.now();

while (Date.now() - startedAt < timeoutMs) {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/live`,
    );

    if (response.ok) {
      console.log(
        `Backend is ready at ${baseUrl}`,
      );
      process.exit(0);
    }
  } catch {
    // Backend may still be starting.
  }

  await new Promise((resolve) =>
    setTimeout(resolve, 500),
  );
}

console.error(
  `Backend did not become ready within ${timeoutMs}ms`,
);
process.exit(1);
