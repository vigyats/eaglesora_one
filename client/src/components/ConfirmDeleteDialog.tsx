import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

interface Props {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDeleteDialog({ title, description, open, onClose, onConfirm, loading }: Props) {
  const [typed, setTyped] = useState("");

  if (!open) return null;

  function handleClose() {
    setTyped("");
    onClose();
  }

  function handleConfirm() {
    if (typed !== "DELETE") return;
    onConfirm();
    setTyped("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleClose}>
      <div className="w-full max-w-md bg-background border border-border p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 flex items-center justify-center bg-red-500/10 shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
            Type <span className="text-red-500 font-mono">DELETE</span> to confirm
          </label>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            placeholder="DELETE"
            className="w-full h-10 px-3 border border-border bg-transparent text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={handleClose}
            className="flex-1 h-10 text-xs font-bold uppercase tracking-wider border border-border bg-transparent text-foreground hover:border-foreground transition-all">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={typed !== "DELETE" || loading}
            className="flex-1 h-10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <Trash2 className="h-3.5 w-3.5" />
            {loading ? "Deleting…" : "Delete Forever"}
          </button>
        </div>
      </div>
    </div>
  );
}
