import React from "react";
const toneClasses = {
  green: 'bg-primary/10 text-primary',
  amber: 'bg-accent/20 text-[#8A4F16]',
  red: 'bg-alert/10 text-alert',
  gray: 'bg-muted/10 text-muted',
};

export default function Badge({ children, tone = 'gray' }) {
  return (
    <span className={`inline-flex rounded-badge px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
