(function () {
    'use strict';
    const config = window.PROTECT_SUPABASE || {};
    let error = '';
    let client = null;
    if (!['http:', 'https:'].includes(location.protocol)) {
        error = 'Open this website using Live Server or a local HTTP server, not by double-clicking the HTML file.';
    } else if (!config.url || config.url.includes('PASTE_') || !config.publishableKey || config.publishableKey.includes('PASTE_')) {
        error = 'Supabase setup is incomplete. Add your Project URL and publishable key in auth/config.js.';
    } else if (!config.publishableKey.startsWith('sb_publishable_')) {
        error = 'Use a Supabase publishable key beginning with sb_publishable_. Never use a secret or service_role key.';
    } else if (!window.supabase) {
        error = 'The Supabase library could not load. Check your internet connection and reload.';
    } else {
        try {
            const url = new URL(config.url);
            if (url.protocol !== 'https:') throw new Error('Project URL must start with https://');
            client = window.supabase.createClient(config.url, config.publishableKey, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
            });
        } catch (failure) {
            error = 'Check the Project URL and publishable key in auth/config.js.';
        }
    }
    window.ProtectAuth = { client, error };
})();
