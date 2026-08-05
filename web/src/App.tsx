import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import Sidebar from "./components/Sidebar.tsx";
import NewPaste from "./pages/NewPaste.tsx";
import ViewPaste from "./pages/ViewPaste.tsx";
import ViewFile from "./pages/ViewFile.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Menu, ShieldAlert } from "lucide-react";

export interface RecentItem {
  id: string;
  type: "paste" | "file";
  language?: string; // for pastes
  name?: string;     // for files
  created_at: number;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Load token and username on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("vaultly_token");
    const storedUsername = localStorage.getItem("vaultly_username");
    
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUsername) {
      setUsername(storedUsername);
    }

    try {
      // Legacy compatibility: check if there's old storage recents, but we migrate to server history
      const storedRecents = localStorage.getItem("vaultly_recents");
      if (storedRecents && !storedToken) {
        setRecentItems(JSON.parse(storedRecents));
      }
    } catch (e) {
      console.error("Failed to load recents from localStorage", e);
    }
  }, []);

  // Fetch chronological user history from database
  const fetchHistory = async (tokenToUse: string | null) => {
    const activeToken = tokenToUse || token;
    if (!activeToken) return;

    try {
      const response = await fetch("/api/auth/history", {
        headers: {
          "Authorization": `Bearer ${activeToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentItems(data);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (e) {
      console.error("Failed to fetch user history from database", e);
    }
  };

  // Trigger history fetch when token changes
  useEffect(() => {
    if (token) {
      fetchHistory(token);
    } else {
      setRecentItems([]);
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, newUsername: string) => {
    localStorage.setItem("vaultly_token", newToken);
    localStorage.setItem("vaultly_username", newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem("vaultly_token");
    localStorage.removeItem("vaultly_username");
    setToken(null);
    setUsername(null);
    setRecentItems([]);
    navigate("/login");
  };

  const isAuthenticated = !!token;

  // Global keydown listener for shortcuts (desktop only, authenticated only)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, isAuthenticated]);

  return (
    <div className="flex h-[100dvh] bg-background text-ui-textMain overflow-hidden font-sans">
      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed on mobile (slide-in), static on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          recentItems={recentItems}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
          token={token}
          onItemUploaded={() => fetchHistory(token)}
          onClose={() => setSidebarOpen(false)}
          username={username}
        />
      </div>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-3 h-11 border-b border-ui-border bg-panel md:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-ui-textMuted hover:text-ui-textMain transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold text-ui-textMain tracking-widest">VAULTLY</span>
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-accent font-semibold">{username}</span>
              <button 
                onClick={handleLogout}
                className="text-[10px] font-mono text-rose-400 border border-rose-950 px-2 py-0.5"
              >
                LOGOUT
              </button>
            </div>
          )}
        </div>

        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <NewPaste 
                  onPasteCreated={() => fetchHistory(token)} 
                  token={token} 
                  onUnauthorized={handleLogout} 
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 bg-background">
                  <div className="max-w-md w-full border border-ui-border bg-panel p-6 font-mono text-xs text-center space-y-4 shadow-lg">
                    <div className="flex justify-center text-accent">
                      <ShieldAlert className="w-12 h-12" />
                    </div>
                    <h3 className="font-bold text-accent text-sm tracking-wider uppercase">Vaultly Session Required</h3>
                    <p className="text-ui-textMuted leading-relaxed">
                      This Vaultly instance is currently sealed. You must authenticate to establish a session and create pastes or upload files.
                    </p>
                    <Link
                      to="/login"
                      className="inline-block bg-accent text-accent-text font-bold px-4 py-2 border border-accent hover:bg-accent-hover transition-colors font-mono"
                    >
                      REQUEST_ACCESS
                    </Link>
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/login"
            element={
              <Login
                onLoginSuccess={handleLoginSuccess}
                isAuthenticated={isAuthenticated}
              />
            }
          />
          <Route path="/p/:id" element={<ViewPaste />} />
          <Route path="/f/:id" element={<ViewFile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
