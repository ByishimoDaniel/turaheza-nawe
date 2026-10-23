import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Heart,
  MessageCircle,
  User,
  Building2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import CustomerSidebar from "../components/CustomerSidebar";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [stats, setStats] = useState({
    favorites: 0,
    inquiries: 0,
    properties: 0,
  });

  const [recentProperties, setRecentProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // loadDashboard is intentionally called when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login");
        return;
      }

      setUser(user);

      // Get profile
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, phone, email, role, profile_image_url, is_active"
          )
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error(t("customerDashboard.profileError"));
      }

      // Role protection
      if (
        profileData.role !== "buyer" &&
        profileData.role !== "tenant"
      ) {
        if (profileData.role === "admin") {
          navigate("/admin");
        } else if (profileData.role === "owner") {
          navigate("/owner");
        } else if (profileData.role === "agent") {
          navigate("/agent");
        } else {
          navigate("/");
        }

        return;
      }

      if (!profileData.is_active) {
        await supabase.auth.signOut();
        navigate("/login");
        return;
      }

      setProfile(profileData);

      // Favorites count
      const { count: favoritesCount, error: favoritesError } =
        await supabase
          .from("favorites")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id);

      if (favoritesError) {
        console.warn("Favorites count:", favoritesError.message);
      }

      // Inquiries count
      const { count: inquiriesCount, error: inquiriesError } =
        await supabase
          .from("property_inquiries")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("user_id", user.id);

      if (inquiriesError) {
        console.warn("Inquiries count:", inquiriesError.message);
      }

      // Approved properties count
      const { count: propertiesCount, error: propertiesError } =
        await supabase
          .from("properties")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "approved");

      if (propertiesError) {
        console.warn("Properties count:", propertiesError.message);
      }

      setStats({
        favorites: favoritesCount || 0,
        inquiries: inquiriesCount || 0,
        properties: propertiesCount || 0,
      });

      // Recent approved properties
      const { data: propertiesData, error: recentError } =
        await supabase
          .from("properties")
          .select(`
            id,
            title,
            description,
            property_type,
            listing_type,
            price_rwf,
            bedrooms,
            bathrooms,
            area_sqm,
            location_id,
            created_at,
            property_images (
              id,
              image_url,
              is_primary,
              display_order
            )
          `)
          .eq("status", "approved")
          .order("created_at", {
            ascending: false,
          })
          .limit(4);

      if (recentError) {
        console.warn("Recent properties:", recentError.message);
      }

      setRecentProperties(propertiesData || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || t("customerDashboard.generalError")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function formatPrice(price) {
    if (!price) {
      return t("customerDashboard.priceOnRequest");
    }

    return `${Number(price).toLocaleString(
      i18n.language === "rw"
        ? "rw-RW"
        : i18n.language === "fr"
          ? "fr-FR"
          : "en-US"
    )} RWF`;
  }

  function getPropertyImage(property) {
    if (
      property.property_images &&
      property.property_images.length > 0
    ) {
      const primary = property.property_images.find(
        (image) => image.is_primary
      );

      return (
        primary?.image_url ||
        property.property_images[0]?.image_url
      );
    }

    return "/property-placeholder.jpg";
  }

  function translatePropertyValue(value) {
    if (!value) return "";

    const key = String(value)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

    return t(`propertyTypes.${key}`, {
      defaultValue: value,
    });
  }

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="customer-spinner"></div>
        <p>{t("customerDashboard.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-loading">
        <h3>{t("customerDashboard.errorTitle")}</h3>
        <p>{error}</p>

        <button
          className="customer-retry-button"
          onClick={loadDashboard}
        >
          <RefreshCw size={17} />
          {t("customerDashboard.tryAgain")}
        </button>
      </div>
    );
  }

  const displayName =
    profile?.full_name &&
    profile.full_name !== "New User"
      ? profile.full_name
      : t("customerDashboard.customer");

  const firstLetter = displayName.charAt(0).toUpperCase();

  const roleLabel =
    profile?.role === "tenant"
      ? t("customerDashboard.tenant")
      : t("customerDashboard.buyer");

  return (
    <div className="customer-dashboard">
      {/* Customer sidebar */}
      <CustomerSidebar onLogout={handleLogout} />

      {/* Main content */}
      <main className="customer-main">
        {/* Header */}
        <header className="customer-header">
          <div>
            <p className="customer-welcome-small">
              {t("customerDashboard.welcome")} 👋
            </p>

            <h1>{displayName}</h1>

            <p className="customer-subtitle">
              {t("customerDashboard.subtitle")}
            </p>
          </div>

          <div className="customer-profile">
            <div className="customer-avatar">
              {firstLetter}
            </div>

            <div>
              <strong>{displayName}</strong>
              <span>{roleLabel}</span>
            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="customer-stats">
          <div
            className="customer-stat-card"
            onClick={() => navigate("/customer/favorites")}
          >
            <div className="customer-stat-icon">
              <Heart size={22} />
            </div>

            <div>
              <span>{t("customerDashboard.myFavorites")}</span>
              <strong>{stats.favorites}</strong>
            </div>
          </div>

          <div
            className="customer-stat-card"
            onClick={() => navigate("/customer/inquiries")}
          >
            <div className="customer-stat-icon">
              <MessageCircle size={22} />
            </div>

            <div>
              <span>{t("customerDashboard.myInquiries")}</span>
              <strong>{stats.inquiries}</strong>
            </div>
          </div>

          <div
            className="customer-stat-card"
            onClick={() => navigate("/customer/properties")}
          >
            <div className="customer-stat-icon">
              <Building2 size={22} />
            </div>

            <div>
              <span>
                {t("customerDashboard.availableProperties")}
              </span>
              <strong>{stats.properties}</strong>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="customer-actions">
          <div
            className="customer-action-card"
            onClick={() => navigate("/customer/properties")}
          >
            <div className="action-icon">
              <Search size={24} />
            </div>

            <h3>{t("customerDashboard.findProperty")}</h3>

            <p>
              {t("customerDashboard.findPropertyDescription")}
            </p>

            <span>
              {t("customerDashboard.browseProperties")}{" "}
              <ArrowRight size={15} />
            </span>
          </div>

          <div
            className="customer-action-card"
            onClick={() => navigate("/customer/favorites")}
          >
            <div className="action-icon">
              <Heart size={24} />
            </div>

            <h3>{t("customerDashboard.myFavorites")}</h3>

            <p>
              {t("customerDashboard.favoritesDescription")}
            </p>

            <span>
              {t("customerDashboard.viewFavorites")}{" "}
              <ArrowRight size={15} />
            </span>
          </div>

          <div
            className="customer-action-card"
            onClick={() => navigate("/customer/inquiries")}
          >
            <div className="action-icon">
              <MessageCircle size={24} />
            </div>

            <h3>{t("customerDashboard.myInquiries")}</h3>

            <p>
              {t("customerDashboard.inquiriesDescription")}
            </p>

            <span>
              {t("customerDashboard.viewInquiries")}{" "}
              <ArrowRight size={15} />
            </span>
          </div>
        </section>

        {/* Recent properties */}
        <section className="customer-properties-section">
          <div className="customer-section-heading">
            <div>
              <p>{t("customerDashboard.discover")}</p>
              <h2>
                {t("customerDashboard.recentProperties")}
              </h2>
            </div>

            <button
              onClick={() => navigate("/customer/properties")}
            >
              {t("customerDashboard.viewAll")}
              <ArrowRight size={16} />
            </button>
          </div>

          {recentProperties.length === 0 ? (
            <div className="customer-empty-properties">
              <Building2 size={38} />

              <h3>
                {t("customerDashboard.noProperties")}
              </h3>

              <p>
                {t("customerDashboard.noPropertiesDescription")}
              </p>
            </div>
          ) : (
            <div className="customer-property-grid">
              {recentProperties.map((property) => (
                <article
                  className="customer-property-card"
                  key={property.id}
                  onClick={() =>
                    navigate(`/properties/${property.id}`)
                  }
                >
                  <div className="customer-property-image">
                    <img
                      src={getPropertyImage(property)}
                      alt={property.title}
                    />

                    <span>
                      {translatePropertyValue(
                        property.listing_type
                      )}
                    </span>
                  </div>

                  <div className="customer-property-content">
                    <p className="customer-property-type">
                      {translatePropertyValue(
                        property.property_type
                      )}
                    </p>

                    <h3>{property.title}</h3>

                    <strong>
                      {formatPrice(property.price_rwf)}
                    </strong>

                    <div className="customer-property-meta">
                      {property.bedrooms !== null &&
                        property.bedrooms !== undefined && (
                          <span>
                            {property.bedrooms}{" "}
                            {t("customerDashboard.beds")}
                          </span>
                        )}

                      {property.bathrooms !== null &&
                        property.bathrooms !== undefined && (
                          <span>
                            {property.bathrooms}{" "}
                            {t("customerDashboard.baths")}
                          </span>
                        )}

                      {property.area_sqm && (
                        <span>
                          {property.area_sqm}{" "}
                          {t("customerDashboard.squareMeters")}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Account */}
        <section className="customer-section">
          <div className="section-title">
            <h2>{t("customerDashboard.myAccount")}</h2>
          </div>

          <div className="account-card">
            <div className="account-avatar">
              {firstLetter}
            </div>

            <div className="account-info">
              <h3>{displayName}</h3>

              <p>{profile?.email || user?.email}</p>

              {profile?.phone && <p>{profile.phone}</p>}

              <span className="role-badge">
                {roleLabel}
              </span>
            </div>

            <button
              className="profile-button"
              onClick={() => navigate("/customer/profile")}
            >
              <User size={18} />
              {t("customerDashboard.editProfile")}
            </button>
          </div>
        </section>

        {/* Call to action */}
        <section className="customer-cta">
          <div>
            <h2>
              {t("customerDashboard.ctaTitle")}
            </h2>

            <p>
              {t("customerDashboard.ctaDescription")}
            </p>
          </div>

          <button
            onClick={() => navigate("/customer/properties")}
          >
            <Search size={18} />
            {t("customerDashboard.exploreProperties")}
          </button>
        </section>
      </main>
    </div>
  );
}