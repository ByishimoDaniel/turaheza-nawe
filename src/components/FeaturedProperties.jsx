
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function FeaturedProperties() {
  const { t, i18n } = useTranslation();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchFeaturedProperties() {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("properties")
          .select(`
            id,
            title,
            property_type,
            listing_type,
            price_rwf,
            bedrooms,
            bathrooms,
            area_sqm,
            property_images (
              id,
              image_url,
              is_primary,
              display_order
            )
          `)
          .eq("status", "approved")
          .limit(6);

        if (error) throw error;

        if (cancelled) return;

        const formattedProperties = (data || []).map((property) => {
          const images = [...(property.property_images || [])].sort(
            (a, b) =>
              Number(b.is_primary) - Number(a.is_primary) ||
              (a.display_order ?? 0) - (b.display_order ?? 0)
          );

          return {
            ...property,
            image:
              images[0]?.image_url || "/property-placeholder.jpg",
          };
        });

        setProperties(formattedProperties);
      } catch (err) {
        console.error("Featured properties error:", err);

        if (!cancelled) {
          setError("loadError");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFeaturedProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  function formatPrice(price) {
    if (price == null) return t("featured.priceOnRequest");

    return `${Number(price).toLocaleString(i18n.language)} RWF`;
  }

  function formatLabel(value) {
    if (!value) return "";

    const normalized = value.toLowerCase().replace(/_/g, " ").trim();
    const key = normalized.replace(/\s+/g, "_");

    const translated = t(`propertyTypes.${key}`, {
      defaultValue: "",
    });

    if (translated) return translated;

    return normalized.replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
  }

  function formatPeriod(listingType) {
    const value = (listingType || "").toLowerCase();

    if (value === "rent" || value === "for_rent") {
      return t("featured.perMonth");
    }

    return "";
  }

  return (
    <section className="featured-properties">
      <div className="featured-container">
        <div className="featured-header">
          <div className="featured-heading">
            <span className="section-label">
              {t("featured.sectionLabel")}
            </span>

            <h2>{t("featured.title")}</h2>

            <p>{t("featured.description")}</p>
          </div>

          <Link to="/properties" className="view-all-button">
            <span>{t("featured.viewAll")}</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {loading ? (
          <div className="featured-status">
            <Loader2 className="featured-spinner" size={32} />
            <p>{t("featured.loading")}</p>
          </div>
        ) : error ? (
          <div className="featured-status">
            <p>{t(`featured.${error}`)}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              {t("featured.tryAgain")}
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="featured-status">
            <h3>{t("featured.emptyTitle")}</h3>
            <p>{t("featured.emptyDescription")}</p>

            <Link to="/properties" className="view-all-button">
              {t("featured.explore")}
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map((property) => {
              const listingType = (
                property.listing_type || ""
              ).toLowerCase();

              const isSale =
                listingType === "sale" ||
                listingType === "for_sale";

              return (
                <article className="property-card" key={property.id}>
                  <div className="property-image-wrapper">
                    <img
                      src={property.image}
                      alt={property.title || t("featured.property")}
                      className="property-image"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "/property-placeholder.jpg";
                      }}
                    />

                    <span
                      className={`property-badge ${
                        isSale ? "sale-badge" : "rent-badge"
                      }`}
                    >
                      {formatLabel(property.listing_type)}
                    </span>

                    <span className="property-type">
                      {formatLabel(property.property_type)}
                    </span>
                  </div>

                  <div className="property-content">
                    <h3>{property.title}</h3>

                    <div className="property-location">
                      <MapPin size={16} />
                      <span>{t("featured.country")}</span>
                    </div>

                    <div className="property-details">
                      {property.bedrooms != null && (
                        <div>
                          <BedDouble size={17} />
                          <span>
                            {property.bedrooms}{" "}
                            {t("featured.beds")}
                          </span>
                        </div>
                      )}

                      {property.bathrooms != null && (
                        <div>
                          <Bath size={17} />
                          <span>
                            {property.bathrooms}{" "}
                            {t("featured.baths")}
                          </span>
                        </div>
                      )}

                      {property.area_sqm != null && (
                        <div>
                          <Maximize size={16} />
                          <span>{property.area_sqm} m²</span>
                        </div>
                      )}
                    </div>

                    <div className="property-footer">
                      <div className="property-price">
                        <strong>
                          {formatPrice(property.price_rwf)}
                        </strong>

                        {formatPeriod(property.listing_type) && (
                          <small>
                            {formatPeriod(property.listing_type)}
                          </small>
                        )}
                      </div>

                      <Link
                        to={`/properties/${property.id}`}
                        className="property-view-button"
                      >
                        <span>{t("featured.view")}</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProperties;
