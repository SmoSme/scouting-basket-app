import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'public', 'data');

const BBA_TEAM_ID = '211634';

// 1. Team Trends for BBA
const trendsPath = path.join(DATA_DIR, 'team_trends.json');
const trends = fs.existsSync(trendsPath) ? JSON.parse(fs.readFileSync(trendsPath, 'utf-8')) : {};

const bbaTrends = {
  global: { games: 2, pointsScored: 117, pointsConceded: 116, wins: 1, losses: 1 },
  home: { games: 1, pointsScored: 51, pointsConceded: 57, wins: 0, losses: 1 },
  away: { games: 1, pointsScored: 66, pointsConceded: 59, wins: 1, losses: 0 },
  quarters: {
    Q1: { scored: 24, conceded: 36 },
    Q2: { scored: 18, conceded: 26 },
    Q3: { scored: 28, conceded: 30 },
    Q4: { scored: 47, conceded: 24 }
  },
  quarterAverages: {
    Q1: { scoredAvg: 12.0, concededAvg: 18.0, diff: -6.0 },
    Q2: { scoredAvg: 9.0, concededAvg: 13.0, diff: -4.0 },
    Q3: { scoredAvg: 14.0, concededAvg: 15.0, diff: -1.0 },
    Q4: { scoredAvg: 23.5, concededAvg: 12.0, diff: 11.5 }
  },
  streak: ['P', 'V'],
  log: [
    {
      matchFid: '1786119',
      date: '2026-11-03T20:00:00.000Z',
      round: '2',
      homeTeam: 'G.S. MINORI PALLACANESTRO',
      awayTeam: 'BARONISSI BASKETBALL ACADEMY',
      homeScore: 59,
      awayScore: 66,
      isWin: true,
      isHomeGame: false,
      partials: [
        { homeScore: 19, awayScore: 10, period: 1 },
        { homeScore: 15, awayScore: 8, period: 2 },
        { homeScore: 17, awayScore: 18, period: 3 },
        { homeScore: 8, awayScore: 30, period: 4 }
      ]
    },
    {
      matchFid: '1786114',
      date: '2026-10-24T15:00:00.000Z',
      round: '1',
      homeTeam: 'BARONISSI BASKETBALL ACADEMY',
      awayTeam: 'S.L.Z. BASKET SOLOFRA',
      homeScore: 51,
      awayScore: 57,
      isWin: false,
      isHomeGame: true,
      partials: [
        { homeScore: 14, awayScore: 17, period: 1 },
        { homeScore: 10, awayScore: 11, period: 2 },
        { homeScore: 10, awayScore: 13, period: 3 },
        { homeScore: 17, awayScore: 16, period: 4 }
      ]
    }
  ]
};

trends[BBA_TEAM_ID] = bbaTrends;
trends['team_bba_academy'] = bbaTrends;
fs.writeFileSync(trendsPath, JSON.stringify(trends, null, 2), 'utf-8');
console.log('✅ Injected BBA into team_trends.json');

// 2. Starters Analysis for BBA
const startersPath = path.join(DATA_DIR, 'team_starters.json');
const starters = fs.existsSync(startersPath) ? JSON.parse(fs.readFileSync(startersPath, 'utf-8')) : {};

const bbaStartersList = [
  { fid: 'bba_p_1', name: 'Toma', lastName: 'Makharadze', number: '1', startsCount: 2, startPercentage: 100, totalMatchesChecked: 2 },
  { fid: 'bba_p_3', name: 'Mario', lastName: 'Giordano', number: '3', startsCount: 2, startPercentage: 100, totalMatchesChecked: 2 },
  { fid: 'bba_p_4', name: 'Lorenzo', lastName: 'Giordano', number: '4', startsCount: 2, startPercentage: 100, totalMatchesChecked: 2 },
  { fid: 'bba_p_7', name: 'Valerio', lastName: 'Villani', number: '7', startsCount: 2, startPercentage: 100, totalMatchesChecked: 2 },
  { fid: 'bba_p_8', name: 'Francesco', lastName: 'Gargiulo', number: '8', startsCount: 2, startPercentage: 100, totalMatchesChecked: 2 },
  { fid: 'bba_p_32', name: 'Armando', lastName: 'Oddo Casano', number: '32', startsCount: 1, startPercentage: 50, totalMatchesChecked: 2 },
  { fid: 'bba_p_43', name: 'Antoine', lastName: 'Ghanem', number: '43', startsCount: 1, startPercentage: 50, totalMatchesChecked: 2 },
  { fid: 'bba_p_22', name: 'Amedeo', lastName: 'Decuzzi', number: '22', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_11', name: 'Davide', lastName: 'Valente', number: '11', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_34', name: 'Gerardo', lastName: 'Spisso', number: '34', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_12', name: 'Angelo Davide', lastName: 'Del Regno', number: '12', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_31', name: 'Emanuele', lastName: 'Cuomo', number: '31', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_6', name: 'Marcello', lastName: 'Russo', number: '6', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_9', name: 'Mattia', lastName: 'Taurone', number: '9', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_13', name: 'Maurizio', lastName: 'Lepore', number: '13', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 },
  { fid: 'bba_p_35', name: 'Marco', lastName: 'Girardi', number: '35', startsCount: 0, startPercentage: 0, totalMatchesChecked: 2 }
];

starters[BBA_TEAM_ID] = { totalMatches: 2, players: bbaStartersList };
starters['team_bba_academy'] = { totalMatches: 2, players: bbaStartersList };
fs.writeFileSync(startersPath, JSON.stringify(starters, null, 2), 'utf-8');
console.log('✅ Injected BBA into team_starters.json');

// 3. League Rosters for BBA
const rostersPath = path.join(DATA_DIR, 'league_rosters.json');
const rosters = fs.existsSync(rostersPath) ? JSON.parse(fs.readFileSync(rostersPath, 'utf-8')) : {};

const bbaPlayersRoster = [
  {
    fid: 'bba_p_1',
    name: 'Toma',
    lastName: 'Makharadze',
    number: '1',
    starting: true,
    startPercentage: '100%',
    startsCount: 2,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 28,
      pointsAVG: 12.5,
      inArcThrowsPercentage: 46.2,
      outArcThrowsPercentage: 33.3,
      freeThrowsPercentage: 75.0,
      inArcThrowsAVG: 3.5,
      outArcThrowsAVG: 1.5,
      foulsAVG: 2.0,
      plusMinusAVG: 3.5,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_1',
      stats: { games: 24, points: 285, pointsPerGame: 11.87, foulsPerGame: 2.1 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 25, pointsPerGame: 12.5, freeThrowsPercentage: 75 }]
    }
  },
  {
    fid: 'bba_p_3',
    name: 'Mario',
    lastName: 'Giordano',
    number: '3',
    starting: true,
    startPercentage: '100%',
    startsCount: 2,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 22,
      pointsAVG: 6.0,
      inArcThrowsPercentage: 40.0,
      outArcThrowsPercentage: 30.0,
      freeThrowsPercentage: 70.0,
      inArcThrowsAVG: 2.0,
      outArcThrowsAVG: 0.5,
      foulsAVG: 1.5,
      plusMinusAVG: 1.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_3',
      stats: { games: 20, points: 140, pointsPerGame: 7.0, foulsPerGame: 1.8 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 12, pointsPerGame: 6.0, freeThrowsPercentage: 70 }]
    }
  },
  {
    fid: 'bba_p_4',
    name: 'Lorenzo',
    lastName: 'Giordano',
    number: '4',
    starting: true,
    startPercentage: '100%',
    startsCount: 2,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 24,
      pointsAVG: 7.5,
      inArcThrowsPercentage: 45.0,
      outArcThrowsPercentage: 35.0,
      freeThrowsPercentage: 80.0,
      inArcThrowsAVG: 2.0,
      outArcThrowsAVG: 1.0,
      foulsAVG: 1.5,
      plusMinusAVG: 2.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_4',
      stats: { games: 22, points: 176, pointsPerGame: 8.0, foulsPerGame: 1.6 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 15, pointsPerGame: 7.5, freeThrowsPercentage: 80 }]
    }
  },
  {
    fid: 'bba_p_6',
    name: 'Marcello',
    lastName: 'Russo',
    number: '6',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 1,
      timePlayedAVG: 12,
      pointsAVG: 2.0,
      inArcThrowsPercentage: 50.0,
      outArcThrowsPercentage: 0.0,
      freeThrowsPercentage: 0.0,
      inArcThrowsAVG: 1.0,
      outArcThrowsAVG: 0.0,
      foulsAVG: 1.0,
      plusMinusAVG: 0.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_6',
      stats: { games: 15, points: 45, pointsPerGame: 3.0, foulsPerGame: 1.2 },
      seasonStats: [{ seasonName: '2024/2025', games: 1, points: 2, pointsPerGame: 2.0, freeThrowsPercentage: 0 }]
    }
  },
  {
    fid: 'bba_p_7',
    name: 'Valerio',
    lastName: 'Villani',
    number: '7',
    starting: true,
    startPercentage: '100%',
    startsCount: 2,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 26,
      pointsAVG: 8.5,
      inArcThrowsPercentage: 50.0,
      outArcThrowsPercentage: 25.0,
      freeThrowsPercentage: 66.7,
      inArcThrowsAVG: 3.0,
      outArcThrowsAVG: 0.5,
      foulsAVG: 2.0,
      plusMinusAVG: 2.5,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_7',
      stats: { games: 30, points: 270, pointsPerGame: 9.0, foulsPerGame: 2.2 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 17, pointsPerGame: 8.5, freeThrowsPercentage: 66.7 }]
    }
  },
  {
    fid: 'bba_p_8',
    name: 'Francesco',
    lastName: 'Gargiulo',
    number: '8',
    starting: true,
    startPercentage: '100%',
    startsCount: 2,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 25,
      pointsAVG: 6.5,
      inArcThrowsPercentage: 42.0,
      outArcThrowsPercentage: 28.6,
      freeThrowsPercentage: 60.0,
      inArcThrowsAVG: 2.0,
      outArcThrowsAVG: 0.5,
      foulsAVG: 2.5,
      plusMinusAVG: 1.5,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_8',
      stats: { games: 25, points: 175, pointsPerGame: 7.0, foulsPerGame: 2.0 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 13, pointsPerGame: 6.5, freeThrowsPercentage: 60 }]
    }
  },
  {
    fid: 'bba_p_9',
    name: 'Mattia',
    lastName: 'Taurone',
    number: '9',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 10,
      pointsAVG: 1.5,
      inArcThrowsPercentage: 33.3,
      outArcThrowsPercentage: 0.0,
      freeThrowsPercentage: 50.0,
      inArcThrowsAVG: 0.5,
      outArcThrowsAVG: 0.0,
      foulsAVG: 1.0,
      plusMinusAVG: -0.5,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_9',
      stats: { games: 16, points: 40, pointsPerGame: 2.5, foulsPerGame: 1.0 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 3, pointsPerGame: 1.5, freeThrowsPercentage: 50 }]
    }
  },
  {
    fid: 'bba_p_11',
    name: 'Davide',
    lastName: 'Valente',
    number: '11',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 18,
      pointsAVG: 5.5,
      inArcThrowsPercentage: 45.5,
      outArcThrowsPercentage: 33.3,
      freeThrowsPercentage: 75.0,
      inArcThrowsAVG: 1.5,
      outArcThrowsAVG: 0.5,
      foulsAVG: 1.5,
      plusMinusAVG: 1.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_11',
      stats: { games: 28, points: 196, pointsPerGame: 7.0, foulsPerGame: 1.7 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 11, pointsPerGame: 5.5, freeThrowsPercentage: 75 }]
    }
  },
  {
    fid: 'bba_p_12',
    name: 'Angelo Davide',
    lastName: 'Del Regno',
    number: '12',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 14,
      pointsAVG: 3.0,
      inArcThrowsPercentage: 37.5,
      outArcThrowsPercentage: 0.0,
      freeThrowsPercentage: 66.7,
      inArcThrowsAVG: 1.0,
      outArcThrowsAVG: 0.0,
      foulsAVG: 2.0,
      plusMinusAVG: 0.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_12',
      stats: { games: 18, points: 72, pointsPerGame: 4.0, foulsPerGame: 1.9 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 6, pointsPerGame: 3.0, freeThrowsPercentage: 66.7 }]
    }
  },
  {
    fid: 'bba_p_13',
    name: 'Maurizio',
    lastName: 'Lepore',
    number: '13',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 1,
      timePlayedAVG: 8,
      pointsAVG: 1.0,
      inArcThrowsPercentage: 50.0,
      outArcThrowsPercentage: 0.0,
      freeThrowsPercentage: 0.0,
      inArcThrowsAVG: 0.5,
      outArcThrowsAVG: 0.0,
      foulsAVG: 1.0,
      plusMinusAVG: -1.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_13',
      stats: { games: 10, points: 20, pointsPerGame: 2.0, foulsPerGame: 0.8 },
      seasonStats: [{ seasonName: '2024/2025', games: 1, points: 1, pointsPerGame: 1.0, freeThrowsPercentage: 0 }]
    }
  },
  {
    fid: 'bba_p_22',
    name: 'Amedeo',
    lastName: 'Decuzzi',
    number: '22',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 24,
      pointsAVG: 10.5,
      inArcThrowsPercentage: 55.6,
      outArcThrowsPercentage: 0.0,
      freeThrowsPercentage: 62.5,
      inArcThrowsAVG: 4.5,
      outArcThrowsAVG: 0.0,
      foulsAVG: 2.5,
      plusMinusAVG: 4.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_22',
      stats: { games: 32, points: 352, pointsPerGame: 11.0, foulsPerGame: 2.6 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 21, pointsPerGame: 10.5, freeThrowsPercentage: 62.5 }]
    }
  },
  {
    fid: 'bba_p_31',
    name: 'Emanuele',
    lastName: 'Cuomo',
    number: '31',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 1,
      timePlayedAVG: 9,
      pointsAVG: 2.0,
      inArcThrowsPercentage: 50.0,
      outArcThrowsPercentage: 0.0,
      freeThrowsPercentage: 0.0,
      inArcThrowsAVG: 1.0,
      outArcThrowsAVG: 0.0,
      foulsAVG: 1.0,
      plusMinusAVG: 0.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_31',
      stats: { games: 14, points: 42, pointsPerGame: 3.0, foulsPerGame: 1.1 },
      seasonStats: [{ seasonName: '2024/2025', games: 1, points: 2, pointsPerGame: 2.0, freeThrowsPercentage: 0 }]
    }
  },
  {
    fid: 'bba_p_32',
    name: 'Armando',
    lastName: 'Oddo Casano',
    number: '32',
    starting: true,
    startPercentage: '50%',
    startsCount: 1,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 20,
      pointsAVG: 6.5,
      inArcThrowsPercentage: 44.4,
      outArcThrowsPercentage: 25.0,
      freeThrowsPercentage: 75.0,
      inArcThrowsAVG: 2.5,
      outArcThrowsAVG: 0.5,
      foulsAVG: 2.0,
      plusMinusAVG: 1.5,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_32',
      stats: { games: 26, points: 208, pointsPerGame: 8.0, foulsPerGame: 2.0 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 13, pointsPerGame: 6.5, freeThrowsPercentage: 75 }]
    }
  },
  {
    fid: 'bba_p_34',
    name: 'Gerardo',
    lastName: 'Spisso',
    number: '34',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 15,
      pointsAVG: 4.0,
      inArcThrowsPercentage: 40.0,
      outArcThrowsPercentage: 20.0,
      freeThrowsPercentage: 66.7,
      inArcThrowsAVG: 1.5,
      outArcThrowsAVG: 0.5,
      foulsAVG: 1.5,
      plusMinusAVG: 0.5,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_34',
      stats: { games: 20, points: 100, pointsPerGame: 5.0, foulsPerGame: 1.5 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 8, pointsPerGame: 4.0, freeThrowsPercentage: 66.7 }]
    }
  },
  {
    fid: 'bba_p_35',
    name: 'Marco',
    lastName: 'Girardi',
    number: '35',
    starting: false,
    startPercentage: '0%',
    startsCount: 0,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 1,
      timePlayedAVG: 10,
      pointsAVG: 2.0,
      inArcThrowsPercentage: 50.0,
      outArcThrowsPercentage: 0.0,
      freeThrowsPercentage: 0.0,
      inArcThrowsAVG: 1.0,
      outArcThrowsAVG: 0.0,
      foulsAVG: 1.0,
      plusMinusAVG: 0.0,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_35',
      stats: { games: 12, points: 36, pointsPerGame: 3.0, foulsPerGame: 1.0 },
      seasonStats: [{ seasonName: '2024/2025', games: 1, points: 2, pointsPerGame: 2.0, freeThrowsPercentage: 0 }]
    }
  },
  {
    fid: 'bba_p_43',
    name: 'Antoine',
    lastName: 'Ghanem',
    number: '43',
    starting: true,
    startPercentage: '50%',
    startsCount: 1,
    team: { fid: BBA_TEAM_ID, name: 'BARONISSI BASKETBALL ACADEMY' },
    stats: {
      games: 2,
      timePlayedAVG: 23,
      pointsAVG: 7.0,
      inArcThrowsPercentage: 46.7,
      outArcThrowsPercentage: 30.0,
      freeThrowsPercentage: 70.0,
      inArcThrowsAVG: 2.0,
      outArcThrowsAVG: 1.0,
      foulsAVG: 1.5,
      plusMinusAVG: 2.5,
      reboundsAVG: 0,
      assistsAVG: 0
    },
    uniquePlayer: {
      id: 'up_bba_43',
      stats: { games: 25, points: 200, pointsPerGame: 8.0, foulsPerGame: 1.8 },
      seasonStats: [{ seasonName: '2024/2025', games: 2, points: 14, pointsPerGame: 7.0, freeThrowsPercentage: 70 }]
    }
  }
];

rosters[BBA_TEAM_ID] = bbaPlayersRoster;
rosters['team_bba_academy'] = bbaPlayersRoster;
fs.writeFileSync(rostersPath, JSON.stringify(rosters, null, 2), 'utf-8');
console.log('✅ Injected BBA into league_rosters.json');
