"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { SafeImage } from "@/components/SafeImage";
import {
  Category,
  createCategoryItem,
  deleteCategoryItem,
  listCategories,
  updateCategoryItem,
  uploadAdminMedia,
} from "@/lib/admin-api";
import { subscribeRealtime } from "@/lib/realtime-events";

export default function CategoriasPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [publication, setPublication] = useState("draft");
  const [creating, setCreating] = useState(false);

  // Edit drawer
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editActive, setEditActive] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const items = await listCategories(token, handleUnauthorized);
      setCategories(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar categorías.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => subscribeRealtime(["store_categories"], () => void loadCategories()), [loadCategories]);

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setCreating(true);
    setError("");
    setNotice("");
    try {
      let uploadedImageUrl = "";
      if (imageFile) {
        const uploaded = await uploadAdminMedia(imageFile, token, handleUnauthorized);
        uploadedImageUrl = uploaded.url;
      }

      await createCategoryItem(
        {
          name: name.trim(),
          description: description.trim(),
          imageUrl: uploadedImageUrl,
          sortOrder: Number(sortOrder),
          isActive: publication === "published",
        },
        token,
        handleUnauthorized
      );

      setNotice(
        `Categoría "${name.trim()}" ${publication === "published" ? "publicada" : "guardada como borrador"}.`
      );
      setName("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      setSortOrder("0");
      setPublication("draft");
      setShowCreate(false);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
    } finally {
      setCreating(false);
    }
  }

  async function handleQuickStatus(category: Category, isActive: boolean) {
    if (!token) return;
    setBusyId(category.id);
    setError("");
    setNotice("");
    try {
      await updateCategoryItem(category.id, { isActive }, token, handleUnauthorized);
      setCategories((current) =>
        current.map((item) => (item.id === category.id ? { ...item, isActive } : item))
      );
      setNotice(
        `${category.name}: ${isActive ? "publicada" : "guardada como borrador"}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusyId("");
    }
  }

  function openEditDrawer(category: Category) {
    setEditing(category);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
    setEditSortOrder(String(category.sortOrder ?? 0));
    setEditActive(Boolean(category.isActive));
    setEditImageFile(null);
    setEditImagePreview(category.imageUrl ?? "");
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !editing) return;
    setSavingEdit(true);
    setError("");
    setNotice("");
    try {
      const payload: Record<string, unknown> = {
        name: editName.trim(),
        description: editDescription.trim(),
        sortOrder: Number(editSortOrder),
        isActive: editActive,
      };
      if (editImageFile) {
        const uploaded = await uploadAdminMedia(editImageFile, token, handleUnauthorized);
        payload.imageUrl = uploaded.url;
      }

      await updateCategoryItem(editing.id, payload, token, handleUnauthorized);
      setNotice(`Categoría "${editName.trim()}" actualizada.`);
      setEditing(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la categoría.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    if (!token) return;
    setBusyId(category.id);
    setError("");
    setNotice("");
    try {
      await deleteCategoryItem(category.id, token, handleUnauthorized);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editing?.id === category.id) setEditing(null);
      setNotice(`Categoría "${category.name}" eliminada.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar.");
    } finally {
      setBusyId("");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((item) => {
      if (statusFilter === "published" && !item.isActive) return false;
      if (statusFilter === "draft" && item.isActive) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [categories, search, statusFilter]);

  return (
    <AdminShell
      title="Categorías"
      subtitle="Crea, ordena, edita y publica las categorías que aparecen en la tienda móvil."
      actions={
        <button
          type="button"
          className="button-primary"
          onClick={() => setShowCreate((prev) => !prev)}
        >
          <Plus size={15} />
          <span>{showCreate ? "Cerrar formulario" : "Nueva categoría"}</span>
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
            <h2>Crear categoría</h2>
            <span className="panel-meta">Borrador o publicada</span>
          </div>
          <form className="admin-form" onSubmit={handleSaveCategory}>
            <div className="form-grid">
              <label className="field field-wide">
                Nombre de la categoría
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                  placeholder="Ej. Calzado"
                />
              </label>
              <label className="field field-wide">
                Descripción
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={300}
                  placeholder="Describe esta categoría"
                />
              </label>
              <div className="field field-wide">
                <span>Imagen de la categoría</span>
                <label className="image-picker" htmlFor="category-image">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Vista previa de la categoría" />
                  ) : (
                    <span>Seleccionar imagen de la galería</span>
                  )}
                </label>
                <input
                  id="category-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                <small>Se subirá a multimedia del backend al guardar.</small>
              </div>
              <label className="field">
                Orden de aparición
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </label>
              <label className="field">
                Estado
                <select
                  value={publication}
                  onChange={(e) => setPublication(e.target.value)}
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicar</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button className="button-primary" type="submit" disabled={creating}>
                {creating ? "Guardando..." : "Guardar categoría"}
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
          <h2>Categorías guardadas</h2>
          <span className="panel-meta tabular">
            {filtered.length} de {categories.length}
          </span>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              type="search"
              placeholder="Buscar categorías..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar categorías"
            />
          </div>
          <div className="segmented-control" role="tablist" aria-label="Filtrar estado">
            <button
              type="button"
              className={`segmented-btn ${statusFilter === "all" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Todas
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === "published" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("published")}
            >
              Publicadas
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === "draft" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("draft")}
            >
              Borradores
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
              {categories.length === 0
                ? "Todavía no hay categorías creadas."
                : "Ninguna categoría coincide con tu búsqueda."}
            </p>
            {categories.length === 0 && (
              <button
                type="button"
                className="button-primary"
                onClick={() => setShowCreate(true)}
              >
                Crear primera categoría
              </button>
            )}
          </div>
        ) : (
          <div className="data-list">
            {filtered.map((category) => (
              <article className="data-row" key={category.id}>
                <div className="row-main">
                  <SafeImage src={category.imageUrl} alt={category.name} />
                  <div className="row-info">
                    <h3 className="row-title">{category.name}</h3>
                    <div className="row-meta">
                      <span>{category.description || "Sin descripción"}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular">Orden: {category.sortOrder ?? 0}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`status-text ${
                          category.isActive ? "status-success" : "status-muted"
                        }`}
                      >
                        {category.isActive ? "Publicada" : "Borrador"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row-actions">
                  <select
                    className="inline-select"
                    aria-label={`Estado de ${category.name}`}
                    value={category.isActive ? "published" : "draft"}
                    disabled={busyId === category.id}
                    onChange={(e) =>
                      void handleQuickStatus(category, e.target.value === "published")
                    }
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicada</option>
                  </select>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busyId === category.id}
                    onClick={() => openEditDrawer(category)}
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </button>
                  <DeleteConfirmButton
                    disabled={busyId === category.id}
                    onConfirm={() => handleDeleteCategory(category)}
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
          aria-label={`Editar categoría ${editing.name}`}
        >
          <div className="drawer-panel">
            <div className="drawer-head">
              <h2>Editar categoría</h2>
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
                  Nombre
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </label>
                <label className="field field-wide">
                  Descripción
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength={300}
                  />
                </label>
                <label className="field">
                  Orden
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(e.target.value)}
                  />
                </label>
                <label className="field">
                  Estado
                  <select
                    value={editActive ? "published" : "draft"}
                    onChange={(e) => setEditActive(e.target.value === "published")}
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicada</option>
                  </select>
                </label>
                <div className="field field-wide">
                  <span>Imagen</span>
                  <label className="image-picker" htmlFor="edit-category-image">
                    {editImagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editImagePreview} alt="Vista previa" />
                    ) : (
                      <span>Seleccionar nueva imagen</span>
                    )}
                  </label>
                  <input
                    id="edit-category-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setEditImageFile(file);
                      if (file) setEditImagePreview(URL.createObjectURL(file));
                    }}
                  />
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
