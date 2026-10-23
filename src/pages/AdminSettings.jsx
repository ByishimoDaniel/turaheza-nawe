
import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  Save,
  MessageCircle,
  Building2,
  LogOut,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";


function AdminSettings() {
  const { t } = useTranslation();

  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadAdminProfile();
  }, []);


  /* =========================
     LOAD ADMIN PROFILE
  ========================= */

  async function loadAdminProfile() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        throw new Error(
          t("adminSettings.errors.loginRequired")
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, phone, email, role, is_active"
          )
          .eq("id", currentUser.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (
        profile.role !== "admin" ||
        profile.is_active !== true
      ) {
        throw new Error(
          t("adminSettings.errors.adminAccessRequired")
        );
      }

      setUser(profile);

      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });

    } catch (error) {
      console.error(
        "Admin settings error:",
        error
      );

      setErrorMessage(
        error.message ||
          t("adminSettings.errors.loadSettings")
      );
    } finally {
      setLoading(false);
    }
  }


  /* =========================
     HANDLE INPUT
  ========================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setErrorMessage("");
  }


  function handlePasswordChange(event) {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setErrorMessage("");
  }


  /* =========================
     SAVE PROFILE
  ========================= */

  async function handleSaveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const cleanName =
        formData.full_name.trim();

      const cleanPhone =
        formData.phone.trim();

      if (!cleanName) {
        throw new Error(
          t("adminSettings.errors.fullNameRequired")
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          phone: cleanPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setUser((previous) => ({
        ...previous,
        full_name: cleanName,
        phone: cleanPhone,
      }));

      setMessage(
        t("adminSettings.success.profileUpdated")
      );

    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setErrorMessage(
        error.message ||
          t("adminSettings.errors.updateProfile")
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================
     CHANGE PASSWORD
  ========================= */

  async function handleChangePassword(event) {
    event.preventDefault();

    setChangingPassword(true);
    setMessage("");
    setErrorMessage("");

    try {
      const password =
        passwordData.password.trim();

      const confirmPassword =
        passwordData.confirmPassword.trim();

      if (!password) {
        throw new Error(
          t("adminSettings.errors.passwordRequired")
        );
      }

      if (password.length < 6) {
        throw new Error(
          t("adminSettings.errors.passwordTooShort")
        );
      }

      if (password !== confirmPassword) {
        throw new Error(
          t("adminSettings.errors.passwordsDoNotMatch")
        );
      }

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      setPasswordData({
        password: "",
        confirmPassword: "",
      });

      setMessage(
        t("adminSettings.success.passwordChanged")
      );

    } catch (error) {
      console.error(
        "Password update error:",
        error
      );

      setErrorMessage(
        error.message ||
          t("adminSettings.errors.changePassword")
      );
    } finally {
      setChangingPassword(false);
    }
  }


  /* =========================
     LOGOUT
  ========================= */

  async function handleLogout() {
    await supabase.auth.signOut();

    window.location.href = "/login";
  }


  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-container">
          <div className="admin-loading">
            {t("adminSettings.loading")}
          </div>
        </div>
      </main>
    );
  }


  /* =========================
     ERROR
  ========================= */

  if (errorMessage && !user) {
    return (
      <main className="admin-page">
        <div className="admin-container">
          <div className="admin-error">
            <AlertCircle size={18} />

            <span>{errorMessage}</span>
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="admin-page">

      <section className="admin-header">

        <div>
          <span className="section-label">
            TURAHEZA NAWE
          </span>

          <h1>{t("adminSettings.title")}</h1>

          <p>
            {t("adminSettings.description")}
          </p>
        </div>

      </section>


      <section className="admin-container">

        {/* =========================
            MESSAGES
        ========================= */}

        {message && (
          <div className="admin-success-message">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="admin-error">
            <AlertCircle size={18} />

            <span>{errorMessage}</span>
          </div>
        )}


        <div className="admin-settings-grid">


          {/* =========================
              ADMIN PROFILE
          ========================= */}

          <div className="admin-settings-card">

            <div className="admin-settings-card-header">

              <div className="admin-settings-icon">
                <User size={21} />
              </div>

              <div>
                <h2>
                  {t("adminSettings.profile.title")}
                </h2>

                <p>
                  {t("adminSettings.profile.description")}
                </p>
              </div>

            </div>


            <form
              onSubmit={handleSaveProfile}
              className="admin-settings-form"
            >

              {/* FULL NAME */}

              <div className="admin-form-group">

                <label htmlFor="full_name">
                  {t("adminSettings.profile.fullName")}
                </label>

                <div className="admin-input-wrapper">

                  <User size={17} />

                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={t(
                      "adminSettings.profile.fullNamePlaceholder"
                    )}
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div className="admin-form-group">

                <label htmlFor="email">
                  {t("adminSettings.profile.email")}
                </label>

                <div className="admin-input-wrapper">

                  <Mail size={17} />

                  <input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />

                </div>

                <small>
                  {t("adminSettings.profile.emailNote")}
                </small>

              </div>


              {/* PHONE */}

              <div className="admin-form-group">

                <label htmlFor="phone">
                  {t("adminSettings.profile.phone")}
                </label>

                <div className="admin-input-wrapper">

                  <Phone size={17} />

                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t(
                      "adminSettings.profile.phonePlaceholder"
                    )}
                  />

                </div>

              </div>


              {/* ROLE */}

              <div className="admin-account-info">

                <div>
                  <span>
                    {t("adminSettings.profile.accountRole")}
                  </span>

                  <strong>
                    <ShieldCheck size={16} />
                    {t("adminSettings.profile.administrator")}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("adminSettings.profile.accountStatus")}
                  </span>

                  <strong className="admin-status-active">
                    {t("adminSettings.profile.active")}
                  </strong>
                </div>

              </div>


              <button
                type="submit"
                className="admin-save-button"
                disabled={saving}
              >

                <Save size={17} />

                {saving
                  ? t("adminSettings.profile.saving")
                  : t("adminSettings.profile.saveChanges")}

              </button>

            </form>

          </div>


          {/* =========================
              SECURITY
          ========================= */}

          <div className="admin-settings-card">

            <div className="admin-settings-card-header">

              <div className="admin-settings-icon">
                <Lock size={21} />
              </div>

              <div>
                <h2>
                  {t("adminSettings.security.title")}
                </h2>

                <p>
                  {t("adminSettings.security.description")}
                </p>
              </div>

            </div>


            <form
              onSubmit={handleChangePassword}
              className="admin-settings-form"
            >

              <div className="admin-form-group">

                <label htmlFor="password">
                  {t("adminSettings.security.newPassword")}
                </label>

                <div className="admin-input-wrapper">

                  <Lock size={17} />

                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={passwordData.password}
                    onChange={handlePasswordChange}
                    placeholder={t(
                      "adminSettings.security.newPasswordPlaceholder"
                    )}
                  />

                </div>

              </div>


              <div className="admin-form-group">

                <label htmlFor="confirmPassword">
                  {t("adminSettings.security.confirmPassword")}
                </label>

                <div className="admin-input-wrapper">

                  <Lock size={17} />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={
                      passwordData.confirmPassword
                    }
                    onChange={handlePasswordChange}
                    placeholder={t(
                      "adminSettings.security.confirmPasswordPlaceholder"
                    )}
                  />

                </div>

              </div>


              <div className="admin-security-note">
                <Lock size={17} />

                <p>
                  {t("adminSettings.security.passwordNote")}
                </p>
              </div>


              <button
                type="submit"
                className="admin-save-button"
                disabled={changingPassword}
              >

                <Lock size={17} />

                {changingPassword
                  ? t("adminSettings.security.changing")
                  : t("adminSettings.security.changePassword")}

              </button>

            </form>

          </div>


          {/* =========================
              BUSINESS INFORMATION
          ========================= */}

          <div className="admin-settings-card">

            <div className="admin-settings-card-header">

              <div className="admin-settings-icon">
                <Building2 size={21} />
              </div>

              <div>
                <h2>
                  {t("adminSettings.business.title")}
                </h2>

                <p>
                  {t("adminSettings.business.description")}
                </p>
              </div>

            </div>


            <div className="admin-business-info">

              <div>
                <span>
                  {t("adminSettings.business.businessName")}
                </span>
                <strong>
                  TURAHEZA NAWE
                </strong>
              </div>

              <div>
                <span>
                  {t("adminSettings.business.market")}
                </span>
                <strong>
                  {t("adminSettings.business.marketValue")}
                </strong>
              </div>

              <div>
                <span>
                  {t("adminSettings.business.currency")}
                </span>
                <strong>
                  {t("adminSettings.business.currencyValue")}
                </strong>
              </div>

              <div>
                <span>
                  {t("adminSettings.business.managingDirector")}
                </span>
                <strong>
                  Daniel Byishimo
                </strong>
              </div>

              <div>
                <span>
                  {t("adminSettings.business.mediator")}
                </span>
                <strong>
                  Shema Frank
                </strong>
              </div>

              <div>
                <span>
                  {t("adminSettings.business.email")}
                </span>
                <strong>
                  turahezanawe@gmail.com
                </strong>
              </div>

              <div>
                <span>
                  {t("adminSettings.business.whatsapp")}
                </span>

                <a
                  href="https://wa.me/250796189550"
                  target="_blank"
                  rel="noreferrer"
                  className="admin-whatsapp-link"
                >
                  <MessageCircle size={16} />
                  0796189550
                </a>

              </div>

            </div>

          </div>


          {/* =========================
              ACCOUNT ACTIONS
          ========================= */}

          <div className="admin-settings-card">

            <div className="admin-settings-card-header">

              <div className="admin-settings-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h2>
                  {t("adminSettings.account.title")}
                </h2>

                <p>
                  {t("adminSettings.account.description")}
                </p>
              </div>

            </div>


            <div className="admin-account-actions">

              <div>
                <strong>
                  {t("adminSettings.account.accountName")}
                </strong>

                <p>
                  {t("adminSettings.account.signedInMessage")}
                </p>
              </div>

              <button
                type="button"
                className="admin-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                {t("adminSettings.account.logout")}
              </button>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}


export default AdminSettings;
