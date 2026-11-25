import type { OrderItem, Product } from "./admin-api";

export type OrderItemDetailField = {
  key: string;
  label: string;
  value: string;
  wide?: boolean;
  tabular?: boolean;
};

export type ExtractedOrderItem = {
  productId: string;
  title: string;
  imageUrl: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  shippingPrice?: number;
  discountAmount?: number;
  sku: string;
  details: OrderItemDetailField[];
};

type ItemFieldSpec = {
  slot: string;
  label: string;
  aliases: string[];
  wide?: boolean;
  tabular?: boolean;
};

const IMAGE_KEYS = [
  "variantimageurl",
  "variantimage",
  "selectedimageurl",
  "selectedimage",
  "imageurl",
  "image",
  "productimageurl",
  "productimage",
  "thumbnailurl",
  "thumbnail",
  "photourl",
  "photo",
  "pictureurl",
  "picture",
  "imgurl",
  "img",
  "coverimage",
  "mainimage",
];

const ITEM_CONTAINER_KEYS = new Set([
  "variant",
  "selectedvariant",
  "variantinfo",
  "variantdetails",
  "variantdata",
  "productvariant",
  "options",
  "selectedoptions",
  "variantoptions",
  "attributes",
  "selectedattributes",
  "variantattributes",
  "specifications",
  "specs",
  "details",
  "shipping",
  "shippingmethod",
  "shippinginfo",
  "delivery",
  "deliveryinfo",
  "product",
  "productinfo",
  "customization",
  "personalization",
]);

const ITEM_IGNORED_KEYS = new Set([
  "id",
  "itemid",
  "orderitemid",
  "lineitemid",
  "productid",
  "variantid",
  "shippingmethodid",
  "name",
  "title",
  "productname",
  "producttitle",
  "quantity",
  "qty",
  "cantidad",
  "units",
  "price",
  "pricedop",
  "unitprice",
  "unitpricedop",
  "subtotal",
  "subtotaldop",
  "linetotal",
  "linetotaldop",
  "total",
  "totaldop",
  "shippingprice",
  "shippingpricedop",
  "shippingcost",
  "shippingcostdop",
  "discount",
  "discountdop",
  "discountamount",
  "imageurl",
  "image",
  "images",
  "productimage",
  "productimageurl",
  "variantimage",
  "variantimageurl",
  "selectedimage",
  "selectedimageurl",
  "thumbnail",
  "thumbnailurl",
  "photo",
  "photourl",
  "picture",
  "pictureurl",
  "img",
  "imgurl",
  "videourl",
  "hasvideo",
  "isactive",
  "active",
  "allowcashondelivery",
  "stock",
  "createdat",
  "updatedat",
  "slug",
  "currency",
  "description",
  "shippingmethods",
  "sizes",
  "colors",
]);

const ITEM_FIELD_SPECS: ItemFieldSpec[] = [
  {
    slot: "variant",
    label: "Variante",
    aliases: [
      "variant",
      "variantname",
      "variantlabel",
      "varianttitle",
      "selectedvariant",
      "variante",
      "varianteseleccionada",
      "option",
      "optionname",
      "optionvalue",
      "opcion",
    ],
  },
  {
    slot: "size",
    label: "Talla",
    aliases: ["size", "talla", "selectedsize", "tallaseleccionada", "medida", "numero"],
  },
  {
    slot: "color",
    label: "Color",
    aliases: ["color", "colour", "selectedcolor", "colorseleccionado", "tono", "shade"],
  },
  {
    slot: "model",
    label: "Modelo",
    aliases: ["model", "modelo", "style", "estilo", "design", "diseno", "edition", "edicion"],
  },
  {
    slot: "material",
    label: "Material",
    aliases: ["material", "fabric", "tela", "finish", "acabado"],
  },
  {
    slot: "presentation",
    label: "Presentación / Capacidad",
    aliases: [
      "presentation",
      "presentacion",
      "capacity",
      "capacidad",
      "storage",
      "almacenamiento",
      "volume",
      "volumen",
      "flavor",
      "sabor",
      "scent",
      "aroma",
      "fragancia",
      "pack",
      "paquete",
    ],
  },
  {
    slot: "dimensions",
    label: "Medidas / Peso",
    aliases: ["weight", "peso", "dimensions", "dimensiones", "length", "largo", "width", "ancho", "height", "alto"],
  },
  {
    slot: "gender",
    label: "Género",
    aliases: ["gender", "genero"],
  },
  {
    slot: "brand",
    label: "Marca",
    aliases: ["brand", "marca"],
  },
  {
    slot: "category",
    label: "Categoría",
    aliases: ["categoryname", "category", "categoria", "categoryid"],
  },
  {
    slot: "sku",
    label: "SKU / Código",
    tabular: true,
    aliases: [
      "sku",
      "variantsku",
      "productsku",
      "barcode",
      "codigobarras",
      "code",
      "codigo",
      "reference",
      "referencia",
      "partnumber",
    ],
  },
  {
    slot: "shippingMethodName",
    label: "Método de envío",
    aliases: [
      "shippingmethodname",
      "shippingmethod",
      "shippingname",
      "metodoenvio",
      "deliverymethod",
      "metodoentrega",
    ],
  },
  {
    slot: "shippingDeliveryTime",
    label: "Tiempo de entrega",
    aliases: [
      "shippingdeliverytime",
      "deliverytime",
      "estimateddelivery",
      "tiempoentrega",
      "plazoentrega",
    ],
  },
  {
    slot: "shippingOrigin",
    label: "Origen",
    aliases: ["shippingorigin", "origin", "origen", "origenenvio"],
  },
  {
    slot: "warehouse",
    label: "Almacén / Ubicación",
    aliases: [
      "warehouse",
      "almacen",
      "location",
      "ubicacion",
      "bin",
      "shelf",
      "estante",
      "supplier",
      "proveedor",
    ],
  },
  {
    slot: "customization",
    label: "Personalización / Nota",
    wide: true,
    aliases: [
      "customization",
      "personalization",
      "personalizacion",
      "customtext",
      "engraving",
      "grabado",
      "note",
      "notes",
      "nota",
      "notas",
      "itemnote",
      "itemnotes",
      "instructions",
      "instrucciones",
      "comment",
      "comments",
      "comentario",
    ],
  },
];

const ITEM_ALIAS_TO_SPEC = new Map<string, ItemFieldSpec>();
for (const spec of ITEM_FIELD_SPECS) {
  for (const alias of spec.aliases) {
    ITEM_ALIAS_TO_SPEC.set(alias, spec);
  }
}

function normalizeKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

function parseNumeric(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => formatPrimitive(entry))
      .filter((entry) => entry.length > 0);
    return parts.join(", ");
  }
  return "";
}

function humanizeKey(rawKey: string): string {
  const spaced = rawKey
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim();
  if (!spaced) return rawKey;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function looksLikeCategoryId(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
    (/^[a-zA-Z0-9_-]{16,}$/.test(value) && !value.includes(" "))
  );
}

function resolveCategoryLabel(
  rawValue: string,
  categoryNameById?: Map<string, string>
): string {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed.toLowerCase() === "todo") return "";
  if (categoryNameById) {
    const exact = categoryNameById.get(trimmed);
    if (exact) return exact.trim();
  }
  if (looksLikeCategoryId(trimmed)) {
    return categoryNameById && categoryNameById.size > 0 ? "Categoría no encontrada" : "";
  }
  return trimmed;
}

export function isSafeMediaUrl(raw?: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function findImageUrlInObject(obj: Record<string, unknown>, depth = 0): string {
  if (depth > 3) return "";

  const byNormalized = new Map<string, unknown>();
  for (const [key, value] of Object.entries(obj)) {
    byNormalized.set(normalizeKey(key), value);
  }

  for (const imgKey of IMAGE_KEYS) {
    const candidate = byNormalized.get(imgKey);
    if (typeof candidate === "string" && isSafeMediaUrl(candidate)) {
      return candidate.trim();
    }
    if (isPlainObject(candidate)) {
      const nestedUrl =
        (typeof candidate.url === "string" && isSafeMediaUrl(candidate.url) ? candidate.url.trim() : "") ||
        (typeof candidate.src === "string" && isSafeMediaUrl(candidate.src) ? candidate.src.trim() : "") ||
        findImageUrlInObject(candidate, depth + 1);
      if (nestedUrl) return nestedUrl;
    }
  }

  const imagesArr = byNormalized.get("images") ?? byNormalized.get("photos");
  if (Array.isArray(imagesArr)) {
    for (const entry of imagesArr) {
      if (typeof entry === "string" && isSafeMediaUrl(entry)) {
        return entry.trim();
      }
      if (isPlainObject(entry)) {
        const nestedUrl = findImageUrlInObject(entry, depth + 1);
        if (nestedUrl) return nestedUrl;
      }
    }
  }

  for (const nestedKey of ["variant", "selectedvariant", "product", "productinfo", "media"]) {
    const rawNested = byNormalized.get(nestedKey);
    const parsed = tryParseJson(rawNested);
    if (isPlainObject(parsed)) {
      const nestedUrl = findImageUrlInObject(parsed, depth + 1);
      if (nestedUrl) return nestedUrl;
    }
  }

  return "";
}

export function extractOrderItemProductId(item: OrderItem): string {
  const record = item as Record<string, unknown>;
  for (const key of ["productId", "product_id"]) {
    const val = record[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number" && Number.isFinite(val)) return String(val);
  }
  const productObj = tryParseJson(record.product);
  if (isPlainObject(productObj)) {
    const nestedId = productObj.id ?? productObj.productId ?? productObj.product_id;
    if (typeof nestedId === "string" && nestedId.trim()) return nestedId.trim();
  }
  return "";
}

export function extractOrderItemDetails(
  item: OrderItem,
  fallbackProduct?: Product,
  categoryNameById?: Map<string, string>
): ExtractedOrderItem {
  const record = item as Record<string, unknown>;
  const productId = extractOrderItemProductId(item);

  const productObj = isPlainObject(tryParseJson(record.product))
    ? (tryParseJson(record.product) as Record<string, unknown>)
    : undefined;

  const title =
    formatPrimitive(
      record.name ??
        record.title ??
        record.productName ??
        record.product_name ??
        record.productTitle ??
        productObj?.name ??
        productObj?.title ??
        fallbackProduct?.name
    ) || "Producto";

  let imageUrl = findImageUrlInObject(record);
  if (!imageUrl && fallbackProduct) {
    if (isSafeMediaUrl(fallbackProduct.imageUrl)) {
      imageUrl = fallbackProduct.imageUrl!.trim();
    } else if (Array.isArray(fallbackProduct.images)) {
      const firstValid = fallbackProduct.images.find((img) => isSafeMediaUrl(img));
      if (firstValid) imageUrl = firstValid.trim();
    }
  }

  const quantity =
    parseNumeric(record.quantity ?? record.qty ?? record.cantidad ?? record.units) ?? 1;

  const unitPrice = parseNumeric(
    record.priceDOP ??
      record.price_dop ??
      record.unitPriceDOP ??
      record.unit_price_dop ??
      record.unitPrice ??
      record.unit_price ??
      record.price
  );

  const explicitLineTotal = parseNumeric(
    record.subtotalDOP ??
      record.subtotal_dop ??
      record.lineTotalDOP ??
      record.line_total_dop ??
      record.totalDOP ??
      record.total_dop ??
      record.subtotal ??
      record.lineTotal ??
      record.line_total ??
      record.total
  );

  const lineTotal =
    explicitLineTotal ??
    (unitPrice !== undefined && quantity > 1 ? unitPrice * quantity : undefined);

  const shippingObj = isPlainObject(tryParseJson(record.shipping))
    ? (tryParseJson(record.shipping) as Record<string, unknown>)
    : isPlainObject(tryParseJson(record.shippingMethod))
      ? (tryParseJson(record.shippingMethod) as Record<string, unknown>)
      : undefined;

  const shippingPrice = parseNumeric(
    record.shippingPriceDOP ??
      record.shipping_price_dop ??
      record.shippingPrice ??
      record.shipping_price ??
      record.shippingCostDOP ??
      record.shippingCost ??
      shippingObj?.priceDOP ??
      shippingObj?.price
  );

  const discountAmount = parseNumeric(
    record.discountDOP ??
      record.discount_dop ??
      record.discountAmount ??
      record.discount
  );

  const slotValues = new Map<string, string[]>();
  const extraFields: OrderItemDetailField[] = [];
  const seenExtra = new Set<string>();

  const pushSlot = (slot: string, rawVal: string) => {
    const val = rawVal.trim();
    if (!val) return;
    const list = slotValues.get(slot) ?? [];
    const lower = val.toLowerCase();
    if (!list.some((existing) => existing.toLowerCase() === lower)) {
      list.push(val);
      slotValues.set(slot, list);
    }
  };

  const pushExtra = (rawKey: string, value: string) => {
    const cleanVal = value.trim();
    if (!cleanVal || cleanVal.length > 300) return;
    const normalized = normalizeKey(rawKey);
    const dedupe = `${normalized}:${cleanVal.toLowerCase()}`;
    if (seenExtra.has(dedupe)) return;
    seenExtra.add(dedupe);
    extraFields.push({
      key: `extra-${rawKey}-${extraFields.length}`,
      label: humanizeKey(rawKey),
      value: cleanVal,
      wide: cleanVal.length > 44,
    });
  };

  const visitKeyValueArray = (arr: unknown[]) => {
    for (const entry of arr) {
      if (isPlainObject(entry)) {
        const k = formatPrimitive(
          entry.name ?? entry.label ?? entry.key ?? entry.attribute ?? entry.option
        );
        const v = formatPrimitive(entry.value ?? entry.selected ?? entry.optionValue);
        if (k && v) {
          const spec = ITEM_ALIAS_TO_SPEC.get(normalizeKey(k));
          if (spec) {
            pushSlot(spec.slot, v);
          } else {
            pushExtra(k, v);
          }
          continue;
        }
        visitObject(entry, true, 2, "options");
      } else {
        const prim = formatPrimitive(entry);
        if (prim) pushSlot("variant", prim);
      }
    }
  };

  const visitObject = (
    obj: Record<string, unknown>,
    insideContainer: boolean,
    depth: number,
    parentContainerNorm = ""
  ) => {
    if (depth > 3) return;

    for (const [rawKey, rawValue] of Object.entries(obj)) {
      if (rawValue === null || rawValue === undefined) continue;
      const normalized = normalizeKey(rawKey);
      if (!normalized) continue;

      const parsed = tryParseJson(rawValue);

      if (Array.isArray(parsed)) {
        if (
          ITEM_CONTAINER_KEYS.has(normalized) ||
          normalized === "variants" ||
          normalized === "selectedvalues"
        ) {
          visitKeyValueArray(parsed);
        }
        continue;
      }

      if (isPlainObject(parsed)) {
        if (insideContainer || ITEM_CONTAINER_KEYS.has(normalized)) {
          visitObject(parsed, true, depth + 1, normalized);
        }
        continue;
      }

      // Context-aware name/label inside a variant or shipping nested object
      if (insideContainer && (normalized === "name" || normalized === "label" || normalized === "title")) {
        const val = formatPrimitive(parsed);
        if (!val) continue;
        if (parentContainerNorm.includes("shipping") || parentContainerNorm.includes("delivery")) {
          pushSlot("shippingMethodName", val);
        } else if (parentContainerNorm.includes("variant")) {
          pushSlot("variant", val);
        }
        continue;
      }

      if (ITEM_IGNORED_KEYS.has(normalized)) continue;

      const spec = ITEM_ALIAS_TO_SPEC.get(normalized);
      if (spec) {
        const val = formatPrimitive(parsed);
        if (val) pushSlot(spec.slot, val);
        continue;
      }

      // Skip obvious technical keys at top level of item
      if (
        !insideContainer &&
        (rawKey.startsWith("_") ||
          /(id|ids|at|by|url|dop|price|cost|total|amount|count|stock|formatted)$/.test(normalized))
      ) {
        continue;
      }

      const strVal = formatPrimitive(parsed);
      if (strVal) {
        pushExtra(rawKey, strVal);
      }
    }
  };

  visitObject(record, false, 0);

  if (!slotValues.has("category") && fallbackProduct?.category) {
    pushSlot("category", fallbackProduct.category);
  }

  // Resolve any category IDs to their display names
  const rawCategories = slotValues.get("category");
  if (rawCategories && rawCategories.length > 0) {
    const resolvedNamed: string[] = [];
    let hadUnknownId = false;

    for (const rawCat of rawCategories) {
      const resolved = resolveCategoryLabel(rawCat, categoryNameById);
      if (!resolved) continue;
      if (resolved === "Categoría no encontrada") {
        hadUnknownId = true;
        continue;
      }
      if (!resolvedNamed.some((existing) => existing.toLowerCase() === resolved.toLowerCase())) {
        resolvedNamed.push(resolved);
      }
    }

    if (resolvedNamed.length > 0) {
      slotValues.set("category", resolvedNamed);
    } else if (hadUnknownId) {
      slotValues.set("category", ["Categoría no encontrada"]);
    } else {
      slotValues.delete("category");
    }
  }

  const sku = slotValues.get("sku")?.[0] ?? "";

  const details: OrderItemDetailField[] = [];
  for (const spec of ITEM_FIELD_SPECS) {
    // SKU is already displayed in the item header metadata if present, keep only if multiple or extra clarity
    if (spec.slot === "sku") continue;
    const vals = slotValues.get(spec.slot);
    if (!vals || vals.length === 0) continue;
    const joined = vals.join(" · ");
    details.push({
      key: spec.slot,
      label: spec.label,
      value: joined,
      wide: spec.wide || joined.length > 48,
      tabular: spec.tabular,
    });
  }

  for (const extra of extraFields) {
    details.push(extra);
  }

  return {
    productId,
    title,
    imageUrl,
    quantity,
    unitPrice,
    lineTotal,
    shippingPrice,
    discountAmount,
    sku,
    details,
  };
}
