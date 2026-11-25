
import React from "react";

type LoaderSize = "sm" | "md" | "lg";

interface LoaderProps {
  size?: LoaderSize;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  message,
  fullScreen = false,
  className = "",
}) => {
  const sizes: Record<LoaderSize, string> = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };

  const loader = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          animate-spin rounded-full
          border-blue-600 border-t-transparent
          ${sizes[size]}
        `}
      />

      {message && (
        <p className="text-sm font-medium text-gray-600">
          {message}
        </p>
      )}

      <span className="sr-only">
        {message || "Loading..."}
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;
