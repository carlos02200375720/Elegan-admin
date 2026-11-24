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

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { base, error } = resolveBackendBase();
  if (!base) {
    return NextResponse.json({ detail: error }, { status: 503 });
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
  let bodyBuffer: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const rawBuffer = await request.arrayBuffer();
    if (rawBuffer.byteLength > 0) {
      bodyBuffer = rawBuffer;
    }
  }

  try {
    let upstreamResponse: Response | null = null;
    let currentMethod = method;

    for (let redirectCount = 0; redirectCount < 4; redirectCount++) {
      upstreamResponse = await fetch(targetUrl, {
        method: currentMethod,
        headers: forwardHeaders,
        body:
          currentMethod !== "GET" && currentMethod !== "HEAD" && bodyBuffer
            ? bodyBuffer
            : undefined,
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
      return NextResponse.json(
        { detail: "No se recibió respuesta del servidor backend." },
        { status: 502 }
      );
    }

    if (upstreamResponse.status === 204 || upstreamResponse.status === 205) {
      return new NextResponse(null, { status: upstreamResponse.status });
    }

    const responseBuffer = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }

    return new NextResponse(responseBuffer, {
      status: upstreamResponse.status,
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

    return NextResponse.json(
      {
        detail: `No se pudo conectar con el backend (${hostLabel}): ${cause}. Verifica que la URL sea pública y que el servidor esté encendido.`,
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
