import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('db');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_CACHE_PATH = path.join(__dirname, '../../output/.history_cache.json');

const getEnv = (key) => process.env[key];

const SUPABASE_URL = () => getEnv('SUPABASE_URL');
const SUPABASE_KEY = () => getEnv('SUPABASE_KEY');
const SUPABASE_TABLE = () => getEnv('SUPABASE_TABLE') || 'quotes';

let supabase = null;

// ─── Local JSON Cache Fallback ──────────────────────────────────────────────
function getLocalCache() {
  try {
    if (fs.existsSync(LOCAL_CACHE_PATH)) {
      const raw = fs.readFileSync(LOCAL_CACHE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveLocalCache(entry) {
  try {
    const list = getLocalCache();
    list.unshift(entry);
    // Keep last 500 items
    const trimmed = list.slice(0, 500);
    const dir = path.dirname(LOCAL_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_CACHE_PATH, JSON.stringify(trimmed, null, 2));
  } catch (err) {
    log.warn('Local cache write failed', { error: err.message });
  }
}

export function getSupabase() {
  if (supabase) return supabase;
  
  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();
  
  if (url && key) {
    try {
      supabase = createClient(url, key, {
        auth: { persistSession: false }
      });
      return supabase;
    } catch (e) {
      log.warn('Supabase client initialization error', { error: e.message });
      return null;
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      log.debug('Retrying DB operation', { attempt: i + 1, retries, delayMs: delay });
      await sleep(delay);
    }
  }
}

export async function checkDuplicate(text, contentType = 'quote') {
  if (!text) return false;
  const db = getSupabase();
  
  if (!db) {
    // Check local cache
    const cache = getLocalCache();
    const found = cache.some(item => item.text === text);
    if (found) log.info(`Duplicate ${contentType} detected in local cache`, { contentType });
    return found;
  }

  try {
    // IMPORTANT: With { head: true }, Supabase issues a HEAD request.
    // `data` is always null. The match count is in the `count` field.
    const { count, error } = await retryOperation(() => 
      db
        .from(SUPABASE_TABLE())
        .select('*', { count: 'exact', head: true })
        .eq('text', text)
    );

    if (error) {
      log.warn('Supabase duplicate check error, falling back to cache', { error: error.message });
      // Fallback to local cache
      const cache = getLocalCache();
      return cache.some(item => item.text === text);
    }

    const isDuplicate = (count || 0) > 0;
    if (isDuplicate) {
      log.info(`Duplicate ${contentType} detected in database`, { contentType, count });
    }
    return isDuplicate;
  } catch (error) {
    // Fallback to local cache
    const cache = getLocalCache();
    return cache.some(item => item.text === text);
  }
}

export async function saveQuote(text, contentType = 'quote') {
  const timestamp = new Date().toISOString();
  const entry = {
    text,
    created_at: timestamp,
    source: process.env.GOOGLE_AI_STUDIO_API ? 'google-ai-studio' : 'openrouter',
    model: process.env.AI_MODEL || 'gemini-2.5-flash',
    content_type: contentType
  };

  // Always write to local backup cache
  saveLocalCache(entry);

  const db = getSupabase();
  if (!db) {
    log.info(`Recorded ${contentType} to local offline store`, { contentType });
    return { demo: true, ...entry };
  }

  try {
    const { data, error } = await retryOperation(() =>
      db
        .from(SUPABASE_TABLE())
        .insert([entry])
        .select()
    );

    if (error) {
      log.warn('Supabase save notice, saved to local cache', { error: error.message });
      return entry;
    }

    log.info(`Successfully saved ${contentType} to database`, { contentType });
    return data;
  } catch (error) {
    log.warn('Database save failed, stored in local cache', { error: error.message });
    return entry;
  }
}

export const recordContent = saveQuote;

export async function getStats() {
  const db = getSupabase();
  if (!db) {
    const local = getLocalCache();
    return { total: local.length, source: 'local_cache' };
  }
  
  try {
    const { count, error } = await db
      .from(SUPABASE_TABLE())
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      const local = getLocalCache();
      return { total: local.length, source: 'local_cache' };
    }
    return { total: count || 0, source: 'supabase' };
  } catch {
    const local = getLocalCache();
    return { total: local.length, source: 'local_cache' };
  }
}

export async function testConnection() {
  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();
  if (!url || !key) {
    return { configured: false, status: 'not_configured' };
  }

  const start = Date.now();
  try {
    const db = getSupabase();
    if (!db) return { configured: false, status: 'init_failed' };

    const { count, error } = await db
      .from(SUPABASE_TABLE())
      .select('*', { count: 'exact', head: true });

    const latencyMs = Date.now() - start;
    if (error) {
      return {
        configured: true,
        connected: false,
        error: error.message,
        latencyMs
      };
    }

    return {
      configured: true,
      connected: true,
      table: SUPABASE_TABLE(),
      totalRecords: count || 0,
      latencyMs
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      error: err.message,
      latencyMs: Date.now() - start
    };
  }
}

export function isConfigured() {
  return !!(SUPABASE_URL() && SUPABASE_KEY());
}