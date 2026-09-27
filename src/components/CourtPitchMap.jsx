import React from 'react';
import { Target, MapPin } from 'lucide-react';
import { COURT_ZONES } from '../data/roster.js';

export default function CourtPitchMap({
  selectedPlayer,
  selectedZoneKey,
  onSelectZone,
  events
}) {
  // Compute zone colors and statistics (Made / Attempts and Shooting %)
  const getZoneStats = (zoneName) => {
    let filteredEvents = events;
    if (selectedPlayer) {
      filteredEvents = events.filter(e => String(e.Numero) === String(selectedPlayer.number));
    }
    
    const zoneEvents = filteredEvents.filter(e => e.Zona === zoneName);
    const made = zoneEvents.filter(e => e.Azione && e.Azione.includes('Fatto')).length;
    const attempts = zoneEvents.length;
    
    if (attempts === 0) {
      return { color: '#1E293B', label: zoneName.toUpperCase(), pct: 0, made: 0, attempts: 0 };
    }
    
    const pct = (made / attempts) * 100;
    let color = '#EF4444'; // Red 0-32%
    if (pct >= 50.0) color = '#059669'; // Emerald Green 50-100%
    else if (pct >= 33.0) color = '#D97706'; // Amber 33-49%

    return {
      color,
      label: `${made}/${attempts} (${pct.toFixed(0)}%)`,
      pct,
      made,
      attempts
    };
  };

  // Helper stroke attributes for active zone selection highlighting
  const getStrokeAttrs = (key) => {
    if (key === selectedZoneKey) {
      return {
        stroke: '#06B6D4',
        strokeWidth: 5,
        filter: 'drop-shadow(0px 0px 8px rgba(6, 182, 212, 0.9))'
      };
    }
    return {
      stroke: '#FF6B00',
      strokeWidth: 2
    };
  };

  return (
    <div className="glass-card p-2">
      {/* Header Info Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
            2. BASKETBALL COURT PITCH MAP (ALL 9 SHOT ZONES)
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-sky-500/60 text-sky-400 font-extrabold text-[10px] px-2.5 py-0.5 rounded shadow-sm">
          <MapPin className="w-3 h-3 text-sky-400" />
          TARGET: {COURT_ZONES[selectedZoneKey].name.toUpperCase()} ({COURT_ZONES[selectedZoneKey].type})
        </div>
      </div>

      {/* SVG Interactive Basketball Half-Court (All 9 Zones Clickable) */}
      <div className="bg-slate-950 border border-amber-600/80 rounded p-1 text-center shadow-inner relative">
        <svg viewBox="0 0 600 360" className="w-full h-48 sm:h-52 rounded">
          {/* Court Outer Boundary */}
          <rect x="10" y="10" width="580" height="340" fill="#0B0F17" stroke="#FF6B00" strokeWidth="4" />

          {/* 1. PAINT / KEY (Area 2PT) */}
          <g onClick={() => onSelectZone('PAINT')} className="cursor-pointer hover:opacity-90">
            <rect
              x="210" y="10" width="180" height="150"
              fill={getZoneStats(COURT_ZONES.PAINT.name).color} fillOpacity="0.8"
              {...getStrokeAttrs('PAINT')}
            />
            <text x="300" y="85" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.PAINT.name).label}
            </text>
          </g>

          {/* Free Throw Circle Overlay */}
          <circle cx="300" cy="160" r="50" fill="none" stroke="#FF6B00" strokeWidth="3" strokeDasharray="5" pointerEvents="none" />

          {/* 2. MID-RANGE LEFT (2PT) */}
          <g onClick={() => onSelectZone('MID_L')} className="cursor-pointer hover:opacity-90">
            <polygon
              points="60,10 210,10 210,160 60,90"
              fill={getZoneStats(COURT_ZONES.MID_L.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('MID_L')}
            />
            <text x="135" y="70" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.MID_L.name).label}
            </text>
          </g>

          {/* 3. MID-RANGE RIGHT (2PT) */}
          <g onClick={() => onSelectZone('MID_R')} className="cursor-pointer hover:opacity-90">
            <polygon
              points="390,10 540,10 540,90 390,160"
              fill={getZoneStats(COURT_ZONES.MID_R.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('MID_R')}
            />
            <text x="465" y="70" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.MID_R.name).label}
            </text>
          </g>

          {/* 4. MID-RANGE CENTER (2PT) */}
          <g onClick={() => onSelectZone('MID_C')} className="cursor-pointer hover:opacity-90">
            <path
              d="M 60 90 L 210 160 L 390 160 L 540 90 A 230 230 0 0 1 60 90 Z"
              fill={getZoneStats(COURT_ZONES.MID_C.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('MID_C')}
            />
            <text x="300" y="195" fill="#FFFFFF" fontSize="12" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.MID_C.name).label}
            </text>
          </g>

          {/* 3PT Arc Main Line Overlay */}
          <path d="M 60 10 L 60 90 A 230 230 0 0 0 540 90 L 540 10" fill="none" stroke="#FF6B00" strokeWidth="4" pointerEvents="none" />

          {/* 5. CORNER 3 LEFT (3PT) */}
          <g onClick={() => onSelectZone('C3_L')} className="cursor-pointer hover:opacity-90">
            <rect
              x="10" y="10" width="50" height="80"
              fill={getZoneStats(COURT_ZONES.C3_L.name).color} fillOpacity="0.8"
              {...getStrokeAttrs('C3_L')}
            />
            <text x="35" y="50" fill="#38BDF8" fontSize="10" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.C3_L.name).label}
            </text>
          </g>

          {/* 6. CORNER 3 RIGHT (3PT) */}
          <g onClick={() => onSelectZone('C3_R')} className="cursor-pointer hover:opacity-90">
            <rect
              x="540" y="10" width="50" height="80"
              fill={getZoneStats(COURT_ZONES.C3_R.name).color} fillOpacity="0.8"
              {...getStrokeAttrs('C3_R')}
            />
            <text x="565" y="50" fill="#38BDF8" fontSize="10" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.C3_R.name).label}
            </text>
          </g>

          {/* 7. WING 3 LEFT (3PT) */}
          <g onClick={() => onSelectZone('W3_L')} className="cursor-pointer hover:opacity-90">
            <polygon
              points="10,90 60,90 200,230 140,350 10,350"
              fill={getZoneStats(COURT_ZONES.W3_L.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('W3_L')}
            />
            <text x="80" y="240" fill="#38BDF8" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.W3_L.name).label}
            </text>
          </g>

          {/* 8. WING 3 RIGHT (3PT) */}
          <g onClick={() => onSelectZone('W3_R')} className="cursor-pointer hover:opacity-90">
            <polygon
              points="590,90 540,90 400,230 460,350 590,350"
              fill={getZoneStats(COURT_ZONES.W3_R.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('W3_R')}
            />
            <text x="520" y="240" fill="#38BDF8" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.W3_R.name).label}
            </text>
          </g>

          {/* 9. TOP 3 ARC (3PT) */}
          <g onClick={() => onSelectZone('ARC3_C')} className="cursor-pointer hover:opacity-90">
            <polygon
              points="140,350 200,230 400,230 460,350"
              fill={getZoneStats(COURT_ZONES.ARC3_C.name).color} fillOpacity="0.8"
              {...getStrokeAttrs('ARC3_C')}
            />
            <text x="300" y="305" fill="#38BDF8" fontSize="13" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.ARC3_C.name).label}
            </text>
          </g>

          {/* Backboard & Rim (Visual Overlay) */}
          <line x1="260" y1="26" x2="340" y2="26" stroke="#FFFFFF" strokeWidth="4" pointerEvents="none" />
          <circle cx="300" cy="42" r="14" fill="none" stroke="#FF6B00" strokeWidth="4" pointerEvents="none" />
        </svg>
      </div>

      {/* 9 Zone Selector Buttons Grid */}
      <div className="grid grid-cols-3 gap-1 mt-1.5">
        {Object.entries(COURT_ZONES).map(([key, zone]) => {
          const stats = getZoneStats(zone.name);
          const isSelected = selectedZoneKey === key;
          
          return (
            <button
              key={key}
              onClick={() => onSelectZone(key)}
              className={`py-1 px-1 text-[10px] font-bold rounded border transition-all truncate flex items-center justify-between ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 border-white font-black shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span className="truncate">{zone.name}</span>
              <span className={`text-[9px] px-1 rounded ml-0.5 ${isSelected ? 'bg-black text-amber-300' : 'bg-slate-950 text-slate-400'}`}>
                {zone.type}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
