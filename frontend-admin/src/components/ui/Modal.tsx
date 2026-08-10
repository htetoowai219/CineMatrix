import { type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

const Modal = ({ title, subtitle, onClose, children, maxWidth = "max-w-2xl" }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full ${maxWidth} shadow-2xl my-8`}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display font-bold text-white uppercase tracking-wide text-xl">
              {title}
            </h3>
            {subtitle && (
              <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export default Modal;
