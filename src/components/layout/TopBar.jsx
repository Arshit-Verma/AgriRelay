import React, { useMemo, useEffect, useState } from "react";
import { LogOut, Menu, CloudRain, Sun, Cloud, RefreshCw, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useZone } from '../../context/ZoneContext';

export default function TopBar() {
  const { officer, logout } = useAuth();
  const { activeZone, contaminationFlags = [] } = useZone();
  const [weather, setWeather] = useState(null);

  // Safe Hackathon Fallbacks for uninitialized wrapper states
  const district = activeZone ? "Karnataka Regional" : "State";
  const lastSyncMinutesAgo = 2;
  const isRefreshing = false;
  const hasUnflaggedAlerts = contaminationFlags.length > 0;

  const onRefresh = () => {
    console.log("Refreshing dashboard market feeds locally...");
  };

  useEffect(() => {
    if (activeZone) {
      fetch(`http://localhost:5000/api/weather?zone=${encodeURIComponent(activeZone)}`)
        .then((res) => res.json())
        .then((data) => setWeather(data))
        .catch((err) => console.error('Error fetching weather:', err));
    }
  }, [activeZone]);

  const getWeatherIcon = (cond) => {
    if (!cond) return null;
    const c = cond.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="text-blue-500" size={18} />;
    if (c.includes('cloud')) return <Cloud className="text-gray-500" size={18} />;
    return <Sun className="text-amber-500" size={18} />;
  };

  return (
    <header className="border-b border-black/10 bg-surface px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-control bg-primary p-2 text-white lg:hidden">
            <Menu size={20} aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-muted">{district}</p>
              <h1 className="text-2xl font-bold text-dark">{activeZone ?? 'Loading Zone...'}</h1>
            </div>
            {weather && (
              <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1 text-sm shadow-sm">
                {getWeatherIcon(weather.condition)}
                <span className="font-bold text-dark">{Math.round(weather.temp)}°C</span>
                <span className="text-xs font-semibold text-muted capitalize">{weather.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-control bg-accent/20 px-3 py-1 text-xs font-bold text-[#8A4F16]">
            {activeZone ?? 'Zone'}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-dark hover:bg-primary/5"
            aria-label="Refresh sync"
          >
            <span className="text-xs font-semibold text-muted">Synced {lastSyncMinutesAgo} min ago</span>
            <RefreshCw
              size={16}
              aria-hidden="true"
              className={isRefreshing ? 'animate-spin text-primary' : 'text-primary'}
            />
          </button>

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-control hover:bg-primary/5"
            aria-label="Notifications"
          >
            <Bell size={18} aria-hidden="true" className="text-dark" />
            {hasUnflaggedAlerts && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-alert" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}