import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERIFIED_SCRIPTURES,
  getVerifiedVerse,
  sanitizeReference,
  searchCanonicalVerses,
  getVersesByBook,
  getTotalCanonicalCount
} from '../src/canon/scripture.js';

import {
  SYNAXARIUM_COMMEMORATIONS,
  getSynaxariumEntry,
  searchSynaxarium,
  getAllSynaxariumEntries
} from '../src/canon/synaxarium.js';

test('EOTC Canonical Scripture Engine', async (t) => {
  await t.test('repository contains comprehensive collection of canonical verses', () => {
    assert.ok(Array.isArray(VERIFIED_SCRIPTURES));
    assert.ok(VERIFIED_SCRIPTURES.length >= 100, `Expected >= 100 verses, got ${VERIFIED_SCRIPTURES.length}`);
    assert.equal(getTotalCanonicalCount(), VERIFIED_SCRIPTURES.length);
  });

  await t.test('each verse record has complete required metadata', () => {
    for (const v of VERIFIED_SCRIPTURES.slice(0, 20)) {
      assert.ok(v.theme, 'Verse must have a theme');
      assert.ok(v.verse && v.verse.length > 5, 'Verse must contain substantive Amharic text');
      assert.ok(v.reference, 'Verse must have a reference');
      assert.ok(v.book, 'Verse must have a book name');
      assert.ok(typeof v.chapter === 'number', 'Chapter must be a number');
      assert.ok(Array.isArray(v.keywords), 'Keywords must be an array');
    }
  });

  await t.test('getVerifiedVerse returns relevant verse by theme or keyword', () => {
    const verseLove = getVerifiedVerse('ፍቅር');
    assert.ok(verseLove);
    assert.ok(typeof verseLove.verse === 'string');
    assert.ok(typeof verseLove.reference === 'string');

    const verseFaith = getVerifiedVerse('እምነት');
    assert.ok(verseFaith);
  });

  await t.test('getVerifiedVerse falls back gracefully for unmatched terms', () => {
    const fallback = getVerifiedVerse('randomNonExistentString12345');
    assert.ok(fallback);
    assert.ok(fallback.verse.length > 0);
    assert.ok(fallback.reference.length > 0);
  });

  await t.test('sanitizeReference converts Arabic chapters and verses to Ge\'ez numerals', () => {
    // 5:8 -> ፭፥፰
    const ref1 = sanitizeReference('ማቴዎስ 5:8');
    assert.equal(ref1, 'ማቴዎስ ፭፥፰');

    // 14:6 -> ፲፬፥፮
    const ref2 = sanitizeReference('ዮሐንስ 14:6');
    assert.equal(ref2, 'ዮሐንስ ፲፬፥፮');

    // 1:1-2 -> ፩፥፩-፪
    const ref3 = sanitizeReference('ዘፍጥረት 1:1-2');
    assert.ok(ref3.includes('፩፥፩'));
  });

  await t.test('searchCanonicalVerses filters accurately', () => {
    const results = searchCanonicalVerses('ፍቅር');
    assert.ok(results.length > 0);
    for (const r of results) {
      const match = r.verse.includes('ፍቅር') || r.theme.includes('ፍቅር') || r.keywords.some(k => k.includes('ፍቅር'));
      assert.ok(match, 'Result should match search term');
    }
  });

  await t.test('getVersesByBook returns verses for specific canonical books', () => {
    const genesisVerses = getVersesByBook('ዘፍጥረት');
    assert.ok(genesisVerses.length > 0);
    for (const v of genesisVerses) {
      assert.equal(v.book, 'ዘፍጥረት');
    }
  });
});

test('EOTC Synaxarium Engine', async (t) => {
  await t.test('contains all 30 days of monthly commemorations', () => {
    const days = Object.keys(SYNAXARIUM_COMMEMORATIONS).map(Number);
    assert.equal(days.length, 30);
    for (let day = 1; day <= 30; day++) {
      assert.ok(SYNAXARIUM_COMMEMORATIONS[day], `Day ${day} must be defined in Synaxarium`);
      assert.ok(SYNAXARIUM_COMMEMORATIONS[day].saint, `Day ${day} must have saint name`);
      assert.ok(SYNAXARIUM_COMMEMORATIONS[day].synaxariumExcerpt, `Day ${day} must have synaxariumExcerpt`);
    }
  });

  await t.test('getSynaxariumEntry returns correct saint for major monthly days', () => {
    // Day 21: Virgin Mary
    const day21 = getSynaxariumEntry(21);
    assert.ok(day21.saint.includes('ማርያም'));

    // Day 24: Abune Tekle Haymanot
    const day24 = getSynaxariumEntry(24);
    assert.ok(day24.saint.includes('ተክለ ሃይማኖት'));

    // Day 12: Archangel Michael
    const day12 = getSynaxariumEntry(12);
    assert.ok(day12.saint.includes('ሚካኤል'));

    // Day 27: Medhane Alem (Savior of the World)
    const day27 = getSynaxariumEntry(27);
    assert.ok(day27.saint.includes('መድኃኔዓለም'));
  });

  await t.test('getSynaxariumEntry handles out-of-bounds days safely', () => {
    const day0 = getSynaxariumEntry(0);
    assert.equal(day0, null);

    const day32 = getSynaxariumEntry(32);
    assert.equal(day32, null);
  });

  await t.test('searchSynaxarium finds saints by query', () => {
    const maryResults = searchSynaxarium('ማርያም');
    assert.ok(maryResults.length > 0);

    const michaelResults = searchSynaxarium('ሚካኤል');
    assert.ok(michaelResults.length > 0);
  });

  await t.test('getAllSynaxariumEntries returns all 30 entries array', () => {
    const all = getAllSynaxariumEntries();
    assert.equal(all.length, 30);
  });
});
