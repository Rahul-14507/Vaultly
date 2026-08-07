import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Prism from "prismjs";
import { Copy, Check, Eye, Calendar, FileText, ArrowLeft, AlertCircle } from "lucide-react";

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-csharp";

interface PasteData {
  id: string;
  content: string;
  language: string;
  created_at: number;
  expires_at: number | null;
  views: number;
}

export default function ViewPaste() {
  const { id } = useParams<{ id: string }>();
  const [paste, setPaste] = useState<PasteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiryText, setExpiryText] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "danger" | "none">("none");

  useEffect(() => {
    const fetchPaste = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/pastes/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Paste not found or has expired");
          throw new Error("Failed to load paste");
        }
        setPaste(await response.json());
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchPaste();
  }, [id]);

  useEffect(() => {
    if (paste) Prism.highlightAll();
  }, [paste]);

  useEffect(() => {
    if (!paste) return;

    const calculateCountdown = () => {
      if (paste.expires_at === null) {
        setExpiryText("Never");
        setUrgency("none");
        return;
      }
      const diff = paste.expires_at - Date.now();
      if (diff <= 0) { setExpiryText("Expired"); setUrgency("danger"); return; }

      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setExpiryText(`${days}d ${hours % 24}h`);
        setUrgency("normal");
      } else if (hours > 0) {
        setExpiryText(`${hours}h ${mins % 60}m`);
        setUrgency("warning");
      } else {
        const secs = Math.floor((diff % 60000) / 1000);
        setExpiryText(`${mins}m ${secs}s`);
        setUrgency("danger");
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [paste]);

  const handleCopy = async () => {
    if (!paste) return;
    try {
      await navigator.clipboard.writeText(paste.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-ui-textMuted select-none">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>FETCHING_DATA FROM CORE...</span>
        </div>
      </div>
    );
  }

  if (error || !paste) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
        <div className="max-w-md w-full border border-rose-950 bg-panel p-5 sm:p-6 font-mono text-xs">
          <div className="flex items-center gap-2 text-rose-500 mb-4 border-b border-rose-950 pb-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold tracking-wider uppercase">Vaultly Exception Handled</span>
          </div>
          <div className="space-y-3 text-ui-textMuted leading-relaxed">
            <p><span className="text-ui-textMain">STATUS_CODE:</span> 404_NOT_FOUND</p>
            <p><span className="text-ui-textMain">MESSAGE:</span> {error || "RESOURCE_UNAVAILABLE"}</p>
            <p>
              The paste ID <span className="text-accent break-all">"{id}"</span> does not exist
              or has expired and been cleaned up.
            </p>
          </div>
          <div className="mt-6 border-t border-rose-950 pt-4 flex justify-between">
            <Link to="/" className="flex items-center gap-1 text-accent hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to index</span>
            </Link>
            <span className="text-[10px] text-ui-textMuted">VAULTLY_PRUNE</span>
          </div>
        </div>
      </div>
    );
  }

  const urgencyClass = {
    danger: "bg-rose-950/20 text-rose-400 border-rose-900/50",
    warning: "bg-amber-950/20 text-amber-400 border-amber-900/50",
    normal: "bg-ui-border text-ui-textMain border-ui-border",
    none: "bg-emerald-950/20 text-emerald-400 border-emerald-900/50",
  }[urgency];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header: two rows on mobile, single row on desktop ── */}
      <header className="border-b border-ui-border bg-panel shrink-0 select-none">
        {/* Row 1: paste ID + actions */}
        <div className="flex items-center justify-between px-3 h-11 gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-ui-textMuted min-w-0">
            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">PASTE:</span>{paste.id}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1.5 border transition-all duration-150 ${
                copied
                  ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
                  : "bg-panel-light text-ui-textMain border-ui-border hover:bg-panel hover:border-ui-borderHover"
              }`}
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /><span>COPIED</span></>
              ) : (
                <><Copy className="w-3.5 h-3.5" /><span>COPY</span></>
              )}
            </button>

            <a
              href={`/api/pastes/${paste.id}/raw`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-panel-light text-ui-textMain text-xs font-mono font-semibold px-2.5 py-1.5 border border-ui-border hover:bg-panel hover:border-ui-borderHover transition-colors duration-150"
            >
              RAW
            </a>
          </div>
        </div>

        {/* Row 2: expiry badge + views — full width on mobile */}
        <div className="flex items-center gap-3 px-3 pb-2 border-t border-ui-border/40 pt-1.5 sm:hidden">
          <span className={`px-2 py-0.5 border text-[10px] uppercase font-semibold font-mono ${urgencyClass}`}>
            {expiryText}
          </span>
          <span className="text-ui-textMuted flex items-center gap-1 text-xs font-mono">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-semibold text-ui-textMain">{paste.views}</span>
            <span>views</span>
          </span>
        </div>

        {/* Row 2 desktop: inline with divider */}
        <div className="hidden sm:flex items-center gap-3 px-3 pb-1.5 text-xs font-mono">
          <div className="h-4 w-[1px] bg-ui-border" />
          <span className={`px-2 py-0.5 border text-[10px] uppercase font-semibold ${urgencyClass}`}>
            {expiryText}
          </span>
          <span className="text-ui-textMuted flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-semibold text-ui-textMain">{paste.views}</span>
            <span>views</span>
          </span>
        </div>
      </header>

      {/* Code view */}
      <div className="flex-1 min-h-0 bg-ui-codeBackground overflow-auto relative">
        <pre className="m-0 border-0 min-h-full overflow-auto rounded-none">
          <code className={`language-${paste.language}`}>{paste.content}</code>
        </pre>
      </div>

      {/* Status bar */}
      <footer className="h-8 border-t border-ui-border bg-panel flex items-center justify-between px-3 sm:px-4 text-[11px] font-mono text-ui-textMuted shrink-0 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar className="w-3 h-3 shrink-0" />
          <span className="truncate">{formatDate(paste.created_at)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="uppercase text-accent">{paste.language}</span>
          <span>{paste.content.split("\n").length}L</span>
        </div>
      </footer>
    </div>
  );
}
