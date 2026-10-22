import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJSON } from '../src/ai/openrouter.js';

test('AI Module — Robust JSON Parser (extractJSON)', async (t) => {
  await t.test('parses clean JSON object with Amharic Unicode', () => {
    const input = '{"title": "ፍቅር", "verse": "እግዚአብሔር ፍቅር ነው፤ በፍቅርም የሚኖር በእግዚአብሔር ይኖራል"}';
    const result = extractJSON(input);
    assert.equal(result.title, 'ፍቅር');
    assert.ok(result.verse.includes('እግዚአብሔር ፍቅር ነው'));
  });

  await t.test('parses clean JSON array', () => {
    const input = '[{"slide": 1, "title": "ስብከት"}, {"slide": 2, "title": "ጸሎት"}]';
    const result = extractJSON(input);
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 2);
    assert.equal(result[0].title, 'ስብከት');
    assert.equal(result[1].title, 'ጸሎት');
  });

  await t.test('extracts JSON from markdown ```json ``` code fence', () => {
    const input = 'Here is the response:\n```json\n{\n  "event": "ልደታ ለማርያም",\n  "mood": "devotional"\n}\n```\nHope this helps!';
    const result = extractJSON(input);
    assert.equal(result.event, 'ልደታ ለማርያም');
    assert.equal(result.mood, 'devotional');
  });

  await t.test('extracts JSON from generic markdown ``` ``` code fence', () => {
    const input = '```\n{\n  "theme": "ተስፋ",\n  "count": 5\n}\n```';
    const result = extractJSON(input);
    assert.equal(result.theme, 'ተስፋ');
    assert.equal(result.count, 5);
  });

  await t.test('extracts JSON embedded in conversational chat text without fences', () => {
    const input = 'I have carefully prepared your content according to the 81-book canon: {"theme": "ንስሐ", "quote": "ንስሐ ግቡ፥ መንግሥተ ሰማያት ቀርባለችና።"} God bless your ministry!';
    const result = extractJSON(input);
    assert.equal(result.theme, 'ንስሐ');
    assert.ok(result.quote.includes('መንግሥተ ሰማያት ቀርባለችና'));
  });

  await t.test('correctly preserves Ethiopian liturgical punctuation (። ፣ ፤ ፥)', () => {
    const input = '{"punctuation": "ማቴዎስ ፭፥፰፤ ብፁዓን ንጹሐነ ልብ፥ እግዚአብሔርን ያዩታልና።"}';
    const result = extractJSON(input);
    assert.ok(result.punctuation.includes('፥'));
    assert.ok(result.punctuation.includes('፤'));
    assert.ok(result.punctuation.includes('።'));
  });

  await t.test('throws descriptive error on unparseable / corrupt text', () => {
    assert.throws(() => {
      extractJSON('This is pure text with no JSON at all.');
    }, /Invalid JSON format from AI/);
  });

  await t.test('throws error on truncated JSON syntax', () => {
    assert.throws(() => {
      extractJSON('{"title": "Broken", "content": "incomplete text...');
    }, /Invalid JSON format from AI/);
  });
});
