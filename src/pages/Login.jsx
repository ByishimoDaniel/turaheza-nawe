
import { useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const requestedRole = searchParams.get("role");
  const isOwnerLogin = requestedRole === "owner";

  // Return destination supplied by Search or another page.
  const redirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Only accept internal property-detail URLs.
  function getSafePropertyRedirect() {
    if (!redirect) return null;

    const isValidPropertyUrl =
      /^\/properties\/[a-zA-Z0-9-]+(?:\?action=inquiry)?$/.test(
        redirect
      );

    return isValidPropertyUrl ? redirect : null;
  }

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        throw authError;
      }

      const user = authData?.user;

      if (!user) {
        throw new Error(t("login.loginNotCompleted"));
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, email, role, profile_image_url, is_active"
        )
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        throw new Error(t("login.profileNotFound"));
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();

        throw new Error(t("login.accountInactive"));
      }

      const propertyRedirect = getSafePropertyRedirect();

      // Buyers and tenants can return to the property they selected.
      if (
        propertyRedirect &&
        ["buyer", "tenant"].includes(profile.role)
      ) {
        navigate(propertyRedirect, { replace: true });
        return;
      }

      // Normal login: preserve role-based dashboard navigation.
      switch (profile.role) {
        case "admin":
          navigate("/admin", { replace: true });
          break;

        case "owner":
          navigate("/owner", { replace: true });
          break;

        case "agent":
          navigate("/agent", { replace: true });
          break;

        case "buyer":
        case "tenant":
          navigate("/customer", { replace: true });
          break;

        default:
          await supabase.auth.signOut();

          throw new Error(t("login.unsupportedRole"));
      }
    } catch (error) {
      console.error("Login error:", error);

      let message =
        error?.message ||
        t("login.signInError");

      if (
        message.toLowerCase().includes("email not confirmed")
      ) {
        message = t("login.emailNotConfirmed");
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-wrapper">
        <div className="login-brand">
          <img
            src="/turaheza-logo.jpeg"
            alt="TURAHEZA NAWE"
            className="login-logo"
          />

          <span>{t("login.brandTagline")}</span>
        </div>

        <div className="login-card">
          <div className="login-heading">
            <span className="section-label">
              {isOwnerLogin
                ? t("login.propertyOwner")
                : t("login.welcomeBack")}
            </span>

            <h1>
              {isOwnerLogin
                ? t("login.ownerSignIn")
                : t("login.signIn")}
            </h1>

            <p>
              {isOwnerLogin
                ? t("login.ownerDescription")
                : propertyRedirectMessage(redirect, t)}
            </p>
          </div>

          {errorMessage && (
            <div className="login-error" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="email">
                {t("login.emailAddress")}
              </label>

              <div className="login-input-wrapper">
                <Mail size={18} />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder={t("login.emailPlaceholder")}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">
                {t("login.password")}
              </label>

              <div className="login-input-wrapper">
                <Lock size={18} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder={t("login.passwordPlaceholder")}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? t("login.hidePassword")
                      : t("login.showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                t("login.signingIn")
              ) : (
                <>
                  {t("login.signIn")}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <span>{t("login.newToPlatform")}</span>

            <button
              type="button"
              onClick={() =>
                navigate(
                  isOwnerLogin
                    ? "/register?role=owner"
                    : "/register"
                )
              }
            >
              {t("login.createAccount")}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function propertyRedirectMessage(redirect, t) {
  if (redirect?.endsWith("?action=inquiry")) {
    return t("login.inquiryRedirectMessage");
  }

  if (redirect?.startsWith("/properties/")) {
    return t("login.propertyRedirectMessage");
  }

  return t("login.defaultDescription");
}

export default Login;
