'use strict';

const byId = id => document.getElementById(id);
const followUps = [];
let selectedFollowUp = null;

function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function makeCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function showVisit(visit) {
    byId('visit-title').textContent = visit.name;
    byId('visit-details').replaceChildren();
    [['Time', visit.time], ['Date', formatDate(visit.date)], ['Purpose', visit.purpose],
        ['Case ID', visit.caseId || 'No linked case']].forEach(([label, value]) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = label;
        dd.textContent = value;
        byId('visit-details').append(dt, dd);
    });
    byId('case-link').hidden = !visit.caseId;
    byId('case-link').style.display = visit.caseId ? '' : 'none';
    byId('case-link').href = visit.caseId
        ? `../record/recordnames/recordnames.html?case=${encodeURIComponent(visit.caseId)}`
        : '../record/record.html';
    byId('visit-note').textContent = visit.caseId
        ? 'Open the linked case to review client information.'
        : 'No linked client record is available.';
    byId('visit-dialog').showModal();
}

function renderVisits() {
    const visits = ProtectStore.load()
        .filter(record => record.date)
        .map(record => ({
            name: record.client,
            caseId: record.caseId,
            date: record.date,
            time: '\u2014',
            purpose: 'Case registration'
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    byId('walk-in-count').textContent = `${visits.length} ${visits.length === 1 ? 'visit' : 'visits'} recorded`;
    byId('walk-in-body').replaceChildren();
    if (!visits.length) emptyRow('walk-in-body', 4, 'No walk-ins recorded.');
    visits.forEach(visit => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'visit-button';
        button.textContent = visit.name;
        button.setAttribute('aria-label', `View visit for ${visit.name}`);
        button.addEventListener('click', () => showVisit(visit));
        td.append(button);
        tr.append(td, makeCell(visit.time), makeCell(formatDate(visit.date)), makeCell(visit.purpose));
        byId('walk-in-body').append(tr);
    });
}

function renderFollowUps() {
    byId('follow-up-body').replaceChildren();
    followUps.forEach(item => {
        const row = document.createElement('tr');
        const client = document.createElement('td');
        const link = document.createElement('a');
        link.href = `../record/recordnames/recordnames.html?case=${encodeURIComponent(item.caseId)}`;
        link.textContent = `${item.name} \u00b7 ${item.caseId}`;
        link.className = 'visit-button';
        client.append(link);
        const status = document.createElement('td');
        const review = document.createElement('button');
        review.type = 'button';
        review.className = `review-button review-badge${item.status === 'Resolved' ? ' resolved' : ''}`;
        review.textContent = item.status;
        review.setAttribute('aria-label', `Review follow-up for ${item.name}: ${item.status}`);
        review.addEventListener('click', () => {
            selectedFollowUp = item;
            byId('review-client').textContent = `${item.name} \u00b7 ${item.caseId}`;
            byId('review-status').value = item.status;
            byId('review-note').value = item.note;
            byId('review-note').setCustomValidity('');
            byId('review-dialog').showModal();
        });
        status.append(review);
        row.append(client, makeCell(`${formatDate(item.date)} \u00b7 ${item.time}`), status, makeCell(item.officer));
        byId('follow-up-body').append(row);
    });
}

byId('close-visit').addEventListener('click', () => byId('visit-dialog').close());
byId('cancel-review').addEventListener('click', () => byId('review-dialog').close());
byId('review-note').addEventListener('input', () => byId('review-note').setCustomValidity(''));
byId('review-form').addEventListener('submit', event => {
    event.preventDefault();
    const note = byId('review-note').value.trim();
    if (!note) {
        byId('review-note').setCustomValidity('Enter a review note before saving.');
        byId('review-note').reportValidity();
        return;
    }
    if (!selectedFollowUp) return;
    selectedFollowUp.status = byId('review-status').value;
    selectedFollowUp.note = note;
    byId('feedback').textContent = `${selectedFollowUp.name}: ${selectedFollowUp.status}. Review saved for this page session.`;
    byId('review-dialog').close();
    renderFollowUps();
});

document.querySelectorAll('[data-section]').forEach(button => {
    button.addEventListener('click', () => {
        byId('details-title').textContent = button.dataset.section;
        byId('details-dialog').showModal();
    });
});

window.addEventListener('pageshow', renderVisits);
renderFollowUps();

function emptyRow(id, columns, text) {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = columns;
    td.textContent = text;
    row.append(td);
    byId(id).append(row);
}
if (!followUps.length) emptyRow('follow-up-body', 4, 'No follow-ups awaiting review.');
