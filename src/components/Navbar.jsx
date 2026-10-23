
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  Home,
  Building2,
  Search,
  PlusCircle,
  LogIn,
  UserPlus,
  Info,
  Phone,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const closeMenu = () => setMenuOpen(false);

  const currentLanguage = (
    i18n.resolvedLanguage || i18n.language || "en"
  ).split("-")[0];

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    closeMenu();
  };

  async function handleUploadProperty() {
    closeMenu();

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        navigate("/register?role=owner");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        window.alert(
          t(
            "nav.accountCheckError",
            "We could not verify your account. Please sign in again."
          )
        );
        return;
      }

      if (!profile.is_active) {
        window.alert(
          t(
            "nav.accountUnavailable",
            "Your account is inactive. Please contact TURAHEZA NAWE support."
          )
        );
        return;
      }

      if (profile.role === "owner") {
        navigate("/owner");
        return;
      }

      window.alert(
        t(
          "nav.ownerAccountRequired",
          "You are signed in with a customer account. Please sign out, then register as a property owner."
        )
      );
    } catch (error) {
      console.error("Upload property navigation error:", error);

      window.alert(
        t(
          "nav.accountCheckError",
          "Unable to verify your account. Please try again."
        )
      );
    }
  }

  const languageSelector = (
    <div className="language-selector">
      <span className="language-icon" aria-hidden="true">
        {currentLanguage === "fr"
          ? "🇫🇷"
          : currentLanguage === "rw"
          ? "🇷🇼"
          : "🇬🇧"}
      </span>

      <select
        aria-label={t("nav.language", "Language")}
        value={currentLanguage}
        onChange={(event) => changeLanguage(event.target.value)}
      >
        <option value="en">🇬🇧 English</option>
        <option value="fr">🇫🇷 Français</option>
        <option value="rw">🇷🇼 Ikinyarwanda</option>
      </select>
    </div>
  );

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link
          to="/"
          className="logo"
          onClick={closeMenu}
          aria-label="TURAHEZA NAWE Home"
        >
          <img
            src="/turaheza-logo.jpeg"
            alt="TURAHEZA NAWE"
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="desktop-nav">
          <Link to="/">
            <Home size={17} />
            {t("nav.home", "Home")}
          </Link>

          <Link to="/properties">
            <Building2 size={17} />
            {t("nav.properties", "Properties")}
          </Link>

          <Link to="/search">
            <Search size={17} />
            {t("nav.buyRent", "Buy / Rent")}
          </Link>

          <a
            href="/register?role=owner"
            onClick={(event) => {
              event.preventDefault();
              handleUploadProperty();
            }}
          >
            <PlusCircle size={17} />
            {t("nav.uploadProperty", "Upload Your Property")}
          </a>

          <Link to="/about">
            <Info size={17} />
            {t("nav.about", "About")}
          </Link>

          <Link to="/contact">
            <Phone size={17} />
            {t("nav.contact", "Contact")}
          </Link>
        </nav>

        {/* Desktop language and account actions */}
        <div className="navbar-actions">
          {languageSelector}

          <Link to="/login" className="login-button">
            <LogIn size={17} />
            {t("nav.login", "Login")}
          </Link>

          <Link to="/register" className="register-button">
            <UserPlus size={17} />
            {t("nav.register", "Register")}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav className="mobile-nav">
          {languageSelector}

          <Link to="/" onClick={closeMenu}>
            <Home size={18} />
            {t("nav.home", "Home")}
          </Link>

          <Link to="/properties" onClick={closeMenu}>
            <Building2 size={18} />
            {t("nav.properties", "Properties")}
          </Link>

          <Link to="/search" onClick={closeMenu}>
            <Search size={18} />
            {t("nav.buyRent", "Buy / Rent")}
          </Link>

          <a
            href="/register?role=owner"
            onClick={(event) => {
              event.preventDefault();
              handleUploadProperty();
            }}
          >
            <PlusCircle size={18} />
            {t("nav.uploadProperty", "Upload Your Property")}
          </a>

          <Link to="/about" onClick={closeMenu}>
            <Info size={18} />
            {t("nav.about", "About")}
          </Link>

          <Link to="/contact" onClick={closeMenu}>
            <Phone size={18} />
            {t("nav.contact", "Contact")}
          </Link>

          <Link
            to="/login"
            className="login-button"
            onClick={closeMenu}
          >
            <LogIn size={18} />
            {t("nav.login", "Login")}
          </Link>

          <Link
            to="/register"
            className="register-button"
            onClick={closeMenu}
          >
            <UserPlus size={18} />
            {t("nav.register", "Register")}
          </Link>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
