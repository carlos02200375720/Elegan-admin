"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  AdminProfile,
  AdminProfileUpdate,
  getAdminProfile,
  updateAdminProfile,
} from "@/lib/admin-api";
import { subscribeRealtime } from "@/lib/realtime-events";

export default function PerfilPage() {
  const { token, handleUnauthorized, refreshSession } = useAdminAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAdminProfile(token, handleUnauthorized);
      setProfile(data);
      setName(typeof data.name === "string" ? data.name : "");
      setEmail(typeof data.email === "string" ? data.email : "");
      setPhone(typeof data.phone === "string" ? data.phone : "");
      setAddress(typeof data.address === "string" ? data.address : "");
      setCity(typeof data.city === "string" ? data.city : "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el perfil administrativo."
      );
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => subscribeRealtime(["super-admins"], () => void loadProfile()), [loadProfile]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload: AdminProfileUpdate = {};
      if (name.trim()) payload.name = name.trim();
      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (address.trim()) payload.address = address.trim();
      if (city.trim()) payload.city = city.trim();

      const updated = await updateAdminProfile(payload, token, handleUnauthorized);
      setProfile(updated);
      setNotice("Información del perfil actualizada correctamente.");
      await refreshSession();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la información del perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Perfil administrativo"
      subtitle="Consulta y actualiza los datos de contacto y ubicación de la cuenta administrativa."
      actions={
        <button
          type="button"
          className="button-secondary"
          disabled={loading}
          onClick={() => void loadProfile()}
        >
          <RefreshCw size={14} />
          <span>{loading ? "Cargando..." : "Recargar"}</span>
        </button>
      }
    >
      {error && (
        <p className="message error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="message success" role="status">
          {notice}
        </p>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Información de la cuenta</h2>
          {typeof profile?.role === "string" && (
            <span className="panel-meta">Rol: {profile.role}</span>
          )}
        </div>

        {loading ? (
          <div style={{ paddingTop: 16 }}>
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : (
          <form className="admin-form" onSubmit={handleSave}>
            <div className="form-grid">
              <label className="field">
                Nombre
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder="Nombre completo"
                />
              </label>
              <label className="field">
                Correo electrónico
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={160}
                  placeholder="correo@ejemplo.com"
                />
              </label>
              <label className="field">
                Teléfono
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  placeholder="8090000000"
                />
              </label>
              <label className="field">
                Ciudad
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={100}
                  placeholder="Santo Domingo"
                />
              </label>
              <label className="field field-wide">
                Dirección
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={250}
                  placeholder="Dirección comercial o de contacto"
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="button-primary" disabled={saving}>
                <Save size={14} />
                <span>{saving ? "Guardando..." : "Guardar cambios"}</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </AdminShell>
  );
}
