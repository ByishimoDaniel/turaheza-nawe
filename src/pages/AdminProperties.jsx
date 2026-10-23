
import { useEffect, useState } from "react";

import {
  Building2,
  CheckCircle2,
  XCircle,
  Ban,
  Pencil,
  Eye,
  RefreshCw,
  Search,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function AdminProperties() {
  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*, property_images(id, image_url)")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setProperties(data || []);
    } catch (error) {
      console.error(
        "Admin properties error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load properties."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updatePropertyStatus(
    propertyId,
    newStatus
  ) {
    setActionLoading(propertyId);

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("properties")
        .update({
          status: newStatus,
        })
        .eq("id", propertyId);

      if (error) {
        throw error;
      }

      setProperties((currentProperties) =>
        currentProperties.map((property) =>
          property.id === propertyId
            ? {
                ...property,
                status: newStatus,
              }
            : property
        )
      );

      setSuccessMessage(
        `Property successfully changed to "${newStatus}".`
      );
    } catch (error) {
      console.error(
        "Property status update error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to update property status."
      );
    } finally {
      setActionLoading("");
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "approved":
        return "status-approved";

      case "pending":
        return "status-pending";

      case "rejected":
        return "status-rejected";

      case "suspended":
        return "status-suspended";

      case "sold":
        return "status-sold";

      case "rented":
        return "status-rented";

      default:
        return "status-draft";
    }
  }

  const filteredProperties = properties.filter(
    (property) => {
      const matchesStatus =
        statusFilter === "all" ||
        property.status === statusFilter;

      const search =
        searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        property.title
          ?.toLowerCase()
          .includes(search) ||
        property.description
          ?.toLowerCase()
          .includes(search) ||
        property.city
          ?.toLowerCase()
          .includes(search) ||
        property.district
          ?.toLowerCase()
          .includes(search) ||
        property.property_type
          ?.toLowerCase()
          .includes(search);

      return (
        matchesStatus &&
        matchesSearch
      );
    }
  );

  return (
    <main className="admin-properties-page">

      {/* HEADER */}

      <section className="admin-properties-header">
        <div>
          <span className="section-label">
            TURAHEZA NAWE
          </span>

          <h1>Manage Properties</h1>

          <p>
            Review, approve and manage all property
            listings submitted to the marketplace.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={loadProperties}
          disabled={loading}
        >
          <RefreshCw size={17} />

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>


      {/* CONTENT */}

      <section className="admin-properties-container">

        {/* SUCCESS */}

        {successMessage && (
          <div className="admin-success-message">
            {successMessage}
          </div>
        )}


        {/* ERROR */}

        {errorMessage && (
          <div className="admin-error-message">

            <span>
              {errorMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setErrorMessage("")
              }
            >
              Close
            </button>

          </div>
        )}


        {/* SEARCH + FILTER */}

        <div className="admin-properties-toolbar">

          <div className="admin-property-search">

            <Search size={18} />

            <input
              type="search"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>


          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              All statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="suspended">
              Suspended
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="sold">
              Sold
            </option>

            <option value="rented">
              Rented
            </option>

          </select>

        </div>


        {/* COUNT */}

        <div className="admin-property-count">

          Showing{" "}

          <strong>
            {filteredProperties.length}
          </strong>{" "}

          of{" "}

          <strong>
            {properties.length}
          </strong>{" "}

          properties

        </div>


        {/* LOADING */}

        {loading ? (

          <div className="admin-properties-empty">

            <RefreshCw
              size={30}
              className="admin-loading-icon"
            />

            <h3>
              Loading properties...
            </h3>

            <p>
              Please wait while we load your
              property listings.
            </p>

          </div>

        ) : filteredProperties.length === 0 ? (

          /* EMPTY */

          <div className="admin-properties-empty">

            <Building2 size={40} />

            <h3>
              No properties found
            </h3>

            <p>
              There are no properties matching
              your current search or filter.
            </p>

          </div>

        ) : (

          /* PROPERTY LIST */

          <div className="admin-property-list">

            {filteredProperties.map(
              (property) => {

                const image =
                  property.property_images?.[0]
                    ?.image_url;

                return (

                  <article
                    className="admin-property-card"
                    key={property.id}
                  >

                    {/* IMAGE */}

                    <div className="admin-property-image">

                      {image ? (

                        <img
                          src={image}
                          alt={
                            property.title ||
                            "Property"
                          }
                        />

                      ) : (

                        <div className="admin-no-image">

                          <Building2
                            size={38}
                          />

                        </div>

                      )}


                      {/* STATUS */}

                      <span
                        className={`admin-property-status ${getStatusClass(
                          property.status
                        )}`}
                      >
                        {property.status ||
                          "draft"}
                      </span>

                    </div>


                    {/* CONTENT */}

                    <div className="admin-property-content">

                      <div className="admin-property-main">

                        <div>

                          <h2>
                            {property.title ||
                              "Untitled property"}
                          </h2>

                          <div className="admin-property-location">

                            <MapPin size={15} />

                            <span>
                              {property.city ||
                                property.district ||
                                "Location not specified"}
                            </span>

                          </div>

                        </div>


                        {/* PRICE */}

                        <div className="admin-property-price">

                          {property.price_rwf
                            ? `${Number(
                                property.price_rwf
                              ).toLocaleString()} RWF`
                            : "Price not set"}

                          {property.listing_type ===
                            "rent" && (
                            <small>
                              / month
                            </small>
                          )}

                        </div>

                      </div>


                      {/* DETAILS */}

                      <div className="admin-property-details">

                        {property.bedrooms !=
                          null && (

                          <span>

                            <BedDouble
                              size={16}
                            />

                            {property.bedrooms}{" "}
                            beds

                          </span>

                        )}


                        {property.bathrooms !=
                          null && (

                          <span>

                            <Bath size={16} />

                            {property.bathrooms}{" "}
                            baths

                          </span>

                        )}


                        {property.area_sqm !=
                          null && (

                          <span>

                            <Ruler size={16} />

                            {property.area_sqm}{" "}
                            m²

                          </span>

                        )}


                        {property.property_type && (

                          <span>

                            <Building2
                              size={16}
                            />

                            {
                              property.property_type
                            }

                          </span>

                        )}

                      </div>


                      {/* ACTIONS */}

                      <div className="admin-property-actions">

                        {/* VIEW */}

                        <button
                          type="button"
                          className="admin-action-view"
                          onClick={() => {
                            window.location.href =
                              `/admin/properties/${property.id}`;
                          }}
                        >

                          <Eye size={16} />

                          View

                        </button>


                        {/* EDIT */}

                        <button
                          type="button"
                          className="admin-action-edit"
                          onClick={() => {
                            window.location.href =
                              `/admin/properties/${property.id}/edit`;
                          }}
                        >

                          <Pencil size={16} />

                          Edit

                        </button>


                        {/* APPROVE */}

                        {property.status ===
                          "pending" && (

                          <button
                            type="button"
                            className="admin-action-approve"
                            disabled={
                              actionLoading ===
                              property.id
                            }
                            onClick={() =>
                              updatePropertyStatus(
                                property.id,
                                "approved"
                              )
                            }
                          >

                            <CheckCircle2
                              size={16}
                            />

                            {actionLoading ===
                            property.id
                              ? "..."
                              : "Approve"}

                          </button>

                        )}


                        {/* REJECT */}

                        {property.status !==
                          "rejected" &&
                          property.status !==
                            "suspended" && (

                          <button
                            type="button"
                            className="admin-action-reject"
                            disabled={
                              actionLoading ===
                              property.id
                            }
                            onClick={() =>
                              updatePropertyStatus(
                                property.id,
                                "rejected"
                              )
                            }
                          >

                            <XCircle
                              size={16}
                            />

                            {actionLoading ===
                            property.id
                              ? "..."
                              : "Reject"}

                          </button>

                        )}


                        {/* SUSPEND */}

                        {property.status ===
                          "approved" && (

                          <button
                            type="button"
                            className="admin-action-suspend"
                            disabled={
                              actionLoading ===
                              property.id
                            }
                            onClick={() =>
                              updatePropertyStatus(
                                property.id,
                                "suspended"
                              )
                            }
                          >

                            <Ban size={16} />

                            {actionLoading ===
                            property.id
                              ? "..."
                              : "Suspend"}

                          </button>

                        )}

                      </div>

                    </div>

                  </article>

                );
              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}

export default AdminProperties;
