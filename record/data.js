'use strict';

window.ProtectStore = (() => {
    const key = 'protect-records-v2';
    // Discard the old seeded demo cache, without touching newer user-entered records.
    try { sessionStorage.removeItem('protect-demo-records-v1'); } catch (error) {}
    function load() {
        try {
            const saved = JSON.parse(sessionStorage.getItem(key));
            if (Array.isArray(saved)) return saved;
        } catch (error) { /* Storage may be unavailable when opening local files. */ }
        return [];
    }
    function save(records) {
        try { sessionStorage.setItem(key, JSON.stringify(records)); return true; }
        catch (error) { return false; }
    }
    return { load, save };
})();
