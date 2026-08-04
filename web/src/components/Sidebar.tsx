import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Clock, FileCode, Server, X, UploadCloud, Paperclip, Key, LogOut } from "lucide-react";
import { RecentItem } from "../App.tsx";

interface SidebarProps {
  recentItems: RecentItem[];
  isAuthenticated: boolean;
  onLogout: () => void;
  token: string | null;
  onItemUploaded: (item: RecentItem) => void;
  onClose?: () => void;
}

export default function Sidebar({
  recentItems,
  isAuthenticated,
  onLogout,
  token,
  onItemUploaded,
  onClose
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

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

  // Upload handler via native XHR for tracking progress
  const handleFileUpload = (file: File) => {
    if (!token) return;

    setUploadingFileName(file.name);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("expiresInHours", "24"); // Default 1 day expiry

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 201) {
        try {
          const res = JSON.parse(xhr.responseText);
          onItemUploaded({
            id: res.id,
            type: "file",
            name: file.name,
            created_at: Date.now()
          });
          if (onClose) onClose();
          navigate(`/f/${res.id}`);
        } catch (e) {
          console.error("Failed to parse response", e);
        }
      } else {
        if (xhr.status === 401) {
          onLogout();
          return;
        }
        let errMsg = "Upload failed";
        try {
          const res = JSON.parse(xhr.responseText);
          errMsg = res.error || errMsg;
        } catch (err) {}
        alert("Upload Error: " + errMsg);
      }
      setUploadProgress(null);
      setUploadingFileName(null);
    };

    xhr.onerror = () => {
      alert("Network upload error.");
      setUploadProgress(null);
      setUploadingFileName(null);
    };

    xhr.send(formData);
  };

  // Drag and drop event logic
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
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

      {/* Primary Action Buttons */}
      <div className="p-3 shrink-0 space-y-2">
        {isAuthenticated ? (
          <>
            <Link
              to="/"
              onClick={onClose}
              className={`flex items-center justify-between w-full px-3 py-2 rounded border transition-colors duration-150 font-mono text-xs ${
                location.pathname === "/"
                  ? "bg-accent text-accent-text border-accent hover:bg-accent-hover font-semibold"
                  : "bg-panel-light text-ui-textMain border-ui-border hover:bg-panel hover:border-ui-borderHover"
              }`}
            >
              <span className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                New Paste
              </span>
              <kbd className={location.pathname === "/" ? "bg-black/20 border-black/10 text-accent-text hidden sm:inline" : "hidden sm:inline"}>
                N
              </kbd>
            </Link>

            {/* Drag & Drop File Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border border-dashed rounded p-3 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-150
                ${isDragActive 
                  ? "border-accent bg-accent-dim/10" 
                  : "border-ui-border hover:border-ui-borderHover bg-panel-light/30"
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadCloud className={`w-5 h-5 mb-1.5 ${isDragActive ? "text-accent" : "text-ui-textMuted"}`} />
              <span className="text-[10px] font-mono text-ui-textMuted leading-tight">
                DRAG & DROP FILE<br />OR CLICK TO UPLOAD
              </span>
            </div>

            {/* Upload progress indicator */}
            {uploadProgress !== null && (
              <div className="bg-panel-light border border-ui-border p-2 space-y-1.5">
                <div className="flex justify-between font-mono text-[9px] text-ui-textMuted truncate gap-1">
                  <span className="truncate">{uploadingFileName}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-ui-border h-1 rounded overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <Link
            to="/login"
            onClick={onClose}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded border border-ui-border bg-panel-light text-accent hover:bg-accent-dim/5 transition-colors font-mono text-xs"
          >
            <span className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5" />
              Log in to create
            </span>
            <kbd className="border-accent/30 text-accent font-mono">L</kbd>
          </Link>
        )}
      </div>

      {/* Recents list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-ui-textMuted font-semibold px-3 mb-2">
          <Clock className="w-3 h-3 text-ui-textMuted" />
          <span>Recent items</span>
        </div>

        {recentItems.length === 0 ? (
          <div className="px-3 py-4 text-xs text-ui-textMuted font-mono italic border border-dashed border-ui-border rounded">
            No recent items
          </div>
        ) : (
          <div className="space-y-1">
            {recentItems.map((item) => {
              const itemPath = item.type === "paste" ? `/p/${item.id}` : `/f/${item.id}`;
              const isActive = location.pathname === itemPath;
              
              return (
                <Link
                  key={item.id}
                  to={itemPath}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded font-mono text-xs border transition-colors duration-150 ${
                    isActive
                      ? "bg-panel-light text-accent border-ui-border"
                      : "text-ui-textMuted border-transparent hover:text-ui-textMain hover:bg-panel-light/50"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate min-w-0">
                    {item.type === "paste" ? (
                      <FileCode className="w-3.5 h-3.5 shrink-0 opacity-60 text-accent" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 shrink-0 opacity-60 text-sky-400" />
                    )}
                    <span className="truncate" title={item.type === "file" ? item.name : item.id}>
                      {item.type === "file" ? item.name : item.id}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span className="text-[10px] text-ui-textMuted">
                      {formatTime(item.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-ui-border bg-panel-light/30 shrink-0">
        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded border border-ui-border hover:border-rose-900/50 hover:bg-rose-950/10 text-ui-textMuted hover:text-rose-400 transition-all font-mono text-[10px] mb-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>TERMINATE_SESSION</span>
          </button>
        ) : null}
        
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
