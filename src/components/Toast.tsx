import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const TOAST_STYLES: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; iconColor: string; titleColor: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-300",
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    iconColor: "text-red-400",
    titleColor: "text-red-300",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    titleColor: "text-blue-300",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    iconColor: "text-amber-400",
    titleColor: "text-amber-300",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const style = TOAST_STYLES[toast.type];
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [toast.id, toast.duration, duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative overflow-hidden rounded-xl border ${style.border} ${style.bg} backdrop-blur-xl shadow-2xl min-w-[300px] max-w-[420px]`}
    >
      <div className="p-4 pr-10 flex items-start gap-3">
        <div className={`${style.iconColor} mt-0.5 shrink-0`}>{style.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${style.titleColor}`}>{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <motion.div
          className={`h-full rounded-full ${
            toast.type === "success" ? "bg-emerald-500" :
            toast.type === "error" ? "bg-red-500" :
            toast.type === "warning" ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}