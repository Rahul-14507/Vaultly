import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, Send, AlertTriangle } from "lucide-react";

interface NewPasteProps {
  onPasteCreated: (id: string, language: string) => void;
  token: string | null;
  onUnauthorized: () => void;
}

const LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash / Shell" },
  { value: "markdown", label: "Markdown" },
];

const EXPIRY_OPTIONS = [
  { value: "1", label: "1 Hour" },
  { value: "24", label: "1 Day" },
  { value: "168", label: "7 Days" },
  { value: "never", label: "Never" },
];

export default function NewPaste({ onPasteCreated, token, onUnauthorized }: NewPasteProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [expiry, setExpiry] = useState("24");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Focus textarea on load — desktop only (avoids mobile keyboard popping up)
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const textUpToCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textUpToCursor.split("\n");
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Paste content cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    const expiresInHours = expiry === "never" ? null : parseInt(expiry, 10);

    try {
      const response = await fetch("/api/pastes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content, language, expiresInHours }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        const errData = await response.json();
        throw new Error(errData.error || "Failed to create paste");
      }

      const data = await response.json();
      onPasteCreated(data.id, language);
      navigate(`/p/${data.id}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the paste.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Toolbar: stacks on mobile, single row on desktop ── */}
      <header className="border-b border-ui-border bg-panel shrink-0 select-none">
        {/* Top row: file name + Create button */}
        <div className="flex items-center justify-between px-3 h-11">
          <div className="flex items-center gap-2 text-xs font-mono text-ui-textMuted min-w-0">
            <Terminal className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate hidden sm:block">NEW_PASTE.txt</span>
            <span className="truncate sm:hidden">New Paste</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="flex items-center gap-1.5 bg-accent text-accent-text text-xs font-mono font-semibold px-3 py-1.5 border border-accent hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? "SAVING..." : "CREATE"}</span>
            {/* kbd hints hidden on mobile to save space */}
            <span className="hidden sm:flex items-center gap-0.5 ml-1 opacity-80">
              <kbd className="bg-black/10 border-black/10 text-accent-text py-0 px-1 text-[9px]">
                Ctrl
              </kbd>
              <span className="text-[9px]">+</span>
              <kbd className="bg-black/10 border-black/10 text-accent-text py-0 px-1 text-[9px]">
                ↵
              </kbd>
            </span>
          </button>
        </div>

        {/* Bottom row: selects — full width on mobile, inline on desktop */}
        <div className="flex items-center gap-2 px-3 pb-2 sm:pb-0 sm:border-t-0 border-t border-ui-border/50">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="flex-1 sm:flex-none bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono px-2 py-1.5 sm:py-1 focus:outline-none focus:border-accent cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="flex-1 sm:flex-none bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono px-2 py-1.5 sm:py-1 focus:outline-none focus:border-accent cursor-pointer"
          >
            {EXPIRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Spacer below selects on desktop (they sit on the header row) */}
        <div className="hidden sm:block h-1" />
      </header>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-950/30 border-b border-rose-900/50 text-rose-300 text-xs px-4 py-2 flex items-center gap-2 font-mono shrink-0">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="truncate">ERROR: {error}</span>
        </div>
      )}

      {/* Editor body */}
      <div className="flex-1 min-h-0 bg-ui-codeBackground flex relative font-mono">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          onFocus={updateCursorPosition}
          placeholder={"// Paste your content here...\n// Ctrl+Enter to submit."}
          spellCheck={false}
          className="w-full h-full bg-transparent resize-none p-3 sm:p-4 focus:outline-none text-sm text-ui-textMain leading-relaxed font-mono"
        />
      </div>

      {/* Status bar */}
      <footer className="h-8 border-t border-ui-border bg-panel flex items-center justify-between px-3 sm:px-4 text-[11px] font-mono text-ui-textMuted shrink-0 select-none">
        <span>
          LN {cursorPos.line}, COL {cursorPos.col}
        </span>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden sm:block">{content.length} chars</span>
          <span className="hidden sm:block">UTF-8</span>
          <span className="text-accent uppercase">{language}</span>
        </div>
      </footer>
    </div>
  );
}
