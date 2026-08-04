import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertTriangle, KeyRound } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  isAuthenticated: boolean;
}

export default function Login({ onLoginSuccess, isAuthenticated }: LoginProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
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
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Authentication failed");
      }

      const data = await response.json();
      onLoginSuccess(data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid password or server error");
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
          <Shield className="w-5 h-5 shrink-0" />
          <span className="font-bold tracking-wider uppercase">Vaultly Admin Shell</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-950/20 border border-rose-900/50 text-rose-400 p-2.5 mb-4 flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>ACCESS_DENIED: {error}</span>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-ui-textMuted leading-relaxed">
            This instance requires password authentication to create pastes and upload files.
          </p>

          <div className="space-y-2">
            <label className="text-[10px] text-ui-textMuted uppercase font-semibold block">
              ENTER_PASSWORD:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={loading}
                autoFocus
                className="w-full bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono pl-8 pr-3 py-2 focus:outline-none focus:border-accent"
              />
              <KeyRound className="w-3.5 h-3.5 text-ui-textMuted absolute left-2.5 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-accent text-accent-text text-xs font-bold py-2 border border-accent hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "AUTHENTICATING..." : "REQUEST_ACCESS"}
          </button>
        </div>

        <div className="mt-6 pt-3 border-t border-ui-border text-center">
          <span className="text-[9px] text-ui-textMuted">VAULTLY_SECURE_AUTH_v1.0</span>
        </div>
      </form>
    </div>
  );
}
