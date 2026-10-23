import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Pencil,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Car,
  Zap,
  Droplets,
  Sofa,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import OwnerSidebar from "../components/OwnerSidebar";

function OwnerPropertyDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
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

      // Get owner profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      setOwnerName(
        profile?.full_name ||
          user.email ||
          t("ownerPropertyDetails.owner")
      );

      // Get property
      const { data, error: propertyError } = await supabase
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
          approved_by,
          approved_at,
          created_at,
          updated_at,
          property_images (
            id,
            image_url,
            is_primary,
            display_order,
            created_at
          )
        `)
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (propertyError) throw propertyError;

      const sortedImages = [...(data.property_images || [])].sort(
        (a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;

          return (
            (a.display_order || 0) -
            (b.display_order || 0)
          );
        }
      );

      const propertyWithImages = {
        ...data,
        property_images: sortedImages,
      };

      setProperty(propertyWithImages);

      if (sortedImages.length > 0) {
        setSelectedImage(sortedImages[0].image_url);
      }
    } catch (err) {
      console.error(
        "Error loading owner property details:",
        err
      );

      if (err.code === "PGRST116") {
        setError(
          t("ownerPropertyDetails.notFoundOrNoPermission")
        );
      } else {
        setError(
          err.message ||
            t("ownerPropertyDetails.loadError")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return t("ownerPropertyDetails.priceNotSpecified");
    }

    return `${Number(price).toLocaleString(i18n.language)} RWF`;
  };

  const formatPropertyType = (type) => {
    if (!type) return t("ownerPropertyDetails.property");

    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatListingType = (type) => {
    if (!type) return "";

    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const languageMap = {
      en: "en-RW",
      fr: "fr-FR",
      rw: "rw-RW",
    };

    const locale =
      languageMap[i18n.language] ||
      languageMap[i18n.language?.split("-")[0]] ||
      "en-RW";

    return new Date(date).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "approved":
        return {
          label: t("ownerPropertyDetails.statusApproved"),
          className: "owner-detail-status-approved",
          icon: <CheckCircle size={17} />,
        };

      case "pending":
        return {
          label: t("ownerPropertyDetails.statusPending"),
          className: "owner-detail-status-pending",
          icon: <Clock size={17} />,
        };

      case "rejected":
        return {
          label: t("ownerPropertyDetails.statusRejected"),
          className: "owner-detail-status-rejected",
          icon: <XCircle size={17} />,
        };

      default:
        return {
          label: status || t("ownerPropertyDetails.statusUnknown"),
          className: "owner-detail-status-default",
          icon: <AlertCircle size={17} />,
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
            <p>{t("ownerPropertyDetails.loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="owner-layout">
        <OwnerSidebar />

        <main className="owner-page-content">
          <div className="owner-property-detail-error">
            <AlertCircle size={40} />

            <h2>{t("ownerPropertyDetails.unableToLoad")}</h2>

            <p>
              {error || t("ownerPropertyDetails.notFound")}
            </p>

            <button
              className="owner-primary-button"
              onClick={() => navigate("/owner/properties")}
            >
              <ArrowLeft size={18} />
              {t("ownerPropertyDetails.backToProperties")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const statusInfo = getStatusInfo(property.status);

  return (
    <div className="owner-layout">
      <OwnerSidebar />

      <main className="owner-page-content">
        <button
          className="owner-back-button"
          onClick={() => navigate("/owner/properties")}
        >
          <ArrowLeft size={18} />
          {t("ownerPropertyDetails.backToProperties")}
        </button>

        <div className="owner-property-detail-header">
          <div>
            <p className="owner-page-eyebrow">
              {t("ownerPropertyDetails.eyebrow")}
            </p>

            <h1>{property.title}</h1>

            <p>
              {t("ownerPropertyDetails.submittedBy")}{" "}
              <strong>{ownerName}</strong>
            </p>
          </div>

          <button
            className="owner-primary-button"
            onClick={() =>
              navigate(`/owner/properties/${property.id}/edit`)
            }
          >
            <Pencil size={18} />
            {t("ownerPropertyDetails.editProperty")}
          </button>
        </div>

        <section className="owner-property-detail-status">
          <div className={statusInfo.className}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>

          <div className="owner-property-detail-dates">
            <span>
              {t("ownerPropertyDetails.submitted")}:{" "}
              {formatDate(property.created_at)}
            </span>

            {property.approved_at && (
              <span>
                {t("ownerPropertyDetails.approved")}:{" "}
                {formatDate(property.approved_at)}
              </span>
            )}
          </div>
        </section>

        {property.status === "rejected" &&
          property.rejection_reason && (
            <section className="owner-property-rejection-box">
              <div>
                <XCircle size={21} />
              </div>

              <div>
                <h3>
                  {t("ownerPropertyDetails.rejectionTitle")}
                </h3>

                <p>{property.rejection_reason}</p>
              </div>
            </section>
          )}

        <section className="owner-property-gallery">
          <div className="owner-property-main-image">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={property.title}
              />
            ) : (
              <div className="owner-property-main-no-image">
                <ImageIcon size={50} />
                <span>
                  {t("ownerPropertyDetails.noImageAvailable")}
                </span>
              </div>
            )}
          </div>

          {property.property_images?.length > 0 && (
            <div className="owner-property-thumbnails">
              {property.property_images.map((image) => (
                <button
                  key={image.id}
                  className={`owner-property-thumbnail ${
                    selectedImage === image.image_url
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedImage(image.image_url)
                  }
                >
                  <img
                    src={image.image_url}
                    alt={property.title}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="owner-property-detail-grid">
          <div className="owner-property-detail-main">
            <div className="owner-detail-card">
              <div className="owner-detail-card-header">
                <div className="owner-detail-card-icon">
                  <Building2 size={20} />
                </div>

                <div>
                  <h2>
                    {t("ownerPropertyDetails.propertyInformation")}
                  </h2>
                  <p>
                    {t("ownerPropertyDetails.basicInformation")}
                  </p>
                </div>
              </div>

              <div className="owner-detail-info-grid">
                <div>
                  <span>
                    {t("ownerPropertyDetails.propertyType")}
                  </span>
                  <strong>
                    {formatPropertyType(
                      property.property_type
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("ownerPropertyDetails.listingType")}
                  </span>
                  <strong>
                    {formatListingType(
                      property.listing_type
                    )}
                  </strong>
                </div>

                <div>
                  <span>{t("ownerPropertyDetails.price")}</span>
                  <strong>
                    {formatPrice(property.price_rwf)}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("ownerPropertyDetails.bedrooms")}
                  </span>
                  <strong>
                    {property.bedrooms ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    {t("ownerPropertyDetails.bathrooms")}
                  </span>
                  <strong>
                    {property.bathrooms ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>{t("ownerPropertyDetails.area")}</span>
                  <strong>
                    {property.area_sqm
                      ? `${property.area_sqm} m²`
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="owner-detail-card">
              <div className="owner-detail-card-header">
                <div className="owner-detail-card-icon">
                  <Building2 size={20} />
                </div>

                <div>
                  <h2>{t("ownerPropertyDetails.description")}</h2>
                  <p>
                    {t("ownerPropertyDetails.propertyDescription")}
                  </p>
                </div>
              </div>

              <div className="owner-property-description">
                {property.description ? (
                  <p>{property.description}</p>
                ) : (
                  <p className="owner-muted-text">
                    {t("ownerPropertyDetails.noDescription")}
                  </p>
                )}
              </div>
            </div>

            <div className="owner-detail-card">
              <div className="owner-detail-card-header">
                <div className="owner-detail-card-icon">
                  <MapPin size={20} />
                </div>

                <div>
                  <h2>{t("ownerPropertyDetails.location")}</h2>
                  <p>
                    {t("ownerPropertyDetails.locationInformation")}
                  </p>
                </div>
              </div>

              <div className="owner-location-box">
                <MapPin size={20} />
                <span>{t("ownerPropertyDetails.rubavuRwanda")}</span>
              </div>
            </div>
          </div>

          <aside className="owner-property-detail-sidebar">
            <div className="owner-detail-card">
              <div className="owner-detail-card-header">
                <div>
                  <h2>{t("ownerPropertyDetails.features")}</h2>
                  <p>
                    {t("ownerPropertyDetails.availableFeatures")}
                  </p>
                </div>
              </div>

              <div className="owner-property-features-list">
                <div>
                  <BedDouble size={19} />
                  <span>
                    {t("ownerPropertyDetails.bedrooms")}
                  </span>
                  <strong>{property.bedrooms ?? "—"}</strong>
                </div>

                <div>
                  <Bath size={19} />
                  <span>
                    {t("ownerPropertyDetails.bathrooms")}
                  </span>
                  <strong>{property.bathrooms ?? "—"}</strong>
                </div>

                <div>
                  <Maximize size={19} />
                  <span>{t("ownerPropertyDetails.area")}</span>
                  <strong>
                    {property.area_sqm
                      ? `${property.area_sqm} m²`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <Car size={19} />
                  <span>{t("ownerPropertyDetails.parking")}</span>
                  <strong>
                    {property.parking_available
                      ? t("ownerPropertyDetails.available")
                      : t("ownerPropertyDetails.no")}
                  </strong>
                </div>

                <div>
                  <Zap size={19} />
                  <span>
                    {t("ownerPropertyDetails.electricity")}
                  </span>
                  <strong>
                    {property.electricity_available
                      ? t("ownerPropertyDetails.available")
                      : t("ownerPropertyDetails.no")}
                  </strong>
                </div>

                <div>
                  <Droplets size={19} />
                  <span>{t("ownerPropertyDetails.water")}</span>
                  <strong>
                    {property.water_available
                      ? t("ownerPropertyDetails.available")
                      : t("ownerPropertyDetails.no")}
                  </strong>
                </div>

                <div>
                  <Sofa size={19} />
                  <span>
                    {t("ownerPropertyDetails.furnished")}
                  </span>
                  <strong>
                    {property.furnished
                      ? t("ownerPropertyDetails.yes")
                      : t("ownerPropertyDetails.no")}
                  </strong>
                </div>
              </div>
            </div>

            <div className="owner-detail-card">
              <div className="owner-detail-card-header">
                <div>
                  <h2>
                    {t("ownerPropertyDetails.listingStatus")}
                  </h2>
                  <p>
                    {t("ownerPropertyDetails.currentStatus")}
                  </p>
                </div>
              </div>

              <div className="owner-detail-status-large">
                <div className={statusInfo.className}>
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                </div>

                {property.status === "pending" && (
                  <p>
                    {t("ownerPropertyDetails.pendingMessage")}
                  </p>
                )}

                {property.status === "approved" && (
                  <p>
                    {t("ownerPropertyDetails.approvedMessage")}
                  </p>
                )}

                {property.status === "rejected" && (
                  <p>
                    {t("ownerPropertyDetails.rejectedMessage")}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </section>

        <div className="owner-property-detail-bottom-actions">
          <button
            className="owner-back-button"
            onClick={() => navigate("/owner/properties")}
          >
            <ArrowLeft size={18} />
            {t("ownerPropertyDetails.backToProperties")}
          </button>

          <button
            className="owner-primary-button"
            onClick={() =>
              navigate(`/owner/properties/${property.id}/edit`)
            }
          >
            <Pencil size={18} />
            {t("ownerPropertyDetails.editProperty")}
          </button>
        </div>
      </main>
    </div>
  );
}

export default OwnerPropertyDetails;