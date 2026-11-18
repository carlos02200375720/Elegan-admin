"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  stock?: number;
  isActive?: boolean;
};

type Category = { id: string; name: string; isActive?: boolean };

type UploadedMedia = {
  url: string;
  objectName: string;
  contentType: string;
  size: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function ProductosPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("todo");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [publication, setPublication] = useState("draft");
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

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
      try {
        const categoryResponse = await fetch(`${API_BASE}/api/admin/categories`, {
          headers: { Authorization: `Bearer ${authToken}` },
          cache: "no-store",
        });
        if (categoryResponse.ok) {
          const categoryData: { items?: Category[] } = await categoryResponse.json();
          setCategories(categoryData.items ?? []);
        }
      } catch {
        // La carga de productos no depende de que el listado de categorías esté disponible.
      }
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

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const available = Math.max(0, 10 - photos.length);
    if (selected.length > available) {
      setError("Puedes seleccionar hasta 10 fotografías por producto.");
    } else {
      setError("");
    }
    setPhotos((current) => [...current, ...selected].slice(0, 10));
    event.target.value = "";
  }

  function selectVideo(event: ChangeEvent<HTMLInputElement>) {
    setVideo(event.target.files?.[0] ?? null);
  }

  async function uploadMedia(file: File): Promise<UploadedMedia> {
    if (!API_BASE) throw new Error("Falta configurar NEXT_PUBLIC_API_BASE_URL.");
    const form = new FormData();
    form.append("file", file);
    form.append("name", file.name);
    const response = await fetch(`${API_BASE}/api/admin/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await response.json();
    if (!response.ok || !data.url) {
      throw new Error(data.detail || `No se pudo subir ${file.name} (HTTP ${response.status}).`);
    }
    return data as UploadedMedia;
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !API_BASE) return;
    if (photos.length === 0) {
      setError("Selecciona al menos una fotografía para el producto.");
      return;
    }
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const uploadedPhotos: UploadedMedia[] = [];
      for (const photo of photos) uploadedPhotos.push(await uploadMedia(photo));
      const uploadedVideo = video ? await uploadMedia(video) : null;
      const imageUrls = uploadedPhotos.map((item) => item.url);

      const response = await fetch(`${API_BASE}/api/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          price: Number(price),
          stock: Number(stock),
          sizes: sizes.split(",").map((value) => value.trim()).filter(Boolean),
          colors: colors.split(",").map((value) => value.trim()).filter(Boolean),
          imageUrl: imageUrls[0],
          images: imageUrls,
          videoUrl: uploadedVideo?.url ?? "",
          hasVideo: Boolean(uploadedVideo),
          isActive: publication === "published",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("elegan_admin_token");
          setToken("");
          setProducts([]);
        }
        throw new Error(data.detail || `No se pudo guardar el producto (HTTP ${response.status}).`);
      }
      setNotice(`Producto "${name.trim()}" ${publication === "published" ? "publicado" : "guardado como borrador"} correctamente.`);
      setName("");
      setDescription("");
      setCategory("todo");
      setPrice("");
      setStock("10");
      setSizes("");
      setColors("");
      setPublication("draft");
      setPhotos([]);
      setVideo(null);
      const photoInput = document.getElementById("product-photos") as HTMLInputElement | null;
      const videoInput = document.getElementById("product-video") as HTMLInputElement | null;
      if (photoInput) photoInput.value = "";
      if (videoInput) videoInput.value = "";
      await loadProducts(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el producto.");
    } finally {
      setCreating(false);
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
          <p className="muted">Crea productos y controla cuáles aparecen en la tienda móvil.</p>
        </div>
        <div className="header-actions">
          <a className="back-link" href="/">Inicio</a>
          <button className="button-secondary" type="button" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="products-panel create-panel">
        <div className="list-heading">
          <h2>Crear producto</h2>
          <span>Fotografías y video opcional</span>
        </div>
        <form className="product-form" onSubmit={createProduct}>
          <div className="form-grid">
            <label className="field field-wide">
              Nombre del producto
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required />
            </label>
            <label className="field">
              Categoría
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="todo">Todo / Sin categoría</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}{item.isActive ? "" : " (borrador)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Precio
              <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
            </label>
            <label className="field">
              Inventario
              <input type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} required />
            </label>
            <label className="field">
              Tallas (separadas por coma)
              <input value={sizes} onChange={(event) => setSizes(event.target.value)} placeholder="S, M, L, XL" />
            </label>
            <label className="field">
              Colores (separados por coma)
              <input value={colors} onChange={(event) => setColors(event.target.value)} placeholder="Negro, blanco, azul" />
            </label>
            <label className="field field-wide">
              Descripción
              <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="field field-wide">
              Fotografías del producto (puedes seleccionar varias)
              <input id="product-photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={selectPhotos} required />
              <small>{photos.length ? `${photos.length}/10 fotografía(s) seleccionada(s)` : "Selecciona hasta 10 fotografías. Formatos: JPG, PNG, WEBP o GIF. Máximo 100 MB por archivo."}</small>
              {photos.length > 0 && (
                <button className="button-secondary" type="button" onClick={() => setPhotos([])}>
                  Quitar todas las fotografías
                </button>
              )}
            </label>
            <label className="field field-wide">
              Video del producto (opcional)
              <input id="product-video" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={selectVideo} />
              <small>{video ? video.name : "Formatos: MP4, WEBM o MOV. Máximo 100 MB."}</small>
            </label>
            <label className="field">
              Estado inicial
              <select value={publication} onChange={(event) => setPublication(event.target.value)}>
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </label>
          </div>
          <button className="create-button" type="submit" disabled={creating}>
            {creating ? "Subiendo archivos y guardando..." : publication === "published" ? "Crear y publicar producto" : "Guardar como borrador"}
          </button>
        </form>
      </section>

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
                <p>{product.category || "Sin categoría"} · {Number(product.price ?? 0).toLocaleString("es-DO")}</p>
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
