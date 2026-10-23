import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Building2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import OwnerSidebar from "../components/OwnerSidebar";

function OwnerPropertyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
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
    electricity_available: false,
    water_available: false,
  });

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error: propertyError } = await supabase
        .from("properties")
        .select(`
          id,
          owner_id,
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
          status
        `)
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (propertyError) throw propertyError;

      setForm({
        title: data.title || "",
        description: data.description || "",
        property_type: data.property_type || "house",
        listing_type: data.listing_type || "rent",
        price_rwf: data.price_rwf ?? "",
        bedrooms: data.bedrooms ?? "",
        bathrooms: data.bathrooms ?? "",
        area_sqm: data.area_sqm ?? "",
        furnished: data.furnished || false,
        parking_available: data.parking_available || false,
        electricity_available:
          data.electricity_available || false,
        water_available: data.water_available || false,
      });
    } catch (err) {
      console.error("Error loading property:", err);

      if (err.code === "PGRST116") {
        setError(
          "Property not found or you do not have permission to edit it."
        );
      } else {
        setError(
          err.message ||
            "Unable to load this property. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate("/login");
        return;
      }

      if (!form.title.trim()) {
        setError("Property title is required.");
        return;
      }

      if (!form.property_type) {
        setError("Please select a property type.");
        return;
      }

      if (!form.listing_type) {
        setError("Please select a listing type.");
        return;
      }

      if (
        form.price_rwf === "" ||
        Number(form.price_rwf) < 0
      ) {
        setError("Please enter a valid property price.");
        return;
      }

      const updateData = {
        title: form.title.trim(),
        description: form.description.trim(),
        property_type: form.property_type,
        listing_type: form.listing_type,
        price_rwf: Number(form.price_rwf),
        bedrooms:
          form.bedrooms === ""
            ? null
            : Number(form.bedrooms),
        bathrooms:
          form.bathrooms === ""
            ? null
            : Number(form.bathrooms),
        area_sqm:
          form.area_sqm === ""
            ? null
            : Number(form.area_sqm),
        furnished: form.furnished,
        parking_available: form.parking_available,
        electricity_available:
          form.electricity_available,
        water_available: form.water_available,
        updated_at: new Date().toISOString(),
      };

      /*
       * We intentionally do not change owner_id,
       * agent_id, location_id, approved_by or approved_at.
       *
       * The owner can edit the property information,
       * but cannot change ownership or approval information.
       */
      const { error: updateError } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id)
        .eq("owner_id", user.id);

      if (updateError) throw updateError;

      setSuccess("Property updated successfully.");

      setTimeout(() => {
        navigate(`/owner/properties/${id}`);
      }, 1200);
    } catch (err) {
      console.error("Error updating property:", err);

      setError(
        err.message ||
          "Unable to update the property. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="owner-layout">
        <OwnerSidebar />

        <main className="owner-page-content">
          <div className="owner-properties-loading">
            <div className="owner-properties-spinner"></div>
            <p>Loading property...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="owner-layout">
        <OwnerSidebar />

        <main className="owner-page-content">
          <div className="owner-property-detail-error">
            <AlertCircle size={40} />

            <h2>Unable to edit property</h2>

            <p>{error}</p>

            <button
              className="owner-primary-button"
              onClick={() => navigate("/owner/properties")}
            >
              <ArrowLeft size={18} />
              Back to My Properties
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="owner-layout">
      <OwnerSidebar />

      <main className="owner-page-content">
        <button
          className="owner-back-button"
          onClick={() =>
            navigate(`/owner/properties/${id}`)
          }
        >
          <ArrowLeft size={18} />
          Back to Property
        </button>

        <div className="owner-page-header">
          <p className="owner-page-eyebrow">
            EDIT PROPERTY
          </p>

          <h1>Edit Property</h1>

          <p>
            Update the information of your property below.
          </p>
        </div>

        {error && (
          <div className="owner-form-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="owner-form-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form
          className="owner-property-form"
          onSubmit={handleSubmit}
        >
          <section className="owner-form-section">
            <div className="owner-form-section-header">
              <div className="owner-form-section-icon">
                <Building2 size={20} />
              </div>

              <div>
                <h2>Basic Information</h2>
                <p>
                  Provide the main information about your
                  property.
                </p>
              </div>
            </div>

            <div className="owner-form-grid">
              <div className="owner-form-group owner-form-full">
                <label htmlFor="title">
                  Property Title *
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Example: Modern 3 Bedroom House in Gisenyi"
                  required
                />
              </div>

              <div className="owner-form-group">
                <label htmlFor="property_type">
                  Property Type *
                </label>

                <select
                  id="property_type"
                  name="property_type"
                  value={form.property_type}
                  onChange={handleChange}
                  required
                >
                  <option value="house">House</option>
                  <option value="apartment">
                    Apartment
                  </option>
                  <option value="room">Room</option>
                  <option value="villa">Villa</option>
                  <option value="land">Land</option>
                  <option value="shop">Shop</option>
                  <option value="office">Office</option>
                  <option value="commercial">
                    Commercial Property
                  </option>
                </select>
              </div>

              <div className="owner-form-group">
                <label htmlFor="listing_type">
                  Listing Type *
                </label>

                <select
                  id="listing_type"
                  name="listing_type"
                  value={form.listing_type}
                  onChange={handleChange}
                  required
                >
                  <option value="rent">For Rent</option>
                  <option value="sale">For Sale</option>
                </select>
              </div>

              <div className="owner-form-group">
                <label htmlFor="price_rwf">
                  Price (RWF) *
                </label>

                <input
                  id="price_rwf"
                  name="price_rwf"
                  type="number"
                  min="0"
                  value={form.price_rwf}
                  onChange={handleChange}
                  placeholder="200000"
                  required
                />
              </div>

              <div className="owner-form-group">
                <label htmlFor="area_sqm">
                  Area (m²)
                </label>

                <input
                  id="area_sqm"
                  name="area_sqm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.area_sqm}
                  onChange={handleChange}
                  placeholder="150"
                />
              </div>
            </div>
          </section>

          <section className="owner-form-section">
            <div className="owner-form-section-header">
              <div className="owner-form-section-icon">
                <Building2 size={20} />
              </div>

              <div>
                <h2>Property Details</h2>
                <p>
                  Add information that helps customers
                  understand the property.
                </p>
              </div>
            </div>

            <div className="owner-form-grid">
              <div className="owner-form-group">
                <label htmlFor="bedrooms">
                  Bedrooms
                </label>

                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  value={form.bedrooms}
                  onChange={handleChange}
                  placeholder="3"
                />
              </div>

              <div className="owner-form-group">
                <label htmlFor="bathrooms">
                  Bathrooms
                </label>

                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  value={form.bathrooms}
                  onChange={handleChange}
                  placeholder="2"
                />
              </div>

              <div className="owner-form-group owner-form-full">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Describe the property, its condition, neighborhood, nearby services, and other important information..."
                />
              </div>
            </div>
          </section>

          <section className="owner-form-section">
            <div className="owner-form-section-header">
              <div className="owner-form-section-icon">
                <CheckCircle size={20} />
              </div>

              <div>
                <h2>Property Features</h2>
                <p>
                  Select the features available at this
                  property.
                </p>
              </div>
            </div>

            <div className="owner-feature-checkboxes">
              <label className="owner-checkbox">
                <input
                  type="checkbox"
                  name="furnished"
                  checked={form.furnished}
                  onChange={handleChange}
                />

                <span>Furnished</span>
              </label>

              <label className="owner-checkbox">
                <input
                  type="checkbox"
                  name="parking_available"
                  checked={form.parking_available}
                  onChange={handleChange}
                />

                <span>Parking Available</span>
              </label>

              <label className="owner-checkbox">
                <input
                  type="checkbox"
                  name="electricity_available"
                  checked={form.electricity_available}
                  onChange={handleChange}
                />

                <span>Electricity Available</span>
              </label>

              <label className="owner-checkbox">
                <input
                  type="checkbox"
                  name="water_available"
                  checked={form.water_available}
                  onChange={handleChange}
                />

                <span>Water Available</span>
              </label>
            </div>
          </section>

          <div className="owner-form-actions">
            <button
              type="button"
              className="owner-form-cancel"
              onClick={() =>
                navigate(`/owner/properties/${id}`)
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="owner-primary-button"
              disabled={saving}
            >
              <Save size={18} />

              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default OwnerPropertyEdit;