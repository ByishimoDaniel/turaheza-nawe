
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Mail,
  Search,
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Phone,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminInquiries() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInquiries();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, statusFilter]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setError(t("adminInquiries.loginRequired"));
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role, is_active")
          .eq("id", user.id)
          .single();

      if (profileError) throw profileError;

      if (
        profile.role !== "admin" ||
        profile.is_active !== true
      ) {
        setError(t("adminInquiries.unauthorized"));
        return;
      }

      const { data, error: inquiryError } = await supabase
        .from("property_inquiries")
        .select(
          `
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
            property_type,
            listing_type,
            price_rwf,
            status
          )
        `
        )
        .order("created_at", { ascending: false });

      if (inquiryError) throw inquiryError;

      setInquiries(data || []);
    } catch (err) {
      console.error("Admin inquiries error:", err);
      setError(
        err.message || t("adminInquiries.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    let result = [...inquiries];

    if (statusFilter === "unread") {
      result = result.filter(
        (inquiry) => inquiry.is_read === false
      );
    }

    if (statusFilter === "read") {
      result = result.filter(
        (inquiry) => inquiry.is_read === true
      );
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter((inquiry) => {
        const propertyTitle =
          inquiry.properties?.title?.toLowerCase() || "";

        return (
          inquiry.name?.toLowerCase().includes(search) ||
          inquiry.email?.toLowerCase().includes(search) ||
          inquiry.phone?.toLowerCase().includes(search) ||
          inquiry.message?.toLowerCase().includes(search) ||
          propertyTitle.includes(search)
        );
      });
    }

    setFilteredInquiries(result);
  };

  const markAsRead = async (inquiry) => {
    if (inquiry.is_read) return;

    try {
      setActionLoading(inquiry.id);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("property_inquiries")
        .update({
          is_read: true,
        })
        .eq("id", inquiry.id);

      if (updateError) throw updateError;

      setSuccess(t("adminInquiries.markedAsRead"));

      setInquiries((current) =>
        current.map((item) =>
          item.id === inquiry.id
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch (err) {
      console.error("Mark inquiry error:", err);
      setError(
        err.message || t("adminInquiries.updateError")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return t("adminInquiries.priceNotSpecified");
    }

    return `${Number(price).toLocaleString()} RWF`;
  };

  if (loading) {
    return (
      <div className="admin-page-loading">
        <Loader2 size={36} className="spin" />
        <p>{t("adminInquiries.loading")}</p>
      </div>
    );
  }

  return (
    <div className="admin-inquiries-page">
      <div className="admin-inquiries-header">
        <div>
          <span className="admin-section-label">
            {t("adminInquiries.sectionLabel")}
          </span>

          <h1>{t("adminInquiries.title")}</h1>

          <p>{t("adminInquiries.description")}</p>
        </div>

        <div className="admin-inquiries-count">
          <MessageSquare size={22} />

          <span>{inquiries.length}</span>

          <small>{t("adminInquiries.totalInquiries")}</small>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="admin-inquiries-toolbar">
        <div className="admin-search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder={t("adminInquiries.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="admin-role-filter"
        >
          <option value="all">
            {t("adminInquiries.allInquiries")}
          </option>
          <option value="unread">
            {t("adminInquiries.unread")}
          </option>
          <option value="read">
            {t("adminInquiries.read")}
          </option>
        </select>
      </div>

      <div className="admin-inquiries-list">
        {filteredInquiries.length === 0 ? (
          <div className="admin-empty-state">
            <MessageSquare size={42} />

            <h3>{t("adminInquiries.emptyTitle")}</h3>

            <p>{t("adminInquiries.emptyDescription")}</p>
          </div>
        ) : (
          filteredInquiries.map((inquiry) => {
            const property = inquiry.properties;

            return (
              <div
                key={inquiry.id}
                className={`admin-inquiry-card ${
                  !inquiry.is_read
                    ? "admin-inquiry-unread"
                    : ""
                }`}
              >
                <div className="admin-inquiry-main">
                  <div className="admin-inquiry-top">
                    <div>
                      <div className="admin-inquiry-customer">
                        <strong>
                          {inquiry.name ||
                            t("adminInquiries.unknownCustomer")}
                        </strong>

                        {!inquiry.is_read && (
                          <span className="admin-unread-badge">
                            {t("adminInquiries.new")}
                          </span>
                        )}
                      </div>

                      <div className="admin-inquiry-contact">
                        {inquiry.email && (
                          <span>
                            <Mail size={15} />
                            {inquiry.email}
                          </span>
                        )}

                        {inquiry.phone && (
                          <span>
                            <Phone size={15} />
                            {inquiry.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="admin-inquiry-date">
                      {new Date(
                        inquiry.created_at
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div className="admin-inquiry-property">
                    <div>
                      <span>{t("adminInquiries.property")}</span>

                      <strong>
                        {property?.title ||
                          t("adminInquiries.propertyUnavailable")}
                      </strong>
                    </div>

                    <div>
                      <span>{t("adminInquiries.type")}</span>

                      <strong>
                        {property?.property_type || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>{t("adminInquiries.listing")}</span>

                      <strong>
                        {property?.listing_type || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>{t("adminInquiries.price")}</span>

                      <strong>
                        {formatPrice(property?.price_rwf)}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-inquiry-message">
                    <MessageSquare size={18} />

                    <p>{inquiry.message}</p>
                  </div>

                  <div className="admin-inquiry-actions">
                    <button
                      type="button"
                      className="admin-action-button"
                      onClick={() =>
                        navigate(
                          `/admin/properties/${inquiry.property_id}`
                        )
                      }
                    >
                      <ExternalLink size={16} />
                      {t("adminInquiries.viewProperty")}
                    </button>

                    {inquiry.phone && (
                      <a
                        href={`tel:${inquiry.phone}`}
                        className="admin-action-button"
                      >
                        <Phone size={16} />
                        {t("adminInquiries.call")}
                      </a>
                    )}

                    {inquiry.email && (
                      <a
                        href={`mailto:${inquiry.email}`}
                        className="admin-action-button"
                      >
                        <Mail size={16} />
                        {t("adminInquiries.email")}
                      </a>
                    )}

                    <button
                      type="button"
                      className={`admin-action-button ${
                        inquiry.is_read
                          ? "admin-read-button"
                          : "admin-mark-read-button"
                      }`}
                      onClick={() => markAsRead(inquiry)}
                      disabled={
                        inquiry.is_read ||
                        actionLoading === inquiry.id
                      }
                    >
                      {actionLoading === inquiry.id ? (
                        <Loader2
                          size={16}
                          className="spin"
                        />
                      ) : inquiry.is_read ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Circle size={16} />
                      )}

                      {inquiry.is_read
                        ? t("adminInquiries.read")
                        : t("adminInquiries.markAsRead")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
