"use client";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import { BankAccount, createBankAccount, deleteBankAccount, listBankAccounts, updateBankAccount } from "@/lib/admin-api";

const empty = { bankName: "", accountNumber: "", accountType: "Ahorros", holderName: "", holderDocument: "", isActive: true };
export default function CuentasBancariasPage() {
  const { token, handleUnauthorized } = useAdminAuth();
  const [items, setItems] = useState<BankAccount[]>([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => { if (!token) return; try { setItems(await listBankAccounts(token, handleUnauthorized)); } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar las cuentas."); } }, [token, handleUnauthorized]);
  useEffect(() => { void load(); }, [load]);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!token) return; setBusy(true); setError(""); setNotice("");
    try { await createBankAccount(form, token, handleUnauthorized); setForm(empty); setNotice("Cuenta bancaria agregada."); await load(); }
    catch (x) { setError(x instanceof Error ? x.message : "No se pudo guardar."); } finally { setBusy(false); }
  }
  async function toggle(a: BankAccount) {
    if (!token) return; setBusy(true);
    try { await updateBankAccount(a.id, { isActive: !a.isActive }, token, handleUnauthorized); await load(); }
    catch (x) { setError(x instanceof Error ? x.message : "No se pudo actualizar."); } finally { setBusy(false); }
  }
  async function remove(a: BankAccount) {
    if (!token || !window.confirm("¿Eliminar esta cuenta bancaria?")) return; setBusy(true);
    try { await deleteBankAccount(a.id, token, handleUnauthorized); await load(); }
    catch (x) { setError(x instanceof Error ? x.message : "No se pudo eliminar."); } finally { setBusy(false); }
  }
  return <AdminShell title="Cuentas bancarias" subtitle="Administra las cuentas que los clientes podrán elegir para realizar transferencias.">
    {error && <p className="message error" role="alert">{error}</p>}{notice && <p className="message success" role="status">{notice}</p>}
    <section className="panel"><div className="panel-header"><h2>Agregar cuenta bancaria</h2></div>
      <form className="admin-form" onSubmit={save}><div className="form-grid">
        <label className="field">Banco<input required value={form.bankName} onChange={e=>setForm({...form,bankName:e.target.value})} placeholder="Banco Popular"/></label>
        <label className="field">Número de cuenta<input required value={form.accountNumber} onChange={e=>setForm({...form,accountNumber:e.target.value})}/></label>
        <label className="field">Tipo de cuenta<select value={form.accountType} onChange={e=>setForm({...form,accountType:e.target.value})}><option>Ahorros</option><option>Corriente</option></select></label>
        <label className="field">Titular<input required value={form.holderName} onChange={e=>setForm({...form,holderName:e.target.value})}/></label>
        <label className="field">Cédula / RNC (opcional)<input value={form.holderDocument} onChange={e=>setForm({...form,holderDocument:e.target.value})}/></label>
      </div><div className="form-actions"><button className="button-primary" disabled={busy}>Guardar cuenta</button></div></form>
    </section>
    <section className="panel"><div className="panel-header"><h2>Cuentas registradas</h2><span className="panel-meta">{items.length} cuentas</span></div>
      {items.length===0?<p className="muted">Todavía no has agregado cuentas.</p>:<div className="data-list">{items.map(a=><article className="data-row" key={a.id}><div className="row-info"><h3 className="row-title">{a.bankName}</h3><div className="row-meta"><span>ID: {a.id}</span><span>·</span><span>{a.accountType}</span><span>·</span><span>{a.accountNumber}</span><span>·</span><span>{a.holderName}</span><span>·</span><span>{a.isActive?"Activa":"Inactiva"}</span></div></div><div className="row-actions"><button className="button-secondary" disabled={busy} onClick={()=>void toggle(a)}>{a.isActive?"Desactivar":"Activar"}</button><button className="button-danger" disabled={busy} onClick={()=>void remove(a)}>Eliminar</button></div></article>)}</div>}
    </section>
  </AdminShell>;
}
