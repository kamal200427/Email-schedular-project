
import React, { useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (duration <= 0) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  const toastStyles = {
    success: {
      container: "bg-green-50 border-green-200",
      text: "text-green-800",
      icon: <CheckCircle className="text-green-600" size={20} />,
    },

    error: {
      container: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: <XCircle className="text-red-600" size={20} />,
    },

    warning: {
      container: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-800",
      icon: <AlertTriangle className="text-yellow-600" size={20} />,
    },

    info: {
      container: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      icon: <Info className="text-blue-600" size={20} />,
    },
  };

  const style = toastStyles[type];

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`
        flex w-full max-w-sm items-center gap-3
        rounded-lg border px-4 py-3 shadow-lg
        animate-in slide-in-from-right-5 duration-200
        ${style.container}
      `}
    >
      {style.icon}

      <p className={`flex-1 text-sm font-medium ${style.text}`}>
        {message}
      </p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="rounded p-1 text-gray-500 transition hover:bg-black/5 hover:text-gray-800"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
