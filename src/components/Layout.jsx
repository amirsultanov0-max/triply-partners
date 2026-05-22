import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Layout = ({ children }) => {
  const { user, operator, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Navbar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 60, background: "var(--white)",
        borderBottom: "0.5px solid var(--border)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px", zIndex: 100,
        position: "relative",
      }}>
        {/* Logo */}
        <Link to="/" style={{
          fontSize: 18, fontWeight: 600, color: "var(--olive-dark)"
        }}>
          Triply <span style={{
            fontSize: 11, fontWeight: 500, color: "var(--olive)",
            background: "var(--olive-light)", padding: "2px 8px",
            borderRadius: 20, marginLeft: 4,
          }}>Partners</span>
        </Link>

        {/* Centered company name */}
        {operator && (
          <span style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}>
            {operator.company_name}
          </span>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <Link to="/dashboard" style={{
                fontSize: 13, fontWeight: 500,
                color: "var(--text-primary)",
              }}>
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  fontSize: 13, color: "var(--text-secondary)",
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                fontSize: 13, color: "var(--text-secondary)",
              }}>
                Sign in
              </Link>
              <Link to="/apply" style={{
                fontSize: 13, fontWeight: 500,
                background: "var(--olive)", color: "white",
                padding: "7px 16px", borderRadius: 8,
              }}>
                Apply now
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Page content */}
      <div style={{ paddingTop: 60 }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
