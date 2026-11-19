"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Search, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  listOrders,
  Order,
  ORDER_STATUSES,
  OrderStatus,
  updateOrderStatus,
} from "@/lib/admin-api";

function getStatusInfo(status: string) {
  return (
    ORDER_STATUSES.find((item) => item.value === status) ?? {
      value: status,
      label: status || "Sin estado",
      tone: "muted",
    }
  );
}

function formatDate(raw?: string): string {
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OrdenesPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const items = await listOrders(token, handleUnauthorized);
      setOrders(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las órdenes.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function handleStatusChange(order: Order, nextStatus: OrderStatus) {
    if (!token) return;
    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      await updateOrderStatus(order.id, nextStatus, token, handleUnauthorized);
      setOrders((current) =>
        current.map((entry) =>
          entry.id === order.id ? { ...entry, status: nextStatus } : entry
        )
      );
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
      const label = getStatusInfo(nextStatus).label;
      setNotice(`Orden #${order.orderNumber || order.id.slice(0, 8)}: ${label}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado de la orden."
      );
    } finally {
      setBusyId("");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        (order.orderNumber ?? "").toLowerCase().includes(q) ||
        (order.customerName ?? "").toLowerCase().includes(q) ||
        (order.customerEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <AdminShell
      title="Órdenes"
      subtitle="Consulta los pedidos realizados por los clientes y actualiza su estado de seguimiento."
      actions={
        <button
          type="button"
          className="button-secondary"
          disabled={loading}
          onClick={() => void loadOrders()}
        >
          <RefreshCw size={14} />
          <span>{loading ? "Actualizando..." : "Actualizar"}</span>
        </button>
      }
    >
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="message success" role="status">
          {notice}
        </p>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Pedidos de clientes</h2>
          <span className="panel-meta tabular">
            {filtered.length} de {orders.length}
          </span>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              type="search"
              placeholder="Buscar por # orden, cliente o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar órdenes"
            />
          </div>
          <div className="segmented-control" role="tablist" aria-label="Filtrar estado">
            <button
              type="button"
              className={`segmented-btn ${statusFilter === "all" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </button>
            {ORDER_STATUSES.map((st) => (
              <button
                key={st.value}
                type="button"
                className={`segmented-btn ${statusFilter === st.value ? "is-active" : ""}`}
                onClick={() => setStatusFilter(st.value)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ paddingTop: 16 }}>
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="muted">
              {orders.length === 0
                ? "No hay órdenes registradas en la tienda todavía."
                : "Ninguna orden coincide con los filtros seleccionados."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado actual</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const statusMeta = getStatusInfo(order.status);
                  const currentSelectValue = ORDER_STATUSES.some(
                    (s) => s.value === order.status
                  )
                    ? order.status
                    : "";
                  return (
                    <tr key={order.id}>
                      <td className="mono tabular">
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </td>
                      <td>
                        <div>{order.customerName || "Cliente"}</div>
                        {order.customerEmail && (
                          <div className="muted-sm">{order.customerEmail}</div>
                        )}
                      </td>
                      <td className="tabular">{formatDate(order.createdAt)}</td>
                      <td>
                        <span className={`status-text status-${statusMeta.tone}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="text-right tabular" style={{ fontWeight: 600 }}>
                        {order.total !== undefined
                          ? Number(order.total).toLocaleString("es-DO", {
                              style: "currency",
                              currency: "DOP",
                            })
                          : "—"}
                      </td>
                      <td className="text-right">
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <select
                            className="inline-select"
                            aria-label={`Estado de orden ${order.orderNumber || order.id}`}
                            value={currentSelectValue}
                            disabled={busyId === order.id}
                            onChange={(e) => {
                              const next = e.target.value as OrderStatus;
                              if (next) void handleStatusChange(order, next);
                            }}
                          >
                            {!currentSelectValue && (
                              <option value="" disabled>
                                Cambiar estado...
                              </option>
                            )}
                            {ORDER_STATUSES.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye size={14} />
                            <span>Ver</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de orden ${selectedOrder.id}`}
        >
          <div className="drawer-panel">
            <div className="drawer-head">
              <h2>
                Orden #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
              </h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Cerrar detalle"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="order-detail-box">
              <div>
                <strong>Cliente:</strong>{" "}
                {selectedOrder.customerName || selectedOrder.customerEmail || "—"}
              </div>
              {selectedOrder.customerEmail && (
                <div>
                  <strong>Correo:</strong> {selectedOrder.customerEmail}
                </div>
              )}
              {selectedOrder.customerPhone && (
                <div className="tabular">
                  <strong>Teléfono:</strong> {selectedOrder.customerPhone}
                </div>
              )}
              {(selectedOrder.address || selectedOrder.city) && (
                <div>
                  <strong>Dirección:</strong>{" "}
                  {[selectedOrder.address, selectedOrder.city].filter(Boolean).join(", ")}
                </div>
              )}
              <div className="tabular">
                <strong>Fecha:</strong> {formatDate(selectedOrder.createdAt)}
              </div>
              {selectedOrder.notes && (
                <div>
                  <strong>Notas:</strong> {selectedOrder.notes}
                </div>
              )}
            </div>

            <label className="field">
              Actualizar estado
              <select
                value={
                  ORDER_STATUSES.some((s) => s.value === selectedOrder.status)
                    ? selectedOrder.status
                    : ""
                }
                disabled={busyId === selectedOrder.id}
                onChange={(e) => {
                  const next = e.target.value as OrderStatus;
                  if (next) void handleStatusChange(selectedOrder, next);
                }}
              >
                {!ORDER_STATUSES.some((s) => s.value === selectedOrder.status) && (
                  <option value="" disabled>
                    Estado actual: {selectedOrder.status}
                  </option>
                )}
                {ORDER_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Artículos</h3>
              {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                <div className="data-list">
                  {selectedOrder.items.map((item, idx) => (
                    <div className="data-row" key={`${item.productId || idx}`}>
                      <div className="row-info">
                        <div className="row-title">
                          {item.name || item.title || "Producto"}
                        </div>
                        <div className="row-meta">
                          <span className="tabular">Cant: {item.quantity ?? 1}</span>
                          {item.size && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Talla: {item.size}</span>
                            </>
                          )}
                          {item.color && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Color: {item.color}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {item.price !== undefined && (
                        <span className="tabular" style={{ fontWeight: 600 }}>
                          {Number(item.price).toLocaleString("es-DO", {
                            style: "currency",
                            currency: "DOP",
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No hay desglose de artículos en esta orden.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
