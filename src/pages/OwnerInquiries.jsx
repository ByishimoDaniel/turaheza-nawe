
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Home,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import OwnerSidebar from "../components/OwnerSidebar";

function OwnerInquiries() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      /*
        Get properties where the logged-in user is either:

        1. The owner
        OR
        2. The authorized agent
      */
      const { data: properties, error: propertiesError } =
        await supabase
          .from("properties")
          .select("id")
          .or(
            `owner_id.eq.${user.id},agent_id.eq.${user.id}`
          );

      if (propertiesError) {
        throw propertiesError;
      }

      if (!properties || properties.length === 0) {
        setInquiries([]);
        return;
      }

      const propertyIds = properties.map(
        (property) => property.id
      );

      /*
        Get inquiries belonging to those properties.
      */
      const { data, error: inquiriesError } =
        await supabase
          .from("property_inquiries")
          .select(`
            id,
            property_id,
            user_id,
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
          .in("property_id", propertyIds)
          .order("created_at", {
            ascending: false,
          });

      if (inquiriesError) {
        throw inquiriesError;
      }

      setInquiries(data || []);
    } catch (err) {
      console.error(
        "Error loading inquiries:",
        err
      );

      setError(
        err.message ||
          t("ownerInquiries.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  /*
    Mark inquiry as read
  */
  const markAsRead = async (inquiryId) => {
    try {
      const { error } = await supabase
        .from("property_inquiries")
        .update({
          is_read: true,
        })
        .eq("id", inquiryId);

      if (error) {
        throw error;
      }

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === inquiryId
            ? {
                ...inquiry,
                is_read: true,
              }
            : inquiry
        )
      );
    } catch (err) {
      console.error(
        "Error marking inquiry as read:",
        err
      );

      alert(
        t("ownerInquiries.markReadError")
      );
    }
  };

  /*
    Format price
  */
  const formatPrice = (price) => {
    if (!price) {
      return t("ownerInquiries.priceOnRequest");
    }

    return `${Number(price).toLocaleString()} RWF`;
  };

  /*
    Format date
  */
  const formatDate = (date) => {
    const language =
      i18n.resolvedLanguage || i18n.language;

    const localeMap = {
      en: "en-RW",
      fr: "fr-RW",
      rw: "rw-RW",
    };

    const locale =
      localeMap[language] ||
      localeMap[language?.split("-")[0]] ||
      "en-RW";

    return new Date(date).toLocaleDateString(
      locale,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  /*
    Get primary property image
  */
  const getPropertyImage = (property) => {
    if (
      !property?.property_images ||
      property.property_images.length === 0
    ) {
      return null;
    }

    const images = [
      ...property.property_images,
    ].sort((a, b) => {
      if (
        a.is_primary &&
        !b.is_primary
      ) {
        return -1;
      }

      if (
        !a.is_primary &&
        b.is_primary
      ) {
        return 1;
      }

      return (
        (a.display_order || 0) -
        (b.display_order || 0)
      );
    });

    return images[0]?.image_url || null;
  };

  /*
    Call customer
  */
  const contactCustomer = (inquiry) => {
    if (!inquiry.phone) {
      alert(
        t("ownerInquiries.noPhone")
      );
      return;
    }

    window.location.href = `tel:${inquiry.phone}`;
  };

  /*
    Email customer
  */
  const emailCustomer = (inquiry) => {
    if (!inquiry.email) {
      alert(
        t("ownerInquiries.noEmail")
      );
      return;
    }

    window.location.href = `mailto:${inquiry.email}`;
  };

  /*
    Loading
  */
  if (loading) {
    return (
      <div className="owner-layout">
        <OwnerSidebar />

        <main className="owner-page-content">
          <div className="owner-inquiries-loading">
            <div className="owner-inquiries-spinner"></div>

            <p>
              {t("ownerInquiries.loading")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  /*
    Error
  */
  if (error) {
    return (
      <div className="owner-layout">
        <OwnerSidebar />

        <main className="owner-page-content">
          <div className="owner-inquiries-error">
            <h2>
              {t("ownerInquiries.unableToLoad")}
            </h2>

            <p>{error}</p>

            <button
              onClick={loadInquiries}
            >
              {t("ownerInquiries.tryAgain")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
    Main page
  */
  return (
    <div className="owner-layout">
      <OwnerSidebar />

      <main className="owner-page-content owner-inquiries-page">

        {/* Back */}
        <button
          className="owner-back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          {t("ownerInquiries.back")}
        </button>

        {/* Header */}
        <div className="owner-page-header">
          <div>
            <p className="owner-page-eyebrow">
              {t("ownerInquiries.eyebrow")}
            </p>

            <h1>
              {t("ownerInquiries.title")}
            </h1>

            <p>
              {t("ownerInquiries.subtitle")}
            </p>
          </div>

          <div className="owner-inquiry-count">
            <MessageCircle size={18} />

            <span>
              {t("ownerInquiries.inquiryCount", {
                count: inquiries.length,
              })}
            </span>
          </div>
        </div>

        {/* Empty state */}
        {inquiries.length === 0 ? (
          <div className="owner-inquiries-empty">
            <MessageCircle size={52} />

            <h2>
              {t("ownerInquiries.emptyTitle")}
            </h2>

            <p>
              {t("ownerInquiries.emptyDescription")}
            </p>

            <button
              onClick={() =>
                navigate("/owner/properties")
              }
            >
              {t("ownerInquiries.viewProperties")}
            </button>
          </div>
        ) : (
          <div className="owner-inquiries-list">

            {inquiries.map((inquiry) => {
              const property =
                inquiry.properties;

              const image =
                getPropertyImage(property);

              return (
                <article
                  key={inquiry.id}
                  className={`owner-inquiry-card ${
                    inquiry.is_read
                      ? "owner-inquiry-read"
                      : "owner-inquiry-unread"
                  }`}
                >

                  {/* Property image */}
                  <div className="owner-inquiry-image">

                    {image ? (
                      <img
                        src={image}
                        alt={
                          property?.title ||
                          t("ownerInquiries.propertyFallback")
                        }
                      />
                    ) : (
                      <div className="owner-inquiry-no-image">
                        <Home size={42} />
                      </div>
                    )}

                  </div>

                  {/* Content */}
                  <div className="owner-inquiry-content">

                    {/* Property header */}
                    <div className="owner-inquiry-property">

                      <div>
                        <span className="owner-inquiry-label">
                          {t("ownerInquiries.property")}
                        </span>

                        <h2>
                          {property?.title ||
                            t("ownerInquiries.propertyFallback")}
                        </h2>
                      </div>

                      <span
                        className={`owner-inquiry-status ${
                          inquiry.is_read
                            ? "owner-inquiry-status-read"
                            : "owner-inquiry-status-new"
                        }`}
                      >
                        {inquiry.is_read ? (
                          <>
                            <CheckCircle
                              size={15}
                            />
                            {t("ownerInquiries.read")}
                          </>
                        ) : (
                          <>
                            <Clock
                              size={15}
                            />
                            {t("ownerInquiries.new")}
                          </>
                        )}
                      </span>

                    </div>

                    {/* Property details */}
                    <div className="owner-inquiry-property-details">

                      <span>
                        {property?.property_type ||
                          t("ownerInquiries.propertyFallback")}
                      </span>

                      <span>
                        {property?.listing_type ||
                          t("ownerInquiries.listingFallback")}
                      </span>

                      <span>
                        {formatPrice(
                          property?.price_rwf
                        )}
                      </span>

                      {property?.bedrooms !==
                        null &&
                        property?.bedrooms !==
                          undefined && (
                          <span>
                            {t("ownerInquiries.bedrooms", {
                              count: property.bedrooms,
                            })}
                          </span>
                        )}

                    </div>

                    {/* Customer */}
                    <div className="owner-inquiry-customer">

                      <h3>
                        {t("ownerInquiries.customer")}
                      </h3>

                      <p>
                        <strong>
                          {inquiry.name ||
                            t("ownerInquiries.customerFallback")}
                        </strong>
                      </p>

                      {inquiry.phone && (
                        <p>
                          <Phone size={15} />
                          {inquiry.phone}
                        </p>
                      )}

                      {inquiry.email && (
                        <p>
                          <Mail size={15} />
                          {inquiry.email}
                        </p>
                      )}

                    </div>

                    {/* Message */}
                    <div className="owner-inquiry-message">

                      <div className="owner-inquiry-message-header">
                        <MessageCircle
                          size={17}
                        />

                        <span>
                          {t("ownerInquiries.message")}
                        </span>
                      </div>

                      <p>
                        {inquiry.message ||
                          t("ownerInquiries.noMessage")}
                      </p>

                    </div>

                    {/* Footer */}
                    <div className="owner-inquiry-footer">

                      <span>
                        {t("ownerInquiries.received", {
                          date: formatDate(
                            inquiry.created_at
                          ),
                        })}
                      </span>

                      <div className="owner-inquiry-actions">

                        {!inquiry.is_read && (
                          <button
                            className="owner-inquiry-read-button"
                            onClick={() =>
                              markAsRead(
                                inquiry.id
                              )
                            }
                          >
                            <CheckCircle
                              size={16}
                            />

                            {t("ownerInquiries.markAsRead")}
                          </button>
                        )}

                        {inquiry.phone && (
                          <button
                            className="owner-inquiry-contact-button"
                            onClick={() =>
                              contactCustomer(
                                inquiry
                              )
                            }
                          >
                            <Phone size={16} />
                            {t("ownerInquiries.call")}
                          </button>
                        )}

                        {inquiry.email && (
                          <button
                            className="owner-inquiry-email-button"
                            onClick={() =>
                              emailCustomer(
                                inquiry
                              )
                            }
                          >
                            <Mail size={16} />
                            {t("ownerInquiries.email")}
                          </button>
                        )}

                      </div>
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

export default OwnerInquiries;
