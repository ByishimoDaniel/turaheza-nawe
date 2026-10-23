import {
  Home,
  Search,
  Heart,
  MessageCircle,
  User,
  LogOut,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";

function CustomerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <aside className="customer-sidebar">
      {/* LOGO */}
      <div className="customer-logo">
        <img
          src="/turaheza-logo.jpeg"
          alt="TURAHEZA NAWE"
        />
      </div>

      {/* NAVIGATION */}
      <nav className="customer-nav">
        <button
          className={`customer-nav-item ${
            isActive("/customer") ? "active" : ""
          }`}
          onClick={() => navigate("/customer")}
        >
          <Home size={20} />
          {t("customerSidebar.dashboard")}
        </button>

        <button
          className={`customer-nav-item ${
            isActive("/customer/properties") ? "active" : ""
          }`}
          onClick={() => navigate("/customer/properties")}
        >
          <Search size={20} />
          {t("customerSidebar.browseProperties")}
        </button>

        <button
          className={`customer-nav-item ${
            isActive("/customer/favorites") ? "active" : ""
          }`}
          onClick={() => navigate("/customer/favorites")}
        >
          <Heart size={20} />
          {t("customerSidebar.myFavorites")}
        </button>

        <button
          className={`customer-nav-item ${
            isActive("/customer/inquiries") ? "active" : ""
          }`}
          onClick={() => navigate("/customer/inquiries")}
        >
          <MessageCircle size={20} />
          {t("customerSidebar.myInquiries")}
        </button>

        <button
          className={`customer-nav-item ${
            isActive("/customer/profile") ? "active" : ""
          }`}
          onClick={() => navigate("/customer/profile")}
        >
          <User size={20} />
          {t("customerSidebar.myProfile")}
        </button>
      </nav>

      {/* LOGOUT */}
      <button
        className="customer-logout"
        onClick={handleLogout}
      >
        <LogOut size={20} />
        {t("customerSidebar.logout")}
      </button>
    </aside>
  );
}

export default CustomerSidebar;