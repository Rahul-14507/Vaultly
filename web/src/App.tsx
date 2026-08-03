import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.tsx";
import NewPaste from "./pages/NewPaste.tsx";
import ViewPaste from "./pages/ViewPaste.tsx";
import NotFound from "./pages/NotFound.tsx";

interface RecentPaste {
  id: string;
  language: string;
  created_at: number;
}

export default function App() {
  const navigate = useNavigate();
  const [recentPastes, setRecentPastes] = useState<RecentPaste[]>([]);

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

  // Global keydown listeners for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput) return;

      // 'N' navigates to new paste
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-background text-ui-textMain overflow-hidden font-sans">
      {/* Sidebar navigation panel */}
      <Sidebar recentPastes={recentPastes} />

      {/* Main workspace panels */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <Routes>
          <Route path="/" element={<NewPaste onPasteCreated={addRecentPaste} />} />
          <Route path="/p/:id" element={<ViewPaste />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
