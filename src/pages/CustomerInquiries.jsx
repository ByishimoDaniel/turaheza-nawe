
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  ArrowLeft,
  MessageCircle,
  Eye,
  Clock,
  CheckCircle,
} from "lucide-react";

import CustomerSidebar from "../components/CustomerSidebar";
import { supabase } from "../lib/supabase";

function CustomerInquiries() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
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
        .from("property_inquiries")
        .select(`
          id,
          property_id,
          name,
          phone,
          email,
          message,
          is_read,
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

      setInquiries(data || []);
    } catch (error) {
      console.error("Inquiries loading error:", error);
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
      return t("customerInquiries.priceOnRequest");
    }

    return `${Number(price).toLocaleString()} RWF`;
  }

  function formatDate(date) {
    if (!date) return "";

    const language = i18n.resolvedLanguage || i18n.language || "en";
    const baseLanguage = language.split("-")[0].toLowerCase();

    const locales = {
      en: "en-RW",
      fr: "fr-RW",
      rw: "rw-RW",
    };

    return new Date(date).toLocaleDateString(
      locales[baseLanguage] || "en-RW",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getStatus(inquiry) {
    if (inquiry.is_read) {
      return {
        label: t("customerInquiries.statusRead"),
        className: "inquiry-status-read",
        icon: <CheckCircle size={15} />,
      };
    }

    return {
      label: t("customerInquiries.statusNew"),
      className: "inquiry-status-new",
      icon: <Clock size={15} />,
    };
  }

  return (
    <div className="customer-layout">
      {/* SIDEBAR */}
      <CustomerSidebar />

      {/* MAIN CONTENT */}
      <div className="customer-page-content">
        <div className="customer-inquiries-page">
          {/* HEADER */}
          <header className="customer-properties-header">
            <div className="customer-properties-header-top">
              <button
                className="customer-back-button"
                onClick={() => navigate("/customer")}
              >
                <ArrowLeft size={18} />
                {t("customerInquiries.dashboard")}
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
                {t("customerInquiries.communication")}
              </p>

              <h1>
                {t("customerInquiries.title")}
              </h1>

              <span>
                {t("customerInquiries.subtitle")}
              </span>
            </div>
          </header>

          {/* CONTENT */}
          <main className="customer-inquiries-main">
            <div className="customer-results-header">
              <div>
                <h2>
                  {t("customerInquiries.yourInquiries")}
                </h2>

                <p>
                  {t("customerInquiries.inquiryCount", {
                    count: inquiries.length,
                  })}
                </p>
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="customer-properties-loading">
                <div className="customer-spinner"></div>

                <p>
                  {t("customerInquiries.loading")}
                </p>
              </div>
            ) : inquiries.length === 0 ? (
              /* EMPTY STATE */
              <div className="customer-properties-empty">
                <MessageCircle size={45} />

                <h3>
                  {t("customerInquiries.emptyTitle")}
                </h3>

                <p>
                  {t("customerInquiries.emptyDescription")}
                </p>

                <button
                  className="view-property-button"
                  onClick={() =>
                    navigate("/customer/properties")
                  }
                >
                  {t("customerInquiries.browseProperties")}
                </button>
              </div>
            ) : (
              /* INQUIRIES */
              <div className="customer-inquiries-list">
                {inquiries.map((inquiry) => {
                  const property = inquiry.properties;
                  const status = getStatus(inquiry);

                  if (!property) {
                    return null;
                  }

                  return (
                    <article
                      className="customer-inquiry-card"
                      key={inquiry.id}
                    >
                      {/* PROPERTY IMAGE */}
                      <div
                        className="customer-inquiry-image"
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
                            t("customerInquiries.propertyAlt")
                          }
                        />

                        <span className="listing-type-badge">
                          {property.listing_type}
                        </span>
                      </div>

                      {/* CONTENT */}
                      <div className="customer-inquiry-content">
                        <div className="inquiry-property-info">
                          <p className="listing-property-type">
                            {property.property_type}
                          </p>

                          <h3>{property.title}</h3>

                          <strong className="listing-price">
                            {formatPrice(property.price_rwf)}
                          </strong>
                        </div>

                        {/* PROPERTY DETAILS */}
                        <div className="listing-details">
                          {property.bedrooms !== null &&
                            property.bedrooms !== undefined && (
                              <span>
                                {t("customerInquiries.bedrooms", {
                                  count: property.bedrooms,
                                })}
                              </span>
                            )}

                          {property.bathrooms !== null &&
                            property.bathrooms !== undefined && (
                              <span>
                                {t("customerInquiries.bathrooms", {
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

                        {/* MESSAGE */}
                        <div className="inquiry-message">
                          <div className="inquiry-message-header">
                            <MessageCircle size={16} />

                            <span>
                              {t("customerInquiries.yourMessage")}
                            </span>
                          </div>

                          <p>
                            {inquiry.message ||
                              t("customerInquiries.noMessage")}
                          </p>
                        </div>

                        {/* META */}
                        <div className="inquiry-meta">
                          <span>
                            {t("customerInquiries.submitted", {
                              date: formatDate(inquiry.created_at),
                            })}
                          </span>

                          <span
                            className={`inquiry-status ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </div>

                        {/* ACTION */}
                        <div className="inquiry-actions">
                          <button
                            type="button"
                            className="view-property-button"
                            onClick={() =>
                              navigate(
                                `/properties/${property.id}`
                              )
                            }
                          >
                            <Eye size={17} />
                            {t("customerInquiries.viewProperty")}
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

export default CustomerInquiries;
