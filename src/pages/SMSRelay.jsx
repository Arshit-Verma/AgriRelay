import React, { useState, useEffect } from "react";
import { Send, Search, CheckCircle2, ChevronDown, ChevronUp, Edit3, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { postOrQueue } from '../api/outbox';
import PageStatus from '../components/ui/PageStatus';
import { CROP_BADGE_CLASSES } from '../constants/crops';
import { buildRoutingMessage, buildTemplateMessage } from '../constants/smsTemplates';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { formatDateTime } from '../utils/format';

export default function SMSRelay() {
  const { officer } = useAuth();
  const farmers = useApi('/api/farmers');
  const recommendations = useApi('/api/harvest-recommendations');
  const schemes = useApi('/api/govt-schemes');
  const logs = useApi('/api/sms/logs');

  // State Matrices
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFarmers, setSelectedFarmers] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState("market");
  const [chosenCrop, setChosenCrop] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [lang, setLang] = useState("EN");
  const [sentThisSession, setSentThisSession] = useState([]);
  const [expandedLogIds, setExpandedLogIds] = useState([]);

  // Text the officer typed or another page handed over. Null means "use the template".
  const [draft, setDraft] = useState(null);

  // Modal Animation Triggers
  const [showModal, setShowModal] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  // Pick up anything another page sent here, once the farmer list has loaded
  useEffect(() => {
    if (!farmers.data) return;

    const selectFarmersGrowing = (crops) => {
      setSelectedFarmers(farmers.data.filter((f) => crops.includes(f.crop)).map((f) => f.id));
    };

    const harvestCrop = sessionStorage.getItem("harvestAlertCrop");
    if (harvestCrop) {
      sessionStorage.removeItem("harvestAlertCrop");
      setChosenCrop(harvestCrop);
      setActiveTemplate("harvest");
      selectFarmersGrowing([harvestCrop]);
    }

    const schemeText = sessionStorage.getItem("activeTemplateText");
    if (schemeText) {
      sessionStorage.removeItem("activeTemplateText");
      setActiveTemplate("scheme");
      setDraft(schemeText);
    }

    const storedWatchlist = sessionStorage.getItem("alertWatchlist");
    if (storedWatchlist) {
      sessionStorage.removeItem("alertWatchlist");
      const watchlist = JSON.parse(storedWatchlist);
      setActiveTemplate("market");
      setDraft(buildRoutingMessage(watchlist));
      selectFarmersGrowing(watchlist.map((mandi) => mandi.crop));
    }
  }, [farmers.data]);

  if (!farmers.data || !recommendations.data || !schemes.data || !logs.data) {
    return <PageStatus error={farmers.error || recommendations.error || schemes.error || logs.error} />;
  }

  const crops = recommendations.data.map((rec) => rec.crop);
  const focusCrop = chosenCrop ?? crops[0];
  const focusRecommendation = recommendations.data.find((rec) => rec.crop === focusCrop);
  const compiledMessage = draft ?? buildTemplateMessage(activeTemplate, lang, focusRecommendation, schemes.data[0]);
  const history = [...sentThisSession, ...logs.data];

  const chooseTemplate = (template) => {
    setActiveTemplate(template);
    setDraft(null);
  };

  const chooseCrop = (crop) => {
    setChosenCrop(crop);
    setDraft(null);
  };

  const chooseLanguage = (language) => {
    setLang(language);
    setDraft(null);
  };

  // Search logic filtration
  const filteredFarmers = farmers.data.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFarmerSelection = (id) => {
    setSelectedFarmers(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFocusCropFarmers = () => {
    setSelectedFarmers(farmers.data.filter(f => f.crop === focusCrop).map(f => f.id));
    toast.success(`Selected all ${focusCrop} category farmers`);
  };

  const triggerRelayDispatch = () => {
    if (selectedFarmers.length === 0) {
      toast.error("Please select at least one farmer recipient.");
      return;
    }
    setAnimStep(0);
    setShowModal(true);

    // Staggered interface mock execution chains
    setTimeout(() => setAnimStep(1), 400);  // Message bubble
    setTimeout(() => setAnimStep(2), 1000); // Delivered banner
    setTimeout(() => setAnimStep(3), 1400); // Receipt logs load
  };

  const handleModalComplete = () => {
    const recipients = selectedFarmers.length;

    // The send itself is simulated; this only records it in the message log
    const entry = { crop: focusCrop, recipients, message: compiledMessage };

    postOrQueue("/api/sms/send", entry, officer.id)
      .then(({ saved, result }) => {
        if (saved) {
          setSentThisSession((current) => [result.log, ...current]);
          toast.success(`SMS relay complete. ${recipients} farmers notified.`);
        } else {
          const waiting = { ...entry, id: `waiting-${Date.now()}`, sentAt: new Date().toISOString(), status: "Waiting to sync" };
          setSentThisSession((current) => [waiting, ...current]);
          toast.success("You're offline. The log entry will sync when you reconnect.");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("The message could not be saved to the log.");
      });

    setShowModal(false);
    setSelectedFarmers([]);
  };

  const toggleHistoryExpand = (id) => {
    setExpandedLogIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="flex flex-col w-full font-sans antialiased overflow-hidden text-gray-900" style={{ height: "calc(100vh - 120px)" }}>
      
      {/* STATIC TOPBAR BANNER TIER */}
      <div className="flex flex-col gap-1 border-b border-black/10 bg-[#F8F9F2] pb-4 mb-5 shrink-0">
        <h1 className="text-[22px] font-bold text-[#1B1B1B]">SMS Relay Broadcast Terminal</h1>
        <p className="text-xs font-semibold text-gray-400">Push synchronized price targets and structural harvest timelines to cellular networks</p>
      </div>

      {/* CORE DISPLAY WINDOW WRAPPER LAYOUT SPLIT */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 w-full flex-grow overflow-hidden">
        
        {/* LEFT COMPOSITION COLUMN */}
        <div className="flex flex-col gap-5 overflow-y-auto pr-1 pb-4">
          
          {/* SECTION 1 — FARMER REGISTRY CONTROL MATRIX */}
          <div className="bg-white border border-black/10 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1B1B1B]">Recipient Selection</h2>
              <p className="text-[11px] text-gray-400 font-medium">Isolate recipient field phone directories</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farmers or village profiles..."
                className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 text-xs outline-none focus:border-[#2D6A4F] transition"
              />
            </div>

            <button 
              onClick={selectAllFocusCropFarmers}
              className="w-full h-8 border border-[#2D6A4F]/20 text-[#2D6A4F] hover:bg-green-50/50 text-xs font-semibold rounded-lg transition"
            >
              Select all {focusCrop} farmers
            </button>

            {/* SCROLLABLE PROFILE RENDER CELL RACKS */}
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 max-h-[220px] overflow-y-auto bg-gray-50/30">
              {filteredFarmers.map((farmer) => {
                const isChecked = selectedFarmers.includes(farmer.id);
                const badgeColor = CROP_BADGE_CLASSES[farmer.crop];
                
                return (
                  <div 
                    key={farmer.id}
                    onClick={() => toggleFarmerSelection(farmer.id)}
                    className={`flex items-center gap-3 p-2.5 cursor-pointer transition-all duration-150 ${
                      isChecked ? "bg-[#F0FDF4] border-l-[3px] border-[#2D6A4F]" : "hover:bg-gray-50"
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Swallowed to let row wrapper clicks handle it safely
                      className="accent-[#2D6A4F] h-3.5 w-3.5 rounded border-gray-300"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[#1B1B1B] truncate">{farmer.name}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-px border rounded ${badgeColor}`}>{farmer.crop}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-0.5">
                        <p>{farmer.village}</p>
                        <p className="font-mono">{farmer.phone}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] font-bold text-[#2D6A4F] leading-none px-0.5">{selectedFarmers.length} farmers selected</p>
          </div>

          {/* SECTION 2 — ALGORITHM TEMPLATE TABS COMPONENT */}
          <div className="bg-white border border-black/10 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1B1B1B]">Relay Context Templates</h2>
              <p className="text-[11px] text-gray-400 font-medium">Select algorithmic notification payload profiles</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "market", label: "Market Alert" },
                { id: "harvest", label: "Harvest" },
                { id: "scheme", label: "Govt Scheme" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => chooseTemplate(t.id)}
                  className={`py-2 text-[11px] font-bold rounded-lg transition border border-transparent ${
                    activeTemplate === t.id ? "bg-[#2D6A4F] text-white" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Crop:</span>
              {crops.map((crop) => (
                <button
                  key={crop}
                  onClick={() => chooseCrop(crop)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition border ${
                    focusCrop === crop ? "bg-[#2D6A4F] border-[#2D6A4F] text-white" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3 — COMPOSITION FIELD PREVIEW WRAPPER */}
          <div className="bg-white border border-black/10 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1B1B1B]">Transmission Payload Preview</h2>
                <p className="text-[11px] text-gray-400 font-medium">Direct live terminal message arrays output</p>
              </div>
              <button 
                onClick={() => setIsEditable(!isEditable)}
                className={`p-1.5 rounded-md transition ${isEditable ? "bg-green-50 text-[#2D6A4F]" : "text-gray-400 hover:bg-gray-50"}`}
              >
                <Edit3 size={15} />
              </button>
            </div>

            <div className="relative">
              {isEditable ? (
                <textarea
                  value={compiledMessage}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[12px] text-[#1B1B1B] outline-none focus:border-[#2D6A4F] resize-none leading-relaxed"
                />
              ) : (
                <div className="w-full min-h-[100px] p-3 rounded-lg bg-gray-100 border border-gray-200 font-mono text-[12px] text-[#1B1B1B] leading-relaxed break-words">
                  {compiledMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-[11px] font-medium text-gray-400">
                {compiledMessage.length} / 160 characters · 1 SMS unit
              </span>
              
              <div className="flex items-center bg-gray-100 rounded-md p-0.5 border border-gray-200">
                {["EN", "KN"].map(l => (
                  <button
                    key={l}
                    onClick={() => chooseLanguage(l)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${lang === l ? "bg-[#2D6A4F] text-white shadow-sm" : "text-gray-500"}`}
                  >
                    {l === "EN" ? "English" : "ಕನ್ನಡ"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={triggerRelayDispatch}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] text-sm font-semibold text-white transition hover:bg-[#1B4D37] shadow-sm"
            >
              <Send size={15} />
              <span>Send to {selectedFarmers.length} farmers</span>
            </button>
          </div>

        </div>

        {/* RIGHT METRIC HISTORY INDEX COLUMN */}
        <div className="bg-white border border-black/10 rounded-xl p-6 flex flex-col justify-between overflow-y-auto max-h-full shadow-sm">
          <div>
            <h3 className="text-[16px] font-bold text-[#1B1B1B] border-b border-gray-100 pb-3 mb-4">Transmission Logs & History</h3>
            
            {/* CARDS LIST STACKS MATRIX MAPPING */}
            <div className="flex flex-col w-full">
              {history.map((card) => (
                <div 
                  key={card.id}
                  className="bg-white border border-[#E5E7EB] rounded-xl p-3 mb-3 shadow-sm flex flex-col gap-2 transition duration-150 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-400">{formatDateTime(card.sentAt)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-px bg-gray-50 border border-gray-100 rounded text-gray-600">
                        {card.crop}
                      </span>
                      <button 
                        onClick={() => toggleHistoryExpand(card.id)}
                        className="text-gray-300 group-hover:text-gray-500 transition"
                      >
                        {expandedLogIds.includes(card.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  <p className={`text-[13px] font-normal text-[#4B5563] leading-relaxed ${!expandedLogIds.includes(card.id) && "truncate pr-4"}`}>
                    {card.message}
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-2 text-[11px] font-medium text-gray-500">
                    <span className="font-semibold text-gray-400">{card.recipients} farmers targeted</span>
                    <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                      <span className="h-1 w-1 rounded-full bg-green-600" /> {card.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BASE LINE ANALYTICS HORIZONTAL SUMMARY STRIP */}
          <div className="border-t border-gray-100 pt-5 mt-4 grid grid-cols-3 gap-2 text-center shrink-0">
            <div>
              <p className="text-[22px] font-extrabold text-[#2D6A4F] leading-none">21</p>
              <p className="text-[11px] font-medium text-gray-400 mt-1.5 uppercase tracking-wider">sent this week</p>
            </div>
            <div className="border-l border-r border-gray-100">
              <p className="text-[22px] font-extrabold text-[#2D6A4F] leading-none">97%</p>
              <p className="text-[11px] font-medium text-gray-400 mt-1.5 uppercase tracking-wider">delivery rate</p>
            </div>
            <div>
              <p className="text-[22px] font-extrabold text-[#2D6A4F] leading-none">3.2m</p>
              <p className="text-[11px] font-medium text-gray-400 mt-1.5 uppercase tracking-wider">avg cellular delay</p>
            </div>
          </div>

        </div>

      </div>

      {/* FAKE PHONE MODAL STAGGERED OVERLAY PLATFORM WINDOW */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative flex flex-col items-center max-w-lg w-full">
            
            {/* FORCE EXIT OUT TRAP BUTTON COUNTER OVERLAY */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
            >
              <XCircle size={18} />
              <span>Abort Relay</span>
            </button>

            {/* PURE CSS SMARTPHONE HOUSING UNIT DISPLAY PANEL */}
            <div 
              className="relative w-[260px] h-[480px] bg-[#1a1a1a] rounded-[36px] border-[6px] border-[#333] shadow-2xl overflow-hidden flex flex-col shrink-0"
              style={{ boxShadow: "0 0 0 1px #555, 0 32px 64px rgba(0,0,0,0.5)" }}
            >
              {/* Top notch hardware configuration bar placeholder */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a1a] rounded-b-2xl z-50 flex items-center justify-center" />

              {/* SCREEN PLATFORM REALM CONTAINER */}
              <div className="w-full h-full bg-black flex flex-col justify-between pt-5 pb-3 px-3 relative select-none">
                
                {/* Status Bar Indicators Row */}
                <div className="flex items-center justify-between text-white text-[10px] font-bold tracking-tight px-2 shrink-0 z-30">
                  <span>9:41</span>
                  <div className="flex items-center gap-1 text-white/80">
                    <span>📶</span>
                    <span>🛜</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* SMS Conversation App Header Bar Element */}
                <div className="bg-[#1c1c1e] -mx-3 py-2 px-3 flex items-center justify-between border-b border-white/5 shadow-md mt-1 shrink-0 z-30">
                  <span className="text-blue-500 text-[11px] font-medium">‹ Messages</span>
                  <span className="text-white text-[12px] font-bold tracking-wide font-sans">AgriRelay Core</span>
                  <div className="w-10" /> {/* Balanced padding element container */}
                </div>

                {/* THREAD CONTAINER CHAT WINDOW PORT LIST RACKS */}
                <div className="flex-grow flex flex-col gap-3 justify-end pb-4 overflow-y-auto px-1">
                  
                  {/* MESSAGE BUBBLE: shows the text the officer composed */}
                  {animStep >= 1 && (
                    <div className="flex flex-col items-end gap-1 w-full max-w-[90%] self-end animate-in fade-in slide-in-from-bottom-3 duration-300">
                      <div className="bg-[#2D6A4F] text-white text-[11px] leading-relaxed rounded-[18px] rounded-br-[4px] p-2.5 shadow-sm break-words text-left font-sans">
                        {compiledMessage}
                      </div>
                      <span className="text-[9px] font-semibold text-white/40 leading-none pr-1">Now · Delivered</span>
                    </div>
                  )}

                  {/* DELIVERED BOTTOM ACKNOWLEDGMENT TIER BANNER */}
                  {animStep >= 2 && (
                    <p className="text-center text-[10px] font-medium text-white/60 py-1 font-sans animate-in fade-in duration-200">
                      ✓ Delivered to {selectedFarmers.length} farmers cell gateways
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* STAGGERED RECIPIENT DELIVERY CONFIRMATION RECEIPT LOG CARDS RACK OVERLAY CONTAINER */}
            {animStep >= 3 && (
              <div className="mt-5 w-[320px] bg-white rounded-xl p-4 shadow-xl border border-black/5 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5">Network Transmission Logs</h4>
                
                <div className="max-h-[140px] overflow-y-auto divide-y divide-gray-50 pr-0.5">
                  {selectedFarmers.map((id, index) => {
                    const farmerProfile = farmers.data.find(f => f.id === id);
                    if (!farmerProfile) return null;
                    const simulatedLatency = 120 + (index * 45);

                    return (
                      <div 
                        key={id} 
                        className="flex items-center justify-between py-2 animate-in fade-in slide-in-from-bottom-1 duration-200"
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                          <span className="text-[13px] font-semibold text-[#1B1B1B]">{farmerProfile.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400">Delivered · {simulatedLatency}ms</span>
                      </div>
                    );
                  })}
                </div>

                {/* FINAL INTERACTIVE CONTROLS TIER AT ABSOLUTE BASE SECTION AREA */}
                <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={handleModalComplete}
                    className="flex h-9 items-center justify-center rounded-lg bg-[#2D6A4F] text-xs font-bold text-white transition hover:bg-[#1B4D37]"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex h-9 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-500 transition hover:bg-gray-100"
                  >
                    Send another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}