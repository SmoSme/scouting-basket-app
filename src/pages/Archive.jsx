import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Archive as ArchiveIcon, Download, Trash2, RefreshCw, Calendar, 
  Hash, FileSpreadsheet, Eye, Pencil, Loader2
} from 'lucide-react';
import MatchReviewModal from '../components/MatchReviewModal';
import { 
  formatDateForInput, 
  fetchScoutingMatches, 
  updateScoutingMatchInSupabase, 
  subscribeToMatchCache,
  getMatchEvents
} from '../services/matchMetadataService';
import { getOfflineQueue, clearOfflineQueue } from '../services/offlineSync';
import { useLanguage } from '../context/LanguageContext';

export default function Archive({ showToast, authRole = 'admin' }) {
  const { language, t } = useLanguage();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Match Review Modal State
  const [reviewMatch, setReviewMatch] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetchArchive();
    const unsubscribe = subscribeToMatchCache(() => {
      fetchArchive();
    });
    return () => unsubscribe();
  }, []);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      // 1. Primary Source of Truth: Fetch normalized matches directly from scouting_matches
      const normalizedMatches = await fetchScoutingMatches();

      // 2. Fetch event counts per match_id via lightweight relational query
      const countMap = {};
      try {
        const { data: countData, error: countErr } = await supabase
          .from('scouting_log')
          .select('match_id');

        if (!countErr && Array.isArray(countData)) {
          countData.forEach(r => {
            if (r.match_id) {
              countMap[r.match_id] = (countMap[r.match_id] || 0) + 1;
            }
          });
        }
      } catch (ce) {
        console.warn('Could not fetch event counts:', ce);
      }

      let matchSummaries = [];

      if (normalizedMatches && normalizedMatches.length > 0) {
        // Build archive strictly from scouting_matches
        matchSummaries = normalizedMatches.map(nm => {
          const resolvedDate = nm.match_date ? String(nm.match_date).split('T')[0] : (nm.created_at ? nm.created_at.split('T')[0] : 'n.a.');
          const displayedTeamPts = nm.home_score !== null && nm.home_score !== undefined ? Number(nm.home_score) : 0;
          const displayedOppPts = nm.away_score !== null && nm.away_score !== undefined ? Number(nm.away_score) : 0;
          const isScoreOverridden = displayedTeamPts > 0 || displayedOppPts > 0;
          const evCount = countMap[nm.id] || 0;

          return {
            id: nm.id,
            name: nm.match_name,
            match_name: nm.match_name,
            opponentName: nm.opponent_name || nm.match_name.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim(),
            isHome: nm.is_home,
            eventCount: evCount,
            home_score: displayedTeamPts,
            away_score: displayedOppPts,
            pts: displayedTeamPts,
            oppPts: displayedOppPts,
            displayedTeamPts,
            displayedOppPts,
            isScoreOverridden,
            createdAt: nm.created_at,
            matchType: nm.match_type || 'Official',
            match_type: nm.match_type || 'Official',
            matchDate: resolvedDate,
            match_date: resolvedDate
          };
        });
      } else {
        // Fallback if scouting_matches is not yet populated
        const { data: rawLogs } = await supabase
          .from('scouting_log')
          .select('*')
          .order('id', { ascending: false });

        const eventsByName = {};
        (rawLogs || []).forEach(item => {
          if (item.Action === 'MATCH_METADATA' || item.Player === 'METADATA') return;
          const gameName = item.Match_Name || item.match_name || item.nome_partita || 'Unnamed Match';
          if (!eventsByName[gameName]) eventsByName[gameName] = [];
          eventsByName[gameName].push(item);
        });

        matchSummaries = Object.keys(eventsByName).map(name => {
          const mEvents = eventsByName[name] || [];
          const resolvedDate = mEvents[0]?.created_at ? mEvents[0].created_at.split('T')[0] : 'n.a.';
          return {
            id: null,
            name,
            opponentName: name.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim(),
            isHome: true,
            eventCount: mEvents.length,
            home_score: 0,
            away_score: 0,
            pts: 0,
            oppPts: 0,
            displayedTeamPts: 0,
            displayedOppPts: 0,
            isScoreOverridden: false,
            createdAt: resolvedDate,
            matchType: 'Official',
            matchDate: resolvedDate,
            match_date: resolvedDate,
            events: mEvents
          };
        });
      }

      setMatches(matchSummaries);
    } catch (err) {
      console.error('Archive query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMatchDate = async (matchIdentifier, newDate, shouldSave = true) => {
    if (!newDate) return;
    try {
      if (shouldSave) {
        await updateScoutingMatchInSupabase(matchIdentifier, { match_date: newDate });
      }
      setMatches(prev => prev.map(m => (m.id === matchIdentifier || m.name === matchIdentifier) ? { ...m, matchDate: newDate, match_date: newDate } : m));
      if (reviewMatch && (reviewMatch.id === matchIdentifier || reviewMatch.name === matchIdentifier)) {
        setReviewMatch(prev => ({ ...prev, matchDate: newDate, match_date: newDate }));
      }
      if (showToast) showToast(language === 'it' ? 'Data salvata su Supabase' : 'Date saved to Supabase');
    } catch (e) {
      console.error('Failed to update match date in Supabase:', e);
      if (showToast) showToast(language === 'it' ? 'Errore nel salvataggio della data' : 'Error saving date');
    }
  };

  const handleUpdateMatchType = async (matchIdentifier, newType) => {
    try {
      await updateScoutingMatchInSupabase(matchIdentifier, { match_type: newType });
      setMatches(prev => prev.map(m => (m.id === matchIdentifier || m.name === matchIdentifier) ? { ...m, matchType: newType, match_type: newType } : m));
      if (reviewMatch && (reviewMatch.id === matchIdentifier || reviewMatch.name === matchIdentifier)) {
        setReviewMatch(prev => ({ ...prev, matchType: newType, match_type: newType }));
      }
      if (showToast) showToast(language === 'it' ? 'Tipo partita salvato su Supabase' : 'Match type saved to Supabase');
    } catch (e) {
      console.error('Failed to update match type in Supabase:', e);
    }
  };

  const handleUpdateScoreOverride = async (matchIdentifier, tScore, oScore) => {
    try {
      await updateScoutingMatchInSupabase(matchIdentifier, {
        home_score: tScore,
        away_score: oScore,
        overrideTeamScore: tScore,
        overrideOppScore: oScore
      });
      setMatches(prev => prev.map(m => (m.id === matchIdentifier || m.name === matchIdentifier) ? {
        ...m,
        home_score: tScore,
        away_score: oScore,
        displayedTeamPts: tScore !== null ? tScore : m.pts,
        displayedOppPts: oScore !== null ? oScore : m.oppPts,
        isScoreOverridden: tScore !== null || oScore !== null
      } : m));
      if (reviewMatch && (reviewMatch.id === matchIdentifier || reviewMatch.name === matchIdentifier)) {
        setReviewMatch(prev => ({
          ...prev,
          home_score: tScore,
          away_score: oScore,
          displayedTeamPts: tScore !== null ? tScore : prev.pts,
          displayedOppPts: oScore !== null ? oScore : prev.oppPts,
          isScoreOverridden: tScore !== null || oScore !== null
        }));
      }
      if (showToast) showToast(language === 'it' ? 'Punteggio salvato su Supabase' : 'Score saved to Supabase');
    } catch (e) {
      console.error('Failed to update score override in Supabase:', e);
    }
  };

  // Action: Open Match Review Modal passing match.id (UUID)
  const handleOpenMatchReview = (match) => {
    const resolvedDate = match.match_date || match.matchDate || (match.createdAt ? match.createdAt.split('T')[0] : 'n.a.');
    const resolvedTeamScore = match.home_score ?? match.displayedTeamPts ?? match.pts ?? 0;
    const resolvedOppScore = match.away_score ?? match.displayedOppPts ?? match.oppPts ?? 0;

    setReviewMatch({
      ...match,
      id: match.id,
      name: match.name,
      home_score: resolvedTeamScore,
      away_score: resolvedOppScore,
      pts: resolvedTeamScore,
      oppPts: resolvedOppScore,
      displayedTeamPts: resolvedTeamScore,
      displayedOppPts: resolvedOppScore,
      is_home: match.isHome ?? match.is_home ?? true,
      createdAt: match.createdAt,
      matchType: match.matchType || match.match_type || 'Official',
      matchDate: resolvedDate,
      match_date: resolvedDate
    });
  };

  // Action: Download CSV for specific match using match_id
  const handleDownloadCSV = async (matchId, matchName, matchEvents) => {
    try {
      setActionLoading(matchId || matchName);
      
      let rowsToExport = matchEvents;
      if (!rowsToExport || rowsToExport.length === 0) {
        if (matchId) {
          rowsToExport = await getMatchEvents(matchId);
        } else {
          const { data } = await supabase
            .from('scouting_log')
            .select('*')
            .eq('Match_Name', matchName)
            .order('id', { ascending: true });
          rowsToExport = data || [];
        }
      }

      const headers = ['Timestamp', 'Quarter', 'Number', 'Player', 'Action', 'Category', 'Zone', 'Match_Name', 'match_id'];
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
          `"${r.Match_Name || r.match_name || r.nome_partita || matchName}"`,
          `"${r.match_id || matchId || ''}"`
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
      
      if (showToast) showToast(`Exported CSV for "${matchName}"`);
    } catch (err) {
      console.error('Download CSV error:', err);
      if (showToast) showToast(`Error exporting CSV file`);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Delete Specific Game from Supabase using relational match_id with CASCADE
  const handleDeleteGame = async (matchId, matchName) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete match "${matchName}" and all associated play logs from Supabase?`)) {
      return;
    }

    try {
      setActionLoading(matchId || matchName);

      if (matchId) {
        // Direct cascade delete on scouting_matches table by its id (UUID primary key)
        const { error } = await supabase
          .from('scouting_matches')
          .delete()
          .eq('id', matchId);

        if (error) {
          console.warn('Cascaded delete on scouting_matches reported error, running fallback:', error);
          await supabase.from('scouting_log').delete().eq('match_id', matchId);
          await supabase.from('scouting_matches').delete().eq('id', matchId);
        }
      } else {
        await supabase
          .from('scouting_log')
          .delete()
          .eq('Match_Name', matchName);
      }

      // Purge local storage caches and offline queue for the deleted match to prevent zombie resurrections
      try {
        localStorage.removeItem(`bba_events_${matchName}`);
        localStorage.removeItem(`bba_score_${matchName}`);
        localStorage.removeItem(`bba_plusminus_${matchName}`);
        if (localStorage.getItem('current_game_session') === matchName) {
          localStorage.removeItem('current_game_session');
        }
        if (matchId && localStorage.getItem('current_match_id') === matchId) {
          localStorage.removeItem('current_match_id');
        }
        // Purge any queued offline events belonging to this match
        const queue = getOfflineQueue();
        const cleanedQueue = queue.filter(item => {
          if (!item) return false;
          const itemMatchId = item.match_id || item.matchId;
          const itemMatchName = item.Match_Name || item.match_name || item.nome_partita;
          return itemMatchId !== matchId && itemMatchName !== matchName;
        });
        if (cleanedQueue.length === 0) {
          clearOfflineQueue();
        } else {
          localStorage.setItem('scouting_offline_queue', JSON.stringify(cleanedQueue));
        }
      } catch (e) {}

      if (showToast) showToast(`Match "${matchName}" deleted from Supabase`);
      if (reviewMatch && (reviewMatch.id === matchId || reviewMatch.name === matchName)) {
        setReviewMatch(null);
      }
      fetchArchive();
    } catch (err) {
      console.error('Delete match error:', err);
      if (showToast) showToast(`Error deleting match from Supabase`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
      {/* Archive Header Banner */}
      <div className="flex flex-wrap items-center justify-between bg-white p-5 rounded-2xl border border-[#DDF3E9] shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DDF3E9] border border-[#0CA17A]/30 flex items-center justify-center flex-none">
            <ArchiveIcon className="w-5 h-5 text-[#0CA17A]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#022D32] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#0CA17A] rounded-full inline-block" />
              <span>{t('archive_title')}</span>
            </h1>
            <p className="text-xs text-[#022D32]/70 font-semibold mt-0.5">
              {t('archive_subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={fetchArchive}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-[#DDF3E9] hover:border-[#0CA17A] text-[#022D32] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-[#0CA17A] ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'it' ? 'AGGIORNA' : 'REFRESH'}</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white p-12 text-center border border-[#DDF3E9] rounded-2xl shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-[#0CA17A] animate-spin mx-auto mb-2" />
          <p className="text-[#022D32] font-black text-sm">{language === 'it' ? 'Caricamento archivio partite da Supabase...' : 'Loading match archive from Supabase...'}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white p-12 text-center border border-[#DDF3E9] rounded-2xl shadow-xs space-y-3">
          <FileSpreadsheet className="w-12 h-12 text-[#0CA17A]/50 mx-auto mb-1" />
          <h3 className="text-[#022D32] font-black text-base uppercase">{language === 'it' ? 'Nessuna partita archiviata' : 'No matches archived'}</h3>
          <p className="text-[#022D32]/70 font-medium text-xs max-w-md mx-auto">
            {t('no_matches_found')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((m, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-[#DDF3E9] hover:border-[#0CA17A] transition-all shadow-xs flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base text-[#022D32] uppercase tracking-wider">
                      {m.name}
                    </h3>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      m.matchType === 'Official'
                        ? 'bg-[#DDF3E9] text-[#022D32] border-[#0CA17A]/40'
                        : 'bg-sky-50 text-sky-800 border-sky-300'
                    }`}>
                      {m.matchType === 'Official' ? (language === 'it' ? 'Ufficiale' : 'Official') : (language === 'it' ? 'Amichevole' : 'Friendly')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#022D32] text-white font-mono font-black text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <span className="text-amber-400 font-bold">{m.displayedTeamPts !== undefined ? m.displayedTeamPts : m.pts}</span>
                      <span className="text-white/70 font-black">-</span>
                      <span className="text-white font-bold">{m.displayedOppPts !== undefined ? m.displayedOppPts : (m.oppPts || 0)}</span>
                    </span>
                    {m.isScoreOverridden && (
                      <span className="text-[9px] font-black bg-[#DDF3E9] text-[#022D32] border border-[#0CA17A]/40 px-1.5 py-0.5 rounded" title={`Official Table Override (PBP: ${m.pts}-${m.oppPts})`}>
                        SYNCED
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#022D32]/70 mb-2 font-semibold">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#0CA17A]" />
                    {m.eventCount} {language === 'it' ? 'Azioni Registrate' : 'Tracked Events'}
                  </span>
                  <div 
                    className="flex items-center gap-1.5 bg-[#DDF3E9]/50 hover:bg-[#DDF3E9] px-2 py-0.5 rounded-md border border-[#0CA17A]/20 transition-colors group cursor-pointer"
                    title={language === 'it' ? 'Modifica data partita (Supabase)' : 'Edit match date (Supabase)'}
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#0CA17A] shrink-0" />
                    <input
                      type="date"
                      value={formatDateForInput(m.matchDate) || formatDateForInput(m.createdAt) || ''}
                      onChange={(e) => handleUpdateMatchDate(m.id || m.name, e.target.value, true)}
                      className="bg-transparent text-[#022D32] font-bold text-xs focus:outline-none cursor-pointer [color-scheme:light]"
                    />
                    <Pencil className="w-2.5 h-2.5 text-[#022D32]/40 group-hover:text-[#022D32] transition-colors shrink-0" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#DDF3E9]">
                <button
                  onClick={() => handleOpenMatchReview(m)}
                  disabled={actionLoading === m.id || actionLoading === m.name}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black py-2.5 px-3 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  {t('full_review')}
                </button>
                <button
                  onClick={() => handleDownloadCSV(m.id, m.name, m.events)}
                  disabled={actionLoading === m.id || actionLoading === m.name}
                  className="flex items-center justify-center gap-1.5 bg-[#022D32] hover:bg-[#022D32]/90 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Scarica CSV"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                {authRole === 'admin' && (
                  <button
                    onClick={() => handleDeleteGame(m.id, m.name)}
                    disabled={actionLoading === m.id || actionLoading === m.name}
                    className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                    title={t('delete')}
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
          matchId={reviewMatch.id}
          onClose={() => setReviewMatch(null)}
          onDownloadCSV={(matchIdOrName, name, evts) => handleDownloadCSV(reviewMatch.id || matchIdOrName, name || reviewMatch.name, evts)}
          onUpdateMatchDate={handleUpdateMatchDate}
          onUpdateMatchType={handleUpdateMatchType}
          onUpdateScoreOverride={handleUpdateScoreOverride}
        />
      )}
    </div>
  );
}
