import React, { useState } from "react";
import { Send, Calendar, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageStatus from '../components/ui/PageStatus';
import { CROP_BADGE_CLASSES, DEFAULT_BADGE_CLASSES } from '../constants/crops';
import { useZone } from '../context/ZoneContext';
import { useApi } from '../hooks/useApi';
import { formatDate, formatShortDate } from '../utils/format';

export default function GovtSchemes() {
  const navigate = useNavigate();
  const { zone, cropsManaged } = useZone();
  const { data: schemes, error } = useApi('/api/govt-schemes');
  const [filterCrop, setFilterCrop] = useState("All");

  if (!schemes) {
    return <PageStatus error={error} />;
  }

  // Filtering computational layer
  const filteredSchemes = schemes.filter(s =>
    filterCrop === "All" || s.eligibleCrops.includes(filterCrop)
  );

  const handleQuickRelayBroadcast = (scheme) => {
    // Generate a clean text block string template
    const relayText = `AgriRelay: Govt scheme '${scheme.name}' offers ${scheme.benefitAmount}. Apply before ${formatShortDate(scheme.deadline)} at your local office. Bring land records.`;
    
    // Store message context inside sessionStorage to let the SMS Relay component auto-populate it
    sessionStorage.setItem("activeTemplateText", relayText);
    toast.success("Scheme payload configured! Redirecting to SMS panel...");
    
    // Navigate straight to the dispatch loop
    navigate("/sms-relay");
  };

  return (
    <div className="space-y-6 font-sans antialiased text-[#1B1B1B]">
      
      {/* HEADER CONTROLS VIEW TIER */}
      <div className="flex flex-col gap-4 border-b border-black/10 bg-[#F8F9F2] pb-4 lg:flex-row lg:items-center lg:justify-between shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-[#1B1B1B]">Govt Schemes — {zone} Zone</h1>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Active regional subsidies and benefits ready for field notification dispatch</p>
        </div>

        {/* HORIZONTAL FILTRATION PILLS PACK */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-1">Crop Filter:</span>
          {["All", ...cropsManaged].map((crop) => (
            <button
              key={crop}
              onClick={() => setFilterCrop(crop)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition duration-150 ${
                filterCrop === crop 
                  ? "bg-[#2D6A4F] border-[#2D6A4F] text-white" 
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* TWO-COLUMN CORE MATRIX GRID SCHEME LAYOUT */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredSchemes.map((scheme) => (
          <div 
            key={scheme.id} 
            className="bg-white border border-black/10 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-gray-400 transition duration-150"
          >
            <div>
              {/* TOP STRIP: NAME AND DEADLINE DATE BADGE */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[16px] font-bold text-[#1B1B1B] leading-tight font-sans">
                  {scheme.name}
                </h2>
                <span className="inline-flex items-center gap-1 shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-[#E63946] border border-red-100">
                  <Calendar size={12} />
                  <span>Until {formatDate(scheme.deadline)}</span>
                </span>
              </div>

              {/* BENEFIT DISBURSEMENT ROW HIGH INTENSITY TEXT */}
              <div className="mt-3.5 flex items-baseline gap-1 text-[#2D6A4F]">
                <Award size={16} className="shrink-0 transform translate-y-px" />
                <p className="text-[17px] font-extrabold font-sans leading-none tracking-tight">
                  {scheme.benefitAmount}
                </p>
              </div>

              {/* CORE DESCRIPTION TEXT METRIC DETAIL BLOCK */}
              <p className="mt-3 text-xs text-[#6B7280] font-normal font-sans leading-relaxed">
                {scheme.details}
              </p>
            </div>

            {/* BASE STRIP: CROP LABELS AND INTERACTIVE BROADCAST COMMAND INTERFACE */}
            <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {scheme.eligibleCrops.map((crop) => (
                  <span 
                    key={crop} 
                    className={`text-[10px] font-bold px-1.5 py-0.5 border rounded-md ${
                      CROP_BADGE_CLASSES[crop] || DEFAULT_BADGE_CLASSES
                    }`}
                  >
                    {crop}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleQuickRelayBroadcast(scheme)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#2D6A4F] px-3 text-xs font-bold text-white transition hover:bg-[#1B4D37] shadow-sm shrink-0"
              >
                <Send size={12} />
                <span>Broadcast Relay</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* STATIC QUICK SUMMARY INFOBAR FOOTER PANEL STRIP STRIP */}
      {filteredSchemes.length === 0 && (
        <div className="w-full text-center py-12 bg-white rounded-xl border border-black/10 text-gray-400 text-sm font-normal">
          No government schemes currently match your active crop filter setting.
        </div> 
      )}
    </div>
  );
}