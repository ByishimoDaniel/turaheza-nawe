import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomerSidebar from "../components/CustomerSidebar";

import {
  Search,
  Heart,
  ArrowLeft,
  SlidersHorizontal,
  Home,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function CustomerProperties() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  useEffect(() => {
    loadProperties();
    loadFavorites();
  }, []);

  async function loadProperties() {
    try {
      setLoading(true);

      const { data, error } = await supabase
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
          furnished,
          parking_available,
          water_available,
          electricity_available,
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
        });

      if (error) throw error;

      setProperties(data || []);
    } catch (error) {
      console.error("Properties error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavorites() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("favorites")
      .select("property_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Favorites error:", error);
      return;
    }

    setFavorites(
      (data || []).map((item) => item.property_id)
    );
  }

  function getImage(property) {
    if (
      property.property_images &&
      property.property_images.length > 0
    ) {
      const primary = property.property_images.find(
        (image) => image.is_primary
      );

      return (
        primary?.image_url ||
        property.property_images[0]?.image_url ||
        "/property-placeholder.jpg"
      );
    }

    return "/property-placeholder.jpg";
  }

  function formatPrice(price) {
    if (!price) {
      return t("customerProperties.priceOnRequest");
    }

    return `${Number(price).toLocaleString()} RWF`;
  }

  async function toggleFavorite(propertyId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const isFavorite = favorites.includes(propertyId);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", propertyId);

      if (error) {
        console.error(error);
        return;
      }

      setFavorites((current) =>
        current.filter((id) => id !== propertyId)
      );
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          property_id: propertyId,
        });

      if (error) {
        console.error(error);
        return;
      }

      setFavorites((current) => [
        ...current,
        propertyId,
      ]);
    }
  }

  const filteredProperties = properties.filter(
    (property) => {
      const searchText = search.toLowerCase().trim();

      const searchMatch =
        !searchText ||
        property.title
          ?.toLowerCase()
          .includes(searchText) ||
        property.description
          ?.toLowerCase()
          .includes(searchText);

      const typeMatch =
        !propertyType ||
        property.property_type === propertyType;

      const listingMatch =
        !listingType ||
        property.listing_type === listingType;

      const bedroomMatch =
        !bedrooms ||
        Number(property.bedrooms) >= Number(bedrooms);

      return (
        searchMatch &&
        typeMatch &&
        listingMatch &&
        bedroomMatch
      );
    }
  );

  return (
    <div className="customer-layout">
      {/* CUSTOMER SIDEBAR */}
      <CustomerSidebar />

      {/* PAGE CONTENT */}
      <div className="customer-page-content">
        <div className="customer-properties-page">
          {/* HEADER */}
          <header className="customer-properties-header">
            <div className="customer-properties-header-top">
              <button
                className="customer-back-button"
                onClick={() => navigate("/customer")}
              >
                <ArrowLeft size={18} />
                {t("customerProperties.dashboard")}
              </button>

              <div className="customer-properties-logo">
                <img
                  src="/turaheza-logo.jpeg"
                  alt="TURAHEZA NAWE"
                />
              </div>
            </div>

            <div className="customer-properties-title">
              <p>
                {t("customerProperties.marketplace")}
              </p>

              <h1>
                {t("customerProperties.title")}
              </h1>

              <span>
                {t("customerProperties.subtitle")}
              </span>
            </div>
          </header>

          {/* FILTERS */}
          <section className="customer-property-filters">
            <div className="customer-search-box">
              <Search size={19} />

              <input
                type="text"
                placeholder={t(
                  "customerProperties.searchPlaceholder"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="customer-filter">
              <SlidersHorizontal size={17} />

              <select
                value={propertyType}
                onChange={(e) =>
                  setPropertyType(e.target.value)
                }
              >
                <option value="">
                  {t("customerProperties.allTypes")}
                </option>

                <option value="house">
                  {t("customerProperties.types.house")}
                </option>

                <option value="apartment">
                  {t("customerProperties.types.apartment")}
                </option>

                <option value="room">
                  {t("customerProperties.types.room")}
                </option>

                <option value="villa">
                  {t("customerProperties.types.villa")}
                </option>

                <option value="land">
                  {t("customerProperties.types.land")}
                </option>

                <option value="shop">
                  {t("customerProperties.types.shop")}
                </option>

                <option value="office">
                  {t("customerProperties.types.office")}
                </option>

                <option value="commercial">
                  {t("customerProperties.types.commercial")}
                </option>
              </select>
            </div>

            <div className="customer-filter">
              <select
                value={listingType}
                onChange={(e) =>
                  setListingType(e.target.value)
                }
              >
                <option value="">
                  {t("customerProperties.rentOrSale")}
                </option>

                <option value="rent">
                  {t("customerProperties.forRent")}
                </option>

                <option value="sale">
                  {t("customerProperties.forSale")}
                </option>
              </select>
            </div>

            <div className="customer-filter">
              <select
                value={bedrooms}
                onChange={(e) =>
                  setBedrooms(e.target.value)
                }
              >
                <option value="">
                  {t("customerProperties.anyBedrooms")}
                </option>

                <option value="1">
                  {t("customerProperties.bedroomOptions.one")}
                </option>

                <option value="2">
                  {t("customerProperties.bedroomOptions.two")}
                </option>

                <option value="3">
                  {t("customerProperties.bedroomOptions.three")}
                </option>

                <option value="4">
                  {t("customerProperties.bedroomOptions.four")}
                </option>
              </select>
            </div>
          </section>

          {/* RESULTS */}
          <main className="customer-properties-main">
            <div className="customer-results-header">
              <div>
                <h2>
                  {t("customerProperties.availableProperties")}
                </h2>

                <p>
                  {t("customerProperties.propertiesFound", {
                    count: filteredProperties.length,
                  })}
                </p>
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="customer-properties-loading">
                <div className="customer-spinner"></div>

                <p>
                  {t("customerProperties.loading")}
                </p>
              </div>
            ) : filteredProperties.length === 0 ? (
              /* EMPTY */
              <div className="customer-properties-empty">
                <Home size={45} />

                <h3>
                  {t("customerProperties.noProperties")}
                </h3>

                <p>
                  {t("customerProperties.changeFilters")}
                </p>
              </div>
            ) : (
              /* PROPERTY GRID */
              <div className="customer-properties-grid">
                {filteredProperties.map((property) => {
                  const isFavorite = favorites.includes(
                    property.id
                  );

                  return (
                    <article
                      className="customer-listing-card"
                      key={property.id}
                    >
                      {/* IMAGE */}
                      <div
                        className="customer-listing-image"
                        onClick={() =>
                          navigate(`/properties/${property.id}`)
                        }
                      >
                        <img
                          src={getImage(property)}
                          alt={
                            property.title ||
                            t("customerProperties.propertyAlt")
                          }
                        />

                        <span className="listing-type-badge">
                          {t(
                            `customerProperties.listingTypes.${property.listing_type}`,
                            {
                              defaultValue: property.listing_type,
                            }
                          )}
                        </span>

                        <button
                          type="button"
                          className={`favorite-button ${
                            isFavorite ? "favorite-active" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(property.id);
                          }}
                          aria-label={
                            isFavorite
                              ? t("customerProperties.removeFavorite")
                              : t("customerProperties.addFavorite")
                          }
                        >
                          <Heart
                            size={19}
                            fill={
                              isFavorite
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>

                      {/* CONTENT */}
                      <div className="customer-listing-content">
                        <p className="listing-property-type">
                          {t(
                            `customerProperties.types.${property.property_type}`,
                            {
                              defaultValue: property.property_type,
                            }
                          )}
                        </p>

                        <h3>{property.title}</h3>

                        <strong className="listing-price">
                          {formatPrice(property.price_rwf)}
                        </strong>

                        <div className="listing-details">
                          {property.bedrooms !== null &&
                            property.bedrooms !== undefined && (
                              <span>
                                {property.bedrooms}{" "}
                                {t("customerProperties.beds")}
                              </span>
                            )}

                          {property.bathrooms !== null &&
                            property.bathrooms !== undefined && (
                              <span>
                                {property.bathrooms}{" "}
                                {t("customerProperties.baths")}
                              </span>
                            )}

                          {property.area_sqm && (
                            <span>
                              {property.area_sqm}{" "}
                              {t("customerProperties.squareMeters")}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="view-property-button"
                          onClick={() =>
                            navigate(`/properties/${property.id}`)
                          }
                        >
                          {t("customerProperties.viewProperty")}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CustomerProperties;