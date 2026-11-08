import React, { useEffect, useState } from "react";
import { Menu, CloudRain, Sun, Cloud, RefreshCw, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiGet } from '../../api/client';
import { useZone } from '../../context/ZoneContext';
import { useSyncStatus } from '../../hooks/useSyncStatus';

export default function TopBar({ pageTitle }) {
  const { zone, district, hasHighSeverityFlag } = useZone();
  const syncStatus = useSyncStatus();
  const [weather, setWeather] = useState(null);

  const onRefresh = () => window.location.reload();

  useEffect(() => {
    if (zone) {
      apiGet('/api/weather')
        .then((data) => setWeather(data))
        .catch((err) => console.error('Error fetching weather:', err));
    }
  }, [zone]);

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
              <p className="text-sm font-semibold text-muted">{district ?? zone}</p>
              <h1 className="text-2xl font-bold text-dark">{pageTitle}</h1>
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
            {zone ?? 'Zone'}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-semibold text-dark hover:bg-primary/5"
            aria-label="Refresh sync"
          >
            <span className="text-xs font-semibold text-muted">{syncStatus}</span>
            <RefreshCw size={16} aria-hidden="true" className="text-primary" />
          </button>

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-control hover:bg-primary/5"
            aria-label="Notifications"
          >
            <Bell size={18} aria-hidden="true" className="text-dark" />
            {hasHighSeverityFlag && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-alert" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}