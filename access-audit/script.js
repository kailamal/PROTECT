'use strict';

const byId = id => document.getElementById(id);
const officials = [];
const requests = [];
const events = [];
let selectedOfficial = null;
let expanded = false;

function cell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function addEvent(action, reference) {
    events.unshift({
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Manila' }),
        official: 'Current user', action, reference, result: 'Allowed'
    });
    renderEvents();
}

function renderOfficials() {
    const query = byId('official-search').value.toLowerCase().trim();
    const filtered = officials.filter(person => `${person.name} ${person.role} ${person.status}`.toLowerCase().includes(query));
    byId('officials-body').replaceChildren();
    byId('officials-empty').hidden = filtered.length > 0;
    filtered.forEach(person => {
        const row = document.createElement('tr');
        const statusCell = document.createElement('td');
        const status = document.createElement('span');
        status.className = `official-status${person.status === 'Suspended' ? ' suspended' : ''}`;
        status.textContent = person.status;
        statusCell.append(status);
        const actionCell = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'text-button manage-button';
        button.textContent = 'Manage';
        button.setAttribute('aria-label', `Manage ${person.name}`);
        button.addEventListener('click', () => {
            selectedOfficial = person;
            byId('manage-name').textContent = person.name;
            byId('manage-role').value = person.role;
            byId('manage-status').value = person.status;
            byId('manage-dialog').showModal();
        });
        actionCell.append(button);
        row.append(cell(person.name), cell(person.role), statusCell, actionCell);
        byId('officials-body').append(row);
    });
    // Count only actual entries loaded into this page.
    document.querySelector('.summary-card p').textContent = officials.filter(person => person.status === 'Active').length;
}

function renderEvents() {
    byId('audit-body').replaceChildren();
    (expanded ? events : events.slice(0, 3)).forEach(event => {
        const row = document.createElement('tr');
        const result = cell(event.result);
        result.className = event.result === 'Denied' ? 'denied' : 'allowed';
        row.append(cell(event.time), cell(event.official), cell(event.action), cell(event.reference), result);
        byId('audit-body').append(row);
    });
    byId('events-button').textContent = expanded ? 'Show recent events \u2191' : 'View all events \u2192';
    if (!events.length) {
        const row = document.createElement('tr');
        const empty = cell('No audit events recorded.');
        empty.colSpan = 5;
        row.append(empty);
        byId('audit-body').append(row);
    }
    byId('events-button').setAttribute('aria-expanded', String(expanded));
}

function renderRequests() {
    const pending = requests.filter(request => request.status === 'Pending').length;
    byId('request-total').textContent = pending;
    byId('request-stat').textContent = pending;
    byId('requests-list').replaceChildren();
    if (!requests.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No access requests. Account administration is not connected to Supabase yet.';
        byId('requests-list').append(empty);
    }
    requests.forEach(request => {
        const card = document.createElement('article');
        card.className = 'request-card';
        const name = document.createElement('h3');
        name.textContent = request.name;
        const description = document.createElement('p');
        description.textContent = `${request.role}: ${request.reason}`;
        const status = document.createElement('p');
        status.textContent = `Status: ${request.status}`;
        card.append(name, description, status);
        if (request.status === 'Pending') {
            const actions = document.createElement('div');
            actions.className = 'request-actions';
            ['Approve', 'Deny'].forEach(decision => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `button ${decision === 'Approve' ? 'primary' : 'secondary'}`;
                button.textContent = decision;
                button.setAttribute('aria-label', `${decision} request from ${request.name}`);
                button.addEventListener('click', () => {
                    request.status = decision === 'Approve' ? 'Approved' : 'Denied';
                    if (decision === 'Approve') officials.push({ name: request.name, role: request.role, status: 'Active' });
                    addEvent(`Demo access request ${request.status.toLowerCase()}`, request.name);
                    byId('feedback').textContent = `Demo request for ${request.name}: ${request.status.toLowerCase()}. No real permissions changed.`;
                    renderRequests();
                    renderOfficials();
                    byId('requests-dialog').querySelector('form button').focus();
                });
                actions.append(button);
            });
            card.append(actions);
        }
        byId('requests-list').append(card);
    });
}

byId('official-search').addEventListener('input', renderOfficials);
byId('cancel-manage').addEventListener('click', () => byId('manage-dialog').close());
byId('manage-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!selectedOfficial) return;
    selectedOfficial.role = byId('manage-role').value;
    selectedOfficial.status = byId('manage-status').value;
    addEvent('Demo account settings updated', selectedOfficial.name);
    byId('manage-dialog').close();
    byId('feedback').textContent = `Updated demo settings for ${selectedOfficial.name}. No real permissions changed.`;
    renderOfficials();
});
byId('requests-button').addEventListener('click', () => {
    renderRequests();
    byId('requests-dialog').showModal();
});
byId('events-button').addEventListener('click', () => {
    expanded = !expanded;
    renderEvents();
});

renderOfficials();
renderEvents();
renderRequests();
