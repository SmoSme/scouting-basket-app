import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Archive as ArchiveIcon, Download, Trash2, RefreshCw, Trophy, Calendar, Hash, FileSpreadsheet } from 'lucide-react';

export default function Archive({ showToast }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

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
        const gameName = item.nome_partita || item.Nome_Partita || 'Partita Senza Nome';
        if (!grouped[gameName]) {
          grouped[gameName] = {
            name: gameName,
            events: [],
            createdAt: item.created_at || item.Timestamp || 'Data n.d.'
          };
        }
        grouped[gameName].events.push(item);
      });

      // Convert to array of match summaries
      const matchSummaries = Object.values(grouped).map(m => {
        const teamPts = m.events.reduce((acc, ev) => {
          if (ev.azione === '2PT Fatto' || ev.Azione === '2PT Fatto') return acc + 2;
          if (ev.azione === '3PT Fatto' || ev.Azione === '3PT Fatto') return acc + 3;
          if (ev.azione === 'TL Fatto' || ev.Azione === 'TL Fatto') return acc + 1;
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

      const headers = ['Timestamp', 'Quarto', 'Numero', 'Giocatore', 'Azione', 'Categoria', 'Zona', 'Nome_Partita'];
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
      
      if (showToast) showToast(`📥 Scaricato CSV per "${matchName}"`);
    } catch (err) {
      console.error('Download CSV error:', err);
      if (showToast) showToast(`❌ Errore durante il download del CSV`);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Delete Specific Game from Supabase
  const handleDeleteGame = async (matchName) => {
    if (!window.confirm(`Sei sicuro di voler eliminare DEFINITIVAMENTE la partita "${matchName}" e tutti i suoi eventi da Supabase?`)) {
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
      fetchArchive();
    } catch (err) {
      console.error('Delete match error:', err);
      if (showToast) showToast(`❌ Errore durante l'eliminazione della partita`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 max-w-6xl mx-auto w-full">
      {/* Archive Header */}
      <div className="flex items-center justify-between glass-card p-4 mb-4 border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
            <ArchiveIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-100 uppercase tracking-wider">
              ARCHIVIO PARTITE SUPABASE
            </h1>
            <p className="text-xs text-slate-400 font-semibold">
              Gestisci ed esporta le partite passate salvate in cloud
            </p>
          </div>
        </div>

        <button
          onClick={fetchArchive}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          AGGIORNA ARCHIVIO
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="glass-card p-12 text-center border-slate-800">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-sm">Caricamento archivio partite da Supabase...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card p-12 text-center border-slate-800">
          <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-200 font-black text-base uppercase mb-1">Nessuna Partita in Archivio</h3>
          <p className="text-slate-400 font-semibold text-xs max-w-md mx-auto">
            Non ci sono ancora gare salvate su Supabase. Avvia una nuova partita dal menu "Partita Live" per registrarti i primi dati!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((m, idx) => (
            <div key={idx} className="glass-card p-4 border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-black text-base text-amber-400 uppercase tracking-wider">
                    {m.name}
                  </h3>
                  <span className="bg-slate-900 border border-slate-700 text-slate-300 font-extrabold text-xs px-2.5 py-1 rounded">
                    {m.pts} PTS
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 font-semibold">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    {m.eventCount} Eventi Registrati
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    {new Date(m.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleDownloadCSV(m.name, m.events)}
                  disabled={actionLoading === m.name}
                  className="flex-1 flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 px-3 rounded-lg text-xs transition-all shadow"
                >
                  <Download className="w-4 h-4" />
                  SCARICA CSV
                </button>
                <button
                  onClick={() => handleDeleteGame(m.name)}
                  disabled={actionLoading === m.name}
                  className="flex items-center justify-center gap-1.5 bg-rose-700/80 hover:bg-rose-600 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  ELIMINA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
