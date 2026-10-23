import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Search,
  MapPin,
  Home,
  SlidersHorizontal,
  BedDouble,
  Bath,
  Maximize,
  Heart,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function Properties() {
  const { t, i18n } = useTranslation();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [listingType, setListingType] = useState("");
  const [propertyType, setPropertyType] = useState("");

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("properties")
      .select(`
        *,
        property_images (
          image_url
        )
      `)
      .eq("status", "approved")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Properties error:", error);
      setErrorMessage("loadError");
      setProperties([]);
    } else {
      setProperties(data || []);
    }

    setLoading(false);
  }

  const filteredProperties = properties.filter((property) => {
    const text = Object.values(property)
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !search || text.includes(search.toLowerCase());

    const matchesListing =
      !listingType || property.listing_type === listingType;

    const matchesProperty =
      !propertyType || property.property_type === propertyType;

    return matchesSearch && matchesListing && matchesProperty;
  });

  function formatPrice(price) {
    if (price == null) {
      return t("properties.priceOnRequest");
    }

    return `${Number(price).toLocaleString(
      i18n.language
    )} RWF`;
  }

  function translatePropertyType(type) {
    if (!type) return t("properties.propertyListing");

    const key = String(type).toLowerCase();

    return t(`propertyTypes.${key}`, {
      defaultValue: key.charAt(0).toUpperCase() + key.slice(1),
    });
  }

  function translateListingType(type) {
    if (type === "sale") return t("properties.forSale");
    if (type === "rent") return t("properties.forRent");

    return type || "";
  }

  return (
    <main className="properties-page">
      {/* HEADER */}
      <section className="properties-header">
        <div className="properties-header-content">
          <span className="section-label">
            TURAHEZA NAWE
          </span>

          <h1>{t("properties.pageTitle")}</h1>

          <p>{t("properties.pageDescription")}</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="properties-container">
        {/* FILTER BAR */}
        <div className="property-filter-bar">
          <div className="property-filter-search">
            <Search size={19} />

            <input
              type="text"
              placeholder={t("properties.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="property-filter-select">
            <Home size={18} />

            <select
              value={listingType}
              onChange={(event) =>
                setListingType(event.target.value)
              }
            >
              <option value="">
                {t("properties.rentOrSale")}
              </option>

              <option value="rent">
                {t("properties.forRent")}
              </option>

              <option value="sale">
                {t("properties.forSale")}
              </option>
            </select>
          </div>

          <div className="property-filter-select">
            <SlidersHorizontal size={18} />

            <select
              value={propertyType}
              onChange={(event) =>
                setPropertyType(event.target.value)
              }
            >
              <option value="">
                {t("properties.allPropertyTypes")}
              </option>

              <option value="house">
                {t("propertyTypes.house")}
              </option>

              <option value="apartment">
                {t("propertyTypes.apartment")}
              </option>

              <option value="room">
                {t("propertyTypes.room")}
              </option>

              <option value="villa">
                {t("propertyTypes.villa")}
              </option>

              <option value="land">
                {t("propertyTypes.land")}
              </option>

              <option value="shop">
                {t("propertyTypes.shop")}
              </option>

              <option value="office">
                {t("propertyTypes.office")}
              </option>

              <option value="commercial">
                {t("propertyTypes.commercial")}
              </option>
            </select>
          </div>
        </div>

        {/* RESULTS HEADER */}
        <div className="properties-results-header">
          <div>
            <h2>{t("properties.availableTitle")}</h2>

            <p>
              {loading
                ? t("properties.loading")
                : t("properties.resultsCount", {
                    count: filteredProperties.length,
                  })}
            </p>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="properties-message">
            <div className="loading-spinner"></div>
            <p>{t("properties.loadingProperties")}</p>
          </div>
        )}

        {/* ERROR */}
        {!loading && errorMessage && (
          <div className="properties-message">
            <Home size={45} />

            <h3>{t("properties.unableToLoad")}</h3>

            <p>{t(`properties.${errorMessage}`)}</p>

            <button
              type="button"
              onClick={loadProperties}
              className="property-view-button"
            >
              {t("properties.tryAgain")}
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !errorMessage &&
          filteredProperties.length === 0 && (
            <div className="properties-message">
              <Home size={45} />

              <h3>{t("properties.noProperties")}</h3>

              <p>{t("properties.noPropertiesDescription")}</p>

              {(search || listingType || propertyType) && (
                <button
                  type="button"
                  className="property-view-button"
                  onClick={() => {
                    setSearch("");
                    setListingType("");
                    setPropertyType("");
                  }}
                >
                  {t("properties.clearFilters")}
                </button>
              )}
            </div>
          )}

        {/* PROPERTY GRID */}
        {!loading &&
          !errorMessage &&
          filteredProperties.length > 0 && (
            <div className="property-grid">
              {filteredProperties.map((property) => (
                <article
                  className="property-card"
                  key={property.id}
                >
                  <div className="property-image-wrapper">
                    {property.property_images?.[0]?.image_url ? (
                      <img
                        src={property.property_images[0].image_url}
                        alt={
                          property.title ||
                          t("properties.propertyListing")
                        }
                        className="property-image"
                      />
                    ) : (
                      <div className="property-no-image">
                        <Home size={40} />
                      </div>
                    )}

                    <span
                      className={`property-badge ${
                        property.listing_type === "sale"
                          ? "sale-badge"
                          : "rent-badge"
                      }`}
                    >
                      {translateListingType(property.listing_type)}
                    </span>

                    <button
                      className="favorite-button"
                      type="button"
                      aria-label={t("properties.addToFavorites")}
                      title={t("properties.addToFavorites")}
                      onClick={() => {
                        window.alert(
                          t("properties.favoritesComingSoon")
                        );
                      }}
                    >
                      <Heart size={18} />
                    </button>
                  </div>

                  <div className="property-content">
                    <h3>
                      {property.title ||
                        t("properties.propertyListing")}
                    </h3>

                    <div className="property-location">
                      <MapPin size={16} />

                      <span>
                        {property.location ||
                          t("properties.country")}
                      </span>
                    </div>

                    <div className="property-details">
                      {property.bedrooms != null && (
                        <div>
                          <BedDouble size={16} />
                          <span>
                            {property.bedrooms}{" "}
                            {t("properties.beds")}
                          </span>
                        </div>
                      )}

                      {property.bathrooms != null && (
                        <div>
                          <Bath size={16} />
                          <span>
                            {property.bathrooms}{" "}
                            {t("properties.baths")}
                          </span>
                        </div>
                      )}

                      {property.area_sqm != null && (
                        <div>
                          <Maximize size={16} />
                          <span>
                            {property.area_sqm} m²
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="property-footer">
                      <div className="property-price">
                        <strong>
                          {formatPrice(property.price_rwf)}
                        </strong>

                        {property.listing_type === "rent" && (
                          <small>
                            {t("properties.perMonth")}
                          </small>
                        )}
                      </div>

                      <a
                        href={`/properties/${property.id}`}
                        className="property-view-button"
                      >
                        {t("properties.viewProperty")}
                      </a>
                    </div>

                    <span className="property-type-label">
                      {translatePropertyType(property.property_type)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    </main>
  );
}

export default Properties;