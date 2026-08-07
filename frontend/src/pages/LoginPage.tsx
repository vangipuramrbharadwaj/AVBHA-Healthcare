import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/Alert";
import { ApiClientError } from "../types/api";
import { getDeviceId, getDeviceName, getDeviceType } from "../utils/device";

export function LoginPage() {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hospitalCode, setHospitalCode] = useState("AVBHA");
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authenticated) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login({
        hospitalCode,
        login: loginValue,
        password,
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
        deviceType: getDeviceType(),
      });
      if (result.user.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        const state = location.state as { from?: string } | null;
        navigate(state?.from ?? "/", { replace: true });
      }
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-inner">
          <div className="login-logo"><span>A</span><div><strong>AVBHA</strong><small>Healthcare HMS</small></div></div>
          <div className="login-message"><span className="eyebrow">Hospital Operations Platform</span><h1>One secure workspace for modern healthcare operations.</h1><p>Clinical workflows, staff operations, billing, inventory and administration — connected through a tenant-safe hospital management platform.</p></div>
          <div className="trust-strip"><div><b>Role Based</b><span>Access Control</span></div><div><b>Tenant Safe</b><span>Hospital Isolation</span></div><div><b>Auditable</b><span>Secure Activity</span></div></div>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-card">
          <div className="mobile-login-logo"><span>A</span><strong>AVBHA</strong></div>
          <span className="eyebrow blue">Secure Sign In</span>
          <h2>Welcome back</h2>
          <p className="muted">Enter your hospital and account credentials to continue.</p>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <form onSubmit={submit} className="form-stack">
            <label><span>Hospital code</span><input value={hospitalCode} onChange={(e) => setHospitalCode(e.target.value.toUpperCase())} placeholder="e.g. AVBHA" autoComplete="organization" required /></label>
            <label><span>Username or email</span><input value={loginValue} onChange={(e) => setLoginValue(e.target.value)} placeholder="Enter username or email" autoComplete="username" required autoFocus /></label>
            <label><span>Password</span><div className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" required/><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></div></label>
            <button className="button button-primary button-large" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in securely"}</button>
          </form>
          <div className="login-help">Having trouble signing in? Contact your hospital administrator.</div>
        </div>
      </section>
    </div>
  );
}
