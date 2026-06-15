import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { X, ArrowRight, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// PART 1 — COGNIZANT GEOSPATIAL DATA STRUCTURES
const MANDIS = [
  { id: 1, name: "Bangalore APMC", lat: 12.9716, lng: 77.5946, crop: "Tomato", currentPrice: 310, predictedPrice: 520, trustScore: 82 },
  { id: 2, name: "Kolar Mandi", lat: 13.1369, lng: 78.1294, crop: "Tomato", currentPrice: 140, predictedPrice: 160, trustScore: 28 },
  { id: 3, name: "Tumkur APMC", lat: 13.3379, lng: 77.1010, crop: "Onion", currentPrice: 420, predictedPrice: 490, trustScore: 65 },
  { id: 4, name: "Hassan Mandi", lat: 13.0072, lng: 76.0962, crop: "Maize", currentPrice: 190, predictedPrice: 240, trustScore: 71 },
  { id: 5, name: "Mandya APMC", lat: 12.5218, lng: 76.8951, crop: "Tomato", currentPrice: 280, predictedPrice: 320, trustScore: 55 },
  { id: 6, name: "Chikkaballapur", lat: 13.4355, lng: 77.7315, crop: "Onion", currentPrice: 380, predictedPrice: 410, trustScore: 44 },
  { id: 7, name: "Ramanagara", lat: 12.7157, lng: 77.2819, crop: "Maize", currentPrice: 210, predictedPrice: 260, trustScore: 78 },
  { id: 8, name: "Mysuru APMC", lat: 12.2958, lng: 76.6394, crop: "Tomato", currentPrice: 295, predictedPrice: 350, trustScore: 60 }
];

const CONTAMINATION_FLAGS = [
  { id: 1, lat: 13.1369, lng: 78.1294, crop: "Onion", batchId: "BATCH-2026-0041", severity: "high" },
  { id: 2, lat: 13.4355, lng: 77.7315, crop: "Tomato", batchId: "BATCH-2026-0038", severity: "medium" }
];

// Inner engine sub-component helper to drive reactive camera moves safely inside MapContainer context
function MapFlyController({ center, zoom }) {
  const map = useMap();
  if (center) {
    map.flyTo(center, zoom, { duration: 1.5 });
  }
  return null;
}

export default function MandiMap() {
  const navigate = useNavigate();

  // State Trackers
  const [cropFilter, setCropFilter] = useState("All");
  const [trustFilter, setTrustFilter] = useState("All");
  const [selectedMandi, setSelectedMandi] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [mapParams, setMapParams] = useState({ center: [13.1986, 77.7066], zoom: 9 });

  // Color selection lookup logic block
  const getTrustColor = (score) => {
    if (score >= 75) return "#2D6A4F";
    if (score >= 40) return "#F4A261";
    return "#E63946";
  };

  // Processing filtration layer computations
  const filteredMandis = MANDIS.filter((m) => {
    const cropMatch = cropFilter === "All" || m.crop === cropFilter;
    let trustMatch = true;
    if (trustFilter === "High 75+") trustMatch = m.trustScore >= 75;
    else if (trustFilter === "Medium") trustMatch = m.trustScore >= 40 && m.trustScore < 75;
    else if (trustFilter === "Low <40") trustMatch = m.trustScore < 40;
    return cropMatch && trustMatch;
  });

  const filteredWatchlist = watchlist.filter((m) => {
    const cropMatch = cropFilter === "All" || m.crop === cropFilter;
    let trustMatch = true;
    if (trustFilter === "High 75+") trustMatch = m.trustScore >= 75;
    else if (trustFilter === "Medium") trustMatch = m.trustScore >= 40 && m.trustScore < 75;
    else if (trustFilter === "Low <40") trustMatch = m.trustScore < 40;
    return cropMatch && trustMatch;
  });

  // Watchlist addition modifiers
  const handleAddToWatchlist = (mandi) => {
    if (!watchlist.some((w) => w.id === mandi.id)) {
      setWatchlist([...watchlist, mandi]);
    }
  };

  const handleRemoveFromWatchlist = (id) => {
    setWatchlist(watchlist.filter((w) => w.id !== id));
  };

  // Nav actions
  const handleFlagSupply = (mandiName) => {
    sessionStorage.setItem("prefilledMandi", mandiName);
    navigate("/contamination-flag");
  };

  const handleSendRoutingAlert = () => {
    sessionStorage.setItem("alertWatchlist", JSON.stringify(watchlist));
    navigate("/sms-relay");
  };

  return (
    <div className="flex flex-col w-full font-sans antialiased overflow-hidden select-none" style={{ height: "calc(100vh - 120px)" }}>
      
      {/* PART 5 — FILTER BAR */}
      <div className="flex flex-wrap items-center gap-6 bg-white border border-black/10 rounded-xl p-4 mb-4 shadow-sm shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span>Filter by crop:</span>
          {["All", "Tomato", "Onion", "Maize"].map((crop) => (
            <button
              key={crop}
              onClick={() => setCropFilter(crop)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-150 ${
                cropFilter === crop ? "bg-[#2D6A4F] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {crop}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span>Filter by trust:</span>
          {["All", "High 75+", "Medium", "Low <40"].map((trust) => (
            <button
              key={trust}
              onClick={() => setTrustFilter(trust)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition duration-150 ${
                trustFilter === trust ? "bg-[#2D6A4F] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {trust}
            </button>
          ))}
        </div>
      </div>

      {/* CORE FRAMEWORK SUB LAYOUT GRID COUPLING STRUCTURE */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6 w-full flex-grow overflow-hidden">
        
        {/* MAP PANEL CONTAINER SECTOR */}
        <div className="relative rounded-xl overflow-hidden border border-black/10 bg-gray-100 flex-grow" style={{ height: "calc(100vh - 180px)" }}>
          <MapContainer 
            center={[13.1986, 77.7066]} 
            zoom={9} 
            zoomControl={false}
            className="h-full w-full z-10"
          >
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapFlyController center={mapParams.center} zoom={mapParams.zoom} />

            {/* PART 2 — MANDI CIRCLEMARKERS */}
            {filteredMandis.map((mandi) => (
              <CircleMarker
                key={mandi.id}
                center={[mandi.lat, mandi.lng]}
                radius={16}
                fillColor={getTrustColor(mandi.trustScore)}
                fillOpacity={0.9}
                stroke={true}
                color="white"
                weight={2}
                eventHandlers={{
                  click: () => {
                    setSelectedMandi(mandi);
                    setMapParams({ center: [mandi.lat, mandi.lng], zoom: 11 });
                  }
                }}
              >
                <Tooltip permanent direction="top" arrow={false} offset={[0, -12]}>
                  <span className="font-semibold text-[12px] text-[#1B1B1B] font-sans">{mandi.name}</span>
                </Tooltip>
              </CircleMarker>
            ))}

            {/* CONTAMINATION FLAGS CIRCLEMARKERS */}
            {CONTAMINATION_FLAGS.map((flag) => (
              <CircleMarker
                key={flag.id}
                center={[flag.lat, flag.lng]}
                radius={8}
                fillColor="#E63946"
                fillOpacity={1}
                color="white"
                weight={2}
              >
                <Tooltip direction="right" offset={[8, 0]}>
                  <div className="font-sans text-xs p-1">
                    <p className="font-bold text-[#1B1B1B]">{flag.batchId}</p>
                    <p className="text-gray-500 capitalize">Severity: {flag.severity}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* PART 3 — ABSOLUTE BOTTOM-LEFT DATA INFOPANEL OVERLAY ELEMENT */}
          {selectedMandi && (
            <div 
              className="absolute left-4 bottom-4 w-[300px] bg-white rounded-xl p-4 shadow-md z-40 border border-black/5 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <button 
                onClick={() => setSelectedMandi(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={16} />
              </button>

              <h3 className="text-[18px] font-bold text-[#1B1B1B] pr-6 truncate leading-tight">{selectedMandi.name}</h3>
              <div className="mt-1.5 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {selectedMandi.crop}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-b border-gray-100 py-3">
                <div>
                  <p className="text-[13px] font-medium text-gray-400">Current</p>
                  <p className="text-[16px] font-bold text-[#1B1B1B]"> can ₹{selectedMandi.currentPrice}/q</p>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-400">Predicted</p>
                  <p className="text-[20px] font-extrabold text-[#2D6A4F] flex items-center gap-0.5 leading-none mt-0.5">
                    ₹{selectedMandi.predictedPrice}/q
                    {selectedMandi.predictedPrice > selectedMandi.currentPrice && <span className="text-[14px]">↑</span>}
                  </p>
                </div>
              </div>

              {/* Price Delta pill logic execution rendering container block element template */}
              <div className="mt-3">
                {selectedMandi.predictedPrice - selectedMandi.currentPrice >= 0 ? (
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                    +₹{selectedMandi.predictedPrice - selectedMandi.currentPrice}/q opportunity
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                    ₹{selectedMandi.predictedPrice - selectedMandi.currentPrice}/q loss exposure
                  </span>
                )}
              </div>

              {/* Supply Trust Metric dynamic bar element layout tier component block execution */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-400">Supply Trust</span>
                  <span style={{ color: getTrustColor(selectedMandi.trustScore) }}>{selectedMandi.trustScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${selectedMandi.trustScore}%`, 
                      backgroundColor: getTrustColor(selectedMandi.trustScore) 
                    }} 
                  />
                </div>
              </div>

              {/* Interactive payload button coupling action templates layouts mapping container */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAddToWatchlist(selectedMandi)}
                  className="flex h-9 items-center justify-center rounded-lg bg-[#2D6A4F] text-xs font-semibold text-white transition hover:bg-[#1B4D37]"
                >
                  Route here
                </button>
                <button
                  onClick={() => handleFlagSupply(selectedMandi.name)}
                  className="flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Flag supply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PART 4 — WATCHLIST SECTOR LAYOUT MATRIX SIDEBAR COMPONENT PANEL CONTAINER */}
        <div className="w-[280px] bg-white border border-black/10 rounded-xl p-4 flex flex-col shadow-sm max-h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 shrink-0">
            <h3 className="text-[16px] font-bold text-[#1B1B1B]">Mandi Watchlist</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              {filteredWatchlist.length}
            </span>
          </div>

          <div className="flex-grow overflow-y-auto pr-1">
            {filteredWatchlist.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-2">
                <p className="text-[14px] font-normal text-[#9CA3AF] leading-normal font-sans">
                  Tap a marker, then 'Route here' to add mandis to your watchlist.
                </p>
              </div>
            ) : (
              filteredWatchlist.map((mandi) => {
                const delta = mandi.predictedPrice - mandi.currentPrice;
                return (
                  <div 
                    key={mandi.id} 
                    className="relative bg-white border border-[#E5E7EB] rounded-lg p-3 mb-3 shadow-sm group animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => handleRemoveFromWatchlist(mandi.id)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition"
                      aria-label="Remove card"
                    >
                      <XCircle size={14} />
                    </button>
                    
                    <h4 className="text-[14px] font-semibold text-[#1B1B1B] pr-5 truncate">{mandi.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{mandi.crop}</span>
                      <span 
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: getTrustColor(mandi.trustScore) }}
                      >
                        {mandi.trustScore}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs border-t border-gray-50 pt-2">
                      <span className="text-gray-500 font-medium">
                        ₹{mandi.currentPrice} → <span className="font-bold text-[#1B1B1B]">₹{mandi.predictedPrice}</span>
                      </span>
                      <span className={`font-bold ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {delta >= 0 ? `+₹${delta}` : `₹${delta}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleSendRoutingAlert}
            disabled={watchlist.length === 0}
            className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition shrink-0 ${
              watchlist.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#2D6A4F] hover:bg-[#1B4D37]"
            }`}
          >
            <span>Send routing alert</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}