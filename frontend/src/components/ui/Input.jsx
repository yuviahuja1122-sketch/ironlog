import React from 'react';

export function Input({
  label,
  error,
  helper,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50 ${error ? 'border-red-500/80 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helper && !error && <p className="text-xs text-zinc-500">{helper}</p>}
    </div>
  );
}

export function TextArea({
  label,
  error,
  helper,
  className = '',
  rows = 3,
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-300">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none disabled:opacity-50 ${error ? 'border-red-500/80 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helper && !error && <p className="text-xs text-zinc-500">{helper}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  helper,
  className = '',
  options = [],
  children,
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-300">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50 ${error ? 'border-red-500/80 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helper && !error && <p className="text-xs text-zinc-500">{helper}</p>}
    </div>
  );
}
