"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  CashOnDeliveryConfig,
  getCashOnDeliveryConfig,
  updateCashOnDeliveryConfig,
} from "@/lib/admin-api";

export default function ContraEntregaPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    getCashOnDeliveryConfig(token, handleUnauthorized)
      .then((config: CashOnDeliveryConfig) => {
        if (!active) return;
        setEnabled(config.enabled);
        setMessage(config.message);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "No se pudo cargar la configuración.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, handleUnauthorized]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const config = await updateCashOnDeliveryConfig({ enabled, message }, token, handleUnauthorized);
      setEnabled(config.enabled);
      setMessage(config.message);
      setNotice("La configuración de pago contra entrega se guardó correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Pago contra entrega"
      subtitle="Controla la disponibilidad del método y el mensaje que verá el cliente en la aplicación móvil."
    >
      <section className="panel">
        <div className="panel-header">
          <h2>Configuración del método</h2>
        </div>
        {loading ? <p>Cargando configuración...</p> : (
          <form className="admin-form" onSubmit={save}>
            <label className="field">
              <span>Disponibilidad global</span>
              <span className="checkbox-field">
                <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                Permitir pago contra entrega en la aplicación
              </span>
            </label>
            <label className="field">
              <span>Mensaje para el cliente</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                maxLength={3000}
                required
                placeholder="Escribe las condiciones e indicaciones para el cliente."
              />
              <small>{message.length}/3000 caracteres</small>
            </label>
            {error && <p className="message error">{error}</p>}
            {notice && <p className="message success">{notice}</p>}
            <div className="form-actions">
              <button className="button-primary" type="submit" disabled={saving || !message.trim()}>
                {saving ? "Guardando..." : "Guardar configuración"}
              </button>
            </div>
          </form>
        )}
      </section>
      <section className="panel">
        <p>El método solo estará disponible cuando esté activado aquí y todos los productos seleccionados para el pedido permitan pago contra entrega.</p>
      </section>
    </AdminShell>
  );
}
