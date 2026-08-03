import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Prism from "prismjs";
import { Copy, Check, Eye, Calendar, FileText, ArrowLeft, AlertCircle } from "lucide-react";

// Import Prism language syntax definitions
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup"; // handles HTML
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";

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

  // Fetch paste details
  useEffect(() => {
    const fetchPaste = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/pastes/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Paste not found or has expired");
          }
          throw new Error("Failed to load paste");
        }
        const data = await response.json();
        setPaste(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPaste();
  }, [id]);

  // Syntax highlighting trigger
  useEffect(() => {
    if (paste) {
      Prism.highlightAll();
    }
  }, [paste]);

  // Countdown timer for expiry
  useEffect(() => {
    if (!paste) return;

    const calculateCountdown = () => {
      if (paste.expires_at === null) {
        setExpiryText("Never Expires");
        setUrgency("none");
        return;
      }

      const diff = paste.expires_at - Date.now();
      if (diff <= 0) {
        setExpiryText("Expired");
        setUrgency("danger");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

      // Determine colors & string
      if (days > 0) {
        setExpiryText(`Expires in ${days}d ${hours % 24}h`);
        setUrgency("normal");
      } else if (hours > 0) {
        setExpiryText(`Expires in ${hours}h ${mins % 60}m`);
        setUrgency("warning");
      } else {
        const secs = Math.floor((diff % 60000) / 1000);
        setExpiryText(`Expires in ${mins}m ${secs}s`);
        setUrgency("danger");
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [paste]);

  // Handle Copy to Clipboard
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

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-ui-textMuted select-none">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span>FETCHING_DATA FROM CORE...</span>
        </div>
      </div>
    );
  }

  // Designed 404/expired error state
  if (error || !paste) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full border border-rose-950 bg-panel p-6 font-mono text-xs">
          <div className="flex items-center gap-2 text-rose-500 mb-4 border-b border-rose-950 pb-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold tracking-wider uppercase">Vaultly Exception Handled</span>
          </div>
          <div className="space-y-3 text-ui-textMuted leading-relaxed">
            <p>
              <span className="text-ui-textMain">STATUS_CODE:</span> 404_NOT_FOUND
            </p>
            <p>
              <span className="text-ui-textMain">MESSAGE:</span> {error || "RESOURCE_UNAVAILABLE"}
            </p>
            <p>
              The requested paste ID <span className="text-accent">"{id}"</span> does not exist or has expired and been cleaned up by the background prune agent.
            </p>
          </div>
          <div className="mt-6 border-t border-rose-950 pt-4 flex justify-between">
            <Link
              to="/"
              className="flex items-center gap-1 text-accent hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to index</span>
            </Link>
            <span className="text-[10px] text-ui-textMuted">VAULTLY_PRUNE_ROUTINE</span>
          </div>
        </div>
      </div>
    );
  }

  // Urgency badge styling mapper
  const getUrgencyClass = () => {
    switch (urgency) {
      case "danger":
        return "bg-rose-950/20 text-rose-400 border-rose-900/50";
      case "warning":
        return "bg-amber-950/20 text-amber-400 border-amber-900/50";
      case "normal":
        return "bg-ui-border text-ui-textMain border-ui-border";
      default:
        return "bg-emerald-950/20 text-emerald-400 border-emerald-900/50";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Code Header Actions Panel */}
      <header className="h-12 border-b border-ui-border flex items-center justify-between px-4 bg-panel shrink-0 select-none">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-ui-textMuted">
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>PASTE:{paste.id}</span>
          </div>
          
          <div className="h-4 w-[1px] bg-ui-border"></div>

          {/* Expiry and Stats */}
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 border text-[10px] uppercase font-semibold ${getUrgencyClass()}`}>
              {expiryText}
            </span>
            <span className="text-ui-textMuted flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-ui-textMuted" />
              <span className="font-semibold text-ui-textMain">{paste.views}</span> views
            </span>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 text-xs font-mono font-semibold px-3 py-1.5 border transition-all duration-150 ${
              copied
                ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
                : "bg-panel-light text-ui-textMain border-ui-border hover:bg-panel hover:border-ui-borderHover"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY</span>
              </>
            )}
          </button>

          {/* Raw Link */}
          <a
            href={`/api/pastes/${paste.id}/raw`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-panel-light text-ui-textMain text-xs font-mono font-semibold px-3 py-1.5 border border-ui-border hover:bg-panel hover:border-ui-borderHover transition-colors duration-150"
          >
            <span>RAW</span>
          </a>
        </div>
      </header>

      {/* Editor Body (Syntax Highlighted) */}
      <div className="flex-1 min-h-0 bg-ui-codeBackground overflow-auto relative">
        <pre className="m-0 border-0 h-full overflow-auto rounded-none">
          <code className={`language-${paste.language}`}>
            {paste.content}
          </code>
        </pre>
      </div>

      {/* Bottom Metadata Status Bar */}
      <footer className="h-8 border-t border-ui-border bg-panel flex items-center justify-between px-4 text-[11px] font-mono text-ui-textMuted shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-ui-textMuted" />
          <span>CREATED: {formatDate(paste.created_at)}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="uppercase text-accent">{paste.language}</span>
          <span>{paste.content.split("\n").length} lines</span>
        </div>
      </footer>
    </div>
  );
}
