export {};

declare global {
  namespace Express {
    interface AuthenticationContext {
      userId: string;
      hospitalId: string;
      branchId?: string;
      sessionId: string;
      roles: string[];
      permissions: string[];
      mustChangePassword: boolean;
    }

    interface TenantContext {
      hospitalId: string;
      branchId?: string;
    }

    interface Request {
      requestId?: string;
      auth?: AuthenticationContext;
      tenant?: TenantContext;
    }
  }
}
