import React from "react";
export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-card border border-black/10 bg-white p-5 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-bold text-dark">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
