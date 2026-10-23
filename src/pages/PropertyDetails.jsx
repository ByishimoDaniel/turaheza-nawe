
import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  MessageCircle,
  Phone,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function PropertyDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [selectedImage, setSelectedImage] = useState(0);

  // Check login before loading property details.
  useEffect(() => {
    let cancelled = false;

    async function initializePage() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (cancelled) return;

        if (!session) {
          const destination = `/properties/${id}${
            searchParams.get("action") === "inquiry"
              ? "?action=inquiry"
              : ""
          }`;

          navigate(
            `/login?redirect=${encodeURIComponent(destination)}`,
            { replace: true }
          );
          return;
        }

        await Promise.all([
          loadProperty(cancelled),
          loadUser(cancelled),
          checkFavorite(cancelled),
        ]);

        if (cancelled) return;

        // Reopen the inquiry form when returning from Login.
        if (searchParams.get("action") === "inquiry") {
          setShowInquiryForm(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Property page initialization error:", err);
          setError(t("propertyDetails.errors.verifyAccount"));
          setLoading(false);
        }
      }
    }

    initializePage();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, searchParams, t]);

  async function loadProperty(cancelled = false) {
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
        status,
        property_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `)
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (error) throw error;
    if (cancelled) return;

    setProperty(data);

    const sortedImages = [...(data.property_images || [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        (a.display_order ?? 0) - (b.display_order ?? 0)
    );

    setImages(sortedImages);
    setSelectedImage(0);
    setLoading(false);
  }

  async function loadUser(cancelled = false) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user || cancelled) return;

    // Prefer the authenticated user's profile information.
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email")
      .eq("id", user.id)
      .maybeSingle();

    if (cancelled) return;

    setForm((current) => ({
      ...current,
      name:
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        current.name,
      phone: profile?.phone || current.phone,
      email: user.email || profile?.email || current.email,
    }));
  }

  async function checkFavorite(cancelled = false) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user || cancelled) return;

    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", id)
      .maybeSingle();

    if (error) throw error;
    if (!cancelled) setIsFavorite(!!data);
  }

  async function toggleFavorite() {
    try {
      setFavoriteLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate(
          `/login?redirect=${encodeURIComponent(`/properties/${id}`)}`
        );
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            property_id: id,
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("Favorite error:", err);
      alert(t("propertyDetails.errors.updateFavorites"));
    } finally {
      setFavoriteLoading(false);
    }
  }

  function formatPrice(price) {
    if (price == null) {
      return t("propertyDetails.priceOnRequest");
    }

    return `${Number(price).toLocaleString()} RWF`;
  }

  function formatListingType(value) {
    if (!value) return "";

    const normalized = value.toLowerCase().replace(/_/g, " ").trim();
    const key = normalized.replace(/\s+/g, "_");
    const translated = t(`propertyDetails.listingTypes.${key}`);

    if (translated !== `propertyDetails.listingTypes.${key}`) {
      return translated;
    }

    return normalized.replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
  }

  function formatPropertyType(value) {
    if (!value) return "";

    const normalized = value.toLowerCase().replace(/\s+/g, "_");
    const translated = t(`propertyDetails.propertyTypes.${normalized}`);

    if (translated !== `propertyDetails.propertyTypes.${normalized}`) {
      return translated;
    }

    return formatListingType(value);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openInquiryForm() {
    setInquirySuccess(false);
    setShowInquiryForm(true);
  }

  async function submitInquiry(event) {
    event.preventDefault();

    try {
      setInquiryLoading(true);
      setInquirySuccess(false);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        const destination = `/properties/${id}?action=inquiry`;

        navigate(
          `/login?redirect=${encodeURIComponent(destination)}`
        );
        return;
      }

      if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
        alert(t("propertyDetails.errors.completeRequiredFields"));
        return;
      }

      const { error } = await supabase
        .from("property_inquiries")
        .insert({
          property_id: id,
          user_id: user.id,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || user.email || "",
          message: form.message.trim(),
        });

      if (error) throw error;

      setInquirySuccess(true);

      setForm((current) => ({
        ...current,
        message: "",
      }));
    } catch (err) {
      console.error("Inquiry submission error:", err);
      alert(t("propertyDetails.errors.sendInquiry"));
    } finally {
      setInquiryLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="property-details-loading">
        <Loader2 className="property-details-spinner" size={35} />
        <p>{t("propertyDetails.loading")}</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-details-error">
        <h2>
          {error
            ? t("propertyDetails.errors.openProperty")
            : t("propertyDetails.errors.propertyNotFound")}
        </h2>

        <p>
          {error ||
            t("propertyDetails.errors.propertyUnavailable")}
        </p>

        <button
          type="button"
          onClick={() => navigate("/properties")}
        >
          {t("propertyDetails.backToProperties")}
        </button>
      </div>
    );
  }

  const currentImage =
    images[selectedImage]?.image_url ||
    "/property-placeholder.jpg";

  return (
    <div className="property-details-page">
      <div className="property-details-container">
        <button
          type="button"
          className="property-details-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          {t("propertyDetails.back")}
        </button>

        <section className="property-gallery">
          <div className="property-main-image">
            <img
              src={currentImage}
              alt={property.title || t("propertyDetails.propertyImage")}
            />

            <span className="property-gallery-badge">
              {formatListingType(property.listing_type)}
            </span>

            <button
              type="button"
              className={`property-gallery-favorite ${
                isFavorite ? "active" : ""
              }`}
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              aria-label={
                isFavorite
                  ? t("propertyDetails.removeFavorite")
                  : t("propertyDetails.addFavorite")
              }
            >
              <Heart
                size={22}
                fill={isFavorite ? "currentColor" : "none"}
              />
            </button>
          </div>

          {images.length > 1 && (
            <div className="property-thumbnail-list">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  className={`property-thumbnail ${
                    selectedImage === index ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={t("propertyDetails.viewImage", {
                    number: index + 1,
                  })}
                >
                  <img
                    src={image.image_url}
                    alt={`${property.title} ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="property-details-content">
          <div className="property-details-main">
            <p className="property-details-type">
              {formatPropertyType(property.property_type)}
            </p>

            <h1>{property.title}</h1>

            <div className="property-details-location">
              <MapPin size={18} />
              <span>{t("propertyDetails.location")}</span>
            </div>

            <div className="property-details-price">
              {formatPrice(property.price_rwf)}
              {property.listing_type?.toLowerCase() === "rent" && (
                <span> {t("propertyDetails.perMonth")}</span>
              )}
            </div>

            <div className="property-features">
              {property.bedrooms != null && (
                <div className="property-feature">
                  <BedDouble size={22} />
                  <div>
                    <strong>{property.bedrooms}</strong>
                    <span>{t("propertyDetails.bedrooms")}</span>
                  </div>
                </div>
              )}

              {property.bathrooms != null && (
                <div className="property-feature">
                  <Bath size={22} />
                  <div>
                    <strong>{property.bathrooms}</strong>
                    <span>{t("propertyDetails.bathrooms")}</span>
                  </div>
                </div>
              )}

              {property.area_sqm != null && (
                <div className="property-feature">
                  <Ruler size={22} />
                  <div>
                    <strong>{property.area_sqm}</strong>
                    <span>{t("propertyDetails.area")}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="property-description">
              <h2>{t("propertyDetails.aboutProperty")}</h2>
              <p>
                {property.description ||
                  t("propertyDetails.noDescription")}
              </p>
            </div>

            <div className="property-contact-actions">
              <button
                type="button"
                className="property-inquiry-button"
                onClick={openInquiryForm}
              >
                <MessageCircle size={20} />
                {t("propertyDetails.contactOwnerAgent")}
              </button>

              <button
                type="button"
                className="property-whatsapp-button"
                onClick={() => {
                  const message = encodeURIComponent(
                    t("propertyDetails.whatsappMessage", {
                      title: property.title,
                      id: property.id,
                    })
                  );

                  window.open(
                    `https://wa.me/?text=${message}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
              >
                <Phone size={20} />
                {t("propertyDetails.whatsapp")}
              </button>
            </div>
          </div>

          {showInquiryForm && (
            <div className="property-inquiry-card">
              <div className="property-inquiry-header">
                <div>
                  <p>{t("propertyDetails.interested")}</p>
                  <h2>{t("propertyDetails.sendInquiry")}</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInquiryForm(false)}
                  aria-label={t("propertyDetails.closeInquiryForm")}
                >
                  ×
                </button>
              </div>

              {inquirySuccess ? (
                <div className="property-inquiry-success">
                  <CheckCircle size={45} />
                  <h3>{t("propertyDetails.inquirySent")}</h3>
                  <p>
                    {t("propertyDetails.inquirySentDescription")}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/customer/inquiries")}
                  >
                    {t("propertyDetails.viewMyInquiries")}
                  </button>
                </div>
              ) : (
                <form
                  className="property-inquiry-form"
                  onSubmit={submitInquiry}
                >
                  <label>
                    {t("propertyDetails.yourName")}
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder={t("propertyDetails.namePlaceholder")}
                      required
                    />
                  </label>

                  <label>
                    {t("propertyDetails.phoneNumber")}
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder={t("propertyDetails.phonePlaceholder")}
                      required
                    />
                  </label>

                  <label>
                    {t("propertyDetails.email")}
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder={t("propertyDetails.emailPlaceholder")}
                    />
                  </label>

                  <label>
                    {t("propertyDetails.message")}
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleFormChange}
                      placeholder={t("propertyDetails.messagePlaceholder")}
                      rows="5"
                      required
                    />
                  </label>

                  <button type="submit" disabled={inquiryLoading}>
                    {inquiryLoading ? (
                      <>
                        <Loader2 size={18} className="button-spinner" />
                        {t("propertyDetails.sending")}
                      </>
                    ) : (
                      <>
                        <MessageCircle size={18} />
                        {t("propertyDetails.sendInquiry")}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PropertyDetails;
