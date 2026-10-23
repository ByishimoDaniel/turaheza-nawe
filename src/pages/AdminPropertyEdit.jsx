import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";

function AdminPropertyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [property, setProperty] = useState(null);
  const [locationId, setLocationId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "",
    listing_type: "",
    price_rwf: "",
    bedrooms: "",
    bathrooms: "",
    area_sqm: "",
    status: "",
    rejection_reason: "",
  });

  const [facilities, setFacilities] = useState({
    parking_available: false,
    furnished: false,
    electricity_available: false,
    water_available: false,
  });

  const [locationData, setLocationData] = useState({
    country: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  // Property images
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageActionLoading, setImageActionLoading] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  async function loadProperty() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: propertyData, error: propertyError } =
        await supabase
          .from("properties")
          .select("*")
          .eq("id", id)
          .single();

      if (propertyError) {
        throw propertyError;
      }

      if (!propertyData) {
        throw new Error(t("adminPropertyEdit.errors.propertyNotFound"));
      }

      setProperty(propertyData);

      setFormData({
        title: propertyData.title || "",
        description: propertyData.description || "",
        property_type: propertyData.property_type || "",
        listing_type: propertyData.listing_type || "",
        price_rwf: propertyData.price_rwf ?? "",
        bedrooms: propertyData.bedrooms ?? "",
        bathrooms: propertyData.bathrooms ?? "",
        area_sqm: propertyData.area_sqm ?? "",
        status: propertyData.status || "",
        rejection_reason: propertyData.rejection_reason || "",
      });

      setFacilities({
        parking_available:
          propertyData.parking_available ?? false,
        furnished:
          propertyData.furnished ?? false,
        electricity_available:
          propertyData.electricity_available ?? false,
        water_available:
          propertyData.water_available ?? false,
      });

      if (propertyData.location_id) {
        const { data: location, error: locationError } =
          await supabase
            .from("locations")
            .select(
              "id, country, province, district, sector, cell, village, address, latitude, longitude"
            )
            .eq("id", propertyData.location_id)
            .single();

        if (locationError) {
          throw locationError;
        }

        if (location) {
          setLocationId(location.id);

          setLocationData({
            country: location.country || "",
            province: location.province || "",
            district: location.district || "",
            sector: location.sector || "",
            cell: location.cell || "",
            village: location.village || "",
            address: location.address || "",
            latitude: location.latitude ?? "",
            longitude: location.longitude ?? "",
          });
        }
      }

      await loadPropertyImages();
    } catch (err) {
      console.error("Unable to load property:", err);
      setError(
        err.message || t("adminPropertyEdit.errors.loadProperty")
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPropertyImages() {
    const { data, error: imagesError } = await supabase
      .from("property_images")
      .select("*")
      .eq("property_id", id)
      .order("display_order", {
        ascending: true,
      });

    if (imagesError) {
      console.error("Unable to load property images:", imagesError);
      return;
    }

    setImages(data || []);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleLocationChange(event) {
    const { name, value } = event.target;

    setLocationData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleFacilityChange(event) {
    const { name, checked } = event.target;

    setFacilities((previous) => ({
      ...previous,
      [name]: checked,
    }));
  }

  function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);

    setSelectedFiles(files);
  }

  async function handleImageUpload() {
    if (selectedFiles.length === 0) {
      setError(t("adminPropertyEdit.errors.selectImage"));
      return;
    }

    setUploadingImages(true);
    setError("");
    setSuccess("");

    try {
      const startingDisplayOrder =
        images.length > 0
          ? Math.max(
              ...images.map((image) =>
                Number(image.display_order || 0)
              )
            ) + 1
          : 0;

      const uploadedImages = [];

      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];

        if (!file.type.startsWith("image/")) {
          throw new Error(
            t("adminPropertyEdit.errors.invalidImage", {
              fileName: file.name,
            })
          );
        }

        const safeFileName = file.name
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, "-");

        const fileName = `${Date.now()}-${index}-${safeFileName}`;

        const filePath = `${id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("property-images")
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        uploadedImages.push({
          property_id: id,
          image_url: imageUrl,
          is_primary:
            images.length === 0 &&
            uploadedImages.length === 0,
          display_order:
            startingDisplayOrder + index,
        });
      }

      const { error: insertError } = await supabase
        .from("property_images")
        .insert(uploadedImages);

      if (insertError) {
        throw insertError;
      }

      setSelectedFiles([]);

      const fileInput =
        document.getElementById("property-image-upload");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadPropertyImages();

      setSuccess(
        t("adminPropertyEdit.success.imagesUploaded", {
          count: uploadedImages.length,
        })
      );
    } catch (err) {
      console.error("Unable to upload property images:", err);
      setError(
        err.message || t("adminPropertyEdit.errors.uploadImages")
      );
    } finally {
      setUploadingImages(false);
    }
  }

  function getStoragePathFromUrl(imageUrl) {
    if (!imageUrl) {
      return null;
    }

    const marker = "/property-images/";

    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const path = imageUrl.substring(
      markerIndex + marker.length
    );

    return decodeURIComponent(path.split("?")[0]);
  }

  async function handleDeleteImage(image) {
    const confirmed = window.confirm(
      t("adminPropertyEdit.confirm.deleteImage")
    );

    if (!confirmed) {
      return;
    }

    setImageActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const storagePath = getStoragePathFromUrl(
        image.image_url
      );

      if (storagePath) {
        const { error: storageError } =
          await supabase.storage
            .from("property-images")
            .remove([storagePath]);

        if (storageError) {
          throw storageError;
        }
      }

      const { error: databaseError } = await supabase
        .from("property_images")
        .delete()
        .eq("id", image.id);

      if (databaseError) {
        throw databaseError;
      }

      await loadPropertyImages();

      setSuccess(t("adminPropertyEdit.success.imageDeleted"));
    } catch (err) {
      console.error("Unable to delete image:", err);
      setError(
        err.message || t("adminPropertyEdit.errors.deleteImage")
      );
    } finally {
      setImageActionLoading(false);
    }
  }

  async function handleSetPrimary(imageId) {
    setImageActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error: resetError } = await supabase
        .from("property_images")
        .update({
          is_primary: false,
        })
        .eq("property_id", id);

      if (resetError) {
        throw resetError;
      }

      const { error: primaryError } = await supabase
        .from("property_images")
        .update({
          is_primary: true,
        })
        .eq("id", imageId);

      if (primaryError) {
        throw primaryError;
      }

      await loadPropertyImages();

      setSuccess(t("adminPropertyEdit.success.primaryUpdated"));
    } catch (err) {
      console.error(
        "Unable to set primary image:",
        err
      );

      setError(
        err.message || t("adminPropertyEdit.errors.primaryImage")
      );
    } finally {
      setImageActionLoading(false);
    }
  }

  async function handleDisplayOrderChange(
    imageId,
    value
  ) {
    const newOrder = Number(value);

    if (Number.isNaN(newOrder)) {
      return;
    }

    try {
      const { error: orderError } = await supabase
        .from("property_images")
        .update({
          display_order: newOrder,
        })
        .eq("id", imageId);

      if (orderError) {
        throw orderError;
      }

      await loadPropertyImages();

      setSuccess(t("adminPropertyEdit.success.imageOrderUpdated"));
    } catch (err) {
      console.error(
        "Unable to update image order:",
        err
      );

      setError(
        err.message || t("adminPropertyEdit.errors.imageOrder")
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const propertyUpdates = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        property_type: formData.property_type,
        listing_type: formData.listing_type,

        price_rwf:
          formData.price_rwf === ""
            ? null
            : Number(formData.price_rwf),

        bedrooms:
          formData.bedrooms === ""
            ? null
            : Number(formData.bedrooms),

        bathrooms:
          formData.bathrooms === ""
            ? null
            : Number(formData.bathrooms),

        area_sqm:
          formData.area_sqm === ""
            ? null
            : Number(formData.area_sqm),

        status: formData.status,

        rejection_reason:
          formData.rejection_reason.trim() || null,

        parking_available:
          facilities.parking_available,

        furnished:
          facilities.furnished,

        electricity_available:
          facilities.electricity_available,

        water_available:
          facilities.water_available,
      };

      const { error: propertyError } = await supabase
        .from("properties")
        .update(propertyUpdates)
        .eq("id", id);

      if (propertyError) {
        throw propertyError;
      }

      if (locationId) {
        const locationUpdates = {
          country: locationData.country.trim(),
          province: locationData.province.trim(),
          district: locationData.district.trim(),
          sector: locationData.sector.trim(),
          cell: locationData.cell.trim(),
          village: locationData.village.trim(),
          address: locationData.address.trim(),

          latitude:
            locationData.latitude === ""
              ? null
              : Number(locationData.latitude),

          longitude:
            locationData.longitude === ""
              ? null
              : Number(locationData.longitude),
        };

        const { error: locationError } = await supabase
          .from("locations")
          .update(locationUpdates)
          .eq("id", locationId);

        if (locationError) {
          throw locationError;
        }
      }

      setSuccess(t("adminPropertyEdit.success.propertyUpdated"));

      await loadProperty();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Unable to save property:", err);
      setError(
        err.message || t("adminPropertyEdit.errors.saveProperty")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-property-edit-loading">
        <div className="admin-property-edit-container">
          <p>{t("adminPropertyEdit.loading")}</p>
        </div>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="admin-property-edit-not-found">
        <div className="admin-property-edit-container">
          <h2>{t("adminPropertyEdit.errors.unableToLoadTitle")}</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/admin/properties")}
            className="edit-cancel-button"
          >
            {t("adminPropertyEdit.backToProperties")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-property-edit-page">
      <div className="admin-property-edit-container">

        <div className="admin-property-edit-header">
          <button
            type="button"
            onClick={() => navigate("/admin/properties")}
            className="details-back-button"
          >
            ← {t("adminPropertyEdit.backToProperties")}
          </button>

          <div>
            <h1>{t("adminPropertyEdit.title")}</h1>
            <p>
              {t("adminPropertyEdit.description")}
            </p>
          </div>
        </div>

        {success && (
          <div className="edit-success-message">
            {success}
          </div>
        )}

        {error && (
          <div className="edit-error-message">
            {error}
          </div>
        )}

        {/* =========================
            PROPERTY IMAGES
        ========================== */}

        <section className="edit-form-section">
          <div className="edit-form-section-header">
            <h2>{t("adminPropertyEdit.images.title")}</h2>
            <p>
              {t("adminPropertyEdit.images.description")}
            </p>
          </div>

          <div
            style={{
              padding: "20px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              background: "#fafafa",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <input
                id="property-image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelection}
              />

              <button
                type="button"
                className="edit-save-button"
                onClick={handleImageUpload}
                disabled={
                  uploadingImages ||
                  selectedFiles.length === 0
                }
              >
                {uploadingImages
                  ? t("uploading")
                  : t("uploadImages")}
              </button>
            </div>

            {selectedFiles.length > 0 && (
              <p
                style={{
                  marginTop: "12px",
                  marginBottom: 0,
                }}
              >
                {t("adminPropertyEdit.images.selected", {
                  count: selectedFiles.length,
                })}
              </p>
            )}
          </div>

          {images.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                border: "1px dashed #d1d5db",
                borderRadius: "12px",
              }}
            >
              <p style={{ margin: 0 }}>
                {t("adminPropertyEdit.images.empty")}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "20px",
              }}
            >
              {images.map((image) => (
                <div
                  key={image.id}
                  style={{
                    border: image.is_primary
                      ? "2px solid #111827"
                      : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "4 / 3",
                      background: "#f3f4f6",
                    }}
                  >
                    <img
                      src={image.image_url}
                      alt={formData.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    {image.is_primary && (
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          background: "#111827",
                          color: "#ffffff",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        ★ {t("adminPropertyEdit.images.primary")}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      padding: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <label
                        htmlFor={`order-${image.id}`}
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {t("adminPropertyEdit.images.displayOrder")}
                      </label>

                      <input
                        id={`order-${image.id}`}
                        type="number"
                        min="0"
                        value={image.display_order ?? 0}
                        onChange={(event) =>
                          handleDisplayOrderChange(
                            image.id,
                            event.target.value
                          )
                        }
                        style={{
                          width: "70px",
                          padding: "7px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {!image.is_primary && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSetPrimary(image.id)
                          }
                          disabled={imageActionLoading}
                          style={{
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "7px",
                            background: "#ffffff",
                            cursor: "pointer",
                          }}
                        >
                          ★ {t("adminPropertyEdit.images.setPrimary")}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteImage(image)
                        }
                        disabled={imageActionLoading}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #dc2626",
                          borderRadius: "7px",
                          background: "#ffffff",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        {t("adminPropertyEdit.images.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <form
          onSubmit={handleSubmit}
          className="admin-property-edit-form"
        >

          <section className="edit-form-section">
            <div className="edit-form-section-header">
              <h2>{t("adminPropertyEdit.information.title")}</h2>
              <p>
                {t("adminPropertyEdit.information.description")}
              </p>
            </div>

            <div className="edit-form-grid">

              <div className="edit-form-group full-width">
                <label htmlFor="title">
                  {t("adminPropertyEdit.fields.propertyTitle")}
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t("adminPropertyEdit.placeholders.propertyTitle")}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="property_type">
                  {t("adminPropertyEdit.fields.propertyType")}
                </label>

                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                >
                  <option value="">
                    {t("adminPropertyEdit.options.selectPropertyType")}
                  </option>

                  <option value="house">
                    {t("adminPropertyEdit.propertyTypes.house")}
                  </option>

                  <option value="apartment">
                    {t("adminPropertyEdit.propertyTypes.apartment")}
                  </option>

                  <option value="room">
                    {t("adminPropertyEdit.propertyTypes.room")}
                  </option>

                  <option value="villa">
                    {t("adminPropertyEdit.propertyTypes.villa")}
                  </option>

                  <option value="land">
                    {t("adminPropertyEdit.propertyTypes.land")}
                  </option>

                  <option value="shop">
                    {t("adminPropertyEdit.propertyTypes.shop")}
                  </option>

                  <option value="office">
                    {t("adminPropertyEdit.propertyTypes.office")}
                  </option>

                  <option value="commercial">
                    {t("adminPropertyEdit.propertyTypes.commercial")}
                  </option>
                </select>
              </div>

              <div className="edit-form-group">
                <label htmlFor="listing_type">
                  {t("adminPropertyEdit.fields.listingType")}
                </label>

                <select
                  id="listing_type"
                  name="listing_type"
                  value={formData.listing_type}
                  onChange={handleChange}
                >
                  <option value="">
                    {t("adminPropertyEdit.options.selectListingType")}
                  </option>

                  <option value="rent">
                    {t("adminPropertyEdit.listingTypes.rent")}
                  </option>

                  <option value="sale">
                    {t("adminPropertyEdit.listingTypes.sale")}
                  </option>
                </select>
              </div>

              <div className="edit-form-group">
                <label htmlFor="price_rwf">
                  {t("adminPropertyEdit.fields.price")}
                </label>

                <input
                  id="price_rwf"
                  name="price_rwf"
                  type="number"
                  min="0"
                  value={formData.price_rwf}
                  onChange={handleChange}
                  placeholder="450000"
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="bedrooms">
                  {t("adminPropertyEdit.fields.bedrooms")}
                </label>

                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="bathrooms">
                  {t("adminPropertyEdit.fields.bathrooms")}
                </label>

                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="area_sqm">
                  {t("adminPropertyEdit.fields.area")}
                </label>

                <input
                  id="area_sqm"
                  name="area_sqm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.area_sqm}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="status">
                  {t("adminPropertyEdit.fields.status")}
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="draft">
                    {t("adminPropertyEdit.statuses.draft")}
                  </option>

                  <option value="pending">
                    {t("adminPropertyEdit.statuses.pending")}
                  </option>

                  <option value="approved">
                    {t("adminPropertyEdit.statuses.approved")}
                  </option>

                  <option value="rejected">
                    {t("adminPropertyEdit.statuses.rejected")}
                  </option>

                  <option value="suspended">
                    {t("adminPropertyEdit.statuses.suspended")}
                  </option>

                  <option value="sold">
                    {t("adminPropertyEdit.statuses.sold")}
                  </option>

                  <option value="rented">
                    {t("adminPropertyEdit.statuses.rented")}
                  </option>
                </select>
              </div>

              <div className="edit-form-group full-width">
                <label htmlFor="description">
                  {t("adminPropertyEdit.fields.description")}
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows="6"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t("adminPropertyEdit.placeholders.description")}
                />
              </div>

              <div className="edit-form-group full-width">
                <label htmlFor="rejection_reason">
                  {t("adminPropertyEdit.fields.rejectionReason")}
                </label>

                <textarea
                  id="rejection_reason"
                  name="rejection_reason"
                  rows="4"
                  value={formData.rejection_reason}
                  onChange={handleChange}
                  placeholder={t("adminPropertyEdit.placeholders.rejectionReason")}
                />
              </div>

            </div>
          </section>

          <section className="edit-form-section">
            <div className="edit-form-section-header">
              <h2>{t("adminPropertyEdit.facilities.title")}</h2>
              <p>
                {t("adminPropertyEdit.facilities.description")}
              </p>
            </div>

            <div className="edit-checkbox-grid">

              <label className="edit-checkbox-item">
                <input
                  type="checkbox"
                  name="parking_available"
                  checked={facilities.parking_available}
                  onChange={handleFacilityChange}
                />

                <span>
                  {t("adminPropertyEdit.facilities.parking")}
                </span>
              </label>

              <label className="edit-checkbox-item">
                <input
                  type="checkbox"
                  name="furnished"
                  checked={facilities.furnished}
                  onChange={handleFacilityChange}
                />

                <span>
                  {t("adminPropertyEdit.facilities.furnished")}
                </span>
              </label>

              <label className="edit-checkbox-item">
                <input
                  type="checkbox"
                  name="electricity_available"
                  checked={facilities.electricity_available}
                  onChange={handleFacilityChange}
                />

                <span>
                  {t("adminPropertyEdit.facilities.electricity")}
                </span>
              </label>

              <label className="edit-checkbox-item">
                <input
                  type="checkbox"
                  name="water_available"
                  checked={facilities.water_available}
                  onChange={handleFacilityChange}
                />

                <span>
                  {t("adminPropertyEdit.facilities.water")}
                </span>
              </label>

            </div>
          </section>

          <section className="edit-form-section">

            <div className="edit-form-section-header">
              <h2>{t("adminPropertyEdit.location.title")}</h2>
              <p>
                {t("adminPropertyEdit.location.description")}
              </p>
            </div>

            <div className="edit-form-grid">

              <div className="edit-form-group">
                <label htmlFor="country">
                  {t("adminPropertyEdit.location.country")}
                </label>

                <input
                  id="country"
                  name="country"
                  type="text"
                  value={locationData.country}
                  onChange={handleLocationChange}
                  placeholder={t("adminPropertyEdit.placeholders.country")}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="province">
                  {t("adminPropertyEdit.location.province")}
                </label>

                <input
                  id="province"
                  name="province"
                  type="text"
                  value={locationData.province}
                  onChange={handleLocationChange}
                  placeholder={t("adminPropertyEdit.placeholders.province")}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="district">
                  {t("adminPropertyEdit.location.district")}
                </label>

                <input
                  id="district"
                  name="district"
                  type="text"
                  value={locationData.district}
                  onChange={handleLocationChange}
                  placeholder={t("adminPropertyEdit.placeholders.district")}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="sector">
                  {t("adminPropertyEdit.location.sector")}
                </label>

                <input
                  id="sector"
                  name="sector"
                  type="text"
                  value={locationData.sector}
                  onChange={handleLocationChange}
                  placeholder={t("adminPropertyEdit.placeholders.sector")}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="cell">
                  {t("adminPropertyEdit.location.cell")}
                </label>

                <input
                  id="cell"
                  name="cell"
                  type="text"
                  value={locationData.cell}
                  onChange={handleLocationChange}
                  placeholder={t("adminPropertyEdit.placeholders.cell")}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="village">
                  {t("adminPropertyEdit.location.village")}
                </label>

                <input
                  id="village"
                  name="village"
                  type="text"
                  value={locationData.village}
                  onChange={handleLocationChange}
                  placeholder={t("adminPropertyEdit.placeholders.village")}
                />
              </div>

              <div className="edit-form-group full-width">
                <label htmlFor="address">
                  {t("adminPropertyEdit.location.address")}
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  value={locationData.address}
                  onChange={handleLocationChange}
                  placeholder={t("adminPropertyEdit.placeholders.address")}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="latitude">
                  {t("adminPropertyEdit.location.latitude")}
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={locationData.latitude}
                  onChange={handleLocationChange}
                  placeholder="-1.6959"
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="longitude">
                  {t("adminPropertyEdit.location.longitude")}
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={locationData.longitude}
                  onChange={handleLocationChange}
                  placeholder="29.2560"
                />
              </div>

            </div>
          </section>

          <div className="edit-form-actions">

            <button
              type="button"
              className="edit-cancel-button"
              onClick={() =>
                navigate(`/admin/properties/${id}`)
              }
              disabled={saving}
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              className="edit-save-button"
              disabled={saving}
            >
              {saving
                ? t("saving")
                : t("saveChanges")}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default AdminPropertyEdit;