
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  Building2,
  CheckCircle2,
  Clock3,
  XCircle,
  PlusCircle,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

import OwnerSidebar from "../components/OwnerSidebar";
import { supabase } from "../lib/supabase";

function OwnerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [ownerName, setOwnerName] = useState("Owner");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOwnerDashboard();
  }, []);

  const loadOwnerDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      /* LOAD OWNER PROFILE */
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", currentUser.id)
          .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      setOwnerName(
        profile?.full_name?.trim() ||
          profile?.email ||
          currentUser.email ||
          "Owner"
      );

      /* LOAD OWNER PROPERTIES */
      const { data: properties, error: propertiesError } =
        await supabase
          .from("properties")
          .select("id, status")
          .eq("owner_id", currentUser.id);

      if (propertiesError) {
        throw propertiesError;
      }

      const propertyList = properties || [];

      setStats({
        total: propertyList.length,
        approved: propertyList.filter(
          (property) => property.status === "approved"
        ).length,
        pending: propertyList.filter(
          (property) => property.status === "pending"
        ).length,
        rejected: propertyList.filter(
          (property) => property.status === "rejected"
        ).length,
      });
    } catch (err) {
      console.error("Owner dashboard error:", err);

      setError(
        err?.message ||
          t("ownerDashboard.loadError")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="owner-layout">
      <OwnerSidebar />

      <main className="owner-page-content">
        {/* HEADER */}
        <section className="owner-dashboard-header">
          <div>
            <p className="owner-page-eyebrow">
              {t("ownerDashboard.portal")}
            </p>

            <h1>
              {t("ownerDashboard.welcome", {
                name: ownerName,
              })}
            </h1>

            <p>
              {t("ownerDashboard.subtitle")}
            </p>
          </div>

          <button
            className="owner-primary-button"
            onClick={() =>
              navigate("/owner/properties/new")
            }
          >
            <PlusCircle size={18} />
            {t("ownerDashboard.listProperty")}
          </button>
        </section>

        {/* ERROR */}
        {error && (
          <div className="owner-properties-error">
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <section className="owner-dashboard-stats">
          <div className="owner-stat-card">
            <div className="owner-stat-icon">
              <Building2 size={21} />
            </div>

            <div>
              <span>
                {t("ownerDashboard.totalProperties")}
              </span>

              <strong>
                {loading ? "—" : stats.total}
              </strong>
            </div>
          </div>

          <div className="owner-stat-card">
            <div className="owner-stat-icon">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <span>
                {t("ownerDashboard.approved")}
              </span>

              <strong>
                {loading ? "—" : stats.approved}
              </strong>
            </div>
          </div>

          <div className="owner-stat-card">
            <div className="owner-stat-icon">
              <Clock3 size={21} />
            </div>

            <div>
              <span>
                {t("ownerDashboard.pending")}
              </span>

              <strong>
                {loading ? "—" : stats.pending}
              </strong>
            </div>
          </div>

          <div className="owner-stat-card">
            <div className="owner-stat-icon">
              <XCircle size={21} />
            </div>

            <div>
              <span>
                {t("ownerDashboard.rejected")}
              </span>

              <strong>
                {loading ? "—" : stats.rejected}
              </strong>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="owner-dashboard-actions">
          {/* MY PROPERTIES */}
          <div className="owner-dashboard-card">
            <div>
              <div className="owner-dashboard-card-icon">
                <Building2 size={21} />
              </div>

              <h2>
                {t("ownerDashboard.myProperties")}
              </h2>

              <p>
                {t("ownerDashboard.myPropertiesDescription")}
              </p>
            </div>

            <button
              onClick={() => navigate("/owner/properties")}
            >
              {t("ownerDashboard.viewProperties")}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* CUSTOMER INQUIRIES */}
          <div className="owner-dashboard-card">
            <div>
              <div className="owner-dashboard-card-icon">
                <MessageCircle size={21} />
              </div>

              <h2>
                {t("ownerDashboard.customerInquiries")}
              </h2>

              <p>
                {t("ownerDashboard.inquiriesDescription")}
              </p>
            </div>

            <button
              onClick={() => navigate("/owner/inquiries")}
            >
              {t("ownerDashboard.viewInquiries")}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* LIST PROPERTY */}
          <div className="owner-dashboard-card">
            <div>
              <div className="owner-dashboard-card-icon">
                <PlusCircle size={21} />
              </div>

              <h2>
                {t("ownerDashboard.listProperty")}
              </h2>

              <p>
                {t("ownerDashboard.listPropertyDescription")}
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/owner/properties/new")
              }
            >
              {t("ownerDashboard.createListing")}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="owner-dashboard-info">
          <h2>
            {t("ownerDashboard.howItWorks")}
          </h2>

          <div className="owner-dashboard-steps">
            <div>
              <span>1</span>

              <div>
                <h3>
                  {t("ownerDashboard.createListingStep")}
                </h3>

                <p>
                  {t("ownerDashboard.createListingDescription")}
                </p>
              </div>
            </div>

            <div>
              <span>2</span>

              <div>
                <h3>
                  {t("ownerDashboard.adminReviewStep")}
                </h3>

                <p>
                  {t("ownerDashboard.adminReviewDescription")}
                </p>
              </div>
            </div>

            <div>
              <span>3</span>

              <div>
                <h3>
                  {t("ownerDashboard.receiveCustomersStep")}
                </h3>

                <p>
                  {t("ownerDashboard.receiveCustomersDescription")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default OwnerDashboard;
