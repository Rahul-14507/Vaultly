import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Download, Eye, Calendar, FileIcon, ImageIcon, 
  FileTextIcon, FileArchiveIcon, CodeIcon, ArrowLeft, AlertCircle 
} from "lucide-react";

interface FileData {
  id: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  created_at: number;
  expires_at: number | null;
  downloads: number;
}

export default function ViewFile() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expiryText, setExpiryText] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "danger" | "none">("none");

  // Fetch file info
  useEffect(() => {
    const fetchFileInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/files/${id}/info`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("File not found or has expired");
          }
          throw new Error("Failed to load file information");
        }
        const data = await response.json();
        setFile(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFileInfo();
  }, [id]);

  // Expiry countdown timer
  useEffect(() => {
    if (!file) return;

    const calculateCountdown = () => {
      if (file.expires_at === null) {
        setExpiryText("Never Expires");
        setUrgency("none");
        return;
      }

      const diff = file.expires_at - Date.now();
      if (diff <= 0) {
        setExpiryText("Expired");
        setUrgency("danger");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

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
  }, [file]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get MIME category and Lucide icon
  const getFileCategoryInfo = (mime: string | null) => {
    if (!mime) return { category: "other", icon: <FileIcon className="w-8 h-8 text-ui-textMuted" /> };
    
    const lowerMime = mime.toLowerCase();
    
    if (lowerMime.startsWith("image/")) {
      return { category: "image", icon: <ImageIcon className="w-8 h-8 text-accent" /> };
    }
    
    // Docs
    if (
      lowerMime.includes("pdf") ||
      lowerMime.includes("document") ||
      lowerMime.includes("msword") ||
      lowerMime.includes("text/") ||
      lowerMime.includes("excel") ||
      lowerMime.includes("spreadsheet") ||
      lowerMime.includes("powerpoint")
    ) {
      return { category: "doc", icon: <FileTextIcon className="w-8 h-8 text-sky-400" /> };
    }

    // Archives
    if (
      lowerMime.includes("zip") ||
      lowerMime.includes("rar") ||
      lowerMime.includes("tar") ||
      lowerMime.includes("compressed") ||
      lowerMime.includes("7z")
    ) {
      return { category: "archive", icon: <FileArchiveIcon className="w-8 h-8 text-amber-500" /> };
    }

    // Code
    if (
      lowerMime.includes("javascript") ||
      lowerMime.includes("typescript") ||
      lowerMime.includes("json") ||
      lowerMime.includes("html") ||
      lowerMime.includes("css") ||
      lowerMime.includes("python") ||
      lowerMime.includes("rust") ||
      lowerMime.includes("go")
    ) {
      return { category: "code", icon: <CodeIcon className="w-8 h-8 text-emerald-400" /> };
    }

    return { category: "other", icon: <FileIcon className="w-8 h-8 text-ui-textMuted" /> };
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-ui-textMuted select-none">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>PARSING_FILE_METADATA...</span>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full border border-rose-950 bg-panel p-5 font-mono text-xs">
          <div className="flex items-center gap-2 text-rose-500 mb-4 border-b border-rose-950 pb-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold uppercase">Vaultly Exception Handled</span>
          </div>
          <div className="space-y-3 text-ui-textMuted leading-relaxed">
            <p><span className="text-ui-textMain">STATUS_CODE:</span> 404_NOT_FOUND</p>
            <p><span className="text-ui-textMain">MESSAGE:</span> {error || "FILE_UNAVAILABLE"}</p>
            <p>
              The requested file ID <span className="text-accent break-all">"{id}"</span> does not exist or has expired.
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

  const catInfo = getFileCategoryInfo(file.mime_type);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-ui-border flex items-center justify-between px-4 bg-panel shrink-0 select-none">
        <div className="flex items-center gap-2 text-xs font-mono text-ui-textMuted">
          <FileIcon className="w-3.5 h-3.5 text-accent" />
          <span>FILE:{file.id}</span>
        </div>
        <span className={`px-2 py-0.5 border text-[10px] uppercase font-semibold font-mono ${urgencyClass}`}>
          {expiryText}
        </span>
      </header>

      {/* Main Preview/Details Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center bg-ui-codeBackground">
        <div className="max-w-lg w-full bg-panel border border-ui-border p-6 space-y-6">
          
          {/* File Card Info */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-panel-light border border-ui-border shrink-0">
              {catInfo.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-ui-textMain font-mono truncate break-all mb-1" title={file.original_name}>
                {file.original_name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-ui-textMuted">
                <span className="text-ui-textMain font-semibold right-align">{formatBytes(file.size_bytes)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="truncate max-w-[150px]">{file.mime_type || "unknown/mime"}</span>
              </div>
            </div>
          </div>

          {/* Visual inline preview for image category */}
          {catInfo.category === "image" && (
            <div className="border border-ui-border bg-ui-codeBackground p-2 flex items-center justify-center overflow-hidden max-h-[300px]">
              <img 
                src={`/api/files/${file.id}`} 
                alt={file.original_name} 
                className="max-h-[280px] w-auto object-contain select-none pointer-events-none"
              />
            </div>
          )}

          {/* Action and Download Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={`/api/files/${file.id}?download=true`}
              className="flex items-center justify-center gap-2 bg-accent text-accent-text text-xs font-mono font-bold w-full sm:flex-1 py-2.5 border border-accent hover:bg-accent-hover transition-colors duration-150"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD FILE</span>
            </a>
            
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-ui-textMuted py-2 shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span>DOWNLOADS:</span>
              <span className="text-ui-textMain font-bold">{file.downloads}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Status Bar */}
      <footer className="h-8 border-t border-ui-border bg-panel flex items-center justify-between px-4 text-[11px] font-mono text-ui-textMuted shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>UPLOADED: {formatDate(file.created_at)}</span>
        </div>
        <span className="text-accent uppercase font-bold">FILE_SHARING</span>
      </footer>
    </div>
  );
}
