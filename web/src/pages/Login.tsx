import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, KeyRound, UserPlus, LogIn } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  isAuthenticated: boolean;
}

export default function Login({ onLoginSuccess, isAuthenticated }: LoginProps) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to index
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Authentication failed");
      }

      const data = await response.json();
      onLoginSuccess(data.token, data.username);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-background">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full border border-ui-border bg-panel p-6 font-mono text-xs shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-2 text-accent mb-6 border-b border-ui-border pb-3">
          {isRegistering ? (
            <UserPlus className="w-5 h-5 shrink-0" />
          ) : (
            <LogIn className="w-5 h-5 shrink-0" />
          )}
          <span className="font-bold tracking-wider uppercase">
            {isRegistering ? "Register Account" : "Vaultly Auth Shell"}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-950/20 border border-rose-900/50 text-rose-400 p-2.5 mb-4 flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>ERR_AUTH: {error}</span>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-ui-textMuted leading-relaxed">
            {isRegistering
              ? "Create a personal secure space. Your history will be isolated and encrypted."
              : "Access your dashboard to secure pastes and upload shared files."}
          </p>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-[10px] text-ui-textMuted uppercase font-semibold block">
              USERNAME:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rahul"
              required
              disabled={loading}
              autoFocus
              className="w-full bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono px-3 py-2 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] text-ui-textMuted uppercase font-semibold block">
              PASSWORD:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={loading}
                className="w-full bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono pl-8 pr-3 py-2 focus:outline-none focus:border-accent"
              />
              <KeyRound className="w-3.5 h-3.5 text-ui-textMuted absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Confirm Password (only if registering) */}
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-[10px] text-ui-textMuted uppercase font-semibold block">
                CONFIRM_PASSWORD:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={loading}
                  className="w-full bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono pl-8 pr-3 py-2 focus:outline-none focus:border-accent"
                />
                <KeyRound className="w-3.5 h-3.5 text-ui-textMuted absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-accent text-accent-text text-xs font-bold py-2 border border-accent hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
          >
            {loading
              ? "COMMUNICATING..."
              : isRegistering
              ? "CREATE_USER_SESSION"
              : "REQUEST_ACCESS"}
          </button>
        </div>

        {/* Toggle between Register and Sign in */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-[10px] text-accent hover:underline font-mono"
          >
            {isRegistering
              ? "ALREADY_REGISTERED? SIGN_IN"
              : "NEW_USER? REGISTER_ACCOUNT"}
          </button>
        </div>

        <div className="mt-6 pt-3 border-t border-ui-border text-center">
          <span className="text-[9px] text-ui-textMuted">VAULTLY_SECURE_AUTH_v2.0</span>
        </div>
      </form>
    </div>
  );
}
