export interface HospitalSummary {
  id: string;
  code: string;
  name: string;
}

export interface BranchSummary {
  id: string;
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  hospitalId: string;
  branchId: string | null;
  fullName: string;
  username: string;
  email: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  hospital: HospitalSummary;
  branch: BranchSummary | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer" | string;
  expiresIn: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer" | string;
  expiresIn: string;
}

export interface SessionState {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
