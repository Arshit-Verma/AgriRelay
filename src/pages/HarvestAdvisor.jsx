import React, { useState } from "react";
import { MessageSquare, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ComposedChart, Line, Area, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

// --- HARDCODED SIMULATOR DATA MATRICES ---
const HARVEST_RECS = [
  {
    id: 1, crop: "Tomato", zone: "Kolar", daysToHarvest: 6,
    windowStart: "Jun 20, 2026", windowEnd: "Jun 24, 2026",
    confidence: 87, accentColor: "#E63946",
    reasoning: "Bangalore APMC price peaks week of Jun 22. Neighboring Chikkaballapur supply dropping 34%.",
    targetMandi: "Bangalore APMC", targetPrice: 520, currentPrice: 310
  },
  {
    id: 2, crop: "Onion", zone: "Kolar", daysToHarvest: 14,
    windowStart: "Jun 28, 2026", windowEnd: "Jul 2, 2026",
    confidence: 72, accentColor: "#9333EA",
    reasoning: "Tumkur APMC shows demand spike. Rain forecast delays Bellary supply by 10–12 days.",
    targetMandi: "Tumkur APMC", targetPrice: 490, currentPrice: 420
  },
  {
    id: 3, crop: "Maize", zone: "Kolar", daysToHarvest: 21,
    windowStart: "Jul 5, 2026", windowEnd: "Jul 9, 2026",
    confidence: 61, accentColor: "#F4A261",
    reasoning: "Poultry feed demand rising in Hassan district. Optimal window before monsoon peak.",
    targetMandi: "Hassan Mandi", targetPrice: 240, currentPrice: 190
  }
];

const PRICE_DATA = {
  Tomato: [
    { week: "W1", actual: 290 }, { week: "W2", actual: 310 }, { week: "W3", actual: 295 },
    { week: "W4", actual: 330 }, { week: "W5", actual: 305 }, { week: "W6", actual: 340 },
    { week: "W7", actual: 360 }, { week: "W8", actual: 380 },
    { week: "W9", forecast: 420, min: 400, max: 460 },
    { week: "W10", forecast: 490, min: 460, max: 520 },
    { week: "W11", forecast: 510, min: 480, max: 540 }
  ],
  Onion: [
    { week: "W1", actual: 380 }, { week: "W2", actual: 395 }, { week: "W3", actual: 410 },
    { week: "W4", actual: 390 }, { week: "W5", actual: 405 }, { week: "W6", actual: 420 },
    { week: "W7", actual: 430 }, { week: "W8", actual: 425 },
    { week: "W9", forecast: 455, min: 440, max: 470 },
    { week: "W10", forecast: 480, min: 460, max: 500 },
    { week: "W11", forecast: 490, min: 470, max: 510 }
  ],
  Maize: [
    { week: "W1", actual: 180 }, { week: "W2", actual: 185 }, { week: "W3", actual: 190 },
    { week: "W4", actual: 188 }, { week: "W5", actual: 195 }, { week: "W6", actual: 200 },
    { week: "W7", actual: 205 }, { week: "W8", actual: 210 },
    { week: "W9", forecast: 225, min: 215, max: 235 },
    { week: "W10", forecast: 235, min: 225, max: 248 },
    { week: "W11", forecast: 240, min: 228, max: 255 }
  ]
};

const HISTORICAL_TABLES = {
  Tomato: [
    { season: "Kharif '25", week: "W9", price: "₹480/q", delta: "+12% above avg", isPos: true },
    { season: "Rabi '25", week: "W7", price: "₹290/q", delta: "-18% below avg", isPos: false },
    { season: "Kharif '24", week: "W10", price: "₹510/q", delta: "+19% above avg", isPos: true }
  ],
  Onion: [
    { season: "Kharif '25", week: "W8", price: "₹440/q", delta: "+8%", isPos: true },
    { season: "Rabi '25", week: "W6", price: "₹310/q", delta: "-22%", isPos: false },
    { season: "Kharif '24", week: "W9", price: "₹460/q", delta: "+11%", isPos: true }
  ],
  Maize: [
    { season: "Kharif '25", week: "W9", price: "₹225/q", delta: "+7%", isPos: true },
    { season: "Rabi '25", week: "W8", price: "₹178/q", delta: "-14%", isPos: false },
    { season: "Kharif '24", week: "W10", price: "₹238/q", delta: "+9%", isPos: true }
  ]
};

export default function HarvestAdvisor() {
  const navigate = useNavigate();
  const [selectedCrop, setSelectedCrop] = useState("Tomato");

  // Filter out variables based on active selection hooks layout state context
  const activeRec = HARVEST_RECS.find(r => r.crop === selectedCrop);
  const activeChartData = PRICE_DATA[selectedCrop];
  const activeTableData = HISTORICAL_TABLES[selectedCrop];

  // Logic calculation handler parameters to paint segmented bars metrics components
  const activeSegmentsCount = Math.round(activeRec.confidence / 20);
  const getMeterColor = (conf) => {
    if (conf >= 80) return "#2D6A4F";
    if (conf >= 50) return "#F4A261";
    return "#E63946";
  };

  const handleSnooze = () => {
    toast.success("Snoozed. Will remind Jun 16.", {
      icon: "⏰",
      style: { borderRadius: '8px', background: '#1B1B1B', color: '#FFF' }
    });
  };

  // Custom Charting Tooltip layout renderer framework
  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm font-sans text-xs">
          <p className="font-bold text-gray-700 mb-1">Week {data.week}</p>
          {data.actual !== undefined ? (
            <p className="text-[#2D6A4F] font-semibold">₹{data.actual}/q (actual)</p>
          ) : (
            <div>
              <p className="text-[#F4A261] font-semibold">₹{data.forecast}/q forecast</p>
              <p className="text-gray-400 mt-0.5">Range: ₹{data.min} – ₹{data.max}/q</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col w-full font-sans antialiased overflow-hidden select-none" style={{ height: "calc(100vh - 120px)" }}>
      
      {/* STATIC TOPBAR EMBED PANEL LAYER LINK */}
      <div className="flex flex-col gap-2 border-b border-black/10 bg-[#F8F9F2] pb-4 mb-4 shrink-0">
        <h1 className="text-[22px] font-bold text-[#1B1B1B]">Harvest Advisor — Kolar Zone</h1>
        <p className="text-xs font-semibold text-gray-400">Demand pressure calculations optimized for local extension networks</p>
      </div>

      {/* CORE WORKSPACE DUAL PANEL ROW COMBINATION WRAPPER */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 w-full flex-grow overflow-hidden">
        
        {/* LEFT COLUMN: PILL CONTROLLERS AND CARD INJECTOR GRID */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* HORIZONTAL PILL CONTROLLERS ROW TIER */}
          <div className="flex items-center gap-2 shrink-0">
            {HARVEST_RECS.map((rec) => {
              const isActive = selectedCrop === rec.crop;
              return (
                <button
                  key={rec.id}
                  onClick={() => setSelectedCrop(rec.crop)}
                  style={{
                    backgroundColor: isActive ? rec.accentColor : 'transparent',
                    borderColor: isActive ? rec.accentColor : '#E5E7EB',
                    color: isActive ? '#FFFFFF' : '#6B7280'
                  }}
                  className={`flex-1 text-center py-2 text-[13px] font-semibold rounded-lg border transition duration-150 ${
                    !isActive ? "bg-white hover:bg-gray-50" : ""
                  }`}
                >
                  {rec.crop}
                </button>
              );
            })}
          </div>

          {/* SINGLE TARGET FIELD LIVE ADVISORY RECOMMENDATION CARD */}
          <div 
            className="bg-white rounded-xl p-6 shadow-sm flex flex-col justify-between"
            style={{ borderLeft: `4px solid ${activeRec.accentColor}`, gap: '20px' }}
          >
            {/* ROW 1: HEADER SECTION PILL INFO */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#1B1B1B] font-sans leading-none">{activeRec.crop}</h2>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Kolar Zone
              </span>
            </div>

            {/* ROW 2: COUNTDOWN MATRIX CLOCK ENGINE TEXT SPLIT */}
            <div>
              <div className="flex items-baseline justify-center py-2">
                <span className="text-[64px] font-extrabold tracking-tight leading-none" style={{ color: activeRec.accentColor }}>
                  {activeRec.daysToHarvest}
                </span>
                <span className="text-[16px] font-normal text-[#6B7280] ml-2 font-sans">days to harvest</span>
              </div>
              <p className="text-center text-[14px] font-medium text-[#1B1B1B] font-sans mt-1">
                Optimal window: {activeRec.windowStart} – {activeRec.windowEnd}
              </p>
            </div>

            {/* ROW 3: CONFIDENCE SEGMENTED PROGRESS METRIC PILL SLOTS */}
            <div>
              <div className="flex items-center justify-between text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                <span>Confidence</span>
                <span style={{ color: getMeterColor(activeRec.confidence) }} className="lowercase text-[13px] font-sans font-bold normal-case">
                  {activeRec.confidence}% confidence
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="h-2 w-10 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: idx <= activeSegmentsCount ? getMeterColor(activeRec.confidence) : '#E5E7EB'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ROW 4: STRATEGIC REASONING TEXT AREA ALERT PANEL VIEW */}
            <div className="flex items-start gap-2.5 bg-[#F8F9F2] rounded-lg p-3 border border-black/5">
              <TrendingUp size={14} className="text-[#6B7280] shrink-0 mt-0.5" />
              <p className="text-[13px] font-normal text-[#4B5563] font-sans leading-relaxed">
                {activeRec.reasoning}
              </p>
            </div>

            {/* ROW 5: TARGET SELLING MANDI STRIP LOGISTICS PILL GROUP */}
            <div className="flex flex-col gap-2 border-t border-b border-gray-100 py-3">
              <div className="text-[14px] text-[#1B1B1B] font-sans">
                <span className="text-gray-400 font-medium">Sell at </span>
                <span className="font-semibold">{activeRec.targetMandi}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs font-medium text-[#6B7280]">
                  ₹{activeRec.currentPrice}/q now <span className="mx-1 text-gray-300">→</span> <span className="text-[16px] font-bold text-[#2D6A4F]">₹{activeRec.targetPrice}/q predicted</span>
                </span>
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-[#2D6A4F]">
                  +₹{activeRec.targetPrice - activeRec.currentPrice}/q
                </span>
              </div>
            </div>

            {/* ROW 6: COUPLING ACTION RELAY DISPATCH COMMAND BUTTONS GROUP */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => navigate('/sms-relay')}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] text-sm font-semibold text-white transition hover:bg-[#1B4D37]"
              >
                <MessageSquare size={16} />
                <span>Notify farmers now</span>
              </button>
              <button
                onClick={handleSnooze}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
              >
                <Clock size={16} />
                <span>Snooze 2 days</span>
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: RECHARTS MULTI-BAND PRICING COMPOSIT FORECAST OUTLOOK PANEL */}
        <div className="bg-white border border-black/10 rounded-xl p-6 flex flex-col justify-between overflow-y-auto max-h-full" style={{ shadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#1B1B1B]">Price outlook — {selectedCrop}</h3>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">Kolar Zone · Karnataka</p>
              </div>
              
              {/* Manual Chart Key pills indicators layer component view map */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-[#2D6A4F]">
                  <span className="h-0.5 w-4 bg-[#2D6A4F] inline-block" /> — Actual
                </span>
                <span className="flex items-center gap-1.5 text-[#F4A261]">
                  <span className="h-0.5 w-4 bg-[#F4A261] border-t border-dashed inline-block" /> -- Forecast
                </span>
              </div>
            </div>

            {/* CHARTS CANVAS responsive canvas bounds */}
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={val => "₹" + val} />
                  <Tooltip content={<CustomChartTooltip />} />
                  
                  {/* Reference indicator layer splitting line */}
                  <ReferenceLine 
                    x="W8" 
                    stroke="#E5E7EB" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Today', position: 'insideTopRight', fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} 
                  />
                  
                  {/* Confidence boundaries area interval blocks layer */}
                  <Area dataKey="max" dataKeyMin="min" stroke="none" fill="#F4A261" opacity={0.15} />
                  
                  {/* Actual lines plots layer structure parameters maps hooks */}
                  <Line type="monotone" dataKey="actual" stroke="#2D6A4F" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  
                  {/* Forecast line plots tracker layer parameters */}
                  <Line type="monotone" dataKey="forecast" stroke="#F4A261" strokeWidth={2.5} strokeDasharray="6 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* THREE COLUMN GREEN HORIZONTAL INSIGHT PILLS PANEL ROW */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded-lg py-2.5 text-center text-xs font-bold font-sans">
                Peak in 3 weeks
              </div>
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded-lg py-2.5 text-center text-xs font-bold font-sans">
                Supply -34% nearby
              </div>
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded-lg py-2.5 text-center text-xs font-bold font-sans">
                Recommend: harvest early
              </div>
            </div>
          </div>

          {/* HISTORICAL SEASONS VALIDATION MATRIX DATA CARD TABLE BLOCK */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <h4 className="text-[14px] font-bold text-[#1B1B1B] mb-3">Previous Seasons Historical Yield Validation</h4>
            <div className="w-full overflow-hidden">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="text-gray-400 font-semibold border-b border-gray-100 pb-2">
                    <th className="pb-2 font-semibold">Season</th>
                    <th className="pb-2 font-semibold">Harvest Week</th>
                    <th className="pb-2 font-semibold">Price Achieved</th>
                    <th className="pb-2 text-right font-semibold">vs Optimal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {activeTableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-2.5 text-[#1B1B1B] font-semibold">{row.season}</td>
                      <td className="py-2.5">{row.week}</td>
                      <td className="py-2.5 font-bold text-gray-900">{row.price}</td>
                      <td className={`py-2.5 text-right font-bold ${row.isPos ? "text-green-600" : "text-red-600"}`}>
                        {row.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}