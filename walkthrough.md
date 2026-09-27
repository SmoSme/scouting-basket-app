# Walkthrough - Game Sessions, React Router & Supabase Match Archive

L'applicazione **Courtside Pro Basketball Analytics** è stata estesa introducendo il concetto di **Sessione di Partita (`nome_partita`)**, la navigazione multi-pagina tramite **React Router**, la **Pagina Archivio** per gestire le partite passate su Supabase ed il file di configurazione **`vercel.json`** per evitare errori 404 su Vercel.

---

## 📁 Nuovi File e Componenti Creati

- **[vercel.json](file:///Volumes/Crucial/projects/BBA%20Statistics%20App/vercel.json)**: Regola di rewrite SPA per Vercel su `/index.html`.
- **[src/components/Navbar.jsx](file:///Volumes/Crucial/projects/BBA%20Statistics%20App/src/components/Navbar.jsx)**: Menu di navigazione globale con link `'Partita Live'` (`/`) e `'Archivio'` (`/archive`).
- **[src/pages/LiveGame.jsx](file:///Volumes/Crucial/projects/BBA%20Statistics%20App/src/pages/LiveGame.jsx)**: Dashboard di rilevamento live con modale d'avvio sessione partita.
- **[src/pages/Archive.jsx](file:///Volumes/Crucial/projects/BBA%20Statistics%20App/src/pages/Archive.jsx)**: Pagina archivio con query Supabase, scaricamento CSV per singola partita ed eliminazione partita.
- **[src/App.jsx](file:///Volumes/Crucial/projects/BBA%20Statistics%20App/src/App.jsx)**: Rotte React Router e gestione dello stato globale `gameSession`.

---

## 🏀 1. Gestione Sessione di Partita (`nome_partita`)

- All'avvio dell'app (o cliccando sul badge *PARTITA* nella navbar), viene mostrata una modale per inserire il nome della gara (es. *"Olimpia vs Virtus - 27/09"*).
- Il nome viene salvato nello stato globale ed in `localStorage` (`current_game_session`).
- **Ogni azione registrata** (sia online su Supabase che nella coda offline) include automaticamente la colonna `nome_partita`.

---

## 📂 2. Pagina Archivio & Azioni (`/archive`)

Accedendo alla pagina **Archivio**:
1. Viene eseguita una query `.select('*')` su Supabase per raggruppare tutte le partite passate registrate.
2. Per ogni partita trovata vengono mostrati:
   - Nome della partita
   - Punteggio totale di squadra e numero di eventi registrati
   - Data di creazione
3. **Pulsante 'Scarica CSV'**: Filtra solo gli eventi di quella specifica partita e genera dinamicamente un file `.csv` scaricabile sul tablet o PC (`Nome_Partita_stats.csv`).
4. **Pulsante 'Elimina Partita'**: Esegue `.from('scouting_log').delete().eq('nome_partita', matchName)` su Supabase cancellando definitivamente tutte le righe associate dopo conferma.

---

## 🌐 3. Prevenzione Errori 404 su Vercel (`vercel.json`)

È stato aggiunto il file `vercel.json` nella root del progetto:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Questo garantisce che quando ricarichi la pagina direttamente da un percorso interno (come `https://tuo-progetto.vercel.app/archive`), Vercel non restituisca errore 404 ma indirizzi la richiesta al client React Router.

---

## 🚀 Avvio Produzione

```bash
# Avvio del server Node.js Express (porta 8501)
npm start
```
L'app sarà visibile all'indirizzo `http://<IP_LOCALE>:8501`.
