"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, RotateCcw, Search, X } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { SafeImage } from "@/components/SafeImage";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { PreviewCookieBanner } from "@/components/PreviewCookieBanner";
import {
  Category,
  createProductItem,
  deleteProductItem,
  getProductById,
  listCategories,
  listProducts,
  Product,
  ShippingMethod,
  updateProductItem,
  uploadAdminMedia,
} from "@/lib/admin-api";

function formatProductPrice(value: number): string {
  const integer = Math.round(Number(value) || 0);
  return `RD$ ${integer.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

type ShippingMethodDraft = Omit<ShippingMethod, "price"> & {
  price: string;
};

function toShippingMethodDrafts(methods?: ShippingMethod[]): ShippingMethodDraft[] {
  if (!Array.isArray(methods)) return [];
  return methods.map((method) => ({
    ...method,
    price:
      method.price !== undefined &&
      method.price !== null &&
      Number.isFinite(Number(method.price))
        ? String(method.price)
        : "",
  }));
}

function parseShippingMethods(methods: ShippingMethodDraft[]): ShippingMethod[] | null {
  const parsed: ShippingMethod[] = [];
  for (const method of methods) {
    const rawPrice = method.price.trim();
    const numericPrice = Number(rawPrice);
    if (
      !method.name.trim() ||
      !method.deliveryTime.trim() ||
      !method.origin.trim() ||
      rawPrice === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return null;
    }
    parsed.push({
      id: method.id,
      name: method.name.trim(),
      price: numericPrice,
      deliveryTime: method.deliveryTime.trim(),
      origin: method.origin.trim(),
    });
  }
  return parsed;
}

function getProductImages(product: Product | null): string[] {
  if (!product) return [];
  const list = Array.isArray(product.images)
    ? product.images
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean)
    : [];
  if (list.length > 0) return list;
  const cover = typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
  return cover ? [cover] : [];
}

export default function ProductosPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
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
  const [category, setCategory] = useState("todo");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodDraft[]>([]);
  const [allowCashOnDelivery, setAllowCashOnDelivery] = useState(true);
  const [publication, setPublication] = useState("draft");
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  // Detail & Edit drawer (GET /products/{id} + PATCH /products/{id})
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("todo");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("0");
  const [editSizes, setEditSizes] = useState("");
  const [editColors, setEditColors] = useState("");
  const [editShippingMethods, setEditShippingMethods] = useState<ShippingMethodDraft[]>([]);
  const [editAllowCashOnDelivery, setEditAllowCashOnDelivery] = useState(true);
  const [editActive, setEditActive] = useState(false);
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editPhotos, setEditPhotos] = useState<File[]>([]);
  const [editVideo, setEditVideo] = useState<File | null>(null);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const editPhotosInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [productList, categoryList] = await Promise.all([
        listProducts(token, handleUnauthorized),
        listCategories(token, handleUnauthorized).catch(() => [] as Category[]),
      ]);
      setProducts(productList);
      setCategories(categoryList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const photoPreviews = useMemo(
    () =>
      photos.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [photos]
  );

  useEffect(() => {
    return () => {
      photoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [photoPreviews]);

  const videoPreviewUrl = useMemo(
    () => (video ? URL.createObjectURL(video) : ""),
    [video]
  );

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const editPhotoPreviews = useMemo(
    () =>
      editPhotos.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [editPhotos]
  );

  useEffect(() => {
    return () => {
      editPhotoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [editPhotoPreviews]);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  function removePhotoAt(index: number) {
    setPhotos((current) => current.filter((_, idx) => idx !== index));
  }

  function selectVideo(event: ChangeEvent<HTMLInputElement>) {
    setVideo(event.target.files?.[0] ?? null);
  }

  function clearVideo() {
    setVideo(null);
    const input = document.getElementById("product-video") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (photos.length === 0) {
      setError("Selecciona al menos una fotografía para el producto.");
      return;
    }
    const parsedShippingMethods = parseShippingMethods(shippingMethods);
    if (shippingMethods.length === 0 || !parsedShippingMethods) {
      setError("Configura al menos un método de envío completo y con un precio válido.");
      return;
    }
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const uploadedPhotos = [];
      for (const photo of photos) {
        uploadedPhotos.push(await uploadAdminMedia(photo, token, handleUnauthorized));
      }
      const uploadedVideo = video
        ? await uploadAdminMedia(video, token, handleUnauthorized)
        : null;
      const imageUrls = uploadedPhotos.map((item) => item.url);

      await createProductItem(
        {
          name: name.trim(),
          description: description.trim(),
          category,
          price: Number(price),
          stock: Number(stock),
          sizes: sizes
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          colors: colors
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          shippingMethods: parsedShippingMethods,
          allowCashOnDelivery,
          imageUrl: imageUrls[0],
          images: imageUrls,
          videoUrl: uploadedVideo?.url ?? "",
          hasVideo: Boolean(uploadedVideo),
          isActive: publication === "published",
        },
        token,
        handleUnauthorized
      );

      setNotice(
        `Producto "${name.trim()}" ${publication === "published" ? "publicado" : "guardado como borrador"} correctamente.`
      );
      setName("");
      setDescription("");
      setCategory("todo");
      setPrice("");
      setStock("10");
      setSizes("");
      setColors("");
      setShippingMethods([]);
      setAllowCashOnDelivery(true);
      setPublication("draft");
      setPhotos([]);
      setVideo(null);
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el producto.");
    } finally {
      setCreating(false);
    }
  }

  async function handleQuickPublication(product: Product, isActive: boolean) {
    if (!token) return;
    setBusyId(product.id);
    setError("");
    setNotice("");
    try {
      await updateProductItem(product.id, { isActive }, token, handleUnauthorized);
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, isActive } : item))
      );
      setNotice(`${product.name}: ${isActive ? "publicado" : "guardado como borrador"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el producto.");
    } finally {
      setBusyId("");
    }
  }

  function closeEditDrawer() {
    setEditingProduct(null);
    setEditExistingImages([]);
    setEditPhotos([]);
    setEditVideo(null);
    setEditError("");
  }

  function selectEditPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > 0) {
      setEditPhotos((current) => [...current, ...selected]);
      setEditError("");
    }
    event.target.value = "";
  }

  function removeEditExistingImageAt(index: number) {
    setEditExistingImages((current) => current.filter((_, idx) => idx !== index));
    setEditError("");
  }

  function removeEditNewPhotoAt(index: number) {
    setEditPhotos((current) => current.filter((_, idx) => idx !== index));
    setEditError("");
  }

  function restoreEditExistingImages() {
    if (!editingProduct) return;
    setEditExistingImages(getProductImages(editingProduct));
    setEditError("");
  }

  async function openEditDrawer(product: Product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description ?? "");
    setEditCategory(product.category ?? "todo");
    setEditPrice(product.price !== undefined ? String(product.price) : "");
    setEditStock(product.stock !== undefined ? String(product.stock) : "0");
    setEditSizes(Array.isArray(product.sizes) ? product.sizes.join(", ") : "");
    setEditColors(Array.isArray(product.colors) ? product.colors.join(", ") : "");
    setEditShippingMethods(toShippingMethodDrafts(product.shippingMethods));
    setEditAllowCashOnDelivery(product.allowCashOnDelivery !== false);
    setEditActive(Boolean(product.isActive));
    setEditExistingImages(getProductImages(product));
    setEditPhotos([]);
    setEditVideo(null);
    setEditError("");

    if (!token) return;
    setLoadingDetail(true);
    try {
      const detail = await getProductById(product.id, token, handleUnauthorized);
      setEditingProduct(detail);
      setEditName(detail.name ?? product.name);
      setEditDescription(detail.description ?? "");
      setEditCategory(detail.category ?? "todo");
      setEditPrice(detail.price !== undefined ? String(detail.price) : "");
      setEditStock(detail.stock !== undefined ? String(detail.stock) : "0");
      setEditSizes(Array.isArray(detail.sizes) ? detail.sizes.join(", ") : "");
      setEditColors(Array.isArray(detail.colors) ? detail.colors.join(", ") : "");
      setEditShippingMethods(toShippingMethodDrafts(detail.shippingMethods));
      setEditAllowCashOnDelivery(detail.allowCashOnDelivery !== false);
      setEditActive(Boolean(detail.isActive));
      setEditExistingImages(getProductImages(detail));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo consultar el detalle completo del producto.";
      setEditError(message);
      setError(message);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !editingProduct) return;
    const parsedEditShippingMethods = parseShippingMethods(editShippingMethods);
    if (!parsedEditShippingMethods) {
      setEditError("Completa todos los métodos de envío con un precio válido.");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    setError("");
    setNotice("");
    try {
      const payload: Record<string, unknown> = {
        name: editName.trim(),
        description: editDescription.trim(),
        category: editCategory,
        price: Number(editPrice),
        stock: Number(editStock),
        sizes: editSizes
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        colors: editColors
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        shippingMethods: parsedEditShippingMethods,
        allowCashOnDelivery: editAllowCashOnDelivery,
        isActive: editActive,
      };

      const originalImages = getProductImages(editingProduct);
      const existingChanged =
        editExistingImages.length !== originalImages.length ||
        editExistingImages.some((url, idx) => url !== originalImages[idx]);

      if (existingChanged || editPhotos.length > 0) {
        const uploadedUrls: string[] = [];
        for (const file of editPhotos) {
          const uploaded = await uploadAdminMedia(file, token, handleUnauthorized);
          uploadedUrls.push(uploaded.url);
        }
        const finalImages = [...editExistingImages, ...uploadedUrls];
        payload.images = finalImages;
        payload.imageUrl = finalImages[0] ?? "";
      }

      if (editVideo) {
        const uploadedVid = await uploadAdminMedia(editVideo, token, handleUnauthorized);
        payload.videoUrl = uploadedVid.url;
        payload.hasVideo = true;
      }

      await updateProductItem(editingProduct.id, payload, token, handleUnauthorized);
      setNotice(`Producto "${editName.trim()}" actualizado correctamente.`);
      closeEditDrawer();
      await loadData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar el producto.";
      setEditError(message);
      setError(message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!token) return;
    setBusyId(product.id);
    setError("");
    setNotice("");
    try {
      await deleteProductItem(product.id, token, handleUnauthorized);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingProduct?.id === product.id) closeEditDrawer();
      setNotice(`Producto "${product.name}" eliminado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el producto.");
    } finally {
      setBusyId("");
    }
  }

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of categories) {
      map.set(item.id, item.name);
    }
    return map;
  }, [categories]);

  const getCategoryLabel = useCallback(
    (categoryValue?: string) => {
      const trimmed = categoryValue?.trim();
      if (!trimmed || trimmed.toLowerCase() === "todo") {
        return "Sin categoría";
      }
      const matched = categoryNameById.get(trimmed);
      if (matched) return matched;
      const looksLikeId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed) ||
        (/^[a-zA-Z0-9_-]{16,}$/.test(trimmed) && !trimmed.includes(" "));
      return looksLikeId ? "Categoría no encontrada" : trimmed;
    },
    [categoryNameById]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((item) => {
      if (statusFilter === "published" && !item.isActive) return false;
      if (statusFilter === "draft" && item.isActive) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        getCategoryLabel(item.category).toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, statusFilter, getCategoryLabel]);

  return (
    <AdminShell
      title="Productos"
      subtitle="Crea productos, consulta su detalle, actualiza precios o multimedia y controla su publicación en la tienda."
      actions={
        <button
          type="button"
          className="button-primary"
          onClick={() => setShowCreate((prev) => !prev)}
        >
          <Plus size={15} />
          <span>{showCreate ? "Cerrar formulario" : "Nuevo producto"}</span>
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
            <h2>Crear producto</h2>
            <span className="panel-meta">Fotografías y video opcional</span>
          </div>
          <form className="admin-form" onSubmit={handleCreateProduct}>
            <div className="form-grid">
              <label className="field field-wide">
                Nombre del producto
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  required
                />
              </label>
              <label className="field">
                Categoría
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="todo">Todo / Sin categoría</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.isActive ? "" : " (borrador)"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Precio
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Inventario
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Estado inicial
                <select
                  value={publication}
                  onChange={(e) => setPublication(e.target.value)}
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </label>
              <label className="field">
                Tallas (separadas por coma)
                <input
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                  placeholder="S, M, L, XL"
                />
              </label>
              <label className="field">
                Colores (separados por coma)
                <input
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  placeholder="Negro, blanco, azul"
                />
              </label>
              <div className="field-wide">
                <ToggleSwitch
                  checked={allowCashOnDelivery}
                  onChange={setAllowCashOnDelivery}
                  title="Pago contra entrega"
                  description="Permitir que este producto se pague al momento de la entrega."
                />
              </div>
              <div className="field field-wide">
                <strong>Métodos de envío</strong>
                <small>Configura las opciones que el cliente podrá elegir. Cada método incluye precio, entrega y origen.</small>
                {shippingMethods.map((method, index) => (
                  <div className="form-grid" key={method.id} style={{ border: "1px solid #e5ddd5", borderRadius: 10, padding: 12, marginTop: 10 }}>
                    <label className="field">Método
                      <input value={method.name} required placeholder="Envío estándar" onChange={(e) => setShippingMethods((items) => items.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} />
                    </label>
                    <label className="field">Precio (DOP)
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={method.price} required onChange={(e) => setShippingMethods((items) => items.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} />
                    </label>
                    <label className="field">Tiempo de entrega
                      <input value={method.deliveryTime} required placeholder="5–7 días" onChange={(e) => setShippingMethods((items) => items.map((item, i) => i === index ? { ...item, deliveryTime: e.target.value } : item))} />
                    </label>
                    <label className="field">Origen
                      <input value={method.origin} required placeholder="Santo Domingo" onChange={(e) => setShippingMethods((items) => items.map((item, i) => i === index ? { ...item, origin: e.target.value } : item))} />
                    </label>
                    <button type="button" className="button-secondary" onClick={() => setShippingMethods((items) => items.filter((_, i) => i !== index))}>Eliminar método</button>
                  </div>
                ))}
                <button type="button" className="button-secondary" style={{ marginTop: 10 }} disabled={shippingMethods.length >= 12} onClick={() => setShippingMethods((items) => [...items, { id: crypto.randomUUID(), name: "", price: "", deliveryTime: "", origin: "" }])}>Añadir método de envío</button>
              </div>
              <label className="field field-wide">
                Descripción
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <div className="field field-wide">
                <label htmlFor="product-photos">
                  Fotografías del producto (hasta 10)
                </label>
                <input
                  id="product-photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={selectPhotos}
                  required={photos.length === 0}
                />
                <small>
                  {photos.length
                    ? `${photos.length}/10 fotografía(s) seleccionada(s)`
                    : "Formatos: JPG, PNG, WEBP o GIF."}
                </small>
                {photoPreviews.length > 0 && (
                  <>
                    <div className="media-preview-grid" aria-label="Vista previa de fotografías">
                      {photoPreviews.map((item, idx) => (
                        <div className="media-preview-card" key={`${item.file.name}-${idx}`}>
                          <div className="media-preview-frame">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.url}
                              alt={`Vista previa ${idx + 1}: ${item.file.name}`}
                              className="media-preview-img"
                            />
                            <button
                              type="button"
                              className="media-preview-remove"
                              aria-label={`Quitar ${item.file.name}`}
                              onClick={() => removePhotoAt(idx)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="media-preview-caption">
                            <span className="media-preview-name" title={item.file.name}>
                              {item.file.name}
                            </span>
                            <span className="media-preview-meta tabular">
                              {idx === 0 ? "Portada · " : ""}
                              {formatFileSize(item.file.size)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => setPhotos([])}
                      >
                        Quitar fotografías
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="field field-wide">
                <label htmlFor="product-video">Video del producto (opcional)</label>
                <input
                  id="product-video"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={selectVideo}
                />
                <small>
                  {video
                    ? `${video.name} · ${formatFileSize(video.size)}`
                    : "Formatos: MP4, WEBM o MOV."}
                </small>
                {video && videoPreviewUrl && (
                  <div className="media-video-preview" aria-label="Vista previa de video">
                    <video
                      src={videoPreviewUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="media-video-player"
                    />
                    <div className="media-video-bar">
                      <span className="media-preview-name" title={video.name}>
                        {video.name}
                      </span>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={clearVideo}
                      >
                        Quitar video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button className="button-primary" type="submit" disabled={creating}>
                {creating
                  ? "Subiendo y guardando..."
                  : publication === "published"
                    ? "Crear y publicar producto"
                    : "Guardar como borrador"}
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
          <h2>Todos los productos</h2>
          <span className="panel-meta tabular">{filteredProducts.length} de {products.length}</span>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              type="search"
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar productos"
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
              className={`segmented-btn ${statusFilter === "published" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("published")}
            >
              Publicados
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
            <div className="skeleton-row" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p className="muted">
              {products.length === 0
                ? "Todavía no hay productos registrados."
                : "Ningún producto coincide con los filtros actuales."}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                className="button-primary"
                onClick={() => setShowCreate(true)}
              >
                Crear primer producto
              </button>
            )}
          </div>
        ) : (
          <div className="data-list">
            {filteredProducts.map((product) => (
              <article className="data-row" key={product.id}>
                <div className="row-main">
                  <SafeImage src={product.imageUrl} alt={product.name} />
                  <div className="row-info">
                    <h3 className="row-title">{product.name}</h3>
                    <div className="row-meta">
                      <span>{getCategoryLabel(product.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular">
                        {typeof product.priceFormatted === "string" && product.priceFormatted
                          ? `RD$ ${product.priceFormatted}`
                          : formatProductPrice(product.price ?? 0)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular">Stock: {product.stock ?? 0}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`status-text ${
                          product.isActive ? "status-success" : "status-muted"
                        }`}
                      >
                        {product.isActive ? "Publicado" : "Borrador"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row-actions">
                  <select
                    className="inline-select"
                    aria-label={`Estado de publicación de ${product.name}`}
                    value={product.isActive ? "published" : "draft"}
                    disabled={busyId === product.id}
                    onChange={(e) =>
                      void handleQuickPublication(product, e.target.value === "published")
                    }
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                  </select>
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={busyId === product.id}
                    onClick={() => void openEditDrawer(product)}
                  >
                    <Pencil size={14} />
                    <span>Editar</span>
                  </button>
                  <DeleteConfirmButton
                    disabled={busyId === product.id}
                    onConfirm={() => handleDeleteProduct(product)}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editingProduct && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Editar ${editingProduct.name}`}
        >
          <div className="drawer-panel">
            <div className="drawer-head">
              <h2>Detalle y edición</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Cerrar panel"
                onClick={closeEditDrawer}
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <p className="message error" role="alert">
                {editError}
              </p>
            )}
            <PreviewCookieBanner onResolved={() => setEditError("")} />

            {loadingDetail ? (
              <p className="muted">Cargando detalle completo del producto...</p>
            ) : (
              <form className="admin-form" style={{ paddingTop: 0 }} onSubmit={handleSaveEdit}>
                <div className="media-manager">
                  <div className="media-manager-head">
                    <div className="media-manager-title">
                      <strong>Imágenes del producto</strong>
                      <small className="muted-sm tabular">
                        {editExistingImages.length + editPhotoPreviews.length} imagen(es) en total
                        {editPhotoPreviews.length > 0
                          ? ` · ${editExistingImages.length} actual(es), ${editPhotoPreviews.length} nueva(s)`
                          : ""}
                      </small>
                    </div>
                    <div className="media-manager-actions">
                      {editExistingImages.length < getProductImages(editingProduct).length && (
                        <button
                          type="button"
                          className="button-secondary"
                          disabled={savingEdit}
                          onClick={restoreEditExistingImages}
                        >
                          <RotateCcw size={14} />
                          <span>Restaurar actuales</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={savingEdit}
                        onClick={() => editPhotosInputRef.current?.click()}
                      >
                        <ImagePlus size={15} />
                        <span>Agregar imágenes</span>
                      </button>
                      <input
                        ref={editPhotosInputRef}
                        id="edit-product-photos"
                        type="file"
                        className="sr-only-input"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        disabled={savingEdit}
                        onChange={selectEditPhotos}
                      />
                    </div>
                  </div>

                  {editExistingImages.length === 0 && editPhotoPreviews.length === 0 ? (
                    <div className="media-empty-box">
                      Este producto no tiene imágenes. Usa &ldquo;Agregar imágenes&rdquo; para subir las que necesites.
                    </div>
                  ) : (
                    <div
                      className="media-preview-grid"
                      aria-label="Galería de imágenes del producto"
                    >
                      {editExistingImages.map((url, idx) => (
                        <div className="media-preview-card" key={`existing-${url}-${idx}`}>
                          <div className="media-preview-frame">
                            <SafeImage
                              src={url}
                              alt={`${editingProduct.name} imagen ${idx + 1}`}
                              className="media-preview-img"
                            />
                            <button
                              type="button"
                              className="media-preview-remove"
                              title="Eliminar imagen"
                              aria-label={`Eliminar imagen actual ${idx + 1}`}
                              onClick={() => removeEditExistingImageAt(idx)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="media-preview-caption">
                            <span className="media-preview-name">
                              {idx === 0 ? "Portada" : `Imagen ${idx + 1}`}
                            </span>
                            <span className="media-preview-meta">Actual</span>
                          </div>
                        </div>
                      ))}

                      {editPhotoPreviews.map((item, idx) => {
                        const isCover = editExistingImages.length === 0 && idx === 0;
                        return (
                          <div
                            className="media-preview-card"
                            key={`new-${item.file.name}-${item.file.size}-${idx}`}
                          >
                            <div className="media-preview-frame">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.url}
                                alt={`Nueva imagen: ${item.file.name}`}
                                className="media-preview-img"
                              />
                              <button
                                type="button"
                                className="media-preview-remove"
                                title="Quitar imagen"
                                aria-label={`Quitar nueva imagen ${item.file.name}`}
                                onClick={() => removeEditNewPhotoAt(idx)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="media-preview-caption">
                              <span className="media-preview-name" title={item.file.name}>
                                {item.file.name}
                              </span>
                              <span className="media-preview-meta tabular">
                                {isCover ? "Portada · " : ""}
                                Nueva · {formatFileSize(item.file.size)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <small className="muted-sm">
                    Elimina las imágenes que no quieras conservar y agrega todas las nuevas que desees. La primera imagen se mostrará como portada al guardar.
                  </small>
                </div>

                <div className="form-grid">
                  <label className="field field-wide">
                    Nombre
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </label>
                  <label className="field">
                    Categoría
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      <option value="todo">Todo / Sin categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Estado
                    <select
                      value={editActive ? "published" : "draft"}
                      onChange={(e) => setEditActive(e.target.value === "published")}
                    >
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                    </select>
                  </label>
                  <label className="field">
                    Precio
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    Inventario
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    Tallas
                    <input
                      value={editSizes}
                      onChange={(e) => setEditSizes(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Colores
                    <input
                      value={editColors}
                      onChange={(e) => setEditColors(e.target.value)}
                    />
                  </label>
                  <div className="field-wide">
                    <ToggleSwitch
                      checked={editAllowCashOnDelivery}
                      onChange={setEditAllowCashOnDelivery}
                      title="Pago contra entrega"
                      description="Permitir que este producto se pague al momento de la entrega."
                    />
                  </div>
                  <div className="field field-wide">
                    <strong>Métodos de envío</strong>
                    <small>El cliente podrá elegir una de estas opciones antes de comprar.</small>
                    {editShippingMethods.map((method, index) => (
                      <div className="form-grid" key={method.id} style={{ border: "1px solid #e5ddd5", borderRadius: 10, padding: 12, marginTop: 10 }}>
                        <label className="field">Método
                          <input value={method.name} required onChange={(e) => setEditShippingMethods((items) => items.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} />
                        </label>
                        <label className="field">Precio (DOP)
                          <input type="number" min="0" step="0.01" placeholder="0.00" value={method.price} required onChange={(e) => setEditShippingMethods((items) => items.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} />
                        </label>
                        <label className="field">Tiempo de entrega
                          <input value={method.deliveryTime} required onChange={(e) => setEditShippingMethods((items) => items.map((item, i) => i === index ? { ...item, deliveryTime: e.target.value } : item))} />
                        </label>
                        <label className="field">Origen
                          <input value={method.origin} required onChange={(e) => setEditShippingMethods((items) => items.map((item, i) => i === index ? { ...item, origin: e.target.value } : item))} />
                        </label>
                        <button type="button" className="button-secondary" onClick={() => setEditShippingMethods((items) => items.filter((_, i) => i !== index))}>Eliminar método</button>
                      </div>
                    ))}
                    <button type="button" className="button-secondary" style={{ marginTop: 10 }} disabled={editShippingMethods.length >= 12} onClick={() => setEditShippingMethods((items) => [...items, { id: crypto.randomUUID(), name: "", price: "", deliveryTime: "", origin: "" }])}>Añadir método de envío</button>
                  </div>
                  <label className="field field-wide">
                    Descripción
                    <textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </label>
                  <label className="field field-wide">
                    Reemplazar video (opcional)
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setEditVideo(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Guardando cambios..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={closeEditDrawer}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
