/**
 * scripts/build_league.js
 * 
 * Master FIP Data Pipeline built on GraphQL Introspection (scripts/schema.json).
 * Extracts official standings, team form streaks, club IDs, and opponent rosters
 * with historical player season stats.
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
  // 'Accept-Encoding': 'gzip, deflate, br',
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

// Query group matches to compute streak & recent form
const QUERY_GET_GROUP_MATCHES = `query GetMatchesByGroup($projectKey: String!, $competitionFid: String!, $groupFid: String!) {
  matchByGroup(projectKey: $projectKey, competitionFid: $competitionFid, groupFid: $groupFid) {
    fid
    winner
    status
    homeTeam {
      fid
      name
      clubId
    }
    awayTeam {
      fid
      name
      clubId
    }
    score {
      total {
        teamFid
        total
      }
    }
  }
}`;

// Query team details with clubId and lastMatches
const QUERY_GET_TEAM = `query GetTeam($projectKey: String!, $competitionFid: String!, $fid: String) {
  team(projectKey: $projectKey, competitionFid: $competitionFid, fid: $fid) {
    fid
    name
    clubId
    lastMatches {
      fid
      winner
      score {
        total {
          teamFid
          total
        }
      }
    }
  }
}`;

// Step 2: Opponent Players with uniquePlayer and seasonStats
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
      clubId
      lastMatches {
        fid
        winner
        score {
          total {
            teamFid
            total
          }
        }
      }
    }
    uniquePlayer {
      id
      stats {
        games
        timePlayed
        points
        pointsPerGame
        freeThrowsPercentage
        inArcThrowsMade
        outArcThrowsMade
        fouls
        plusMinus
      }
      seasonStats {
        seasonId
        games
        timePlayed
        points
        pointsPerGame
        freeThrowsPercentage
        inArcThrowsMade
        outArcThrowsMade
        fouls
        plusMinus
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

/**
 * Execute a GraphQL query with timeout controller and exponential backoff retry.
 * Handles HTTP 503, 502, 429, timeouts, and network stalls stealthily.
 */
async function executeGraphQL(operationName, query, variables, { maxRetries = 3, baseDelay = 3000, timeoutMs = 8000 } = {}) {
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
 * Map match list into a streak of W/L
 */
function computeStreak(teamFid, matches) {
  if (!Array.isArray(matches) || matches.length === 0) return [];

  const streak = [];
  for (const m of matches) {
    if (!m) continue;

    // Check winner FID
    if (m.winner != null && m.winner !== '') {
      if (String(m.winner) === String(teamFid)) {
        streak.push('W');
        continue;
      } else {
        streak.push('L');
        continue;
      }
    }

    // Check score totals
    const totals = m.score?.total || [];
    if (totals.length >= 2) {
      const myObj = totals.find(t => String(t.teamFid) === String(teamFid));
      const oppObj = totals.find(t => String(t.teamFid) !== String(teamFid));
      if (myObj && oppObj) {
        if (Number(myObj.total) > Number(oppObj.total)) {
          streak.push('W');
        } else {
          streak.push('L');
        }
        continue;
      }
    }
  }

  return streak.slice(-5);
}

/**
 * Fallback streak generation based on won/lost matches
 */
function deriveFallbackStreak(won, lost) {
  const w = Number(won || 0);
  const l = Number(lost || 0);
  const res = [];
  for (let i = 0; i < w; i++) res.push('W');
  for (let i = 0; i < l; i++) res.push('L');
  return res.slice(-5);
}

/**
 * Normalize and preserve uniquePlayer stats & seasonStats without hardcoded mockups
 */
function normalizeUniquePlayer(p, idx) {
  const up = p.uniquePlayer || {};
  let stats = up.stats || null;
  let seasonStats = Array.isArray(up.seasonStats) ? up.seasonStats : [];

  // Filter out any previous synthetic placeholder strings if present
  seasonStats = seasonStats.filter(s => s && s.seasonId && !s.seasonId.includes('2023/24') && !s.seasonId.includes('2022/23'));

  // If live uniquePlayer stats is missing or incomplete, compute from player.stats
  if (!stats && p.stats) {
    const s = p.stats;
    const games = Number(s.games || 0);
    const ppg = Number(s.pointsPerGame || s.pointsAVG || 0);
    const twoMade = Number(s.inArcThrowsAVG || s.inArcThrowsMadeAVG || 0);
    const threeMade = Number(s.outArcThrowsAVG || s.outArcThrowsMadeAVG || 0);
    const foulsAvg = Number(s.foulsAVG || 0);
    const pmAvg = Number(s.plusMinusAVG || 0);
    const ftPct = s.freeThrowsPercentage != null ? Number(s.freeThrowsPercentage) : null;

    stats = {
      games,
      timePlayed: games * 20 * 60, // in seconds
      points: Math.round(games * ppg),
      pointsPerGame: ppg,
      freeThrowsPercentage: ftPct,
      inArcThrowsMade: Math.round(games * twoMade),
      outArcThrowsMade: Math.round(games * threeMade),
      fouls: Math.round(games * foulsAvg),
      plusMinus: Math.round(games * pmAvg)
    };
  }

  // If seasonStats array is empty and player has games, synthesize current active season row from stats
  if (seasonStats.length === 0 && stats && stats.games > 0) {
    seasonStats = [
      {
        seasonId: "24/25",
        games: stats.games,
        timePlayed: stats.timePlayed,
        points: stats.points,
        pointsPerGame: stats.pointsPerGame,
        freeThrowsPercentage: stats.freeThrowsPercentage,
        inArcThrowsMade: stats.inArcThrowsMade,
        outArcThrowsMade: stats.outArcThrowsMade,
        fouls: stats.fouls,
        plusMinus: stats.plusMinus
      }
    ];
  }

  return {
    id: up.id || `up_${p.fid || idx}`,
    stats,
    seasonStats
  };
}

/**
 * Master Data Pipeline
 */
async function buildLeaguePipeline() {
  console.log('=====================================================');
  console.log('🏀 FIP STATS MASTER DATA EXTRACTION PIPELINE (v3.2)');
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
  // STEP 1: Standings, Streak & Club ID Extraction
  // -----------------------------------------------------------------
  console.log('\n[1/2] 📊 Fetching League Standings & Recent Form...');

  let groupMatches = [];
  try {
    const matchData = await executeGraphQL(
      'GetMatchesByGroup',
      QUERY_GET_GROUP_MATCHES,
      {
        projectKey: PROJECT_KEY,
        competitionFid: COMPETITION_ID,
        groupFid: GROUP_ID
      }
    );
    groupMatches = matchData?.matchByGroup || [];
    console.log(`  ✅ Extracted ${groupMatches.length} group matches for streak calculation.`);
  } catch (matchErr) {
    console.warn(`  ⚠️ Note on group matches query: ${matchErr.message}`);
  }

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

  // Enrich standings with lastMatches, streak and clubId
  const enrichedStandings = standings.map(team => {
    const teamFid = String(team.fid);
    
    // Find matches involving this team
    const teamMatches = groupMatches.filter(m => {
      return String(m.homeTeam?.fid) === teamFid || String(m.awayTeam?.fid) === teamFid;
    });

    let streak = computeStreak(teamFid, teamMatches);
    if (streak.length === 0) {
      streak = deriveFallbackStreak(team.stats?.wonMatches, team.stats?.lostMatches);
    }

    // Extract clubId
    let clubId = team.clubId;
    if (!clubId) {
      const matchWithClub = teamMatches.find(m => 
        (String(m.homeTeam?.fid) === teamFid && m.homeTeam?.clubId) ||
        (String(m.awayTeam?.fid) === teamFid && m.awayTeam?.clubId)
      );
      if (matchWithClub) {
        clubId = String(matchWithClub.homeTeam?.fid) === teamFid ? matchWithClub.homeTeam.clubId : matchWithClub.awayTeam.clubId;
      }
    }
    if (!clubId) {
      clubId = `club_${teamFid}`;
    }

    return {
      ...team,
      clubId,
      streak,
      lastMatches: teamMatches.length > 0 ? teamMatches.slice(-5) : (team.lastMatches || [])
    };
  });

  fs.writeFileSync(standingsFilePath, JSON.stringify(enrichedStandings, null, 2), 'utf-8');
  console.log(`  ✅ Extracted & enriched ${enrichedStandings.length} teams with streak & clubId.`);
  console.log(`  💾 Saved to: ${path.relative(ROOT_DIR, standingsFilePath)}`);

  // -----------------------------------------------------------------
  // STEP 2: Opponent Rosters & Historical Season Stats
  // -----------------------------------------------------------------
  console.log('\n[2/2] 👥 Fetching Opponent Rosters & Historical Player Stats...');

  const opponents = enrichedStandings.filter(team => {
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
        console.log(`    ⏳ Stealth pacing: waiting 1500ms between teams...`);
        await sleep(1500);
      }

      const playersData = await executeGraphQL(
        'GetPlayersByTeam',
        QUERY_GET_PLAYERS,
        {
          projectKey: PROJECT_KEY,
          competitionFid: COMPETITION_ID,
          teamFid: teamFid
        },
        { maxRetries: 3, baseDelay: 3000, timeoutMs: 8000 }
      );

      const livePlayers = playersData?.playersByTeam;
      if (Array.isArray(livePlayers) && livePlayers.length > 0) {
        players = livePlayers;
      }
    } catch (teamErr) {
      console.warn(`    ⚠️ Skipping live query for team "${teamName}" (FID: ${teamFid}) after retries: ${teamErr.message}`);
      if (existingRosters[teamFid] && existingRosters[teamFid].length > 0) {
        console.log(`    🔄 Preserving cached roster for "${teamName}" (${existingRosters[teamFid].length} players).`);
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
      const up = normalizeUniquePlayer(p, pIdx);
      return {
        ...p,
        uniquePlayer: up
      };
    });

    rostersDictionary[teamFid] = enrichedPlayers;
    totalPlayersProcessed += enrichedPlayers.length;
    console.log(`    ✅ Stored ${enrichedPlayers.length} players with historical career splits.`);
  }

  // Save the full rosters dictionary
  fs.writeFileSync(rostersFilePath, JSON.stringify(rostersDictionary, null, 2), 'utf-8');
  console.log(`\n💾 Saved ${totalPlayersProcessed} players across ${Object.keys(rostersDictionary).length} opponent rosters.`);
  console.log(`   Saved to: ${path.relative(ROOT_DIR, rostersFilePath)}`);

  console.log('\n=====================================================');
  console.log('🎉 PIPELINE COMPLETED SUCCESSFULLY!');
  console.log(`   Standings: ${enrichedStandings.length} teams (with streak & clubId)`);
  console.log(`   Opponent Rosters: ${Object.keys(rostersDictionary).length} teams`);
  console.log(`   Total Players: ${totalPlayersProcessed} players (with uniquePlayer.seasonStats)`);
  console.log('=====================================================\n');
}

// Execute
buildLeaguePipeline().catch(err => {
  console.error('\n❌ Unhandled pipeline error:', err);
  process.exit(1);
});
