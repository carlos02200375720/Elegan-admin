import type { Order } from "./admin-api";

export type OrderDeliveryField = {
  key: string;
  label: string;
  value: string;
  wide?: boolean;
  tabular?: boolean;
  href?: string;
};

export type ExtractedOrderDelivery = {
  fields: OrderDeliveryField[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  searchableText: string;
  copyText: string;
};

type FieldSpec = {
  slot: string;
  label: string;
  aliases: string[];
  wide?: boolean;
  tabular?: boolean;
  isUrl?: boolean;
};

const DELIVERY_CONTAINER_KEYS = new Set([
  "shippingaddress",
  "deliveryaddress",
  "addressinfo",
  "addressdetails",
  "direccionentrega",
  "direccionenvio",
  "delivery",
  "deliveryinfo",
  "deliverydata",
  "deliverydetails",
  "datosentrega",
  "datosdeentrega",
  "entrega",
  "informacionentrega",
  "infodeentrega",
  "shipping",
  "shippinginfo",
  "shippingdata",
  "shippingdetails",
  "datosenvio",
  "datosdeenvio",
  "envio",
  "informacionenvio",
  "customer",
  "customerinfo",
  "customerdata",
  "customerdetails",
  "client",
  "clientinfo",
  "buyer",
  "buyerinfo",
  "cliente",
  "datoscliente",
  "recipient",
  "recipientinfo",
  "receiver",
  "receiverinfo",
  "destinatario",
  "contact",
  "contactinfo",
  "contacto",
  "checkout",
  "checkoutdata",
  "checkoutinfo",
  "checkoutdetails",
  "location",
  "ubicacion",
  "coordinates",
  "coordenadas",
  "geo",
  "geopoint",
  "user",
  "userinfo",
  "usuario",
  "deliverylocation",
  "shippinglocation",
  "addressdata",
  "deliveryaddresssnapshot",
  "shippingaddresssnapshot",
  "orderdelivery",
  "ordershipping",
]);

const CONTAINER_IGNORED_KEYS = new Set([
  "id",
  "userid",
  "uid",
  "customerid",
  "addressid",
  "createdat",
  "updatedat",
  "deletedat",
  "isdefault",
  "default",
  "isactive",
  "active",
  "version",
  "v",
]);

const EXCLUDED_TOP_LEVEL_KEYS = new Set([
  "id",
  "orderid",
  "ordernumber",
  "userid",
  "uid",
  "clientid",
  "customerid",
  "storeid",
  "tenantid",
  "status",
  "orderstatus",
  "fulfillmentstatus",
  "items",
  "orderitems",
  "products",
  "lineitems",
  "total",
  "totaldop",
  "totalamount",
  "subtotal",
  "subtotaldop",
  "shippingtotal",
  "shippingtotaldop",
  "shippingcost",
  "shippingcostdop",
  "shippingfee",
  "shippingprice",
  "deliveryfee",
  "deliverycost",
  "discount",
  "discountdop",
  "discountamount",
  "coupon",
  "couponcode",
  "couponid",
  "coupondiscount",
  "coupondiscountdop",
  "tax",
  "taxdop",
  "itbis",
  "currency",
  "amount",
  "payment",
  "paymentmethod",
  "paymentstatus",
  "paymentproof",
  "paymentproofobjectname",
  "paymentproofurl",
  "paymentproofpath",
  "proofobjectname",
  "proofurl",
  "paymentreviewnote",
  "paymentreviewedat",
  "paymentreviewedby",
  "reviewnote",
  "bankaccount",
  "bankaccountid",
  "bankaccounts",
  "cashondeliveryaccepted",
  "cashondeliverytermsversion",
  "codaccepted",
  "termsaccepted",
  "termsversion",
  "createdat",
  "updatedat",
  "deletedat",
  "paidat",
  "shippedat",
  "deliveredat",
  "cancelledat",
  "canceledat",
  "timestamp",
  "version",
  "v",
  "metadata",
  "meta",
  "history",
  "statushistory",
  "timeline",
  "events",
  "logs",
  "stockreleased",
  "inventoryreserved",
  "inventoryreleased",
  "stockdeducted",
]);

const FIELD_SPECS: FieldSpec[] = [
  {
    slot: "customerName",
    label: "Cliente",
    aliases: ["customername", "clientname", "buyername", "username", "nombrecliente"],
  },
  {
    slot: "recipientName",
    label: "Destinatario",
    aliases: [
      "recipientname",
      "receivername",
      "deliveryname",
      "shippingname",
      "contactname",
      "fullname",
      "name",
      "nombre",
      "nombrecompleto",
      "destinatario",
      "quienrecibe",
      "recibe",
      "personaquerecibe",
      "nombrerecibe",
    ],
  },
  {
    slot: "document",
    label: "Documento / Cédula",
    tabular: true,
    aliases: [
      "document",
      "documentnumber",
      "documentid",
      "idnumber",
      "identification",
      "nationalid",
      "cedula",
      "rnc",
      "dni",
      "taxid",
      "docnumber",
      "documento",
      "identificacion",
      "numerodocumento",
      "cedularnc",
    ],
  },
  {
    slot: "email",
    label: "Correo",
    aliases: [
      "customeremail",
      "email",
      "useremail",
      "clientemail",
      "buyeremail",
      "deliveryemail",
      "shippingemail",
      "contactemail",
      "correo",
      "correoelectronico",
      "mail",
    ],
  },
  {
    slot: "phone",
    label: "Teléfono",
    tabular: true,
    aliases: [
      "customerphone",
      "phone",
      "phonenumber",
      "telephone",
      "tel",
      "mobile",
      "mobilephone",
      "cellphone",
      "celular",
      "deliveryphone",
      "shippingphone",
      "contactphone",
      "recipientphone",
      "telefono",
      "numerotelefono",
      "movil",
    ],
  },
  {
    slot: "whatsapp",
    label: "WhatsApp",
    tabular: true,
    aliases: [
      "whatsapp",
      "whatsappnumber",
      "numerowhatsapp",
      "customerwhatsapp",
      "deliverywhatsapp",
      "shippingwhatsapp",
    ],
  },
  {
    slot: "secondaryPhone",
    label: "Teléfono alternativo",
    tabular: true,
    aliases: [
      "secondaryphone",
      "alternatephone",
      "altphone",
      "otherphone",
      "phone2",
      "telefono2",
      "telefonoalternativo",
      "telefonoalterno",
      "otrotelefono",
    ],
  },
  {
    slot: "company",
    label: "Empresa / Oficina",
    aliases: [
      "company",
      "companyname",
      "empresa",
      "business",
      "businessname",
      "negocio",
      "oficina",
      "office",
      "workplace",
    ],
  },
  {
    slot: "address",
    label: "Dirección",
    wide: true,
    aliases: [
      "address",
      "streetaddress",
      "street",
      "addressline1",
      "address1",
      "line1",
      "calle",
      "direccion",
      "direccionexacta",
      "direccioncompleta",
      "direccionentrega",
      "direccionenvio",
      "fulladdress",
      "formattedaddress",
      "shippingstreet",
      "deliverystreet",
    ],
  },
  {
    slot: "addressLine2",
    label: "Dirección adicional",
    wide: true,
    aliases: [
      "addressline2",
      "address2",
      "line2",
      "complement",
      "complemento",
      "additionaladdress",
      "direccion2",
      "segundalinea",
    ],
  },
  {
    slot: "building",
    label: "Edificio / Residencial",
    aliases: [
      "building",
      "edificio",
      "residential",
      "residencial",
      "torre",
      "tower",
      "condominio",
      "condo",
      "urbanizacion",
      "urbanization",
      "complejo",
      "complex",
    ],
  },
  {
    slot: "apartment",
    label: "Casa / Apartamento",
    aliases: [
      "apartment",
      "apt",
      "apto",
      "apartamento",
      "housenumber",
      "numerocasa",
      "casa",
      "suite",
      "unit",
      "unidad",
      "piso",
      "floor",
      "interior",
      "manzana",
      "lote",
      "puerta",
    ],
  },
  {
    slot: "sector",
    label: "Sector / Barrio",
    aliases: [
      "sector",
      "neighborhood",
      "neighbourhood",
      "barrio",
      "suburb",
      "district",
      "distrito",
      "zona",
      "zone",
      "paraje",
      "comunidad",
      "community",
      "localidad",
      "locality",
      "ensanche",
      "deliveryzone",
      "shippingzone",
      "deliverysector",
      "shippingsector",
    ],
  },
  {
    slot: "city",
    label: "Ciudad / Municipio",
    aliases: [
      "city",
      "ciudad",
      "municipality",
      "municipio",
      "town",
      "poblacion",
      "shippingcity",
      "deliverycity",
      "customercity",
    ],
  },
  {
    slot: "province",
    label: "Provincia / Estado",
    aliases: [
      "province",
      "provincia",
      "state",
      "estado",
      "region",
      "department",
      "departamento",
      "shippingprovince",
      "deliveryprovince",
      "shippingstate",
      "deliverystate",
    ],
  },
  {
    slot: "postalCode",
    label: "Código postal",
    tabular: true,
    aliases: [
      "postalcode",
      "zipcode",
      "zip",
      "codigopostal",
      "cp",
      "shippingzip",
      "shippingpostalcode",
    ],
  },
  {
    slot: "country",
    label: "País",
    aliases: ["country", "pais", "countrycode", "shippingcountry", "deliverycountry"],
  },
  {
    slot: "reference",
    label: "Punto de referencia",
    wide: true,
    aliases: [
      "reference",
      "references",
      "landmark",
      "referencia",
      "referencias",
      "puntoreferencia",
      "puntodereferencia",
      "deliveryreference",
      "shippingreference",
      "addressreference",
      "entrecalles",
      "crossstreet",
      "nearby",
      "cercade",
    ],
  },
  {
    slot: "deliveryMethod",
    label: "Método de entrega",
    aliases: [
      "deliverytype",
      "shippingtype",
      "deliverymethod",
      "shippingmethod",
      "shippingmethodname",
      "tipoentrega",
      "metodoentrega",
      "metodoenvio",
      "modalidadentrega",
      "fulfillmenttype",
      "tipodeenvio",
    ],
  },
  {
    slot: "deliveryTime",
    label: "Tiempo estimado",
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
    label: "Origen de envío",
    aliases: ["shippingorigin", "origenenvio", "origin"],
  },
  {
    slot: "courier",
    label: "Mensajería / Transporte",
    aliases: [
      "courier",
      "carrier",
      "shippingcarrier",
      "transport",
      "transporte",
      "empresaenvio",
      "agencia",
      "agency",
      "paqueteria",
      "parada",
    ],
  },
  {
    slot: "branch",
    label: "Sucursal / Punto de retiro",
    aliases: [
      "branch",
      "sucursal",
      "pickuplocation",
      "pickuppoint",
      "puntoretiro",
      "puntodeentrega",
      "deliverypoint",
      "oficinaenvio",
    ],
  },
  {
    slot: "trackingNumber",
    label: "Número de seguimiento",
    tabular: true,
    aliases: [
      "trackingnumber",
      "tracking",
      "trackingcode",
      "numeroseguimiento",
      "guia",
      "numeroguia",
    ],
  },
  {
    slot: "deliveryDate",
    label: "Fecha de entrega",
    tabular: true,
    aliases: [
      "deliverydate",
      "preferreddeliverydate",
      "preferreddate",
      "fechaentrega",
      "fechadeentrega",
    ],
  },
  {
    slot: "deliverySchedule",
    label: "Horario de entrega",
    aliases: [
      "deliverywindow",
      "deliverytimeslot",
      "timeslot",
      "schedule",
      "horario",
      "horarioentrega",
      "deliveryschedule",
      "franjahoraria",
    ],
  },
  {
    slot: "mapUrl",
    label: "Ubicación en mapa",
    wide: true,
    isUrl: true,
    aliases: [
      "googlemapsurl",
      "mapsurl",
      "mapurl",
      "locationurl",
      "ubicacionurl",
      "linkmapa",
      "maplink",
      "urlmapa",
      "googlemaplink",
    ],
  },
  {
    slot: "deliveryNotes",
    label: "Instrucciones / Notas",
    wide: true,
    aliases: [
      "deliverynotes",
      "deliverynote",
      "deliveryinstructions",
      "shippingnotes",
      "shippinginstructions",
      "instructions",
      "instrucciones",
      "instruccionesentrega",
      "instruccionesdeentrega",
      "indicaciones",
      "indicacionesentrega",
      "observations",
      "observaciones",
      "notes",
      "note",
      "notas",
      "nota",
      "comments",
      "comment",
      "comentario",
      "comentarios",
      "specialinstructions",
      "ordernotes",
      "customernotes",
      "notacliente",
      "notasentrega",
    ],
  },
  {
    slot: "giftMessage",
    label: "Mensaje de regalo",
    wide: true,
    aliases: ["giftmessage", "mensajeregalo", "dedicatoria"],
  },
  {
    slot: "invoiceType",
    label: "Comprobante fiscal / NCF",
    aliases: ["ncf", "tipocomprobante", "comprobantefiscal", "invoicetype", "fiscalreceipt"],
  },
];

const ALIAS_TO_SPEC = new Map<string, FieldSpec>();
for (const spec of FIELD_SPECS) {
  for (const alias of spec.aliases) {
    ALIAS_TO_SPEC.set(alias, spec);
  }
}

const FIRST_NAME_KEYS = new Set(["firstname", "givenname", "primernombre", "nombres"]);
const LAST_NAME_KEYS = new Set(["lastname", "familyname", "surname", "apellido", "apellidos"]);
const DOC_TYPE_KEYS = new Set(["documenttype", "doctype", "tipodocumento", "tipoidentificacion"]);
const LAT_KEYS = new Set(["lat", "latitude", "latitud"]);
const LNG_KEYS = new Set(["lng", "lon", "long", "longitude", "longitud"]);

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

function tryParseJsonObject(value: unknown): Record<string, unknown> | null {
  if (isPlainObject(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatPrimitiveValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => formatPrimitiveValue(entry))
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

function looksTechnicalTopLevelKey(rawKey: string, normalized: string): boolean {
  if (EXCLUDED_TOP_LEVEL_KEYS.has(normalized)) return true;
  if (rawKey.startsWith("_")) return true;
  if (
    /(id|ids|at|by|token|hash|secret|objectname|version|count|flag|status|dop|usd|amount|price|total|cost|fee|discount|tax|formatted|accepted|verified|approved|rejected|released|reserved|deleted|active|enabled)$/.test(
      normalized
    )
  ) {
    return true;
  }
  return false;
}

export function extractOrderDeliveryDetails(order: Order): ExtractedOrderDelivery {
  const slotValues = new Map<string, string[]>();
  const extraFields: OrderDeliveryField[] = [];
  const seenExtraKeys = new Set<string>();

  let firstName = "";
  let lastName = "";
  let docType = "";
  let latValue: number | null = null;
  let lngValue: number | null = null;

  const pushSlotValue = (slot: string, rawVal: string) => {
    const val = rawVal.trim();
    if (!val) return;
    const current = slotValues.get(slot) ?? [];
    const lower = val.toLowerCase();
    if (!current.some((item) => item.toLowerCase() === lower)) {
      current.push(val);
      slotValues.set(slot, current);
    }
  };

  const tryCaptureCoord = (normalized: string, value: unknown): boolean => {
    if (LAT_KEYS.has(normalized)) {
      const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
      if (Number.isFinite(parsed) && Math.abs(parsed) <= 90) {
        if (latValue === null) latValue = parsed;
      }
      return true;
    }
    if (LNG_KEYS.has(normalized)) {
      const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
      if (Number.isFinite(parsed) && Math.abs(parsed) <= 180) {
        if (lngValue === null) lngValue = parsed;
      }
      return true;
    }
    return false;
  };

  const visitObject = (
    obj: Record<string, unknown>,
    insideDeliveryContainer: boolean,
    depth: number
  ) => {
    if (depth > 4) return;

    for (const [rawKey, rawValue] of Object.entries(obj)) {
      if (rawValue === null || rawValue === undefined) continue;
      const normalized = normalizeKey(rawKey);
      if (!normalized) continue;

      if (tryCaptureCoord(normalized, rawValue)) continue;

      if (FIRST_NAME_KEYS.has(normalized)) {
        const str = formatPrimitiveValue(rawValue);
        if (str && !firstName) firstName = str;
        continue;
      }
      if (LAST_NAME_KEYS.has(normalized)) {
        const str = formatPrimitiveValue(rawValue);
        if (str && !lastName) lastName = str;
        continue;
      }
      if (DOC_TYPE_KEYS.has(normalized)) {
        const str = formatPrimitiveValue(rawValue);
        if (str && !docType) docType = str;
        continue;
      }

      const nestedObj = tryParseJsonObject(rawValue);
      if (nestedObj) {
        if (normalized === "shippingmethod" || normalized === "deliverymethod") {
          const methodName = formatPrimitiveValue(nestedObj.name ?? nestedObj.label ?? nestedObj.title);
          if (methodName) pushSlotValue("deliveryMethod", methodName);
          const methodTime = formatPrimitiveValue(nestedObj.deliveryTime ?? nestedObj.estimatedDelivery);
          if (methodTime) pushSlotValue("deliveryTime", methodTime);
          const methodOrigin = formatPrimitiveValue(nestedObj.origin ?? nestedObj.shippingOrigin);
          if (methodOrigin) pushSlotValue("shippingOrigin", methodOrigin);
          continue;
        }
        const looksDeliveryContainer =
          DELIVERY_CONTAINER_KEYS.has(normalized) ||
          normalized === "address" ||
          normalized === "direccion" ||
          (!EXCLUDED_TOP_LEVEL_KEYS.has(normalized) &&
            /(address|direccion|delivery|entrega|shipping|envio|customer|cliente|recipient|destinatario|contact|contacto|location|ubicacion|coord|geo)/.test(
              normalized
            ));
        if (insideDeliveryContainer || looksDeliveryContainer) {
          visitObject(nestedObj, true, depth + 1);
        }
        continue;
      }

      if (insideDeliveryContainer && CONTAINER_IGNORED_KEYS.has(normalized)) {
        continue;
      }

      const spec = ALIAS_TO_SPEC.get(normalized);
      if (spec) {
        const str = formatPrimitiveValue(rawValue);
        if (str) {
          pushSlotValue(spec.slot, str);
        }
        continue;
      }

      if (!insideDeliveryContainer && looksTechnicalTopLevelKey(rawKey, normalized)) {
        continue;
      }

      const str = formatPrimitiveValue(rawValue);
      if (!str || str.length > 500) continue;

      const dedupeKey = `${normalized}:${str.toLowerCase()}`;
      if (seenExtraKeys.has(dedupeKey)) continue;
      seenExtraKeys.add(dedupeKey);

      const isLink = isSafeHttpUrl(str);
      extraFields.push({
        key: `extra-${rawKey}-${extraFields.length}`,
        label: humanizeKey(rawKey),
        value: str,
        wide: str.length > 48 || isLink,
        href: isLink ? str : undefined,
      });
    }
  };

  visitObject(order as Record<string, unknown>, false, 0);

  // Combine firstName + lastName if present
  const combinedFullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combinedFullName) {
    if (!slotValues.has("customerName")) {
      pushSlotValue("customerName", combinedFullName);
    } else {
      pushSlotValue("recipientName", combinedFullName);
    }
  }

  // Reconcile customerName vs recipientName to avoid duplicate name rows
  const customerNames = slotValues.get("customerName") ?? [];
  const recipientNames = slotValues.get("recipientName") ?? [];
  if (customerNames.length === 0 && recipientNames.length > 0) {
    slotValues.set("customerName", recipientNames);
    slotValues.delete("recipientName");
  } else if (customerNames.length > 0 && recipientNames.length > 0) {
    const customerLower = new Set(customerNames.map((n) => n.toLowerCase()));
    const distinctRecipients = recipientNames.filter((n) => !customerLower.has(n.toLowerCase()));
    if (distinctRecipients.length > 0) {
      slotValues.set("recipientName", distinctRecipients);
    } else {
      slotValues.delete("recipientName");
    }
  }

  // Combine documentType with document number if both exist
  if (docType) {
    const docs = slotValues.get("document") ?? [];
    if (docs.length > 0) {
      slotValues.set(
        "document",
        docs.map((doc) =>
          doc.toLowerCase().includes(docType.toLowerCase()) ? doc : `${docType}: ${doc}`
        )
      );
    } else {
      pushSlotValue("document", docType);
    }
  }

  // Deduplicate secondaryPhone against primary phone
  const phones = slotValues.get("phone") ?? [];
  const phoneDigits = new Set(phones.map((p) => p.replace(/\D/g, "")).filter(Boolean));
  const secondaryPhones = slotValues.get("secondaryPhone") ?? [];
  if (secondaryPhones.length > 0 && phoneDigits.size > 0) {
    const uniqueSecondary = secondaryPhones.filter((p) => {
      const digits = p.replace(/\D/g, "");
      return !digits || !phoneDigits.has(digits);
    });
    if (uniqueSecondary.length > 0) {
      slotValues.set("secondaryPhone", uniqueSecondary);
    } else {
      slotValues.delete("secondaryPhone");
    }
  }

  const fields: OrderDeliveryField[] = [];

  for (const spec of FIELD_SPECS) {
    const vals = slotValues.get(spec.slot);
    if (!vals || vals.length === 0) continue;
    const joined = vals.join(" · ");
    const href = spec.isUrl && isSafeHttpUrl(vals[0]) ? vals[0] : undefined;
    fields.push({
      key: spec.slot,
      label: spec.label,
      value: href ? "Abrir enlace de ubicación" : joined,
      wide: spec.wide || joined.length > 56,
      tabular: spec.tabular,
      href,
    });
  }

  if (latValue !== null && lngValue !== null) {
    const coordsText = `${latValue}, ${lngValue}`;
    fields.push({
      key: "coordinates",
      label: "Coordenadas",
      value: coordsText,
      wide: true,
      tabular: true,
      href: `https://www.google.com/maps?q=${encodeURIComponent(coordsText)}`,
    });
  }

  for (const extra of extraFields) {
    fields.push(extra);
  }

  const customerName = slotValues.get("customerName")?.[0] ?? "";
  const customerEmail = slotValues.get("email")?.[0] ?? "";
  const customerPhone =
    slotValues.get("phone")?.[0] ?? slotValues.get("whatsapp")?.[0] ?? "";

  const searchableText = fields
    .map((f) => `${f.value} ${f.href ?? ""}`)
    .join(" ")
    .toLowerCase();

  const copyText = fields
    .map((f) => `${f.label}: ${f.href && f.key === "mapUrl" ? f.href : f.value}`)
    .join("\n");

  return {
    fields,
    customerName,
    customerEmail,
    customerPhone,
    searchableText,
    copyText,
  };
}
