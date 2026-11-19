"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { SafeImage } from "@/components/SafeImage";
import {
  Announcement,
  AnnouncementCreateInput,
  AnnouncementUpdateInput,
  Category,
  Product,
  listCategories,
  listProducts,
  createAnnouncementItem,
  deleteAnnouncementItem,
  listAnnouncements,
  updateAnnouncementItem,
  uploadAdminMedia,
} from "@/lib/admin-api";

export default function AnunciosPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [destinationType, setDestinationType] = useState<"category" | "product">("category");
  const [destinationId, setDestinationId] = useState("");
  const [editDestinationType, setEditDestinationType] = useState<"category" | "product">("category");
  const [editDestinationId, setEditDestinationId] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [customId, setCustomId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [discount, setDiscount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // Edit drawer
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const list = await listAnnouncements(token, handleUnauthorized);
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar anuncios.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    if (!token) return;
    Promise.all([listCategories(token, handleUnauthorized), listProducts(token, handleUnauthorized)])
      .then(([categoryList, productList]) => { setCategories(categoryList); setProducts(productList); })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar categorías y productos."));
  }, [token, handleUnauthorized]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("El título del anuncio es obligatorio.");
      return;
    }

    if (!destinationId) { setError("Selecciona la categoría o el producto al que llevará el anuncio."); return; }
    setCreating(true);
    setError("");
    setNotice("");
    try {
      let resolvedImageUrl = imageUrl.trim();
      if (imageFile) {
        const uploaded = await uploadAdminMedia(imageFile, token, handleUnauthorized);
        resolvedImageUrl = uploaded.url;
      }

      const payload: AnnouncementCreateInput = {
        title: trimmedTitle,
        description: description.trim(),
        imageUrl: resolvedImageUrl,
        tag: tag.trim(),
        discount: discount.trim(),
        isActive,
        destinationType,
        destinationId,
      };
      if (customId.trim()) {
        payload.id = customId.trim();
      }

      await createAnnouncementItem(payload, token, handleUnauthorized);
      setNotice(`Anuncio "${trimmedTitle}" creado correctamente.`);
      setCustomId("");
      setTitle("");
      setDescription("");
      setTag("");
      setDiscount("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview("");
      setDestinationType("category");
      setDestinationId("");
      setIsActive(true);
      setShowCreate(false);
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el anuncio.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(item: Announcement, nextActive: boolean) {
    if (!token) return;
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await updateAnnouncementItem(
        item.id,
        { isActive: nextActive },
        token,
        handleUnauthorized
      );
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, isActive: nextActive } : entry
        )
      );
      setNotice(`${item.title}: ${nextActive ? "activado" : "desactivado"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el anuncio.");
    } finally {
      setBusyId("");
    }
  }

  function openEdit(item: Announcement) {
    setEditing(item);
    setEditTitle(item.title ?? "");
    setEditDescription(item.description ?? "");
    setEditTag(item.tag ?? "");
    setEditDiscount(item.discount ?? "");
    setEditImageUrl(item.imageUrl ?? "");
    setEditImageFile(null);
    setEditImagePreview(item.imageUrl ?? "");
    setEditActive(Boolean(item.isActive));
    setEditDestinationType(item.destinationType === "product" ? "product" : "category");
    setEditDestinationId(String(item.destinationId ?? item.targetCategory ?? item.category ?? ""));
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !editing) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setError("El título del anuncio no puede estar vacío.");
      return;
    }

    if (!editDestinationId) { setError("Selecciona la categoría o el producto al que llevará el anuncio."); return; }
    setSavingEdit(true);
    setError("");
    setNotice("");
    try {
      let resolvedImageUrl = editImageUrl.trim();
      if (editImageFile) {
        const uploaded = await uploadAdminMedia(editImageFile, token, handleUnauthorized);
        resolvedImageUrl = uploaded.url;
      }

      const payload: AnnouncementUpdateInput = {
        title: trimmedTitle,
        description: editDescription.trim(),
        imageUrl: resolvedImageUrl,
        tag: editTag.trim(),
        discount: editDiscount.trim(),
        isActive: editActive,
        destinationType: editDestinationType,
        destinationId: editDestinationId,
      };

      await updateAnnouncementItem(editing.id, payload, token, handleUnauthorized);
      setNotice(`Anuncio "${trimmedTitle}" actualizado.`);
      setEditing(null);
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el anuncio.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(item: Announcement) {
    if (!token) return;
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await deleteAnnouncementItem(item.id, token, handleUnauthorized);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editing?.id === item.id) setEditing(null);
      setNotice(`Anuncio "${item.title}" eliminado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el anuncio.");
    } finally {
      setBusyId("");
    }
  }

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categories]);

  const productNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const prod of products) {
      map.set(prod.id, prod.name);
    }
    return map;
  }, [products]);

  const getDestinationLabel = useCallback(
    (item: Announcement) => {
      const rawId = String(
        item.destinationId ?? item.targetCategory ?? item.category ?? ""
      ).trim();
      if (!rawId) return "Sin destino";

      const looksLikeId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId) ||
        (/^[a-zA-Z0-9_-]{16,}$/.test(rawId) && !rawId.includes(" "));

      if (item.destinationType === "product") {
        const productName = productNameById.get(rawId);
        if (productName) return `Producto: ${productName}`;
        return looksLikeId ? "Producto: No encontrado" : `Producto: ${rawId}`;
      }

      const categoryName = categoryNameById.get(rawId);
      if (categoryName) return `Categoría: ${categoryName}`;
      return looksLikeId ? "Categoría: No encontrada" : `Categoría: ${rawId}`;
    },
    [categoryNameById, productNameById]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.tag ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q) ||
        getDestinationLabel(item).toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter, getDestinationLabel]);

  return (
    <AdminShell
      title="Anuncios"
      subtitle="Gestiona los banners promocionales, etiquetas y descuentos visibles en la aplicación móvil."
      actions={
        <button
          type="button"
          className="button-primary"
          onClick={() => setShowCreate((prev) => !prev)}
        >
          <Plus size={15} />
          <span>{showCreate ? "Cerrar formulario" : "Nuevo anuncio"}</span>
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

      {showCreate && (
        <section className="panel">
          <div className="panel-header">
            <h2>Crear anuncio</h2>
            <span className="panel-meta">Banner promocional</span>
          </div>
          <form className="admin-form" onSubmit={handleCreate}>
            <div className="form-grid">
              <label className="field field-wide">
                Título
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Oferta especial"
                  required
                />
              </label>
              <label className="field">
                Etiqueta (tag)
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Oferta"
                />
              </label>
              <label className="field">
                Descuento
                <input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="20%"
                />
              </label>
              <label className="field">
                ID personalizado (opcional)
                <input
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="Dejar vacío para autogenerar"
                />
              </label>
              <label className="field">
                Estado
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>
              <label className="field field-wide">
                Descripción
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del anuncio"
                />
              </label>
              <div className="field field-wide">
                <span>Imagen del banner (subir archivo)</span>
                <label className="image-picker" htmlFor="announcement-image">
                  {imagePreview || imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview || imageUrl}
                      alt="Vista previa del anuncio"
                    />
                  ) : (
                    <span>Seleccionar imagen del dispositivo</span>
                  )}
                </label>
                <input
                  id="announcement-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                <label className="field field-wide">
                  Dirigir al cliente a
                  <select value={destinationType} onChange={(e) => { setDestinationType(e.target.value as "category" | "product"); setDestinationId(""); }}>
                    <option value="category">Una categoría</option>
                    <option value="product">Un producto individual</option>
                  </select>
                  <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)} required>
                    <option value="">Selecciona {destinationType === "category" ? "una categoría" : "un producto"}</option>
                    {destinationType === "category"
                      ? categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)
                      : products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                  <small>Al tocar el anuncio, el cliente será dirigido a esta selección.</small>
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="button-primary" disabled={creating}>
                {creating ? "Guardando..." : "Guardar anuncio"}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Anuncios y banners</h2>
          <span className="panel-meta tabular">
            {filtered.length} de {items.length}
          </span>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              type="search"
              placeholder="Buscar por título o etiqueta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar anuncios"
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
            <button
              type="button"
              className={`segmented-btn ${statusFilter === "active" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("active")}
            >
              Activos
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === "inactive" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("inactive")}
            >
              Inactivos
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ paddingTop: 16 }}>
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="muted">
              {items.length === 0
                ? "Todavía no hay anuncios publicados."
                : "Ningún anuncio coincide con los filtros."}
            </p>
            {items.length === 0 && (
              <button
                type="button"
                className="button-primary"
                onClick={() => setShowCreate(true)}
              >
                Crear primer anuncio
              </button>
            )}
          </div>
        ) : (
          <div className="data-list">
            {filtered.map((item) => (
              <article className="data-row" key={item.id}>
                <div className="row-main">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    className="thumb-banner"
                  />
                  <div className="row-info">
                    <h3 className="row-title">{item.title}</h3>
                    <p
                      className="row-description-clamp"
                      title={item.description || undefined}
                    >
                      {item.description || "Sin descripción"}
                    </p>
                    <div className="row-meta">
                      {item.tag && (
                        <>
                          <span>{item.tag}</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      {item.discount && (
                        <>
                          <span className="tabular">{item.discount}</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      <span>{getDestinationLabel(item)}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`status-text ${
                          item.isActive ? "status-success" : "status-muted"
                        }`}
                      >
                        {item.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row-actions">
                  <select
                    className="inline-select"
                    aria-label={`Estado de ${item.title}`}
                    value={item.isActive ? "active" : "inactive"}
                    disabled={busyId === item.id}
                    onChange={(e) =>
                      void handleToggleActive(item, e.target.value === "active")
                    }
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busyId === item.id}
                    onClick={() => openEdit(item)}
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </button>
                  <DeleteConfirmButton
                    disabled={busyId === item.id}
                    onConfirm={() => handleDelete(item)}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Editar anuncio ${editing.title}`}
        >
          <div className="drawer-panel">
            <div className="drawer-head">
              <h2>Editar anuncio</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Cerrar panel"
                onClick={() => setEditing(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="admin-form" style={{ paddingTop: 0 }} onSubmit={handleSaveEdit}>
              <div className="form-grid">
                <label className="field field-wide">
                  Título
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  Etiqueta
                  <input
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                  />
                </label>
                <label className="field">
                  Descuento
                  <input
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(e.target.value)}
                  />
                </label>
                <label className="field field-wide">
                  Estado
                  <select
                    value={editActive ? "active" : "inactive"}
                    onChange={(e) => setEditActive(e.target.value === "active")}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </label>
                <label className="field field-wide">
                  Descripción
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </label>
                <div className="field field-wide">
                  <span>Imagen del banner</span>
                  <label className="image-picker" htmlFor="edit-announcement-image">
                    {editImagePreview || editImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editImagePreview || editImageUrl}
                        alt="Vista previa"
                      />
                    ) : (
                      <span>Seleccionar nueva imagen</span>
                    )}
                  </label>
                  <input
                    id="edit-announcement-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setEditImageFile(file);
                      if (file) setEditImagePreview(URL.createObjectURL(file));
                    }}
                  />
                  <label className="field field-wide">
                    Dirigir al cliente a
                    <select value={editDestinationType} onChange={(e) => { setEditDestinationType(e.target.value as "category" | "product"); setEditDestinationId(""); }}>
                      <option value="category">Una categoría</option>
                      <option value="product">Un producto individual</option>
                    </select>
                    <select value={editDestinationId} onChange={(e) => setEditDestinationId(e.target.value)} required>
                      <option value="">Selecciona {editDestinationType === "category" ? "una categoría" : "un producto"}</option>
                      {editDestinationType === "category"
                        ? categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)
                        : products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="button-primary" disabled={savingEdit}>
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
