import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavMenu from "./NavMenu";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import HelpDialog from "./HelpDialog";

// vouchers menu for each role (status links open the list already filtered)
const VOUCHER_MENUS = {
  employee: [
    { to: "/employee/create", label: "New Voucher", icon: "plus" },
    { divider: true },
    { to: "/employee/vouchers", label: "All My Vouchers", icon: "list" },
    { to: "/employee/vouchers?status=draft", label: "Drafts", dot: "draft" },
    { to: "/employee/vouchers?status=pending", label: "Pending Approval", dot: "pending" },
    { to: "/employee/vouchers?status=approved", label: "Approved", dot: "approved" },
    { to: "/employee/vouchers?status=rejected", label: "Rejected", dot: "rejected" },
  ],
  director: [
    { to: "/director/pending", label: "Pending Approvals", icon: "clock" },
    { divider: true },
    { to: "/director/vouchers", label: "All Vouchers", icon: "list" },
    { to: "/director/vouchers?status=approved", label: "Approved", dot: "approved" },
    { to: "/director/vouchers?status=rejected", label: "Rejected", dot: "rejected" },
  ],
  accounts: [
    { to: "/accounts/vouchers", label: "All Vouchers", icon: "list" },
    { to: "/accounts/vouchers?status=approved", label: "Approved (to reimburse)", dot: "approved" },
    { to: "/accounts/vouchers?status=pending", label: "Pending Approval", dot: "pending" },
    { to: "/accounts/vouchers?status=rejected", label: "Rejected", dot: "rejected" },
  ],
};

// one handy link per role in the profile menu
const ROLE_SHORTCUT = {
  employee: { to: "/employee/create", label: "New Voucher", icon: "plus" },
  director: { to: "/director/pending", label: "Pending Approvals", icon: "clock" },
  accounts: { to: "/accounts/vouchers?status=approved", label: "Approved (to reimburse)", icon: "wallet" },
};

const ROLE_LABELS = { employee: "Employee", director: "Director", accounts: "Accounts Team" };

// "Rahul Sharma" -> "RS"
const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false); // phone: links panel
  const [helpOpen, setHelpOpen] = useState(false);

  // phone links panel: Escape closes it
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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

  const closePanel = () => setMenuOpen(false);

  const profileItems = [
    { to: "/profile", label: "My Profile", icon: "user" },
    ...(role !== "accounts" ? [{ to: "/profile#signature", label: "Update Signature", icon: "signature" }] : []),
    ROLE_SHORTCUT[role],
    { label: "Help & shortcuts", icon: "help", onClick: () => setHelpOpen(true) },
    { divider: true },
    { label: "Logout", icon: "logout", onClick: handleLogout, danger: true },
  ];

  const avatar = <span className="avatar" aria-hidden="true">{initials(user.name)}</span>;

  return (
    <>
      <nav className="navbar" aria-label="Main">
        <div className="nav-left">
          <button
            type="button"
            className="icon-btn nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "x" : "menu"} />
          </button>
          <Link to={`/${role}`} className="brand" onClick={closePanel}>
            <Icon name="wallet" size={20} /> Expense Vouchers
          </Link>
        </div>

        {/* any link clicked inside (also inside the Vouchers dropdown) closes the phone panel */}
        <div
          id="main-nav"
          className={"nav-links" + (menuOpen ? " open" : "")}
          onClick={(e) => e.target.closest("a") && closePanel()}
        >
          <NavLink to={`/${role}`} end>
            <Icon name="home" /> Dashboard
          </NavLink>
          <NavMenu label="Vouchers" icon="file" items={VOUCHER_MENUS[role]} active={inVouchers} />
          {role !== "employee" && (
            <NavLink to={`/${role}/activity`}>
              <Icon name="activity" /> Activity Log
            </NavLink>
          )}
        </div>

        <div className="nav-right">
          <ThemeToggle />
          <NavMenu
            align="right"
            active={pathname === "/profile"}
            buttonLabel={`Account menu for ${user.name}`}
            trigger={
              <>
                {avatar}
                <span className="nav-user">
                  <span className="nav-user-name">{user.name}</span>
                  <span className="nav-user-role">{ROLE_LABELS[role]}</span>
                </span>
              </>
            }
            header={
              <>
                <span className="avatar avatar-lg" aria-hidden="true">{initials(user.name)}</span>
                <span>
                  <b>{user.name}</b>
                  <span className="nav-menu-email">{user.email}</span>
                  <span className="role-chip">{ROLE_LABELS[role]}</span>
                </span>
              </>
            }
            items={profileItems}
          />
        </div>
      </nav>
      <HelpDialog open={helpOpen} role={role} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export default Navbar;
