/**
 * scripts/build_starters.js
 * 
 * Analizzatore Avanzato di Quintetti (Starter Frequency Analyzer).
 * Itera su TUTTE le partite giocate da ogni squadra, scarica il boxscore del Q1
 * e calcola la percentuale effettiva di volte in cui il giocatore è partito titolare.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'data');

const ENDPOINT = process.env.FIP_GRAPHQL_ENDPOINT || 'https://internal.nbn23.app/graphql';
const AUTH_TOKEN = process.env.FIP_AUTH_TOKEN;
const PROJECT_KEY = process.env.FIP_PROJECT_KEY || 'fip_rcm';

const headers = {
  'Host': 'internal.nbn23.app',
  'x-package-name': process.env.FIP_PACKAGE_NAME || 'com.nbn23.fipapp',
  'Accept': '*/*',
  'x-user-premium': 'true',
  'Authorization': AUTH_TOKEN ? (AUTH_TOKEN.startsWith('Bearer ') ? AUTH_TOKEN : `Bearer ${AUTH_TOKEN}`) : '',
  'Accept-Language': 'it-IT,it;q=0.9',
  'Content-Type': 'application/json',
  'User-Agent': 'com.nbn23.fipapp',
  'x-device-id': 'EC65ADBA-ECE4-5630-8A5B-ED445F854A56',
  'Connection': 'keep-alive',
  'x-package-version': '2.14.0'
};

const QUERY_MATCH_BOXSCORE = `
query GetMatchBoxscore($projectKey: String!, $matchFid: String!) {
  matchBy(projectKey: $projectKey, fid: $matchFid) {
    fid
    boxscore(periods: [1]) {
      homeTeam {
        team { fid name }
        players {
          player { fid name lastName number }
          stats { timePlayed points }
        }
      }
      awayTeam {
        team { fid name }
        players {
          player { fid name lastName number }
          stats { timePlayed points }
        }
      }
    }
  }
}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buildStarterFrequencies() {
  console.log('=====================================================');
  console.log('🏀 FIP STARTER FREQUENCY PIPELINE (ALL MATCHES)');
  console.log('=====================================================');

  const trendsPath = path.join(DATA_DIR, 'team_trends.json');
  const startersPath = path.join(DATA_DIR, 'team_starters.json');

  if (!fs.existsSync(trendsPath)) {
    console.error('❌ Errore: team_trends.json non trovato. Esegui prima build_trends.js');
    process.exit(1);
  }

  const trends = JSON.parse(fs.readFileSync(trendsPath, 'utf-8'));
  const allTeamStarters = {};
  const teamFids = Object.keys(trends);

  console.log(`Analisi delle frequenze di quintetto per ${teamFids.length} squadre...\n`);

  for (let i = 0; i < teamFids.length; i++) {
    const teamFid = teamFids[i];
    const teamData = trends[teamFid];
    const matchLog = teamData.log || [];

    if (matchLog.length === 0) {
      console.log(`[${i+1}/${teamFids.length}] Team FID ${teamFid}: Nessuna partita disputata.`);
      continue;
    }

    console.log(`[${i+1}/${teamFids.length}] Elaborazione di ${matchLog.length} partite per Team FID ${teamFid}...`);

    const playerStarterCounts = {};
    let totalAnalyzedMatches = 0;

    for (const matchItem of matchLog) {
      const matchFid = matchItem.matchFid;
      if (!matchFid) continue;

      // Pausa di sicurezza tra una partita e l'altra per non sovraccaricare
      await sleep(1200);

      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            operationName: 'GetMatchBoxscore',
            query: QUERY_MATCH_BOXSCORE,
            variables: {
              projectKey: PROJECT_KEY,
              matchFid: String(matchFid)
            }
          })
        });

        if (!response.ok) continue;
        const json = await response.json();
        const matchObj = json.data?.matchBy?.[0];
        const boxscore = matchObj?.boxscore;

        if (!boxscore) continue;

        const isHome = boxscore.homeTeam?.team?.fid === teamFid;
        const teamBox = isHome ? boxscore.homeTeam : boxscore.awayTeam;
        const rawPlayers = teamBox?.players || [];

        if (rawPlayers.length === 0) continue;

        // Ordiniamo per minuti giocati nel Q1 e prendiamo i primi 5 come titolari effettivi di quel match
        const sortedByTime = rawPlayers
          .filter(p => p && p.player)
          .sort((a, b) => (b.stats?.timePlayed || 0) - (a.stats?.timePlayed || 0));

        const top5 = sortedByTime.slice(0, 5);
        totalAnalyzedMatches++;

        for (const p of top5) {
          const pFid = p.player.fid;
          if (!playerStarterCounts[pFid]) {
            playerStarterCounts[pFid] = {
              fid: pFid,
              name: p.player.name,
              lastName: p.player.lastName,
              number: p.player.number,
              startsCount: 0
            };
          }
          playerStarterCounts[pFid].startsCount++;
        }

      } catch (err) {
        // Ignoriamo eventuali errori singoli per non bloccare l'intera pipeline
      }
    }

    // Convertiamo i conteggi in percentuali stabili basate sul totale delle partite analizzate
    const structuredStarters = Object.values(playerStarterCounts).map(player => ({
      ...player,
      startPercentage: totalAnalyzedMatches > 0 
        ? Math.round((player.startsCount / totalAnalyzedMatches) * 100) 
        : 0,
      totalMatchesChecked: totalAnalyzedMatches
    })).sort((a, b) => b.startPercentage - a.startsCount); // Ordinati per frequenza

    allTeamStarters[teamFid] = {
      totalMatches: totalAnalyzedMatches,
      players: structuredStarters
    };

    console.log(`  ✅ Analizzate ${totalAnalyzedMatches} partite. Calcolate le frequenze quintetto.`);
  }

  fs.writeFileSync(startersPath, JSON.stringify(allTeamStarters, null, 2), 'utf-8');
  console.log('\n=====================================================');
  console.log(`🎉 SUCCESSO! Frequenze quintetti salvate in public/data/team_starters.json`);
  console.log('=====================================================\n');
}

buildStarterFrequencies();