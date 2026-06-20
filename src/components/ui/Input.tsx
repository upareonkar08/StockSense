import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  rightElement,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-textPrimary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          className={`
            block w-full rounded-lg border border-borderColor bg-white py-2 px-3 
            text-textPrimary placeholder-textSecondary outline-none
            focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150
            disabled:bg-slate-50 disabled:text-textSecondary disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0, x: [0, -8, 8, -4, 4, 0] }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="mt-1.5 text-xs text-danger font-medium flex items-center gap-1"
          >
            <span>⚠️</span> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
