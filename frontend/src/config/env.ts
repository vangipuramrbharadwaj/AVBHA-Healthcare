function required(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : fallback;
}

export const appConfig = {
  apiBaseUrl: required(
    import.meta.env.VITE_API_BASE_URL as string | undefined,
    "http://localhost:4000/api/v1",
  ),
  appName: required(
    import.meta.env.VITE_APP_NAME as string | undefined,
    "AVBHA Healthcare HMS",
  ),
} as const;
