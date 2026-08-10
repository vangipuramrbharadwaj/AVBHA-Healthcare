import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserAdmin,
  listBranchesAdmin,
  listEmployeesAdmin,
  listRolesAdmin,
  listUsersAdmin,
  resetUserPasswordAdmin,
  setUserRolesAdmin,
  updateUserAdmin,
  type BranchRecord,
  type EmployeeRecord,
  type RoleRecord,
  type UserRecord,
} from "../api/administration.api";
import "../styles/administration.css";

function employeeName(employee: EmployeeRecord) {
  return [
    employee.title,
    employee.firstName,
    employee.middleName,
    employee.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function userStatusClass(status: string) {
  return status.toLowerCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    branchId: "",
    fullName: "",
    username: "",
    email: "",
    phone: "",
    temporaryPassword: "",
    sessionTimeoutMinutes: "30",
    roleIds: [] as string[],
  });

  async function load() {
    try {
      setError("");

      const [
        userResult,
        employeeResult,
        roleResult,
        branchResult,
      ] = await Promise.all([
        listUsersAdmin(search),
        listEmployeesAdmin(),
        listRolesAdmin(),
        listBranchesAdmin(),
      ]);

      setUsers(userResult.items);
      setEmployees(employeeResult.items);
      setRoles(roleResult);
      setBranches(branchResult.items);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load users.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const availableEmployees = useMemo(() => {
    const alreadyLinked = new Set(
      users
        .filter((user) => user.id !== editing?.id)
        .map((user) => user.employeeId)
        .filter((id): id is string => Boolean(id)),
    );

    return employees.filter(
      (employee) => !alreadyLinked.has(employee.id),
    );
  }, [employees, users, editing]);

  const activeUsers = users.filter(
    (user) => user.status === "ACTIVE",
  ).length;

  const lockedUsers = users.filter((user) =>
    ["LOCKED", "SUSPENDED"].includes(user.status),
  ).length;

  function resetForm() {
    setForm({
      employeeId: "",
      branchId: "",
      fullName: "",
      username: "",
      email: "",
      phone: "",
      temporaryPassword: "",
      sessionTimeoutMinutes: "30",
      roleIds: [],
    });
  }

  function beginCreate() {
    setEditing(null);
    resetForm();
    setError("");
    setSuccess("");
    setOpen(true);
  }

  function beginEdit(user: UserRecord) {
    setEditing(user);
    setError("");
    setSuccess("");
    setForm({
      employeeId: user.employeeId ?? "",
      branchId: user.branchId ?? "",
      fullName: user.fullName,
      username: user.username,
      email: user.email ?? "",
      phone: user.phone ?? "",
      temporaryPassword: "",
      sessionTimeoutMinutes: String(
        user.sessionTimeoutMinutes ?? 30,
      ),
      roleIds: user.userRoles.map((item) => item.roleId),
    });
    setOpen(true);
  }

  function selectEmployee(employeeId: string) {
    const employee = employees.find(
      (item) => item.id === employeeId,
    );

    if (!employee) {
      setForm((current) => ({
        ...current,
        employeeId,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      employeeId,
      branchId: employee.branchId ?? current.branchId,
      fullName: employeeName(employee),
      email: employee.email ?? "",
      phone: employee.mobile ?? "",
    }));
  }

  function toggleRole(roleId: string) {
    setForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (!form.fullName.trim()) {
        throw new Error("Full name is required.");
      }

      if (!form.username.trim()) {
        throw new Error("Username is required.");
      }

      if (!editing && form.temporaryPassword.length < 8) {
        throw new Error(
          "Temporary password must contain at least 8 characters.",
        );
      }

      if (editing) {
        await updateUserAdmin(editing.id, {
          branchId: form.branchId || null,
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          sessionTimeoutMinutes: Number(
            form.sessionTimeoutMinutes,
          ),
        });

        await setUserRolesAdmin(editing.id, form.roleIds);

        setSuccess("User updated successfully.");
      } else {
        await createUserAdmin({
          employeeId: form.employeeId || null,
          branchId: form.branchId || null,
          fullName: form.fullName.trim(),
          username: form.username.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          temporaryPassword: form.temporaryPassword,
          mustChangePassword: true,
          sessionTimeoutMinutes: Number(
            form.sessionTimeoutMinutes,
          ),
          status: "ACTIVE",
          roleIds: form.roleIds,
        });

        setSuccess(
          "User created successfully with a temporary password.",
        );
      }

      setOpen(false);
      await load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to save user.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(user: UserRecord) {
    const password = window.prompt(
      `Enter a temporary password for ${user.fullName} (minimum 8 characters):`,
    );

    if (!password) return;

    if (password.length < 8) {
      setError(
        "Temporary password must contain at least 8 characters.",
      );
      return;
    }

    try {
      setError("");
      await resetUserPasswordAdmin(user.id, password);
      setSuccess(
        "Temporary password reset successfully. The user will be required to change it.",
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to reset password.",
      );
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-hero">
        <div>
          <span className="admin-eyebrow">
            ACCESS ADMINISTRATION
          </span>
          <h1>Users</h1>
          <p>
            Create application accounts from employees, assign roles,
            control branch access and manage account security.
          </p>
        </div>

        <button
          className="admin-primary"
          type="button"
          onClick={beginCreate}
        >
          + Add User
        </button>
      </header>

      {error ? (
        <div className="admin-alert error">{error}</div>
      ) : null}

      {success ? (
        <div className="admin-alert success">{success}</div>
      ) : null}

      <section className="admin-kpis">
        <Kpi label="User Accounts" value={users.length} />
        <Kpi label="Active" value={activeUsers} />
        <Kpi label="Locked / Suspended" value={lockedUsers} />
        <Kpi label="Roles Available" value={roles.length} />
      </section>

      <div className="admin-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, username, email or phone"
        />

        <button type="button" onClick={() => void load()}>
          Search
        </button>
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <span>APPLICATION USERS</span>
            <h2>Login Accounts</h2>
          </div>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Employee</th>
                <th>Branch</th>
                <th>Roles</th>
                <th>Last Login</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <small>
                      {user.email || user.phone || "No contact"}
                    </small>
                  </td>

                  <td>{user.username}</td>

                  <td>
                    {user.employee?.employeeCode ??
                      "Independent account"}
                  </td>

                  <td>
                    {user.branch?.branchName ?? "Hospital-wide"}
                  </td>

                  <td>
                    <div className="admin-role-tags">
                      {user.userRoles.length ? (
                        user.userRoles.map((item) => (
                          <span key={item.roleId}>
                            {item.role.roleName}
                          </span>
                        ))
                      ) : (
                        <span>No role</span>
                      )}
                    </div>
                  </td>

                  <td>
                    {user.lastLoginAt
                      ? new Date(
                          user.lastLoginAt,
                        ).toLocaleString("en-IN")
                      : "Never"}
                  </td>

                  <td>
                    <span
                      className={`admin-pill ${userStatusClass(
                        user.status,
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="admin-link"
                      type="button"
                      onClick={() => beginEdit(user)}
                    >
                      Edit
                    </button>

                    <button
                      className="admin-link"
                      type="button"
                      onClick={() => void resetPassword(user)}
                    >
                      Password
                    </button>
                  </td>
                </tr>
              ))}

              {!users.length ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    No user accounts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {open ? (
        <div
          className="admin-modal-bg"
          onMouseDown={() => {
            if (!busy) setOpen(false);
          }}
        >
          <form
            className="admin-modal"
            onSubmit={submit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>USER ACCOUNT</span>
                <h2>
                  {editing ? "Edit User" : "Create User"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="admin-form">
              <div className="admin-grid">
                {!editing ? (
                  <label className="admin-field wide">
                    <span>Link Employee</span>
                    <select
                      value={form.employeeId}
                      onChange={(event) =>
                        selectEmployee(event.target.value)
                      }
                    >
                      <option value="">
                        Independent / Administrator Account
                      </option>

                      {availableEmployees.map((employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.employeeCode} ·{" "}
                          {employeeName(employee)}
                        </option>
                      ))}
                    </select>

                    <small className="admin-hint">
                      Selecting an employee automatically fills
                      their name, email, phone and branch.
                    </small>
                  </label>
                ) : null}

                <Field
                  label="Full Name *"
                  value={form.fullName}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      fullName: value,
                    }))
                  }
                  required
                />

                <Field
                  label="Username *"
                  value={form.username}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      username: value,
                    }))
                  }
                  required
                />

                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      email: value,
                    }))
                  }
                />

                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      phone: value,
                    }))
                  }
                />

                <label className="admin-field">
                  <span>Branch</span>
                  <select
                    value={form.branchId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        branchId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Hospital-wide</option>

                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                </label>

                <Field
                  label="Session Timeout (minutes) *"
                  type="number"
                  value={form.sessionTimeoutMinutes}
                  min={5}
                  max={1440}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      sessionTimeoutMinutes: value,
                    }))
                  }
                  required
                />

                {!editing ? (
                  <Field
                    label="Temporary Password *"
                    type="password"
                    value={form.temporaryPassword}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        temporaryPassword: value,
                      }))
                    }
                    required
                  />
                ) : null}
              </div>

              <div className="admin-section-title">
                Roles & Access
              </div>

              <div className="permission-grid">
                {roles.map((role) => (
                  <label
                    className="permission-option"
                    key={role.id}
                  >
                    <input
                      type="checkbox"
                      checked={form.roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />

                    <span>
                      {role.roleName}
                      <small>
                        {" "}
                        · {role.roleCode} · {role.dataScope}
                      </small>
                    </span>
                  </label>
                ))}

                {!roles.length ? (
                  <div className="admin-empty">
                    No assignable roles are available.
                  </div>
                ) : null}
              </div>

              <div className="admin-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button disabled={busy}>
                  {busy ? "Saving..." : "Save User"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="admin-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Field({
  label,
  value,
  type = "text",
  required = false,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
