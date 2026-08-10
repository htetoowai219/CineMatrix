import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title,
  message,
  confirmLabel = "Delete",
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/20 border border-red-600/30 mb-6">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
