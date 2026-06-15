import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { AlertTriangle, Plus, ShieldCheck, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// --- HARDCODED DEMO DATA ---
const INITIAL_FLAGS = [
  { id: 'c-001', crop: 'Tomato', location: 'Mulbagal Cluster', lat: 13.1642, lng: 78.3946, severity: 'high', date: '2026-06-12', batchId: 'KLR-TOM-260612-A' },
  { id: 'c-002', crop: 'Tomato', location: 'Kolar Gold Fields Yard', lat: 12.9592, lng: 78.2719, severity: 'medium', date: '2026-06-13', batchId: 'KLR-TOM-260613-B' },
  { id: 'c-003', crop: 'Onion', location: 'Srinivaspur Storage', lat: 13.3378, lng: 78.2146, severity: 'low', date: '2026-06-14', batchId: 'KLR-ONI-260614-C' }
];

const CROPS = ['Tomato', 'Onion', 'Maize'];
const severityTone = { low: '#2D6A4F', medium: '#F4A261', high: '#E63946' };

// Map camera fly controller engine hook helper
function MapFlyController({ center }) {
  const map = useMap();
  if (center) {
    map.setView(center, 10);
  }
  return null;
}

export default function ContaminationFlag() {
  const [flags, setFlags] = useState(INITIAL_FLAGS);
  const [mapCenter, setMapCenter] = useState([13.1369, 78.1294]); // Kolar Center

  // Form State Configurations
  const [form, setForm] = useState({
    crop: 'Tomato',
    location: '',
    severity: 'medium',
    batchId: ''
  });

  // Check for pre-filled flag redirects coming out of Mandi Map clicks
  useEffect(() => {
    const prefilledMandi = sessionStorage.getItem("prefilledMandi");
    if (prefilledMandi) {
      setForm(prev => ({
        ...prev,
        location: `${prefilledMandi} Intake Yard`,
        batchId: `KLR-${prev.crop.slice(0,3).toUpperCase()}-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-NEW`
      }));
      sessionStorage.removeItem("prefilledMandi");
      toast.success(`Pre-filled location from ${prefilledMandi}`);
    }
  }, []);

  const handleInputChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.location.trim() || !form.batchId.trim()) {
      toast.error("Please fill in the Batch ID and Location parameters.");
      return;
    }

    // Generate simulated nearby offset coordinate around Kolar for demo rendering mapping
    const offsetLat = 13.1369 + (Math.random() - 0.5) * 0.3;
    const offsetLng = 78.1294 + (Math.random() - 0.5) * 0.3;

    const newFlag = {
      id: `c-00${flags.length + 1}`,
      crop: form.crop,
      location: form.location,
      severity: form.severity,
      date: new Date().toISOString().split('T')[0],
      batchId: form.batchId.toUpperCase().trim(),
      lat: offsetLat,
      lng: offsetLng
    };

    setFlags([newFlag, ...flags]);
    setMapCenter([offsetLat, offsetLng]);
    setForm({ crop: 'Tomato', location: '', severity: 'medium', batchId: '' });
    toast.success("Contamination audit trail record logged locally.");
  };

  return (
    <div className="space-y-6 font-sans antialiased text-[#1B1B1B]">
      
      {/* HEADER SECTION PANEL TIER */}
      <div className="flex flex-col gap-1 border-b border-black/10 bg-[#F8F9F2] pb-4 shrink-0">
        <h1 className="text-[22px] font-bold text-[#1B1B1B]">Flag Contamination — Kolar Zone</h1>
        <p className="text-xs font-semibold text-gray-400">Trace and flag toxic batches or biological containment leaks before shipping</p>
      </div>

      {/* CORE WORKSPACE STRUCTURAL COLUMNS SPLIT */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]" style={{ height: "calc(100vh - 200px)" }}>
        
        {/* LEFT COLUMN: THE GEOSPATIAL MAP TRAIL AUDIT */}
        <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full overflow-hidden">
          <div className="mb-4">
            <h2 className="text-md font-bold text-[#1B1B1B]">Contamination Audit Trail</h2>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">Active quarantine perimeters tracking locked bio-batches</p>
          </div>

          <div className="relative flex-grow rounded-lg overflow-hidden border border-gray-100 h-[380px] xl:h-full">
            <MapContainer center={mapCenter} zoom={10} zoomControl={false} className="h-full w-full">
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapFlyController center={mapCenter} />

              {flags.map((flag) => (
                <CircleMarker
                  key={flag.id}
                  center={[flag.lat, flag.lng]}
                  radius={flag.severity === 'high' ? 14 : flag.severity === 'medium' ? 11 : 8}
                  fillColor={severityTone[flag.severity]}
                  fillOpacity={0.85}
                  stroke={true}
                  color="white"
                  weight={2}
                >
                  <Tooltip permanent direction="top" offset={[0, -5]}>
                    <span className="font-bold text-xs text-[#1B1B1B] font-mono">{flag.batchId}</span>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION FORM + AUDIT REGISTER INDEX CARD */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-1 h-full max-h-full">
          
          {/* SECTION A — LOG ACTION REGISTRATION FORM */}
          <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm shrink-0">
            <h3 className="text-sm font-bold text-[#1B1B1B] mb-3 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-[#E63946]" />
              <span>Log Fresh Containment Flag</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Crop Profile</span>
                  <select
                    value={form.crop}
                    onChange={handleInputChange('crop')}
                    className="h-9 w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 text-xs font-medium outline-none focus:border-[#2D6A4F]"
                  >
                    {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Threat Severity</span>
                  <select
                    value={form.severity}
                    onChange={handleInputChange('severity')}
                    className="h-9 w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 text-xs font-bold outline-none focus:border-[#E63946]"
                    style={{ color: severityTone[form.severity] }}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Containment</option>
                    <option value="high">High Emergency</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Trace Tracking Batch ID</span>
                <input
                  type="text"
                  value={form.batchId}
                  onChange={handleInputChange('batchId')}
                  placeholder="e.g. KLR-TOM-260614-X"
                  className="h-9 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs font-mono uppercase outline-none focus:border-[#2D6A4F]"
                />
              </label>

              <label className="block">
                <span className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Intercept Location / Yard Node</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={handleInputChange('location')}
                  placeholder="e.g. Bangarpet Weighing Station"
                  className="h-9 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-[#2D6A4F]"
                />
              </label>

              <button
                type="submit"
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#E63946] text-xs font-bold text-white transition hover:bg-[#A31D26] shadow-sm mt-1"
              >
                <Plus size={14} />
                <span>Publish Quarantine Flag</span>
              </button>
            </form>
          </div>

          {/* SECTION B — THE SCROLLABLE FLAGS AUDITING LEDGER */}
          <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm flex-grow overflow-hidden flex flex-col">
            <div className="mb-3 border-b border-gray-100 pb-2 shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1B1B1B]">Active Audit Registry Logs</h3>
              <span className="h-5 px-2 flex items-center justify-center bg-gray-100 text-[10px] font-bold text-gray-500 rounded-full">
                {flags.length} Locked
              </span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-0.5">
              {flags.map((flag) => (
                <div 
                  key={flag.id} 
                  onClick={() => setMapCenter([flag.lat, flag.lng])}
                  className="border border-[#E5E7EB] bg-white rounded-xl p-3 shadow-xs hover:border-gray-400 cursor-pointer transition duration-150 relative group"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs font-bold text-gray-900 tracking-wide">{flag.batchId}</p>
                    <span 
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md text-white tracking-wide"
                      style={{ backgroundColor: severityTone[flag.severity] }}
                    >
                      {flag.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mt-2.5">
                    <span className="text-[#1B1B1B]">{flag.crop} batch discovered at</span>
                    <span className="text-[#2D6A4F] inline-flex items-center gap-0.5">
                      <MapPin size={11} /> {flag.location}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-50 font-medium">
                    <span>Intercepted: {flag.date}</span>
                    <span className="text-gray-300 group-hover:text-gray-500 transition text-[10px] font-bold">Center Map ↗</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}