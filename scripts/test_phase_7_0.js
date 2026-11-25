import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- STARTING PHASE 7.0 IT / EN LOCALIZATION AUDIT VERIFICATION ---');

const root = process.cwd();
const readSrc = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

// 1. Verify LanguageContext IT / EN dictionary key parity
console.log('\n[TEST 1] Verifying LanguageContext.jsx IT / EN dictionary key parity...');
const langFile = readSrc('src/context/LanguageContext.jsx');
const itMatch = langFile.match(/\bit:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*en:\s*\{/);
const enMatch = langFile.match(/\ben:\s*\{([\s\S]*?)\n\s*\}\s*\n\};/);
assert(itMatch && enMatch, 'Could not parse it/en blocks in LanguageContext.jsx');

const extractKeys = (block) => {
  const keys = new Set();
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (m) keys.add(m[1]);
  }
  return keys;
};

const itKeys = extractKeys(itMatch[1]);
const enKeys = extractKeys(enMatch[1]);
const missingInEn = [...itKeys].filter(k => !enKeys.has(k));
const missingInIt = [...enKeys].filter(k => !itKeys.has(k));
assert.strictEqual(missingInEn.length, 0, `Missing EN keys in LanguageContext: ${missingInEn.join(', ')}`);
assert.strictEqual(missingInIt.length, 0, `Missing IT keys in LanguageContext: ${missingInIt.join(', ')}`);
console.log(`  -> LanguageContext verified (${itKeys.size} matching IT/EN keys).`);

// 2. Verify PlayerProfileModal.jsx fixed t-object bug and localized strings
console.log('\n[TEST 2] Verifying PlayerProfileModal.jsx localization...');
const ppm = readSrc('src/components/PlayerProfileModal.jsx');
assert(!/\bt\.(backToRoster|fipVerifiedPill|shotDistTitle|shotDistSubtitle|ptsFrom2|ptsFrom3|ptsFromFt|historyTableTitle|colSeason|colTeam|colGp|colPpg|col2pm|col3pm|colFt|colFouls)\b/.test(ppm),
  'PlayerProfileModal must not index function prop t like a dictionary object');
assert(ppm.includes('Missing scouting for:'), 'PlayerProfileModal EN alert must list missing scouting matches');
assert(ppm.includes("'CAPITANO' : 'CAPTAIN'"), 'PlayerProfileModal CAPITANO/CAPTAIN must be localized');
assert(ppm.includes("'Profilo Bilanciato' : 'Balanced Profile'"), 'PlayerProfileModal Balanced Profile must be localized');
console.log('  -> PlayerProfileModal localization checks passed.');

// 3. Verify SeasonTrends.jsx localization
console.log('\n[TEST 3] Verifying SeasonTrends.jsx localization...');
const st = readSrc('src/pages/SeasonTrends.jsx');
for (const forbidden of [
  '>Segnati/G<',
  '>Subiti/G<',
  '>PUNTI / GARA<',
  '>FIP KING (PUNTEGGI & REGOLE)<',
  '<span>ANALISI</span>',
  'title="Ordina per ',
  'name="Punti Segnati"',
  'name="Effective FG%"',
  'name="Palle Perse"',
  'name="Defensive Rebound %"'
]) {
  assert(!st.includes(forbidden), `SeasonTrends still contains untranslated string: ${forbidden}`);
}
assert(st.includes("'Offensive Efficiency & Scoring Flow'"), 'SeasonTrends efficiency chart EN title present');
assert(st.includes("'Rebounding Control (DRB%)'"), 'SeasonTrends rebounding chart EN title present');
console.log('  -> SeasonTrends localization checks passed.');

// 4. Verify LeagueHub.jsx localization
console.log('\n[TEST 4] Verifying LeagueHub.jsx localization...');
const lh = readSrc('src/pages/LeagueHub.jsx');
assert(!lh.includes('{filteredStandings.length} {t.playersCount}'), 'Standings count must not use playersCount');
assert(!lh.includes('>Chiudi Legenda<'), 'Legend close button must be localized');
assert(!lh.includes('IMPORT LEAGUE JSON\n'), 'Importer modal header must be localized');
assert(lh.includes('function CustomTrendTooltip({ active, payload, lang = \'it\' })'), 'CustomTrendTooltip accepts lang');
assert(lh.includes('function CustomQuarterTooltip({ active, payload, lang = \'it\' })'), 'CustomQuarterTooltip accepts lang');
assert(lh.includes("lang === 'it' ? 'Squadre' : 'Teams'"), 'Standings teams count label localized');
console.log('  -> LeagueHub localization checks passed.');

// 5. Verify MatchReviewModal.jsx, BoxScoreTable.jsx, ScoreOverrideModal.jsx, MetricGuideModal.jsx, Navbar.jsx, Archive.jsx
console.log('\n[TEST 5] Verifying MatchReviewModal, BoxScoreTable, ScoreOverrideModal, MetricGuideModal, Archive, Navbar...');
const mrm = readSrc('src/components/MatchReviewModal.jsx');
assert(mrm.includes("'Panoramica Partita:' : 'Match Overview:'"), 'MatchReviewModal Overview banner localized');
assert(mrm.includes("'MATRICE RENDIMENTO PER QUARTO' : 'QUARTER-BY-QUARTER PERFORMANCE MATRIX'"), 'MatchReviewModal Quarters Matrix localized');
assert(mrm.includes("'TOTALI SQUADRA' : 'TEAM TOTALS'"), 'MatchReviewModal Box Score totals localized');
assert(mrm.includes("'TUTTI I GIOCATORI' : 'ALL PLAYERS'"), 'MatchReviewModal Play-by-Play filter localized');

const bst = readSrc('src/components/BoxScoreTable.jsx');
assert(bst.includes("'TABELLINO UFFICIALE FIBA' : 'OFFICIAL FIBA BOX SCORE'"), 'BoxScoreTable title localized');

const som = readSrc('src/components/ScoreOverrideModal.jsx');
assert(som.includes("'MODIFICA RISULTATO UFFICIALE' : 'OVERRIDE OFFICIAL SCORE'"), 'ScoreOverrideModal localized');

const mgm = readSrc('src/components/MetricGuideModal.jsx');
assert(mgm.includes('METRIC_GUIDES_IT'), 'MetricGuideModal IT guides present');

const nav = readSrc('src/components/Navbar.jsx');
assert(!nav.includes('title="Edit Game Session Name"'), 'Navbar Edit Game Session Name tooltip localized');
assert(!nav.includes('title="Manage Match Roster"'), 'Navbar Manage Match Roster tooltip localized');

const arch = readSrc('src/pages/Archive.jsx');
assert(!arch.includes('title="Scarica CSV"'), 'Archive Download CSV tooltip localized');
console.log('  -> All supporting modals & navigation localization checks passed.');

// 6. Enforce zero system emojis across src/
console.log('\n[TEST 6] Checking zero system emojis across src/...');
const walk = (dir) => {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (/\.(js|jsx|ts|tsx|css)$/.test(entry.name)) files.push(full);
  }
  return files;
};

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const violations = [];
for (const f of walk(path.join(root, 'src'))) {
  const txt = fs.readFileSync(f, 'utf8');
  if (emojiRegex.test(txt)) {
    violations.push(path.relative(root, f));
  }
}
assert.strictEqual(violations.length, 0, `Emoji found in files: ${violations.join(', ')}`);
console.log('  -> Zero emojis found in src/.');

console.log('\nALL PHASE 7.0 LOCALIZATION AUDIT CHECKS PASSED SUCCESSFULLY!');
