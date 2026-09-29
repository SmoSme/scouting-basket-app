import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Archive as ArchiveIcon, Download, Trash2, RefreshCw, Calendar, 
  Hash, FileSpreadsheet, Eye, X, PieChart, Trophy, List, Filter 
} from 'lucide-react';
import CourtPitchMap from '../components/CourtPitchMap';
import BoxScoreTable from '../components/BoxScoreTable';
import { DEFAULT_ROSTER } from '../data/roster.js';

export default function Archive({ showToast }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Match Review Modal State
  const [reviewMatch, setReviewMatch] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewTab, setReviewTab] = useState('heatmap'); // 'heatmap' | 'boxscore' | 'timeline'
  const [reviewPlayerFilter, setReviewPlayerFilter] = useState(null);
  const [reviewSelectedZone, setReviewSelectedZone] = useState('PAINT');

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

      // Group events by distinct nome_partita
      const grouped = {};
      data.forEach(item => {
        const gameName = item.nome_partita || item.Nome_Partita || 'Unnamed Match';
        if (!grouped[gameName]) {
          grouped[gameName] = {
            name: gameName,
            events: [],
            createdAt: item.created_at || item.Timestamp || 'n.a.'
          };
        }
        grouped[gameName].events.push(item);
      });

      // Convert to array of match summaries
      const matchSummaries = Object.values(grouped).map(m => {
        const teamPts = m.events.reduce((acc, ev) => {
          const az = ev.azione || ev.Azione || '';
          if (az === '2PT Made' || az === '2PT Fatto') return acc + 2;
          if (az === '3PT Made' || az === '3PT Fatto') return acc + 3;
          if (az === 'FT Made' || az === 'TL Fatto') return acc + 1;
          return acc;
        }, 0);

        return {
          name: m.name,
          eventCount: m.events.length,
          pts: teamPts,
          createdAt: m.createdAt,
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

  // Action: Open Match Review Modal
  const handleOpenMatchReview = async (match) => {
    setReviewLoading(true);
    try {
      let events = match.events;
      if (!events || events.length === 0) {
        const { data, error } = await supabase
          .from('scouting_log')
          .select('*')
          .eq('nome_partita', match.name)
          .order('id', { ascending: true });

        if (error) throw error;
        events = data;
      }
      setReviewMatch({
        name: match.name,
        events: events || [],
        pts: match.pts,
        createdAt: match.createdAt
      });
      setReviewTab('heatmap');
      setReviewPlayerFilter(null);
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
        const { data, error } = await supabase
          .from('scouting_log')
          .select('*')
          .eq('nome_partita', matchName);
          
        if (error) throw error;
        rowsToExport = data;
      }

      const headers = ['Timestamp', 'Quarter', 'Number', 'Player', 'Action', 'Category', 'Zone', 'Match_Name'];
      const csvRows = [headers.join(',')];

      rowsToExport.forEach(r => {
        const line = [
          `"${r.timestamp || r.Timestamp || ''}"`,
          `"${r.quarto || r.Quarto || ''}"`,
          `"${r.numero || r.Numero || ''}"`,
          `"${r.giocatore || r.Giocatore || ''}"`,
          `"${r.azione || r.Azione || ''}"`,
          `"${r.categoria || r.Categoria || ''}"`,
          `"${r.zona || r.Zona || ''}"`,
          `"${r.nome_partita || matchName}"`
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
    if (!window.confirm(`Sei sicuro di voler eliminare DEFINITIVAMENTE la partita "${matchName}" e tutti i suoi dati da Supabase?`)) {
      return;
    }

    try {
      setActionLoading(matchName);

      const { error } = await supabase
        .from('scouting_log')
        .delete()
        .eq('nome_partita', matchName);

      if (error) {
        throw error;
      }

      if (showToast) showToast(`🗑️ Partita "${matchName}" eliminata da Supabase!`);
      if (reviewMatch && reviewMatch.name === matchName) {
        setReviewMatch(null);
      }
      fetchArchive();
    } catch (err) {
      console.error('Delete match error:', err);
      if (showToast) showToast(`❌ Errore nell'eliminazione della partita da Supabase`);
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
              ARCHIVIO PARTITE SUPABASE
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Visualizza, rivedi e esporta le partite salvate nel database cloud
            </p>
          </div>
        </div>

        <button
          onClick={fetchArchive}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-sky-400 text-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
          AGGIORNA
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="glass-card p-12 text-center border-slate-700/60">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-sm">Caricamento archivio da Supabase...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-12 text-center border-slate-700/60">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-200 font-black text-base uppercase mb-1">Nessuna partita in archivio</h3>
          <p className="text-slate-400 font-semibold text-xs max-w-md mx-auto">
            Nessun log partita trovato su Supabase. Avvia una nuova sessione dalla pagina "Live Game" per registrare i tuoi eventi di gioco!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((m, idx) => (
            <div key={idx} className="glass-card p-4 border-slate-700/60 hover:border-sky-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-black text-base text-sky-400 uppercase tracking-wider">
                    {m.name}
                  </h3>
                  <span className="bg-slate-950 border border-slate-800 text-slate-300 font-extrabold text-xs px-2.5 py-1 rounded">
                    {m.pts} PTS
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 font-semibold">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-sky-400" />
                    {m.eventCount} Eventi Registrati
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(m.createdAt).toLocaleDateString('it-IT')}
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
                  APRI PARTITA
                </button>
                <button
                  onClick={() => handleDownloadCSV(m.name, m.events)}
                  disabled={actionLoading === m.name}
                  className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-black py-2 px-2.5 rounded-lg text-xs transition-all shadow-md"
                  title="Scarica CSV"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleDeleteGame(m.name)}
                  disabled={actionLoading === m.name}
                  className="flex items-center justify-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold py-2 px-2.5 rounded-lg text-xs transition-all"
                  title="Elimina Partita"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Review Modal */}
      {reviewMatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wider">
                      {reviewMatch.name}
                    </h2>
                    <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black px-2 py-0.5 rounded">
                      {reviewMatch.pts} PTS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-3 mt-0.5">
                    <span>{reviewMatch.events.length} Eventi Registrati</span>
                    <span>•</span>
                    <span>{new Date(reviewMatch.createdAt).toLocaleDateString('it-IT')}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadCSV(reviewMatch.name, reviewMatch.events)}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  SCARICA CSV
                </button>
                <button
                  onClick={() => setReviewMatch(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                  title="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2">
              <button
                onClick={() => setReviewTab('heatmap')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-extrabold transition-all border-b-2 ${
                  reviewTab === 'heatmap'
                    ? 'bg-slate-800 text-sky-400 border-sky-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <PieChart className="w-4 h-4" />
                HEATMAP CAMPO
              </button>
              <button
                onClick={() => setReviewTab('boxscore')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-extrabold transition-all border-b-2 ${
                  reviewTab === 'boxscore'
                    ? 'bg-slate-800 text-sky-400 border-sky-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4" />
                BOX SCORE FIBA
              </button>
              <button
                onClick={() => setReviewTab('timeline')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-extrabold transition-all border-b-2 ${
                  reviewTab === 'timeline'
                    ? 'bg-slate-800 text-sky-400 border-sky-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
                FEED EVENTI ({reviewMatch.events.length})
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-900/90">
              {reviewTab === 'heatmap' && (
                <div className="space-y-4">
                  {/* Player Filter Selector for Heatmap */}
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-sky-400" />
                      Filtra Heatmap per Giocatore:
                    </span>
                    <select
                      value={reviewPlayerFilter ? reviewPlayerFilter.number : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setReviewPlayerFilter(null);
                        } else {
                          const found = DEFAULT_ROSTER.find(p => String(p.number) === val);
                          setReviewPlayerFilter(found || { number: val, name: `Giocatore #${val}` });
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-3 py-1.5 font-bold focus:outline-none focus:border-sky-400"
                    >
                      <option value="">Tutta la Squadra (Tutti i giocatori)</option>
                      {Array.from(new Set(reviewMatch.events.map(ev => String(ev.numero ?? ev.Numero ?? '')))).filter(Boolean).map(num => {
                        const p = DEFAULT_ROSTER.find(r => String(r.number) === String(num));
                        return (
                          <option key={num} value={num}>
                            #{num} - {p ? p.name : `Giocatore #${num}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <CourtPitchMap
                    selectedPlayer={reviewPlayerFilter}
                    selectedZoneKey={reviewSelectedZone}
                    onSelectZone={(zoneKey) => setReviewSelectedZone(zoneKey)}
                    events={reviewMatch.events}
                  />
                </div>
              )}

              {reviewTab === 'boxscore' && (
                <BoxScoreTable roster={DEFAULT_ROSTER} events={reviewMatch.events} />
              )}

              {reviewTab === 'timeline' && (
                <div className="glass-card p-4 border-slate-700/60 overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-2 px-2">QUARTO</th>
                        <th className="py-2 px-2">ORARIO</th>
                        <th className="py-2 px-2">GIOCATORE</th>
                        <th className="py-2 px-2">AZIONE</th>
                        <th className="py-2 px-2">ZONA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewMatch.events.map((ev, i) => (
                        <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                          <td className="py-2 px-2 font-mono text-sky-400 font-bold">Q{ev.quarto || ev.Quarto || '1'}</td>
                          <td className="py-2 px-2 text-slate-400 text-[11px]">{ev.timestamp || ev.Timestamp || '-'}</td>
                          <td className="py-2 px-2 font-bold text-slate-100">
                            #{ev.numero || ev.Numero} - {ev.giocatore || ev.Giocatore}
                          </td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              (ev.azione || ev.Azione || '').includes('Made') || (ev.azione || ev.Azione || '').includes('Fatto')
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : (ev.azione || ev.Azione || '').includes('Missed') || (ev.azione || ev.Azione || '').includes('Sbagliato')
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 text-slate-200'
                            }`}>
                              {ev.azione || ev.Azione}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-slate-300">{ev.zona || ev.Zona || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
