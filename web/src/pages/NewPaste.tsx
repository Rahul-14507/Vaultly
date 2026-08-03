import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, Send, AlertTriangle } from "lucide-react";

interface NewPasteProps {
  onPasteCreated: (id: string, language: string) => void;
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
  { value: "1", label: "Expires in 1 Hour" },
  { value: "24", label: "Expires in 1 Day" },
  { value: "168", label: "Expires in 7 Days" },
  { value: "never", label: "Never Expire" },
];

export default function NewPaste({ onPasteCreated }: NewPasteProps) {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [expiry, setExpiry] = useState("24"); // default 1 day
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Focus textarea on load
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Update line and column number indicator
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
    // Submit with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    
    // Support Tab key indentation inside textarea
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newContent = value.substring(0, start) + "  " + value.substring(end);
      setContent(newContent);
      
      // Reset cursor position
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
        },
        body: JSON.stringify({
          content,
          language,
          expiresInHours,
        }),
      });

      if (!response.ok) {
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
      {/* Editor Header Toolbar */}
      <header className="h-12 border-b border-ui-border flex items-center justify-between px-4 bg-panel shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-ui-textMuted">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span>NEW_PASTE.txt</span>
          </div>

          <div className="h-4 w-[1px] bg-ui-border"></div>

          {/* Configuration Fields */}
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono px-2 py-1 focus:outline-none focus:border-accent cursor-pointer"
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
              className="bg-panel-light border border-ui-border text-ui-textMain text-xs font-mono px-2 py-1 focus:outline-none focus:border-accent cursor-pointer"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="flex items-center gap-2 bg-accent text-accent-text text-xs font-mono font-semibold px-3.5 py-1.5 border border-accent hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? "SAVING..." : "CREATE"}</span>
            <span className="flex items-center gap-0.5 ml-1.5 opacity-80">
              <kbd className="bg-black/10 border-black/10 text-accent-text py-0 px-1 text-[9px]">Ctrl</kbd>
              <span className="text-[9px]">+</span>
              <kbd className="bg-black/10 border-black/10 text-accent-text py-0 px-1 text-[9px]">&crarr;</kbd>
            </span>
          </button>
        </div>
      </header>

      {/* Error alert row */}
      {error && (
        <div className="bg-rose-950/30 border-b border-rose-900/50 text-rose-300 text-xs px-4 py-2 flex items-center gap-2 font-mono shrink-0">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>ERROR: {error}</span>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 min-h-0 bg-ui-codeBackground flex relative font-mono">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPosition}
          onClick={updateCursorPosition}
          onFocus={updateCursorPosition}
          placeholder="// Type or paste your content here...&#10;// Indent with Tab. Submit with Ctrl+Enter or Cmd+Enter."
          spellCheck={false}
          className="w-full h-full bg-transparent resize-none p-4 focus:outline-none text-sm text-ui-textMain leading-relaxed font-mono"
        />
      </div>

      {/* Editor Status Bar */}
      <footer className="h-8 border-t border-ui-border bg-panel flex items-center justify-between px-4 text-[11px] font-mono text-ui-textMuted shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span>LN {cursorPos.line}, COL {cursorPos.col}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{content.length} chars</span>
          <span>UTF-8</span>
          <span className="text-accent">PLAIN_TEXT</span>
        </div>
      </footer>
    </div>
  );
}
