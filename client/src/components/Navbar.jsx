import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="brand">Expense Vouchers</span>

      {user.role === "employee" && (
        <>
          <Link to="/employee">Dashboard</Link>
          <Link to="/employee/create">Create Voucher</Link>
          <Link to="/employee/vouchers">My Vouchers</Link>
        </>
      )}
      {user.role === "director" && (
        <>
          <Link to="/director">Dashboard</Link>
          <Link to="/director/pending">Pending Approvals</Link>
          <Link to="/director/vouchers">All Vouchers</Link>
        </>
      )}
      {user.role === "accounts" && (
        <>
          <Link to="/accounts">Dashboard</Link>
          <Link to="/accounts/vouchers">All Vouchers</Link>
        </>
      )}

      <span className="right">
        {user.name} ({user.role})
        <button onClick={handleLogout}>Logout</button>
      </span>
    </nav>
  );
}

export default Navbar;
