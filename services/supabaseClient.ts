import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://agacswwyeivzxjpsdtmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYWNzd3d5ZWl2enhqcHNkdG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODg0NzgsImV4cCI6MjA4NDA2NDQ3OH0.Swnpy_8CiZrMDS3CmfenJyQ7VzIeDItk5CwoGHtJ7RQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
