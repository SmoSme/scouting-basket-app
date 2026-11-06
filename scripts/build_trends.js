/**
 * scripts/build_trends.js
 * 
 * Pipeline di Advanced Scouting.
 * Legge le squadre dal file standings, interroga la FIP per ogni squadra,
 * calcola i trend (Casa/Trasferta, Quarti, Striscia) e salva in un JSON.
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
const COMPETITION_ID = process.env.FIP_COMPETITION_ID || '14544';
const BBA_TEAM_ID = process.env.BBA_TEAM_ID || '211634';

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

const QUERY_TEAM_MATCHES = `
query GetTeamMatches($projectKey: String!, $competitionFid: String!, $teamFid: String!) {
  teamMatch(projectKey: $projectKey, competitionFid: $competitionFid, teamFid: $teamFid) {
    fid
    date
    status
    roundName
    homeTeam { fid name }
    awayTeam { fid name }
    scores {
      total { homeScore awayScore }
      partials { homeScore awayScore period }
    }
  }
}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buildTrends() {
  console.log('=====================================================');
  console.log('📈 FIP ADVANCED TRENDS PIPELINE');
  console.log('=====================================================');

  const standingsPath = path.join(DATA_DIR, 'league_standings.json');
  const trendsPath = path.join(DATA_DIR, 'team_trends.json');

  if (!fs.existsSync(standingsPath)) {
    console.error('❌ Errore: league_standings.json non trovato. Esegui prima build_league.js');
    process.exit(1);
  }

  const standings = JSON.parse(fs.readFileSync(standingsPath, 'utf-8'));
  // Analyze ALL teams including BBA for complete league & self-scouting
  const teamsToAnalyze = standings;
  
  console.log(`Trovate ${teamsToAnalyze.length} squadre da analizzare (incluso BBA).\n`);

  const allTrends = {};

  for (let i = 0; i < teamsToAnalyze.length; i++) {
    const team = teamsToAnalyze[i];
    console.log(`[${i+1}/${teamsToAnalyze.length}] Calcolo trend per: ${team.name} (FID: ${team.fid})...`);
    
    // Politeness delay di 1.5 secondi tra una squadra e l'altra per evitare blocchi
    if (i > 0) await sleep(1500);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operationName: 'GetTeamMatches',
          query: QUERY_TEAM_MATCHES,
          variables: {
            projectKey: PROJECT_KEY,
            competitionFid: COMPETITION_ID,
            teamFid: team.fid
          }
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const json = await response.json();
      const matches = json.data?.teamMatch || [];
      const closedMatches = matches.filter(m => m.status === 'CLOSED').sort((a, b) => new Date(b.date) - new Date(a.date));

      const stats = {
        global: { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 },
        home: { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 },
        away: { games: 0, pointsScored: 0, pointsConceded: 0, wins: 0, losses: 0 },
        quarters: {
          Q1: { scored: 0, conceded: 0 },
          Q2: { scored: 0, conceded: 0 },
          Q3: { scored: 0, conceded: 0 },
          Q4: { scored: 0, conceded: 0 }
        },
        streak: [], // 'V' o 'P'
        log: [] // Array delle partite giocate
      };

      for (const match of closedMatches) {
        const isHome = match.homeTeam.fid === team.fid;
        const scores = match.scores?.total;
        if (!scores) continue;

        const scored = isHome ? scores.homeScore : scores.awayScore;
        const conceded = isHome ? scores.awayScore : scores.homeScore;
        const isWin = scored > conceded;

        // Log della singola partita
        stats.log.push({
          matchFid: match.fid,
          date: match.date,
          round: match.roundName || '',
          homeTeam: match.homeTeam.name,
          awayTeam: match.awayTeam.name,
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          isWin: isWin,
          isHomeGame: isHome,
          partials: match.scores?.partials || []
        });

        // Global
        stats.global.games++;
        stats.global.pointsScored += scored;
        stats.global.pointsConceded += conceded;
        isWin ? stats.global.wins++ : stats.global.losses++;

        // Striscia
        if (stats.streak.length < 5) stats.streak.push(isWin ? 'V' : 'P');

        // Casa / Trasferta
        const loc = isHome ? stats.home : stats.away;
        loc.games++;
        loc.pointsScored += scored;
        loc.pointsConceded += conceded;
        isWin ? loc.wins++ : loc.losses++;

        // Quarti
        const partials = match.scores?.partials || [];
        for (const p of partials) {
          const qName = `Q${p.period}`;
          if (stats.quarters[qName]) {
            stats.quarters[qName].scored += isHome ? p.homeScore : p.awayScore;
            stats.quarters[qName].conceded += isHome ? p.awayScore : p.homeScore;
          }
        }
      }

      // Inverto la striscia per avere la più antica a sinistra e la più recente a destra
      stats.streak = stats.streak.reverse();
      
      // Calcolo le medie definitive dei quarti per non farle calcolare a React
      const g = stats.global.games;
      const quarterAverages = {};
      if (g > 0) {
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
          quarterAverages[q] = {
            scoredAvg: Number((stats.quarters[q].scored / g).toFixed(1)),
            concededAvg: Number((stats.quarters[q].conceded / g).toFixed(1)),
            diff: Number(((stats.quarters[q].scored / g) - (stats.quarters[q].conceded / g)).toFixed(1))
          };
        });
      }
      stats.quarterAverages = quarterAverages;

      allTrends[team.fid] = stats;
      console.log(`  ✅ Elaborate ${g} partite.`);

    } catch (e) {
      console.error(`  ❌ Errore per ${team.name}:`, e.message);
    }
  }

  fs.writeFileSync(trendsPath, JSON.stringify(allTrends, null, 2), 'utf-8');
  console.log('\n=====================================================');
  console.log(`🎉 COMPLETO! Trend di ${Object.keys(allTrends).length} squadre salvati in public/data/team_trends.json`);
  console.log('=====================================================\n');
}

buildTrends();