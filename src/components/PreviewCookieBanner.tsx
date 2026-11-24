"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import {
  isPreviewCookieBlocked,
  PREVIEW_COOKIE_BLOCKED_EVENT,
  PREVIEW_COOKIE_CLEARED_EVENT,
  requestPreviewStorageAccess,
} from "@/lib/admin-api";

type PreviewCookieBannerProps = {
  forceVisible?: boolean;
  onResolved?: () => void;
};

export function PreviewCookieBanner({
  forceVisible = false,
  onResolved,
}: PreviewCookieBannerProps) {
  const [blocked, setBlocked] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentHref, setCurrentHref] = useState("/");
  const [canRequestStorageAccess, setCanRequestStorageAccess] = useState(false);

  useEffect(() => {
    setBlocked(isPreviewCookieBlocked());
    setCurrentHref(window.location.href);
    const doc = document as Document & {
      requestStorageAccess?: () => Promise<void>;
    };
    setCanRequestStorageAccess(typeof doc.requestStorageAccess === "function");

    const onBlocked = () => {
      setBlocked(true);
      setAccessDenied(false);
    };
    const onCleared = () => {
      setBlocked(false);
      setAccessDenied(false);
    };

    window.addEventListener(PREVIEW_COOKIE_BLOCKED_EVENT, onBlocked);
    window.addEventListener(PREVIEW_COOKIE_CLEARED_EVENT, onCleared);
    return () => {
      window.removeEventListener(PREVIEW_COOKIE_BLOCKED_EVENT, onBlocked);
      window.removeEventListener(PREVIEW_COOKIE_CLEARED_EVENT, onCleared);
    };
  }, []);

  if (!blocked && !forceVisible) return null;

  async function handleAllowCookies() {
    setRequestingAccess(true);
    setAccessDenied(false);
    try {
      const granted = await requestPreviewStorageAccess();
      if (granted) {
        setBlocked(false);
        if (onResolved) {
          onResolved();
        } else {
          window.location.reload();
        }
      } else {
        setAccessDenied(true);
      }
    } finally {
      setRequestingAccess(false);
    }
  }

  return (
    <div className="cookie-recovery-banner" role="alert">
      <div className="cookie-recovery-copy">
        <strong>Acceso bloqueado por cookies del iframe de vista previa</strong>
        <p>
          El navegador bloqueó la cookie de seguridad de la vista previa (
          <code>/__cookie_check.html</code>). Ábrelo en una pestaña nueva para trabajar sin
          restricciones de cookies o intenta habilitarlas aquí.
        </p>
        {accessDenied && (
          <p className="muted-sm">
            El navegador no permitió cookies dentro del iframe. Usa &ldquo;Abrir en pestaña
            nueva&rdquo;.
          </p>
        )}
      </div>
      <div className="cookie-recovery-actions">
        <a
          href={currentHref}
          target="_blank"
          rel="noopener noreferrer"
          className="button-primary"
        >
          <ExternalLink size={14} />
          <span>Abrir en pestaña nueva</span>
        </a>
        {canRequestStorageAccess && (
          <button
            type="button"
            className="button-secondary"
            disabled={requestingAccess}
            onClick={() => void handleAllowCookies()}
          >
            <ShieldCheck size={14} />
            <span>{requestingAccess ? "Solicitando..." : "Permitir cookies aquí"}</span>
          </button>
        )}
        <button
          type="button"
          className="button-secondary"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={14} />
          <span>Recargar</span>
        </button>
      </div>
    </div>
  );
}
