
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isOwnerRegistration = searchParams.get("role") === "owner";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMessage(t("register.errors.fullName"));
      return;
    }

    if (!cleanPhone) {
      setErrorMessage(t("register.errors.phone"));
      return;
    }

    if (!cleanEmail) {
      setErrorMessage(t("register.errors.email"));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t("register.errors.passwordLength"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("register.errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            role: isOwnerRegistration ? "owner" : "buyer",
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error("APP_REGISTRATION_INCOMPLETE");
      }

      // Supabase may require email confirmation before creating a session.
      if (!data.session) {
        setSuccessMessage(
          t(
            isOwnerRegistration
              ? "register.success.ownerConfirmation"
              : "register.success.emailConfirmation"
          )
        );

        setFullName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        return;
      }

      // Verify that the profile was created correctly.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, is_active")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("APP_PROFILE_NOT_FOUND");
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("APP_ACCOUNT_INACTIVE");
      }

      if (isOwnerRegistration && profile.role !== "owner") {
        throw new Error("APP_OWNER_ROLE_MISMATCH");
      }

      setSuccessMessage(
        t(
          isOwnerRegistration
            ? "register.success.ownerCreated"
            : "register.success.accountCreated"
        )
      );

      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      navigate(
        profile.role === "owner"
          ? "/owner"
          : profile.role === "admin"
            ? "/admin"
            : profile.role === "agent"
              ? "/agent"
              : "/customer",
        { replace: true }
      );
    } catch (error) {
      console.error("Registration error:", error);

      const message = error?.message || "";
      const lowerMessage = message.toLowerCase();

      if (message === "APP_REGISTRATION_INCOMPLETE") {
        setErrorMessage(t("register.errors.registrationIncomplete"));
      } else if (message === "APP_PROFILE_NOT_FOUND") {
        setErrorMessage(t("register.errors.profileNotFound"));
      } else if (message === "APP_ACCOUNT_INACTIVE") {
        setErrorMessage(t("register.errors.accountInactive"));
      } else if (message === "APP_OWNER_ROLE_MISMATCH") {
        setErrorMessage(t("register.errors.ownerRoleMismatch"));
      } else if (lowerMessage.includes("rate limit")) {
        setErrorMessage(t("register.errors.rateLimit"));
      } else if (
        lowerMessage.includes("already registered") ||
        lowerMessage.includes("already exists")
      ) {
        setErrorMessage(t("register.errors.emailExists"));
      } else {
        // Supabase provider messages may still be in English.
        setErrorMessage(
          message || t("register.errors.generic")
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-wrapper">
        {/* BRAND */}
        <div className="login-brand">
          <img
            src="/turaheza-logo.jpeg"
            alt="TURAHEZA NAWE"
            className="login-logo"
          />
          <span>{t("register.brand")}</span>
        </div>

        {/* REGISTER CARD */}
        <div className="login-card">
          <div className="login-heading">
            <span className="section-label">
              {t(
                isOwnerRegistration
                  ? "register.ownerLabel"
                  : "register.joinLabel"
              )}
            </span>

            <h1>
              {t(
                isOwnerRegistration
                  ? "register.ownerTitle"
                  : "register.title"
              )}
            </h1>

            <p>
              {t(
                isOwnerRegistration
                  ? "register.ownerDescription"
                  : "register.description"
              )}
            </p>
          </div>

          {errorMessage && (
            <div className="login-error" role="alert">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="login-success" role="status">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* FULL NAME */}
            <div className="login-field">
              <label htmlFor="fullName">
                {t("register.fullName")}
              </label>
              <div className="login-input-wrapper">
                <User size={18} />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder={t("register.fullNamePlaceholder")}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="login-field">
              <label htmlFor="phone">
                {t("register.phone")}
              </label>
              <div className="login-input-wrapper">
                <Phone size={18} />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={t("register.phonePlaceholder")}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="login-field">
              <label htmlFor="email">
                {t("register.email")}
              </label>
              <div className="login-input-wrapper">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("register.emailPlaceholder")}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="login-field">
              <label htmlFor="password">
                {t("register.password")}
              </label>
              <div className="login-input-wrapper">
                <Lock size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("register.passwordPlaceholder")}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={t(
                    showPassword
                      ? "register.hidePassword"
                      : "register.showPassword"
                  )}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="login-field">
              <label htmlFor="confirmPassword">
                {t("register.confirmPassword")}
              </label>
              <div className="login-input-wrapper">
                <Lock size={18} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder={t("register.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  aria-label={t(
                    showConfirmPassword
                      ? "register.hidePassword"
                      : "register.showPassword"
                  )}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* ACCOUNT TYPE */}
            {isOwnerRegistration && (
              <div className="login-field">
                <label htmlFor="accountType">
                  {t("register.accountType")}
                </label>
                <div className="login-input-wrapper">
                  <span aria-hidden="true">🏠</span>
                  <input
                    id="accountType"
                    type="text"
                    value={t("register.propertyOwner")}
                    readOnly
                  />
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                t("register.creating")
              ) : (
                <>
                  {t(
                    isOwnerRegistration
                      ? "register.createOwner"
                      : "register.createAccount"
                  )}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="login-footer">
            <span>{t("register.haveAccount")}</span>
            <button
              type="button"
              onClick={() =>
                navigate(
                  isOwnerRegistration ? "/login?role=owner" : "/login"
                )
              }
            >
              {t("register.signIn")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Register;
