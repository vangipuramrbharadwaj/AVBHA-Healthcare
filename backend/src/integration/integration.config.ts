export interface IntegrationConfig {
  baseUrl: string;
  accessToken?: string;
  hospitalId?: string;
  branchId?: string;
  runAuthenticatedSmoke: boolean;
  runSequenceConcurrency: boolean;
}

function booleanEnv(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function integrationConfig(): IntegrationConfig {
  const config: IntegrationConfig = {
    baseUrl:
      optionalEnv("E2E_BASE_URL") ??
      "http://localhost:4000",
    runAuthenticatedSmoke: booleanEnv(
      "E2E_RUN_AUTHENTICATED_SMOKE",
    ),
    runSequenceConcurrency: booleanEnv(
      "E2E_RUN_SEQUENCE_CONCURRENCY",
    ),
  };

  const accessToken = optionalEnv(
    "E2E_ACCESS_TOKEN",
  );

  if (accessToken !== undefined) {
    config.accessToken = accessToken;
  }

  const hospitalId = optionalEnv(
    "E2E_HOSPITAL_ID",
  );

  if (hospitalId !== undefined) {
    config.hospitalId = hospitalId;
  }

  const branchId = optionalEnv(
    "E2E_BRANCH_ID",
  );

  if (branchId !== undefined) {
    config.branchId = branchId;
  }

  return config;
}