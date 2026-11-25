export const TOKEN_STORAGE_KEY = "elegan_admin_token";
export const PREVIEW_COOKIE_BLOCKED_EVENT = "elegan:preview-cookie-blocked";
export const PREVIEW_COOKIE_CLEARED_EVENT = "elegan:preview-cookie-cleared";

let runtimeApiBase = "";
let preferDirectBackend = false;

function normalizeApiBase(raw?: string): string {
  const trimmed = (raw ?? "").trim();
  if (!/^https?:\/\//i.test(trimmed)) return "";
  return trimmed
    .replace(/\/+$/, "")
    .replace(/\/api\/admin$/i, "")
    .replace(/\/api$/i, "");
}

export function setRuntimeApiBase(url?: string): void {
  const normalized = normalizeApiBase(url);
  if (normalized) {
    runtimeApiBase = normalized;
  }
}

export function getApiBase(): string {
  return runtimeApiBase || normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL);
}

export function isPreviewCookieCheckError(err: unknown): boolean {
  if (!(err instanceof AdminApiError)) return false;
  if (!err.detail || typeof err.detail !== "object") return false;
  return Boolean((err.detail as Record<string, unknown>).cookieCheck);
}

let previewCookieBlocked = false;

export function isPreviewCookieBlocked(): boolean {
  return previewCookieBlocked;
}

function emitPreviewCookieEvent(name: string): void {
  previewCookieBlocked = name === PREVIEW_COOKIE_BLOCKED_EVENT;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

export async function requestPreviewStorageAccess(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const doc = document as Document & {
    requestStorageAccess?: () => Promise<void>;
  };
  if (typeof doc.requestStorageAccess !== "function") return false;
  try {
    await doc.requestStorageAccess();
    return true;
  } catch {
    return false;
  }
}

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class AdminApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.detail = detail;
  }
}

export type AdminUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  phone?: string;
  address?: string;
  city?: string;
  [key: string]: unknown;
};

export type ShippingMethod = {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  origin: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  priceFormatted?: string;
  stock?: number;
  sizes?: string[];
  colors?: string[];
  shippingMethods?: ShippingMethod[];
  allowCashOnDelivery?: boolean;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  hasVideo?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Announcement = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  tag?: string;
  discount?: string;
  destinationType?: "category" | "product";
  destinationId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type AnnouncementCreateInput = {
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  tag?: string;
  discount?: string;
  destinationType?: "category" | "product";
  destinationId?: string;
  isActive?: boolean;
};

export type AnnouncementUpdateInput = {
  title?: string;
  description?: string;
  imageUrl?: string;
  tag?: string;
  discount?: string;
  destinationType?: "category" | "product";
  destinationId?: string;
  isActive?: boolean;
};

export const ORDER_STATUSES = [
  { value: "confirmado", label: "Confirmado", tone: "info" },
  { value: "en_proceso", label: "En proceso", tone: "warning" },
  { value: "enviado", label: "Enviado", tone: "info" },
  { value: "entregado", label: "Entregado", tone: "success" },
  { value: "cancelado", label: "Cancelado", tone: "danger" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export type OrderItem = {
  productId?: string;
  name?: string;
  title?: string;
  quantity?: number;
  price?: number;
  priceDOP?: string | number;
  priceFormatted?: string;
  size?: string;
  color?: string;
  imageUrl?: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  shippingPriceDOP?: string | number;
  shippingPriceFormatted?: string;
  shippingDeliveryTime?: string;
  shippingOrigin?: string;
};

export type Order = {
  id: string;
  orderNumber?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  status: string;
  total?: number;
  totalFormatted?: string;
  totalDOP?: string | number;
  totalDOPFormatted?: string;
  subtotalDOP?: string | number;
  subtotalDOPFormatted?: string;
  shippingTotalDOP?: string | number;
  shippingTotalDOPFormatted?: string;
  couponCode?: string;
  couponDiscountDOP?: string | number;
  couponDiscountDOPFormatted?: string;
  paymentMethod?: "bank_transfer" | "cash_on_delivery" | string;
  paymentStatus?: string;
  paymentProofObjectName?: string;
  bankAccount?: { bankName?: string; accountNumber?: string; accountType?: string; holderName?: string; holderDocument?: string };
  cashOnDeliveryAccepted?: boolean;
  subtotal?: number;
  items?: OrderItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type AdminProfile = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  role?: string;
  [key: string]: unknown;
};

export type AdminProfileUpdate = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
};

export type MessageItem = {
  id?: string;
  userId?: string;
  user_id?: string;
  userName?: string;
  userEmail?: string;
  sender?: string;
  senderRole?: string;
  fromAdmin?: boolean;
  isAdmin?: boolean;
  text: string;
  createdAt?: string;
  timestamp?: string;
  [key: string]: unknown;
};

export type MessageThread = {
  userId: string;
  userName: string;
  userEmail?: string;
  lastText: string;
  lastAt?: string;
  messages: MessageItem[];
};

export type UploadedMedia = {
  url: string;
  objectName?: string;
  contentType?: string;
  size?: number;
};

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.detail === "string") {
      if (obj.detail === "ACCESS_DENIED") {
        return "Esta cuenta no tiene permisos de administrador.";
      }
      if (obj.detail === "CATEGORY_ALREADY_EXISTS") {
        return "Ya existe una categoría con ese nombre.";
      }
      if (obj.detail === "COUPON_ALREADY_EXISTS") {
        return "Ya existe un cupón con ese código.";
      }
      if (obj.detail === "COUPON_NOT_FOUND") {
        return "El cupón ya no existe.";
      }
      return obj.detail;
    }
    if (Array.isArray(obj.detail) && obj.detail.length > 0) {
      const first = obj.detail[0] as Record<string, unknown>;
      const loc = Array.isArray(first?.loc) ? first.loc.join(".") : "";
      const msg = typeof first?.msg === "string" ? first.msg : "Datos inválidos.";
      return loc ? `${loc}: ${msg}` : msg;
    }
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  return `Error en la solicitud (HTTP ${status}).`;
}

function isHtmlPayload(contentType: string, text: string): boolean {
  if (/text\/html/i.test(contentType)) return true;
  const trimmed = text.trimStart();
  return /^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed);
}

function extractHtmlTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function safeUrlPath(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname || rawUrl;
  } catch {
    return rawUrl;
  }
}

function parseResponseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchDirectBackend<T>(
  apiBase: string,
  path: string,
  init: RequestInit,
  requestHeaders: Headers,
  onUnauthorized?: () => void
): Promise<{ ok: true; data: T } | { ok: false; apiError?: AdminApiError }> {
  const directUrl = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(directUrl, {
      ...init,
      headers: requestHeaders,
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    return { ok: false };
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const parsed = parseResponseBody(text);

  if (response.ok && isHtmlPayload(contentType, text)) {
    return { ok: false };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      onUnauthorized?.();
    }
    return {
      ok: false,
      apiError: new AdminApiError(
        extractErrorMessage(parsed, response.status),
        response.status,
        parsed
      ),
    };
  }

  return { ok: true, data: (parsed ?? {}) as T };
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit & { token?: string; onUnauthorized?: () => void } = {}
): Promise<T> {
  const { token, onUnauthorized, headers, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const apiBase = getApiBase();
  if (preferDirectBackend && apiBase) {
    const direct = await fetchDirectBackend<T>(
      apiBase,
      path,
      init,
      requestHeaders,
      onUnauthorized
    );
    if (direct.ok) {
      emitPreviewCookieEvent(PREVIEW_COOKIE_CLEARED_EVENT);
      return direct.data;
    }
    if (direct.apiError) {
      throw direct.apiError;
    }
    preferDirectBackend = false;
  }

  let triedStorageAccess = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response;
    try {
      // Llamada same-origin hacia el proxy de Next.js (/api/admin/[...path]) para evitar bloqueos de CORS
      response = await fetch(path, {
        ...init,
        headers: requestHeaders,
        credentials: "include",
        cache: "no-store",
      });
    } catch (fetchErr) {
      if (apiBase) {
        const direct = await fetchDirectBackend<T>(
          apiBase,
          path,
          init,
          requestHeaders,
          onUnauthorized
        );
        if (direct.ok) {
          preferDirectBackend = true;
          emitPreviewCookieEvent(PREVIEW_COOKIE_CLEARED_EVENT);
          return direct.data;
        }
        if (direct.apiError) {
          throw direct.apiError;
        }
      }
      const reason =
        fetchErr instanceof Error && fetchErr.message ? ` (${fetchErr.message})` : "";
      throw new AdminApiError(
        `No se pudo conectar con el servidor del panel${reason}. Verifica tu conexión e intenta nuevamente.`,
        0
      );
    }

    const upstreamStatusHeader = response.headers.get("x-proxy-upstream-status");
    const effectiveStatus = upstreamStatusHeader
      ? Number(upstreamStatusHeader) || response.status
      : response.status;
    const fromNextProxy = response.headers.get("x-admin-proxy") === "next-route";
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const parsed = parseResponseBody(text);

    if (response.ok && isHtmlPayload(contentType, text)) {
      const title = extractHtmlTitle(text);
      const isWarmup = /Starting Server|warmup/i.test(text);
      if (attempt < 2 && isWarmup) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      const finalPath = safeUrlPath(response.url);
      const isCookieCheck =
        !fromNextProxy &&
        (/__cookie_check\.html/i.test(finalPath) || /cookie check/i.test(title));
      if (isCookieCheck) {
        if (!triedStorageAccess) {
          triedStorageAccess = true;
          const granted = await requestPreviewStorageAccess();
          if (granted) {
            continue;
          }
        }

        if (apiBase) {
          const direct = await fetchDirectBackend<T>(
            apiBase,
            path,
            init,
            requestHeaders,
            onUnauthorized
          );
          if (direct.ok) {
            preferDirectBackend = true;
            emitPreviewCookieEvent(PREVIEW_COOKIE_CLEARED_EVENT);
            return direct.data;
          }
          if (direct.apiError) {
            preferDirectBackend = true;
            emitPreviewCookieEvent(PREVIEW_COOKIE_CLEARED_EVENT);
            throw direct.apiError;
          }
        }

        emitPreviewCookieEvent(PREVIEW_COOKIE_BLOCKED_EVENT);
        throw new AdminApiError(
          "La vista previa bloqueó la petición porque falta renovar la cookie de seguridad del iframe (/__cookie_check.html). Abre la app en una pestaña nueva o permite las cookies de la vista previa e intenta nuevamente.",
          401,
          {
            previewHtml: true,
            cookieCheck: true,
            fromNextProxy,
            title,
            redirected: response.redirected,
            url: response.url,
          }
        );
      }
      const source = fromNextProxy ? "backend" : "proxy-preview";
      throw new AdminApiError(
        `Respuesta HTML inesperada en lugar de JSON [origen: ${source}, título: "${title || "sin título"}", redirigido: ${response.redirected ? "sí" : "no"}, ruta: ${finalPath || path}].`,
        502,
        {
          previewHtml: !fromNextProxy,
          fromNextProxy,
          title,
          redirected: response.redirected,
          url: response.url,
        }
      );
    }

    if (!response.ok) {
      if (effectiveStatus === 401 || effectiveStatus === 403) {
        onUnauthorized?.();
      }
      throw new AdminApiError(
        extractErrorMessage(parsed, effectiveStatus),
        effectiveStatus,
        parsed
      );
    }

    emitPreviewCookieEvent(PREVIEW_COOKIE_CLEARED_EVENT);
    return (parsed ?? {}) as T;
  }

  throw new AdminApiError("No se obtuvo una respuesta válida del servidor.", 502);
}

function unwrapItems<T>(data: unknown, fallbackKeys: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["items", "data", "results", ...fallbackKeys]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

function unwrapEntity<T>(data: unknown, fallbackKeys: string[] = []): T {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["item", "data", ...fallbackKeys]) {
      if (record[key] && typeof record[key] === "object" && !Array.isArray(record[key])) {
        return record[key] as T;
      }
    }
  }
  return data as T;
}

// 1. Auth (/api/admin/auth)
export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ token: string; user?: AdminUser }> {
  const data = await adminFetch<{ token?: string; access_token?: string; user?: AdminUser }>(
    "/api/admin/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
  const token = data.token ?? data.access_token ?? "";
  if (!token) {
    throw new AdminApiError("El backend no devolvió un token de sesión.", 500);
  }
  return { token, user: data.user };
}

export async function loginWithGoogleCredential(
  credential: string
): Promise<{ token: string; user?: AdminUser }> {
  const candidateKeys = ["idToken", "credential", "token"] as const;
  let lastError: unknown = null;

  for (const key of candidateKeys) {
    try {
      const data = await adminFetch<{ token?: string; access_token?: string; user?: AdminUser }>(
        "/api/admin/auth/google",
        {
          method: "POST",
          body: JSON.stringify({ [key]: credential }),
        }
      );
      const token = data.token ?? data.access_token ?? "";
      if (!token) {
        throw new AdminApiError("El backend no devolvió un token de sesión.", 500);
      }
      return { token, user: data.user };
    } catch (err) {
      lastError = err;
      if (err instanceof AdminApiError && err.status === 422) {
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AdminApiError("No se pudo iniciar sesión con Google.", 400);
}

export async function fetchAuthMe(token: string, onUnauthorized?: () => void): Promise<AdminUser> {
  const data = await adminFetch<unknown>("/api/admin/auth/me", { token, onUnauthorized });
  return unwrapEntity<AdminUser>(data, ["user", "admin"]);
}

export async function logoutAdminSession(token: string): Promise<void> {
  if (!token) return;
  try {
    await adminFetch<unknown>("/api/admin/auth/logout", {
      method: "POST",
      token,
    });
  } catch {
    // El cierre de sesión local siempre debe completarse aunque el token ya haya expirado.
  }
}

// 2. Products (/api/admin/products)
export async function listProducts(token: string, onUnauthorized?: () => void): Promise<Product[]> {
  const data = await adminFetch<unknown>("/api/admin/products", { token, onUnauthorized });
  return unwrapItems<Product>(data, ["products"]);
}

export async function getProductById(
  productId: string,
  token: string,
  onUnauthorized?: () => void
): Promise<Product> {
  const data = await adminFetch<unknown>(
    `/api/admin/products/${encodeURIComponent(productId)}`,
    { token, onUnauthorized }
  );
  return unwrapEntity<Product>(data, ["product"]);
}

export async function createProductItem(
  payload: Record<string, unknown>,
  token: string,
  onUnauthorized?: () => void
): Promise<Product> {
  const data = await adminFetch<unknown>("/api/admin/products", {
    method: "POST",
    token,
    onUnauthorized,
    body: JSON.stringify(payload),
  });
  return unwrapEntity<Product>(data, ["product"]);
}

export async function updateProductItem(
  productId: string,
  payload: Record<string, unknown>,
  token: string,
  onUnauthorized?: () => void
): Promise<Product> {
  const data = await adminFetch<unknown>(
    `/api/admin/products/${encodeURIComponent(productId)}`,
    {
      method: "PATCH",
      token,
      onUnauthorized,
      body: JSON.stringify(payload),
    }
  );
  return unwrapEntity<Product>(data, ["product"]);
}

export async function deleteProductItem(
  productId: string,
  token: string,
  onUnauthorized?: () => void
): Promise<void> {
  await adminFetch<unknown>(`/api/admin/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    token,
    onUnauthorized,
  });
}

// 3. Categories (/api/admin/categories)
export async function listCategories(token: string, onUnauthorized?: () => void): Promise<Category[]> {
  const data = await adminFetch<unknown>("/api/admin/categories", { token, onUnauthorized });
  return unwrapItems<Category>(data, ["categories"]);
}

export async function createCategoryItem(
  payload: Record<string, unknown>,
  token: string,
  onUnauthorized?: () => void
): Promise<Category> {
  const data = await adminFetch<unknown>("/api/admin/categories", {
    method: "POST",
    token,
    onUnauthorized,
    body: JSON.stringify(payload),
  });
  return unwrapEntity<Category>(data, ["category"]);
}

export async function updateCategoryItem(
  categoryId: string,
  payload: Record<string, unknown>,
  token: string,
  onUnauthorized?: () => void
): Promise<Category> {
  const data = await adminFetch<unknown>(
    `/api/admin/categories/${encodeURIComponent(categoryId)}`,
    {
      method: "PATCH",
      token,
      onUnauthorized,
      body: JSON.stringify(payload),
    }
  );
  return unwrapEntity<Category>(data, ["category"]);
}

export async function deleteCategoryItem(
  categoryId: string,
  token: string,
  onUnauthorized?: () => void
): Promise<void> {
  await adminFetch<unknown>(`/api/admin/categories/${encodeURIComponent(categoryId)}`, {
    method: "DELETE",
    token,
    onUnauthorized,
  });
}

// 4. Announcements (/api/admin/announcements)
export async function listAnnouncements(
  token: string,
  onUnauthorized?: () => void
): Promise<Announcement[]> {
  const data = await adminFetch<unknown>("/api/admin/announcements", { token, onUnauthorized });
  return unwrapItems<Announcement>(data, ["announcements"]);
}

export async function createAnnouncementItem(
  payload: AnnouncementCreateInput,
  token: string,
  onUnauthorized?: () => void
): Promise<Announcement> {
  const data = await adminFetch<unknown>("/api/admin/announcements", {
    method: "POST",
    token,
    onUnauthorized,
    body: JSON.stringify(payload),
  });
  return unwrapEntity<Announcement>(data, ["announcement"]);
}

export async function updateAnnouncementItem(
  announcementId: string,
  payload: AnnouncementUpdateInput,
  token: string,
  onUnauthorized?: () => void
): Promise<Announcement> {
  const data = await adminFetch<unknown>(
    `/api/admin/announcements/${encodeURIComponent(announcementId)}`,
    {
      method: "PATCH",
      token,
      onUnauthorized,
      body: JSON.stringify(payload),
    }
  );
  return unwrapEntity<Announcement>(data, ["announcement"]);
}

export async function deleteAnnouncementItem(
  announcementId: string,
  token: string,
  onUnauthorized?: () => void
): Promise<void> {
  await adminFetch<unknown>(`/api/admin/announcements/${encodeURIComponent(announcementId)}`, {
    method: "DELETE",
    token,
    onUnauthorized,
  });
}

// Cupones (/api/admin/coupons)
export async function listCoupons(token: string, onUnauthorized?: () => void): Promise<Coupon[]> {
  const data = await adminFetch<unknown>("/api/admin/coupons", { token, onUnauthorized });
  return unwrapItems<Coupon>(data, ["coupons"]);
}

export async function createCouponItem(
  payload: { code: string; discountType: "percentage" | "fixed"; discountValue: number; isActive: boolean },
  token: string,
  onUnauthorized?: () => void
): Promise<unknown> {
  return adminFetch<unknown>("/api/admin/coupons", {
    method: "POST", token, onUnauthorized, body: JSON.stringify(payload),
  });
}

export async function updateCouponItem(
  code: string,
  payload: { discountType?: "percentage" | "fixed"; discountValue?: number; isActive?: boolean },
  token: string,
  onUnauthorized?: () => void
): Promise<unknown> {
  return adminFetch<unknown>(`/api/admin/coupons/${encodeURIComponent(code)}`, {
    method: "PATCH", token, onUnauthorized, body: JSON.stringify(payload),
  });
}

export async function deleteCouponItem(
  code: string,
  token: string,
  onUnauthorized?: () => void
): Promise<void> {
  await adminFetch<unknown>(`/api/admin/coupons/${encodeURIComponent(code)}`, {
    method: "DELETE", token, onUnauthorized,
  });
}

// 5. Orders (/api/admin/orders)
export async function listOrders(token: string, onUnauthorized?: () => void): Promise<Order[]> {
  const data = await adminFetch<unknown>("/api/admin/orders", { token, onUnauthorized });
  return unwrapItems<Order>(data, ["orders"]);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  token: string,
  onUnauthorized?: () => void
): Promise<Order> {
  // Strict extra="forbid": enviar exclusivamente { status }
  const data = await adminFetch<unknown>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      token,
      onUnauthorized,
      body: JSON.stringify({ status }),
    }
  );
  return unwrapEntity<Order>(data, ["order"]);
}

// 6. Admin Profile (/api/admin/usuario)
export async function getAdminProfile(
  token: string,
  onUnauthorized?: () => void
): Promise<AdminProfile> {
  const data = await adminFetch<unknown>("/api/admin/usuario", { token, onUnauthorized });
  return unwrapEntity<AdminProfile>(data, ["usuario", "profile", "user"]);
}

export async function updateAdminProfile(
  payload: AdminProfileUpdate,
  token: string,
  onUnauthorized?: () => void
): Promise<AdminProfile> {
  const data = await adminFetch<unknown>("/api/admin/usuario", {
    method: "PUT",
    token,
    onUnauthorized,
    body: JSON.stringify(payload),
  });
  return unwrapEntity<AdminProfile>(data, ["usuario", "profile", "user"]);
}

// 7. Messages (/api/admin/messages)
export function normalizeMessageThreads(raw: unknown): MessageThread[] {
  const rawList = unwrapItems<Record<string, unknown>>(raw, ["messages", "conversations", "threads"]);
  const map = new Map<string, MessageThread>();

  for (const entry of rawList) {
    // Caso A: el backend devuelve hilos/conversaciones con array interno de mensajes
    if (Array.isArray(entry.messages)) {
      const uid = String(entry.userId ?? entry.user_id ?? entry.id ?? "");
      if (!uid) continue;
      const msgs = (entry.messages as Record<string, unknown>[]).map((m) => ({
        ...m,
        text: String(m.text ?? m.message ?? m.content ?? ""),
        createdAt: typeof m.createdAt === "string" ? m.createdAt : typeof m.timestamp === "string" ? m.timestamp : undefined,
      })) as MessageItem[];
      const last = msgs[msgs.length - 1];
      map.set(uid, {
        userId: uid,
        userName: String(entry.userName ?? entry.customerName ?? entry.name ?? `Cliente ${uid.slice(0, 8)}`),
        userEmail: typeof entry.userEmail === "string" ? entry.userEmail : typeof entry.email === "string" ? entry.email : undefined,
        lastText: String(entry.lastMessage ?? last?.text ?? ""),
        lastAt: typeof entry.updatedAt === "string" ? entry.updatedAt : last?.createdAt,
        messages: msgs,
      });
      continue;
    }

    // Caso B: el backend devuelve mensajes individuales planos
    const uid = String(entry.userId ?? entry.user_id ?? entry.clientId ?? entry.customerId ?? "");
    if (!uid) continue;
    const item: MessageItem = {
      ...entry,
      userId: uid,
      text: String(entry.text ?? entry.message ?? entry.content ?? ""),
      createdAt:
        typeof entry.createdAt === "string"
          ? entry.createdAt
          : typeof entry.timestamp === "string"
            ? entry.timestamp
            : typeof entry.created_at === "string"
              ? entry.created_at
              : undefined,
    };
    const existing = map.get(uid);
    if (existing) {
      existing.messages.push(item);
      existing.lastText = item.text || existing.lastText;
      existing.lastAt = item.createdAt || existing.lastAt;
    } else {
      map.set(uid, {
        userId: uid,
        userName: String(entry.userName ?? entry.customerName ?? entry.name ?? `Cliente ${uid.slice(0, 8)}`),
        userEmail: typeof entry.userEmail === "string" ? entry.userEmail : typeof entry.email === "string" ? entry.email : undefined,
        lastText: item.text,
        lastAt: item.createdAt,
        messages: [item],
      });
    }
  }

  return Array.from(map.values());
}

export async function listMessages(
  token: string,
  userId?: string,
  onUnauthorized?: () => void
): Promise<MessageThread[]> {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const data = await adminFetch<unknown>(`/api/admin/messages${query}`, { token, onUnauthorized });
  return normalizeMessageThreads(data);
}

export async function replyToClientMessage(
  userId: string,
  text: string,
  token: string,
  onUnauthorized?: () => void
): Promise<unknown> {
  // Strict extra="forbid": enviar exclusivamente { text }
  return adminFetch<unknown>(`/api/admin/messages/${encodeURIComponent(userId)}`, {
    method: "POST",
    token,
    onUnauthorized,
    body: JSON.stringify({ text }),
  });
}

// 8. Media (/api/admin/media)
function extractUploadedMedia(raw: unknown): UploadedMedia | null {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (/^(https?:\/\/|\/)/i.test(trimmed)) {
      return { url: trimmed };
    }
    return null;
  }

  if (Array.isArray(raw) && raw.length > 0) {
    return extractUploadedMedia(raw[0]);
  }

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const urlKeys = [
    "url",
    "imageUrl",
    "image_url",
    "publicUrl",
    "public_url",
    "mediaUrl",
    "media_url",
    "fileUrl",
    "file_url",
    "signedUrl",
    "signed_url",
    "downloadUrl",
    "download_url",
    "secure_url",
    "location",
    "src",
  ];

  for (const key of urlKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return {
        url: value.trim(),
        objectName:
          typeof record.objectName === "string"
            ? record.objectName
            : typeof record.object_name === "string"
              ? record.object_name
              : undefined,
        contentType:
          typeof record.contentType === "string"
            ? record.contentType
            : typeof record.content_type === "string"
              ? record.content_type
              : undefined,
        size: typeof record.size === "number" ? record.size : undefined,
      };
    }
  }

  for (const wrapperKey of ["data", "item", "media", "file", "result", "uploaded"]) {
    if (record[wrapperKey] !== undefined) {
      const nested = extractUploadedMedia(record[wrapperKey]);
      if (nested) return nested;
    }
  }

  return null;
}

function buildMediaFormData(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  form.append("name", file.name);
  return form;
}

export async function uploadAdminMedia(
  file: File,
  token: string,
  onUnauthorized?: () => void
): Promise<UploadedMedia> {
  const raw = await adminFetch<unknown>("/api/admin/media", {
    method: "POST",
    token,
    onUnauthorized,
    body: buildMediaFormData(file),
  });

  const uploaded = extractUploadedMedia(raw);
  if (!uploaded?.url) {
    const keys =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? Object.keys(raw as Record<string, unknown>).join(", ")
        : typeof raw;
    throw new AdminApiError(
      `No se recibió la URL de ${file.name}${keys ? ` (respuesta: ${keys})` : ""}.`,
      500,
      raw
    );
  }
  return uploaded;
}

export type BankAccount = {
  id: string; bankName: string; accountNumber: string; accountType: string;
  holderName: string; holderDocument?: string; isActive: boolean;
};
export async function listBankAccounts(token: string, onUnauthorized?: () => void): Promise<BankAccount[]> {
  const data = await adminFetch<unknown>("/api/admin/bank-accounts", { token, onUnauthorized });
  return unwrapItems<BankAccount>(data);
}
export async function createBankAccount(payload: Omit<BankAccount, "id">, token: string, onUnauthorized?: () => void): Promise<BankAccount> {
  const data = await adminFetch<unknown>("/api/admin/bank-accounts", { method: "POST", token, onUnauthorized, body: JSON.stringify(payload) });
  return unwrapEntity<BankAccount>(data);
}
export async function updateBankAccount(id: string, payload: Partial<BankAccount>, token: string, onUnauthorized?: () => void): Promise<BankAccount> {
  const data = await adminFetch<unknown>(`/api/admin/bank-accounts/${encodeURIComponent(id)}`, { method: "PATCH", token, onUnauthorized, body: JSON.stringify(payload) });
  return unwrapEntity<BankAccount>(data);
}
export async function deleteBankAccount(id: string, token: string, onUnauthorized?: () => void): Promise<void> {
  await adminFetch<unknown>(`/api/admin/bank-accounts/${encodeURIComponent(id)}`, { method: "DELETE", token, onUnauthorized });
}
export async function reviewTransferPayment(orderId: string, approved: boolean, note: string, token: string, onUnauthorized?: () => void): Promise<void> {
  await adminFetch<unknown>(`/api/admin/orders/${encodeURIComponent(orderId)}/payment-review`, { method: "PATCH", token, onUnauthorized, body: JSON.stringify({ approved, note }) });
}

export async function getOrderProof(orderId: string, token: string, onUnauthorized?: () => void): Promise<Blob> {
  const proofPath = `/api/admin/orders/${encodeURIComponent(orderId)}/proof`;
  const apiBase = getApiBase();

  const tryDirect = async (): Promise<Blob | null> => {
    if (!apiBase) return null;
    try {
      const directRes = await fetch(`${apiBase}${proofPath}`, {
        headers: { Authorization: `Bearer ${token}` },
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
      });
      if (!directRes.ok) {
        if (directRes.status === 401 || directRes.status === 403) onUnauthorized?.();
        throw new AdminApiError("No se pudo abrir el comprobante del pedido.", directRes.status);
      }
      const ct = directRes.headers.get("content-type") ?? "";
      if (/text\/html/i.test(ct)) return null;
      preferDirectBackend = true;
      emitPreviewCookieEvent(PREVIEW_COOKIE_CLEARED_EVENT);
      return directRes.blob();
    } catch (err) {
      if (err instanceof AdminApiError) throw err;
      return null;
    }
  };

  if (preferDirectBackend && apiBase) {
    const blob = await tryDirect();
    if (blob) return blob;
  }

  let response: Response;
  try {
    response = await fetch(proofPath, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    const blob = await tryDirect();
    if (blob) return blob;
    throw new AdminApiError("No se pudo cargar el comprobante.", 0);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const finalPath = safeUrlPath(response.url);
  if (response.ok && (/text\/html/i.test(contentType) || /__cookie_check\.html/i.test(finalPath))) {
    const blob = await tryDirect();
    if (blob) return blob;
    emitPreviewCookieEvent(PREVIEW_COOKIE_BLOCKED_EVENT);
    throw new AdminApiError(
      "La vista previa bloqueó la descarga del comprobante (/__cookie_check.html). Abre la app en una pestaña nueva e intenta nuevamente.",
      401,
      { previewHtml: true, cookieCheck: true }
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) onUnauthorized?.();
    throw new AdminApiError("No se pudo abrir el comprobante del pedido.", response.status);
  }
  return response.blob();
}


export type CashOnDeliveryConfig = {
  enabled: boolean;
  message: string;
  termsVersion?: string;
};

export async function getCashOnDeliveryConfig(
  token: string,
  onUnauthorized?: () => void
): Promise<CashOnDeliveryConfig> {
  return adminFetch<CashOnDeliveryConfig>("/api/admin/cash-on-delivery", {
    token,
    onUnauthorized,
  });
}

export async function updateCashOnDeliveryConfig(
  payload: Pick<CashOnDeliveryConfig, "enabled" | "message">,
  token: string,
  onUnauthorized?: () => void
): Promise<CashOnDeliveryConfig> {
  return adminFetch<CashOnDeliveryConfig>("/api/admin/cash-on-delivery", {
    method: "PUT",
    token,
    onUnauthorized,
    body: JSON.stringify(payload),
  });
}
