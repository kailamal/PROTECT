function noReport() {
    document.getElementById('feedback').textContent = 'No report snapshots are available.';
}
document.getElementById('report-button').addEventListener('click', noReport);

const trendExport = document.getElementById('trend-export');
trendExport.addEventListener('click', () => {
    const counts = ProtectStore.completedAppointmentsByDate();
    if (!counts.size) return;
    const rows = [...counts.keys()].sort().map(date => `${date},${counts.get(date)}`);
    const url = URL.createObjectURL(new Blob([['Date (Manila),Completed', ...rows].join('\r\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'completed-appointments.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function svgElement(name, attributes, label = '') {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (label) element.textContent = label;
    return element;
}

function renderAppointmentChart(counts, dates) {
    const chart = document.getElementById('appointment-chart');
    chart.toggleAttribute('hidden', dates.length === 0);
    chart.replaceChildren();
    if (!dates.length) return;

    const recentDates = dates.slice(-7);
    const peak = Math.max(...recentDates.map(date => counts.get(date)));
    const points = recentDates.map((date, index) => ({
        date,
        count: counts.get(date),
        x: recentDates.length === 1 ? 300 : 52 + index * 496 / (recentDates.length - 1),
        y: 155 - 118 * counts.get(date) / peak
    }));

    for (const y of [37, 96, 155]) {
        chart.append(svgElement('line', { x1: 32, x2: 568, y1: y, y2: y, class: 'grid-lines' }));
    }
    chart.append(svgElement('polyline', {
        points: points.map(({ x, y }) => `${x},${y}`).join(' '),
        class: 'trend-line', fill: 'none'
    }));
    for (const { x, y, count, date } of points) {
        chart.append(
            svgElement('circle', { cx: x, cy: y, r: 5, fill: '#3d63d7' }),
            svgElement('text', { x, y: y - 12, 'text-anchor': 'middle', class: 'point-labels' }, String(count)),
            svgElement('text', { x, y: 181, 'text-anchor': 'middle', class: 'month-labels' }, date)
        );
    }
}

function renderCompletedAppointments() {
    const counts = ProtectStore.completedAppointmentsByDate();
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    const dates = [...counts.keys()].sort();
    trendExport.disabled = total === 0;
    document.getElementById('completed-appointments-total').textContent =
        total === 0 ? '0 completed. Add a record in this tab to see it here.' : `${total} completed in total`;
    document.getElementById('completed-appointments-breakdown').hidden = total === 0;

    renderAppointmentChart(counts, dates);
    const rows = dates.reverse().map(date => {
        const row = document.createElement('tr');
        row.insertCell().textContent = date;
        row.insertCell().textContent = counts.get(date);
        return row;
    });
    document.getElementById('completed-appointments-dates').replaceChildren(...rows);
}

function renderCaseSummary() {
    const records = ProtectStore.load();
    const statusKeys = new Map([
        ['Active Supervision', 'active'],
        ['Terminated', 'terminated'],
        ['Absconding probationer', 'absconding']
    ]);
    const counts = { active: 0, terminated: 0, absconding: 0, other: 0 };
    let probation = 0;
    let parole = 0;
    for (const record of records) {
        counts[statusKeys.get(ProtectStore.caseStatus(record)) || 'other']++;
        if (record.supervision === 'Probation') probation++;
        if (record.supervision === 'Parole') parole++;
    }

    const total = records.length;
    const share = total ? counts.active / total * 100 : 0;
    document.getElementById('active-share').textContent = total ? `${share.toFixed(1)}%` : '—';
    document.getElementById('active-share-description').textContent =
        total ? `${counts.active} of ${total} total cases` : 'No cases recorded';
    document.getElementById('active-share-ring').style.setProperty('--share', `${share}%`);
    document.getElementById('case-total').textContent = `${total} total ${total === 1 ? 'case' : 'cases'}`;
    document.getElementById('supervision-breakdown').textContent = `Probation ${probation} · Parole ${parole}`;
    document.getElementById('other-status-row').hidden = counts.other === 0;

    const bar = document.getElementById('case-status-bar');
    bar.replaceChildren();
    for (const [status, count] of Object.entries(counts)) {
        document.getElementById(`${status}-legend`).textContent = count;
        const metric = document.getElementById(`${status}-total`);
        if (metric) metric.textContent = count;
        if (count === 0) continue;
        const segment = document.createElement('span');
        segment.className = `${status}-segment`;
        segment.style.flexGrow = count;
        bar.append(segment);
    }
}

function renderAnalytics() {
    renderCaseSummary();
    renderCompletedAppointments();
}

window.addEventListener('pageshow', renderAnalytics);
renderAnalytics();
