import React from 'react';
import { Target, MapPin } from 'lucide-react';
import { COURT_ZONES } from '../data/roster.js';

export default function CourtPitchMap({
  selectedPlayer,
  selectedZoneKey,
  onSelectZone,
  events
}) {
  const getAz = (e) => String(e?.Action || e?.action || e?.Azione || e?.azione || '');
  const getNum = (e) => String(e?.Number ?? e?.number ?? e?.Numero ?? e?.numero ?? '');
  const getZona = (e) => String(e?.Zone || e?.zone || e?.Zona || e?.zona || '');

  // Compute zone colors and statistics (Made / Attempts and Shooting %)
  const getZoneStats = (zoneName) => {
    let filteredEvents = events || [];
    if (selectedPlayer) {
      filteredEvents = filteredEvents.filter(e => getNum(e) === String(selectedPlayer.number));
    }
    
    const zoneEvents = filteredEvents.filter(e => getZona(e) === zoneName);
    const made = zoneEvents.filter(e => {
      const az = getAz(e);
      return az.includes('Made') || az.includes('Fatto');
    }).length;
    const attempts = zoneEvents.length;
    
    if (attempts === 0) {
      return { color: '#0F172A', label: zoneName.toUpperCase(), pct: 0, made: 0, attempts: 0 };
    }
    
    const pct = (made / attempts) * 100;
    let color = '#7F1D1D'; // Brick red 0-32%
    if (pct >= 50.0) color = '#064E3B'; // Dark Emerald 50-100%
    else if (pct >= 33.0) color = '#78350F'; // Dark Amber 33-49%

    return {
      color,
      label: `${made}/${attempts} (${pct.toFixed(0)}%)`,
      pct,
      made,
      attempts
    };
  };

  // Sleek stroke attributes for active zone selection highlighting
  const getStrokeAttrs = (key) => {
    if (key === selectedZoneKey) {
      return {
        stroke: '#38BDF8',
        strokeWidth: 2.5,
        filter: 'drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.7))'
      };
    }
    return {
      stroke: '#334155',
      strokeWidth: 1.2
    };
  };

  const currentZone = COURT_ZONES[selectedZoneKey] || COURT_ZONES.PAINT;

  return (
    <div className="glass-card p-2.5 border-slate-700/60">
      {/* Header Info Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
            2. BASKETBALL COURT HEATMAP (9 SHOT ZONES)
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-sky-500/50 text-sky-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded shadow-sm">
          <MapPin className="w-3 h-3 text-sky-400" />
          TARGET: {currentZone.name.toUpperCase()} ({currentZone.type})
        </div>
      </div>

      {/* SVG Interactive Basketball Half-Court */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-center shadow-inner relative">
        <svg viewBox="0 0 600 360" className="w-full h-48 sm:h-56 rounded">
          {/* Court Outer Boundary */}
          <rect x="10" y="10" width="580" height="340" fill="#090D16" stroke="#334155" strokeWidth="2" />

          {/* ============================================================ */}
          {/* A. 2-POINT ZONES (INSIDE 3-POINT LINE)                      */}
          {/* ============================================================ */}

          {/* 1. PAINT / KEY (2PT) */}
          <g onClick={() => onSelectZone('PAINT')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <rect
              x="210" y="10" width="180" height="150"
              fill={getZoneStats(COURT_ZONES.PAINT.name).color} fillOpacity="0.85"
              {...getStrokeAttrs('PAINT')}
            />
            <text x="300" y="85" fill="#F8FAFC" fontSize="13" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.PAINT.name).label}
            </text>
          </g>

          {/* 2. MID-RANGE LEFT (2PT - INSIDE 3PT ARC) */}
          <g onClick={() => onSelectZone('MID_L')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <path
              d="M 60 10 L 210 10 L 210 160 L 156 232 A 240 240 0 0 1 60 40 L 60 10 Z"
              fill={getZoneStats(COURT_ZONES.MID_L.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('MID_L')}
            />
            <text x="145" y="105" fill="#F8FAFC" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.MID_L.name).label}
            </text>
          </g>

          {/* 3. MID-RANGE RIGHT (2PT - INSIDE 3PT ARC) */}
          <g onClick={() => onSelectZone('MID_R')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <path
              d="M 390 10 L 540 10 L 540 40 A 240 240 0 0 1 444 232 L 390 160 L 390 10 Z"
              fill={getZoneStats(COURT_ZONES.MID_R.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('MID_R')}
            />
            <text x="455" y="105" fill="#F8FAFC" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.MID_R.name).label}
            </text>
          </g>

          {/* 4. MID-RANGE CENTER (2PT - TOP OF KEY INSIDE 3PT ARC) */}
          <g onClick={() => onSelectZone('MID_C')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <path
              d="M 210 160 L 390 160 L 444 232 A 240 240 0 0 1 156 232 Z"
              fill={getZoneStats(COURT_ZONES.MID_C.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('MID_C')}
            />
            <text x="300" y="200" fill="#F8FAFC" fontSize="12" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.MID_C.name).label}
            </text>
          </g>

          {/* ============================================================ */}
          {/* B. 3-POINT ZONES (CLEARLY OUTSIDE 3-POINT LINE)             */}
          {/* ============================================================ */}

          {/* 5. CORNER 3 LEFT (3PT - OUTSIDE 3PT CORNER) */}
          <g onClick={() => onSelectZone('C3_L')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <rect
              x="10" y="10" width="50" height="80"
              fill={getZoneStats(COURT_ZONES.C3_L.name).color} fillOpacity="0.8"
              {...getStrokeAttrs('C3_L')}
            />
            <text x="35" y="50" fill="#38BDF8" fontSize="10" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.C3_L.name).label}
            </text>
          </g>

          {/* 6. CORNER 3 RIGHT (3PT - OUTSIDE 3PT CORNER) */}
          <g onClick={() => onSelectZone('C3_R')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <rect
              x="540" y="10" width="50" height="80"
              fill={getZoneStats(COURT_ZONES.C3_R.name).color} fillOpacity="0.8"
              {...getStrokeAttrs('C3_R')}
            />
            <text x="565" y="50" fill="#38BDF8" fontSize="10" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.C3_R.name).label}
            </text>
          </g>

          {/* 7. WING 3 LEFT (3PT - OUTSIDE 3PT ARC) */}
          <g onClick={() => onSelectZone('W3_L')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <path
              d="M 10 90 L 60 90 L 60 40 A 240 240 0 0 0 156 232 L 140 350 L 10 350 Z"
              fill={getZoneStats(COURT_ZONES.W3_L.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('W3_L')}
            />
            <text x="75" y="230" fill="#38BDF8" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.W3_L.name).label}
            </text>
          </g>

          {/* 8. WING 3 RIGHT (3PT - OUTSIDE 3PT ARC) */}
          <g onClick={() => onSelectZone('W3_R')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <path
              d="M 590 90 L 540 90 L 540 40 A 240 240 0 0 1 444 232 L 460 350 L 590 350 Z"
              fill={getZoneStats(COURT_ZONES.W3_R.name).color} fillOpacity="0.75"
              {...getStrokeAttrs('W3_R')}
            />
            <text x="525" y="230" fill="#38BDF8" fontSize="11" fontWeight="800" textAnchor="middle">
              {getZoneStats(COURT_ZONES.W3_R.name).label}
            </text>
          </g>

          {/* 9. TOP 3 ARC (3PT - OUTSIDE TOP 3PT ARC) */}
          <g onClick={() => onSelectZone('ARC3_C')} className="cursor-pointer hover:opacity-90 transition-opacity">
            <path
              d="M 156 232 A 240 240 0 0 0 444 232 L 460 350 L 140 350 Z"
              fill={getZoneStats(COURT_ZONES.ARC3_C.name).color} fillOpacity="0.8"
              {...getStrokeAttrs('ARC3_C')}
            />
            <text x="300" y="315" fill="#38BDF8" fontSize="13" fontWeight="900" textAnchor="middle">
              {getZoneStats(COURT_ZONES.ARC3_C.name).label}
            </text>
          </g>

          {/* ============================================================ */}
          {/* C. VISUAL OVERLAYS (COURT MARKINGS, LINE & BASKET RIM)     */}
          {/* ============================================================ */}

          {/* Distinct 3-Point Line Boundary Overlay */}
          <path
            d="M 60 10 L 60 40 A 240 240 0 0 0 540 40 L 540 10"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.5"
            pointerEvents="none"
          />

          {/* Free Throw Circle Overlay */}
          <circle cx="300" cy="160" r="45" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="4" pointerEvents="none" />

          {/* Paint Key Line Overlay */}
          <rect x="210" y="10" width="180" height="150" fill="none" stroke="#64748B" strokeWidth="2" pointerEvents="none" />

          {/* Backboard & Rim */}
          <line x1="260" y1="25" x2="340" y2="25" stroke="#94A3B8" strokeWidth="3.5" pointerEvents="none" />
          <circle cx="300" cy="40" r="14" fill="none" stroke="#F59E0B" strokeWidth="3" pointerEvents="none" />
        </svg>
      </div>
    </div>
  );
}
