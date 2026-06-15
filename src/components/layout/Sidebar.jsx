import React,{useMemo} from "react";
import { useAuth } from '../../context/AuthContext';
import { useZone } from '../../context/ZoneContext';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BadgeIndianRupee, ClipboardCheck, Flag, Home, Landmark, Map, MessageSquareText, Wheat, Sprout, AlertTriangle, FileText} from 'lucide-react';
import { LayoutDashboard} from "lucide-react";
const desktopNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mandi-map', label: 'Mandi Map', icon: Map },
  { to: '/harvest-advisor', label: 'Harvest Advisor', icon: Sprout },
  { to: '/sms-relay', label: 'SMS Relay', icon: MessageSquareText },
  { to: '/contamination-flag', label: 'Flag Contamination', icon: AlertTriangle, dot: 'high' },
  { to: '/govt-schemes', label: 'Govt Schemes', icon: FileText },
];

const mobileNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/mandi-map', label: 'Map', icon: Map },
  { to: '/sms-relay', label: 'SMS', icon: MessageSquareText },
  { to: '/contamination-flag', label: 'Flag', icon: Flag, dot: 'high' },
  { to: '/govt-schemes', label: 'Schemes', icon: FileText },
];

function initialsFromName(name) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export default function Sidebar() {
  const { officer, logout } = useAuth();
  const { activeZone, selectZone, contaminationFlags = [] } = useZone();
  const location = useLocation();


  const { hasUnflaggedAlerts } = useMemo(() => {
    const hasUnflagged = contaminationFlags.some((f) => f.severity === 'high');
    return { hasUnflaggedAlerts: hasUnflagged };
  }, []);

  const zoneInitials = initialsFromName(officer?.name);



  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden h-screen w-[240px] shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:border-r lg:border-black/10 lg:bg-surface lg:px-5 lg:py-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-control bg-primary text-white">
              <span className="text-base font-extrabold">A</span>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold text-primary">AgriRelay</div>
              <div className="text-xs font-semibold text-muted">Officer Console</div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-muted">{officer?.name ?? '—'}</p>
            <div className="mt-2 inline-flex items-center rounded-control bg-accent/20 px-3 py-1 text-xs font-bold text-[#8A4F16]">
              {activeZone ?? 'Zone'}
            </div>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {desktopNavItems.map(({ to, label, icon: Icon, dot }) => {
            const showRedDot = dot === 'high' && hasUnflaggedAlerts;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => {
                  const base =
                    'relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-semibold transition';
                  const active =
                    'border-l-4 border-primary bg-primary/10 text-primary';
                  const inactive =
                    'border-l-4 border-transparent text-muted hover:bg-surface hover:text-dark';
                  return `${base} ${isActive ? active : inactive}`;
                }}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="truncate">{label}</span>
                {showRedDot && (
                  <span
                    className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-alert"
                    aria-label="Unflagged alerts"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-card border border-black/10 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-bold">{zoneInitials || 'OF'}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-dark">{officer?.name ?? 'Officer'}</p>
              <p className="text-xs font-semibold text-muted">Extension Officer</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-semibold text-alert hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation (no hamburger) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around gap-1 border-t border-black/10 bg-surface lg:hidden">
        {mobileNavItems.map(({ to, label, icon: Icon, dot }) => {
          const showRedDot = dot === 'high' && hasUnflaggedAlerts;

          return (

            <NavLink
              key={to}
              to={to}
              className={({ isActive: navActive }) =>
                `relative flex h-full flex-1 items-center justify-center gap-1 transition ${
                  navActive
                    ? 'text-primary'
                    : 'text-muted hover:text-dark'
                }`
              }
              aria-label={label}
            >
              <Icon size={20} aria-hidden="true" />
              {showRedDot && (
                <span className="absolute right-6 top-2 h-2 w-2 rounded-full bg-alert" aria-hidden="true" />
              )}

            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

