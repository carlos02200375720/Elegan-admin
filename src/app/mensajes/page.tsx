"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Search, Send } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthProvider";
import {
  listMessages,
  MessageItem,
  MessageThread,
  replyToClientMessage,
} from "@/lib/admin-api";

function isFromAdmin(msg: MessageItem): boolean {
  if (typeof msg.fromAdmin === "boolean") return msg.fromAdmin;
  if (typeof msg.isAdmin === "boolean") return msg.isAdmin;
  const role = String(msg.senderRole ?? msg.sender ?? "").toLowerCase();
  return role === "admin" || role === "administrador" || role === "staff";
}

function formatTime(raw?: string): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString("es-DO", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MensajesInbox() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user_id") ?? "";
  const { token, handleUnauthorized } = useAdminAuth();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const threadsRef = useRef<MessageThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const loadAllThreads = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    setError("");
    try {
      const result = await listMessages(token, undefined, handleUnauthorized);
      setThreads(result);
      setSelectedUserId((current) => {
        if (current) return current;
        return result[0]?.userId ?? "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los mensajes.");
    } finally {
      setLoadingList(false);
    }
  }, [token, handleUnauthorized]);

  const loadThreadDetail = useCallback(
    async (userId: string) => {
      if (!token || !userId) {
        setActiveMessages([]);
        return;
      }
      setLoadingThread(true);
      try {
        const result = await listMessages(token, userId, handleUnauthorized);
        const match = result.find((t) => t.userId === userId) ?? result[0];
        if (match) {
          setActiveMessages(match.messages);
        } else {
          const fallback = threadsRef.current.find((t) => t.userId === userId);
          setActiveMessages(fallback?.messages ?? []);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo consultar la conversación del cliente."
        );
      } finally {
        setLoadingThread(false);
      }
    },
    [token, handleUnauthorized]
  );

  useEffect(() => {
    void loadAllThreads();
  }, [loadAllThreads]);

  useEffect(() => {
    if (selectedUserId) {
      void loadThreadDetail(selectedUserId);
    }
  }, [selectedUserId, loadThreadDetail]);

  async function handleSendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedUserId) return;
    const text = replyText.trim();
    if (!text) return;

    setSending(true);
    setError("");
    setNotice("");
    try {
      await replyToClientMessage(selectedUserId, text, token, handleUnauthorized);
      setReplyText("");
      setNotice("Respuesta enviada.");
      await Promise.all([loadThreadDetail(selectedUserId), loadAllThreads()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la respuesta.");
    } finally {
      setSending(false);
    }
  }

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.userName.toLowerCase().includes(q) ||
        t.userId.toLowerCase().includes(q) ||
        (t.userEmail ?? "").toLowerCase().includes(q)
    );
  }, [threads, search]);

  const selectedThread = threads.find((t) => t.userId === selectedUserId);

  return (
    <AdminShell
      title="Mensajes"
      subtitle="Consulta las conversaciones enviadas por los clientes desde la tienda y responde directamente."
      actions={
        <button
          type="button"
          className="button-secondary"
          disabled={loadingList}
          onClick={() => void loadAllThreads()}
        >
          <RefreshCw size={14} />
          <span>{loadingList ? "Actualizando..." : "Actualizar"}</span>
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

      <div className="inbox-grid">
        <div className="inbox-threads">
          <div className="inbox-threads-head">
            <span>Conversaciones</span>
            <span className="panel-meta tabular">{threads.length}</span>
          </div>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <div className="search-box" style={{ maxWidth: "100%" }}>
              <Search size={14} />
              <input
                type="search"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar conversaciones"
              />
            </div>
          </div>
          <div className="thread-list">
            {loadingList ? (
              <div style={{ padding: 14 }}>
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="empty-state">
                <p className="muted">No hay mensajes recibidos.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.userId}
                  type="button"
                  className={`thread-item ${
                    selectedUserId === thread.userId ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedUserId(thread.userId)}
                >
                  <span className="thread-item-name">{thread.userName}</span>
                  <span className="thread-item-preview">
                    {thread.lastText || "Sin mensajes"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="inbox-conversation">
          {!selectedUserId ? (
            <div className="empty-state" style={{ margin: "auto" }}>
              <p className="muted">
                Selecciona una conversación para leer el historial y responder.
              </p>
            </div>
          ) : (
            <>
              <div className="conversation-head">
                <div>
                  <strong>{selectedThread?.userName || `Cliente ${selectedUserId}`}</strong>
                  <div className="muted-sm mono">
                    ID: {selectedUserId}
                    {selectedThread?.userEmail ? ` · ${selectedThread.userEmail}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={loadingThread}
                  onClick={() => void loadThreadDetail(selectedUserId)}
                >
                  <RefreshCw size={14} />
                  <span>Recargar hilo</span>
                </button>
              </div>

              <div className="conversation-body">
                {loadingThread ? (
                  <p className="muted">Cargando conversación...</p>
                ) : activeMessages.length === 0 ? (
                  <p className="muted">No hay mensajes en este hilo.</p>
                ) : (
                  activeMessages.map((msg, idx) => {
                    const admin = isFromAdmin(msg);
                    return (
                      <div
                        key={msg.id || `${idx}-${msg.createdAt || ""}`}
                        className={`msg-bubble ${admin ? "is-admin" : ""}`}
                      >
                        <div>{msg.text}</div>
                        <div className="msg-meta">
                          {admin ? "Administración" : selectedThread?.userName || "Cliente"}
                          {msg.createdAt ? ` · ${formatTime(msg.createdAt)}` : ""}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form className="msg-composer" onSubmit={handleSendReply}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe tu respuesta para el cliente..."
                  aria-label="Responder mensaje"
                  required
                />
                <button
                  type="submit"
                  className="button-primary"
                  disabled={sending || !replyText.trim()}
                >
                  <Send size={14} />
                  <span>{sending ? "Enviando..." : "Enviar"}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

export default function MensajesPage() {
  return (
    <Suspense
      fallback={
        <AdminShell title="Mensajes">
          <p className="muted">Cargando bandeja de mensajes...</p>
        </AdminShell>
      }
    >
      <MensajesInbox />
    </Suspense>
  );
}
