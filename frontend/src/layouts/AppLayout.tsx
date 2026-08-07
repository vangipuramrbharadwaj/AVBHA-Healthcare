import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { navigationItems } from "../config/navigation";

export function AppLayout() {
  const { user, can, canAny, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const allowedItems = useMemo(
    () => navigationItems.filter((item) => item.permission ? can(item.permission) : item.anyOf ? canAny(...item.anyOf) : true),
    [can, canAny],
  );

  const sections = ["Clinical", "Operations", "Administration"] as const;
  const current = allowedItems.find((item) => item.path === location.pathname) ?? allowedItems.find((item) => item.path !== "/" && location.pathname.startsWith(item.path));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      {menuOpen ? <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} /> : null}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <div><strong>AVBHA</strong><span>Healthcare HMS</span></div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <div className="hospital-card">
          <span className="hospital-label">Hospital</span>
          <strong>{user?.hospital.name}</strong>
          <span>{user?.branch?.name ?? "All branches"}</span>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          {sections.map((section) => {
            const items = allowedItems.filter((item) => item.section === section);
            if (!items.length) return null;
            return <div className="nav-section" key={section}><div className="nav-heading">{section}</div>{items.map((item) => <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={() => setMenuOpen(false)} className={({isActive}) => `nav-link ${isActive ? "active" : ""}`}><span className="nav-symbol">{item.symbol}</span><span>{item.label}</span></NavLink>)}</div>;
          })}
        </nav>
        <div className="sidebar-footer">AVBHA Healthcare<br/><span>Secure Hospital Workspace</span></div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>☰</button>
            <div className="breadcrumb"><span>AVBHA</span><b>/</b><strong>{current?.label ?? "Workspace"}</strong></div>
          </div>
          <div className="topbar-right">
            <button className="notification-button" onClick={() => navigate("/notifications")} aria-label="Notifications">●<span>Notifications</span></button>
            <div className="profile-wrap">
              <button className="profile-button" onClick={() => setProfileOpen((v) => !v)} aria-expanded={profileOpen}>
                <span className="avatar">{user?.fullName?.charAt(0).toUpperCase() ?? "U"}</span>
                <span className="profile-copy"><strong>{user?.fullName}</strong><small>{user?.roles.join(", ")}</small></span><span>⌄</span>
              </button>
              {profileOpen ? <div className="profile-menu"><div className="profile-menu-info"><strong>{user?.username}</strong><span>{user?.email ?? "No email configured"}</span></div><button onClick={() => {setProfileOpen(false);navigate("/change-password")}}>Change password</button><button className="danger-text" onClick={handleLogout}>Sign out</button></div> : null}
            </div>
          </div>
        </header>
        <main className="content-area"><Outlet /></main>
      </div>
    </div>
  );
}
