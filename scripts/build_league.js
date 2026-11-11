/**
 * scripts/build_league.js
 * 
 * Master FIP Data Pipeline built on GraphQL Introspection (scripts/schema.json).
 * Extracts official standings, enriched rosters (with exact integer totals),
 * and match logs complete with per-game player boxscores and Q1 starters.
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

// Step 2a: Team Players Query (Upgraded with exact integer totals, omitting buggy NON_NULL freeThrowsMadeAVG)
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
        freeThrowsFailed
        freeThrowsPercentage
        inArcThrowsMade
        inArcThrowsFailed
        outArcThrowsMade
        outArcThrowsFailed
        fouls
        plusMinus
        rebounds
        assists
      }
      seasonStats {
        seasonId
        games
        points
        pointsPerGame
        freeThrowsMade
        freeThrowsFailed
        freeThrowsPercentage
        inArcThrowsMade
        inArcThrowsFailed
        inArcThrowsMadePerGame
        outArcThrowsMade
        outArcThrowsFailed
        outArcThrowsMadePerGame
        fouls
        plusMinus
        rebounds
        assists
        timePlayed
      }
    }
    stats {
      games
      points
      pointsPerGame
      pointsAVG
      fouls
      foulsAVG
      receivedFouls
      inArcThrowsMade
      inArcThrowsFailed
      inArcThrowsPercentage
      inArcThrowsAVG
      outArcThrowsMade
      outArcThrowsFailed
      outArcThrowsPercentage
      outArcThrowsAVG
      freeThrowsMade
      freeThrowsFailed
      freeThrowsPercentage
      plusMinus
      plusMinusAVG
      rebounds
      reboundsAVG
      offensiveRebounds
      defensiveRebounds
      assists
      assistsAVG
      steals
      stealsAVG
      blocks
      blocksAVG
      turnovers
      turnoversAVG
      timePlayed
      timePlayedAVG
    }
  }
}`;

// Step 2b: Dedicated UniquePlayer Query for deep career history inspection
const QUERY_UNIQUE_PLAYER = `query UniquePlayer($uniquePlayerId: String!, $hidePersonalData: Boolean) {
  uniquePlayer(id: $uniquePlayerId, hidePersonalData: $hidePersonalData) {
    id
    stats {
      games points pointsPerGame freeThrowsMade freeThrowsFailed freeThrowsPercentage inArcThrowsMade outArcThrowsMade fouls foulsPerGame plusMinus plusMinusPerGame rebounds reboundsPerGame assists assistsPerGame
    }
    players {
      season { id name }
      competition { fid name }
      team { fid name }
      stats {
        games points pointsPerGame freeThrowsMade freeThrowsFailed freeThrowsPercentage inArcThrowsMade inArcThrowsAVG outArcThrowsMade outArcThrowsAVG fouls foulsAVG plusMinus plusMinusAVG reboundsAVG assistsAVG timePlayed timePlayedAVG
      }
    }
    seasonStats {
      seasonId games points pointsPerGame freeThrowsMade freeThrowsFailed freeThrowsPercentage inArcThrowsMade inArcThrowsMadePerGame outArcThrowsMade outArcThrowsMadePerGame fouls foulsPerGame plusMinus plusMinusPerGame rebounds reboundsPerGame assists assistsPerGame
    }
  }
}`;

// Step 3: Match Trends Query (Home/Away & Quarters Analysis)
const QUERY_TEAM_MATCHES = `query GetTeamMatches($projectKey: String!, $competitionFid: String!, $teamFid: String!) {
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

// Step 4: Full Match Boxscore + Q1 Boxscore Query in a single request
const QUERY_MATCH_BOXSCORE = `query GetMatchBoxscore($projectKey: String!, $matchFid: String!) {
  matchBy(projectKey: $projectKey, fid: $matchFid) {
    fid
    fullBoxscore: boxscore {
      homeTeam {
        team { fid name }
        players {
          player { fid name lastName number starting captain }
          stats {
            timePlayed
            points
            inArcThrowsMade
            inArcThrowsFailed
            outArcThrowsMade
            outArcThrowsFailed
            freeThrowsMade
            freeThrowsFailed
            fouls
            receivedFouls
            plusMinus
            offensiveRebounds
            defensiveRebounds
            assists
            turnovers
            steals
            blocks
          }
        }
      }
      awayTeam {
        team { fid name }
        players {
          player { fid name lastName number starting captain }
          stats {
            timePlayed
            points
            inArcThrowsMade
            inArcThrowsFailed
            outArcThrowsMade
            outArcThrowsFailed
            freeThrowsMade
            freeThrowsFailed
            fouls
            receivedFouls
            plusMinus
            offensiveRebounds
            defensiveRebounds
            assists
            turnovers
            steals
            blocks
          }
        }
      }
    }
    q1Boxscore: boxscore(periods: [1]) {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeTeamName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/basket|pallacanestro|asd|pol\.|polisportiva|sports?|bk/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function isSameTeam(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = normalizeTeamName(nameA);
  const b = normalizeTeamName(nameB);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function calculateRosterContinuity(players, currentTeamName) {
  if (!Array.isArray(players) || players.length === 0) return 0;

  let activeSeason = '';
  for (const p of players) {
    const history = p.history || p.uniquePlayer?.history || [];
    if (history.length > 0 && history[0].seasonName) {
      activeSeason = history[0].seasonName;
      break;
    }
  }

  if (!activeSeason || !activeSeason.includes('/')) return 0;

  const [startYear, endYear] = activeSeason.split('/').map(Number);
  const prevSeasonName = `${startYear - 1}/${endYear - 1}`;

  let retainedCount = 0;
  for (const p of players) {
    const history = p.history || p.uniquePlayer?.history || [];
    const playedForSameTeamLastYear = history.find(h => {
      const isPrevSeason = String(h.seasonName) === prevSeasonName;
      let matchedTeam = false;
      if (h.teams && Array.isArray(h.teams)) {
        matchedTeam = h.teams.some(t => isSameTeam(t.teamName, currentTeamName));
      } else {
        matchedTeam = isSameTeam(h.teamName, currentTeamName);
      }
      return isPrevSeason && matchedTeam;
    });

    if (playedForSameTeamLastYear) {
      retainedCount++;
    }
  }

  return Math.round((retainedCount / players.length) * 100);
}

function buildPlayerHistory(uniquePlayer, fallbackTeamName = '', seasonMap = {}) {
  const up = uniquePlayer || {};
  const rawSeasonStats = Array.isArray(up.seasonStats) ? up.seasonStats : [];
  const playersList = Array.isArray(up.players) ? up.players : [];

  const history = rawSeasonStats.filter(Boolean).map(stat => {
    if (!stat) return null;
    const rawId = stat.seasonId != null ? String(stat.seasonId) : '';
    const seasonTeams = playersList.filter(p => p && p.season && String(p.season.id) === rawId);
    
    const seasonName = seasonTeams.length > 0 && seasonTeams[0].season?.name 
      ? seasonTeams[0].season.name 
      : (seasonMap[rawId] || stat.seasonName || rawId || '—');

    const games = Number(stat.games || 0);

    const teamsDetail = seasonTeams.map(st => {
      const tStats = st.stats || {};
      const compName = st.competition?.name ? st.competition.name.trim() : '';
      const tName = st.team?.name ? st.team.name.trim() : '—';
      const fullTeamName = compName ? `${compName} - ${tName}` : tName;

      return {
        teamName: fullTeamName,
        competitionFid: st.competition?.fid || null,
        teamFid: st.team?.fid || null,
        games: Number(tStats.games || 0),
        points: tStats.points != null ? Number(tStats.points) : Math.round(Number(tStats.games || 0) * Number(tStats.pointsPerGame || 0)),
        pointsPerGame: tStats.pointsPerGame != null ? Number(tStats.pointsPerGame) : 0,
        twoMadePerGame: tStats.inArcThrowsAVG != null ? Number(tStats.inArcThrowsAVG) : 0,
        threeMadePerGame: tStats.outArcThrowsAVG != null ? Number(tStats.outArcThrowsAVG) : 0,
        freeThrowsPercentage: tStats.freeThrowsPercentage != null ? Number(tStats.freeThrowsPercentage) : null,
        foulsPerGame: tStats.foulsAVG != null ? Number(tStats.foulsAVG) : 0,
        plusMinusPerGame: tStats.plusMinusAVG != null ? Number(tStats.plusMinusAVG) : 0,
        reboundsPerGame: tStats.reboundsAVG != null ? Number(tStats.reboundsAVG) : 0,
        assistsPerGame: tStats.assistsAVG != null ? Number(tStats.assistsAVG) : 0
      };
    });

    const totalTeamGames = teamsDetail.reduce((acc, t) => acc + (t.games || 0), 0);
    const sFouls = stat.foulsPerGame != null ? Number(stat.foulsPerGame) : (totalTeamGames > 0 ? teamsDetail.reduce((acc, t) => acc + (t.games || 0) * (t.foulsPerGame || 0), 0) / totalTeamGames : 0);
    const sPm = stat.plusMinusPerGame != null ? Number(stat.plusMinusPerGame) : (totalTeamGames > 0 ? teamsDetail.reduce((acc, t) => acc + (t.games || 0) * (t.plusMinusPerGame || 0), 0) / totalTeamGames : 0);
    const sReb = stat.reboundsPerGame != null ? Number(stat.reboundsPerGame) : (totalTeamGames > 0 ? teamsDetail.reduce((acc, t) => acc + (t.games || 0) * (t.reboundsPerGame || 0), 0) / totalTeamGames : 0);
    const sAst = stat.assistsPerGame != null ? Number(stat.assistsPerGame) : (totalTeamGames > 0 ? teamsDetail.reduce((acc, t) => acc + (t.games || 0) * (t.assistsPerGame || 0), 0) / totalTeamGames : 0);

    return {
      seasonId: rawId,
      seasonName,
      isAggregate: true,
      games,
      pointsPerGame: stat.pointsPerGame != null ? Number(stat.pointsPerGame) : 0,
      twoMadePerGame: stat.inArcThrowsMadePerGame != null ? Number(stat.inArcThrowsMadePerGame) : 0,
      threeMadePerGame: stat.outArcThrowsMadePerGame != null ? Number(stat.outArcThrowsMadePerGame) : 0,
      freeThrowsPercentage: stat.freeThrowsPercentage != null ? Number(stat.freeThrowsPercentage) : null,
      foulsPerGame: Number(sFouls.toFixed(1)),
      plusMinusPerGame: Number(sPm.toFixed(1)),
      reboundsPerGame: Number(sReb.toFixed(1)),
      assistsPerGame: Number(sAst.toFixed(1)),
      teams: teamsDetail
    };
  }).filter(Boolean);

  history.sort((a, b) => b.seasonName.localeCompare(a.seasonName));
  return history;
}

function normalizeUniquePlayer(p, idx, seasonMap = {}, fallbackTeamName = '') {
  const up = p.uniquePlayer || {};
  let stats = up.stats || null;
  let rawSeasonStats = Array.isArray(up.seasonStats) ? up.seasonStats : [];
  let playersList = Array.isArray(up.players) ? up.players : [];

  if (!stats && p.stats) {
    const s = p.stats;
    const games = Number(s.games || 0);
    const ppg = Number(s.pointsPerGame || s.pointsAVG || 0);
    stats = {
      games,
      points: s.points != null ? Number(s.points) : Math.round(games * ppg),
      pointsPerGame: ppg,
      freeThrowsMade: s.freeThrowsMade != null ? Number(s.freeThrowsMade) : 0,
      freeThrowsFailed: s.freeThrowsFailed != null ? Number(s.freeThrowsFailed) : 0,
      freeThrowsPercentage: s.freeThrowsPercentage != null ? Number(s.freeThrowsPercentage) : null,
      inArcThrowsMade: s.inArcThrowsMade != null ? Number(s.inArcThrowsMade) : Math.round(games * Number(s.inArcThrowsAVG || 0)),
      outArcThrowsMade: s.outArcThrowsMade != null ? Number(s.outArcThrowsMade) : Math.round(games * Number(s.outArcThrowsAVG || 0)),
      fouls: s.fouls != null ? Number(s.fouls) : Math.round(games * Number(s.foulsAVG || 0)),
      plusMinus: s.plusMinus != null ? Number(s.plusMinus) : Math.round(games * Number(s.plusMinusAVG || 0))
    };
  }

  let seasonStats = rawSeasonStats.filter(Boolean).map(s => {
    if (!s) return null;
    const rawId = s.seasonId != null ? String(s.seasonId) : '';
    const matchedPlayer = playersList.find(pl => pl && pl.season && String(pl.season.id) === rawId);
    const seasonName = matchedPlayer?.season?.name || seasonMap[rawId] || s.seasonName || rawId;
    return { ...s, seasonId: rawId, seasonName };
  }).filter(Boolean);

  if (seasonStats.length === 0 && stats && stats.games > 0) {
    const activeSeasonId = String(COMPETITION_ID || '14544');
    const activeSeasonName = seasonMap[activeSeasonId] || activeSeasonId;
    seasonStats = [{
      seasonId: activeSeasonId,
      seasonName: activeSeasonName,
      games: stats.games,
      points: stats.points,
      pointsPerGame: stats.pointsPerGame,
      freeThrowsMade: stats.freeThrowsMade,
      freeThrowsPercentage: stats.freeThrowsPercentage,
      inArcThrowsMade: stats.inArcThrowsMade,
      inArcThrowsMadePerGame: stats.games > 0 ? Number((stats.inArcThrowsMade / stats.games).toFixed(1)) : 0,
      outArcThrowsMade: stats.outArcThrowsMade,
      outArcThrowsMadePerGame: stats.games > 0 ? Number((stats.outArcThrowsMade / stats.games).toFixed(1)) : 0
    }];

    if (playersList.length === 0) {
      playersList = [{
        season: { id: activeSeasonId, name: activeSeasonName },
        team: { name: fallbackTeamName || p.team?.name || '—' }
      }];
    }
  }

  const history = buildPlayerHistory({ seasonStats, players: playersList }, fallbackTeamName, seasonMap);

  return {
    id: up.id || `up_${p.fid || idx}`,
    stats,
    players: playersList,
    seasonStats,
    history
  };
}

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
  console.log('\n[0/4] 📅 Fetching Seasons Dictionary...');
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
  // STEP 1: Standings Extraction
  // -----------------------------------------------------------------
  console.log('\n[1/4] 📊 Fetching League Standings...');

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

  const basicStandings = standings.map(team => ({
    fid: String(team.fid),
    name: team.name,
    position: team.position,
    logo: team.logo || '',
    stats: team.stats || {}
  }));

  fs.writeFileSync(standingsFilePath, JSON.stringify(basicStandings, null, 2), 'utf-8');
  console.log(`  ✅ Extracted ${basicStandings.length} teams.`);

  // -----------------------------------------------------------------
  // STEP 2: Team Rosters & Deep UniquePlayer Historical Career Stats
  // -----------------------------------------------------------------
  console.log('\n[2/4] 👥 Fetching Team Rosters & Exact PlayerStats Totals (including BBA)...');

  const teamsToProcess = basicStandings;
  const rostersDictionary = { ...existingRosters };

  for (let i = 0; i < teamsToProcess.length; i++) {
    const opponent = teamsToProcess[i];
    const teamFid = String(opponent.fid);
    const teamName = (opponent.name || '').trim();

    console.log(`\n  [${i + 1}/${teamsToProcess.length}] Processing roster for "${teamName}" (FID: ${teamFid})...`);

    let players = [];
    try {
      if (i > 0) {
        await sleep(1500);
      }

      const playersData = await executeGraphQL(
        'GetPlayersByTeam',
        QUERY_GET_PLAYERS,
        { projectKey: PROJECT_KEY, competitionFid: COMPETITION_ID, teamFid: teamFid },
        { maxRetries: 3, baseDelay: 3000, timeoutMs: 15000 }
      );

      const livePlayers = playersData?.playersByTeam || [];

      for (let pIdx = 0; pIdx < livePlayers.length; pIdx++) {
        const p = livePlayers[pIdx];
        const upId = p.uniquePlayer?.id;
        
        if (upId) {
          await sleep(300);
          try {
            const deepUpData = await executeGraphQL(
              'UniquePlayer',
              QUERY_UNIQUE_PLAYER,
              { uniquePlayerId: String(upId), hidePersonalData: false },
              { maxRetries: 2, baseDelay: 1000, timeoutMs: 8000 }
            );
            
            if (deepUpData?.uniquePlayer) {
              p.uniquePlayer.stats = deepUpData.uniquePlayer.stats || p.uniquePlayer.stats;
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

    const enrichedPlayers = (players || []).map((p, pIdx) => {
      const up = normalizeUniquePlayer(p, pIdx, seasonMap, teamName);
      return {
        ...p,
        history: up.history,
        uniquePlayer: up
      };
    });

    const continuityPct = calculateRosterContinuity(enrichedPlayers, opponent.name);
    opponent.continuityPct = continuityPct;

    rostersDictionary[teamFid] = enrichedPlayers;
    console.log(`    ✅ Stored ${enrichedPlayers.length} players.`);
  }

  const bbaTeam = basicStandings.find(t => 
    String(t.fid) === String(BBA_TEAM_ID) || 
    (t.name && t.name.toLowerCase().includes('baronissi')) ||
    (t.name && t.name.toLowerCase().includes('bba'))
  );
  if (bbaTeam && bbaTeam.continuityPct == null) {
    bbaTeam.continuityPct = 70;
  }

  fs.writeFileSync(standingsFilePath, JSON.stringify(basicStandings, null, 2), 'utf-8');

  // -----------------------------------------------------------------
  // STEP 3: Match Trends & Quarter Splits Pipeline
  // -----------------------------------------------------------------
  console.log('\n[3/4] 📈 Processing Match Trends (Home/Away & Quarters)...');
  const trendsFilePath = path.join(DATA_DIR, 'team_trends.json');
  let existingTrends = {};
  try {
    if (fs.existsSync(trendsFilePath)) {
      existingTrends = JSON.parse(fs.readFileSync(trendsFilePath, 'utf-8'));
    }
  } catch (e) {}

  const allTrends = { ...existingTrends };

  for (let i = 0; i < teamsToProcess.length; i++) {
    const opp = teamsToProcess[i];
    const oppFid = String(opp.fid);
    const oppName = opp.name || oppFid;

    try {
      if (i > 0) await sleep(1200);

      const matchesData = await executeGraphQL(
        'GetTeamMatches',
        QUERY_TEAM_MATCHES,
        { projectKey: PROJECT_KEY, competitionFid: COMPETITION_ID, teamFid: oppFid },
        { maxRetries: 2, baseDelay: 1500, timeoutMs: 10000 }
      );

      const matches = matchesData?.teamMatch || [];
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
        streak: [],
        log: []
      };

      // Preserve any already-fetched per-match players boxscore from existingTrends
      const oldLogMap = new Map();
      if (existingTrends[oppFid]?.log) {
        existingTrends[oppFid].log.forEach(oldM => {
          if (oldM.matchFid && Array.isArray(oldM.players) && oldM.players.length > 0) {
            oldLogMap.set(String(oldM.matchFid), oldM.players);
          }
        });
      }

      for (const match of closedMatches) {
        const isHome = match.homeTeam?.fid === oppFid;
        const scores = match.scores?.total;
        if (!scores) continue;

        const scored = isHome ? scores.homeScore : scores.awayScore;
        const conceded = isHome ? scores.awayScore : scores.homeScore;
        const isWin = scored > conceded;

        stats.log.push({
          matchFid: match.fid,
          date: match.date,
          round: match.roundName || '',
          homeTeam: match.homeTeam?.name || 'Casa',
          awayTeam: match.awayTeam?.name || 'Trasferta',
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          isWin: isWin,
          isHomeGame: isHome,
          partials: match.scores?.partials || [],
          players: oldLogMap.get(String(match.fid)) || []
        });

        stats.global.games++;
        stats.global.pointsScored += scored;
        stats.global.pointsConceded += conceded;
        isWin ? stats.global.wins++ : stats.global.losses++;

        if (stats.streak.length < 5) stats.streak.push(isWin ? 'V' : 'P');

        const loc = isHome ? stats.home : stats.away;
        loc.games++;
        loc.pointsScored += scored;
        loc.pointsConceded += conceded;
        isWin ? loc.wins++ : loc.losses++;

        const partials = match.scores?.partials || [];
        for (const p of partials) {
          const qName = `Q${p.period}`;
          if (stats.quarters[qName]) {
            stats.quarters[qName].scored += isHome ? p.homeScore : p.awayScore;
            stats.quarters[qName].conceded += isHome ? p.awayScore : p.homeScore;
          }
        }
      }

      stats.streak = stats.streak.reverse();

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

      allTrends[oppFid] = stats;
      console.log(`    ✅ Calculated trends for "${oppName}" (${g} matches).`);
    } catch (trendErr) {
      console.warn(`    ⚠️ Note: Trends fetch for "${oppName}": ${trendErr.message}`);
      if (!allTrends[oppFid] && existingTrends[oppFid]) {
        allTrends[oppFid] = existingTrends[oppFid];
      }
    }
  }

  // -----------------------------------------------------------------
  // STEP 4: Full Match Boxscores & Q1 Starting Frequencies
  // -----------------------------------------------------------------
  console.log('\n[4/4] 🏀 Extracting Full Match Boxscores & Q1 Starting Frequencies...');
  const startersFilePath = path.join(DATA_DIR, 'team_starters.json');
  let existingStarters = {};
  try {
    if (fs.existsSync(startersFilePath)) {
      existingStarters = JSON.parse(fs.readFileSync(startersFilePath, 'utf-8'));
    }
  } catch (e) {}

  const allTeamStarters = { ...existingStarters };

  for (const [teamFid, teamData] of Object.entries(allTrends)) {
    const matchLog = teamData.log || [];
    if (matchLog.length === 0) continue;

    const needsBoxscores = matchLog.some(m => !Array.isArray(m.players) || m.players.length === 0);
    if (!needsBoxscores && existingStarters[teamFid] && existingStarters[teamFid].totalMatches >= matchLog.length) {
      allTeamStarters[teamFid] = existingStarters[teamFid];
      continue;
    }

    const playerStarterCounts = {};
    let totalAnalyzedMatches = 0;

    for (const matchItem of matchLog) {
      const matchFid = matchItem.matchFid;
      if (!matchFid) continue;

      try {
        await sleep(800);
        const boxData = await executeGraphQL(
          'GetMatchBoxscore',
          QUERY_MATCH_BOXSCORE,
          { projectKey: PROJECT_KEY, matchFid: String(matchFid) },
          { maxRetries: 2, baseDelay: 1000, timeoutMs: 8000 }
        );

        const matchObj = boxData?.matchBy?.[0];
        if (!matchObj) continue;

        // A. Store Full Per-Game Player Boxscore inside matchItem.players
        const fullBox = matchObj.fullBoxscore;
        if (fullBox) {
          const isHomeFull = fullBox.homeTeam?.team?.fid === teamFid;
          const teamFullBox = isHomeFull ? fullBox.homeTeam : fullBox.awayTeam;
          const fullPlayers = teamFullBox?.players || [];

          matchItem.players = fullPlayers
            .filter(p => p && p.player)
            .map(p => ({
              fid: p.player.fid,
              name: p.player.name,
              lastName: p.player.lastName,
              number: p.player.number,
              starting: Boolean(p.player.starting),
              captain: Boolean(p.player.captain),
              timePlayed: Number(p.stats?.timePlayed ?? 0),
              pts: Number(p.stats?.points ?? 0),
              points: Number(p.stats?.points ?? 0),
              fg2m: Number(p.stats?.inArcThrowsMade ?? 0),
              fg2Failed: Number(p.stats?.inArcThrowsFailed ?? 0),
              fg3m: Number(p.stats?.outArcThrowsMade ?? 0),
              fg3Failed: Number(p.stats?.outArcThrowsFailed ?? 0),
              ftm: Number(p.stats?.freeThrowsMade ?? 0),
              ftFailed: Number(p.stats?.freeThrowsFailed ?? 0),
              fta: Number(p.stats?.freeThrowsMade ?? 0) + Number(p.stats?.freeThrowsFailed ?? 0),
              fouls: Number(p.stats?.fouls ?? 0),
              receivedFouls: Number(p.stats?.receivedFouls ?? 0),
              plusMinus: Number(p.stats?.plusMinus ?? 0),
              oreb: Number(p.stats?.offensiveRebounds ?? 0),
              dreb: Number(p.stats?.defensiveRebounds ?? 0),
              ast: Number(p.stats?.assists ?? 0),
              tov: Number(p.stats?.turnovers ?? 0),
              stl: Number(p.stats?.steals ?? 0),
              blk: Number(p.stats?.blocks ?? 0)
            }));
        }

        // B. Q1 Starting Lineup Frequency
        const q1Box = matchObj.q1Boxscore;
        if (q1Box) {
          const isHomeQ1 = q1Box.homeTeam?.team?.fid === teamFid;
          const teamQ1Box = isHomeQ1 ? q1Box.homeTeam : q1Box.awayTeam;
          const rawQ1Players = teamQ1Box?.players || [];
          if (rawQ1Players.length > 0) {
            const sortedByTime = rawQ1Players
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
          }
        }
      } catch (boxErr) {
        // Continue on single match error
      }
    }

    if (totalAnalyzedMatches > 0) {
      const structuredStarters = Object.values(playerStarterCounts).map(player => ({
        ...player,
        startPercentage: Math.round((player.startsCount / totalAnalyzedMatches) * 100),
        totalMatchesChecked: totalAnalyzedMatches
      })).sort((a, b) => b.startPercentage - a.startPercentage);

      allTeamStarters[teamFid] = {
        totalMatches: totalAnalyzedMatches,
        players: structuredStarters
      };
    }
  }

  // Save updated team_trends.json (now enriched with per-match player boxscores!)
  fs.writeFileSync(trendsFilePath, JSON.stringify(allTrends, null, 2), 'utf-8');
  console.log(`💾 [2/3] Saved team trends & per-match boxscores to: ${path.relative(ROOT_DIR, trendsFilePath)}`);

  // Save intermediate team_starters.json
  fs.writeFileSync(startersFilePath, JSON.stringify(allTeamStarters, null, 2), 'utf-8');

  // -----------------------------------------------------------------
  // STEP 5: Enrich Rosters Dictionary with startPercentage
  // -----------------------------------------------------------------
  console.log('\n⭐ Enriching all rosters with starting frequency percentage (startPercentage)...');
  for (const [teamFid, players] of Object.entries(rostersDictionary)) {
    const teamStarters = allTeamStarters[teamFid]?.players || [];
    const starterMap = new Map();
    const numberMap = new Map();
    teamStarters.forEach(s => {
      if (s.fid) starterMap.set(String(s.fid), s);
      if (s.number) numberMap.set(String(s.number), s);
    });

    players.forEach(p => {
      let s = null;
      if (p.fid && starterMap.has(String(p.fid))) {
        s = starterMap.get(String(p.fid));
      } else if (p.number && numberMap.has(String(p.number))) {
        const candidate = numberMap.get(String(p.number));
        if (!candidate.fid || !p.fid || String(candidate.fid) === String(p.fid)) {
          s = candidate;
        }
      }

      if (s && s.startPercentage != null) {
        p.startPercentage = `${s.startPercentage}%`;
        p.startsCount = s.startsCount || 0;
      } else if (teamStarters.length > 0) {
        p.startPercentage = '0%';
        p.startsCount = 0;
      } else {
        p.startPercentage = p.starting ? '100%' : '0%';
        p.startsCount = p.starting ? 1 : 0;
      }
    });
  }

  fs.writeFileSync(rostersFilePath, JSON.stringify(rostersDictionary, null, 2), 'utf-8');
  console.log(`💾 [3/3] Saved enriched rosters with startPercentage to: ${path.relative(ROOT_DIR, rostersFilePath)}`);

  console.log('\n=====================================================');
  console.log('🎉 PIPELINE COMPLETED SUCCESSFULLY!');
  console.log('=====================================================\n');
}

buildLeaguePipeline().catch(err => {
  console.error('\n❌ Unhandled pipeline error:', err);
  process.exit(1);
});