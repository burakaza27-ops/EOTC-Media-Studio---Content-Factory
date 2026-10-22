import test from 'node:test';
import assert from 'node:assert/strict';
import { logger, createChildLogger } from '../src/utils/logger.js';

test('Structured Logger Engine', async (t) => {
  await t.test('root logger initializes with core subsystem', () => {
    assert.ok(logger);
    assert.equal(typeof logger.info, 'function');
    assert.equal(typeof logger.warn, 'function');
    assert.equal(typeof logger.error, 'function');
    assert.equal(typeof logger.debug, 'function');
    assert.equal(typeof logger.trace, 'function');
    assert.equal(typeof logger.fatal, 'function');
  });

  await t.test('createChildLogger creates tagged child with specific subsystem', () => {
    const aiLog = createChildLogger('ai');
    assert.ok(aiLog);
    assert.equal(aiLog._subsystem, 'ai');

    const calendarLog = createChildLogger('calendar');
    assert.equal(calendarLog._subsystem, 'calendar');

    const dbLog = createChildLogger('db');
    assert.equal(dbLog._subsystem, 'db');
  });

  await t.test('child logger can spawn another child', () => {
    const parent = createChildLogger('pipeline');
    const child = parent.child('verse');
    assert.equal(child._subsystem, 'verse');
  });

  await t.test('logger methods execute without throwing for various data payloads', () => {
    const testLog = createChildLogger('test');
    assert.doesNotThrow(() => {
      testLog.debug('Debug event', { count: 12 });
      testLog.info('Info event', { status: 'ok', amharic: 'ሰላም' });
      testLog.warn('Warning event', { code: 'WARN_01' });
      testLog.error('Error event', { error: 'Test error message' });
      testLog.fatal('Fatal event', { fatal: true });
    });
  });

  await t.test('logger handles null, undefined, and empty data objects gracefully', () => {
    const testLog = createChildLogger('test');
    assert.doesNotThrow(() => {
      testLog.info('Empty data call');
      testLog.warn('Null data call', null);
      testLog.error('Undefined data call', undefined);
    });
  });
});
