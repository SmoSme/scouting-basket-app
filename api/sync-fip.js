/**
 * Vercel Serverless Function: FIP Stats GraphQL Proxy (/api/sync-fip)
 * 
 * Executes intercepted mobile GraphQL queries from the cloud:
 * GetStandings ($projectKey, $provider, $groupId)
 */
import fs from 'fs';
import path from 'path';

// =========================================================================
// BASELINE DATA (Divisione Regionale 2 - Girone F)
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
        outArcThrowsAVG: 2.8, // > 1.5 Primary Shooter
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
        foulsAVG: 4.1, // > 3.0 High Foul Target
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
        outArcThrowsAVG: 1.9, // > 1.5 Primary Shooter
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
        foulsAVG: 3.8, // > 3.0 High Foul Target
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
        outArcThrowsAVG: 1.8, // > 1.5 Primary Shooter
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
        foulsAVG: 3.4, // > 3.0 High Foul Target
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
// GRAPHQL QUERIES
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

/**
 * Generic GraphQL Query Executor injecting exact raw Proxyman mobile headers
 */
async function executeGraphQL(endpoint, headers, operationName, query, variables) {
  try {
    const response = await fetch(endpoint, {
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
      console.error(`[api/sync-fip] Server error response for ${operationName}: HTTP ${response.status} ${response.statusText} - ${errorBody}`);
      throw new Error(`HTTP ${response.status} ${response.statusText} - ${errorBody.slice(0, 200)}`);
    }

    const json = await response.json();
    if (json.errors && json.errors.length > 0) {
      console.error(`[api/sync-fip] GraphQL errors in ${operationName}:`, JSON.stringify(json.errors));
      throw new Error(`GraphQL Error: ${json.errors[0].message}`);
    }

    return json.data;
  } catch (err) {
    console.error(`[api/sync-fip] executeGraphQL exception for ${operationName}:`, err.message);
    throw err;
  }
}

/**
 * Standard Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authHeader = process.env.FIP_AUTH_TOKEN;

  if (!authHeader) {
    console.error("Missing FIP_AUTH_TOKEN in environment.");
    return res.status(500).json({ error: "Configuration Error: Missing API Token." });
  }

  const headers = {
    'Host': 'internal.nbn23.app',
    'x-package-name': process.env.FIP_PACKAGE_NAME || 'com.nbn23.fipapp',
    'Accept': '*/*',
    'x-user-premium': process.env.FIP_USER_PREMIUM || 'true',
    'Authorization': authHeader,
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'it-IT,it;q=0.9',
    'Content-Type': 'application/json',
    'User-Agent': 'com.nbn23.fipapp',
    'x-device-id': 'EC65ADBA-ECE4-5630-8A5B-ED445F854A56',
    'Connection': 'keep-alive',
    'x-package-version': '2.14.0'
  };

  const endpoint = process.env.FIP_GRAPHQL_ENDPOINT || 'https://internal.nbn23.app/graphql';
  const operationName = "GetStandings";
  const variables = {
    provider: process.env.FIP_PROVIDER || "fhoster",
    projectKey: process.env.FIP_PROJECT_KEY || "fip_rcm",
    groupId: process.env.FIP_GROUP_ID || "85512"
  };
  const query = QUERY_GET_STANDINGS;

  try {
    console.log(`[api/sync-fip] Executing GetStandings query for group: ${variables.groupId}`);
    
    const jsonResponse = await executeGraphQL(
      endpoint,
      headers,
      operationName,
      query,
      variables
    );

    const standingsArray = jsonResponse?.data?.standing || jsonResponse?.standing;

    if (!Array.isArray(standingsArray) || standingsArray.length === 0) {
      throw new Error('Received empty standings array from FIP GraphQL backend');
    }

    // Try saving directly to public/data/league_standings.json if accessible locally
    try {
      const publicDataDir = path.join(process.cwd(), 'public', 'data');
      if (fs.existsSync(publicDataDir)) {
        fs.writeFileSync(
          path.join(publicDataDir, 'league_standings.json'),
          JSON.stringify(standingsArray, null, 2),
          'utf-8'
        );
      }
    } catch (fsErr) {
      // Non-fatal on serverless
    }

    console.log(`[api/sync-fip] Standings sync completed successfully (${standingsArray.length} teams).`);
    return res.status(200).json({
      standings: standingsArray,
      isFallback: false
    });

  } catch (err) {
    console.error('[api/sync-fip] Pipeline error:', err.message);
    // Graceful error fallback
    return res.status(200).json({
      standings: BASELINE_STANDINGS,
      isFallback: true,
      error: err.message
    });
  }
}
