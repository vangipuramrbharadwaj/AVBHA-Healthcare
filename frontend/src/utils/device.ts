const DEVICE_ID_KEY = "avbha.hms.device-id.v1";

export function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return "MOBILE";
  if (width < 1200) return "TABLET";
  return "DESKTOP";
}

export function getDeviceName(): string {
  return `${navigator.platform || "Browser"} - ${navigator.userAgent.includes("Safari") ? "Safari" : "Web Browser"}`.slice(0, 150);
}
