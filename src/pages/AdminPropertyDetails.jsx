import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  User,
  CalendarDays,
  Tag,
  X,
  Maximize2,
  Home,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function AdminPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [location, setLocation] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  async function loadProperty() {
    setLoading(true);
    setErrorMessage("");

    try {
      // ---------------------------------------------
      // LOAD PROPERTY + PHOTOS
      // ---------------------------------------------

      const { data, error } = await supabase
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
        .single();

      if (error) {
        throw error;
      }

      // ---------------------------------------------
      // SORT PHOTOS
      // ---------------------------------------------

      const sortedImages = [...(data.property_images || [])].sort(
        (a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;

          return (
            (a.display_order ?? 0) -
            (b.display_order ?? 0)
          );
        }
      );

      const updatedProperty = {
        ...data,
        property_images: sortedImages,
      };

      setProperty(updatedProperty);
      setActiveImageIndex(0);

      // ---------------------------------------------
      // LOAD LOCATION
      // ---------------------------------------------

      if (data.location_id) {
        const {
          data: locationData,
          error: locationError,
        } = await supabase
          .from("locations")
          .select(`
            id,
            country,
            province,
            district,
            sector,
            cell,
            village,
            address,
            latitude,
            longitude
          `)
          .eq("id", data.location_id)
          .single();

        if (locationError) {
          console.error(
            "Location loading error:",
            locationError
          );
        } else {
          setLocation(locationData);
        }
      }

      // ---------------------------------------------
      // LOAD OWNER PROFILE
      // ---------------------------------------------

      if (data.owner_id) {
        const {
          data: ownerData,
          error: ownerError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            phone,
            role,
            profile_image_url,
            is_active
          `)
          .eq("id", data.owner_id)
          .single();

        if (ownerError) {
          console.error(
            "Owner profile loading error:",
            ownerError
          );
        } else {
          setOwnerProfile(ownerData);
        }
      }
    } catch (error) {
      console.error(
        "Property details error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load property details."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // APPROVE PROPERTY
  // --------------------------------------------------

  async function approveProperty() {
    if (!property) return;

    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase.rpc(
        "approve_property",
        {
          property_id: property.id,
        }
      );

      if (error) {
        throw error;
      }

      setProperty((current) => ({
        ...current,
        status: "approved",
      }));

      setSuccessMessage(
        "Property approved successfully. It can now appear on the public marketplace."
      );
    } catch (error) {
      console.error(
        "Property approval error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to approve this property."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // --------------------------------------------------
  // UPDATE STATUS
  // --------------------------------------------------

  async function updateStatus(newStatus) {
    if (!property) return;

    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updateData = {
        status: newStatus,
      };

      // Clear rejection reason when changing away
      // from rejected status.
      if (newStatus !== "rejected") {
        updateData.rejection_reason = null;
      }

      const { error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", property.id);

      if (error) {
        throw error;
      }

      setProperty((current) => ({
        ...current,
        status: newStatus,
        rejection_reason:
          newStatus === "rejected"
            ? current.rejection_reason
            : null,
      }));

      setSuccessMessage(
        `Property status changed to "${newStatus}".`
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to update property status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // --------------------------------------------------
  // STATUS CLASS
  // --------------------------------------------------

  function getStatusClass(status) {
    switch (status) {
      case "approved":
        return "details-status-approved";

      case "pending":
        return "details-status-pending";

      case "rejected":
        return "details-status-rejected";

      case "suspended":
        return "details-status-suspended";

      case "sold":
        return "details-status-sold";

      case "rented":
        return "details-status-rented";

      default:
        return "details-status-draft";
    }
  }

  // --------------------------------------------------
  // IMAGE FUNCTIONS
  // --------------------------------------------------

  function goToNextImage() {
    if (!images.length) return;

    setActiveImageIndex((current) =>
      current === images.length - 1
        ? 0
        : current + 1
    );
  }

  function goToPreviousImage() {
    if (!images.length) return;

    setActiveImageIndex((current) =>
      current === 0
        ? images.length - 1
        : current - 1
    );
  }

  function selectImage(index) {
    setActiveImageIndex(index);
  }

  function openLightbox() {
    if (images.length > 0) {
      setLightboxOpen(true);
    }
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  // --------------------------------------------------
  // KEYBOARD LIGHTBOX CONTROLS
  // --------------------------------------------------

  useEffect(() => {
    function handleKeyboard(event) {
      if (!lightboxOpen) return;

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight") {
        goToNextImage();
      }

      if (event.key === "ArrowLeft") {
        goToPreviousImage();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [lightboxOpen, property]);

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="admin-property-details-page">
        <div className="admin-property-loading">
          <RefreshCw
            size={34}
            className="admin-loading-icon"
          />

          <h2>Loading property...</h2>

          <p>
            Please wait while we load the property
            information.
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // PROPERTY NOT FOUND
  // --------------------------------------------------

  if (!property) {
    return (
      <main className="admin-property-details-page">
        <div className="admin-property-error">
          <Building2 size={45} />

          <h2>Property not found</h2>

          <p>
            We could not find this property.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/properties")
            }
          >
            <ArrowLeft size={17} />
            Back to Properties
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // IMAGE DATA
  // --------------------------------------------------

  const images =
    property.property_images || [];

  const activeImage =
    images[activeImageIndex] || null;

  const coverImage =
    activeImage?.image_url || "";

  // --------------------------------------------------
  // OWNER DISPLAY
  // --------------------------------------------------

  const ownerName =
    ownerProfile?.full_name?.trim() ||
    ownerProfile?.email ||
    "Owner information unavailable";

  const ownerPhone =
    ownerProfile?.phone ||
    "Phone not provided";

  const ownerEmail =
    ownerProfile?.email ||
    "Email not provided";

  return (
    <main className="admin-property-details-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <section className="admin-property-details-header">

        <button
          type="button"
          className="details-back-button"
          onClick={() =>
            navigate("/admin/properties")
          }
        >
          <ArrowLeft size={18} />
          Back to Properties
        </button>

        <div className="details-header-main">

          <div>
            <span className="section-label">
              TURAHEZA NAWE
            </span>

            <h1>
              {property.title ||
                "Untitled Property"}
            </h1>

            <div className="details-location">
              <MapPin size={17} />

              <span>
                {location?.district ||
                  "Location not specified"}

                {location?.sector
                  ? `, ${location.sector}`
                  : ""}
              </span>
            </div>
          </div>

          <span
            className={`details-status ${getStatusClass(
              property.status
            )}`}
          >
            {property.status || "draft"}
          </span>

        </div>

      </section>

      {/* ==========================================
          MESSAGES
      ========================================== */}

      <section className="admin-property-details-container">

        {successMessage && (
          <div className="details-success-message">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="details-error-message">
            {errorMessage}
          </div>
        )}

        {/* ========================================
            IMAGE GALLERY
        ======================================== */}

        <div className="details-gallery">

          {/* MAIN IMAGE */}

          <div className="details-cover-image">

            {coverImage ? (
              <>
                <img
                  src={coverImage}
                  alt={
                    property.title ||
                    "Property"
                  }
                  onClick={openLightbox}
                />

                {images.length > 0 && (
                  <div className="details-image-counter">
                    {activeImageIndex + 1} /{" "}
                    {images.length}
                  </div>
                )}

                {images.length > 0 && (
                  <button
                    type="button"
                    className="details-image-expand"
                    onClick={openLightbox}
                    aria-label="View image fullscreen"
                  >
                    <Maximize2 size={18} />
                  </button>
                )}

                {images.length > 1 && (
                  <button
                    type="button"
                    className="details-gallery-prev"
                    onClick={goToPreviousImage}
                    aria-label="Previous image"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}

                {images.length > 1 && (
                  <button
                    type="button"
                    className="details-gallery-next"
                    onClick={goToNextImage}
                    aria-label="Next image"
                  >
                    <ArrowRight size={20} />
                  </button>
                )}
              </>
            ) : (
              <div className="details-no-image">
                <Building2 size={55} />

                <span>
                  No property image
                </span>
              </div>
            )}

          </div>

          {/* THUMBNAILS */}

          {images.length > 0 && (
            <div className="details-image-thumbnails">

              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  className={`details-thumbnail ${
                    index === activeImageIndex
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectImage(index)
                  }
                >
                  <img
                    src={image.image_url}
                    alt={`Property ${index + 1}`}
                  />

                  {image.is_primary && (
                    <span className="details-primary-badge">
                      ★
                    </span>
                  )}
                </button>
              ))}

            </div>
          )}

        </div>

        {/* ========================================
            MAIN GRID
        ======================================== */}

        <div className="details-main-grid">

          {/* ======================================
              LEFT CONTENT
          ====================================== */}

          <div className="details-main-content">

            {/* PROPERTY INFORMATION */}

            <section className="details-card">

              <div className="details-card-header">
                <h2>
                  Property Information
                </h2>
              </div>

              <div className="details-info-grid">

                <div className="details-info-item">
                  <Tag size={19} />

                  <div>
                    <span>
                      Property Type
                    </span>

                    <strong>
                      {property.property_type ||
                        "Not specified"}
                    </strong>
                  </div>
                </div>

                <div className="details-info-item">
                  <Tag size={19} />

                  <div>
                    <span>
                      Listing Type
                    </span>

                    <strong>
                      {property.listing_type ||
                        "Not specified"}
                    </strong>
                  </div>
                </div>

                {property.bedrooms != null && (
                  <div className="details-info-item">
                    <BedDouble size={19} />

                    <div>
                      <span>
                        Bedrooms
                      </span>

                      <strong>
                        {property.bedrooms}
                      </strong>
                    </div>
                  </div>
                )}

                {property.bathrooms != null && (
                  <div className="details-info-item">
                    <Bath size={19} />

                    <div>
                      <span>
                        Bathrooms
                      </span>

                      <strong>
                        {property.bathrooms}
                      </strong>
                    </div>
                  </div>
                )}

                {property.area_sqm != null && (
                  <div className="details-info-item">
                    <Ruler size={19} />

                    <div>
                      <span>
                        Area
                      </span>

                      <strong>
                        {property.area_sqm} m²
                      </strong>
                    </div>
                  </div>
                )}

                <div className="details-info-item">
                  <Home size={19} />

                  <div>
                    <span>
                      Furnished
                    </span>

                    <strong>
                      {property.furnished
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>
                </div>

                <div className="details-info-item">
                  <Building2 size={19} />

                  <div>
                    <span>
                      Parking
                    </span>

                    <strong>
                      {property.parking_available
                        ? "Available"
                        : "Not available"}
                    </strong>
                  </div>
                </div>

              </div>

            </section>

            {/* DESCRIPTION */}

            <section className="details-card">

              <div className="details-card-header">
                <h2>
                  Description
                </h2>
              </div>

              <p className="details-description">
                {property.description ||
                  "No description has been provided for this property."}
              </p>

            </section>

            {/* LOCATION */}

            <section className="details-card">

              <div className="details-card-header">
                <h2>
                  Property Location
                </h2>
              </div>

              <div className="details-location-list">

                {location?.country && (
                  <div>
                    <span>
                      Country
                    </span>

                    <strong>
                      {location.country}
                    </strong>
                  </div>
                )}

                {location?.province && (
                  <div>
                    <span>
                      Province
                    </span>

                    <strong>
                      {location.province}
                    </strong>
                  </div>
                )}

                {location?.district && (
                  <div>
                    <span>
                      District
                    </span>

                    <strong>
                      {location.district}
                    </strong>
                  </div>
                )}

                {location?.sector && (
                  <div>
                    <span>
                      Sector
                    </span>

                    <strong>
                      {location.sector}
                    </strong>
                  </div>
                )}

                {location?.cell && (
                  <div>
                    <span>
                      Cell
                    </span>

                    <strong>
                      {location.cell}
                    </strong>
                  </div>
                )}

                {location?.village && (
                  <div>
                    <span>
                      Village
                    </span>

                    <strong>
                      {location.village}
                    </strong>
                  </div>
                )}

                {location?.address && (
                  <div>
                    <span>
                      Address
                    </span>

                    <strong>
                      {location.address}
                    </strong>
                  </div>
                )}

              </div>

              {(location?.latitude ||
                location?.longitude) && (
                <div className="details-coordinates">
                  <MapPin size={17} />

                  <span>
                    Coordinates:{" "}
                    {location.latitude || "—"},{" "}
                    {location.longitude || "—"}
                  </span>
                </div>
              )}

            </section>

          </div>

          {/* ======================================
              RIGHT SIDEBAR
          ====================================== */}

          <aside className="details-sidebar">

            {/* PRICE */}

            <div className="details-price-card">

              <span>
                {property.listing_type === "rent"
                  ? "Monthly Rent"
                  : "Sale Price"}
              </span>

              <strong>
                {property.price_rwf
                  ? `${Number(
                      property.price_rwf
                    ).toLocaleString()} RWF`
                  : "Price not set"}
              </strong>

            </div>

            {/* OWNER */}

            <div className="details-card">

              <div className="details-card-header">
                <h2>
                  Owner Information
                </h2>
              </div>

              <div className="details-meta-list">

                <div>
                  <User size={18} />

                  <div>
                    <span>
                      Name
                    </span>

                    <strong>
                      {ownerName}
                    </strong>
                  </div>
                </div>

                <div>
                  <Tag size={18} />

                  <div>
                    <span>
                      Role
                    </span>

                    <strong>
                      {ownerProfile?.role ||
                        "Owner"}
                    </strong>
                  </div>
                </div>

                <div>
                  <User size={18} />

                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {ownerPhone}
                    </strong>
                  </div>
                </div>

                <div>
                  <User size={18} />

                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {ownerEmail}
                    </strong>
                  </div>
                </div>

                <div>
                  <CalendarDays size={18} />

                  <div>
                    <span>
                      Listed
                    </span>

                    <strong>
                      {property.created_at
                        ? new Date(
                            property.created_at
                          ).toLocaleDateString()
                        : "Unknown"}
                    </strong>
                  </div>
                </div>

              </div>

            </div>

            {/* REJECTION REASON */}

            {property.rejection_reason && (
              <div className="details-card">

                <div className="details-card-header">
                  <h2>
                    Rejection Reason
                  </h2>
                </div>

                <p className="details-description">
                  {property.rejection_reason}
                </p>

              </div>
            )}

            {/* ACTIONS */}

            <div className="details-card">

              <div className="details-card-header">
                <h2>
                  Property Actions
                </h2>
              </div>

              <div className="details-actions">

                {/* APPROVE */}

                {property.status === "pending" && (
                  <button
                    type="button"
                    className="details-approve-button"
                    disabled={actionLoading}
                    onClick={approveProperty}
                  >
                    <CheckCircle2 size={18} />

                    {actionLoading
                      ? "Processing..."
                      : "Approve Property"}
                  </button>
                )}

                {/* REJECT */}

                {property.status !== "rejected" &&
                  property.status !== "suspended" && (
                    <button
                      type="button"
                      className="details-reject-button"
                      disabled={actionLoading}
                      onClick={() =>
                        updateStatus("rejected")
                      }
                    >
                      <XCircle size={18} />

                      {actionLoading
                        ? "Processing..."
                        : "Reject Property"}
                    </button>
                  )}

                {/* SUSPEND */}

                {property.status === "approved" && (
                  <button
                    type="button"
                    className="details-suspend-button"
                    disabled={actionLoading}
                    onClick={() =>
                      updateStatus("suspended")
                    }
                  >
                    <Ban size={18} />

                    {actionLoading
                      ? "Processing..."
                      : "Suspend Property"}
                  </button>
                )}

              </div>

            </div>

          </aside>

        </div>

      </section>

      {/* ==========================================
          LIGHTBOX
      ========================================== */}

      {lightboxOpen && activeImage && (
        <div
          className="details-lightbox"
          onClick={closeLightbox}
        >

          <button
            type="button"
            className="details-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close image viewer"
          >
            <X size={25} />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              className="details-lightbox-prev"
              onClick={(event) => {
                event.stopPropagation();
                goToPreviousImage();
              }}
              aria-label="Previous image"
            >
              <ArrowLeft size={28} />
            </button>
          )}

          <img
            src={activeImage.image_url}
            alt={
              property.title ||
              "Property"
            }
            className="details-lightbox-image"
            onClick={(event) =>
              event.stopPropagation()
            }
          />

          {images.length > 1 && (
            <button
              type="button"
              className="details-lightbox-next"
              onClick={(event) => {
                event.stopPropagation();
                goToNextImage();
              }}
              aria-label="Next image"
            >
              <ArrowRight size={28} />
            </button>
          )}

          <div className="details-lightbox-counter">
            {activeImageIndex + 1} /{" "}
            {images.length}
          </div>

        </div>
      )}

    </main>
  );
}

export default AdminPropertyDetails;