import React from "react";
export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'border border-primary/20 bg-white text-primary hover:bg-primary/5',
    alert: 'bg-alert text-white hover:bg-alert/90',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
