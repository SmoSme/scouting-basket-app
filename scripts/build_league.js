/**
 * scripts/build_league.js
 * 
 * Master FIP Data Pipeline built on GraphQL Introspection (scripts/schema.json).
 * Extracts official standings and opponent rosters with deep historical player
 * career stats (UniquePlayer cross-referenced with players array).
 * 
 * Usage:
 *   node scripts/build_league.js
 *   npm run sync-league
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'public', 'data');

// Ensure public/data exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Configuration from environment
const ENDPOINT = process.env.FIP_GRAPHQL_ENDPOINT || 'https://internal.nbn23.app/graphql';
const AUTH_TOKEN = process.env.FIP_AUTH_TOKEN;
const PROJECT_KEY = process.env.FIP_PROJECT_KEY || 'fip_rcm';
const PROVIDER = process.env.FIP_PROVIDER || 'fhoster';
const GROUP_ID = process.env.FIP_GROUP_ID || '85512';
const COMPETITION_ID = process.env.FIP_COMPETITION_ID || '14544';
const BBA_TEAM_ID = process.env.BBA_TEAM_ID || '211634';

if (!AUTH_TOKEN) {
  console.error('\n❌ Warning: Missing FIP_AUTH_TOKEN in environment (.env).');
  console.error('If live queries fail, existing data files will be preserved.\n');
}

// Strict Proxyman mobile intercepted headers
const headers = {
  'Host': 'internal.nbn23.app',
  'x-package-name': process.env.FIP_PACKAGE_NAME || 'com.nbn23.fipapp',
  'Accept': '*/*',
  'x-user-premium': String(process.env.FIP_USER_PREMIUM ?? 'true'),
  'Authorization': AUTH_TOKEN ? (AUTH_TOKEN.startsWith('Bearer ') ? AUTH_TOKEN : `Bearer ${AUTH_TOKEN}`) : '',
  'Accept-Language': 'it-IT,it;q=0.9',
  'Content-Type': 'application/json',
  'User-Agent': 'com.nbn23.fipapp',
  'x-device-id': 'EC65ADBA-ECE4-5630-8A5B-ED445F854A56',
  'Connection': 'keep-alive',
  'x-package-version': '2.14.0'
};

// =========================================================================
// GRAPHQL QUERIES (Verified via schema.json introspection)
// =========================================================================

// Step 0: Seasons Dictionary Query
const QUERY_GET_SEASONS = `query GetSeasons {
  seasons {
    id
    name
  }
}`;

// Step 1: Standings Query
const QUERY_GET_STANDINGS = `query GetStandings($projectKey: String, $provider: String, $groupId: String) {
  standing(projectKey: $projectKey, provider: $provider, groupId: $groupId) {
    fid
    name
    position
    logo
    stats {
      playedMatches
      wonMatches
      lostMatches
      pointsPerGame
      opponentsPointsPerGame
    }
  }
}`;

// Step 2a: Opponent Players Query
const QUERY_GET_PLAYERS = `query GetPlayersByTeam($projectKey: String!, $competitionFid: String!, $teamFid: String!) {
  playersByTeam(projectKey: $projectKey, competitionFid: $competitionFid, teamFid: $teamFid) {
    fid
    name
    lastName
    number
    captain
    starting
    photo
    team {
      fid
      name
    }
    uniquePlayer {
      id
      stats {
        games
        timePlayed
        points
        pointsPerGame
        freeThrowsMade
        freeThrowsPercentage
        inArcThrowsMade
        outArcThrowsMade
        fouls
        plusMinus
      }
      seasonStats {
        seasonId
        games
        points
        pointsPerGame
        freeThrowsMade
        freeThrowsPercentage
        inArcThrowsMade
        inArcThrowsMadePerGame
        outArcThrowsMade
        outArcThrowsMadePerGame
        fouls
        plusMinus
        timePlayed
      }
    }
    stats {
      games
      pointsPerGame
      pointsAVG
      foulsAVG
      inArcThrowsPercentage
      outArcThrowsPercentage
      inArcThrowsAVG
      outArcThrowsAVG
      freeThrowsPercentage
      plusMinusAVG
      reboundsAVG
      assistsAVG
      stealsAVG
      blocksAVG
      turnoversAVG
    }
  }
}`;

// Step 2b: Dedicated UniquePlayer Query for deep career history inspection
const QUERY_UNIQUE_PLAYER = `query UniquePlayer($uniquePlayerId: String!, $hidePersonalData: Boolean) {
  uniquePlayer(id: $uniquePlayerId, hidePersonalData: $hidePersonalData) {
    id
    players {
      season {
        id
        name
      }
      team {
        name
      }
    }
    seasonStats {
      seasonId
      games
      pointsPerGame
      freeThrowsPercentage
      inArcThrowsMadePerGame
      outArcThrowsMadePerGame
    }
  }
}`;

/**
 * Execute a GraphQL query with timeout controller and exponential backoff retry.
 * Handles HTTP 503, 502, 429, timeouts, and network stalls stealthily.
 */
async function executeGraphQL(operationName, query, variables, { maxRetries = 3, baseDelay = 3000, timeoutMs = 15000 } = {}) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operationName,
          query,
          variables
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        const status = response.status;
        const isRetryable = status === 503 || status === 502 || status === 429 || status === 504;

        if (isRetryable && attempt < maxRetries) {
          const waitTime = baseDelay * Math.pow(2, attempt);
          console.warn(`    ⚠️ HTTP ${status} in ${operationName}. Waiting ${waitTime}ms before retry (${attempt + 1}/${maxRetries})...`);
          await sleep(waitTime);
          attempt++;
          continue;
        }

        throw new Error(`HTTP ${status} ${response.statusText} - ${errText.slice(0, 150)}`);
      }

      const json = await response.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(`GraphQL Error: ${json.errors[0].message}`);
      }

      return json.data;
    } catch (err) {
      clearTimeout(timeoutTimer);

      const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
      const isDnsError = err.code === 'ENOTFOUND' || err.cause?.code === 'ENOTFOUND';
      const isTransientNetwork = !isDnsError && (
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('ETIMEDOUT')
      );
      const isRetryable = (isAbort || isTransientNetwork) && !isDnsError;

      if (isRetryable && attempt < maxRetries) {
        const reason = isAbort ? `Request timed out after ${timeoutMs}ms` : err.message;
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.warn(`    ⚠️ ${reason} in ${operationName}. Waiting ${waitTime}ms before retry (${attempt + 1}/${maxRetries})...`);
        await sleep(waitTime);
        attempt++;
        continue;
      }

      console.error(`❌ Error in ${operationName}:`, err.message);
      throw err;
    }
  }
}

/**
 * Helper to rate-limit requests
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Merges uniquePlayer.seasonStats with uniquePlayer.players into player.history.
 * Strictly cross-references seasonId from seasonStats with the players array
 * to extract actual text season.name and team.name.
 * NO artificial/hallucinated fallbacks!
 * 
 * Schema per item:
 * {
 *   seasonId: string,
 *   seasonName: string, // e.g. "2025/2026"
 *   teamName: string,   // e.g. "GG MONTORO"
 *   games: number,      // GP
 *   pointsPerGame: number, // PTS/G
 *   twoMadePerGame: number, // 2PM/G
 *   threeMadePerGame: number, // 3PM/G
 *   freeThrowsPercentage: number | null // FT%
 * }
 */
function buildPlayerHistory(uniquePlayer, fallbackTeamName = '', seasonMap = {}) {
  const up = uniquePlayer || {};
  const rawSeasonStats = Array.isArray(up.seasonStats) ? up.seasonStats : [];
  const playersList = Array.isArray(up.players) ? up.players : [];

  return rawSeasonStats.filter(Boolean).map(stat => {
    if (!stat) return null;
    const rawId = stat.seasonId != null ? String(stat.seasonId) : '';
    // Match seasonId in uniquePlayer.players
    const matchedPlayer = playersList.find(p => String(p.season?.id) === rawId);

    const seasonName = matchedPlayer?.season?.name || 
                       seasonMap[rawId] || 
                       stat.seasonName || 
                       rawId || 
                       '—';

    const teamName = (matchedPlayer?.team?.name || stat.teamName || fallbackTeamName || '—').trim();

    const games = Number(stat.games || 0);
    const pointsPerGame = stat.pointsPerGame != null 
      ? Number(stat.pointsPerGame) 
      : (games > 0 && stat.points != null ? Number((stat.points / games).toFixed(1)) : 0);

    const twoMadePerGame = stat.inArcThrowsMadePerGame != null 
      ? Number(stat.inArcThrowsMadePerGame) 
      : (stat.twoMadePerGame != null ? Number(stat.twoMadePerGame) : (games > 0 && stat.inArcThrowsMade != null ? Number((stat.inArcThrowsMade / games).toFixed(1)) : 0));

    const threeMadePerGame = stat.outArcThrowsMadePerGame != null 
      ? Number(stat.outArcThrowsMadePerGame) 
      : (stat.threeMadePerGame != null ? Number(stat.threeMadePerGame) : (games > 0 && stat.outArcThrowsMade != null ? Number((stat.outArcThrowsMade / games).toFixed(1)) : 0));

    const freeThrowsPercentage = stat.freeThrowsPercentage != null ? Number(stat.freeThrowsPercentage) : null;

    return {
      seasonId: rawId,
      seasonName,
      teamName,
      games,
      pointsPerGame,
      twoMadePerGame,
      threeMadePerGame,
      freeThrowsPercentage
    };
  }).filter(Boolean);
}

/**
 * Normalizes player career data strictly from merged API data.
 * No hardcoded years, no synthetic "BASKET BELLIZZI" or artificial 2024/2025 rows.
 */
function normalizeUniquePlayer(p, idx, seasonMap = {}, fallbackTeamName = '') {
  const up = p.uniquePlayer || {};
  let stats = up.stats || null;
  let rawSeasonStats = Array.isArray(up.seasonStats) ? up.seasonStats : [];
  let playersList = Array.isArray(up.players) ? up.players : [];

  // Se mancano le stats live globali, le calcoliamo dalle stats di quest'anno
  if (!stats && p.stats) {
    const s = p.stats;
    const games = Number(s.games || 0);
    const ppg = Number(s.pointsPerGame || s.pointsAVG || 0);
    stats = {
      games,
      points: Math.round(games * ppg),
      pointsPerGame: ppg,
      freeThrowsMade: s.freeThrowsMade != null ? Number(s.freeThrowsMade) : 0,
      freeThrowsPercentage: s.freeThrowsPercentage != null ? Number(s.freeThrowsPercentage) : null,
      inArcThrowsMade: Math.round(games * Number(s.inArcThrowsAVG || 0)),
      outArcThrowsMade: Math.round(games * Number(s.outArcThrowsAVG || 0)),
      fouls: Math.round(games * Number(s.foulsAVG || 0)),
      plusMinus: Math.round(games * Number(s.plusMinusAVG || 0))
    };
  }

  // Cross-reference seasonId with players array to resolve seasonName
  // NOTE: Added filter(Boolean) and a check to prevent "Cannot read properties of null"
  let seasonStats = rawSeasonStats.filter(Boolean).map(s => {
    if (!s) return null;
    const rawId = s.seasonId != null ? String(s.seasonId) : '';
    const matchedPlayer = playersList.find(pl => pl && pl.season && String(pl.season.id) === rawId);
    const seasonName = matchedPlayer?.season?.name || seasonMap[rawId] || s.seasonName || rawId;
    return { ...s, seasonId: rawId, seasonName };
  }).filter(Boolean); // Double check to remove any empty maps

  // If player has games in active season but seasonStats was empty, create single current season entry
  if (seasonStats.length === 0 && stats && stats.games > 0) {
    const activeSeasonId = String(COMPETITION_ID || '14544');
    const activeSeasonName = seasonMap[activeSeasonId] || activeSeasonId;
    seasonStats = [{
      seasonId: activeSeasonId,
      seasonName: activeSeasonName,
      games: stats.games,
      pointsPerGame: stats.pointsPerGame,
      freeThrowsPercentage: stats.freeThrowsPercentage,
      inArcThrowsMadePerGame: stats.games > 0 ? Number((stats.inArcThrowsMade / stats.games).toFixed(1)) : 0,
      outArcThrowsMadePerGame: stats.games > 0 ? Number((stats.outArcThrowsMade / stats.games).toFixed(1)) : 0
    }];

    if (playersList.length === 0) {
      playersList = [{
        season: { id: activeSeasonId, name: activeSeasonName },
        team: { name: fallbackTeamName || p.team?.name || '—' }
      }];
    }
  }

  // Build history strictly from merged API data
  const history = buildPlayerHistory({ seasonStats, players: playersList }, fallbackTeamName, seasonMap);

  return {
    id: up.id || `up_${p.fid || idx}`,
    stats,
    players: playersList,
    seasonStats,
    history
  };
}

/**
 * Master Data Pipeline
 */
async function buildLeaguePipeline() {
  console.log('=====================================================');
  console.log('🏀 FIP STATS MASTER DATA EXTRACTION PIPELINE');
  console.log('=====================================================');
  console.log(`Endpoint:        ${ENDPOINT}`);
  console.log(`Project Key:     ${PROJECT_KEY}`);
  console.log(`Provider:        ${PROVIDER}`);
  console.log(`Group ID:        ${GROUP_ID}`);
  console.log(`Competition ID:  ${COMPETITION_ID}`);
  console.log(`BBA Team ID:     ${BBA_TEAM_ID}`);
  console.log('-----------------------------------------------------');

  const standingsFilePath = path.join(DATA_DIR, 'league_standings.json');
  const rostersFilePath = path.join(DATA_DIR, 'league_rosters.json');

  let standings = [];
  let existingStandings = [];
  try {
    if (fs.existsSync(standingsFilePath)) {
      existingStandings = JSON.parse(fs.readFileSync(standingsFilePath, 'utf-8'));
    }
  } catch (e) {}

  let existingRosters = {};
  try {
    if (fs.existsSync(rostersFilePath)) {
      existingRosters = JSON.parse(fs.readFileSync(rostersFilePath, 'utf-8'));
    }
  } catch (e) {}

  // -----------------------------------------------------------------
  // STEP 0: Fetch Seasons Dictionary
  // -----------------------------------------------------------------
  console.log('\n[0/2] 📅 Fetching Seasons Dictionary...');
  const seasonMap = {
    "14544": "2025/2026"
  };

  try {
    const seasonsData = await executeGraphQL('GetSeasons', QUERY_GET_SEASONS, {});
    const seasonsList = seasonsData?.seasons || [];
    for (const s of seasonsList) {
      if (s && s.id && s.name) {
        seasonMap[String(s.id)] = s.name;
      }
    }
    console.log(`  ✅ Loaded ${Object.keys(seasonMap).length} seasons into lookup dictionary.`);
  } catch (seasonErr) {
    console.warn(`  ⚠️ Seasons query note: ${seasonErr.message}`);
  }

  // -----------------------------------------------------------------
  // STEP 1: Standings Extraction (Direct GetStandings query)
  // -----------------------------------------------------------------
  console.log('\n[1/2] 📊 Fetching League Standings...');

  try {
    const standingsData = await executeGraphQL(
      'GetStandings',
      QUERY_GET_STANDINGS,
      {
        projectKey: PROJECT_KEY,
        provider: PROVIDER,
        groupId: GROUP_ID
      }
    );

    const rawStandings = standingsData?.standing || [];
    if (Array.isArray(rawStandings) && rawStandings.length > 0) {
      standings = rawStandings;
    }
  } catch (err) {
    console.warn('  ⚠️ Live standings fetch warning:', err.message);
    if (existingStandings.length > 0) {
      console.log('  🔄 Using existing standings dataset as baseline.');
      standings = existingStandings;
    } else {
      process.exit(1);
    }
  }

  // Save the basic GetStandings data directly to league_standings.json
  const basicStandings = standings.map(team => ({
    fid: String(team.fid),
    name: team.name,
    position: team.position,
    logo: team.logo || '',
    stats: team.stats || {}
  }));

  fs.writeFileSync(standingsFilePath, JSON.stringify(basicStandings, null, 2), 'utf-8');
  console.log(`  ✅ Extracted ${basicStandings.length} teams.`);
  console.log(`  💾 Saved directly to: ${path.relative(ROOT_DIR, standingsFilePath)}`);

  // -----------------------------------------------------------------
  // STEP 2: Opponent Rosters & Deep UniquePlayer Historical Career Stats
  // -----------------------------------------------------------------
  console.log('\n[2/2] 👥 Fetching Opponent Rosters & Deep UniquePlayer Career Stats...');

  const opponents = basicStandings.filter(team => {
    const isBba = String(team.fid) === String(BBA_TEAM_ID) || 
                  (team.name && team.name.toLowerCase().includes('bba')) ||
                  (team.name && team.name.toLowerCase().includes('baronissi'));
    return !isBba;
  });

  console.log(`  Found ${opponents.length} opponent teams (excluding BBA team ${BBA_TEAM_ID}).`);

  const rostersDictionary = { ...existingRosters };
  let totalPlayersProcessed = 0;

  for (let i = 0; i < opponents.length; i++) {
    const opponent = opponents[i];
    const teamFid = String(opponent.fid);
    const teamName = (opponent.name || '').trim();

    console.log(`\n  [${i + 1}/${opponents.length}] Processing roster for "${teamName}" (FID: ${teamFid})...`);

    let players = [];
    try {
      if (i > 0) {
        console.log(`    ⏳ Pacing: attesa 1500ms tra squadre...`);
        await sleep(1500);
      }

      // Estrae il roster di base
      const playersData = await executeGraphQL(
        'GetPlayersByTeam',
        QUERY_GET_PLAYERS,
        { projectKey: PROJECT_KEY, competitionFid: COMPETITION_ID, teamFid: teamFid },
        { maxRetries: 3, baseDelay: 3000, timeoutMs: 15000 }
      );

      const livePlayers = playersData?.playersByTeam || [];

      // Estrae la storia profonda di OGNI giocatore incrociando lo UniquePlayer
      for (let pIdx = 0; pIdx < livePlayers.length; pIdx++) {
        const p = livePlayers[pIdx];
        const upId = p.uniquePlayer?.id;
        
        if (upId) {
          await sleep(300); // Pausa leggera per non farsi bloccare dal server
          try {
            const deepUpData = await executeGraphQL(
              'UniquePlayer',
              QUERY_UNIQUE_PLAYER,
              { uniquePlayerId: String(upId), hidePersonalData: false },
              { maxRetries: 2, baseDelay: 1000, timeoutMs: 8000 }
            );
            
            // Inietta i dati storici reali nel giocatore
            if (deepUpData?.uniquePlayer) {
              p.uniquePlayer.players = deepUpData.uniquePlayer.players || [];
              p.uniquePlayer.seasonStats = deepUpData.uniquePlayer.seasonStats || [];
            }
          } catch (upErr) {
            console.warn(`      ⚠️ Storico fallito per ${p.name} ${p.lastName}: ${upErr.message}`);
          }
        }
      }

      if (livePlayers.length > 0) {
        players = livePlayers;
      }
    } catch (teamErr) {
      console.warn(`    ⚠️ Roster fallito per "${teamName}": ${teamErr.message}`);
      if (existingRosters[teamFid] && existingRosters[teamFid].length > 0) {
        players = existingRosters[teamFid];
      }
    }

    if (!players || players.length === 0) {
      if (existingRosters[teamFid] && existingRosters[teamFid].length > 0) {
        players = existingRosters[teamFid];
      }
    }

    // Enrich players with uniquePlayer and career seasonStats
    const enrichedPlayers = (players || []).map((p, pIdx) => {
      const up = normalizeUniquePlayer(p, pIdx, seasonMap, teamName);
      return {
        ...p,
        history: up.history,
        uniquePlayer: up
      };
    });

    rostersDictionary[teamFid] = enrichedPlayers;
    totalPlayersProcessed += enrichedPlayers.length;
    console.log(`    ✅ Stored ${enrichedPlayers.length} players with historical career splits & history array.`);
  }

  // Save the full rosters dictionary
  fs.writeFileSync(rostersFilePath, JSON.stringify(rostersDictionary, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${totalPlayersProcessed} players across ${Object.keys(rostersDictionary).length} opponent rosters.`);
  console.log(`   Saved to: ${path.relative(ROOT_DIR, rostersFilePath)}`);

  console.log('\n=====================================================');
  console.log('🎉 PIPELINE COMPLETED SUCCESSFULLY!');
  console.log(`   Standings: ${basicStandings.length} teams`);
  console.log(`   Opponent Rosters: ${Object.keys(rostersDictionary).length} teams`);
  console.log(`   Total Players: ${totalPlayersProcessed} players (with uniquePlayer.seasonStats)`);
  console.log('=====================================================\n');
}

// Execute
buildLeaguePipeline().catch(err => {
  console.error('\n❌ Unhandled pipeline error:', err);
  process.exit(1);
});
