import React, { useState } from 'react';
import { 
  X, Info, AlertTriangle, Shield, TrendingUp, CheckCircle, 
  HelpCircle, BookOpen, ChevronRight, Sparkles 
} from 'lucide-react';

export const METRIC_GUIDES = {
  ortg: {
    key: 'ortg',
    title: 'ORTG — Offensive Rating (Efficienza Offensiva)',
    formula: '(Punti Totali / Possessi Stimati) × 100',
    description: 'Misura la reale produttività offensiva della squadra parametrata su 100 possessi di palla. È la metrica madre dell\'analitica moderna perché elimina la distorsione del ritmo di gioco (Pace): una squadra può segnare 95 punti giocando a ritmi folli ma con scarsa efficienza, oppure segnare 75 punti a metà campo con un\'efficienza chirurgica.',
    benchmarks: [
      { level: 'Élite', range: '> 112', color: 'emerald', desc: 'Attacco travolgente, esecuzione tattica e selezione di tiro impeccabili' },
      { level: 'Buono / In Linea', range: '100 – 111', color: 'amber', desc: 'Produzione offensiva standard nella media del campionato' },
      { level: 'Critico / Basso', range: '< 98', color: 'rose', desc: 'Attacco sterile, troppi tiri contestati o possessi gettati senza costruire' }
    ],
    coachingTip: 'Se l\'ORTG è sotto 98, la squadra sta sprecando possessi con conclusioni premature o forzate. Chiama giochi a due (Stagger/Ghost) per disorganizzare i cambi difensivi o ordina di attaccare il ferro per andare in lunetta.',
    warning: 'CALCOLO DEI POSSESSI: I tiri liberi segnati e mancati vengono conteggiati regolarmente. I falli personali non sono attualmente annotati, ma il Pace e l\'ORTG restano accurati con uno scarto inferiore al 5%.'
  },
  possessions: {
    key: 'possessions',
    title: 'Est. Possessions — Pace (Ritmo di Gioco)',
    formula: 'FGA + 0.44 × FTA - OREB + TOV',
    description: 'Numero totale stimato di possessi giocati nella gara (Formula ufficiale Dean Oliver). Ogni possesso termina sempre con un tiro dal campo (FGA), con viaggi in lunetta (0.44 × FTA) o con una palla persa (TOV). I rimbalzi d\'attacco (OREB) prolungano il possesso senza incrementarne il conteggio.',
    benchmarks: [
      { level: 'Ritmo Molto Alto (Uptempo)', range: '> 78 poss', color: 'emerald', desc: 'Gara a ritmi altissimi, forte spinta in contropiede e transizione' },
      { level: 'Ritmo Medio / Standard', range: '68 – 77 poss', color: 'amber', desc: 'Velocità controllata tipica del basket europeo/FIBA' },
      { level: 'Ritmo Lento / Difensivo', range: '< 67 poss', color: 'slate', desc: 'Partita fisica, difese aggressive, possessi lunghi a metà campo' }
    ],
    coachingTip: 'Confronta il Pace con l\'identità della tua squadra: se ami correre in campo aperto ma registri meno di 68 possessi, stai subendo il piano gara avversario.',
    warning: 'I tiri liberi (FT Made/Missed) e i rimbalzi offensivi vengono conteggiati accuratamente.'
  },
  efg: {
    key: 'efg',
    title: 'eFG% — Effective Field Goal % (Tiro Effettivo)',
    formula: '((FGM + 0.5 × 3PM) / FGA) × 100',
    description: 'Percentuale dal campo effettiva che assegna il 50% di peso in più ai canestri da 3 punti rispetto a quelli da 2 punti. Risolve il limite del FG% classico: segnare 4 triple su 10 tentativi produce 12 punti, esattamente come fare 6 su 10 da due! Per l\'eFG%, quel 4/10 da tre vale un formidabile 60% effettivo.',
    benchmarks: [
      { level: 'Élite', range: '> 54%', color: 'emerald', desc: 'Selezione di tiro eccellente e precisione mortifera dall\'arco' },
      { level: 'Buono / Medio', range: '48% – 53%', color: 'amber', desc: 'Produzione di tiro equilibrata e solida' },
      { level: 'Critico', range: '< 46%', color: 'rose', desc: 'Tiri forzati o pessime percentuali da 3 punti' }
    ],
    coachingTip: 'Nello scouting moderno, chi vince la battaglia dell\'eFG% vince la partita nell\'82% dei casi. Privilegia sempre conclusioni al ferro ad alta percentuale o triple piedi per terra aperte.',
    warning: 'METRICA 100% AFFIDABILE: Dipende esclusivamente da canestri fatti (2P/3P) e tiri totali tentati. È totalmente indipendente da falli e assist!'
  },
  ts: {
    key: 'ts',
    title: 'TS% — True Shooting % (Efficienza Reale Totale)',
    formula: '(Punti Totali) / [2 × (FGA + 0.44 × FTA)] × 100',
    description: 'La metrica assoluta di rendimento al tiro. Calcola quanti punti effettivi produce un giocatore o la squadra per ogni singolo tentativo di conclusione, combinando insieme tiri da 2, tiri da 3 e gite in lunetta con i tiri liberi.',
    benchmarks: [
      { level: 'Élite', range: '> 58%', color: 'emerald', desc: 'Massima letalità realizzativa su ogni fronte' },
      { level: 'Solido', range: '50% – 57%', color: 'amber', desc: 'Buona resa e monetizzazione dei tiri liberi' },
      { level: 'Basso', range: '< 48%', color: 'rose', desc: 'Troppi possessi sprecati senza monetizzare' }
    ],
    coachingTip: 'Se il TS% della squadra è significativamente superiore all\'eFG%, significa che la squadra sta vincendo la partita guadagnando punti facili ed efficienti in lunetta.',
    warning: 'I tiri liberi (FT) sono inclusi regolarmente nel calcolo. Se in una frazione non vengono scoccati tiri liberi, il TS% corrisponde matematicamente all\'eFG%.'
  },
  asttov: {
    key: 'asttov',
    title: 'AST / TOV Ratio (Rapporto Assist / Perse)',
    formula: 'Assist Totali / Palle Perse Totali',
    description: 'Il termometro della disciplina tattica, della circolazione di palla e della lucidità mentale. Misura quanti canestri costruiti e assistiti produce la squadra per ogni pallone buttato via.',
    benchmarks: [
      { level: 'Élite', range: '> 2.0', color: 'emerald', desc: 'Attacco corale, passaggi puntuali e massima protezione del pallone' },
      { level: 'Standard', range: '1.2 – 1.9', color: 'amber', desc: 'Equilibrio nella media tra creazione e sbavature' },
      { level: 'Allarme', range: '< 1.0', color: 'rose', desc: 'Più palle perse che assist: attacco fermo, isolamenti forzati o passaggi nel traffico' }
    ],
    coachingTip: 'Se il rapporto scende sotto 1.0, chiama timeout: la squadra sta giocando da sola. Ristabilisci le spaziature perimetrali e ordina un extra-pass obbligatorio prima del tiro.',
    warning: 'ATTENZIONE: Se gli Assist non sono stati registrati dallo scout durante la partita, questo rapporto risulterà pari a 0 o non affidabile. Le palle perse (TOV) sono invece tracciate regolarmente.'
  },
  pir: {
    key: 'pir',
    title: 'FIBA PIR (Performance Index Rating)',
    formula: '(PTS + REB + AST + STL + BLK + FD) - (FG_Miss + FT_Miss + TOV + PF + BLKA)',
    description: 'La valutazione statistica ufficiale adottata da FIBA ed EuroLeague. Assegna +1 per ogni azione positiva (punti, rimbalzi, assist, recuperi, stoppate, falli subiti) e penalizza di -1 ogni errore (tiri sbagliati, liberi falliti, palle perse, falli commessi, stoppate subite).',
    benchmarks: [
      { level: 'Squadra Dominante', range: '> 90 PIR', color: 'emerald', desc: 'Partita di altissima qualità tecnica e pochissime sbavature' },
      { level: 'Partita Equilibrata', range: '65 – 89 PIR', color: 'amber', desc: 'Rendimento solido e combattuto' },
      { level: 'Prestazione Negativa', range: '< 60 PIR', color: 'rose', desc: 'Troppi errori al tiro e palle perse rispetto alla produzione' }
    ],
    coachingTip: 'Per i singoli giocatori: PIR > 15 = protagonista assoluto della gara; PIR > 20 = prestazione da MVP di giornata.',
    warning: 'ATTENZIONE: I Falli Commessi (PF) e Subiti (FD) non sono attualmente registrati e gli Assist potrebbero non essere stati segnati. Il PIR riflette fedelmente canestri, errori, rimbalzi e palle perse, ma risulterà privo delle componenti fallo.'
  },
  gamescore: {
    key: 'gamescore',
    title: 'Hollinger GameScore (GS)',
    formula: 'PTS + 0.4×FGM - 0.7×FGA - 0.4×(FTA-FTM) + 0.7×OREB + 0.3×DREB + STL + 0.7×AST + 0.7×BLK - 0.4×PF - TOV',
    description: 'Indice di rendimento sintetico inventato da John Hollinger (NBA/ESPN). A differenza del semplice PIR FIBA, il GameScore pesa specificamente ogni singola voce con un coefficiente matematico avanzato per riflettere il valore reale sul risultato.',
    benchmarks: [
      { level: 'Prestazione MVP', range: '> 18', color: 'emerald', desc: 'Dominatore del parquet su entrambe le metà campo' },
      { level: 'Ottima Partita', range: '12 – 17', color: 'amber', desc: 'Contributo decisivo ed efficiente' },
      { level: 'Partita Discreta / Opaca', range: '< 8', color: 'rose', desc: 'Poco impatto o percentuale di tiro deficitaria' }
    ],
    coachingTip: 'Il GameScore è perfetto per identificare i giocatori più concreti della gara aldilà del semplice tabellino dei punti segnati.',
    warning: 'ATTENZIONE: Senza i falli commessi (PF) e gli assist registrati, il calcolo non include queste due variabili ma rimane pienamente indicativo per volumi di tiro, rimbalzi e palle perse.'
  },
  fourfactors: {
    key: 'fourfactors',
    title: 'Dean Oliver\'s Four Factors (I 4 Fattori della Vittoria)',
    formula: 'Shooting (40%) + Turnovers (25%) + Rebounding (20%) + Free Throws (15%)',
    description: 'Il modello scientifico di Dean Oliver dimostra che il risultato di qualsiasi partita di basket è deciso da 4 fattori fondamentali: 1) Qualità del tiro (eFG%), 2) Cura della palla (TOV%), 3) Rimbalzo d\'attacco (OREB%), 4) Aggressività verso il ferro e lunetta (FTR).',
    benchmarks: [
      { level: 'Shooting eFG%', range: '> 52%', color: 'emerald', desc: 'Fattore 1 (peso 40%): Selezione di tiro' },
      { level: 'Turnover Rate', range: '< 14%', color: 'emerald', desc: 'Fattore 2 (peso 25%): Cura del possesso' },
      { level: 'OREB Share', range: '> 30%', color: 'emerald', desc: 'Fattore 3 (peso 20%): Seconde opportunità' },
      { level: 'Free Throw Rate', range: '> 0.25', color: 'emerald', desc: 'Fattore 4 (peso 15%): Pressione al ferro e falli' }
    ],
    coachingTip: 'Regola d\'oro dello scouting: la squadra che vince almeno 3 dei 4 fattori vince la partita nel 94% dei casi.',
    warning: 'Il Free Throw Rate misura FTA/FGA. I tiri liberi tirati sono conteggiati quando registrati. I falli non sono tracciati.'
  },
  pps: {
    key: 'pps',
    title: 'PPS — Points Per Shot (Punti per Tentativo)',
    formula: '(Canestri Fatti × Valore 2 o 3) / Tiri Tentati',
    description: 'Il valore analitico fondamentale di ogni singola mattonella del campo. Indica il valore atteso di un tiro scoccato da quella determinata zona: permette di distinguere i tiri ad alto rendimento (al ferro o triple ad alta percentuale) dai tiri a basso rendimento (es. lunghi tiri contestati dalla media distanza).',
    benchmarks: [
      { level: 'Zona ad Alta Resa (HOT)', range: '≥ 1.15 PPS', color: 'emerald', desc: 'Tiro d\'oro: area sotto canestro (Paint) o triple piedi per terra aperte' },
      { level: 'Zona Solida / Accettabile', range: '0.95 – 1.14 PPS', color: 'amber', desc: 'Rendimento medio standard di campionato' },
      { level: 'Zona a Bassa Resa (COLD)', range: '< 0.85 PPS', color: 'rose', desc: 'Tiro statisticamente inefficiente (spesso mid-range contestato)' }
    ],
    coachingTip: 'Usa la tabella PPS per indirizzare il piano d\'attacco: disegna giochi per portare i tiratori nelle zone con PPS > 1.15 ed elimina i tiri dalle zone fredde.',
    warning: 'METRICA 100% AFFIDABILE: Calcolata matematicamente direttamente sui canestri ed errori registrati sulle 9 zone del campo.'
  }
};

export default function MetricGuideModal({ activeKey = 'ortg', onClose, onSelectMetric }) {
  const [currentKey, setCurrentKey] = useState(activeKey || 'ortg');

  const guide = METRIC_GUIDES[currentKey] || METRIC_GUIDES.ortg;

  const handleSelect = (k) => {
    setCurrentKey(k);
    if (onSelectMetric) onSelectMetric(k);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between flex-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center flex-none">
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                GUIDA METRICHE & DECISION BENCHMARK
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Significato tattico, scale di valore ed affidabilità scouting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
            title="Chiudi Guida"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metric Quick Switcher Horizontal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 overflow-x-auto no-scrollbar flex-none">
          {Object.values(METRIC_GUIDES).map(m => {
            const isSelected = m.key === currentKey;
            return (
              <button
                key={m.key}
                onClick={() => handleSelect(m.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 flex-none border ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black scale-105'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {m.key === 'ortg' && <span>ORTG</span>}
                {m.key === 'possessions' && <span>Pace</span>}
                {m.key === 'efg' && <span>eFG%</span>}
                {m.key === 'ts' && <span>TS%</span>}
                {m.key === 'asttov' && <span>AST/TOV</span>}
                {m.key === 'pir' && <span>PIR</span>}
                {m.key === 'gamescore' && <span>GameScore</span>}
                {m.key === 'fourfactors' && <span>Four Factors</span>}
                {m.key === 'pps' && <span>PPS</span>}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Title & Formula Badge */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
              <h4 className="text-base font-black text-sky-400">
                {guide.title}
              </h4>
            </div>
            <div className="inline-block bg-slate-900 border border-slate-700/80 text-amber-400 font-mono font-bold text-xs px-2.5 py-1 rounded-md">
              Formula: {guide.formula}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-2.5 font-medium">
              {guide.description}
            </p>
          </div>

          {/* Decision Benchmarks (Semaforo di Valore) */}
          <div className="space-y-2">
            <div className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>VALORI DI RIFERIMENTO DECISIONALI (BENCHMARK):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {guide.benchmarks.map((b, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        b.color === 'emerald' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        b.color === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        b.color === 'rose' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {b.level}
                      </span>
                    </div>
                    <div className="font-mono text-lg font-black text-slate-100 my-1">
                      {b.range}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium border-t border-slate-850 pt-1.5 mt-1">
                    {b.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coaching Takeaway / Consiglio per l'allenatore */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>INDICAZIONE TATTICA PER IL COACHING STAFF:</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {guide.coachingTip}
            </p>
          </div>

          {/* Data Warning Alert (Affidabilità Tracciamento Dati) */}
          <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>AVVISO AFFIDABILITÀ TRACCIAMENTO DATI:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {guide.warning}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-none">
          <span className="text-[11px] text-slate-500 font-medium">
            BBA Courtside Scouting Intelligence Engine
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors border border-slate-700"
          >
            CHIUDI
          </button>
        </div>
      </div>
    </div>
  );
}
