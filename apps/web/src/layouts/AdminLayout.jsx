import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FileText, Inbox, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { adminRoutes } from "../routes.js";
import { Button } from "../components/ui/button.jsx";

const adminNavIcons = {
  "admin-dashboard": LayoutDashboard,
  "article-management": FileText,
  moderation: ShieldCheck,
  "contact-submissions": Inbox
};

export function AdminLayout({ route, children }) {
  const authRequired = route.authRequired === true;
  const navigate = useNavigate();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  useEffect(() => {
    setIsNavigationOpen(false);
  }, [route.path]);

  useEffect(() => {
    function closeNavigation(event) {
      if (event.key === "Escape") {
        setIsNavigationOpen(false);
      }
    }

    window.addEventListener("keydown", closeNavigation);
    return () => window.removeEventListener("keydown", closeNavigation);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
    } finally {
      window.dispatchEvent(new Event("babas-admin-session-changed"));
      navigate("/admin", { replace: true });
    }
  }

  return (
    <div className="app-layout admin-layout figma-admin-shell" data-admin-design="stitch-private-workspace-v4" data-auth-required={authRequired ? "true" : "false"}>
      <a className="skip-link" href="#main-content">Skip to admin content</a>
      <header className="admin-header figma-admin-header">
        <Link className="brand-mark" to="/admin">
          <strong>B&amp;B</strong>
          <span>Editorial admin</span>
        </Link>
        <button
          className="admin-nav-toggle"
          type="button"
          aria-controls="admin-sidebar-navigation"
          aria-expanded={isNavigationOpen}
          aria-label={isNavigationOpen ? "Close admin navigation" : "Open admin navigation"}
          onClick={() => setIsNavigationOpen((current) => !current)}
        >
          {isNavigationOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          <span>{isNavigationOpen ? "Close" : "Menu"}</span>
        </button>
        <div
          className="admin-sidebar-navigation"
          id="admin-sidebar-navigation"
          data-mobile-open={isNavigationOpen ? "true" : "false"}
        >
          <p className="admin-nav-label">Workspace</p>
          <nav aria-label="Admin navigation">
            {adminRoutes.map((item) => {
              const Icon = adminNavIcons[item.id] || LayoutDashboard;
              return (
                <NavLink key={item.id} to={item.path} end={item.path === "/admin"} aria-current={route.path === item.path ? "page" : undefined}>
                  <Icon className="admin-nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="admin-sidebar-footer">
            <div className="admin-session-label">
              <span aria-hidden="true">A</span>
              <p><strong>Administrator</strong><small>Private workspace</small></p>
            </div>
            <Button className="admin-signout-button" type="button" variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" /><span>Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" data-route-id={route.id}>{children}</main>
    </div>
  );
}
