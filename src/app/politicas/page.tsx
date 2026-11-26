"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { adminFetch } from "@/lib/admin-api";
import { subscribeRealtime } from "@/lib/realtime-events";
import { subscribeRealtime } from "@/lib/realtime-events";

type LegalDocument = {
  type: "privacy_policy" | "terms_and_conditions";
  title: string;
  subtitle: string;
  content: string;
  updatedAt?: string;
};

const DOC_TYPES = [
  { id: "privacy_policy", label: "Política de Privacidad" },
  { id: "terms_and_conditions", label: "Términos y Condiciones" },
] as const;

export default function PoliticasPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activeType, setActiveType] = useState<LegalDocument["type"]>("privacy_policy");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await adminFetch<{ items?: LegalDocument[] }>("/api/admin/legal-documents", {
        token,
        onUnauthorized: handleUnauthorized,
      });
      setDocuments(result.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los documentos.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeRealtime(["legal_documents"], () => void load()), [load]);

  const activeDocument = documents.find((item) => item.type === activeType);

  function updateActive(patch: Partial<LegalDocument>) {
    setDocuments((current) => current.map((item) =>
      item.type === activeType ? { ...item, ...patch } : item
    ));
  }

  async function save() {
    if (!token || !activeDocument) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await adminFetch<{ item: LegalDocument }>(
        `/api/admin/legal-documents/${activeType}`,
        {
          method: "PUT",
          token,
          onUnauthorized: handleUnauthorized,
          body: JSON.stringify({
            title: activeDocument.title,
            subtitle: activeDocument.subtitle,
            content: activeDocument.content,
          }),
        }
      );
      setDocuments((current) => current.map((item) =>
        item.type === activeType ? result.item : item
      ));
      setNotice("Documento publicado. La aplicación Android recibirá esta versión desde el backend.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el documento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Políticas y documentos legales"
      subtitle="Edita y publica los documentos que consulta la aplicación Android."
    >
      {error && <p className="message error" role="alert">{error}</p>}
      {notice && <p className="message success" role="status">{notice}</p>}

      <section className="panel" style={{ padding: 20, maxWidth: 980 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {DOC_TYPES.map((doc) => (
            <button
              key={doc.id}
              type="button"
              className={activeType === doc.id ? "button-primary" : "button-secondary"}
              onClick={() => { setActiveType(doc.id); setNotice(""); }}
            >
              {doc.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="muted">Cargando documentos...</p>
        ) : !activeDocument ? (
          <p className="muted">No se encontró el documento solicitado.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <strong>Título</strong>
              <input
                value={activeDocument.title}
                maxLength={160}
                onChange={(event) => updateActive({ title: event.target.value })}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <strong>Subtítulo</strong>
              <input
                value={activeDocument.subtitle}
                maxLength={240}
                onChange={(event) => updateActive({ subtitle: event.target.value })}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <strong>Contenido</strong>
              <textarea
                value={activeDocument.content}
                maxLength={30000}
                rows={18}
                onChange={(event) => updateActive({ content: event.target.value })}
                style={{ width: "100%", resize: "vertical", lineHeight: 1.6 }}
              />
              <span className="muted-sm">Separa los párrafos con una línea en blanco. Máximo 30,000 caracteres.</span>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="button-secondary" onClick={() => void load()} disabled={saving}>
                Recargar
              </button>
              <button type="button" className="button-primary" onClick={() => void save()} disabled={saving || !activeDocument.title.trim() || activeDocument.content.trim().length < 20}>
                {saving ? "Publicando..." : "Guardar y publicar"}
              </button>
            </div>
            {activeDocument.updatedAt && (
              <p className="muted-sm">Última actualización: {new Date(activeDocument.updatedAt).toLocaleString("es-DO")}</p>
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
