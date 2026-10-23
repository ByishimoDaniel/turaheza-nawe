
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import {
  CreditCard,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  X,
} from "lucide-react";

export default function AdminPayments() {
  const { t } = useTranslation();

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("PAYMENTS_LOGIN_REQUIRED");
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
        throw new Error("PAYMENTS_UNAUTHORIZED");
      }

      const { data, error: paymentsError } =
        await supabase
          .from("payments")
          .select(`
            id,
            property_id,
            payer_id,
            receiver_id,
            payment_type,
            amount_rwf,
            payment_status,
            payment_method,
            transaction_reference,
            notes,
            paid_at,
            created_at,
            properties (
              id,
              title,
              property_type,
              listing_type
            )
          `)
          .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      setPayments(data || []);
    } catch (err) {
      console.error("Admin payments error:", err);

      if (err.message === "PAYMENTS_LOGIN_REQUIRED") {
        setError(t("adminPayments.loginRequired"));
      } else if (err.message === "PAYMENTS_UNAUTHORIZED") {
        setError(t("adminPayments.unauthorized"));
      } else {
        setError(
          err.message || t("adminPayments.loadError")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let result = [...payments];

    if (statusFilter !== "all") {
      result = result.filter(
        (payment) =>
          payment.payment_status === statusFilter
      );
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter((payment) => {
        const propertyTitle =
          payment.properties?.title?.toLowerCase() || "";

        const reference =
          payment.transaction_reference?.toLowerCase() ||
          "";

        const method =
          payment.payment_method?.toLowerCase() || "";

        const paymentType =
          payment.payment_type?.toLowerCase() || "";

        return (
          propertyTitle.includes(search) ||
          reference.includes(search) ||
          method.includes(search) ||
          paymentType.includes(search) ||
          String(payment.amount_rwf || "").includes(
            search
          )
        );
      });
    }

    setFilteredPayments(result);
  };

  const updatePaymentStatus = async (
    paymentId,
    newStatus
  ) => {
    const confirmed = window.confirm(
      t("adminPayments.confirmStatusChange", {
        status: t(`adminPayments.statuses.${newStatus}`),
      })
    );

    if (!confirmed) return;

    try {
      setActionLoading(paymentId);
      setError("");
      setSuccess("");

      const updateData = {
        payment_status: newStatus,
      };

      if (
        newStatus === "paid" ||
        newStatus === "completed"
      ) {
        updateData.paid_at =
          new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId);

      if (updateError) throw updateError;

      setPayments((current) =>
        current.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                ...updateData,
              }
            : payment
        )
      );

      setSuccess(
        t("adminPayments.statusUpdated", {
          status: t(`adminPayments.statuses.${newStatus}`),
        })
      );

      if (selectedPayment?.id === paymentId) {
        setSelectedPayment((current) =>
          current
            ? {
                ...current,
                ...updateData,
              }
            : null
        );
      }
    } catch (err) {
      console.error(
        "Payment status update error:",
        err
      );

      setError(
        err.message ||
          t("adminPayments.updateError")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatAmount = (amount) => {
    if (
      amount === null ||
      amount === undefined
    ) {
      return "0 RWF";
    }

    return `${Number(amount).toLocaleString()} RWF`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return <CheckCircle size={17} />;

      case "pending":
        return <Clock size={17} />;

      case "failed":
      case "cancelled":
        return <XCircle size={17} />;

      default:
        return <Clock size={17} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return "admin-payment-paid";

      case "pending":
        return "admin-payment-pending";

      case "failed":
      case "cancelled":
        return "admin-payment-failed";

      default:
        return "admin-payment-pending";
    }
  };

  const getStatusLabel = (status) => {
    return t(
      `adminPayments.statuses.${status || "pending"}`
    );
  };

  const totalAmount = payments.reduce(
    (total, payment) => {
      if (
        payment.payment_status === "paid" ||
        payment.payment_status === "completed"
      ) {
        return total + Number(payment.amount_rwf || 0);
      }

      return total;
    },
    0
  );

  const pendingAmount = payments.reduce(
    (total, payment) => {
      if (payment.payment_status === "pending") {
        return total + Number(payment.amount_rwf || 0);
      }

      return total;
    },
    0
  );

  if (loading) {
    return (
      <div className="admin-page-loading">
        <Loader2
          size={36}
          className="spin"
        />
        <p>{t("adminPayments.loading")}</p>
      </div>
    );
  }

  return (
    <div className="admin-payments-page">
      <div className="admin-payments-header">
        <div>
          <span className="admin-section-label">
            {t("adminPayments.sectionLabel")}
          </span>

          <h1>{t("adminPayments.title")}</h1>

          <p>
            {t("adminPayments.description")}
          </p>
        </div>

        <div className="admin-payments-count">
          <CreditCard size={22} />

          <span>{payments.length}</span>

          <small>{t("adminPayments.totalPayments")}</small>
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

      <div className="admin-payment-summary">
        <div className="admin-payment-summary-card">
          <span>{t("adminPayments.completedRevenue")}</span>
          <strong>
            {totalAmount.toLocaleString()} RWF
          </strong>
        </div>

        <div className="admin-payment-summary-card">
          <span>{t("adminPayments.pendingAmount")}</span>
          <strong>
            {pendingAmount.toLocaleString()} RWF
          </strong>
        </div>

        <div className="admin-payment-summary-card">
          <span>{t("adminPayments.totalRecords")}</span>
          <strong>{payments.length}</strong>
        </div>
      </div>

      <div className="admin-payments-toolbar">
        <div className="admin-search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder={t("adminPayments.searchPlaceholder")}
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
            {t("adminPayments.allStatuses")}
          </option>

          <option value="paid">
            {t("adminPayments.statuses.paid")}
          </option>

          <option value="completed">
            {t("adminPayments.statuses.completed")}
          </option>

          <option value="pending">
            {t("adminPayments.statuses.pending")}
          </option>

          <option value="failed">
            {t("adminPayments.statuses.failed")}
          </option>

          <option value="cancelled">
            {t("adminPayments.statuses.cancelled")}
          </option>
        </select>
      </div>

      <div className="admin-payments-table-wrapper">
        <table className="admin-payments-table">
          <thead>
            <tr>
              <th>{t("adminPayments.property")}</th>
              <th>{t("adminPayments.paymentType")}</th>
              <th>{t("adminPayments.amount")}</th>
              <th>{t("adminPayments.method")}</th>
              <th>{t("adminPayments.reference")}</th>
              <th>{t("adminPayments.status")}</th>
              <th>{t("adminPayments.date")}</th>
              <th>{t("adminPayments.action")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="admin-empty-payments"
                >
                  <CreditCard size={40} />

                  <strong>
                    {t("adminPayments.emptyTitle")}
                  </strong>

                  <span>
                    {t("adminPayments.emptyDescription")}
                  </span>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="admin-payment-property">
                      <strong>
                        {payment.properties?.title ||
                          t("adminPayments.propertyUnavailable")}
                      </strong>

                      <span>
                        {payment.properties
                          ?.property_type ||
                          "—"}
                      </span>
                    </div>
                  </td>

                  <td>
                    {payment.payment_type ||
                      "—"}
                  </td>

                  <td>
                    <strong>
                      {formatAmount(
                        payment.amount_rwf
                      )}
                    </strong>
                  </td>

                  <td>
                    {payment.payment_method ||
                      "—"}
                  </td>

                  <td>
                    <span className="admin-payment-reference">
                      {payment.transaction_reference ||
                        "—"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-payment-status ${getStatusClass(
                        payment.payment_status
                      )}`}
                    >
                      {getStatusIcon(
                        payment.payment_status
                      )}

                      {getStatusLabel(
                        payment.payment_status
                      )}
                    </span>
                  </td>

                  <td>
                    {payment.created_at
                      ? new Date(
                          payment.created_at
                        ).toLocaleDateString()
                      : "—"}
                  </td>

                  <td>
                    <div className="admin-payment-actions">
                      <button
                        type="button"
                        className="admin-action-button"
                        onClick={() =>
                          setSelectedPayment(
                            payment
                          )
                        }
                      >
                        <Eye size={16} />
                        {t("adminPayments.view")}
                      </button>

                      {payment.payment_status ===
                        "pending" && (
                        <>
                          <button
                            type="button"
                            className="admin-action-button admin-payment-approve"
                            disabled={
                              actionLoading ===
                              payment.id
                            }
                            onClick={() =>
                              updatePaymentStatus(
                                payment.id,
                                "paid"
                              )
                            }
                          >
                            {actionLoading ===
                            payment.id ? (
                              <Loader2
                                size={15}
                                className="spin"
                              />
                            ) : (
                              <CheckCircle
                                size={15}
                              />
                            )}

                            {t("adminPayments.approve")}
                          </button>

                          <button
                            type="button"
                            className="admin-action-button admin-payment-reject"
                            disabled={
                              actionLoading ===
                              payment.id
                            }
                            onClick={() =>
                              updatePaymentStatus(
                                payment.id,
                                "failed"
                              )
                            }
                          >
                            <XCircle size={15} />
                            {t("adminPayments.reject")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPayment && (
        <div
          className="admin-payment-modal-overlay"
          onClick={() =>
            setSelectedPayment(null)
          }
        >
          <div
            className="admin-payment-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="admin-payment-modal-header">
              <div>
                <span>
                  {t("adminPayments.paymentDetails")}
                </span>

                <h2>
                  {formatAmount(
                    selectedPayment.amount_rwf
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(null)
                }
                className="admin-modal-close"
                aria-label={t("adminPayments.close")}
              >
                <X size={21} />
              </button>
            </div>

            <div className="admin-payment-details">
              <div>
                <span>{t("adminPayments.property")}</span>
                <strong>
                  {selectedPayment.properties
                    ?.title ||
                    t("adminPayments.unavailable")}
                </strong>
              </div>

              <div>
                <span>{t("adminPayments.paymentType")}</span>
                <strong>
                  {selectedPayment.payment_type ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>{t("adminPayments.paymentMethod")}</span>
                <strong>
                  {selectedPayment.payment_method ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>{t("adminPayments.transactionReference")}</span>
                <strong>
                  {selectedPayment.transaction_reference ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>{t("adminPayments.status")}</span>

                <strong
                  className={`admin-payment-status ${getStatusClass(
                    selectedPayment.payment_status
                  )}`}
                >
                  {getStatusIcon(
                    selectedPayment.payment_status
                  )}

                  {getStatusLabel(
                    selectedPayment.payment_status
                  )}
                </strong>
              </div>

              <div>
                <span>{t("adminPayments.created")}</span>

                <strong>
                  {selectedPayment.created_at
                    ? new Date(
                        selectedPayment.created_at
                      ).toLocaleString()
                    : "—"}
                </strong>
              </div>

              <div>
                <span>{t("adminPayments.paidAt")}</span>

                <strong>
                  {selectedPayment.paid_at
                    ? new Date(
                        selectedPayment.paid_at
                      ).toLocaleString()
                    : t("adminPayments.notPaid")}
                </strong>
              </div>

              <div>
                <span>{t("adminPayments.paymentId")}</span>

                <strong>
                  {selectedPayment.id}
                </strong>
              </div>

              {selectedPayment.notes && (
                <div className="admin-payment-notes">
                  <span>{t("adminPayments.notes")}</span>

                  <p>
                    {selectedPayment.notes}
                  </p>
                </div>
              )}
            </div>

            {selectedPayment.payment_status ===
              "pending" && (
              <div className="admin-payment-modal-actions">
                <button
                  type="button"
                  className="admin-payment-approve-large"
                  disabled={
                    actionLoading ===
                    selectedPayment.id
                  }
                  onClick={() =>
                    updatePaymentStatus(
                      selectedPayment.id,
                      "paid"
                    )
                  }
                >
                  {actionLoading === selectedPayment.id ? (
                    <Loader2 size={17} className="spin" />
                  ) : (
                    <CheckCircle size={17} />
                  )}
                  {t("adminPayments.approvePayment")}
                </button>

                <button
                  type="button"
                  className="admin-payment-reject-large"
                  disabled={
                    actionLoading ===
                    selectedPayment.id
                  }
                  onClick={() =>
                    updatePaymentStatus(
                      selectedPayment.id,
                      "failed"
                    )
                  }
                >
                  <XCircle size={17} />
                  {t("adminPayments.rejectPayment")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
