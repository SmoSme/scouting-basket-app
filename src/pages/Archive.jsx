import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Archive as ArchiveIcon, Download, Trash2, RefreshCw, Calendar, 
  Hash, FileSpreadsheet, Eye, Pencil, Loader2
} from 'lucide-react';
import MatchReviewModal from '../components/MatchReviewModal';
import { calculateOpponentScore } from '../utils/basketballAnalytics';
import { 
  extractMatchMetadataMap, 
  saveMatchMetadataToSupabase, 
  formatDateForInput, 
  fetchScoutingMatches, 
  updateScoutingMatchInSupabase, 
  subscribeToMatchCache 
} from '../services/matchMetadataService';
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
      // 1. Fetch normalized matches from scouting_matches
      const normalizedMatches = await fetchScoutingMatches();

      // 2. Fetch all events from Supabase scouting_log
      const { data, error } = await supabase
        .from('scouting_log')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Supabase archive fetch error:', error);
      }

      const rawLogs = data || [];
      const metaMap = extractMatchMetadataMap(rawLogs);

      // Group events by match_id and by Match_Name
      const eventsByMatchId = {};
      const eventsByName = {};

      rawLogs.forEach(item => {
        if (item.Action === 'MATCH_METADATA' || item.Player === 'METADATA') return;

        if (item.match_id) {
          if (!eventsByMatchId[item.match_id]) eventsByMatchId[item.match_id] = [];
          eventsByMatchId[item.match_id].push(item);
        }

        const gameName = item.Match_Name || item.match_name || item.nome_partita || item.Nome_Partita || 'Unnamed Match';
        if (!eventsByName[gameName]) {
          eventsByName[gameName] = [];
        }
        eventsByName[gameName].push(item);
      });

      let matchSummaries = [];

      if (normalizedMatches && normalizedMatches.length > 0) {
        // Use normalized matches as primary relational structure
        matchSummaries = normalizedMatches.map(nm => {
          const mEvents = eventsByMatchId[nm.id] || eventsByName[nm.match_name] || [];
          const teamPts = mEvents.reduce((acc, ev) => {
            const az = ev.Action || ev.action || ev.Azione || ev.azione || '';
            if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
            if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
            if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
            return acc;
          }, 0);
          const oppPts = calculateOpponentScore(mEvents);

          const meta = metaMap[nm.match_name] || {};
          const overrideTeamScore = nm.home_score || meta.overrideTeamScore;
          const overrideOppScore = nm.away_score || meta.overrideOppScore;
          const isScoreOverridden = (overrideTeamScore > 0 || overrideOppScore > 0) || (meta.overrideTeamScore !== null && meta.overrideTeamScore !== undefined);

          const displayedTeamPts = isScoreOverridden && overrideTeamScore ? overrideTeamScore : teamPts;
          const displayedOppPts = isScoreOverridden && overrideOppScore ? overrideOppScore : oppPts;
          const resolvedDate = nm.match_date ? String(nm.match_date).split('T')[0] : (meta.matchDate || (nm.created_at ? nm.created_at.split('T')[0] : 'n.a.'));

          return {
            id: nm.id,
            name: nm.match_name,
            opponentName: nm.opponent_name || nm.match_name.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim(),
            isHome: nm.is_home,
            eventCount: mEvents.length,
            home_score: displayedTeamPts,
            away_score: displayedOppPts,
            pts: displayedTeamPts,
            oppPts: displayedOppPts,
            displayedTeamPts,
            displayedOppPts,
            isScoreOverridden,
            createdAt: nm.created_at,
            matchType: nm.match_type || meta.matchType || 'Official',
            matchDate: resolvedDate,
            match_date: resolvedDate,
            events: mEvents
          };
        });
      } else {
        // Fallback to grouping by Match_Name
        matchSummaries = Object.keys(eventsByName).map(name => {
          const mEvents = eventsByName[name] || [];
          const teamPts = mEvents.reduce((acc, ev) => {
            const az = ev.Action || ev.action || ev.Azione || ev.azione || '';
            if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
            if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
            if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
            return acc;
          }, 0);
          const oppPts = calculateOpponentScore(mEvents);

          const meta = metaMap[name] || {};
          const matchType = meta.matchType || 'Official';
          const matchDate = meta.matchDate || (mEvents[0]?.created_at ? mEvents[0].created_at.split('T')[0] : 'n.a.');
          const overrideTeamScore = meta.overrideTeamScore;
          const overrideOppScore = meta.overrideOppScore;
          const isScoreOverridden = overrideTeamScore !== null || overrideOppScore !== null;

          const displayedTeamPts = isScoreOverridden && overrideTeamScore !== null ? overrideTeamScore : teamPts;
          const displayedOppPts = isScoreOverridden && overrideOppScore !== null ? overrideOppScore : oppPts;

          return {
            id: meta.matchId || null,
            name,
            opponentName: name.replace(/^BBA\s*(vs|contro|-)\s*/i, '').trim(),
            isHome: true,
            eventCount: mEvents.length,
            home_score: displayedTeamPts,
            away_score: displayedOppPts,
            pts: displayedTeamPts,
            oppPts: displayedOppPts,
            displayedTeamPts,
            displayedOppPts,
            isScoreOverridden,
            createdAt: mEvents[0]?.created_at || 'n.a.',
            matchType,
            matchDate,
            match_date: matchDate,
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
      setMatches(prev => prev.map(m => (m.id === matchIdentifier || m.name === matchIdentifier) ? { ...m, matchDate: newDate } : m));
      if (reviewMatch && (reviewMatch.id === matchIdentifier || reviewMatch.name === matchIdentifier)) {
        setReviewMatch(prev => ({ ...prev, matchDate: newDate }));
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
      setMatches(prev => prev.map(m => (m.id === matchIdentifier || m.name === matchIdentifier) ? { ...m, matchType: newType } : m));
      if (reviewMatch && (reviewMatch.id === matchIdentifier || reviewMatch.name === matchIdentifier)) {
        setReviewMatch(prev => ({ ...prev, matchType: newType }));
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
        displayedTeamPts: tScore !== null ? tScore : m.pts,
        displayedOppPts: oScore !== null ? oScore : m.oppPts,
        isScoreOverridden: tScore !== null || oScore !== null
      } : m));
      if (reviewMatch && (reviewMatch.id === matchIdentifier || reviewMatch.name === matchIdentifier)) {
        setReviewMatch(prev => ({
          ...prev,
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
      const resolvedDate = match.match_date || match.matchDate || (match.createdAt ? match.createdAt.split('T')[0] : 'n.a.');
      const resolvedTeamScore = match.home_score ?? match.displayedTeamPts ?? match.pts;
      const resolvedOppScore = match.away_score ?? match.displayedOppPts ?? match.oppPts;

      setReviewMatch({
        ...match,
        id: match.id,
        name: match.name,
        events: sortedEvents,
        home_score: resolvedTeamScore,
        away_score: resolvedOppScore,
        pts: resolvedTeamScore,
        oppPts: resolvedOppScore,
        displayedTeamPts: resolvedTeamScore,
        displayedOppPts: resolvedOppScore,
        is_home: match.isHome ?? match.is_home ?? true,
        createdAt: match.createdAt,
        matchType: match.matchType || 'Official',
        matchDate: resolvedDate,
        match_date: resolvedDate
      });
    } catch (err) {
      console.error('Error opening match review:', err);
      if (showToast) showToast('Error loading match details');
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
      
      if (showToast) showToast(`Exported CSV for "${matchName}"`);
    } catch (err) {
      console.error('Download CSV error:', err);
      if (showToast) showToast(`Error exporting CSV file`);
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

      if (showToast) showToast(`Match "${matchName}" deleted from Supabase`);
      if (reviewMatch && reviewMatch.name === matchName) {
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
                  disabled={actionLoading === m.name}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#0CA17A] hover:bg-[#0CA17A]/90 text-white font-black py-2.5 px-3 rounded-xl text-xs transition-all shadow-sm active:scale-95"
                >
                  <Eye className="w-4 h-4" />
                  {t('full_review')}
                </button>
                <button
                  onClick={() => handleDownloadCSV(m.name, m.events)}
                  disabled={actionLoading === m.name}
                  className="flex items-center justify-center gap-1.5 bg-[#022D32] hover:bg-[#022D32]/90 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-sm active:scale-95"
                  title="Scarica CSV"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                {authRole === 'admin' && (
                  <button
                    onClick={() => handleDeleteGame(m.name)}
                    disabled={actionLoading === m.name}
                    className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-all active:scale-95"
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
