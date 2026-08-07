import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/Alert";
import { ApiClientError } from "../types/api";

export function ChangePasswordPage() {
  const { user, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 12) return setError("New password must contain at least 12 characters.");
    if (newPassword !== confirmPassword) return setError("New password and confirmation do not match.");
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      await reloadProfile();
      navigate("/", { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Password could not be changed.");
    } finally { setSaving(false); }
  };

  return <div className="standalone-page"><div className="standalone-card"><div className="brand-mini"><span>A</span><strong>AVBHA</strong></div><span className="eyebrow blue">Account Security</span><h1>{user?.mustChangePassword ? "Set a new password" : "Change password"}</h1><p className="muted">For security, use at least 12 characters and avoid reusing your current password.</p>{user?.mustChangePassword ? <Alert tone="warning">A password change is required before accessing the application.</Alert> : null}{error ? <Alert tone="error">{error}</Alert> : null}<form onSubmit={submit} className="form-stack"><label><span>Current password</span><input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} autoComplete="current-password" required /></label><label><span>New password</span><input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} autoComplete="new-password" minLength={12} required /></label><label><span>Confirm new password</span><input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={12} required /></label><button className="button button-primary button-large" disabled={saving}>{saving ? "Updating…" : "Update password"}</button></form></div></div>;
}
