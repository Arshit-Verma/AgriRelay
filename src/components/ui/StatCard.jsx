import React from "react";
import Card from './Card';

export default function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <Card className="min-h-32">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-dark">{value}</p>
          {detail && <p className="mt-2 text-sm text-muted">{detail}</p>}
        </div>
        {Icon && (
          <div className="rounded-control bg-surface p-2 text-primary">
            <Icon size={22} aria-hidden="true" />
          </div>
        )}
      </div>
    </Card>
  );
}
