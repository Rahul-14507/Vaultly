import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar.tsx";
import NewPaste from "./pages/NewPaste.tsx";
import ViewPaste from "./pages/ViewPaste.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Menu } from "lucide-react";

interface RecentPaste {
  id: string;
  language: string;
  created_at: number;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [recentPastes, setRecentPastes] = useState<RecentPaste[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Load recents on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vaultly_recents");
      if (stored) {
        setRecentPastes(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recent pastes from localStorage", e);
    }
  }, []);

  // Save new paste to recents
  const addRecentPaste = (id: string, language: string) => {
    const newRecent: RecentPaste = {
      id,
      language,
      created_at: Date.now()
    };
    setRecentPastes((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      const updated = [newRecent, ...filtered].slice(0, 15);
      localStorage.setItem("vaultly_recents", JSON.stringify(updated));
      return updated;
    });
  };

  // Global keydown listeners for shortcuts (desktop only)
  useEffect(() => {
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
  }, [navigate]);

  return (
    <div className="flex h-[100dvh] bg-background text-ui-textMain overflow-hidden font-sans">
      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile (slide-in), static on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          recentPastes={recentPastes}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-3 h-11 border-b border-ui-border bg-panel md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-ui-textMuted hover:text-ui-textMain transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-bold text-ui-textMain tracking-widest">VAULTLY</span>
        </div>

        <Routes>
          <Route path="/" element={<NewPaste onPasteCreated={addRecentPaste} />} />
          <Route path="/p/:id" element={<ViewPaste />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
