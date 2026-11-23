'use strict';

let documents = [];

const byId = id => document.getElementById(id);
const pageSize = 6;
let view = 'all';
let page = 1;
let selectedDocument = null;

function dateLabel(value) {
    return new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function linkedCase(file) {
    return `../record/recordnames/recordnames.html?case=${encodeURIComponent(file.caseId)}`;
}

function matchingDocuments() {
    const query = byId('search').value.trim().toLowerCase();
    const category = byId('category-filter').value;
    return documents.filter(file => {
        let inView = view === 'all' || file.archived;
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
    byId('document-name').textContent = file.name.replace(/\.[^.]+$/, '') || file.name;
    byId('preview-client').textContent = file.client;
    byId('preview-case-id').textContent = file.caseId;
    byId('linked-case-id').textContent = file.caseId;
    byId('preview-meta').textContent = `${file.type} \u00b7 ${file.size} \u00b7 Version ${file.version}`;
    byId('preview-feedback').textContent = '';
    const details = byId('preview-details');
    details.replaceChildren();
    [
        ['Category', file.category], ['Sender', file.sender || 'Unspecified'],
        ['Updated', dateLabel(file.updated)], ['Version', file.version]
    ].forEach(([label, value]) => {
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        details.append(term, description);
    });
    byId('case-link').href = linkedCase(file);
    byId('case-link').textContent = file.client;
    byId('document-status').textContent = file.archived ? 'Archived file' : 'Active file';
    byId('document-list').hidden = true;
    byId('document-detail').hidden = false;
    document.title = `${file.name} | P.R.O.T.E.C.T`;
}

function render() {
    documents = ProtectStore.load().flatMap(record =>
        (record.documents || []).map(file => ({
            ...file, client: record.client, caseId: record.caseId, archived: Boolean(record.archived)
        }))
    ).sort((first, second) => second.updated.localeCompare(first.updated));
    const files = matchingDocuments();
    const pageCount = Math.max(1, Math.ceil(files.length / pageSize));
    page = Math.min(page, pageCount);
    const start = (page - 1) * pageSize;
    const body = byId('documents-body');
    body.replaceChildren();
    files.slice(start, start + pageSize).forEach(file => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const fileLink = document.createElement('a');
        fileLink.className = 'document-button';
        fileLink.href = `?file=${encodeURIComponent(file.id)}`;
        fileLink.textContent = file.name;
        const meta = document.createElement('span');
        meta.className = 'document-meta';
        meta.textContent = `${file.type} \u00b7 ${file.size} \u00b7 Version ${file.version}`;
        nameCell.append(fileLink, meta);
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
    byId('all-count').textContent = documents.length;
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
byId('download-document').addEventListener('click', async () => {
    if (!selectedDocument) return;
    try {
        await ProtectDocumentFiles.download(selectedDocument);
    } catch {
        byId('preview-feedback').textContent = 'The file could not be downloaded.';
    }
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

const params = new URLSearchParams(location.search);
const requestedFile = params.get('file');
byId('search').value = params.get('case') || '';

function renderPage() {
    render();
    if (!requestedFile) return;
    const file = documents.find(entry => String(entry.id) === requestedFile);
    if (file) {
        showPreview(file);
    } else {
        byId('document-detail').hidden = true;
        byId('document-list').hidden = false;
        byId('feedback').textContent = 'This document is no longer available.';
    }
}

renderPage();
window.addEventListener('pageshow', event => {
    if (event.persisted) renderPage();
});
