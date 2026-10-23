
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  ArrowLeft,
  Heart,
  Trash2,
} from "lucide-react";

import CustomerSidebar from "../components/CustomerSidebar";
import { supabase } from "../lib/supabase";

function CustomerFavorites() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          property_id,
          created_at,
          properties (
            id,
            title,
            description,
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
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setFavorites(data || []);
    } catch (error) {
      console.error("Favorites loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getImage(property) {
    if (
      property?.property_images &&
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
      return t("customerFavorites.priceOnRequest");
    }

    return `${Number(price).toLocaleString()} RWF`;
  }

  async function removeFavorite(favoriteId, propertyId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setFavorites((current) =>
        current.filter(
          (favorite) => favorite.id !== favoriteId
        )
      );

      console.log("Removed favorite:", propertyId);
    } catch (error) {
      console.error("Remove favorite error:", error);
    }
  }

  return (
    <div className="customer-layout">
      {/* SIDEBAR */}
      <CustomerSidebar />

      {/* MAIN CONTENT */}
      <div className="customer-page-content">
        <div className="customer-favorites-page">
          {/* HEADER */}
          <header className="customer-properties-header">
            <div className="customer-properties-header-top">
              <button
                className="customer-back-button"
                onClick={() => navigate("/customer")}
              >
                <ArrowLeft size={18} />
                {t("customerFavorites.dashboard")}
              </button>

              <div className="customer-properties-logo">
                <img
                  src="/turaheza-logo.jpeg"
                  alt="TURAHEZA NAWE"
                />
              </div>
            </div>

            <div className="customer-properties-title">
              <p>{t("customerFavorites.collection")}</p>

              <h1>
                {t("customerFavorites.title")}
              </h1>

              <span>
                {t("customerFavorites.subtitle")}
              </span>
            </div>
          </header>

          {/* CONTENT */}
          <main className="customer-favorites-main">
            <div className="customer-results-header">
              <div>
                <h2>
                  {t("customerFavorites.savedProperties")}
                </h2>

                <p>
                  {t("customerFavorites.savedCount", {
                    count: favorites.length,
                  })}
                </p>
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="customer-properties-loading">
                <div className="customer-spinner"></div>

                <p>
                  {t("customerFavorites.loading")}
                </p>
              </div>
            ) : favorites.length === 0 ? (
              /* EMPTY STATE */
              <div className="customer-properties-empty">
                <Heart size={45} />

                <h3>
                  {t("customerFavorites.emptyTitle")}
                </h3>

                <p>
                  {t("customerFavorites.emptyDescription")}
                </p>

                <button
                  className="view-property-button"
                  onClick={() =>
                    navigate("/customer/properties")
                  }
                >
                  {t("customerFavorites.browseProperties")}
                </button>
              </div>
            ) : (
              /* FAVORITES GRID */
              <div className="customer-properties-grid">
                {favorites.map((favorite) => {
                  const property = favorite.properties;

                  if (!property) {
                    return null;
                  }

                  return (
                    <article
                      className="customer-listing-card"
                      key={favorite.id}
                    >
                      {/* IMAGE */}
                      <div
                        className="customer-listing-image"
                        onClick={() =>
                          navigate(
                            `/properties/${property.id}`
                          )
                        }
                      >
                        <img
                          src={getImage(property)}
                          alt={
                            property.title ||
                            t("customerFavorites.propertyAlt")
                          }
                        />

                        <span className="listing-type-badge">
                          {property.listing_type}
                        </span>

                        <button
                          type="button"
                          className="favorite-button favorite-active"
                          onClick={(e) => {
                            e.stopPropagation();

                            removeFavorite(
                              favorite.id,
                              property.id
                            );
                          }}
                          aria-label={t(
                            "customerFavorites.removeFromFavorites"
                          )}
                        >
                          <Heart
                            size={19}
                            fill="currentColor"
                          />
                        </button>
                      </div>

                      {/* CONTENT */}
                      <div className="customer-listing-content">
                        <p className="listing-property-type">
                          {property.property_type}
                        </p>

                        <h3>{property.title}</h3>

                        <strong className="listing-price">
                          {formatPrice(property.price_rwf)}
                        </strong>

                        <div className="listing-details">
                          {property.bedrooms !== null &&
                            property.bedrooms !== undefined && (
                              <span>
                                {t("customerFavorites.bedrooms", {
                                  count: property.bedrooms,
                                })}
                              </span>
                            )}

                          {property.bathrooms !== null &&
                            property.bathrooms !== undefined && (
                              <span>
                                {t("customerFavorites.bathrooms", {
                                  count: property.bathrooms,
                                })}
                              </span>
                            )}

                          {property.area_sqm && (
                            <span>
                              {property.area_sqm} m²
                            </span>
                          )}
                        </div>

                        <div className="favorite-card-actions">
                          <button
                            type="button"
                            className="view-property-button"
                            onClick={() =>
                              navigate(
                                `/properties/${property.id}`
                              )
                            }
                          >
                            {t("customerFavorites.viewProperty")}
                          </button>

                          <button
                            type="button"
                            className="remove-favorite-button"
                            onClick={() =>
                              removeFavorite(
                                favorite.id,
                                property.id
                              )
                            }
                            aria-label={t(
                              "customerFavorites.removeFavorite"
                            )}
                          >
                            <Trash2 size={17} />
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
      </div>
    </div>
  );
}

export default CustomerFavorites;
