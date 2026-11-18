import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- STARTING PHASE 5.0 PRO SPORTS SAAS UI VERIFICATION SUITE ---');

// 1. Check index.html for Google Font Inter
console.log('\n[TEST 1] Verifying Google Font Inter in index.html...');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('fonts.googleapis.com'), 'index.html must connect to Google Fonts');
assert(indexHtml.includes('family=Inter:wght@400;500;600;700;800'), 'index.html must load Inter with weights 400, 500, 600, 700, 800');
console.log('  -> Google Font Inter loaded with weights 400, 500, 600, 700, 800.');

// 2. Check src/index.css for font-family: 'Inter' and design tokens
console.log('\n[TEST 2] Verifying CSS design system and typography in src/index.css...');
const indexCss = fs.readFileSync('src/index.css', 'utf8');
assert(indexCss.includes("font-family: 'Inter'"), "src/index.css must declare font-family: 'Inter'");
assert(indexCss.includes('#F4F6F8'), 'src/index.css must include #F4F6F8 canvas surface token');
console.log('  -> Typography and surface tokens correctly declared in src/index.css.');

// 3. Check SeasonTrends.jsx
console.log('\n[TEST 3] Verifying SeasonTrends.jsx SaaS UI Overhaul...');
const seasonTrends = fs.readFileSync('src/pages/SeasonTrends.jsx', 'utf8');

// A. No font-mono
assert(!seasonTrends.includes('font-mono'), 'SeasonTrends.jsx must have 0 font-mono classes');
console.log('  -> Zero font-mono classes in SeasonTrends.jsx.');

// B. Tabular numbers present
assert(seasonTrends.includes('tabular-nums'), 'SeasonTrends.jsx must utilize tabular-nums');
console.log('  -> tabular-nums applied throughout SeasonTrends.jsx.');

// C. Boxscore Strip cards in Match Log
assert(seasonTrends.includes('grid-cols-[1fr_auto_auto]'), 'SeasonTrends.jsx must have 2-row scoreboard grid with Q1-Q4 partials');
assert(seasonTrends.includes('homeTeamName') && seasonTrends.includes('awayTeamName'), 'SeasonTrends.jsx must render stacked Home/Away rows in strip card');
console.log('  -> Statastic-inspired Boxscore Strip cards verified in SeasonTrends.jsx.');

// D. Roster Table: No row-level FIP VERIFIED badge under player names
const rosterMatch = seasonTrends.match(/filteredRoster\.map[\s\S]*?<\/tbody>/);
assert(rosterMatch, 'Roster table body must exist in SeasonTrends.jsx');
assert(!rosterMatch[0].includes('FIP VERIFIED'), 'Roster table rows must NOT contain row-level FIP VERIFIED badges');
assert(!rosterMatch[0].includes('AMICHEVOLE'), 'Roster table rows must NOT contain row-level AMICHEVOLE badges');
console.log('  -> Roster table decluttered: row-level badges removed from SeasonTrends.jsx.');

// 4. Check LeagueHub.jsx
console.log('\n[TEST 4] Verifying LeagueHub.jsx Roster Table Decluttering...');
const leagueHub = fs.readFileSync('src/pages/LeagueHub.jsx', 'utf8');
const leagueRosterMatch = leagueHub.match(/filteredRoster\.map[\s\S]*?<\/tbody>/);
assert(leagueRosterMatch, 'Roster table body must exist in LeagueHub.jsx');
assert(!leagueRosterMatch[0].includes('FIP VERIFIED'), 'LeagueHub.jsx roster rows must NOT contain row-level FIP VERIFIED badges');
console.log('  -> Roster table decluttered: row-level badges removed from LeagueHub.jsx.');

// 5. Check PlayerProfileModal.jsx
console.log('\n[TEST 5] Verifying PlayerProfileModal.jsx Pro SaaS Redesign...');
const playerModal = fs.readFileSync('src/components/PlayerProfileModal.jsx', 'utf8');
assert(!playerModal.includes('font-mono'), 'PlayerProfileModal.jsx must have 0 font-mono classes');
assert(playerModal.includes('tabular-nums'), 'PlayerProfileModal.jsx must use tabular-nums');
assert(!playerModal.includes('#DDF3E9'), 'PlayerProfileModal.jsx must not use bright mint #DDF3E9');
assert(playerModal.includes('bg-slate-100 text-slate-700'), 'PlayerProfileModal.jsx must use soft neutral slate-100 for TOT pills');
console.log('  -> PlayerProfileModal.jsx fully modernized with neutral TOT pills and tabular-nums.');

// 6. Check Zero Emojis in src/
console.log('\n[TEST 6] Checking for zero system emojis across src/...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
function scanForEmojis(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanForEmojis(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.html')) {
      const text = fs.readFileSync(fullPath, 'utf8');
      const match = text.match(emojiRegex);
      assert(!match, `Emoji found in ${fullPath}: "${match ? match[0] : ''}"`);
    }
  }
}
scanForEmojis('src');
console.log('  -> Strictly ZERO system emojis found in src/ codebase.');

console.log('\nALL PHASE 5.0 DESIGN SYSTEM UPGRADES VERIFIED SUCCESSFULLY!');
