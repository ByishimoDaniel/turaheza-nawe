
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  MessageCircle,
  User,
  LogOut,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function OwnerSidebar() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside className="owner-sidebar">
      {/* Logo */}
      <div className="owner-sidebar-logo">
        <img
          src="/turaheza-logo.jpeg"
          alt="TURAHEZA NAWE"
        />
      </div>

      {/* Navigation */}
      <nav className="owner-sidebar-nav">
        <NavLink
          to="/owner"
          end
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <LayoutDashboard size={19} />
          <span>{t("ownerSidebar.dashboard")}</span>
        </NavLink>

        <NavLink
          to="/owner/properties"
          end
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <Building2 size={19} />
          <span>{t("ownerSidebar.myProperties")}</span>
        </NavLink>

        <NavLink
          to="/owner/properties/new"
          end
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <PlusCircle size={19} />
          <span>{t("ownerSidebar.listProperty")}</span>
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
          <span>{t("ownerSidebar.inquiries")}</span>
        </NavLink>

        {/* My Profile */}
        <NavLink
          to="/owner/profile"
          className={({ isActive }) =>
            `owner-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <User size={19} />
          <span>{t("ownerSidebar.myProfile")}</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="owner-sidebar-bottom">
        <button
          className="owner-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>{t("ownerSidebar.logout")}</span>
        </button>
      </div>
    </aside>
  );
}

export default OwnerSidebar;
