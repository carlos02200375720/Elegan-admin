import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveBackendBase(): { base: string; error?: string } {
  const raw = (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    ""
  ).trim();

  if (!raw) {
    return {
      base: "",
      error:
        "Falta configurar NEXT_PUBLIC_API_BASE_URL en las variables de entorno.",
    };
  }

  if (!/^https?:\/\//i.test(raw)) {
    return {
      base: "",
      error:
        "NEXT_PUBLIC_API_BASE_URL debe incluir el protocolo (por ejemplo, https://tu-backend.run.app).",
    };
  }

  // Quitar barras finales y evitar duplicación si incluyeron /api o /api/admin
  const normalized = raw
    .replace(/\/+$/, "")
    .replace(/\/api\/admin$/i, "")
    .replace(/\/api$/i, "");

  return { base: normalized };
}

function isPreviewNginxProxy(request: NextRequest): boolean {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? "";
  return (
    process.env.NODE_ENV !== "production" ||
    /^ais-(dev|pre)-/i.test(forwardedHost)
  );
}

function safeProxyStatus(status: number, previewProxy: boolean): number {
  if (!previewProxy) return status;
  // El Nginx del entorno de vista previa intercepta 502/503/504 y los convierte en
  // HTTP 200 OK con /warmup.html, y reemplaza 403 por HTML sin cuerpo JSON.
  if (status === 502 || status === 503 || status === 504) return 500;
  if (status === 403) return 401;
  return status;
}

function jsonProxyError(
  detail: string,
  upstreamStatus: number,
  previewProxy: boolean
): NextResponse {
  const status = safeProxyStatus(upstreamStatus, previewProxy);
  const headers = new Headers();
  headers.set("x-admin-proxy", "next-route");
  if (status !== upstreamStatus) {
    headers.set("x-proxy-upstream-status", String(upstreamStatus));
  }
  return NextResponse.json({ detail }, { status, headers });
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const previewProxy = isPreviewNginxProxy(request);
  const { base, error } = resolveBackendBase();
  if (!base) {
    return jsonProxyError(
      error || "No está configurada la URL del backend.",
      503,
      previewProxy
    );
  }

  const { path } = await context.params;
  const joinedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const search = request.nextUrl.search || "";
  let targetUrl = `${base}/api/admin/${joinedPath}${search}`;

  const forwardHeaders = new Headers();
  const authHeader = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (authHeader) forwardHeaders.set("authorization", authHeader);
  if (contentType) forwardHeaders.set("content-type", contentType);
  if (accept) forwardHeaders.set("accept", accept);

  const method = request.method.toUpperCase();
  let bodyBytes: Uint8Array | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const rawBuffer = await request.arrayBuffer();
    if (rawBuffer.byteLength > 0) {
      bodyBytes = new Uint8Array(rawBuffer);
    }
  }

  try {
    let upstreamResponse: Response | null = null;
    let currentMethod = method;

    for (let redirectCount = 0; redirectCount < 4; redirectCount++) {
      const requestBody =
        currentMethod !== "GET" && currentMethod !== "HEAD" && bodyBytes
          ? bodyBytes
          : undefined;
      if (!requestBody) {
        forwardHeaders.delete("content-type");
      }

      upstreamResponse = await fetch(targetUrl, {
        method: currentMethod,
        headers: forwardHeaders,
        body: requestBody ? Buffer.from(requestBody) : undefined,
        cache: "no-store",
        redirect: "manual",
      });

      const isRedirect = [301, 302, 303, 307, 308].includes(
        upstreamResponse.status
      );
      const location = upstreamResponse.headers.get("location");
      if (!isRedirect || !location) {
        break;
      }

      const prevUrl = new URL(targetUrl);
      const nextUrl = new URL(location, prevUrl);
      // Evitar degradación accidental de HTTPS a HTTP en el mismo host detrás de proxy reverso
      if (
        prevUrl.protocol === "https:" &&
        nextUrl.protocol === "http:" &&
        prevUrl.host === nextUrl.host
      ) {
        nextUrl.protocol = "https:";
      }
      targetUrl = nextUrl.toString();

      if (upstreamResponse.status === 303) {
        currentMethod = "GET";
      }
    }

    if (!upstreamResponse) {
      return jsonProxyError(
        "No se recibió respuesta del servidor backend.",
        502,
        previewProxy
      );
    }

    if (upstreamResponse.status === 204 || upstreamResponse.status === 205) {
      return new NextResponse(null, { status: upstreamResponse.status });
    }

    const responseBuffer = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers();
    responseHeaders.set("x-admin-proxy", "next-route");
    const upstreamContentType = upstreamResponse.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }

    const finalStatus = safeProxyStatus(upstreamResponse.status, previewProxy);
    if (finalStatus !== upstreamResponse.status) {
      responseHeaders.set(
        "x-proxy-upstream-status",
        String(upstreamResponse.status)
      );
    }

    return new NextResponse(responseBuffer, {
      status: finalStatus,
      headers: responseHeaders,
    });
  } catch (err) {
    const cause =
      err instanceof Error && "cause" in err && err.cause instanceof Error
        ? err.cause.message
        : err instanceof Error
          ? err.message
          : "Error de red desconocido";

    let hostLabel = base;
    try {
      hostLabel = new URL(base).host;
    } catch {
      // mantener base
    }

    return jsonProxyError(
      `No se pudo conectar con el backend (${hostLabel}): ${cause}. Verifica que la URL sea pública y que el servidor esté encendido.`,
      502,
      previewProxy
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
