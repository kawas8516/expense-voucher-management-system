import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavMenu from "./NavMenu";

// vouchers menu for each role (status links open the list already filtered)
const VOUCHER_MENUS = {
  employee: [
    { to: "/employee/create", label: "+ New Voucher" },
    { divider: true },
    { to: "/employee/vouchers", label: "All My Vouchers" },
    { to: "/employee/vouchers?status=draft", label: "Drafts" },
    { to: "/employee/vouchers?status=pending", label: "Pending Approval" },
    { to: "/employee/vouchers?status=approved", label: "Approved" },
    { to: "/employee/vouchers?status=rejected", label: "Rejected" },
  ],
  director: [
    { to: "/director/pending", label: "Pending Approvals" },
    { divider: true },
    { to: "/director/vouchers", label: "All Vouchers" },
    { to: "/director/vouchers?status=approved", label: "Approved" },
    { to: "/director/vouchers?status=rejected", label: "Rejected" },
  ],
  accounts: [
    { to: "/accounts/vouchers", label: "All Vouchers" },
    { to: "/accounts/vouchers?status=approved", label: "Approved (to reimburse)" },
    { to: "/accounts/vouchers?status=pending", label: "Pending Approval" },
    { to: "/accounts/vouchers?status=rejected", label: "Rejected" },
  ],
};

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!user) return null;

  const role = user.role;
  const inVouchers =
    pathname.startsWith(`/${role}/vouchers`) ||
    pathname.startsWith("/vouchers/") ||
    pathname === "/employee/create" ||
    pathname === "/director/pending";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="brand">Expense Vouchers</span>

      <NavLink to={`/${role}`} end>Dashboard</NavLink>
      <NavMenu label="Vouchers" items={VOUCHER_MENUS[role]} active={inVouchers} />
      {role !== "employee" && <NavLink to={`/${role}/activity`}>Activity Log</NavLink>}

      <span className="right">
        <NavMenu
          label={`${user.name} (${role})`}
          align="right"
          active={pathname === "/profile"}
          items={[
            { to: "/profile", label: "My Profile" },
            { divider: true },
            { label: "Logout", onClick: handleLogout },
          ]}
        />
      </span>
    </nav>
  );
}

export default Navbar;
