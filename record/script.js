'use strict';

const records = ProtectStore.load();

const byId = id => document.getElementById(id);
const pageSize = 6;
let currentPage = 1;
let currentView = 'active';

function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function filteredRecords() {
    const search = byId('search').value.trim().toLowerCase();
    const officer = byId('officer-filter').value;
    const status = byId('status-filter').value;
    let list = records.filter(record => currentView === 'archived' ? record.archived : !record.archived);

    if (currentView === 'recent') {
        list = records.filter(record => record.lastViewed)
            .sort((a, b) => b.lastViewed - a.lastViewed);
    }

    return list.filter(record =>
        `${record.client} ${record.caseId}`.toLowerCase().includes(search) &&
        (!officer || record.officer === officer) &&
        (!status || record.status === status)
    );
}

function cell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

function showDetails(title, paragraphs) {
    byId('details-title').textContent = title;
    byId('details-content').replaceChildren(...paragraphs.map(text => {
        const p = document.createElement('p');
        p.textContent = text;
        return p;
    }));
    byId('details-dialog').showModal();
}

function openRecord(record) {
    ProtectStore.save(records);
    window.location.href = `recordnames/recordnames.html?case=${encodeURIComponent(record.caseId)}`;
}

function render() {
    const officerFilter = byId('officer-filter');
    const selectedOfficer = officerFilter.value;
    const officers = [...new Set(records.map(record => record.officer).filter(Boolean))].sort();
    officerFilter.replaceChildren(new Option('All officers', ''),
        ...officers.map(officer => new Option(officer, officer)));
    officerFilter.value = officers.includes(selectedOfficer) ? selectedOfficer : '';

    const list = filteredRecords();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    currentPage = Math.min(currentPage, pages);
    const start = (currentPage - 1) * pageSize;
    const tbody = byId('records-body');
    tbody.replaceChildren();

    list.slice(start, start + pageSize).forEach(record => {
        const row = document.createElement('tr');
        const clientCell = document.createElement('td');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'client-button';
        button.textContent = record.client;
        button.setAttribute('aria-label', `View ${record.client}, ${record.caseId}`);
        button.addEventListener('click', () => openRecord(record));
        const id = document.createElement('span');
        id.className = 'case-id';
        id.textContent = record.caseId;
        clientCell.append(button, id);
        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status status-${record.status.toLowerCase().replaceAll(' ', '-')}`;
        badge.textContent = record.status;
        statusCell.append(badge);
        row.append(clientCell, cell(record.supervision), cell(record.officer), cell(formatDate(record.date)), statusCell);
        tbody.append(row);
    });

    const archived = currentView === 'archived';
    const archivedCount = records.filter(record => record.archived).length;
    byId('active-count').textContent = records.length - archivedCount;
    document.querySelector('[data-view="archived"] span').textContent = archivedCount;
    byId('records-page').classList.toggle('archive-view', archived);
    byId('archive-note').hidden = !archived;
    const archiveSummary = byId('archive-summary');
    archiveSummary.hidden = !archived;
    archiveSummary.textContent = `${archivedCount} archived ${archivedCount === 1 ? 'case' : 'cases'} retained.`;

    const emptyState = byId('empty-state');
    emptyState.hidden = list.length > 0;
    emptyState.textContent = archived && !archivedCount ? 'No archived cases yet.' : 'No matching records found.';
    if (currentView === 'recent' && !records.some(record => record.lastViewed)) {
        emptyState.textContent = 'Open a client record to see it here.';
    }
    byId('record-count').textContent = list.length
        ? `${start + 1}–${Math.min(start + pageSize, list.length)} of ${list.length}` : '0 records';
    byId('previous').disabled = currentPage === 1;
    byId('next').disabled = currentPage === pages;
    byId('page-buttons').replaceChildren();

    const firstPage = Math.max(1, Math.min(currentPage - 1, pages - 2));
    for (let page = firstPage; page <= Math.min(pages, firstPage + 2); page++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `button secondary page-button${page === currentPage ? ' active' : ''}`;
        button.textContent = page;
        button.setAttribute('aria-label', `Page ${page}`);
        if (page === currentPage) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => { currentPage = page; render(); });
        byId('page-buttons').append(button);
    }
}

['search', 'officer-filter', 'status-filter'].forEach(id => {
    byId(id).addEventListener(id === 'search' ? 'input' : 'change', () => {
        currentPage = 1;
        render();
    });
});

document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
        currentView = button.dataset.view;
        currentPage = 1;
        document.querySelectorAll('[data-view]').forEach(tab => {
            const selected = tab === button;
            tab.classList.toggle('active', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
        render();
    });
});

byId('previous').addEventListener('click', () => { currentPage--; render(); });
byId('next').addEventListener('click', () => { currentPage++; render(); });
const recordForm = byId('record-form');
const wizard = byId('record-wizard');
const wizardPanels = [...wizard.querySelectorAll('[data-record-step]')];
const wizardSteps = [...wizard.querySelectorAll('.wizard-steps li')];
const photoInput = byId('profile-photo');
const submitRecord = byId('wizard-submit');
const formError = byId('form-error');
let recordStep = 0;
let profilePhoto = '';

function showRecordStep(step) {
    recordStep = step;
    wizardPanels.forEach((panel, index) => { panel.hidden = index !== step; });
    wizardSteps.forEach((item, index) => {
        if (index === step) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
    });
    byId('back-button').hidden = step === 0;
    submitRecord.textContent = step === 2 ? 'Create record' : 'Continue \u2192';
    byId('wizard-hint').textContent = [
        'Step 1 of 3 \u00b7 Next: add court and supervision details.',
        'Step 2 of 3 \u00b7 Next: review your entries.',
        'Step 3 of 3 \u00b7 The record is saved in this browser tab.'
    ][step];
    formError.textContent = '';
    wizardPanels[step].querySelector('h2').focus();
}

function updatePhotoPreview() {
    const words = recordForm.elements.client.value.trim().split(/\s+/);
    byId('photo-initials').textContent = words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase() || '\u2014';
    byId('photo-initials').hidden = Boolean(profilePhoto);
    const preview = byId('photo-preview');
    preview.hidden = !profilePhoto;
    if (profilePhoto) preview.src = profilePhoto;
    else preview.removeAttribute('src');
    byId('remove-photo').hidden = !profilePhoto;
}

function closeRecordWizard() {
    wizard.hidden = true;
    byId('records-page').hidden = false;
    recordForm.reset();
    byId('record-review').replaceChildren();
    profilePhoto = '';
    submitRecord.disabled = false;
    updatePhotoPreview();
    byId('new-button').focus();
}

byId('new-button').addEventListener('click', () => {
    byId('records-page').hidden = true;
    wizard.hidden = false;
    showRecordStep(0);
    byId('new-title').focus();
});
byId('cancel-button').addEventListener('click', closeRecordWizard);
byId('back-button').addEventListener('click', () => showRecordStep(recordStep - 1));
recordForm.elements.client.addEventListener('input', updatePhotoPreview);
byId('upload-photo').addEventListener('click', () => photoInput.click());
byId('remove-photo').addEventListener('click', () => {
    photoInput.value = '';
    profilePhoto = '';
    submitRecord.disabled = false;
    formError.textContent = '';
    updatePhotoPreview();
    byId('upload-photo').focus();
});

photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;
    formError.textContent = '';
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        photoInput.value = '';
        submitRecord.disabled = false;
        formError.textContent = 'Choose a JPG or PNG photo up to 5 MB.';
        return;
    }
    submitRecord.disabled = true;
    try {
        const bitmap = await createImageBitmap(file);
        try {
            if (photoInput.files[0] !== file) return;
            const canvas = document.createElement('canvas');
            const size = Math.min(bitmap.width, bitmap.height);
            canvas.width = canvas.height = Math.min(size, 256);
            canvas.getContext('2d').drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2,
                size, size, 0, 0, canvas.width, canvas.height);
            profilePhoto = canvas.toDataURL('image/jpeg', .85);
            updatePhotoPreview();
        } finally {
            bitmap.close();
        }
    } catch (error) {
        if (photoInput.files[0] === file) formError.textContent = 'This photo could not be opened. Choose another image.';
    } finally {
        if (photoInput.files[0] === file) {
            photoInput.value = '';
            submitRecord.disabled = false;
        }
    }
});

function reviewRecord(record) {
    const review = byId('record-review');
    const entries = [...wizard.querySelectorAll('.wizard-grid label')].map(label => {
        const field = label.control;
        const value = record[field.name];
        return [label.firstChild.textContent.trim(), field.type === 'date' && value ? formatDate(value) : value];
    });
    if (record.profilePhoto) entries.push(['Profile photo', 'Attached']);
    review.replaceChildren(...entries.filter(([, value]) => value).map(([label, value]) => {
        const group = document.createElement('div');
        const term = document.createElement('dt');
        const detail = document.createElement('dd');
        term.textContent = label;
        detail.textContent = value;
        group.append(term, detail);
        return group;
    }));
}

recordForm.addEventListener('submit', event => {
    event.preventDefault();
    if (submitRecord.disabled) return;
    formError.textContent = '';
    for (const field of wizardPanels[recordStep].querySelectorAll('input[name], select[name]')) {
        if (!field.reportValidity()) return;
        if (field.required && !field.value.trim()) {
            formError.textContent = `Enter a ${field.labels[0].firstChild.textContent.trim().toLowerCase()}.`;
            field.focus();
            return;
        }
    }

    const record = Object.fromEntries([...new FormData(recordForm)].map(([key, value]) => [key, value.trim()]));
    record.caseId = record.caseId.toUpperCase();
    if (profilePhoto) record.profilePhoto = profilePhoto;

    if (recordStep >= 1 && records.some(existing => existing.caseId.toUpperCase() === record.caseId)) {
        if (recordStep === 2) showRecordStep(1);
        formError.textContent = 'That case ID already exists.';
        recordForm.elements.caseId.focus();
        return;
    }
    if (recordStep < 2) {
        if (recordStep === 1) reviewRecord(record);
        showRecordStep(recordStep + 1);
        return;
    }
    record.officer = window.ProtectCurrentUser?.email || 'Unassigned';
    if (!ProtectStore.save([record, ...records])) {
        formError.textContent = 'Unable to save this record in the browser tab. Remove the photo and try again, or check browser storage.';
        return;
    }
    records.unshift(record);
    closeRecordWizard();
    byId('search').value = '';
    byId('officer-filter').value = '';
    byId('status-filter').value = '';
    document.querySelector('[data-view="active"]').click();
    byId('feedback').textContent = `${record.client} added for this browser tab.`;
});

byId('export-button').addEventListener('click', () => {
    const list = filteredRecords();
    const escapeCsv = value => {
        let text = String(value);
        if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
    };
    const rows = [
        ['Client', 'Case ID', 'Supervision', 'Assigned officer', 'Next walk-in', 'Case status'],
        ...list.map(record => [record.client, record.caseId, record.supervision, record.officer, record.date, record.status])
    ];
    const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `protect-records-${currentView}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    byId('feedback').textContent = `Exported ${list.length} matching records.`;
});

document.querySelectorAll('[data-section]').forEach(button => {
    button.addEventListener('click', () => showDetails(button.dataset.section, [
        'This section has not been connected yet. Use Overview or Records to visit the available pages.'
    ]));
});

render();

window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    records.splice(0, records.length, ...ProtectStore.load());
    render();
});

// Open the case selected from the Documents page.
const url = new URL(window.location.href);
if (url.searchParams.get('deleted') === '1') {
    byId('feedback').textContent = 'Case deleted.';
    url.searchParams.delete('deleted');
    history.replaceState(history.state, '', url);
}
const requestedCase = url.searchParams.get('case');
if (requestedCase) {
    byId('search').value = requestedCase;
    currentPage = 1;
    render();
}
