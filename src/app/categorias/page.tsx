"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function CategoriasPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [publication, setPublication] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCategories = useCallback(async (authToken: string) => {
    if (!API_BASE) { setError("Falta configurar NEXT_PUBLIC_API_BASE_URL."); return; }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("elegan_admin_token");
          setToken("");
          setCategories([]);
        }
        throw new Error(`No se pudieron cargar las categorías (HTTP ${response.status}).`);
      }
      const data: { items?: Category[] } = await response.json();
      setCategories(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar categorías.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("elegan_admin_token");
    if (saved) { setToken(saved); void loadCategories(saved); }
  }, [loadCategories]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) { setError("Falta configurar NEXT_PUBLIC_API_BASE_URL."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) throw new Error("No se pudo iniciar sesión con esta cuenta administrativa.");
      sessionStorage.setItem("elegan_admin_token", data.token);
      setToken(data.token); setPassword("");
      await loadCategories(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de inicio de sesión.");
    } finally { setLoading(false); }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !API_BASE) return;
    setLoading(true); setError(""); setNotice("");
    try {
      let uploadedImageUrl = "";
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        uploadData.append("name", imageFile.name);
        const uploadResponse = await fetch(`${API_BASE}/api/admin/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.url) {
          throw new Error(uploadResult.detail || `No se pudo subir la imagen (HTTP ${uploadResponse.status}).`);
        }
        uploadedImageUrl = uploadResult.url;
      }

      const response = await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(), description: description.trim(), imageUrl: uploadedImageUrl,
          sortOrder: Number(sortOrder), isActive: publication === "published",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail === "CATEGORY_ALREADY_EXISTS"
        ? "Ya existe una categoría con ese nombre." : data.detail || `No se pudo guardar (HTTP ${response.status}).`);
      setName(""); setDescription(""); setImageFile(null); setImagePreview("");
      setSortOrder("0"); setPublication("draft");
      setNotice(`Categoría "${name.trim()}" ${publication === "published" ? "publicada" : "guardada como borrador"}.`);
      await loadCategories(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
    } finally { setLoading(false); }
  }

  async function updateCategory(category: Category, changes: Partial<Category>) {
    if (!token || !API_BASE) return;
    setBusyId(category.id); setError(""); setNotice("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/categories/${encodeURIComponent(category.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error(`No se pudo actualizar (HTTP ${response.status}).`);
      setCategories(current => current.map(item => item.id === category.id ? { ...item, ...changes } : item));
      setNotice(`${category.name}: ${changes.isActive === undefined ? "actualizada" : changes.isActive ? "publicada" : "guardada como borrador"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally { setBusyId(""); }
  }

  async function deleteCategory(category: Category) {
    if (!token || !API_BASE || !window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    setBusyId(category.id); setError(""); setNotice("");
    try {
      const response = await fetch(`${API_BASE}/api/admin/categories/${encodeURIComponent(category.id)}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`No se pudo eliminar (HTTP ${response.status}).`);
      setCategories(current => current.filter(item => item.id !== category.id));
      setNotice(`Categoría "${category.name}" eliminada.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally { setBusyId(""); }
  }

  function logout() {
    sessionStorage.removeItem("elegan_admin_token"); setToken(""); setCategories([]);
  }

  if (!token) return (
    <main className="admin-page"><section className="login-panel">
      <p className="eyebrow">ELEGAN · ADMINISTRACIÓN</p><h1>Acceso administrativo</h1>
      <p className="muted">Inicia sesión con una cuenta autorizada para administrar la tienda.</p>
      <form className="login-form" onSubmit={login}>
        <label htmlFor="category-email">Correo electrónico</label>
        <input id="category-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label htmlFor="category-password">Contraseña</label>
        <input id="category-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</button>
      </form>
      {error && <p className="message error" role="alert">{error}</p>}
      <a className="back-link" href="/">Volver al inicio</a>
    </section></main>
  );

  return (
    <main className="admin-page">
      <header className="products-header">
        <div><p className="eyebrow">ELEGAN · CATÁLOGO</p><h1>Categorías</h1>
          <p className="muted">Crea y administra las categorías que aparecen en la tienda móvil.</p></div>
        <div className="header-actions"><a className="back-link" href="/">Inicio</a>
          <button className="button-secondary" type="button" onClick={logout}>Cerrar sesión</button></div>
      </header>
      <section className="products-panel create-panel">
        <div className="list-heading"><h2>Crear categoría</h2><span>Borrador o publicada</span></div>
        <form className="product-form" onSubmit={saveCategory}>
          <div className="form-grid">
            <label className="field field-wide">Nombre de la categoría
              <input value={name} onChange={e => setName(e.target.value)} maxLength={100} required placeholder="Ej. Calzado" /></label>
            <label className="field field-wide">Descripción
              <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={300} placeholder="Describe esta categoría" /></label>
            <div className="field field-wide">
              <span>Imagen de la categoría</span>
              <label className="image-picker" htmlFor="category-image">
                {imagePreview ? <img src={imagePreview} alt="Vista previa de la categoría" /> : <span>Seleccionar imagen de la galería</span>}
              </label>
              <input
                id="category-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={event => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);
                  setImagePreview(file ? URL.createObjectURL(file) : "");
                }}
              />
              <small>Elige una imagen desde tu dispositivo. Se subirá a Google Cloud Storage al guardar.</small>
            </div>
            <label className="field">Orden de aparición
              <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} /></label>
            <label className="field">Estado
              <select value={publication} onChange={e => setPublication(e.target.value)}>
                <option value="draft">Borrador</option><option value="published">Publicar</option>
              </select></label>
          </div>
          <button className="create-button" type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar categoría"}</button>
        </form>
      </section>
      <section className="products-panel">
        <div className="list-heading"><h2>Categorías guardadas</h2><span>{categories.length} en total</span></div>
        {loading && <p className="empty-state">Cargando...</p>}
        {!loading && categories.length === 0 && <p className="empty-state">Todavía no hay categorías creadas.</p>}
        {categories.map(category => <article className="product-row" key={category.id}>
          <div className="product-info"><h3>{category.name}</h3>
            <p>{category.description || "Sin descripción"} · Orden: {category.sortOrder ?? 0}</p>
            <span className={`state ${category.isActive ? "published" : "draft"}`}>{category.isActive ? "Publicada" : "Borrador"}</span>
          </div>
          <div className="publication-control"><label>Estado</label>
            <select value={category.isActive ? "published" : "draft"} disabled={busyId === category.id}
              onChange={e => void updateCategory(category, { isActive: e.target.value === "published" })}>
              <option value="draft">Borrador</option><option value="published">Publicada</option>
            </select></div>
          <button className="button-secondary" type="button" disabled={busyId === category.id} onClick={() => void deleteCategory(category)}>Eliminar</button>
        </article>)}
      </section>
      {error && <p className="message error" role="alert">{error}</p>}
      {notice && <p className="message success" role="status">{notice}</p>}
    </main>
  );
}
