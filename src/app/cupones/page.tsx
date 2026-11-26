"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, Ticket } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import {
  Coupon,
  createCouponItem,
  deleteCouponItem,
  listCoupons,
  updateCouponItem,
} from "@/lib/admin-api";
import { formatCurrencyDOP } from "@/lib/currency";

export default function CuponesPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyCode, setBusyCode] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems(await listCoupons(token, handleUnauthorized));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los cupones.");
    } finally {
      setLoading(false);
    }
  }, [token, handleUnauthorized]);

  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const value = Number(discountValue);
    if (!Number.isSafeInteger(value) || value <= 0 || (discountType === "percentage" && value > 100)) {
      setError(discountType === "percentage" ? "El porcentaje debe estar entre 0 y 100." : "Introduce un monto válido.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await createCouponItem({ code: code.trim().toUpperCase(), discountType, discountValue: value, isActive }, token, handleUnauthorized);
      setCode("");
      setDiscountValue("");
      setDiscountType("percentage");
      setIsActive(true);
      setNotice("Cupón creado correctamente.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cupón.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: Coupon) {
    if (!token) return;
    setBusyCode(item.code);
    setError("");
    try {
      await updateCouponItem(item.code, { isActive: !item.isActive }, token, handleUnauthorized);
      setItems(current => current.map(row => row.code === item.code ? { ...row, isActive: !row.isActive } : row));
      setNotice(`Cupón ${item.code}: ${item.isActive ? "desactivado" : "activado"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setBusyCode("");
    }
  }

  async function remove(item: Coupon) {
    if (!token) return;
    setBusyCode(item.code);
    setError("");
    setNotice("");
    try {
      await deleteCouponItem(item.code, token, handleUnauthorized);
      setItems(current => current.filter(row => row.code !== item.code));
      setNotice(`Cupón ${item.code} eliminado. Los pedidos anteriores conservan su descuento.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el cupón.");
    } finally {
      setBusyCode("");
    }
  }

  return (
    <AdminShell
      title="Cupones"
      subtitle="Crea y administra códigos de descuento para las compras de la aplicación."
      actions={<button type="button" className="button-primary" onClick={() => document.getElementById("coupon-code")?.focus()}><Plus size={15} /><span>Nuevo cupón</span></button>}
    >
      {error && <p className="message error" role="alert">{error}</p>}
      {notice && <p className="message success" role="status">{notice}</p>}
      <section className="panel">
        <div className="panel-header"><h2>Crear cupón</h2><span className="panel-meta">Porcentaje o monto fijo</span></div>
        <form className="admin-form" onSubmit={create}>
          <div className="form-grid">
            <label className="field">Código
              <input id="coupon-code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ELEGAN10" minLength={2} maxLength={40} required />
            </label>
            <label className="field">Tipo de descuento
              <select value={discountType} onChange={e => setDiscountType(e.target.value as "percentage" | "fixed")}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </label>
            <label className="field">Valor {discountType === "percentage" ? "(%)" : "(RD$)"}
              <input type="number" min="1" max={discountType === "percentage" ? "100" : undefined} step="1" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "percentage" ? "10" : "500"} required />
            </label>
            <label className="field">Estado
              <select value={isActive ? "active" : "inactive"} onChange={e => setIsActive(e.target.value === "active")}>
                <option value="active">Activo</option><option value="inactive">Inactivo</option>
              </select>
            </label>
          </div>
          <div className="form-actions"><button className="button-primary" type="submit" disabled={saving}>{saving ? "Guardando..." : "Publicar cupón"}</button></div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-header"><h2>Cupones registrados</h2><span className="panel-meta tabular">{items.length} cupones</span></div>
        {loading ? <div className="skeleton-row" /> : items.length === 0 ? <div className="empty-state"><Ticket size={24} /><p className="muted">Todavía no hay cupones creados.</p></div> : (
          <div className="data-list">
            {items.map(item => <article className="data-row" key={item.code}>
              <div className="row-info">
                <h3 className="row-title">{item.code}</h3>
                <div className="row-meta">
                  <span>{item.discountType === "percentage" ? `${item.discountValue}% de descuento` : `${formatCurrencyDOP(item.discountValue)} de descuento`}</span>
                  <span aria-hidden="true">·</span>
                  <span className={`status-text ${item.isActive ? "status-success" : "status-muted"}`}>{item.isActive ? "Activo" : "Inactivo"}</span>
                </div>
              </div>
              <div className="row-actions">
                <button type="button" className="button-secondary" disabled={busyCode === item.code} onClick={() => void toggle(item)}>{item.isActive ? "Desactivar" : "Activar"}</button>
                <DeleteConfirmButton disabled={busyCode === item.code} onConfirm={() => remove(item)} />
              </div>
            </article>)}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
