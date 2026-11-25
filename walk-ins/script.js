'use strict';

const byId = id => document.getElementById(id);

function makeCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function showVisit(visit) {
    byId('visit-title').textContent = visit.name;
    byId('visit-details').replaceChildren();
    [['Time', ProtectVisits.formatTime(visit.time)], ['Date', ProtectVisits.formatDate(visit.date)], ['Purpose', visit.purpose],
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
    byId('visit-note').textContent = visit.notes || (visit.caseId
        ? 'Open the linked case to review client information.'
        : 'No linked client record is available.');
    byId('visit-dialog').showModal();
}

function renderVisits() {
    const visits = ProtectVisits.load();
    byId('walk-in-count').textContent = `${visits.length} ${visits.length === 1 ? 'visit' : 'visits'} recorded`;
    byId('walk-in-body').replaceChildren();
    if (!visits.length) {
        const row = byId('walk-in-body').insertRow();
        const message = row.insertCell();
        message.colSpan = 5;
        message.textContent = 'No walk-ins recorded.';
    }
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
        const remarks = makeCell(visit.notes?.trim() || '\u2014');
        remarks.className = 'visit-remarks';
        tr.append(td, makeCell(ProtectVisits.formatTime(visit.time)),
            makeCell(ProtectVisits.formatDate(visit.date)), makeCell(visit.purpose), remarks);
        byId('walk-in-body').append(tr);
    });
}

byId('close-visit').addEventListener('click', () => byId('visit-dialog').close());
ProtectVisits.watch(renderVisits, byId('walk-in-sync'));
