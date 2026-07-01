// Auto-suggests related_events links between existing Event documents based on
// shared tags, overlapping/adjacent time range, and matching place/area names.
// Any manually curated related_events already on a document are always preserved
// and never count against that event's link cap - only auto-suggested links do.
//
// Each event picks its own best matches independently (not forced to be mutual),
// so a event doesn't get flooded with links just because many other events
// happen to rank it as one of their best matches.
const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

const MAX_LINKS_PER_EVENT = 5;
const MIN_SCORE = 3;
const ERA_PROXIMITY_YEARS = 150;
const PLACE_BONUS = 2;
const ERA_BONUS = 1;

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

function getRange(event) {
  if (event.event_type === 'period') {
    return [event.start_year, event.end_year];
  }
  if (typeof event.year === 'number') {
    return [event.year, event.year];
  }
  return [null, null];
}

function rangesOverlapOrNear(a, b, proximity) {
  const [aStart, aEnd] = a;
  const [bStart, bEnd] = b;
  if (aStart === null || bStart === null) return false;
  return aEnd >= bStart - proximity && bEnd >= aStart - proximity;
}

function placeMatch(a, b) {
  const aPlace = normalize(a.area_name || a.place_name);
  const bPlace = normalize(b.area_name || b.place_name);
  if (!aPlace || !bPlace) return false;
  if (aPlace === bPlace) return true;
  // Loose match on a shared significant word (e.g. "Roman Empire" vs "Rome")
  const aWords = aPlace.split(/\s+/).filter(w => w.length > 3);
  const bWords = bPlace.split(/\s+/).filter(w => w.length > 3);
  return aWords.some(w => bWords.includes(w));
}

// Rare, specific tags (e.g. "harappan") are much stronger signals of relatedness
// than tags shared by dozens of events (e.g. "political", "india"). Without this,
// a single generic shared tag was enough to link every event from the same year.
function buildTagIdf(events) {
  const docFreq = new Map();
  for (const event of events) {
    for (const tag of new Set((event.tags || []).map(normalize))) {
      docFreq.set(tag, (docFreq.get(tag) || 0) + 1);
    }
  }
  const n = events.length;
  const idf = new Map();
  for (const [tag, freq] of docFreq.entries()) {
    idf.set(tag, Math.log((n + 1) / (freq + 1)) + 1);
  }
  return idf;
}

function scorePair(a, b, tagIdf) {
  let score = 0;

  const aTags = new Set((a.tags || []).map(normalize));
  const bTags = new Set((b.tags || []).map(normalize));
  for (const tag of aTags) {
    if (bTags.has(tag)) score += tagIdf.get(tag) || 1;
  }

  if (placeMatch(a, b)) score += PLACE_BONUS;
  if (rangesOverlapOrNear(getRange(a), getRange(b), ERA_PROXIMITY_YEARS)) score += ERA_BONUS;

  return score;
}

async function linkRelatedEvents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const events = await Event.find({}).select(
      'title tags area_name place_name year start_year end_year event_type related_events'
    );
    console.log(`Loaded ${events.length} events`);

    const tagIdf = buildTagIdf(events);

    // candidates[i] = [{ id, score }, ...] sorted desc, computed independently per event
    const candidates = events.map(() => []);
    for (let i = 0; i < events.length; i++) {
      for (let j = 0; j < events.length; j++) {
        if (i === j) continue;
        const score = scorePair(events[i], events[j], tagIdf);
        if (score >= MIN_SCORE) {
          candidates[i].push({ id: events[j]._id.toString(), score });
        }
      }
      candidates[i].sort((x, y) => y.score - x.score);
    }

    let totalAutoLinks = 0;
    const operations = events.map((event, i) => {
      const existing = [...new Set((event.related_events || []).map(id => id.toString()))];
      const remainingSlots = Math.max(0, MAX_LINKS_PER_EVENT - existing.length);
      const autoLinks = candidates[i]
        .filter(c => !existing.includes(c.id))
        .slice(0, remainingSlots)
        .map(c => c.id);
      totalAutoLinks += autoLinks.length;

      const merged = [...existing, ...autoLinks];

      return {
        updateOne: {
          filter: { _id: event._id },
          update: { $set: { related_events: merged, updated_at: new Date() } }
        }
      };
    });

    const result = await Event.bulkWrite(operations, { ordered: false });
    console.log(`Added ${totalAutoLinks} auto-suggested links across ${events.length} events.`);
    console.log(`Documents modified: ${result.modifiedCount || 0}`);
    console.log('Auto-linking complete.');
  } catch (error) {
    console.error('Error linking related events:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

linkRelatedEvents();
