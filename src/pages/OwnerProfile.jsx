
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  MessageCircle,
  Save,
  LoaderCircle,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import OwnerSidebar from "../components/OwnerSidebar";

function OwnerProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!currentUser) {
          navigate("/login");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email, role, is_active")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!mounted) return;

        setUser(currentUser);
        setProfile(data);
        setFullName(data?.full_name || "");
        setPhone(data?.phone || "");
      } catch (err) {
        console.error("Owner profile loading error:", err);

        if (mounted) {
          setError(t("profilePage.errors.load"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate, t]);

  async function handleSave(event) {
    event.preventDefault();

    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const cleanedName = fullName.trim();
      const cleanedPhone = phone.trim();

      if (!cleanedName) {
        setError(t("profilePage.errors.nameRequired"));
        setSaving(false);
        return;
      }

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanedName,
          phone: cleanedPhone || null,
        })
        .eq("id", user.id)
        .select("id, full_name, phone, email, role, is_active")
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setEditing(false);
      setSuccess(t("profilePage.messages.saved"));
    } catch (err) {
      console.error("Owner profile update error:", err);
      setError(t("profilePage.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    t("profilePage.unnamed");

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  if (loading) {
    return (
      <div className="profile-loading">
        <LoaderCircle className="profile-spinner" size={30} />
        <p>{t("profilePage.loading")}</p>
      </div>
    );
  }

  return (
    <div className="owner-dashboard profile-dashboard">
      <OwnerSidebar />

      <main className="owner-main profile-main">
        <div className="profile-page-header">
          <div>
            <p className="profile-eyebrow">
              {t("profilePage.ownerLabel")}
            </p>
            <h1>{t("profilePage.title")}</h1>
            <p>{t("profilePage.ownerDescription")}</p>
          </div>

          {!editing && (
            <button
              type="button"
              className="profile-primary-button"
              onClick={() => {
                setError("");
                setSuccess("");
                setEditing(true);
              }}
            >
              <User size={18} />
              {t("profilePage.editProfile")}
            </button>
          )}
        </div>

        {error && (
          <div className="profile-alert profile-alert-error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="profile-alert profile-alert-success"
            role="status"
          >
            <ShieldCheck size={19} />
            <span>{success}</span>
          </div>
        )}

        <section className="profile-card">
          <div className="profile-identity">
            <div className="profile-avatar">
              {initials || <User size={36} />}
            </div>

            <div className="profile-identity-details">
              <h2>{displayName}</h2>
              <p>{user?.email || profile?.email || "—"}</p>
              <span className="profile-role-badge">
                {t("profilePage.ownerRole")}
              </span>
            </div>
          </div>

          <div className="profile-divider" />

          {editing ? (
            <form onSubmit={handleSave} className="profile-form">
              <div className="profile-field">
                <label htmlFor="owner-full-name">
                  {t("profilePage.fullName")}
                </label>
                <div className="profile-input-wrapper">
                  <User size={19} />
                  <input
                    id="owner-full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    placeholder={t("profilePage.namePlaceholder")}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="owner-email">
                  {t("profilePage.email")}
                </label>
                <div className="profile-input-wrapper profile-input-disabled">
                  <Mail size={19} />
                  <input
                    id="owner-email"
                    type="email"
                    value={user?.email || profile?.email || ""}
                    readOnly
                  />
                </div>
                <small>{t("profilePage.emailHelp")}</small>
              </div>

              <div className="profile-field">
                <label htmlFor="owner-phone">
                  {t("profilePage.phone")}
                </label>
                <div className="profile-input-wrapper">
                  <Phone size={19} />
                  <input
                    id="owner-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder={t("profilePage.phonePlaceholder")}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={() => {
                    setFullName(profile?.full_name || "");
                    setPhone(profile?.phone || "");
                    setEditing(false);
                    setError("");
                    setSuccess("");
                  }}
                  disabled={saving}
                >
                  {t("profilePage.cancel")}
                </button>

                <button
                  type="submit"
                  className="profile-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle
                      size={18}
                      className="profile-spinner"
                    />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving
                    ? t("profilePage.saving")
                    : t("profilePage.saveChanges")}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <span className="profile-detail-icon">
                  <User size={20} />
                </span>
                <div>
                  <span>{t("profilePage.fullName")}</span>
                  <strong>{profile?.full_name || "—"}</strong>
                </div>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-icon">
                  <Mail size={20} />
                </span>
                <div>
                  <span>{t("profilePage.email")}</span>
                  <strong>{user?.email || profile?.email || "—"}</strong>
                </div>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-icon">
                  <Phone size={20} />
                </span>
                <div>
                  <span>{t("profilePage.phone")}</span>
                  <strong>{profile?.phone || "—"}</strong>
                </div>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-icon">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <span>{t("profilePage.accountStatus")}</span>
                  <strong>
                    {profile?.is_active === false
                      ? t("profilePage.inactive")
                      : t("profilePage.active")}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="profile-shortcuts">
          <h2>{t("profilePage.quickLinks")}</h2>

          <button
            type="button"
            className="profile-shortcut-card"
            onClick={() => navigate("/owner/properties")}
          >
            <span className="profile-shortcut-icon">
              <Building2 size={23} />
            </span>
            <span>
              <strong>{t("profilePage.propertiesTitle")}</strong>
              <small>{t("profilePage.propertiesDescription")}</small>
            </span>
          </button>

          <button
            type="button"
            className="profile-shortcut-card"
            onClick={() => navigate("/owner/inquiries")}
          >
            <span className="profile-shortcut-icon">
              <MessageCircle size={23} />
            </span>
            <span>
              <strong>{t("profilePage.inquiriesTitle")}</strong>
              <small>{t("profilePage.ownerInquiriesDescription")}</small>
            </span>
          </button>

          <button
            type="button"
            className="profile-shortcut-card"
            onClick={() => navigate("/owner/properties/new")}
          >
            <span className="profile-shortcut-icon">
              <PlusCircle size={23} />
            </span>
            <span>
              <strong>{t("profilePage.listPropertyTitle")}</strong>
              <small>{t("profilePage.listPropertyDescription")}</small>
            </span>
          </button>
        </section>
      </main>
    </div>
  );
}

export default OwnerProfile;
