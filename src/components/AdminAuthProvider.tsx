"use client";

import {
  createContext,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Lock, ShieldCheck } from "lucide-react";
import {
  AdminUser,
  clearStoredToken,
  fetchAuthMe,
  getApiBase,
  getStoredToken,
  loginWithGoogleCredential,
  loginWithPassword,
  logoutAdminSession,
  setStoredToken,
} from "@/lib/admin-api";

type AdminAuthContextValue = {
  token: string;
  user: AdminUser | null;
  checkingSession: boolean;
  handleUnauthorized: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider.");
  }
  return ctx;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleTokenInput, setGoogleTokenInput] = useState("");
  const [showGoogleManual, setShowGoogleManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const apiBase = getApiBase();

  const handleUnauthorized = useCallback(() => {
    clearStoredToken();
    setToken("");
    setUser(null);
    setAuthError("La sesión expiró o no tiene permisos administrativos.");
  }, []);

  const validateTokenWithMe = useCallback(
    async (authToken: string) => {
      if (!authToken) {
        setCheckingSession(false);
        return;
      }
      setCheckingSession(true);
      try {
        const me = await fetchAuthMe(authToken, () => {
          clearStoredToken();
          setToken("");
          setUser(null);
        });
        setToken(authToken);
        setUser(me);
        setAuthError("");
      } catch (err) {
        clearStoredToken();
        setToken("");
        setUser(null);
        setAuthError(
          err instanceof Error
            ? err.message
            : "No se pudo validar la sesión administrativa."
        );
      } finally {
        setCheckingSession(false);
      }
    },
    []
  );

  useEffect(() => {
    const saved = getStoredToken();
    if (saved) {
      void validateTokenWithMe(saved);
    } else {
      setCheckingSession(false);
    }
  }, [validateTokenWithMe]);

  const completeLogin = useCallback(
    async (newToken: string, initialUser?: AdminUser) => {
      setStoredToken(newToken);
      setToken(newToken);
      if (initialUser) setUser(initialUser);
      try {
        const me = await fetchAuthMe(newToken);
        setUser(me);
      } catch {
        // Si /me devuelve error de autorización real, se limpia; si solo faltan campos, mantenemos initialUser si existe.
        if (!initialUser) {
          setUser({ email });
        }
      }
      setPassword("");
      setGoogleTokenInput("");
      setAuthError("");
    },
    [email]
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setSubmitting(true);
      setAuthError("");
      try {
        const result = await loginWithGoogleCredential(credential);
        await completeLogin(result.token, result.user);
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : "Error al iniciar sesión con Google."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [completeLogin]
  );

  useEffect(() => {
    if (token || checkingSession || !googleClientId || !googleBtnRef.current) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response.credential) {
            void handleGoogleCredential(response.credential);
          }
        },
      });
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "continue_with",
        locale: "es",
      });
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const scriptId = "google-identity-services";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [token, checkingSession, googleClientId, handleGoogleCredential]);

  async function submitPasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiBase) {
      setAuthError("Falta configurar NEXT_PUBLIC_API_BASE_URL.");
      return;
    }
    setSubmitting(true);
    setAuthError("");
    try {
      const result = await loginWithPassword(email.trim(), password);
      await completeLogin(result.token, result.user);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitManualGoogleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!googleTokenInput.trim()) return;
    await handleGoogleCredential(googleTokenInput.trim());
  }

  const logout = useCallback(async () => {
    const current = token;
    clearStoredToken();
    setToken("");
    setUser(null);
    setAuthError("");
    await logoutAdminSession(current);
  }, [token]);

  const refreshSession = useCallback(async () => {
    if (token) {
      await validateTokenWithMe(token);
    }
  }, [token, validateTokenWithMe]);

  if (checkingSession) {
    return (
      <main className="auth-shell">
        <section className="login-panel">
          <p className="eyebrow">ELEGAN · ADMINISTRACIÓN</p>
          <h1>Verificando sesión</h1>
          <p className="muted">Comprobando permisos administrativos...</p>
        </section>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="auth-shell">
        <section className="login-panel">
          <div className="login-brand">
            <Lock size={18} strokeWidth={2} />
            <span>Elegan Administración</span>
          </div>
          <h1>Acceso administrativo</h1>
          <p className="muted">
            Inicia sesión con tu cuenta autorizada para gestionar el catálogo,
            anuncios, órdenes y mensajes.
          </p>

          {!apiBase && (
            <p className="message error" role="alert">
              Falta configurar la variable <code>NEXT_PUBLIC_API_BASE_URL</code>.
            </p>
          )}

          <form className="login-form" onSubmit={submitPasswordLogin}>
            <label htmlFor="admin-email">Correo electrónico</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@elegan.com"
              required
            />
            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={submitting || !apiBase}>
              {submitting ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="auth-divider">
            <span>Acceso de superadministrador</span>
          </div>

          {googleClientId ? (
            <div className="google-btn-slot" ref={googleBtnRef} />
          ) : (
            <div className="google-fallback">
              <button
                type="button"
                className="button-secondary button-full"
                onClick={() => setShowGoogleManual((prev) => !prev)}
              >
                <ShieldCheck size={16} />
                <span>Continuar con Google (token de superadministrador)</span>
              </button>
              {showGoogleManual && (
                <form className="google-token-form" onSubmit={submitManualGoogleLogin}>
                  <label htmlFor="google-id-token">Token ID de Google</label>
                  <input
                    id="google-id-token"
                    type="password"
                    value={googleTokenInput}
                    onChange={(e) => setGoogleTokenInput(e.target.value)}
                    placeholder="Pega el Google ID Token autorizado"
                    required
                  />
                  <small className="muted-sm">
                    Configura <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> para mostrar el selector nativo de Google.
                  </small>
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={submitting || !apiBase}
                  >
                    {submitting ? "Validando..." : "Validar acceso con Google"}
                  </button>
                </form>
              )}
            </div>
          )}

          {authError && (
            <p className="message error" role="alert">
              {authError}
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <AdminAuthContext.Provider
      value={{
        token,
        user,
        checkingSession,
        handleUnauthorized,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
