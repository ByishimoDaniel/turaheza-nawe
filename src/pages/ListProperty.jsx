
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import {
  Upload,
  X,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
} from "lucide-react";

function ListProperty() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "house",
    listing_type: "rent",
    price_rwf: "",
    bedrooms: "",
    bathrooms: "",
    area_sqm: "",
    furnished: false,
    parking_available: false,
    electricity_available: true,
    water_available: true,
    country: "Rwanda",
    province: "",
    district: "Rubavu",
    sector: "",
    cell: "",
    village: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!currentUser) {
          navigate("/login");
          return;
        }

        if (!active) return;
        setUser(currentUser);

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (profileError) throw profileError;
        if (!active) return;

        setOwnerName(
          profile?.full_name?.trim() ||
            profile?.email ||
            currentUser.email ||
            t("listProperty.owner")
        );
      } catch (err) {
        console.error("Error loading owner:", err);
        if (active) {
          setError(
            `${t("listProperty.loadAccountError")} ${err.message || ""}`
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [navigate, t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    setError("");
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (selectedImages.length + files.length > 10) {
      setError(t("listProperty.maxPhotosError"));
      e.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setError(t("listProperty.imageTypeError"));
      e.target.value = "";
      return;
    }

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setError(t("listProperty.imageSizeError"));
      e.target.value = "";
      return;
    }

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => {
      const image = prev[index];

      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [selectedImages]);

  const uploadPropertyImage = async (file, propertyId, index) => {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeExtension = [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ].includes(extension)
      ? extension
      : "jpg";

    const fileName = `${Date.now()}-${index}-${Math.random()
      .toString(36)
      .substring(2, 10)}.${safeExtension}`;

    const filePath = `${propertyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw new Error(
        `${t("listProperty.photoUploadFailed")} ${index + 1}: ${uploadError.message}`
      );
    }

    const { data } = supabase.storage
      .from("property-images")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(
        `${t("listProperty.photoUrlError")} ${index + 1}.`
      );
    }

    return {
      image_url: data.publicUrl,
      file_path: filePath,
    };
  };

  const deleteUploadedImages = async (filePaths) => {
    if (!filePaths.length) return;

    const { error: cleanupError } = await supabase.storage
      .from("property-images")
      .remove(filePaths);

    if (cleanupError) {
      console.error("Photo cleanup failed:", cleanupError);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (submitting) return;

    if (!user) {
      setError(t("listProperty.loginRequired"));
      return;
    }

    if (!formData.title.trim()) {
      setError(t("listProperty.titleRequired"));
      return;
    }

    if (!formData.description.trim()) {
      setError(t("listProperty.descriptionRequired"));
      return;
    }

    if (!formData.price_rwf || Number(formData.price_rwf) <= 0) {
      setError(t("listProperty.priceRequired"));
      return;
    }

    if (!formData.country.trim() || !formData.district.trim()) {
      setError(t("listProperty.locationRequired"));
      return;
    }

    if (selectedImages.length === 0) {
      setError(t("listProperty.photoRequired"));
      return;
    }

    setSubmitting(true);

    let createdLocationId = null;
    let createdPropertyId = null;
    let uploadedFilePaths = [];

    try {
      const locationData = {
        country: formData.country.trim(),
        province: formData.province.trim() || null,
        district: formData.district.trim(),
        sector: formData.sector.trim() || null,
        cell: formData.cell.trim() || null,
        village: formData.village.trim() || null,
        address: formData.address.trim() || null,
        latitude: formData.latitude
          ? Number(formData.latitude)
          : null,
        longitude: formData.longitude
          ? Number(formData.longitude)
          : null,
      };

      const { data: location, error: locationError } =
        await supabase
          .from("locations")
          .insert(locationData)
          .select("id")
          .single();

      if (locationError) {
        throw new Error(
          `${t("listProperty.locationCreateError")} ${locationError.message}`
        );
      }

      createdLocationId = location.id;

      const propertyData = {
        owner_id: user.id,
        agent_id: null,
        location_id: location.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price_rwf: Number(formData.price_rwf),
        bedrooms: formData.bedrooms
          ? Number(formData.bedrooms)
          : null,
        bathrooms: formData.bathrooms
          ? Number(formData.bathrooms)
          : null,
        area_sqm: formData.area_sqm
          ? Number(formData.area_sqm)
          : null,
        furnished: formData.furnished,
        parking_available: formData.parking_available,
        electricity_available: formData.electricity_available,
        water_available: formData.water_available,
        status: "pending",
      };

      const { data: property, error: propertyError } =
        await supabase
          .from("properties")
          .insert(propertyData)
          .select("id, owner_id, status")
          .single();

      if (propertyError) {
        throw new Error(
          `${t("listProperty.propertySaveError")} ${propertyError.message}`
        );
      }

      createdPropertyId = property.id;

      console.log("Property record created:", {
        id: property.id,
        owner_id: property.owner_id,
        status: property.status,
      });

      const uploadedImages = [];

      for (let index = 0; index < selectedImages.length; index++) {
        const uploaded = await uploadPropertyImage(
          selectedImages[index].file,
          property.id,
          index
        );

        uploadedFilePaths.push(uploaded.file_path);

        uploadedImages.push({
          property_id: property.id,
          image_url: uploaded.image_url,
          is_primary: index === 0,
          display_order: index,
        });
      }

      const { error: imagesError } = await supabase
        .from("property_images")
        .insert(uploadedImages);

      if (imagesError) {
        throw new Error(
          `${t("listProperty.photoSaveError")} ${imagesError.message}`
        );
      }

      setSuccess(t("listProperty.submitSuccess"));

      selectedImages.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });

      setSelectedImages([]);

      setTimeout(() => {
        navigate(`/owner/properties/${property.id}`);
      }, 1500);
    } catch (submitError) {
      console.error("PROPERTY SUBMISSION FAILED:", {
        message: submitError.message,
        code: submitError.code,
        details: submitError.details,
        hint: submitError.hint,
        propertyId: createdPropertyId,
        locationId: createdLocationId,
      });

      if (uploadedFilePaths.length > 0) {
        await deleteUploadedImages(uploadedFilePaths);
      }

      if (!createdPropertyId && createdLocationId) {
        const { error: locationCleanupError } = await supabase
          .from("locations")
          .delete()
          .eq("id", createdLocationId);

        if (locationCleanupError) {
          console.error(
            "Location cleanup failed:",
            locationCleanupError
          );
        }
      }

      if (createdPropertyId) {
        setError(
          `${t("listProperty.partialSubmitError")} (ID: ${createdPropertyId}). ` +
          `${submitError.message}. ${t("listProperty.checkMyProperties")}`
        );
      } else {
        setError(
          `${t("listProperty.submitError")} ${
            submitError.message || t("listProperty.unknownError")
          }`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-page-loading">
        <Loader2 className="spin" size={30} />
        <p>{t("listProperty.loading")}</p>
      </div>
    );
  }

  const locationFields = [
    ["country", "countryRequired", "Rwanda", true],
    ["province", "province", "Western Province", false],
    ["district", "districtRequired", "Rubavu", true],
    ["sector", "sector", "Gisenyi", false],
    ["cell", "cell", "", false],
    ["village", "village", "", false],
    ["address", "address", "Near Gisenyi Market", false],
    ["latitude", "latitude", "-1.7028", false],
    ["longitude", "longitude", "29.2564", false],
  ];

  const featureFields = [
    ["furnished", "furnished"],
    ["parking_available", "parkingAvailable"],
    ["electricity_available", "electricityAvailable"],
    ["water_available", "waterAvailable"],
  ];

  const propertyTypes = [
    ["house", "house"],
    ["apartment", "apartment"],
    ["room", "room"],
    ["villa", "villa"],
    ["land", "land"],
    ["shop", "shop"],
    ["office", "office"],
    ["commercial", "commercial"],
  ];

  return (
    <div className="owner-page">
      <div className="owner-main-content">
        <div className="owner-form-page">
          <div className="owner-page-header">
            <div>
              <button
                type="button"
                className="owner-back-button"
                onClick={() => navigate("/owner/properties")}
              >
                <ArrowLeft size={18} />
                {t("listProperty.backToProperties")}
              </button>

              <h1>{t("listProperty.pageTitle")}</h1>

              <p>
                {t("listProperty.welcome")},{" "}
                <strong>{ownerName || t("listProperty.owner")}</strong>.
                {" "}{t("listProperty.welcomeDescription")}
              </p>
            </div>
          </div>

          {error && (
            <div
              className="owner-form-alert owner-form-alert-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="owner-form-alert owner-form-alert-success"
              role="status"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="owner-property-form">
            <section className="owner-form-section">
              <div className="owner-form-section-header">
                <h2>{t("listProperty.propertyInformation")}</h2>
                <p>{t("listProperty.propertyInformationDescription")}</p>
              </div>

              <div className="owner-form-grid">
                <div className="owner-form-group owner-form-full">
                  <label htmlFor="title">
                    {t("listProperty.propertyTitle")} *
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={t("listProperty.titlePlaceholder")}
                    required
                  />
                </div>

                <div className="owner-form-group owner-form-full">
                  <label htmlFor="description">
                    {t("listProperty.description")} *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t("listProperty.descriptionPlaceholder")}
                    rows="6"
                    required
                  />
                </div>

                <div className="owner-form-group">
                  <label htmlFor="property_type">
                    {t("listProperty.propertyType")} *
                  </label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    required
                  >
                    {propertyTypes.map(([value, key]) => (
                      <option key={value} value={value}>
                        {t(`listProperty.types.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="owner-form-group">
                  <label htmlFor="listing_type">
                    {t("listProperty.listingType")} *
                  </label>
                  <select
                    id="listing_type"
                    name="listing_type"
                    value={formData.listing_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="rent">{t("listProperty.forRent")}</option>
                    <option value="sale">{t("listProperty.forSale")}</option>
                  </select>
                </div>

                <div className="owner-form-group">
                  <label htmlFor="price_rwf">
                    {t("listProperty.price")} (RWF) *
                  </label>
                  <input
                    id="price_rwf"
                    name="price_rwf"
                    type="number"
                    min="1"
                    value={formData.price_rwf}
                    onChange={handleChange}
                    placeholder="200000"
                    required
                  />
                </div>

                <div className="owner-form-group">
                  <label htmlFor="area_sqm">{t("listProperty.area")} (m²)</label>
                  <input
                    id="area_sqm"
                    name="area_sqm"
                    type="number"
                    min="0"
                    value={formData.area_sqm}
                    onChange={handleChange}
                    placeholder="150"
                  />
                </div>

                <div className="owner-form-group">
                  <label htmlFor="bedrooms">{t("listProperty.bedrooms")}</label>
                  <input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    placeholder="3"
                  />
                </div>

                <div className="owner-form-group">
                  <label htmlFor="bathrooms">{t("listProperty.bathrooms")}</label>
                  <input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    placeholder="2"
                  />
                </div>
              </div>
            </section>

            <section className="owner-form-section">
              <div className="owner-form-section-header">
                <h2>{t("listProperty.features")}</h2>
                <p>{t("listProperty.featuresDescription")}</p>
              </div>

              <div className="owner-checkbox-grid">
                {featureFields.map(([name, key]) => (
                  <label className="owner-checkbox-item" key={name}>
                    <input
                      type="checkbox"
                      name={name}
                      checked={formData[name]}
                      onChange={handleChange}
                    />
                    <span>{t(`listProperty.${key}`)}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="owner-form-section">
              <div className="owner-form-section-header">
                <h2>{t("listProperty.propertyPhotos")}</h2>
                <p>{t("listProperty.photosDescription")}</p>
              </div>

              <div className="owner-photo-upload">
                <label
                  htmlFor="property-images"
                  className="owner-photo-upload-box"
                >
                  <Upload size={32} />
                  <strong>{t("listProperty.uploadPhotos")}</strong>
                  <span>{t("listProperty.imageRequirements")}</span>
                  <span>
                    {t("listProperty.photosSelected", {
                      count: selectedImages.length,
                    })}
                  </span>
                </label>

                <input
                  id="property-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  disabled={submitting || selectedImages.length >= 10}
                  hidden
                />
              </div>

              {selectedImages.length > 0 && (
                <div className="owner-photo-preview-grid">
                  {selectedImages.map((image, index) => (
                    <div
                      className="owner-photo-preview"
                      key={`${image.file.name}-${index}`}
                    >
                      <img
                        src={image.preview}
                        alt={`${t("listProperty.photoPreview")} ${index + 1}`}
                      />

                      {index === 0 && (
                        <span className="owner-photo-primary">
                          {t("listProperty.primaryPhoto")}
                        </span>
                      )}

                      <button
                        type="button"
                        className="owner-photo-remove"
                        onClick={() => removeImage(index)}
                        disabled={submitting}
                        aria-label={`${t("listProperty.removePhoto")} ${index + 1}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedImages.length === 0 && (
                <div className="owner-photo-empty">
                  <ImageIcon size={24} />
                  <span>{t("listProperty.noPhotosSelected")}</span>
                </div>
              )}
            </section>

            <section className="owner-form-section">
              <div className="owner-form-section-header">
                <h2>{t("listProperty.propertyLocation")}</h2>
                <p>{t("listProperty.locationDescription")}</p>
              </div>

              <div className="owner-form-grid">
                {locationFields.map(([name, key, placeholder, required]) => (
                  <div
                    className={`owner-form-group ${
                      name === "address" ? "owner-form-full" : ""
                    }`}
                    key={name}
                  >
                    <label htmlFor={name}>
                      {t(`listProperty.locationFields.${key}`)}
                      {required ? " *" : ""}
                    </label>
                    <input
                      id={name}
                      name={name}
                      type={
                        name === "latitude" || name === "longitude"
                          ? "number"
                          : "text"
                      }
                      step={
                        name === "latitude" || name === "longitude"
                          ? "any"
                          : undefined
                      }
                      value={formData[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      required={required}
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="owner-form-notice">
              <strong>{t("listProperty.important")}</strong>
              <span>
                {t("listProperty.pendingNotice")}{" "}
                <strong>{t("listProperty.pending")}</strong>.{" "}
                {t("listProperty.pendingNoticeEnd")}
              </span>
            </div>

            <div className="owner-form-actions">
              <button
                type="button"
                className="owner-secondary-button"
                onClick={() => navigate("/owner/properties")}
                disabled={submitting}
              >
                {t("listProperty.cancel")}
              </button>

              <button
                type="submit"
                className="owner-primary-button"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="spin" size={18} />
                    {t("listProperty.uploadingProperty")}
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    {t("listProperty.submitProperty")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ListProperty;
