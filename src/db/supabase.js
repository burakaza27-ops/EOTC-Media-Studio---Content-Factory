import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => process.env[key];

const SUPABASE_URL = () => getEnv('SUPABASE_URL');
const SUPABASE_KEY = () => getEnv('SUPABASE_KEY');
const SUPABASE_TABLE = () => getEnv('SUPABASE_TABLE') || 'quotes';

let supabase = null;

export function getSupabase() {
  if (supabase) return supabase;
  
  const url = SUPABASE_URL();
  const key = SUPABASE_KEY();
  
  if (url && key) {
    supabase = createClient(url, key, {
      auth: { persistSession: false }
    });
    console.log('✅ Supabase client initialized');
    return supabase;
  } else {
    console.log('⚠️ Supabase credentials not provided - running in demo mode');
    return null;
  }
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
      console.log(`⏳ Retrying DB operation in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

export async function checkDuplicate(text) {
  const db = getSupabase();
  
  if (!db) {
    console.log('📋 Demo mode: skipping duplicate check');
    return false;
  }

  try {
    const { data, error } = await retryOperation(() => 
      db
        .from(SUPABASE_TABLE())
        .select('id', { count: 'exact', head: true })
        .eq('text', text)
    );

    if (error) {
      console.error('❌ Supabase query error:', error.message);
      return false;
    }

    const isDuplicate = data?.length > 0;
    if (isDuplicate) {
      console.log('🔄 Duplicate detected in database');
    }
    return isDuplicate;
  } catch (error) {
    console.error('❌ Duplicate check failed:', error.message);
    return false;
  }
}

export async function saveQuote(text) {
  const db = getSupabase();
  
  if (!db) {
    console.log('📋 Demo mode: skipping save');
    return { demo: true };
  }

  try {
    const { data, error } = await retryOperation(() =>
      db
        .from(SUPABASE_TABLE())
        .insert([{ 
          text, 
          created_at: new Date().toISOString(),
          source: 'openrouter',
          model: process.env.AI_MODEL || 'gemini-2.0-flash'
        }])
        .select()
    );

    if (error) {
      console.error('❌ Supabase insert error:', error.message);
      return null;
    }

    console.log('✅ Quote saved to database');
    return data;
  } catch (error) {
    console.error('❌ Save failed:', error.message);
    return null;
  }
}

export async function getStats() {
  const db = getSupabase();
  if (!db) return null;
  
  try {
    const { count } = await db
      .from(SUPABASE_TABLE())
      .select('*', { count: 'exact', head: true });
    
    return { total: count || 0 };
  } catch {
    return null;
  }
}

export function isConfigured() {
  return !!getSupabase();
}