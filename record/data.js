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
    function caseStatus(record) {
        return record.archived ? 'Terminated' : record.status;
    }
    const manilaDate = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
    });
    function completedAppointmentsByDate() {
        const counts = new Map();
        for (const record of load()) {
            const createdAt = Date.parse(record.createdAt);
            const date = Number.isFinite(createdAt) ? manilaDate.format(createdAt) : record.date;
            if (date) counts.set(date, (counts.get(date) || 0) + 1);
        }
        return counts;
    }
    return { load, save, caseStatus, completedAppointmentsByDate };
})();
