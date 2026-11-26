"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Eye, RefreshCw, Search, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { SafeImage } from "@/components/SafeImage";
import {
  listOrders,
  listProducts,
  listCategories,
  getOrderProof,
  Order,
  OrderItem,
  Product,
  ORDER_STATUSES,
  OrderStatus,
  updateOrderStatus,
  reviewTransferPayment,
} from "@/lib/admin-api";
import { extractOrderDeliveryDetails } from "@/lib/order-delivery";
import {
  extractOrderItemDetails,
  extractOrderItemProductId,
} from "@/lib/order-item-details";

function getStatusInfo(status: string) {
  return (
    ORDER_STATUSES.find((item) => item.value === status) ?? {
      value: status,
      label: status || "Sin estado",
      tone: "muted",
    }
  );
}

function formatDop(raw?: string | number | null, formatted?: string): string {
  const source = raw !== undefined && raw !== null && raw !== "" ? raw : formatted;
  if (source === undefined || source === null || source === "") return "—";

  if (typeof source === "number") {
    if (!Number.isSafeInteger(source) || source < 0) return "—";
    return `${source.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  }

  const normalized = source.trim()
    .replace(/^RD\$\s*/i, "")
    .replace(/^DOP\s*/i, "")
    .replace(/^\$\s*/, "");
  const isGroupedInteger = /^\d{1,3}(?:\.\d{3})+$/.test(normalized);
  if (!/^\d+$/.test(normalized) && !isGroupedInteger) return "—";

  const integer = Number(normalized.replace(/\./g, ""));
  if (!Number.isSafeInteger(integer) || integer < 0) return "—";
  return `${integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
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

function formatDateTime(raw?: string): string {
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPaymentMethod(method?: string): string {
  if (!method) return "";
  if (method === "bank_transfer") return "Transferencia bancaria";
  if (method === "cash_on_delivery") return "Pago contra entrega";
  return method;
}

function formatPaymentStatus(status?: string): string {
  if (!status) return "";
  switch (status) {
    case "verified":
      return "Verificado";
    case "proof_submitted":
      return "Comprobante enviado";
    case "pending_proof":
      return "Pendiente de comprobante";
    case "rejected":
      return "Rechazado";
    case "pending":
      return "Pendiente";
    case "paid":
      return "Pagado";
    default:
      return status;
  }
}

function getOrderItems(order: Order): OrderItem[] {
  if (Array.isArray(order.items)) return order.items;
  const record = order as Record<string, unknown>;
  for (const key of ["orderItems", "order_items", "lineItems", "line_items", "products"]) {
    if (Array.isArray(record[key])) return record[key] as OrderItem[];
  }
  return [];
}

export default function OrdenesPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsById, setProductsById] = useState<Map<string, Product>>(() => new Map());
  const [categoryNameById, setCategoryNameById] = useState<Map<string, string>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [copiedDelivery, setCopiedDelivery] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [items, products, categories] = await Promise.all([
        listOrders(token, handleUnauthorized),
        listProducts(token, handleUnauthorized).catch(() => [] as Product[]),
        listCategories(token, handleUnauthorized).catch(() => []),
      ]);
      setOrders(items);
      const nextProducts = new Map<string, Product>();
      for (const product of products) {
        if (product?.id) nextProducts.set(product.id, product);
      }
      setProductsById(nextProducts);
      const nextCategories = new Map<string, string>();
      for (const category of categories) {
        if (category?.id && category?.name) nextCategories.set(category.id, category.name);
      }
      setCategoryNameById(nextCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las órdenes.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setProofImageUrl("");
    if (!selectedOrder?.paymentProofObjectName || !token) return;
    getOrderProof(selectedOrder.id, token, handleUnauthorized)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setProofImageUrl(objectUrl);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar el comprobante.");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedOrder?.id, selectedOrder?.paymentProofObjectName, token, handleUnauthorized]);

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

  async function handleTransferReview(order: Order, approved: boolean) {
    if (!token) return;
    const note = approved ? "" : window.prompt("Motivo del rechazo (opcional):") || "";
    setBusyId(order.id);
    setError("");
    setNotice("");
    try {
      await reviewTransferPayment(order.id, approved, note, token, handleUnauthorized);
      setNotice(approved ? "Transferencia verificada. Ya puedes preparar el despacho." : "Comprobante rechazado. El cliente puede enviar otro comprobante.");
      await loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo revisar el comprobante.");
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

  const selectedDelivery = useMemo(
    () => (selectedOrder ? extractOrderDeliveryDetails(selectedOrder) : null),
    [selectedOrder]
  );

  const selectedItems = useMemo(() => {
    if (!selectedOrder) return [];
    return getOrderItems(selectedOrder).map((item) => {
      const productId = extractOrderItemProductId(item);
      const fallbackProduct = productId ? productsById.get(productId) : undefined;
      return {
        raw: item,
        extracted: extractOrderItemDetails(item, fallbackProduct, categoryNameById),
      };
    });
  }, [selectedOrder, productsById, categoryNameById]);

  const selectedTotalUnits = useMemo(
    () => selectedItems.reduce((sum, entry) => sum + (entry.extracted.quantity || 1), 0),
    [selectedItems]
  );

  useEffect(() => {
    setCopiedDelivery(false);
  }, [selectedOrder?.id]);

  async function handleCopyDelivery() {
    if (!selectedDelivery?.copyText) return;
    try {
      await navigator.clipboard.writeText(selectedDelivery.copyText);
      setCopiedDelivery(true);
      window.setTimeout(() => setCopiedDelivery(false), 2000);
    } catch {
      // Ignorar si el navegador bloquea el portapapeles
    }
  }

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
                        {formatDop(order.totalDOP ?? order.total, order.totalDOPFormatted ?? order.totalFormatted)}
                      </td>
                      <td className="text-right">
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <select
                            className="inline-select"
                            aria-label={`Estado de orden ${order.orderNumber || order.id}`}
                            value={currentSelectValue}
                            disabled={busyId === order.id || (order.paymentMethod === "bank_transfer" && order.paymentStatus !== "verified")}
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

      {selectedOrder && selectedDelivery && (
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
              <section className="order-detail-section">
                <div className="order-detail-section-head">
                  <h3 className="order-detail-section-title">Datos de entrega</h3>
                  {selectedDelivery.copyText && (
                    <button
                      type="button"
                      className="order-detail-copy-btn"
                      onClick={() => void handleCopyDelivery()}
                    >
                      {copiedDelivery ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedDelivery ? "Copiado" : "Copiar datos"}</span>
                    </button>
                  )}
                </div>

                {selectedDelivery.fields.length > 0 ? (
                  <dl className="order-detail-grid">
                    {selectedDelivery.fields.map((field) => (
                      <div
                        key={field.key}
                        className={`order-detail-item ${field.wide ? "is-wide" : ""}`}
                      >
                        <dt className="order-detail-label">{field.label}</dt>
                        <dd
                          className={`order-detail-value ${field.tabular ? "tabular" : ""}`}
                        >
                          {field.href ? (
                            <a
                              href={field.href}
                              target="_blank"
                              rel="noreferrer"
                              className="order-detail-link"
                            >
                              <span>{field.value}</span>
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            field.value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="muted-sm" style={{ margin: 0 }}>
                    No se registraron datos de entrega en esta orden.
                  </p>
                )}
              </section>

              <section className="order-detail-section">
                <div className="order-detail-section-head">
                  <h3 className="order-detail-section-title">Resumen y pago</h3>
                </div>

                <dl className="order-detail-grid">
                  <div className="order-detail-item">
                    <dt className="order-detail-label">Fecha del pedido</dt>
                    <dd className="order-detail-value tabular">
                      {formatDateTime(selectedOrder.createdAt)}
                    </dd>
                  </div>

                  <div className="order-detail-item">
                    <dt className="order-detail-label">Estado actual</dt>
                    <dd className="order-detail-value">
                      <span
                        className={`status-text status-${getStatusInfo(selectedOrder.status).tone}`}
                      >
                        {getStatusInfo(selectedOrder.status).label}
                      </span>
                    </dd>
                  </div>

                  {(selectedOrder.subtotalDOP !== undefined ||
                    selectedOrder.subtotal !== undefined ||
                    selectedOrder.subtotalDOPFormatted) && (
                    <div className="order-detail-item">
                      <dt className="order-detail-label">Subtotal</dt>
                      <dd className="order-detail-value tabular">
                        {formatDop(
                          selectedOrder.subtotalDOP ?? selectedOrder.subtotal,
                          selectedOrder.subtotalDOPFormatted
                        )}
                      </dd>
                    </div>
                  )}

                  {(selectedOrder.shippingTotalDOP !== undefined ||
                    selectedOrder.shippingTotalDOPFormatted) && (
                    <div className="order-detail-item">
                      <dt className="order-detail-label">Envío total</dt>
                      <dd className="order-detail-value tabular">
                        {formatDop(
                          selectedOrder.shippingTotalDOP,
                          selectedOrder.shippingTotalDOPFormatted
                        )}
                      </dd>
                    </div>
                  )}

                  {(selectedOrder.couponCode ||
                    selectedOrder.couponDiscountDOP !== undefined ||
                    selectedOrder.couponDiscountDOPFormatted) && (
                    <div className="order-detail-item">
                      <dt className="order-detail-label">Cupón / Descuento</dt>
                      <dd className="order-detail-value tabular">
                        {[
                          selectedOrder.couponCode ? `Código ${selectedOrder.couponCode}` : "",
                          selectedOrder.couponDiscountDOP !== undefined ||
                          selectedOrder.couponDiscountDOPFormatted
                            ? `-${formatDop(
                                selectedOrder.couponDiscountDOP,
                                selectedOrder.couponDiscountDOPFormatted
                              )}`
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </dd>
                    </div>
                  )}

                  <div className="order-detail-item">
                    <dt className="order-detail-label">Total del pedido</dt>
                    <dd className="order-detail-value tabular" style={{ fontWeight: 700 }}>
                      {formatDop(
                        selectedOrder.totalDOP ?? selectedOrder.total,
                        selectedOrder.totalDOPFormatted ?? selectedOrder.totalFormatted
                      )}
                    </dd>
                  </div>

                  {selectedOrder.paymentMethod && (
                    <div className="order-detail-item">
                      <dt className="order-detail-label">Método de pago</dt>
                      <dd className="order-detail-value">
                        {formatPaymentMethod(selectedOrder.paymentMethod)}
                      </dd>
                    </div>
                  )}

                  {selectedOrder.paymentStatus && (
                    <div className="order-detail-item">
                      <dt className="order-detail-label">Estado del pago</dt>
                      <dd className="order-detail-value">
                        {formatPaymentStatus(selectedOrder.paymentStatus)}
                      </dd>
                    </div>
                  )}

                  {selectedOrder.bankAccount && (
                    <div className="order-detail-item is-wide">
                      <dt className="order-detail-label">Cuenta elegida</dt>
                      <dd className="order-detail-value tabular">
                        {[
                          selectedOrder.bankAccount.bankName,
                          selectedOrder.bankAccount.accountType,
                          selectedOrder.bankAccount.accountNumber,
                          selectedOrder.bankAccount.holderName,
                          selectedOrder.bankAccount.holderDocument,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </dd>
                    </div>
                  )}

                  {selectedOrder.paymentMethod === "cash_on_delivery" && (
                    <div className="order-detail-item is-wide">
                      <dt className="order-detail-label">Condiciones de contra entrega</dt>
                      <dd className="order-detail-value">
                        {selectedOrder.cashOnDeliveryAccepted
                          ? "Aceptadas por el cliente"
                          : "No aceptadas"}
                      </dd>
                    </div>
                  )}

                  {typeof selectedOrder.paymentReviewNote === "string" &&
                    selectedOrder.paymentReviewNote && (
                      <div className="order-detail-item is-wide">
                        <dt className="order-detail-label">Nota de revisión</dt>
                        <dd className="order-detail-value">
                          {selectedOrder.paymentReviewNote}
                        </dd>
                      </div>
                    )}
                </dl>

                {selectedOrder.paymentProofObjectName && (
                  <div className="order-detail-item is-wide">
                    <span className="order-detail-label">Comprobante de transferencia</span>
                    {proofImageUrl ? (
                      <>
                        <div>
                          <a
                            href={proofImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="order-detail-link"
                          >
                            <span>Abrir imagen original</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        <a href={proofImageUrl} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proofImageUrl}
                            alt="Comprobante de transferencia del pedido"
                            style={{
                              display: "block",
                              maxWidth: "100%",
                              maxHeight: 360,
                              objectFit: "contain",
                              marginTop: 8,
                              borderRadius: 8,
                            }}
                          />
                        </a>
                      </>
                    ) : (
                      <p className="muted-sm" style={{ margin: 0 }}>
                        Cargando comprobante...
                      </p>
                    )}
                  </div>
                )}

                {selectedOrder.paymentMethod === "bank_transfer" &&
                  selectedOrder.paymentStatus === "proof_submitted" && (
                    <div className="row-actions">
                      <button
                        type="button"
                        className="button-primary"
                        disabled={busyId === selectedOrder.id}
                        onClick={() => void handleTransferReview(selectedOrder, true)}
                      >
                        Confirmar transferencia
                      </button>
                      <button
                        type="button"
                        className="button-danger"
                        disabled={busyId === selectedOrder.id}
                        onClick={() => void handleTransferReview(selectedOrder, false)}
                      >
                        Rechazar comprobante
                      </button>
                    </div>
                  )}

                {selectedOrder.paymentMethod === "bank_transfer" &&
                  selectedOrder.paymentStatus !== "verified" &&
                  selectedOrder.status !== "cancelado" && (
                    <div className="row-actions">
                      <button
                        type="button"
                        className="button-danger"
                        disabled={busyId === selectedOrder.id}
                        onClick={() => void handleStatusChange(selectedOrder, "cancelado")}
                      >
                        Cancelar pedido y liberar inventario
                      </button>
                    </div>
                  )}
              </section>
            </div>

            <label className="field">
              Actualizar estado
              <select
                value={
                  ORDER_STATUSES.some((s) => s.value === selectedOrder.status)
                    ? selectedOrder.status
                    : ""
                }
                disabled={
                  busyId === selectedOrder.id ||
                  (selectedOrder.paymentMethod === "bank_transfer" &&
                    selectedOrder.paymentStatus !== "verified")
                }
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
              <div className="order-items-head">
                <h3 style={{ margin: 0, fontSize: 15 }}>Artículos</h3>
                {selectedItems.length > 0 && (
                  <span className="panel-meta tabular">
                    {selectedTotalUnits}{" "}
                    {selectedTotalUnits === 1 ? "unidad" : "unidades"}
                  </span>
                )}
              </div>
              {selectedItems.length > 0 ? (
                <div className="data-list">
                  {selectedItems.map(({ raw, extracted }, idx) => (
                    <div
                      className="data-row order-item-card"
                      key={`${extracted.productId || idx}-${idx}`}
                    >
                      <div className="order-item-head">
                        {extracted.imageUrl ? (
                          <a
                            href={extracted.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="order-item-thumb-link"
                            title="Ver foto del producto"
                          >
                            <SafeImage
                              src={extracted.imageUrl}
                              alt={extracted.title}
                              className="order-item-thumb"
                              fallbackLabel="Sin foto"
                            />
                          </a>
                        ) : (
                          <SafeImage
                            alt={extracted.title}
                            className="order-item-thumb"
                            fallbackLabel="Sin foto"
                          />
                        )}

                        <div className="order-item-summary">
                          <div className="order-item-title">{extracted.title}</div>
                          <div className="order-item-sub">
                            <span className="order-item-qty tabular">
                              Cant: {extracted.quantity}
                            </span>
                            {extracted.sku && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="mono tabular">SKU: {extracted.sku}</span>
                              </>
                            )}
                            {extracted.unitPrice !== undefined && extracted.quantity > 1 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="tabular">
                                  {formatDop(extracted.unitPrice, raw.priceFormatted)} c/u
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="order-item-pricing tabular">
                          {(extracted.lineTotal !== undefined ||
                            extracted.unitPrice !== undefined ||
                            raw.priceFormatted) && (
                            <div style={{ fontWeight: 600 }}>
                              {formatDop(
                                extracted.lineTotal ?? extracted.unitPrice,
                                raw.priceFormatted
                              )}
                            </div>
                          )}
                          {(extracted.shippingPrice !== undefined ||
                            raw.shippingPriceFormatted) && (
                            <div className="muted-sm">
                              Envío:{" "}
                              {formatDop(
                                extracted.shippingPrice,
                                raw.shippingPriceFormatted
                              )}
                            </div>
                          )}
                          {extracted.discountAmount !== undefined &&
                            extracted.discountAmount > 0 && (
                              <div className="muted-sm">
                                Desc.: -{formatDop(extracted.discountAmount)}
                              </div>
                            )}
                        </div>
                      </div>

                      {extracted.details.length > 0 && (
                        <dl className="order-item-details">
                          {extracted.details.map((detail) => (
                            <div
                              key={detail.key}
                              className={`order-detail-item ${detail.wide ? "is-wide" : ""}`}
                            >
                              <dt className="order-detail-label">{detail.label}</dt>
                              <dd
                                className={`order-detail-value ${detail.tabular ? "tabular" : ""}`}
                              >
                                {detail.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
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
