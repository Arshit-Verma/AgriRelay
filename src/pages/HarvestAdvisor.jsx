import React, { useState } from "react";
import { MessageSquare, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ComposedChart, Line, Area, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import PageStatus from '../components/ui/PageStatus';
import { CROP_COLORS } from '../constants/crops';
import { useZone } from '../context/ZoneContext';
import { useApi } from '../hooks/useApi';
import { formatDate, formatShortDate } from '../utils/format';

// Recharts draws a band between two values when dataKey returns a [min, max] pair
const forecastRange = (point) => (point.min == null ? null : [point.min, point.max]);

export default function HarvestAdvisor() {
  const navigate = useNavigate();
  const { zone } = useZone();
  const [selectedCrop, setSelectedCrop] = useState(null);
  const recommendations = useApi('/api/harvest-recommendations');
  const activeCrop = selectedCrop ?? recommendations.data?.[0]?.crop;
  const priceTrend = useApi(activeCrop ? '/api/price-trends' : null, { crop: activeCrop });

  if (!recommendations.data || !priceTrend.data) {
    return <PageStatus error={recommendations.error || priceTrend.error} />;
  }

  // Filter out variables based on active selection hooks layout state context
  const activeRec = recommendations.data.find(r => r.crop === activeCrop);
  const activeChartData = priceTrend.data.series;
  const activeTableData = priceTrend.data.seasons;
  const todayWeek = activeChartData.filter((point) => point.actual !== undefined).at(-1)?.week;
  const priceChange = activeRec.targetPrice - activeRec.currentPrice;

  // Logic calculation handler parameters to paint segmented bars metrics components
  const activeSegmentsCount = Math.round(activeRec.confidence / 20);
  const getMeterColor = (conf) => {
    if (conf >= 80) return "#2D6A4F";
    if (conf >= 50) return "#F4A261";
    return "#E63946";
  };

  const handleNotifyFarmers = () => {
    sessionStorage.setItem("harvestAlertCrop", activeCrop);
    navigate('/sms-relay');
  };

  const handleSnooze = () => {
    const remindOn = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    toast.success(`Snoozed. Will remind ${formatShortDate(remindOn)}.`, {
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
        <h1 className="text-[22px] font-bold text-[#1B1B1B]">Harvest Advisor — {zone} Zone</h1>
        <p className="text-xs font-semibold text-gray-400">Demand pressure calculations optimized for local extension networks</p>
      </div>

      {/* CORE WORKSPACE DUAL PANEL ROW COMBINATION WRAPPER */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 w-full flex-grow overflow-hidden">
        
        {/* LEFT COLUMN: PILL CONTROLLERS AND CARD INJECTOR GRID */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* HORIZONTAL PILL CONTROLLERS ROW TIER */}
          <div className="flex items-center gap-2 shrink-0">
            {recommendations.data.map((rec) => {
              const isActive = activeCrop === rec.crop;
              return (
                <button
                  key={rec.id}
                  onClick={() => setSelectedCrop(rec.crop)}
                  style={{
                    backgroundColor: isActive ? CROP_COLORS[rec.crop] : 'transparent',
                    borderColor: isActive ? CROP_COLORS[rec.crop] : '#E5E7EB',
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
            style={{ borderLeft: `4px solid ${CROP_COLORS[activeRec.crop]}`, gap: '20px' }}
          >
            {/* ROW 1: HEADER SECTION PILL INFO */}
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold text-[#1B1B1B] font-sans leading-none">{activeRec.crop}</h2>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {zone} Zone
              </span>
            </div>

            {/* ROW 2: COUNTDOWN MATRIX CLOCK ENGINE TEXT SPLIT */}
            <div>
              <div className="flex items-baseline justify-center py-2">
                <span className="text-[64px] font-extrabold tracking-tight leading-none" style={{ color: CROP_COLORS[activeRec.crop] }}>
                  {activeRec.daysToOptimalHarvest}
                </span>
                <span className="text-[16px] font-normal text-[#6B7280] ml-2 font-sans">days to harvest</span>
              </div>
              <p className="text-center text-[14px] font-medium text-[#1B1B1B] font-sans mt-1">
                Optimal window: {formatDate(activeRec.windowStart)} – {formatDate(activeRec.windowEnd)}
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
                  {priceChange >= 0 ? '+' : '−'}₹{Math.abs(priceChange)}/q
                </span>
              </div>
              <p className="text-xs font-medium text-[#6B7280]">
                Keeps <span className="font-bold text-[#1B1B1B]">₹{activeRec.netPrice}/q</span>{' '}
                {activeRec.transportCost > 0 ? `after ₹${activeRec.transportCost}/q transport (${activeRec.distanceKm} km)` : 'with no transport cost (local mandi)'}
              </p>
            </div>

            {/* ROW 6: COUPLING ACTION RELAY DISPATCH COMMAND BUTTONS GROUP */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleNotifyFarmers}
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
                <h3 className="text-[16px] font-bold text-[#1B1B1B]">Price outlook — {activeCrop}</h3>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">{zone} Zone · Karnataka</p>
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
                    x={todayWeek}
                    stroke="#E5E7EB" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Today', position: 'insideTopRight', fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} 
                  />
                  
                  {/* Confidence boundaries area interval blocks layer */}
                  <Area dataKey={forecastRange} stroke="none" fill="#F4A261" opacity={0.15} />
                  
                  {/* Actual lines plots layer structure parameters maps hooks */}
                  <Line type="monotone" dataKey="actual" stroke="#2D6A4F" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  
                  {/* Forecast line plots tracker layer parameters */}
                  <Line type="monotone" dataKey="forecast" stroke="#F4A261" strokeWidth={2.5} strokeDasharray="6 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* THREE COLUMN GREEN HORIZONTAL INSIGHT PILLS PANEL ROW */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {activeRec.insights.map((insight) => (
                <div key={insight} className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] rounded-lg py-2.5 text-center text-xs font-bold font-sans">
                  {insight}
                </div>
              ))}
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