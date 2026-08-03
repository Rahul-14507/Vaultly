import { Link } from "react-router-dom";
import { ArrowLeft, Cpu } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full border border-ui-border bg-panel p-6 font-mono text-xs">
        <div className="flex items-center justify-between text-accent mb-4 border-b border-ui-border pb-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">System Exception Handled</span>
          </div>
          <span className="text-[10px] text-rose-500 font-bold px-1.5 py-0.5 bg-rose-950/20 border border-rose-900/40 rounded">CRITICAL</span>
        </div>
        
        <div className="space-y-3 text-ui-textMuted leading-relaxed">
          <p>
            <span className="text-ui-textMain">STATUS_CODE:</span> 404_NOT_FOUND
          </p>
          <p>
            <span className="text-ui-textMain">TARGET_ROUTE:</span> {window.location.pathname}
          </p>
          <p>
            The route you are trying to resolve does not map to any loaded controller endpoint or resource entry.
          </p>
          <p>
            Please check the spelling of the URL or verify that the resource has not expired.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-ui-border flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-accent hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to cockpit</span>
          </Link>
          <span className="text-[9px] text-ui-textMuted select-none">VAULTLY_CORE_OS</span>
        </div>
      </div>
    </div>
  );
}
