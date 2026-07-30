import { Link } from "react-router-dom";

export function AuthLayout({ route, children }) {
  return (
    <div className="app-layout auth-layout" data-auth-design="stitch-private-login-v4">
      <a className="skip-link" href="#main-content">Skip to sign in</a>
      <main id="main-content" data-route-id={route.id}>{children}</main>
    </div>
  );
}
