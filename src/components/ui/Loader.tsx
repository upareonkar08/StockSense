import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  fullScreen = false,
  size = 'md',
  text = 'Loading...'
}) => {
  const sizeClasses = {
    sm: "h-5 w-5 stroke-[2.5]",
    md: "h-8 w-8 stroke-[2]",
    lg: "h-12 w-12 stroke-[1.5]"
  };

  const containerStyle = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-6";

  return (
    <div className={containerStyle}>
      <div className="relative">
        <svg
          className={`animate-spin text-accent ${sizeClasses[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {text && (
        <p className="mt-3 text-sm font-medium text-textSecondary animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};
export default Loader;
