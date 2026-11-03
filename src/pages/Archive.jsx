import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Archive as ArchiveIcon, Download, Trash2, RefreshCw, Calendar, 
  Hash, FileSpreadsheet, Eye
} from 'lucide-react';
import MatchReviewModal from '../components/MatchReviewModal';
import { calculateOpponentScore } from '../utils/basketballAnalytics';
import { getScoreOverride } from '../utils/scoreOverride';

export default function Archive({ showToast, authRole = 'admin' }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Match Review Modal State
  const [reviewMatch, setReviewMatch] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchArchive();
  }, []);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      // Query all records from Supabase scouting_log
      const { data, error } = await supabase
        .from('scouting_log')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Supabase archive fetch error:', error);
        setMatches([]);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Group events by distinct Match_Name (or fallback to nome_partita)
      const grouped = {};
      (data || []).forEach(item => {
        const gameName = item.Match_Name || item.match_name || item.nome_partita || item.Nome_Partita || 'Unnamed Match';
        if (!grouped[gameName]) {
          grouped[gameName] = {
            name: gameName,
            events: [],
            createdAt: item.created_at || item.Timestamp || item.timestamp || 'n.a.'
          };
        }
        grouped[gameName].events.push(item);
      });

      // Also scan localStorage for any local match sessions
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('bba_events_')) {
            const gameName = key.replace('bba_events_', '');
            if (gameName && !grouped[gameName]) {
              try {
                const localEvs = JSON.parse(localStorage.getItem(key));
                if (Array.isArray(localEvs) && localEvs.length > 0) {
                  grouped[gameName] = {
                    name: gameName,
                    events: localEvs,
                    createdAt: localEvs[0]?.timestamp || new Date().toISOString()
                  };
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {}

      // Convert to array of match summaries
      const matchSummaries = Object.values(grouped).map(m => {
        const teamPts = m.events.reduce((acc, ev) => {
          const az = ev.Action || ev.action || ev.Azione || ev.azione || '';
          if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
          if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
          if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
          return acc;
        }, 0);
        const oppPts = calculateOpponentScore(m.events);

        const storedType = localStorage.getItem(`match_type_${m.name}`) || 'Official';
        const storedDate = localStorage.getItem(`match_date_${m.name}`) || (m.createdAt ? m.createdAt.split('T')[0] : 'n.a.');
        const override = getScoreOverride(m.name);
        const displayedTeamPts = override?.overrideTeamScore !== null && override?.overrideTeamScore !== undefined ? override.overrideTeamScore : teamPts;
        const displayedOppPts = override?.overrideOppScore !== null && override?.overrideOppScore !== undefined ? override.overrideOppScore : oppPts;
        const isScoreOverridden = override !== null && (override.overrideTeamScore !== null || override.overrideOppScore !== null);

        return {
          name: m.name,
          eventCount: m.events.length,
          pts: teamPts,
          oppPts,
          displayedTeamPts,
          displayedOppPts,
          isScoreOverridden,
          createdAt: m.createdAt,
          matchType: storedType,
          matchDate: storedDate,
          events: m.events
        };
      });

      setMatches(matchSummaries);
    } catch (err) {
      console.error('Archive query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMatchDate = (matchName, newDate) => {
    try {
      localStorage.setItem(`match_date_${matchName}`, newDate);
    } catch (e) {}
    setMatches(prev => prev.map(m => m.name === matchName ? { ...m, matchDate: newDate } : m));
    if (reviewMatch && reviewMatch.name === matchName) {
      setReviewMatch(prev => ({ ...prev, matchDate: newDate }));
    }
  };

  const handleUpdateMatchType = (matchName, newType) => {
    try {
      localStorage.setItem(`match_type_${matchName}`, newType);
    } catch (e) {}
    setMatches(prev => prev.map(m => m.name === matchName ? { ...m, matchType: newType } : m));
    if (reviewMatch && reviewMatch.name === matchName) {
      setReviewMatch(prev => ({ ...prev, matchType: newType }));
    }
  };

  const handleUpdateScoreOverride = (matchName, tScore, oScore) => {
    setMatches(prev => prev.map(m => {
      if (m.name !== matchName) return m;
      const isOver = tScore !== null || oScore !== null;
      return {
        ...m,
        displayedTeamPts: tScore !== null ? tScore : m.pts,
        displayedOppPts: oScore !== null ? oScore : m.oppPts,
        isScoreOverridden: isOver
      };
    }));
  };

  // Action: Open Match Review Modal
  const handleOpenMatchReview = async (match) => {
    setReviewLoading(true);
    try {
      let events = match.events;
      if (!events || events.length === 0) {
        let { data, error } = await supabase
          .from('scouting_log')
          .select('*')
          .eq('Match_Name', match.name)
          .order('id', { ascending: true });

        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from('scouting_log')
            .select('*')
            .eq('nome_partita', match.name)
            .order('id', { ascending: true });

          if (!fallback.error && fallback.data) {
            data = fallback.data;
          }
        }

        if (error) throw error;
        events = data;
      }

      const sortedEvents = [...(events || [])].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      setReviewMatch({
        name: match.name,
        events: sortedEvents,
        pts: match.pts,
        createdAt: match.createdAt,
        matchType: match.matchType || localStorage.getItem(`match_type_${match.name}`) || 'Official',
        matchDate: match.matchDate || localStorage.getItem(`match_date_${match.name}`)
      });
    } catch (err) {
      console.error('Error opening match review:', err);
      if (showToast) showToast('❌ Error loading match details');
    } finally {
      setReviewLoading(false);
    }
  };

  // Action: Download CSV for specific match
  const handleDownloadCSV = async (matchName, matchEvents) => {
    try {
      setActionLoading(matchName);
      
      // If full events not in memory, query from Supabase
      let rowsToExport = matchEvents;
      if (!rowsToExport || rowsToExport.length === 0) {
        let { data, error } = await supabase
          .from('scouting_log')
          .select('*')
          .eq('Match_Name', matchName);

        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from('scouting_log')
            .select('*')
            .eq('nome_partita', matchName);
          if (!fallback.error && fallback.data) data = fallback.data;
        }
          
        if (error) throw error;
        rowsToExport = data;
      }

      const headers = ['Timestamp', 'Quarter', 'Number', 'Player', 'Action', 'Category', 'Zone', 'Match_Name'];
      const csvRows = [headers.join(',')];

      rowsToExport.forEach(r => {
        const line = [
          `"${r.Timestamp || r.timestamp || ''}"`,
          `"${r.Quarter || r.quarter || r.Quarto || r.quarto || ''}"`,
          `"${r.Number ?? r.number ?? r.Numero ?? r.numero ?? ''}"`,
          `"${r.Player || r.player || r.Giocatore || r.giocatore || ''}"`,
          `"${r.Action || r.action || r.Azione || r.azione || ''}"`,
          `"${r.Category || r.category || r.Categoria || r.categoria || ''}"`,
          `"${r.Zone || r.zone || r.Zona || r.zona || ''}"`,
          `"${r.Match_Name || r.match_name || r.nome_partita || matchName}"`
        ];
        csvRows.push(line.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${matchName.replace(/\s+/g, '_')}_stats.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (showToast) showToast(`📥 Exported CSV for "${matchName}"`);
    } catch (err) {
      console.error('Download CSV error:', err);
      if (showToast) showToast(`❌ Error exporting CSV file`);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Delete Specific Game from Supabase
  const handleDeleteGame = async (matchName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete match "${matchName}" and all associated play logs from Supabase?`)) {
      return;
    }

    try {
      setActionLoading(matchName);

      let { error } = await supabase
        .from('scouting_log')
        .delete()
        .eq('Match_Name', matchName);

      if (error) {
        const fallback = await supabase
          .from('scouting_log')
          .delete()
          .eq('nome_partita', matchName);
        if (fallback.error) throw fallback.error;
      }

      if (showToast) showToast(`🗑️ Match "${matchName}" deleted from Supabase!`);
      if (reviewMatch && reviewMatch.name === matchName) {
        setReviewMatch(null);
      }
      fetchArchive();
    } catch (err) {
      console.error('Delete match error:', err);
      if (showToast) showToast(`❌ Error deleting match from Supabase`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 max-w-6xl mx-auto w-full">
      {/* Archive Header */}
      <div className="flex items-center justify-between glass-card p-4 mb-4 border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
            <ArchiveIcon className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-100 uppercase tracking-wider">
              SUPABASE MATCH ARCHIVE
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              View, review, and export historical match scouting logs stored in cloud
            </p>
          </div>
        </div>

        <button
          onClick={fetchArchive}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-sky-400 text-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
          REFRESH
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="glass-card p-12 text-center border-slate-700/60">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-sm">Loading match archive from Supabase...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-12 text-center border-slate-700/60">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-200 font-black text-base uppercase mb-1">No matches in archive</h3>
          <p className="text-slate-400 font-semibold text-xs max-w-md mx-auto">
            No match scouting logs found on Supabase. Start a new session from "Live Game" to log play events!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((m, idx) => (
            <div key={idx} className="glass-card p-4 border-slate-700/60 hover:border-sky-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base text-sky-400 uppercase tracking-wider">
                      {m.name}
                    </h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                      m.matchType === 'Official'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : m.matchType === 'Friendly'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}>
                      {m.matchType || 'Official'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-slate-950 border border-slate-800 text-slate-300 font-mono font-black text-xs px-2.5 py-1 rounded flex items-center gap-1">
                      <span className="text-amber-400">{m.displayedTeamPts !== undefined ? m.displayedTeamPts : m.pts}</span>
                      <span className="text-slate-500 font-bold">-</span>
                      <span className="text-slate-200">{m.displayedOppPts !== undefined ? m.displayedOppPts : (m.oppPts || 0)}</span>
                    </span>
                    {m.isScoreOverridden && (
                      <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded" title={`Official Table Override (PBP: ${m.pts}-${m.oppPts})`}>
                        SYNCED
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 font-semibold">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-sky-400" />
                    {m.eventCount} Logged Plays
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {(() => {
                      const stored = m.matchDate || localStorage.getItem(`match_date_${m.name}`);
                      if (stored) return new Date(stored + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      try { return new Date(m.createdAt).toLocaleDateString('en-US'); } catch(e) { return m.createdAt || 'n.a.'; }
                    })()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenMatchReview(m)}
                  disabled={actionLoading === m.name}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 px-2.5 rounded-lg text-xs transition-all shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  REVIEW MATCH
                </button>
                <button
                  onClick={() => handleDownloadCSV(m.name, m.events)}
                  disabled={actionLoading === m.name}
                  className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-black py-2 px-2.5 rounded-lg text-xs transition-all shadow-md"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                {authRole === 'admin' && (
                  <button
                    onClick={() => handleDeleteGame(m.name)}
                    disabled={actionLoading === m.name}
                    className="flex items-center justify-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold py-2 px-2.5 rounded-lg text-xs transition-all"
                    title="Delete Match"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Review Modal */}
      {reviewMatch && (
        <MatchReviewModal
          match={reviewMatch}
          onClose={() => setReviewMatch(null)}
          onDownloadCSV={handleDownloadCSV}
          onUpdateMatchDate={handleUpdateMatchDate}
          onUpdateMatchType={handleUpdateMatchType}
          onUpdateScoreOverride={handleUpdateScoreOverride}
        />
      )}
    </div>
  );
}
