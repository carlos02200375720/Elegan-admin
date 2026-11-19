"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  UserCog,
  X,
} from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";

const NAV_ITEMS = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/categorias", label: "Categorías", icon: FolderTree },
  { href: "/anuncios", label: "Anuncios", icon: Megaphone },
  { href: "/ordenes", label: "Órdenes", icon: ShoppingBag },
  { href: "/mensajes", label: "Mensajes", icon: MessageSquare },
  { href: "/perfil", label: "Perfil", icon: UserCog },
];

type AdminShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminShell({ title, subtitle, actions, children }: AdminShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
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

      <div className="workspace-main">
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

        <main className="workspace-content">
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
