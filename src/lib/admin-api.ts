export const TOKEN_STORAGE_KEY = "elegan_admin_token";

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
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
  size?: string;
  color?: string;
  imageUrl?: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  shippingPriceDOP?: string | number;
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
  totalDOP?: string | number;
  subtotalDOP?: string | number;
  shippingTotalDOP?: string | number;
  couponCode?: string;
  couponDiscountDOP?: string | number;
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

  let response: Response;
  try {
    // Llamada same-origin hacia el proxy de Next.js (/api/admin/[...path]) para evitar bloqueos de CORS
    response = await fetch(path, {
      ...init,
      headers: requestHeaders,
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError(
      "No se pudo conectar con el servidor del panel. Verifica tu conexión e intenta nuevamente.",
      0
    );
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      onUnauthorized?.();
    }
    throw new AdminApiError(extractErrorMessage(parsed, response.status), response.status, parsed);
  }

  return (parsed ?? {}) as T;
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
export async function uploadAdminMedia(
  file: File,
  token: string,
  onUnauthorized?: () => void
): Promise<UploadedMedia> {
  const form = new FormData();
  form.append("file", file);
  form.append("name", file.name);
  const data = await adminFetch<UploadedMedia>("/api/admin/media", {
    method: "POST",
    token,
    onUnauthorized,
    body: form,
  });
  if (!data.url) {
    throw new AdminApiError(`No se recibió la URL de ${file.name}.`, 500);
  }
  return data;
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
  let response: Response;
  try {
    response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/proof`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError("No se pudo cargar el comprobante.", 0);
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
