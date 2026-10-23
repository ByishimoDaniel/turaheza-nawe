import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function OwnerSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-logo">
        <img
          src="/turaheza-logo.jpeg"
          alt="TURAHEZA NAWE"
        />
      </div>

      <nav className="owner-sidebar-nav">
        <NavLink
          to="/owner"
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/owner/properties"
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <Building2 size={19} />
          <span>My Properties</span>
        </NavLink>

        <NavLink
          to="/owner/properties/new"
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <PlusCircle size={19} />
          <span>List Property</span>
        </NavLink>

        <NavLink
          to="/owner/inquiries"
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <MessageCircle size={19} />
          <span>Inquiries</span>
        </NavLink>
      </nav>

      <div className="owner-sidebar-bottom">
        <button
          className="owner-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default OwnerSidebar;