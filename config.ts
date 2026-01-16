export const config = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    adminPin: import.meta.env.VITE_ADMIN_PIN || '1234'
};

// Debug logic for production diagnosis
if (import.meta.env.PROD && !config.supabaseUrl) {
    console.error('Environment Variables Missing!');
    console.log('VITE_SUPABASE_URL exists:', !!import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
}
