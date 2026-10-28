import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toEthiopianDate,
  toGeezNumerals,
  getComputusData,
  calculateMoveableFeasts,
  getLiturgicalContext,
  getFastingInfo,
  isPagume,
  DAILY_COMMEMORATIONS,
  ETHIOPIAN_MONTHS
} from '../src/utils/calendar.js';

test('EOTC Calendar Engine — Ethiopian Date Conversion', async (t) => {
  await t.test('converts standard Gregorian date to correct Ethiopian date', () => {
    // 2026-10-04 is Meskerem 24, 2019
    const eth = toEthiopianDate(new Date(2026, 9, 4));
    assert.equal(eth.year, 2019);
    assert.equal(eth.month, 1);
    assert.equal(eth.day, 24);
  });

  await t.test('correctly converts Ethiopian New Year (Enkutatash) in 2024 (Sep 11)', () => {
    // 2024-09-11 is Meskerem 1, 2017 (Enkutatash)
    const eth = toEthiopianDate(new Date(2024, 8, 11));
    assert.equal(eth.year, 2017);
    assert.equal(eth.month, 1);
    assert.equal(eth.day, 1);
  });

  await t.test('correctly identifies Pagume days (Sep 6, 2024 is Pagume 1)', () => {
    // 2024-09-06 is Pagume 1, 2016
    const sep6 = new Date(2024, 8, 6);
    const eth = toEthiopianDate(sep6);
    assert.equal(eth.month, 13);
    assert.equal(eth.day, 1);
    const pagumeInfo = isPagume(sep6);
    assert.equal(pagumeInfo.isPagume, true);
    assert.equal(pagumeInfo.day, 1);
    assert.equal(isPagume(new Date(2024, 8, 11)).isPagume, false);
  });
});

test('EOTC Calendar Engine — Ge\'ez Numerals Converter', async (t) => {
  await t.test('converts single digits correctly', () => {
    assert.equal(toGeezNumerals(1), '፩');
    assert.equal(toGeezNumerals(2), '፪');
    assert.equal(toGeezNumerals(3), '፫');
    assert.equal(toGeezNumerals(4), '፬');
    assert.equal(toGeezNumerals(5), '፭');
    assert.equal(toGeezNumerals(6), '፮');
    assert.equal(toGeezNumerals(7), '፯');
    assert.equal(toGeezNumerals(8), '፰');
    assert.equal(toGeezNumerals(9), '፱');
  });

  await t.test('converts tens and teens correctly', () => {
    assert.equal(toGeezNumerals(10), '፲');
    assert.equal(toGeezNumerals(11), '፲፩');
    assert.equal(toGeezNumerals(15), '፲፭');
    assert.equal(toGeezNumerals(19), '፲፱');
    assert.equal(toGeezNumerals(20), '፳');
    assert.equal(toGeezNumerals(21), '፳፩');
    assert.equal(toGeezNumerals(30), '፴');
    assert.equal(toGeezNumerals(50), '፶');
    assert.equal(toGeezNumerals(99), '፺፱');
  });

  await t.test('converts hundreds and thousands correctly', () => {
    assert.equal(toGeezNumerals(100), '፻');
    assert.equal(toGeezNumerals(101), '፻፩');
    assert.equal(toGeezNumerals(120), '፻፳');
    assert.equal(toGeezNumerals(200), '፪፻');
    assert.equal(toGeezNumerals(2016), '፳፻፲፮');
    assert.equal(toGeezNumerals(2017), '፳፻፲፯');
  });

  await t.test('handles non-positive numbers safely', () => {
    assert.equal(toGeezNumerals(0), '0');
    assert.equal(toGeezNumerals(-5), '-፭');
  });
});

test('EOTC Bahire Hasab — Computus Engine', async (t) => {
  await t.test('computes evangelist cycle correctly', () => {
    // 2016 EC % 4 = 0 -> John (ዮሐንስ)
    const data2016 = getComputusData(2016);
    assert.ok(data2016.evangelist.includes('ዮሐንስ'));

    // 2017 EC % 4 = 1 -> Matthew (ማቴዎስ)
    const data2017 = getComputusData(2017);
    assert.ok(data2017.evangelist.includes('ማቴዎስ'));

    // 2018 EC % 4 = 2 -> Mark (ማርቆስ)
    const data2018 = getComputusData(2018);
    assert.ok(data2018.evangelist.includes('ማርቆስ'));

    // 2019 EC % 4 = 3 -> Luke (ሉቃስ)
    const data2019 = getComputusData(2019);
    assert.ok(data2019.evangelist.includes('ሉቃስ'));
  });

  await t.test('computes Wenber, Abekte, and Metqe within canonical bounds', () => {
    const data = getComputusData(2019);
    assert.ok(data.wenber >= 0 && data.wenber < 19, `Wenber: ${data.wenber}`);
    assert.ok(data.abeqte >= 0 && data.abeqte < 30, `Abeqte: ${data.abeqte}`);
    assert.ok(typeof data.metqe === 'string' && data.metqe.length > 0, `Metqe: ${data.metqe}`);
  });

  await t.test('computes moveable feasts correctly for 2019 EC', () => {
    const feasts = calculateMoveableFeasts(2019);
    assert.ok(feasts.fasika, 'Fasika must be defined');
    assert.ok(feasts.fasika.month >= 7 && feasts.fasika.month <= 9, 'Fasika month must be Megabit or Miazia');
    assert.ok(feasts.abiyTsomStart, 'Abiy Tsom start must be defined');
    assert.ok(feasts.nenewe, 'Nineveh must be defined');
    assert.ok(feasts.erget, 'Ascension (Erget) must be defined');
    assert.ok(feasts.perakletos, 'Pentecost (Perakletos) must be defined');
  });
});

test('EOTC Liturgical Context Engine', async (t) => {
  await t.test('returns full liturgical context with event and mood', () => {
    const ctx = getLiturgicalContext(new Date(2026, 9, 4));
    assert.ok(ctx.ethiopianDate);
    assert.ok(ctx.event);
    assert.ok(ctx.mood);
    assert.ok(ctx.type);
  });

  await t.test('identifies monthly saint commemorations', () => {
    // 21st of any Ethiopian month is St. Mary (ድንግል ማርያም)
    assert.ok(DAILY_COMMEMORATIONS[21].saint.includes('ማርያም'));
    // 24th of any Ethiopian month is Abune Tekle Haymanot
    assert.ok(DAILY_COMMEMORATIONS[24].saint.includes('ተክለ ሃይማኖት'));
    // 12th is St. Michael (ሚካኤል)
    assert.ok(DAILY_COMMEMORATIONS[12].saint.includes('ሚካኤል'));
  });

  await t.test('identifies fasting rules for Wednesday and Friday', () => {
    const wednesday = new Date(2026, 9, 7); // Wednesday
    const fastInfoWed = getFastingInfo(wednesday);
    assert.ok(fastInfoWed !== undefined);
  });
});
