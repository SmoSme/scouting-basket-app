import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- RUNNING PHASE 4.10 VERIFICATION TESTS ---');

// 1. Verify getMatchEvents in matchMetadataService.js and supabase.js
const metaServiceContent = fs.readFileSync('src/services/matchMetadataService.js', 'utf8');
const supaServiceContent = fs.readFileSync('src/services/supabase.js', 'utf8');

assert(metaServiceContent.includes('export async function getMatchEvents(matchId)'), 'getMatchEvents must accept matchId in matchMetadataService.js');
assert(metaServiceContent.includes(".eq('match_id', matchId)"), "getMatchEvents must filter strictly by .eq('match_id', matchId) in matchMetadataService.js");
assert(!metaServiceContent.includes("getMatchEvents(matchName)"), 'getMatchEvents must not accept matchName');
assert(!metaServiceContent.includes("eq('Match_Name', matchId)"), 'getMatchEvents must not filter by Match_Name');

assert(supaServiceContent.includes('export async function getMatchEvents(matchId)'), 'getMatchEvents must accept matchId in supabase.js');
assert(supaServiceContent.includes(".eq('match_id', matchId)"), "getMatchEvents must filter strictly by .eq('match_id', matchId) in supabase.js");
console.log('Test 1 Passed: Supabase fetch queries refactored strictly to match_id relations.');

// 2. Verify Archive.jsx reads directly from scouting_matches and passes match.id (UUID)
const archiveContent = fs.readFileSync('src/pages/Archive.jsx', 'utf8');
assert(archiveContent.includes('fetchScoutingMatches()'), 'Archive.jsx must fetch matches from scouting_matches');
assert(archiveContent.includes('matchId={reviewMatch.id}'), 'Archive.jsx must pass matchId={reviewMatch.id} to MatchReviewModal');
assert(!archiveContent.includes(".eq('Match_Name', match.name)"), 'Archive.jsx must not have legacy string-matching queries for opening match review');
console.log('Test 2 Passed: Archive.jsx reads from scouting_matches and routes match.id to MatchReviewModal.');

// 3. Verify SeasonTrends.jsx passes match.id (UUID) to MatchReviewModal
const seasonTrendsContent = fs.readFileSync('src/pages/SeasonTrends.jsx', 'utf8');
assert(seasonTrendsContent.includes('matchId={reviewMatch.id}'), 'SeasonTrends.jsx must pass matchId={reviewMatch.id} to MatchReviewModal');
assert(seasonTrendsContent.includes('getMatchEvents(matchId)'), 'SeasonTrends.jsx must fetch events strictly via getMatchEvents(matchId)');
assert(!seasonTrendsContent.includes(".eq('Match_Name', match.name)"), 'SeasonTrends.jsx must not have legacy string-matching queries in handleOpenReview');
console.log('Test 3 Passed: SeasonTrends.jsx passes match.id to MatchReviewModal and uses relational getMatchEvents.');

// 4. Verify MatchReviewModal.jsx reads match_id on mount, uses getMatchEvents, and computes analytics from events array
const matchReviewModalContent = fs.readFileSync('src/components/MatchReviewModal.jsx', 'utf8');
assert(matchReviewModalContent.includes('matchId'), 'MatchReviewModal must accept matchId prop');
assert(matchReviewModalContent.includes('getMatchEvents(activeMatchId)'), 'MatchReviewModal must fetch events with getMatchEvents(activeMatchId) on mount');
assert(matchReviewModalContent.includes('calculateMatchAnalytics(\n      events'), 'calculateMatchAnalytics must strictly compute analytics from events state');
assert(matchReviewModalContent.includes('filteredEvents = useMemo(() => {\n    const rawEvents = events || [];'), 'filteredEvents must strictly consume events state');
assert(matchReviewModalContent.includes('CourtPitchMap'), 'CourtPitchMap must be present');
assert(matchReviewModalContent.includes('events={events}'), 'CourtPitchMap must consume events state');
assert(!matchReviewModalContent.includes("event.Match_Name === currentMatch.name"), 'MatchReviewModal must not filter events by Match_Name string');
console.log('Test 4 Passed: MatchReviewModal.jsx reads match_id on mount, fetches relational events, and computes analytics strictly on events.');

// 5. Verify Zero System Emojis in src/
const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

function checkEmojisInDir(dir) {
  const files = fs.readdirSync(dir);
  let emojiCount = 0;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      emojiCount += checkEmojisInDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (emojiRegex.test(content)) {
        console.warn(`Emoji found in: ${fullPath}`);
        emojiCount++;
      }
    }
  }
  return emojiCount;
}

const totalEmojis = checkEmojisInDir('src');
assert.strictEqual(totalEmojis, 0, `Expected 0 emojis in src/, but found ${totalEmojis}`);
console.log('Test 5 Passed: Strictly 0 emojis in src/.');

console.log('--- ALL PHASE 4.10 TESTS PASSED SUCCESSFULLY! ---');
