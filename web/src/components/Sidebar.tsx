import { Link, useLocation } from "react-router-dom";
import { Plus, Clock, FileCode, Server, X } from "lucide-react";

interface RecentPaste {
  id: string;
  language: string;
  created_at: number;
}

interface SidebarProps {
  recentPastes: RecentPaste[];
  onClose?: () => void;
}

export default function Sidebar({ recentPastes, onClose }: SidebarProps) {
  const location = useLocation();

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <aside className="w-64 bg-panel border-r border-ui-border flex flex-col h-full shrink-0 text-sm select-none">
      {/* Title Header */}
      <div className="px-4 py-3 border-b border-ui-border flex items-center justify-between shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 font-mono font-bold tracking-tight text-ui-textMain"
          onClick={onClose}
        >
          <Server className="w-4 h-4 text-accent" />
          <span>VAULTLY</span>
          <span className="text-[10px] text-accent px-1.5 py-0.5 bg-accent-dim rounded border border-accent/20">
            v1.0
          </span>
        </Link>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 text-ui-textMuted hover:text-ui-textMain transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary Actions */}
      <div className="p-3 shrink-0">
        <Link
          to="/"
          onClick={onClose}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded border transition-colors duration-150 font-mono text-xs ${
            location.pathname === "/"
              ? "bg-accent text-accent-text border-accent hover:bg-accent-hover font-semibold"
              : "bg-panel-light text-ui-textMain border-ui-border hover:bg-panel hover:border-ui-borderHover"
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            New Paste
          </span>
          <kbd
            className={
              location.pathname === "/"
                ? "bg-black/20 border-black/10 text-accent-text hidden sm:inline"
                : "hidden sm:inline"
            }
          >
            N
          </kbd>
        </Link>
      </div>

      {/* Recents list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-ui-textMuted font-semibold px-3 mb-2">
          <Clock className="w-3 h-3 text-ui-textMuted" />
          <span>Recent Pastes</span>
        </div>

        {recentPastes.length === 0 ? (
          <div className="px-3 py-4 text-xs text-ui-textMuted font-mono italic border border-dashed border-ui-border rounded">
            No recent pastes
          </div>
        ) : (
          <div className="space-y-1">
            {recentPastes.map((paste) => {
              const isActive = location.pathname === `/p/${paste.id}`;
              return (
                <Link
                  key={paste.id}
                  to={`/p/${paste.id}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded font-mono text-xs border transition-colors duration-150 ${
                    isActive
                      ? "bg-panel-light text-accent border-ui-border"
                      : "text-ui-textMuted border-transparent hover:text-ui-textMain hover:bg-panel-light/50"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate min-w-0">
                    <FileCode className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{paste.id}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span className="text-[10px] text-ui-textMuted bg-ui-border px-1 rounded uppercase">
                      {paste.language}
                    </span>
                    <span className="text-[10px] text-ui-textMuted">
                      {formatTime(paste.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-ui-border bg-panel-light/30 shrink-0">
        <div className="flex items-center justify-between font-mono text-[10px] text-ui-textMuted px-2">
          <span>HOST: LOCALHOST</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
}
