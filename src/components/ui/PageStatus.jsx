import React from "react";

function errorMessage() {
  return navigator.onLine
    ? 'Could not load this page. Check that the AgriRelay server is running.'
    : "You're offline and this page hasn't been saved on this device yet.";
}

export default function PageStatus({ error }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-card border border-black/10 bg-white px-4 text-center text-sm font-semibold text-muted">
      {error ? errorMessage() : 'Loading…'}
    </div>
  );
}
