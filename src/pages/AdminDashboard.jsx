
import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import {
  Building2,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function AdminDashboard() {
  const { t } = useTranslation();

  const [stats, setStats] = useState({
    properties: 0,
    users: 0,
    inquiries: 0,
    payments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("========== AUTH DEBUG ==========");
      console.log("SUPABASE USER:", user);
      console.log("AUTH USER ID:", user?.id);
      console.log("AUTH USER EMAIL:", user?.email);
      console.log("SUPABASE USER ERROR:", userError);
      console.log("================================");

      const { data, error } = await supabase.rpc(
        "get_admin_dashboard_stats"
      );

      console.log("========== RPC DEBUG ==========");
      console.log("DASHBOARD RPC DATA:", data);
      console.log("DASHBOARD RPC ERROR:", error);
      console.log("================================");

      if (error) {
        throw error;
      }

      setStats({
        properties: data?.properties || 0,
        users: data?.users || 0,
        inquiries: data?.inquiries || 0,
        payments: data?.payments || 0,
      });
    } catch (error) {
      console.error(
        "Dashboard statistics error:",
        JSON.stringify(error, null, 2)
      );

      setErrorMessage(
        t("adminDashboard.loadError")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <span className="section-label">
            TURAHEZA NAWE
          </span>

          <h1>{t("adminDashboard.title")}</h1>

          <p>
            {t("adminDashboard.description")}
          </p>
        </div>
      </section>

      <section className="admin-container">

        {errorMessage && (
          <div className="properties-message">
            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={loadDashboardStats}
            >
              {t("adminDashboard.tryAgain")}
            </button>
          </div>
        )}

        <div className="admin-stats">

          <div className="admin-stat-card">
            <Building2 size={28} />

            <div>
              <span>{t("adminDashboard.properties")}</span>

              <strong>
                {loading ? "..." : stats.properties}
              </strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <Users size={28} />

            <div>
              <span>{t("adminDashboard.users")}</span>

              <strong>
                {loading ? "..." : stats.users}
              </strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <MessageSquare size={28} />

            <div>
              <span>{t("adminDashboard.inquiries")}</span>

              <strong>
                {loading ? "..." : stats.inquiries}
              </strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <CreditCard size={28} />

            <div>
              <span>{t("adminDashboard.payments")}</span>

              <strong>
                {loading ? "..." : stats.payments}
              </strong>
            </div>
          </div>

        </div>

        <div className="admin-section">

          <div className="admin-section-header">

            <div>
              <h2>{t("adminDashboard.management")}</h2>

              <p>
                {t("adminDashboard.managementDescription")}
              </p>
            </div>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={loadDashboardStats}
              disabled={loading}
            >
              <RefreshCw size={17} />

              {loading
                ? t("adminDashboard.refreshing")
                : t("adminDashboard.refresh")}
            </button>

          </div>

          <div className="admin-menu-grid">

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/properties";
              }}
            >
              <Building2 size={25} />

              <span>
                {t("adminDashboard.manageProperties")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/users";
              }}
            >
              <Users size={25} />

              <span>
                {t("adminDashboard.manageUsers")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/inquiries";
              }}
            >
              <MessageSquare size={25} />

              <span>
                {t("adminDashboard.inquiries")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/payments";
              }}
            >
              <CreditCard size={25} />

              <span>
                {t("adminDashboard.payments")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/admin/settings";
              }}
            >
              <Settings size={25} />

              <span>
                {t("adminDashboard.settings")}
              </span>
            </button>

          </div>

        </div>

      </section>
    </main>
  );
}

export default AdminDashboard;
