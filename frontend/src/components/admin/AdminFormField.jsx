import React from 'react';

const AdminFormField = ({
  id,
  label,
  required = false,
  error = null,
  hint = null,
  children,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs sm:text-sm font-semibold text-zinc-300 flex items-center gap-1 select-none"
        >
          <span>{label}</span>
          {required && <span className="text-[#e50914]">*</span>}
        </label>
      )}

      {children}

      {hint && !error && (
        <p className="text-[11px] text-zinc-400">{hint}</p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-red-500 font-medium flex items-center gap-1 animate-fadeIn"
        >
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default AdminFormField;

