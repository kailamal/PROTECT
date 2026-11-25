'use strict';

window.ProtectVisits = (() => {
    const legacyKey = 'protect-walk-ins-v1';
    const officeDate = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
    });
    let sharedVisits = [];
    let pendingRefresh;

    function storagePrefix() {
        const userId = window.ProtectCurrentUser?.id;
        return userId ? `protect-walk-ins-v2:${userId}:` : '';
    }

    function legacyVisits() {
        try {
            const visits = JSON.parse(sessionStorage.getItem(legacyKey));
            return Array.isArray(visits) ? visits : [];
        } catch {
            return [];
        }
    }

    function manualVisits() {
        const prefix = storagePrefix();
        if (!prefix) return [];
        const visits = legacyVisits();
        try {
            for (const key of Object.keys(localStorage)) {
                if (!key.startsWith(prefix)) continue;
                const visit = JSON.parse(localStorage.getItem(key));
                if (visit) visits.push({ ...visit, id: key.slice(prefix.length) });
            }
        } catch { /* Keep showing visits from the current session if storage is unavailable. */ }
        return visits;
    }

    function load() {
        const records = window.ProtectCurrentProfile?.role === 'mobile_walk_ins' ? [] : ProtectStore.load();
        const registrations = records.filter(record => record.date).map(record => ({
            name: record.client, caseId: record.caseId, date: record.date,
            time: '', purpose: 'Case registration'
        }));
        const sharedIds = new Set(sharedVisits.map(visit => visit.id));
        const local = manualVisits().filter(visit => !sharedIds.has(visit.id));
        return [...sharedVisits, ...local, ...registrations].sort((a, b) =>
            b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    }

    function table() {
        return window.ProtectAuth.client.from('walk_in_visits');
    }

    async function add(visit) {
        const { data, error } = await table().insert(visit)
            .select('id,name,purpose,date,time,notes').single();
        if (error) throw error;
        await pendingRefresh?.catch(() => {});
        sharedVisits = [data, ...sharedVisits.filter(row => row.id !== data.id)];
    }

    async function fetchVisits() {
        const previous = manualVisits().filter(visit => visit.id && visit.time);
        if (previous.length) {
            const { error } = await table().upsert(previous.map(({ id, name, purpose, date, time, notes }) =>
                ({ id, name, purpose, date, time, notes: notes || '' })),
                { onConflict: 'id', ignoreDuplicates: true });
            if (!error) {
                try {
                    const prefix = storagePrefix();
                    previous.forEach(visit => localStorage.removeItem(prefix + visit.id));
                } catch { /* Shared IDs also prevent duplicate display. */ }
            }
        }
        const visits = [];
        const pageSize = 500;
        for (let start = 0; ; start += pageSize) {
            const { data, error } = await table().select('id,name,purpose,date,time,notes')
                .order('date', { ascending: false }).order('time', { ascending: false }).order('id')
                .range(start, start + pageSize - 1);
            if (error) throw error;
            visits.push(...data);
            if (data.length < pageSize) break;
        }
        sharedVisits = visits;
    }

    function today() {
        return officeDate.format(new Date());
    }

    function formatDate(date) {
        return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    function formatTime(time) {
        return time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-PH', {
            hour: 'numeric', minute: '2-digit', hour12: true
        }) : '—';
    }

    function watch(render, status) {
        async function refresh() {
            if (!window.ProtectCurrentUser || pendingRefresh) return;
            pendingRefresh = fetchVisits();
            try {
                await pendingRefresh;
                status.textContent = '';
            } catch {
                status.textContent = 'Could not sync walk-ins. Check your connection and sign-in.';
            } finally {
                pendingRefresh = null;
                render();
            }
        }
        window.addEventListener('protect-auth-ready', refresh);
        window.addEventListener('pageshow', refresh);
        window.addEventListener('focus', refresh);
        window.setInterval(() => { if (!document.hidden) refresh(); }, 5000);
    }

    return { load, add, today, formatDate, formatTime, watch };
})();
