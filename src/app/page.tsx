"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  Announcement,
  Category,
  listAnnouncements,
  listCategories,
  listMessages,
  listOrders,
  listProducts,
  MessageThread,
  Order,
  ORDER_STATUSES,
  Product,
} from "@/lib/admin-api";
import { subscribeRealtime } from "@/lib/realtime-events";
import { formatCurrencyDOP } from "@/lib/currency";
import { ActiveUsersCard } from "@/components/ActiveUsersCard";

function getOrderStatusMeta(status: string) {
  const found = ORDER_STATUSES.find((item) => item.value === status);
  return found ?? { value: status, label: status || "Sin estado", tone: "muted" };
}

export default function HomePage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        listProducts(token, handleUnauthorized),
        listCategories(token, handleUnauthorized),
        listAnnouncements(token, handleUnauthorized),
        listOrders(token, handleUnauthorized),
        listMessages(token, undefined, handleUnauthorized),
      ]);

      if (results[0].status === "fulfilled") setProducts(results[0].value);
      if (results[1].status === "fulfilled") setCategories(results[1].value);
      if (results[2].status === "fulfilled") setAnnouncements(results[2].value);
      if (results[3].status === "fulfilled") setOrders(results[3].value);
      if (results[4].status === "fulfilled") setThreads(results[4].value);

      const firstError = results.find((r) => r.status === "rejected");
      if (firstError && firstError.status === "rejected") {
        setError(
          firstError.reason instanceof Error
            ? firstError.reason.message
            : "Algunos módulos no respondieron."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => subscribeRealtime(["products", "store_categories", "announcements", "orders", "supportMessages"], () => void loadOverview()), [loadOverview]);

  const publishedProducts = products.filter((p) => p.isActive).length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const activeAnnouncements = announcements.filter((a) => a.isActive).length;
  const openOrders = orders.filter(
    (o) => o.status !== "entregado" && o.status !== "cancelado"
  ).length;

  return (
    <AdminShell
      title="Resumen"
      subtitle="Vista general del catálogo, campañas, pedidos y atención al cliente conectados a la API administrativa."
      actions={
        <button
          type="button"
          className="button-secondary"
          disabled={loading}
          onClick={() => void loadOverview()}
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

      <ActiveUsersCard />

      <section className="kpi-grid" aria-label="Conteos actuales">
        <Link href="/productos" className="kpi-card">
          <span className="kpi-label">Productos</span>
          <span className="kpi-value tabular">{loading ? "—" : products.length}</span>
          <span className="kpi-sub tabular">{publishedProducts} publicados</span>
        </Link>
        <Link href="/categorias" className="kpi-card">
          <span className="kpi-label">Categorías</span>
          <span className="kpi-value tabular">{loading ? "—" : categories.length}</span>
          <span className="kpi-sub tabular">{activeCategories} publicadas</span>
        </Link>
        <Link href="/anuncios" className="kpi-card">
          <span className="kpi-label">Anuncios</span>
          <span className="kpi-value tabular">{loading ? "—" : announcements.length}</span>
          <span className="kpi-sub tabular">{activeAnnouncements} activos</span>
        </Link>
        <Link href="/ordenes" className="kpi-card">
          <span className="kpi-label">Órdenes</span>
          <span className="kpi-value tabular">{loading ? "—" : orders.length}</span>
          <span className="kpi-sub tabular">{openOrders} en curso</span>
        </Link>
        <Link href="/mensajes" className="kpi-card">
          <span className="kpi-label">Conversaciones</span>
          <span className="kpi-value tabular">{loading ? "—" : threads.length}</span>
          <span className="kpi-sub">Mensajes de clientes</span>
        </Link>
      </section>

      <section className="overview-split">
        <div className="panel">
          <div className="panel-header">
            <h2>Órdenes recientes</h2>
            <Link href="/ordenes" className="panel-meta">
              Ver todas →
            </Link>
          </div>
          {loading ? (
            <div style={{ paddingTop: 16 }}>
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No hay órdenes registradas todavía.</p>
            </div>
          ) : (
            <div className="data-list">
              {orders.slice(0, 5).map((order) => {
                const statusMeta = getOrderStatusMeta(order.status);
                return (
                  <div className="data-row" key={order.id}>
                    <div className="row-info">
                      <h3 className="row-title">
                        {order.customerName || order.customerEmail || `Orden #${order.id.slice(0, 8)}`}
                      </h3>
                      <div className="row-meta">
                        <span className="mono tabular">#{order.orderNumber || order.id.slice(0, 8)}</span>
                        <span aria-hidden="true">·</span>
                        <span className={`status-text status-${statusMeta.tone}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>
                    {(order.total ?? order.totalDOP) !== undefined && (
                      <span className="tabular" style={{ fontWeight: 600 }}>
                        {formatCurrencyDOP(order.total ?? order.totalDOP)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Mensajes recientes</h2>
            <Link href="/mensajes" className="panel-meta">
              Abrir bandeja →
            </Link>
          </div>
          {loading ? (
            <div style={{ paddingTop: 16 }}>
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : threads.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No hay conversaciones de clientes todavía.</p>
            </div>
          ) : (
            <div className="data-list">
              {threads.slice(0, 5).map((thread) => (
                <div className="data-row" key={thread.userId}>
                  <div className="row-info">
                    <h3 className="row-title">{thread.userName}</h3>
                    <div className="row-meta">
                      <span>{thread.lastText || "Sin contenido"}</span>
                    </div>
                  </div>
                  <Link href={`/mensajes?user_id=${encodeURIComponent(thread.userId)}`} className="button-secondary">
                    Responder
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-label="Módulos administrativos">
        <div className="module-links">
          <Link href="/productos" className="module-card">
            <div className="module-card-head">
              <span>Productos</span>
              <ArrowRight size={15} />
            </div>
            <p>Crea, edita, publica o elimina productos y su multimedia.</p>
          </Link>
          <Link href="/categorias" className="module-card">
            <div className="module-card-head">
              <span>Categorías</span>
              <ArrowRight size={15} />
            </div>
            <p>Organiza las categorías, imágenes y orden en la tienda móvil.</p>
          </Link>
          <Link href="/anuncios" className="module-card">
            <div className="module-card-head">
              <span>Anuncios y banners</span>
              <ArrowRight size={15} />
            </div>
            <p>Publica promociones, etiquetas, descuentos y banners.</p>
          </Link>
          <Link href="/ordenes" className="module-card">
            <div className="module-card-head">
              <span>Órdenes</span>
              <ArrowRight size={15} />
            </div>
            <p>Consulta pedidos de clientes y actualiza su estado de entrega.</p>
          </Link>
          <Link href="/mensajes" className="module-card">
            <div className="module-card-head">
              <span>Mensajes</span>
              <ArrowRight size={15} />
            </div>
            <p>Revisa consultas de clientes y envía respuestas directas.</p>
          </Link>
          <Link href="/perfil" className="module-card">
            <div className="module-card-head">
              <span>Perfil administrativo</span>
              <ArrowRight size={15} />
            </div>
            <p>Consulta y actualiza los datos de la cuenta administrativa.</p>
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
