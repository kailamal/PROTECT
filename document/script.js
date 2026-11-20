'use strict';

const documents = [];

const byId = id => document.getElementById(id);
const pageSize = 6;
let view = 'all';
let page = 1;
let selectedDocument = null;

function dateLabel(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function linkedCase(file) {
    return `../record/record.html?case=${encodeURIComponent(file.caseId)}`;
}

function matchingDocuments() {
    const query = byId('search').value.trim().toLowerCase();
    const category = byId('category-filter').value;
    return documents.filter(file => {
        let inView = view === 'archived' ? file.archived : !file.archived;
        if (view === 'duplicates') {
            inView = !file.archived && documents.some(other =>
                other.id !== file.id && !other.archived &&
                other.name === file.name && other.caseId === file.caseId &&
                other.size === file.size && other.version === file.version
            );
        }
        return inView && (!category || category === file.category) &&
            `${file.name} ${file.client} ${file.caseId}`.toLowerCase().includes(query);
    });
}

function showPreview(file) {
    selectedDocument = file;
    byId('preview-title').textContent = file.name;
    byId('preview-meta').textContent = `PDF \u00b7 ${file.size} \u00b7 Version ${file.version}`;
    const details = byId('preview-details');
    details.replaceChildren();
    [
        ['Linked client', file.client], ['Case ID', file.caseId],
        ['Category', file.category], ['Updated', dateLabel(file.updated)],
        ['Status', file.archived ? 'Archived' : 'Active']
    ].forEach(([label, value]) => {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        details.append(term, description);
    });
    byId('case-link').href = linkedCase(file);
    byId('archive-button').textContent = file.archived ? 'Restore document' : 'Archive document';
    byId('preview-dialog').showModal();
}

function render() {
    const files = matchingDocuments();
    const pageCount = Math.max(1, Math.ceil(files.length / pageSize));
    page = Math.min(page, pageCount);
    const start = (page - 1) * pageSize;
    const body = byId('documents-body');
    body.replaceChildren();
    files.slice(start, start + pageSize).forEach(file => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'document-button';
        button.textContent = file.name;
        button.setAttribute('aria-label', `Preview ${file.name} for ${file.client}`);
        button.addEventListener('click', () => showPreview(file));
        const meta = document.createElement('span');
        meta.className = 'document-meta';
        meta.textContent = `PDF \u00b7 ${file.size} \u00b7 Version ${file.version}`;
        nameCell.append(button, meta);
        const clientCell = document.createElement('td');
        const link = document.createElement('a');
        link.className = 'client-link';
        link.href = linkedCase(file);
        link.textContent = file.client;
        const caseId = document.createElement('span');
        caseId.className = 'document-meta';
        caseId.textContent = file.caseId;
        clientCell.append(link, caseId);
        const category = document.createElement('td');
        category.textContent = file.category;
        const updated = document.createElement('td');
        updated.textContent = dateLabel(file.updated);
        row.append(nameCell, clientCell, category, updated);
        body.append(row);
    });
    byId('all-count').textContent = documents.filter(file => !file.archived).length;
    byId('archived-count').textContent = documents.filter(file => file.archived).length;
    byId('empty-state').hidden = files.length > 0;
    byId('empty-state').textContent = view === 'duplicates'
        ? 'No duplicate documents found.' : 'No matching documents found.';
    byId('document-count').textContent = files.length
        ? `Recent documents \u00b7 ${start + 1}\u2013${Math.min(start + pageSize, files.length)} of ${files.length}`
        : '0 documents';
    byId('previous').disabled = page === 1;
    byId('next').disabled = page === pageCount;
    byId('page-buttons').replaceChildren();
    for (let number = 1; number <= pageCount; number++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `button secondary page-button${number === page ? ' active' : ''}`;
        button.textContent = number;
        button.setAttribute('aria-label', `Page ${number}`);
        if (number === page) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => { page = number; render(); });
        byId('page-buttons').append(button);
    }
}

byId('search').addEventListener('input', () => { page = 1; render(); });
byId('category-filter').addEventListener('change', () => { page = 1; render(); });
byId('previous').addEventListener('click', () => { page--; render(); });
byId('next').addEventListener('click', () => { page++; render(); });
byId('close-preview').addEventListener('click', () => byId('preview-dialog').close());
byId('archive-button').addEventListener('click', () => {
    if (!selectedDocument) return;
    selectedDocument.archived = !selectedDocument.archived;
    byId('feedback').textContent = `${selectedDocument.name} ${selectedDocument.archived ? 'archived' : 'restored'} for this page session.`;
    byId('preview-dialog').close();
    render();
});

document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
        view = button.dataset.view;
        page = 1;
        document.querySelectorAll('[data-view]').forEach(tab => {
            tab.classList.toggle('active', tab === button);
            tab.setAttribute('aria-pressed', String(tab === button));
        });
        render();
    });
});

document.querySelectorAll('[data-section]').forEach(button => {
    button.addEventListener('click', () => {
        byId('details-title').textContent = button.dataset.section;
        byId('details-dialog').showModal();
    });
});

render();

// Filter to the client selected from their case page.
const requestedCase = new URLSearchParams(location.search).get('case');
if (requestedCase) {
    byId('search').value = requestedCase;
    page = 1;
    render();
}
