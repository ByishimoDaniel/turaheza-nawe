
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  CreditCard,
  LogOut,
  PlusCircle,
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navItems = [
    {
      label: t("adminSidebar.dashboard"),
      path: "/admin",
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: t("adminSidebar.properties"),
      path: "/admin/properties",
      icon: Building2,
    },
    {
      label: t("adminSidebar.users"),
      path: "/admin/users",
      icon: Users,
    },
    {
      label: t("adminSidebar.inquiries"),
      path: "/admin/inquiries",
      icon: MessageSquare,
    },
    {
      label: t("adminSidebar.payments"),
      path: "/admin/payments",
      icon: CreditCard,
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <img
          src="/turaheza-logo.jpeg"
          alt="TURAHEZA NAWE"
        />

        <div>
          <strong>TURAHEZA</strong>
          <span>NAWE</span>
        </div>
      </div>

      <div className="admin-sidebar-heading">
        {t("adminSidebar.administration")}
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `admin-sidebar-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        <button
          type="button"
          className="admin-sidebar-list-button"
          onClick={() => navigate("/list-property")}
        >
          <PlusCircle size={18} />
          {t("adminSidebar.listProperty")}
        </button>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {t("adminSidebar.logout")}
        </button>
      </div>
    </aside>
  );
}
