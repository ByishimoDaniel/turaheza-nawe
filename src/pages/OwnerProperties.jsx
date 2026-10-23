
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PlusCircle,
  Eye,
  Pencil,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import OwnerSidebar from "../components/OwnerSidebar";

function OwnerProperties() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [properties, setProperties] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOwnerProperties();
  }, []);

  const loadOwnerProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate("/login");
        return;
      }

      // Get owner's name
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      setOwnerName(profile?.full_name || user.email || t("ownerProperties.owner"));

      // Get owner's properties
      const { data, error: propertiesError } = await supabase
        .from("properties")
        .select(`
          id,
          owner_id,
          agent_id,
          location_id,
          title,
          description,
          property_type,
          listing_type,
          price_rwf,
          bedrooms,
          bathrooms,
          area_sqm,
          furnished,
          parking_available,
          electricity_available,
          water_available,
          status,
          rejection_reason,
          approved_at,
          created_at,
          updated_at,
          property_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (propertiesError) throw propertiesError;

      setProperties(data || []);
    } catch (err) {
      console.error("Error loading owner properties:", err);
      setError(
        err.message || t("ownerProperties.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return t("ownerProperties.priceNotSpecified");
    }

    return `${Number(price).toLocaleString()} RWF`;
  };

  const formatPropertyType = (type) => {
    if (!type) return t("ownerProperties.property");

    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatListingType = (type) => {
    if (!type) return "";

    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getPropertyImage = (property) => {
    const images = property.property_images || [];

    if (!images.length) {
      return null;
    }

    const sortedImages = [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;

      return (a.display_order || 0) - (b.display_order || 0);
    });

    return sortedImages[0]?.image_url || null;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "approved":
        return {
          label: t("ownerProperties.statusApproved"),
          className: "owner-property-status-approved",
          icon: <CheckCircle size={14} />,
        };

      case "pending":
        return {
          label: t("ownerProperties.statusPending"),
          className: "owner-property-status-pending",
          icon: <Clock size={14} />,
        };

      case "rejected":
        return {
          label: t("ownerProperties.statusRejected"),
          className: "owner-property-status-rejected",
          icon: <XCircle size={14} />,
        };

      default:
        return {
          label: status || t("ownerProperties.statusUnknown"),
          className: "owner-property-status-default",
          icon: <AlertCircle size={14} />,
        };
    }
  };

  if (loading) {
    return (
      <div className="owner-layout">
        <OwnerSidebar />

        <main className="owner-page-content">
          <div className="owner-properties-loading">
            <div className="owner-properties-spinner"></div>
            <p>{t("ownerProperties.loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="owner-layout">
      <OwnerSidebar />

      <main className="owner-page-content">
        <div className="owner-properties-header">
          <div>
            <p className="owner-page-eyebrow">
              {t("ownerProperties.eyebrow")}
            </p>

            <h1>
              {ownerName
                ? t("ownerProperties.ownerTitle", {
                    name: ownerName,
                  })
                : t("ownerProperties.myProperties")}
            </h1>

            <p>
              {t("ownerProperties.subtitle")}
            </p>
          </div>

          <button
            className="owner-primary-button"
            onClick={() => navigate("/owner/properties/new")}
          >
            <PlusCircle size={18} />
            {t("ownerProperties.listProperty")}
          </button>
        </div>

        {error && (
          <div className="owner-properties-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!error && properties.length === 0 && (
          <div className="owner-properties-empty">
            <div className="owner-properties-empty-icon">
              <Building2 size={34} />
            </div>

            <h2>{t("ownerProperties.emptyTitle")}</h2>

            <p>
              {t("ownerProperties.emptyDescription")}
            </p>

            <button
              className="owner-primary-button"
              onClick={() => navigate("/owner/properties/new")}
            >
              <PlusCircle size={18} />
              {t("ownerProperties.listFirstProperty")}
            </button>
          </div>
        )}

        {properties.length > 0 && (
          <div className="owner-properties-grid">
            {properties.map((property) => {
              const statusInfo = getStatusInfo(property.status);
              const image = getPropertyImage(property);

              return (
                <article
                  className="owner-property-card"
                  key={property.id}
                >
                  <div className="owner-property-image">
                    {image ? (
                      <img
                        src={image}
                        alt={property.title}
                      />
                    ) : (
                      <div className="owner-property-no-image">
                        <Building2 size={42} />
                        <span>{t("ownerProperties.noImage")}</span>
                      </div>
                    )}

                    <div className="owner-property-badges">
                      <span className="owner-property-listing-badge">
                        {formatListingType(property.listing_type)}
                      </span>

                      <span
                        className={`owner-property-status ${statusInfo.className}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="owner-property-body">
                    <p className="owner-property-type">
                      {formatPropertyType(
                        property.property_type
                      )}
                    </p>

                    <h2>{property.title}</h2>

                    <div className="owner-property-location">
                      <MapPin size={15} />
                      <span>{t("ownerProperties.location")}</span>
                    </div>

                    <div className="owner-property-price">
                      {formatPrice(property.price_rwf)}
                    </div>

                    <div className="owner-property-features">
                      {property.bedrooms !== null &&
                        property.bedrooms !== undefined && (
                          <span>
                            <BedDouble size={16} />
                            {t("ownerProperties.bedrooms", {
                              count: property.bedrooms,
                            })}
                          </span>
                        )}

                      {property.bathrooms !== null &&
                        property.bathrooms !== undefined && (
                          <span>
                            <Bath size={16} />
                            {t("ownerProperties.bathrooms", {
                              count: property.bathrooms,
                            })}
                          </span>
                        )}

                      {property.area_sqm !== null &&
                        property.area_sqm !== undefined && (
                          <span>
                            <Maximize size={15} />
                            {property.area_sqm} m²
                          </span>
                        )}
                    </div>

                    {property.status === "rejected" &&
                      property.rejection_reason && (
                        <div className="owner-property-rejection">
                          <strong>
                            {t("ownerProperties.rejectionReason")}
                          </strong>
                          <p>{property.rejection_reason}</p>
                        </div>
                      )}

                    <div className="owner-property-actions">
                      <button
                        className="owner-property-view-button"
                        onClick={() =>
                          navigate(
                            `/owner/properties/${property.id}`
                          )
                        }
                      >
                        <Eye size={16} />
                        {t("ownerProperties.view")}
                      </button>

                      <button
                        className="owner-property-edit-button"
                        onClick={() =>
                          navigate(
                            `/owner/properties/${property.id}/edit`
                          )
                        }
                      >
                        <Pencil size={16} />
                        {t("ownerProperties.edit")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default OwnerProperties;
