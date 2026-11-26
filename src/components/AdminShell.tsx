"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  FolderTree,
  FileText,
  ShieldAlert,
  Building2,
  Truck,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  Ticket,
  UserCog,
  X,
} from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";
import { PreviewCookieBanner } from "./PreviewCookieBanner";
import { getApiBase } from "@/lib/admin-api";

const NAV_ITEMS = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/categorias", label: "Categorías", icon: FolderTree },
  { href: "/anuncios", label: "Anuncios", icon: Megaphone },
  { href: "/cupones", label: "Cupones", icon: Ticket },
  { href: "/cuentas-bancarias", label: "Cuentas bancarias", icon: Building2 },
  { href: "/contra-entrega", label: "Pago contra entrega", icon: Truck },
  { href: "/ordenes", label: "Órdenes", icon: ShoppingBag },
  { href: "/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/politicas", label: "Políticas", icon: FileText },
  { href: "/moderacion", label: "Moderación", icon: ShieldAlert },
  { href: "/perfil", label: "Perfil", icon: UserCog },
];

type AdminShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  fixedHeight?: boolean;
  children: ReactNode;
};

export function AdminShell({
  title,
  subtitle,
  actions,
  fixedHeight = false,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const { user, token, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let retryDelay = 1000;

    const connect = () => {
      if (disposed) return;
      const apiBase = getApiBase();
      if (!apiBase) {
        reconnectTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
        return;
      }
      const wsBase = apiBase.replace(/^https:/i, "wss:").replace(/^http:/i, "ws:");
      try {
        socket = new WebSocket(`${wsBase}/api/admin/events/ws`);
      } catch {
        reconnectTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
        return;
      }
      socket.onopen = () => {
        retryDelay = 1000;
        socket?.send(JSON.stringify({ token }));
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data));
          if (payload.type === "data_changed" && typeof payload.collection === "string") {
            window.dispatchEvent(new CustomEvent("elegan:realtime", { detail: payload }));
          }
        } catch {
          // Ignorar eventos que no correspondan al contrato.
        }
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (disposed) return;
        reconnectTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
      };
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [token]);

  const displayName =
    (typeof user?.name === "string" && user.name) ||
    (typeof user?.email === "string" && user.email) ||
    "Administrador";

  return (
    <div className="workspace">
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar-head">
          <Link href="/" className="brand-mark" onClick={() => setMobileOpen(false)}>
            Elegan
          </Link>
          <button
            type="button"
            className="icon-button mobile-only"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación administrativa">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "is-active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-identity">
            <span className="admin-name">{displayName}</span>
            {typeof user?.email === "string" && user.email !== displayName && (
              <span className="admin-email">{user.email}</span>
            )}
          </div>
          <button
            type="button"
            className="button-secondary button-logout"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            <LogOut size={15} />
            <span>{loggingOut ? "Saliendo..." : "Cerrar sesión"}</span>
          </button>
        </div>
      </aside>

      <div className={`workspace-main ${fixedHeight ? "is-fixed-viewport" : ""}`}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button mobile-only"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="topbar-heading">
              <div className="breadcrumb">
                <span>Administración</span>
                <span aria-hidden="true">/</span>
                <span>{title}</span>
              </div>
              <h1>{title}</h1>
            </div>
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </header>

        <main className={`workspace-content ${fixedHeight ? "is-fixed-viewport" : ""}`}>
          <PreviewCookieBanner />
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
