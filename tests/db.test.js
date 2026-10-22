import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDuplicate,
  saveQuote,
  isConfigured,
  getStats
} from '../src/db/supabase.js';

test('Database & Deduplication Engine', async (t) => {
  await t.test('checkDuplicate returns false for empty or null inputs', async () => {
    assert.equal(await checkDuplicate(null), false);
    assert.equal(await checkDuplicate(''), false);
    assert.equal(await checkDuplicate(undefined), false);
  });

  await t.test('isConfigured reports boolean status', () => {
    const configured = isConfigured();
    assert.equal(typeof configured, 'boolean');
  });

  await t.test('saveQuote persists content and checkDuplicate detects it', async () => {
    const uniqueText = `Unit test spiritual quote — ${Date.now()} — እግዚአብሔር ይመስገን`;
    
    // Before saving, should not be duplicate
    const beforeCheck = await checkDuplicate(uniqueText, 'quote');
    assert.equal(beforeCheck, false);

    // Save
    const saved = await saveQuote(uniqueText, 'quote');
    assert.ok(saved);
    assert.equal(saved.text, uniqueText);
    assert.equal(saved.content_type, 'quote');
    assert.ok(saved.created_at);

    // After saving, should be detected as duplicate
    const afterCheck = await checkDuplicate(uniqueText, 'quote');
    assert.equal(afterCheck, true);
  });

  await t.test('getStats returns total count and valid source', async () => {
    const stats = await getStats();
    assert.ok(stats);
    assert.equal(typeof stats.total, 'number');
    assert.ok(stats.total >= 0);
    assert.ok(stats.source === 'supabase' || stats.source === 'local_cache');
  });
});
