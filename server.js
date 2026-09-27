import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8501;

app.use(cors());
app.use(express.json());

const CSV_FILE = path.join(__dirname, 'events_log.csv');
const HEADERS = ['Timestamp', 'Quarto', 'Numero', 'Giocatore', 'Azione', 'Categoria', 'Zona'];

// Initialize CSV File
function initCSV() {
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, HEADERS.join(',') + '\n', 'utf8');
  }
}

initCSV();

// Helper to parse CSV to JSON
function readCSV() {
  initCSV();
  const fileContent = fs.readFileSync(CSV_FILE, 'utf8').trim();
  if (!fileContent) return [];
  
  const lines = fileContent.split('\n');
  if (lines.length <= 1) return [];
  
  const events = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Naive CSV split handling
    const parts = line.split(',');
    if (parts.length >= 7) {
      events.push({
        id: i,
        Timestamp: parts[0],
        Quarto: parts[1],
        Numero: parts[2],
        Giocatore: parts[3],
        Azione: parts[4],
        Categoria: parts[5],
        Zona: parts[6]
      });
    }
  }
  return events;
}

// ---------------------------------------------------------
// REST API Endpoints
// ---------------------------------------------------------

// GET /api/events
app.get('/api/events', (req, res) => {
  try {
    const events = readCSV();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read events' });
  }
});

// POST /api/events
app.post('/api/events', (req, res) => {
  try {
    const { quarto, numero, giocatore, azione, categoria, zona } = req.body;
    
    const timestamp = new Date().toLocaleTimeString('it-IT', { hour12: false });
    const formattedZona = zona || 'Generica';
    const row = `${timestamp},${quarto},${numero},${giocatore},${azione},${categoria},${formattedZona}\n`;
    
    fs.appendFileSync(CSV_FILE, row, 'utf8');
    
    const newEvent = {
      Timestamp: timestamp,
      Quarto: quarto,
      Numero: String(numero),
      Giocatore: giocatore,
      Azione: azione,
      Categoria: categoria,
      Zona: formattedZona
    };
    
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to append event' });
  }
});

// DELETE /api/events/last (Undo)
app.delete('/api/events/last', (req, res) => {
  try {
    const fileContent = fs.readFileSync(CSV_FILE, 'utf8').trim();
    if (!fileContent) return res.status(404).json({ error: 'No events to undo' });
    
    const lines = fileContent.split('\n');
    if (lines.length <= 1) {
      return res.status(404).json({ error: 'No events to undo' });
    }
    
    const removedLine = lines.pop();
    fs.writeFileSync(CSV_FILE, lines.join('\n') + '\n', 'utf8');
    
    const parts = removedLine.split(',');
    res.json({
      removed: {
        Timestamp: parts[0],
        Quarto: parts[1],
        Numero: parts[2],
        Giocatore: parts[3],
        Azione: parts[4]
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to undo event' });
  }
});

// POST /api/reset
app.post('/api/reset', (req, res) => {
  try {
    fs.writeFileSync(CSV_FILE, HEADERS.join(',') + '\n', 'utf8');
    res.json({ message: 'Game data reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset CSV' });
  }
});

// GET /api/export-csv
app.get('/api/export-csv', (req, res) => {
  initCSV();
  res.download(CSV_FILE, `basket_stats_${Date.now()}.csv`);
});

// Serve production static assets if dist exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏀 Courtside Full-Stack API Server listening on port ${PORT}`);
});
