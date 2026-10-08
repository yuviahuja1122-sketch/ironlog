import React from 'react';

export default function Card({
  children,
  title,
  subtitle,
  action,
  className = '',
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 shadow-sm transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h2 className="text-base font-bold text-zinc-100 tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
