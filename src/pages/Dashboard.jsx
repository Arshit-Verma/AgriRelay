import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ComposedChart, Line, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PageStatus from '../components/ui/PageStatus';
import { CROP_COLORS } from '../constants/crops';
import { useZone } from '../context/ZoneContext';
import { useApi } from '../hooks/useApi';
import { useSyncStatus } from '../hooks/useSyncStatus';

// Clean, customized inline styling override templates to supersede old components wrappers
const customCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
};

// Recharts draws a band between two values when dataKey returns a [min, max] pair
const forecastRange = (point) => (point.min == null ? null : [point.min, point.max]);

export default function Dashboard() {
  const navigate = useNavigate();
  const { zone, contaminationFlags } = useZone();
  const syncStatus = useSyncStatus();
  const farmers = useApi('/api/farmers');
  const mandis = useApi('/api/mandis');
  const recommendations = useApi('/api/harvest-recommendations');
  const leadCrop = recommendations.data?.[0]?.crop;
  const priceTrend = useApi(leadCrop ? '/api/price-trends' : null, { crop: leadCrop });

  if (!farmers.data || !mandis.data || !recommendations.data || !priceTrend.data) {
    return <PageStatus error={farmers.error || mandis.error || recommendations.error || priceTrend.error} />;
  }

  const bestRecommendation = recommendations.data.reduce((best, rec) => (rec.targetPrice > best.targetPrice ? rec : best));
  const averageTrustScore = Math.round(
    mandis.data.reduce((total, mandi) => total + mandi.supplyTrustScore, 0) / mandis.data.length,
  );
  const highSeverityFlagCount = contaminationFlags.filter((flag) => flag.severity === 'high').length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* PART 3 OVR: TOPBAR CUSTOM RENDERING BLOCK EMBED */}
      <div className="flex flex-col gap-4 border-b border-black/10 bg-[#F8F9F2] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1B1B1B] font-sans">
            {zone} Zone — Karnataka
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-full bg-[#2D6A4F] px-3 py-1 text-[12px] font-semibold text-white font-sans">
            {zone} Zone
          </div>
          <span className="text-xs font-semibold text-muted flex items-center gap-1">
            {syncStatus}
            <span className="inline-block text-[#2D6A4F] animate-pulse">●</span>
          </span>
        </div>
      </div>

      {/* PART 1 & 3: STAT CARDS ROW LAYOUT CONFIGURATION */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        
        {/* CARD 1: FARMERS */}
        <div style={{ ...customCardStyle, borderBottom: '3px solid #2D6A4F' }} className="flex flex-col justify-between">
          <span className="text-[12px] font-semibold text-[#6B7280] tracking-[0.06em] uppercase">REGISTERED FARMERS</span>
          <h2 className="text-[36px] font-extrabold text-[#2D6A4F] mt-2 leading-none">{farmers.data.length}</h2>
          <span className="text-[13px] font-normal text-gray-500 mt-2">Feature-phone reachable</span>
        </div>

        {/* CARD 2: BEST MANDI */}
        <div style={{ ...customCardStyle, borderBottom: '3px solid #F4A261' }} className="flex flex-col justify-between">
          <span className="text-[12px] font-semibold text-[#6B7280] tracking-[0.06em] uppercase">BEST PREDICTED MANDI</span>
          <h2 className="text-[36px] font-extrabold text-[#F4A261] mt-2 leading-none break-words text-[28px] xl:text-[32px]">{bestRecommendation.targetMandi}</h2>
          <span className="text-[13px] font-normal text-gray-500 mt-2">₹{bestRecommendation.targetPrice}/quintal</span>
        </div>

        {/* CARD 3: TRUST SCORE */}
        <div style={{ ...customCardStyle, borderBottom: '3px solid #2D6A4F' }} className="flex flex-col justify-between">
          <span className="text-[12px] font-semibold text-[#6B7280] tracking-[0.06em] uppercase">AVG TRUST SCORE</span>
          <h2 className="text-[36px] font-extrabold text-[#2D6A4F] mt-2 leading-none">{averageTrustScore}</h2>
          <span className="text-[13px] font-normal text-gray-500 mt-2">Across monitored mandis</span>
        </div>

        {/* CARD 4: FLAGS */}
        <div style={{ ...customCardStyle, borderBottom: '3px solid #E63946' }} className="flex flex-col justify-between">
          <span className="text-[12px] font-semibold text-[#6B7280] tracking-[0.06em] uppercase">HIGH SEVERITY FLAGS</span>
          <h2 className="text-[36px] font-extrabold text-[#E63946] mt-2 leading-none">{highSeverityFlagCount}</h2>
          <span className="text-[13px] font-normal text-gray-500 mt-2">{highSeverityFlagCount > 0 ? 'Needs immediate follow-up' : 'No urgent follow-up needed'}</span>
        </div>

      </div>

      {/* LOWER PANEL GRAPH SECTIONS */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        
        {/* CHART LAYOUT COMPONENT PANEL CONTAINER */}
        <div className="bg-white p-6 rounded-[8px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#1B1B1B]">Price Direction — {leadCrop}</h3>
            <p className="text-xs font-semibold text-gray-400">Weekly observed and forecasted mandi price movement</p>
          </div>
          
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceTrend.data.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} unit="₹" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  itemStyle={{ fontSize: '13px', fontFamily: 'sans-serif' }}
                />
                
                {/* Confidence Range Shadow Area Bounds */}
                <Area 
                  dataKey={forecastRange}
                  name="Forecast Range"
                  stroke="none" 
                  fill="#F4A261" 
                  opacity={0.12} 
                />
                
                {/* Historical Observed Tracker Line */}
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  name="Actual Price"
                  stroke="#2D6A4F" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: '#2D6A4F' }}
                  activeDot={{ r: 5 }}
                />
                
                {/* Predictive Model Interval Line */}
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  name="Forecasted Price"
                  stroke="#F4A261" 
                  strokeWidth={2} 
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: '#F4A261' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PART 2: CROP PRIORITY REPLACEMENT LIST CONTAINER */}
        <div className="bg-white p-6 rounded-[8px]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-[#1B1B1B]">Relay Priorities</h3>
            <p className="text-xs font-semibold text-gray-400">Crops under this officer&apos;s field responsibility</p>
          </div>

          <div className="flex flex-col w-full">
            {recommendations.data.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/harvest-advisor')}
                className="flex items-center justify-between py-4 border-b border-[#F3F4F6] cursor-pointer hover:bg-gray-50/50 transition duration-150 group"
              >
                <div className="flex items-center gap-3">
                  {/* Color strip marker code elements block definition */}
                  <div 
                    style={{ backgroundColor: CROP_COLORS[item.crop], width: '10px', height: '40px', borderRadius: '2px' }}
                    className="shrink-0"
                  />
                  <div>
                    <p className="text-[15px] font-semibold text-[#1B1B1B] font-sans leading-tight">
                      {item.crop}
                    </p>
                    <p className="text-[12px] font-normal text-gray-400 font-sans mt-0.5">
                      {zone} zone
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-[13px] font-medium text-[#2D6A4F] font-sans leading-none">
                      Sell at {item.targetMandi}
                    </p>
                    <p className="text-[16px] font-bold text-[#2D6A4F] font-sans mt-1 leading-none">
                      ₹{item.targetPrice}/q predicted
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition duration-150" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}