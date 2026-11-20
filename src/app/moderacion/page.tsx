"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { adminFetch } from "@/lib/admin-api";

type Report = {
  id: string;
  commentId: string;
  productId: string;
  reportedUserId: string;
  reporterId: string;
  reason: string;
  status: string;
  commentText: string;
  createdAt?: string;
};

export default function ModeracionPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await adminFetch<{ items?: Report[] }>(
        `/api/admin/moderation/reports?status=${filter}`,
        { token, onUnauthorized: handleUnauthorized }
      );
      setReports(result.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized, filter]);

  useEffect(() => { void load(); }, [load]);

  async function deleteReportedComment(report: Report) {
    if (!token || !window.confirm("¿Eliminar este comentario de las publicaciones?")) return;
    setBusyId(report.id);
    setError("");
    setNotice("");
    try {
      await adminFetch(`/api/admin/moderation/comments/${encodeURIComponent(report.commentId)}`, {
        method: "DELETE", token, onUnauthorized: handleUnauthorized,
      });
      setNotice("Comentario eliminado y reporte marcado como revisado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el comentario.");
    } finally {
      setBusyId("");
    }
  }

  async function changeStatus(report: Report, status: "reviewed" | "dismissed") {
    if (!token) return;
    setBusyId(report.id);
    setError("");
    setNotice("");
    try {
      await adminFetch(`/api/admin/moderation/reports/${encodeURIComponent(report.id)}`, {
        method: "PATCH",
        token,
        onUnauthorized: handleUnauthorized,
        body: JSON.stringify({ status }),
      });
      setNotice(status === "reviewed" ? "Reporte marcado como revisado." : "Reporte descartado.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el reporte.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AdminShell
      title="Moderación de comentarios"
      subtitle="Revisa los reportes enviados por los usuarios y registra la decisión de administración."
      actions={<button type="button" className="button-secondary" onClick={() => void load()} disabled={loading}>Actualizar</button>}
    >
      {error && <p className="message error" role="alert">{error}</p>}
      {notice && <p className="message success" role="status">{notice}</p>}
      <section className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {["pending", "reviewed", "dismissed", "all"].map((value) => (
            <button key={value} type="button" className={filter === value ? "button-primary" : "button-secondary"} onClick={() => setFilter(value)}>
              {value === "pending" ? "Pendientes" : value === "reviewed" ? "Revisados" : value === "dismissed" ? "Descartados" : "Todos"}
            </button>
          ))}
        </div>
        {loading ? <p className="muted">Cargando reportes...</p> : reports.length === 0 ? (
          <p className="muted">No hay reportes en esta categoría.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {reports.map((report) => (
              <article key={report.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <strong>Reporte · {report.status}</strong>
                  <span className="muted-sm">{report.createdAt ? new Date(report.createdAt).toLocaleString("es-DO") : ""}</span>
                </div>
                <p style={{ margin: "10px 0 6px" }}><strong>Motivo:</strong> {report.reason}</p>
                <blockquote style={{ margin: "8px 0", padding: "10px 12px", background: "var(--surface, #f7f7f7)", borderRadius: 8 }}>
                  {report.commentText || "El comentario ya no está disponible."}
                </blockquote>
                <p className="muted-sm">Comentario: {report.commentId} · Producto: {report.productId} · Usuario reportado: {report.reportedUserId}</p>
                {report.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button type="button" className="button-primary" disabled={busyId === report.id} onClick={() => void changeStatus(report, "reviewed")}>Marcar revisado</button>
                    <button type="button" className="button-secondary" disabled={busyId === report.id} onClick={() => void changeStatus(report, "dismissed")}>Descartar</button>
                    <button type="button" className="button-secondary" disabled={busyId === report.id || !report.commentText} onClick={() => void deleteReportedComment(report)}>Eliminar comentario</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
