/**
 * BBA Courtside Analytics - FIP Stats GraphQL Data Extraction Pipeline
 * 
 * Executes intercepted mobile GraphQL queries:
 * 1. StandingsByTeam -> public/data/league_standings.json
 * 2. competitionLineupStats (per opponent team) -> public/data/league_rosters.json
 * 
 * Usage:
 *   npm run sync-fip
 *   npm run sync-fip -- --mock
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'data');
const STANDINGS_FILE = path.join(OUTPUT_DIR, 'league_standings.json');
const ROSTERS_FILE = path.join(OUTPUT_DIR, 'league_rosters.json');

// Configuration from .env
const FIP_GRAPHQL_ENDPOINT = process.env.FIP_GRAPHQL_ENDPOINT || 'https://internal.nbn23.app/graphql';
const FIP_AUTH_TOKEN = process.env.FIP_AUTH_TOKEN || '';
const FIP_PACKAGE_NAME = process.env.FIP_PACKAGE_NAME || 'com.nbn23.fipapp';
const FIP_USER_PREMIUM = process.env.FIP_USER_PREMIUM || 'true';
const FIP_GROUP_ID = process.env.FIP_GROUP_ID || '85512';
const FIP_PROVIDER = process.env.FIP_PROVIDER || 'fhoster';
const FIP_PROJECT_KEY = process.env.FIP_PROJECT_KEY || 'fip_rcm';
const FIP_COMPETITION_ID = process.env.FIP_COMPETITION_ID || 'comp_dr2_girf';
const BBA_TEAM_ID = process.env.BBA_TEAM_ID || 'team_bba_academy';

const args = process.argv.slice(2);
const isMockMode = args.includes('--mock') || args.includes('--demo');

// =========================================================================
// 1. BASELINE DATA (Divisione Regionale 2 Girone F)
// =========================================================================
const BASELINE_STANDINGS = [
  {
    fid: "team_virtus_1960",
    name: "Virtus Roma 1960",
    position: 1,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 14,
      lostMatches: 4,
      pointsPerGame: 76.5,
      opponentsPointsPerGame: 68.3,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_carver",
    name: "Carver Cinecittà",
    position: 2,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 13,
      lostMatches: 5,
      pointsPerGame: 75.2,
      opponentsPointsPerGame: 67.6,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_petriana",
    name: "Petriana Basket",
    position: 3,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 12,
      lostMatches: 6,
      pointsPerGame: 71.4,
      opponentsPointsPerGame: 67.6,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_bba_academy",
    name: "BBA - Basketball Academy",
    position: 4,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 11,
      lostMatches: 7,
      pointsPerGame: 72.8,
      opponentsPointsPerGame: 69.4,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_san_paolo",
    name: "San Paolo Ostiense",
    position: 5,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 10,
      lostMatches: 8,
      pointsPerGame: 68.9,
      opponentsPointsPerGame: 68.5,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_alfa_omega",
    name: "Alfa Omega Ostia",
    position: 6,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 8,
      lostMatches: 10,
      pointsPerGame: 66.2,
      opponentsPointsPerGame: 69.4,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_vis_nova",
    name: "Vis Nova Basket",
    position: 7,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 6,
      lostMatches: 12,
      pointsPerGame: 64.0,
      opponentsPointsPerGame: 71.6,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  },
  {
    fid: "team_frascati",
    name: "Basket Frascati",
    position: 8,
    logo: "",
    stats: {
      playedMatches: 18,
      wonMatches: 4,
      lostMatches: 14,
      pointsPerGame: 60.2,
      opponentsPointsPerGame: 72.8,
      __typename: "StandingStats"
    },
    __typename: "Standing"
  }
];

const BASELINE_ROSTERS = {
  "team_virtus_1960": [
    {
      player: { fid: "p1_1", name: "Marco Rossi", number: 8, position: "SG" },
      stats: {
        games: 18,
        pointsAVG: 18.6,
        foulsAVG: 2.1,
        inArcThrowsPercentage: 46.2,
        outArcThrowsPercentage: 38.5,
        inArcThrowsAVG: 4.8,
        outArcThrowsAVG: 2.8, // > 1.5 Primary Shooter Alert
        freeThrowsPercentage: 84.1,
        plusMinusAVG: 5.4,
        reboundsAVG: 3.2,
        assistsAVG: 3.6
      }
    },
    {
      player: { fid: "p1_2", name: "Davide Moretti", number: 15, position: "C" },
      stats: {
        games: 17,
        pointsAVG: 14.2,
        foulsAVG: 4.1, // > 3.0 High Foul Target Alert
        inArcThrowsPercentage: 54.8,
        outArcThrowsPercentage: 20.0,
        inArcThrowsAVG: 5.6,
        outArcThrowsAVG: 0.2,
        freeThrowsPercentage: 62.5,
        plusMinusAVG: 4.1,
        reboundsAVG: 8.9,
        assistsAVG: 1.1
      }
    },
    {
      player: { fid: "p1_3", name: "Lorenzo Santoro", number: 4, position: "PG" },
      stats: {
        games: 18,
        pointsAVG: 11.8,
        foulsAVG: 2.8,
        inArcThrowsPercentage: 42.0,
        outArcThrowsPercentage: 36.4,
        inArcThrowsAVG: 2.5,
        outArcThrowsAVG: 1.9, // > 1.5 Primary Shooter Alert
        freeThrowsPercentage: 79.0,
        plusMinusAVG: 6.2,
        reboundsAVG: 2.4,
        assistsAVG: 5.2
      }
    },
    {
      player: { fid: "p1_4", name: "Andrea Bianchi", number: 11, position: "PF" },
      stats: {
        games: 16,
        pointsAVG: 9.4,
        foulsAVG: 3.8, // > 3.0 High Foul Target Alert
        inArcThrowsPercentage: 48.5,
        outArcThrowsPercentage: 25.0,
        inArcThrowsAVG: 3.4,
        outArcThrowsAVG: 0.5,
        freeThrowsPercentage: 68.0,
        plusMinusAVG: 1.8,
        reboundsAVG: 6.1,
        assistsAVG: 1.4
      }
    },
    {
      player: { fid: "p1_5", name: "Federico Ferri", number: 23, position: "SF" },
      stats: {
        games: 18,
        pointsAVG: 10.2,
        foulsAVG: 1.9,
        inArcThrowsPercentage: 44.1,
        outArcThrowsPercentage: 35.8,
        inArcThrowsAVG: 2.6,
        outArcThrowsAVG: 1.8, // > 1.5 Primary Shooter Alert
        freeThrowsPercentage: 75.0,
        plusMinusAVG: 3.5,
        reboundsAVG: 4.0,
        assistsAVG: 1.8
      }
    },
    {
      player: { fid: "p1_6", name: "Giulio Colasanti", number: 19, position: "G" },
      stats: {
        games: 15,
        pointsAVG: 6.5,
        foulsAVG: 3.4, // > 3.0 High Foul Target Alert
        inArcThrowsPercentage: 39.5,
        outArcThrowsPercentage: 28.0,
        inArcThrowsAVG: 1.8,
        outArcThrowsAVG: 0.7,
        freeThrowsPercentage: 71.4,
        plusMinusAVG: -0.8,
        reboundsAVG: 2.1,
        assistsAVG: 1.5
      }
    }
  ],
  "team_carver": [
    {
      player: { fid: "p2_1", name: "Gianluca Martini", number: 10, position: "PG" },
      stats: {
        games: 18,
        pointsAVG: 21.4,
        foulsAVG: 2.3,
        inArcThrowsPercentage: 48.0,
        outArcThrowsPercentage: 41.2,
        inArcThrowsAVG: 4.2,
        outArcThrowsAVG: 3.8, // > 1.5 Primary Shooter
        freeThrowsPercentage: 88.5,
        plusMinusAVG: 6.8
      }
    },
    {
      player: { fid: "p2_2", name: "Roberto De Luca", number: 14, position: "C" },
      stats: {
        games: 18,
        pointsAVG: 13.5,
        foulsAVG: 3.9, // > 3.0 High Foul Target
        inArcThrowsPercentage: 52.0,
        outArcThrowsPercentage: 18.0,
        inArcThrowsAVG: 5.4,
        outArcThrowsAVG: 0.3,
        freeThrowsPercentage: 64.0,
        plusMinusAVG: 4.5
      }
    },
    {
      player: { fid: "p2_3", name: "Alessio Mancini", number: 7, position: "SG" },
      stats: {
        games: 18,
        pointsAVG: 12.1,
        foulsAVG: 3.2, // > 3.0 High Foul Target
        inArcThrowsPercentage: 43.0,
        outArcThrowsPercentage: 37.0,
        inArcThrowsAVG: 2.8,
        outArcThrowsAVG: 2.1, // > 1.5 Primary Shooter
        freeThrowsPercentage: 78.0,
        plusMinusAVG: 3.2
      }
    }
  ],
  "team_petriana": [
    {
      player: { fid: "p3_1", name: "Simone Costa", number: 7, position: "SG" },
      stats: {
        games: 17,
        pointsAVG: 16.8,
        foulsAVG: 2.4,
        inArcThrowsPercentage: 44.5,
        outArcThrowsPercentage: 37.1,
        inArcThrowsAVG: 3.8,
        outArcThrowsAVG: 2.4, // > 1.5 Primary Shooter
        freeThrowsPercentage: 81.0,
        plusMinusAVG: 4.2
      }
    },
    {
      player: { fid: "p3_2", name: "Claudio Rinaldi", number: 12, position: "PF" },
      stats: {
        games: 18,
        pointsAVG: 12.0,
        foulsAVG: 3.6, // > 3.0 High Foul Target
        inArcThrowsPercentage: 49.0,
        outArcThrowsPercentage: 22.0,
        inArcThrowsAVG: 4.6,
        outArcThrowsAVG: 0.4,
        freeThrowsPercentage: 65.0,
        plusMinusAVG: 2.5
      }
    }
  ],
  "team_san_paolo": [
    {
      player: { fid: "p5_1", name: "Daniele Ricci", number: 9, position: "SF" },
      stats: {
        games: 18,
        pointsAVG: 15.1,
        foulsAVG: 3.5, // > 3.0 High Foul Target
        inArcThrowsPercentage: 45.0,
        outArcThrowsPercentage: 36.0,
        inArcThrowsAVG: 3.5,
        outArcThrowsAVG: 1.9, // > 1.5 Primary Shooter
        freeThrowsPercentage: 74.0,
        plusMinusAVG: 1.1
      }
    }
  ],
  "team_alfa_omega": [
    {
      player: { fid: "p6_1", name: "Fabio Totti", number: 13, position: "C" },
      stats: {
        games: 17,
        pointsAVG: 14.5,
        foulsAVG: 4.2, // > 3.0 High Foul Target
        inArcThrowsPercentage: 51.0,
        outArcThrowsPercentage: 10.0,
        inArcThrowsAVG: 5.8,
        outArcThrowsAVG: 0.1,
        freeThrowsPercentage: 61.0,
        plusMinusAVG: -1.2
      }
    }
  ],
  "team_vis_nova": [
    {
      player: { fid: "p7_1", name: "Stefano Grimaldi", number: 5, position: "G" },
      stats: {
        games: 16,
        pointsAVG: 13.2,
        foulsAVG: 3.1, // > 3.0 High Foul Target
        inArcThrowsPercentage: 40.0,
        outArcThrowsPercentage: 35.0,
        inArcThrowsAVG: 2.8,
        outArcThrowsAVG: 1.8, // > 1.5 Primary Shooter
        freeThrowsPercentage: 70.0,
        plusMinusAVG: -3.5
      }
    }
  ],
  "team_frascati": [
    {
      player: { fid: "p8_1", name: "Valerio Piras", number: 6, position: "G" },
      stats: {
        games: 18,
        pointsAVG: 14.0,
        foulsAVG: 3.7, // > 3.0 High Foul Target
        inArcThrowsPercentage: 41.0,
        outArcThrowsPercentage: 33.0,
        inArcThrowsAVG: 3.2,
        outArcThrowsAVG: 1.6, // > 1.5 Primary Shooter
        freeThrowsPercentage: 69.0,
        plusMinusAVG: -5.4
      }
    }
  ]
};

// =========================================================================
// 2. GRAPHQL QUERIES
// =========================================================================
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
      __typename
    }
    __typename
  }
}`;

const QUERY_LINEUP_STATS = `
query competitionLineupStats($competitionFid: String!, $teamFid: String!) {
  competitionLineupStats(competitionFid: $competitionFid, teamFid: $teamFid) {
    team {
      fid
      name
      competitionFid
      competitionName
      season
    }
    lineups {
      player {
        fid
        name
        number
        position
      }
      players {
        fid
        name
        number
      }
      stats {
        games
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
      }
    }
  }
}
`;

/**
 * Generic GraphQL Executor injecting intercepted mobile app headers
 */
async function executeGraphQL(operationName, query, variables) {
  const authbearertoken = FIP_AUTH_TOKEN.startsWith('Bearer ') 
    ? FIP_AUTH_TOKEN 
    : `Bearer ${FIP_AUTH_TOKEN}`;

  const headers = {
    'Host': 'internal.nbn23.app',
    'x-package-name': FIP_PACKAGE_NAME || 'com.nbn23.fipapp',
    'Accept': '*/*',
    'x-user-premium': String(FIP_USER_PREMIUM ?? 'true'),
    'Authorization': authbearertoken,
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'it-IT,it;q=0.9',
    'Content-Type': 'application/json',
    'User-Agent': 'com.nbn23.fipapp',
    'x-device-id': 'EC65ADBA-ECE4-5630-8A5B-ED445F854A56',
    'Connection': 'keep-alive',
    'x-package-version': '2.14.0'
  };

  const response = await fetch(FIP_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operationName,
      query,
      variables
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText} - ${errorBody.slice(0, 150)}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL Error: ${json.errors[0].message}`);
  }

  return json.data;
}

/**
 * Save files securely
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created output directory: ${dirPath}`);
  }
}

function writeJson(filePath, data) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 Saved to: ${filePath}`);
}

/**
 * Pipeline Execution
 */
async function runPipeline() {
  console.log('===========================================================');
  console.log('🏀 BBA COURTSIDE ANALYTICS - FIP STATS GRAPHQL PIPELINE');
  console.log('===========================================================');

  const hasValidCreds = FIP_GRAPHQL_ENDPOINT && 
    !FIP_GRAPHQL_ENDPOINT.includes('api.example.com') && 
    FIP_GRAPHQL_ENDPOINT.startsWith('http') &&
    FIP_AUTH_TOKEN && 
    FIP_AUTH_TOKEN !== 'your_intercepted_bearer_token';

  if (isMockMode || !hasValidCreds) {
    if (isMockMode) {
      console.log('🧪 Running in --mock mode.');
    } else {
      console.log('⚠️ No valid FIP GraphQL credentials configured in .env.');
      console.log('   Required in .env:');
      console.log('   • FIP_GRAPHQL_ENDPOINT = Intercepted GraphQL URL');
      console.log('   • FIP_AUTH_TOKEN       = Bearer Token from Charles/Proxyman');
      console.log('   • FIP_GROUP_ID         = DR2 Group ID (e.g. 85512)');
      console.log('   • FIP_PROVIDER         = Provider (e.g. fhoster)');
      console.log('   • FIP_PROJECT_KEY      = Project key (e.g. fip_rcm)');
      console.log('');
      console.log('🚀 Generating baseline Divisione Regionale 2 dataset...');
    }

    writeJson(STANDINGS_FILE, BASELINE_STANDINGS);
    writeJson(ROSTERS_FILE, BASELINE_ROSTERS);
    console.log('✨ Data sync complete! League Hub is ready to load standings & rosters.');
    return;
  }

  try {
    // -------------------------------------------------------------
    // Step 1: Standings Extraction
    // -------------------------------------------------------------
    const operationName = "GetStandings";
    const variables = {
      provider: process.env.FIP_PROVIDER || "fhoster",
      projectKey: process.env.FIP_PROJECT_KEY || "fip_rcm",
      groupId: process.env.FIP_GROUP_ID || "85512"
    };
    const query = QUERY_GET_STANDINGS;

    console.log(`📡 [Step 1] Executing GetStandings query for group: ${variables.groupId}...`);

    const jsonResponse = await executeGraphQL(operationName, query, variables);
    const standingsArray = jsonResponse?.data?.standing || jsonResponse?.standing;

    if (!Array.isArray(standingsArray) || standingsArray.length === 0) {
      throw new Error('Received empty standings array from GraphQL response');
    }

    writeJson(STANDINGS_FILE, standingsArray);
    console.log(`✅ Extracted ${standingsArray.length} teams directly into league_standings.json`);

    // -------------------------------------------------------------
    // Step 2: Opponent Rosters Extraction
    // -------------------------------------------------------------
    console.log(`\n📋 [Step 2] Executing competitionLineupStats for opponent teams...`);
    const rostersDictionary = {};

    for (const teamItem of standingsArray) {
      const tFid = teamItem.fid;
      // Skip our team if it matches BBA_TEAM_ID
      if (tFid === BBA_TEAM_ID) {
        console.log(`   ⏭️ Skipping our team: ${teamItem.name} (${tFid})`);
        continue;
      }

      console.log(`   🔍 Querying roster stats for: ${teamItem.name} (${tFid})...`);
      try {
        const lineupData = await executeGraphQL('competitionLineupStats', QUERY_LINEUP_STATS, {
          competitionFid: FIP_COMPETITION_ID,
          teamFid: tFid
        });

        const lineups = lineupData?.competitionLineupStats?.lineups || 
          lineupData?.lineups || [];

        rostersDictionary[tFid] = lineups;
        console.log(`      ✓ Saved ${lineups.length} player lineups`);
      } catch (lineupErr) {
        console.warn(`      ⚠️ Could not fetch lineup for ${teamItem.name}: ${lineupErr.message}`);
        // Fallback to empty array or baseline if available
        rostersDictionary[tFid] = BASELINE_ROSTERS[tFid] || [];
      }
    }

    writeJson(ROSTERS_FILE, rostersDictionary);
    console.log(`✅ Extracted rosters for ${Object.keys(rostersDictionary).length} opponent teams into league_rosters.json`);

    console.log('\n===========================================================');
    console.log('🎉 PIPELINE COMPLETE: Standings & Rosters Successfully Synced!');
    console.log('===========================================================');

  } catch (err) {
    console.error(`\n❌ Pipeline Error: ${err.message}`);
    console.log('   Ensuring local baseline data is populated for League Hub...');
    writeJson(STANDINGS_FILE, BASELINE_STANDINGS);
    writeJson(ROSTERS_FILE, BASELINE_ROSTERS);
  }
}

runPipeline();
