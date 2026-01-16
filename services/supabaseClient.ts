import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('Supabase Config Missing:', config);
    throw new Error('Supabase URL/Key missing. Check .env variables.');
}

export const supabase = createClient(config.supabaseUrl, config.supabaseKey);
