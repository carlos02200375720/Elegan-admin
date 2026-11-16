"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  stock?: number;
  isActive?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function ProductosPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async (authToken: string) => {
    if (!API_BASE) {
      setError("Falta configurar NEXT_PUBLIC_API_BASE_URL.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/products`, {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("elegan_admin_token");
          setToken("");
          setProducts([]);
          throw new Error("La sesión no es válida o no tiene permisos administrativos. Inicia sesión otra vez.");
        }
        throw new Error(`No se pudieron cargar los productos (HTTP ${response.status}).`);
      }
      const data: { items?: Product[] } = await response.json();
      setProducts(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("elegan_admin_token");
    if (savedToken) {
      setToken(savedToken);
      void loadProducts(savedToken);
    }
  }, [loadProducts]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("Falta configurar NEXT_PUBLIC_API_BASE_URL.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.detail === "ACCESS_DENIED"
          ? "Esta cuenta no tiene permisos de administrador."
          : "No se pudo iniciar sesión. Revisa el correo y la contraseña.");
      }
      sessionStorage.setItem("elegan_admin_token", data.token);
      setToken(data.token);
      setPassword("");
      await loadProducts(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de inicio de sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function changePublication(product: Product, isActive: boolean) {
    if (!token || !API_BASE) return;
    setBusyId(product.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive }),
        },
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("elegan_admin_token");
          setToken("");
          setProducts([]);
        }
        throw new Error(`No se pudo cambiar el estado (HTTP ${response.status}).`);
      }
      setProducts((current) => current.map((item) =>
        item.id === product.id ? { ...item, isActive } : item
      ));
      setNotice(`${product.name}: ${isActive ? "publicado" : "guardado como borrador"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el producto.");
    } finally {
      setBusyId("");
    }
  }

  function logout() {
    sessionStorage.removeItem("elegan_admin_token");
    setToken("");
    setProducts([]);
    setNotice("");
    setError("");
  }

  if (!token) {
    return (
      <main className="admin-page">
        <section className="login-panel">
          <p className="eyebrow">ELEGAN · ADMINISTRACIÓN</p>
          <h1>Acceso administrativo</h1>
          <p className="muted">Inicia sesión con una cuenta autorizada para administrar la tienda.</p>
          <form className="login-form" onSubmit={login}>
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="username" value={email}
              onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" autoComplete="current-password" value={password}
              onChange={(event) => setPassword(event.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? "Conectando..." : "Iniciar sesión"}</button>
          </form>
          {error && <p className="message error" role="alert">{error}</p>}
          <a className="back-link" href="/">Volver al inicio</a>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="products-header">
        <div>
          <p className="eyebrow">ELEGAN · CATÁLOGO</p>
          <h1>Productos</h1>
          <p className="muted">Controla cuáles productos aparecen en la tienda móvil.</p>
        </div>
        <div className="header-actions">
          <a className="back-link" href="/">Inicio</a>
          <button className="button-secondary" type="button" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="products-panel">
        <div className="list-heading">
          <h2>Todos los productos</h2>
          <span>{products.length} productos</span>
        </div>
        {loading && <p className="muted">Cargando productos...</p>}
        {!loading && products.length === 0 && !error && (
          <p className="empty-state">Todavía no hay productos registrados.</p>
        )}
        <div className="product-list">
          {products.map((product) => (
            <article className="product-row" key={product.id}>
              {product.imageUrl
                ? <img className="product-image" src={product.imageUrl} alt="" />
                : <div className="product-image image-placeholder">Sin imagen</div>}
              <div className="product-info">
                <h3>{product.name}</h3>
                <p>{product.category || "Sin categoría"} · {Number(product.price ?? 0).toLocaleString("es-DO", { style: "currency", currency: "DOP" })}</p>
                <span className={product.isActive ? "state published" : "state draft"}>
                  {product.isActive ? "Publicado" : "Borrador"}
                </span>
              </div>
              <label className="publication-control">
                <span>Estado</span>
                <select
                  aria-label={`Estado de publicación de ${product.name}`}
                  value={product.isActive ? "published" : "draft"}
                  disabled={busyId === product.id}
                  onChange={(event) => void changePublication(product, event.target.value === "published")}
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </label>
            </article>
          ))}
        </div>
        {error && <p className="message error" role="alert">{error}</p>}
        {notice && <p className="message success" role="status">{notice}</p>}
      </section>
    </main>
  );
}
