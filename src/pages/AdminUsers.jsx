
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function AdminUsers() {
  const { t, i18n } = useTranslation();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [currentAdminId, setCurrentAdminId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAdminAndUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadAdminAndUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error(
          t("adminUsers.errors.loginRequired")
        );
      }

      setCurrentAdminId(user.id);

      const { data: adminProfile, error: adminError } =
        await supabase
          .from("profiles")
          .select("id, role, is_active")
          .eq("id", user.id)
          .single();

      if (adminError) throw adminError;

      if (
        adminProfile.role !== "admin" ||
        adminProfile.is_active !== true
      ) {
        throw new Error(
          t("adminUsers.errors.unauthorized")
        );
      }

      const { data, error: usersError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          phone,
          email,
          role,
          profile_image_url,
          is_active,
          created_at,
          updated_at
        `
        )
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      setUsers(data || []);
    } catch (err) {
      console.error("Admin users error:", err);
      setError(
        err.message || t("adminUsers.errors.loadUsers")
      );
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];

    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter((user) => {
        return (
          user.full_name?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.phone?.toLowerCase().includes(search)
        );
      });
    }

    setFilteredUsers(result);
  };

  const promoteToAdmin = async (userId) => {
    if (!userId || userId === currentAdminId) {
      setError(t("adminUsers.errors.cannotPromoteSelf"));
      return;
    }

    const confirmed = window.confirm(
      t("adminUsers.confirm.promote")
    );

    if (!confirmed) return;

    try {
      setActionLoading(userId);
      setError("");
      setSuccess("");

      const { error: rpcError } = await supabase.rpc(
        "make_user_admin",
        {
          target_user: userId,
        }
      );

      if (rpcError) throw rpcError;

      setSuccess(
        t("adminUsers.success.promoted")
      );

      await loadAdminAndUsers();
    } catch (err) {
      console.error("Promote admin error:", err);
      setError(
        err.message || t("adminUsers.errors.promoteFailed")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const toggleUserStatus = async (user) => {
    if (user.id === currentAdminId) {
      setError(
        t("adminUsers.errors.cannotDeactivateSelf")
      );
      return;
    }

    const newStatus = !user.is_active;

    const confirmed = window.confirm(
      newStatus
        ? t("adminUsers.confirm.activate", {
            name:
              user.full_name ||
              t("adminUsers.labels.thisUser"),
          })
        : t("adminUsers.confirm.deactivate", {
            name:
              user.full_name ||
              t("adminUsers.labels.thisUser"),
          })
    );

    if (!confirmed) return;

    try {
      setActionLoading(user.id);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess(
        newStatus
          ? t("adminUsers.success.activated")
          : t("adminUsers.success.deactivated")
      );

      await loadAdminAndUsers();
    } catch (err) {
      console.error("User status error:", err);
      setError(
        err.message || t("adminUsers.errors.updateStatusFailed")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleClass = (role) => {
    switch (role) {
      case "admin":
        return "admin-role";
      case "owner":
        return "owner-role";
      case "agent":
        return "agent-role";
      case "tenant":
        return "tenant-role";
      case "buyer":
        return "buyer-role";
      default:
        return "";
    }
  };

  const getRoleLabel = (role) => {
    const supportedRoles = [
      "admin",
      "owner",
      "agent",
      "tenant",
      "buyer",
    ];

    if (supportedRoles.includes(role)) {
      return t(`adminUsers.roles.${role}`);
    }

    return role || t("adminUsers.roles.buyer");
  };

  const dateLocale =
    i18n.language === "fr"
      ? "fr-FR"
      : i18n.language === "rw"
        ? "rw-RW"
        : "en-GB";

  if (loading) {
    return (
      <div className="admin-page-loading">
        <Loader2 size={36} className="spin" />
        <p>{t("adminUsers.loading")}</p>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <span className="admin-section-label">
            {t("adminUsers.sectionLabel")}
          </span>

          <h1>{t("adminUsers.title")}</h1>

          <p>{t("adminUsers.description")}</p>
        </div>

        <div className="admin-users-count">
          <Users size={22} />
          <span>{users.length}</span>
          <small>{t("adminUsers.totalUsers")}</small>
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

      <div className="admin-users-toolbar">
        <div className="admin-search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder={t("adminUsers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-role-filter"
        >
          <option value="all">
            {t("adminUsers.filters.allRoles")}
          </option>
          <option value="admin">
            {t("adminUsers.filters.administrators")}
          </option>
          <option value="owner">
            {t("adminUsers.filters.owners")}
          </option>
          <option value="agent">
            {t("adminUsers.filters.agents")}
          </option>
          <option value="buyer">
            {t("adminUsers.filters.buyers")}
          </option>
          <option value="tenant">
            {t("adminUsers.filters.tenants")}
          </option>
        </select>
      </div>

      <div className="admin-users-table-wrapper">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>{t("adminUsers.table.user")}</th>
              <th>{t("adminUsers.table.phone")}</th>
              <th>{t("adminUsers.table.role")}</th>
              <th>{t("adminUsers.table.status")}</th>
              <th>{t("adminUsers.table.joined")}</th>
              <th>{t("adminUsers.table.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-empty-users">
                  {t("adminUsers.empty")}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-user-info">
                      <div className="admin-user-avatar">
                        {user.profile_image_url ? (
                          <img
                            src={user.profile_image_url}
                            alt={
                              user.full_name ||
                              t("adminUsers.labels.user")
                            }
                          />
                        ) : (
                          <Users size={20} />
                        )}
                      </div>

                      <div>
                        <strong>
                          {user.full_name ||
                            t("adminUsers.labels.newUser")}
                        </strong>

                        <span>
                          {user.email ||
                            t("adminUsers.labels.noEmail")}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>{user.phone || "—"}</td>

                  <td>
                    <span
                      className={`admin-role-badge ${getRoleClass(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        user.is_active
                          ? "admin-status-active"
                          : "admin-status-inactive"
                      }
                    >
                      {user.is_active
                        ? t("adminUsers.status.active")
                        : t("adminUsers.status.inactive")}
                    </span>
                  </td>

                  <td>
                    {user.created_at
                      ? new Date(
                          user.created_at
                        ).toLocaleDateString(dateLocale)
                      : "—"}
                  </td>

                  <td>
                    <div className="admin-user-actions">
                      {user.role !== "admin" &&
                        user.id !== currentAdminId && (
                          <button
                            type="button"
                            className="admin-action-button admin-promote-button"
                            onClick={() =>
                              promoteToAdmin(user.id)
                            }
                            disabled={
                              actionLoading === user.id
                            }
                            title={t(
                              "adminUsers.actions.makeAdministrator"
                            )}
                          >
                            {actionLoading === user.id ? (
                              <Loader2
                                size={16}
                                className="spin"
                              />
                            ) : (
                              <ShieldCheck size={16} />
                            )}

                            <span>
                              {t("adminUsers.actions.admin")}
                            </span>
                          </button>
                        )}

                      {user.id !== currentAdminId && (
                        <button
                          type="button"
                          className={`admin-action-button ${
                            user.is_active
                              ? "admin-deactivate-button"
                              : "admin-activate-button"
                          }`}
                          onClick={() =>
                            toggleUserStatus(user)
                          }
                          disabled={
                            actionLoading === user.id
                          }
                          title={
                            user.is_active
                              ? t(
                                  "adminUsers.actions.deactivateUser"
                                )
                              : t(
                                  "adminUsers.actions.activateUser"
                                )
                          }
                        >
                          {actionLoading === user.id ? (
                            <Loader2
                              size={16}
                              className="spin"
                            />
                          ) : user.is_active ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}

                          <span>
                            {user.is_active
                              ? t("adminUsers.actions.deactivate")
                              : t("adminUsers.actions.activate")}
                          </span>
                        </button>
                      )}

                      {user.id === currentAdminId && (
                        <span className="admin-current-user">
                          {t("adminUsers.actions.currentAccount")}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
