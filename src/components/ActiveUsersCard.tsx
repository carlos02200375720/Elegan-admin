"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Users } from "lucide-react";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { ActiveUsersSnapshot, getActiveUsers } from "@/lib/admin-api";

export function ActiveUsersCard() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [snapshot, setSnapshot] = useState<ActiveUsersSnapshot | null>(null);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!token || requestInFlight.current) return;
    requestInFlight.current = true;
    try {
      const result = await getActiveUsers(token, handleUnauthorized);
      setSnapshot(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar.");
    } finally {
      requestInFlight.current = false;
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const measuredAt = snapshot?.measuredAt
    ? new Date(snapshot.measuredAt).toLocaleTimeString("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Esperando primera lectura";

  return (
    <section className="panel" aria-live="polite" aria-label="Usuarios activos en tiempo real">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Activity size={18} aria-hidden="true" />
          <h2>Usuarios activos ahora</h2>
        </div>
        <span className="row-meta">
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: error ? "var(--warning)" : "var(--success)",
              display: "inline-block",
            }}
          />
          {error ? "Sin actualizar" : "Actualización en vivo"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 18 }}>
        <Users size={30} aria-hidden="true" />
        <div>
          <div className="kpi-value tabular">
            {snapshot ? snapshot.activeUsers.toLocaleString("es-DO") : "—"}
          </div>
          <div className="kpi-sub">Clientes activos en los últimos 2 minutos</div>
        </div>
      </div>
      <p className="info-note">
        Consulta automática cada 5 segundos. Última lectura: {measuredAt}.
      </p>
      {error && <p className="message error" role="alert">{error}</p>}
    </section>
  );
}
