import { apiRequest } from "./http";
import type { DashboardResponse } from "../types/dashboard";

export function getDashboard(branchId?: string) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return apiRequest<DashboardResponse>(`/dashboard${query}`);
}
