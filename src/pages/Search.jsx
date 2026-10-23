
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  Search as SearchIcon,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function Search() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [listingType, setListingType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [district, setDistrict] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("properties")
        .select(`
          id, title, description, property_type, listing_type,
          price_rwf, bedrooms, bathrooms, area_sqm,
          locations (district, sector, address),
          property_images (image_url, is_primary, display_order)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (queryError) {
        console.error("Loading properties failed:", queryError);
        setError("loadError");
        setProperties([]);
      } else {
        setProperties(data || []);
      }

      setLoading(false);
    }

    loadProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  // Require sign-in before opening a property or sending an inquiry.
  async function requireLogin(propertyId, action = "view") {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session check failed:", sessionError);
      setError("sessionError");
      return;
    }

    const destination =
      action === "inquiry"
        ? `/properties/${propertyId}?action=inquiry`
        : `/properties/${propertyId}`;

    if (!session) {
      navigate(
        `/login?redirect=${encodeURIComponent(destination)}`
      );
      return;
    }

    navigate(destination);
  }

  const filteredProperties = properties.filter((property) => {
    const location = property.locations;

    const locationText = [
      location?.district,
      location?.sector,
      location?.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const searchText = [
      property.title,
      property.description,
      property.property_type,
      property.listing_type,
      locationText,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!keyword ||
        searchText.includes(keyword.trim().toLowerCase())) &&
      (!listingType || property.listing_type === listingType) &&
      (!propertyType || property.property_type === propertyType) &&
      (!district ||
        location?.district?.toLowerCase() === district.toLowerCase()) &&
      (!maxPrice ||
        Number(property.price_rwf) <= Number(maxPrice))
    );
  });

  function getImage(property) {
    const images = [...(property.property_images || [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        (a.display_order ?? 0) - (b.display_order ?? 0)
    );

    return images[0]?.image_url || "";
  }

  function formatPrice(price) {
    const locale =
      currentLanguage === "fr"
        ? "fr-FR"
        : currentLanguage === "rw"
        ? "rw-RW"
        : "en-RW";

    return `${Number(price || 0).toLocaleString(locale)} RWF`;
  }

  const currentLanguage = (
    i18n.resolvedLanguage || i18n.language || "en"
  ).split("-")[0];

  function propertyTypeLabel(type) {
    return t(`propertyTypes.${type}`, {
      defaultValue: type || t("searchPage.property"),
    });
  }

  function listingTypeLabel(type) {
    return type === "rent"
      ? t("searchPage.forRent")
      : t("searchPage.forSale");
  }

  function clearFilters() {
    setKeyword("");
    setListingType("");
    setPropertyType("");
    setDistrict("");
    setMaxPrice("");
  }

  return (
    <main className="market-search-page">
      <section className="market-search-hero">
        <span className="market-eyebrow">
          {t("searchPage.eyebrow")}
        </span>

        <h1>{t("searchPage.title")}</h1>

        <p>{t("searchPage.description")}</p>

        <div className="market-search-box">
          <SearchIcon size={21} />

          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("searchPage.keywordPlaceholder")}
            aria-label={t("searchPage.searchLabel")}
          />
        </div>
      </section>

      <section className="market-search-content">
        <aside className="market-filter-panel">
          <h2>{t("searchPage.filtersTitle")}</h2>

          <label>
            {t("searchPage.listingType")}
            <select
              value={listingType}
              onChange={(event) => setListingType(event.target.value)}
            >
              <option value="">
                {t("searchPage.rentOrSale")}
              </option>
              <option value="rent">
                {t("searchPage.forRent")}
              </option>
              <option value="sale">
                {t("searchPage.forSale")}
              </option>
            </select>
          </label>

          <label>
            {t("searchPage.propertyType")}
            <select
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value)}
            >
              <option value="">
                {t("searchPage.allPropertyTypes")}
              </option>
              <option value="house">
                {propertyTypeLabel("house")}
              </option>
              <option value="apartment">
                {propertyTypeLabel("apartment")}
              </option>
              <option value="room">
                {propertyTypeLabel("room")}
              </option>
              <option value="villa">
                {propertyTypeLabel("villa")}
              </option>
              <option value="land">
                {propertyTypeLabel("land")}
              </option>
              <option value="shop">
                {propertyTypeLabel("shop")}
              </option>
              <option value="office">
                {propertyTypeLabel("office")}
              </option>
              <option value="commercial">
                {propertyTypeLabel("commercial")}
              </option>
            </select>
          </label>

          <label>
            {t("searchPage.district")}
            <select
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            >
              <option value="">
                {t("searchPage.allDistricts")}
              </option>
              <option value="Rubavu">Rubavu</option>
              <option value="Musanze">Musanze</option>
              <option value="Gasabo">Gasabo</option>
              <option value="Kicukiro">Kicukiro</option>
              <option value="Nyarugenge">Nyarugenge</option>
            </select>
          </label>

          <label>
            {t("searchPage.maxPrice")}
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder={t("searchPage.pricePlaceholder")}
            />
          </label>

          <button
            type="button"
            className="market-reset-button"
            onClick={clearFilters}
          >
            {t("searchPage.clearFilters")}
          </button>
        </aside>

        <div className="market-results">
          <div className="market-results-heading">
            <div>
              <h2>{t("searchPage.availableProperties")}</h2>
              <p>
                {t("searchPage.resultsCount", {
                  count: filteredProperties.length,
                })}
              </p>
            </div>
          </div>

          {loading && (
            <div className="market-state">
              {t("searchPage.loading")}
            </div>
          )}

          {!loading && error && (
            <div className="market-state market-error">
              {t(`searchPage.${error}`)}
              {error === "loadError" && (
                <button
                  type="button"
                  className="market-reset-button"
                  onClick={() => window.location.reload()}
                >
                  {t("searchPage.tryAgain")}
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredProperties.length === 0 && (
            <div className="market-state">
              <SearchIcon size={35} />
              <h3>{t("searchPage.noProperties")}</h3>
              <p>{t("searchPage.noPropertiesDescription")}</p>
              <button
                type="button"
                className="market-reset-button"
                onClick={clearFilters}
              >
                {t("searchPage.clearFilters")}
              </button>
            </div>
          )}

          {!loading && !error && filteredProperties.length > 0 && (
            <div className="market-property-grid">
              {filteredProperties.map((property) => {
                const imageUrl = getImage(property);
                const location = property.locations;

                return (
                  <article
                    className="market-property-card"
                    key={property.id}
                  >
                    <button
                      type="button"
                      className="market-property-image"
                      onClick={() => requireLogin(property.id, "view")}
                      aria-label={t("searchPage.viewNamedProperty", {
                        title: property.title,
                      })}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={property.title || t("searchPage.property")}
                        />
                      ) : (
                        <div className="market-no-image">
                          {t("searchPage.noPhoto")}
                        </div>
                      )}

                      <span className="market-listing-badge">
                        {listingTypeLabel(property.listing_type)}
                      </span>
                    </button>

                    <div className="market-property-info">
                      <span className="market-property-type">
                        {propertyTypeLabel(property.property_type)}
                      </span>

                      <h3>
                        <button
                          type="button"
                          className="market-property-title-button"
                          onClick={() => requireLogin(property.id, "view")}
                        >
                          {property.title || t("searchPage.property")}
                        </button>
                      </h3>

                      <p className="market-property-location">
                        <MapPin size={15} />
                        {[
                          location?.sector,
                          location?.district,
                        ]
                          .filter(Boolean)
                          .join(", ") || t("searchPage.country")}
                      </p>

                      <strong className="market-property-price">
                        {formatPrice(property.price_rwf)}
                        {property.listing_type === "rent"
                          ? ` / ${t("searchPage.perMonth")}`
                          : ""}
                      </strong>

                      <div className="market-property-features">
                        {property.bedrooms != null && (
                          <span>
                            <BedDouble size={15} />
                            {property.bedrooms}{" "}
                            {t("searchPage.beds")}
                          </span>
                        )}

                        {property.bathrooms != null && (
                          <span>
                            <Bath size={15} />
                            {property.bathrooms}{" "}
                            {t("searchPage.baths")}
                          </span>
                        )}

                        {property.area_sqm != null && (
                          <span>
                            <Maximize size={15} />
                            {property.area_sqm} m²
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="market-view-button"
                        onClick={() => requireLogin(property.id, "view")}
                      >
                        {t("searchPage.viewProperty")}
                      </button>

                      <button
                        type="button"
                        className="market-inquiry-button"
                        onClick={() => requireLogin(property.id, "inquiry")}
                      >
                        {t("searchPage.sendInquiry")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
