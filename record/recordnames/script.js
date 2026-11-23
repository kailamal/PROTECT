'use strict';

const byId = id => document.getElementById(id);
const records = ProtectStore.load();
const caseId = new URLSearchParams(location.search).get('case');
const client = caseId ? records.find(record => record.caseId === caseId) : records[0];
const fields = [
    ['No.', 'number'], ['Name', 'client'], ['PPA Docket No.', 'docket'],
    ['Court', 'court'], ['Criminal Case No.', 'criminalCase'], ['Offense', 'offense'],
    ['Rehab Type', 'rehab'], ['Supervision', 'supervision'], ['Category', 'category'], ['Case ID', 'caseId'],
    ['Assigned Officer', 'officer'], ['Walk-in', 'date'], ['Case Status', 'status'],
    ['Date Received', 'received'], ['Date Granted', 'granted'], ['Term', 'term'],
    ['Contact Number', 'contact'], ['Residential Area', 'area'], ['Remarks', 'remarks'],
    ['Age', 'age'], ['Sex', 'sex'], ['Occupation', 'occupation'], ['Educational Attainment', 'education'],
    ['Complied', 'complied'], ['Start', 'start'], ['End', 'end']
];
let revealed = false;

function persist() {
    const saved = ProtectStore.save(records);
    byId('feedback').textContent = saved
        ? 'Changes saved for this browser tab.'
        : 'Updated on this page. Browser storage is unavailable; these changes cannot follow navigation.';
}

function labelDate(value) {
    if (!value) return '\u2014';
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function historyEntry(date, title, detail) {
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = date;
    const content = document.createElement('div');
    content.textContent = title;
    const small = document.createElement('small');
    small.textContent = detail;
    if (detail) content.append(small);
    li.append(time, content);
    return li;
}

function render() {
    document.title = `${client.client} | P.R.O.T.E.C.T`;
    byId('client-name').textContent = client.client;
    byId('upload-case').textContent = `${client.client} \u00b7 ${client.caseId}`;
    const avatar = byId('client-avatar');
    avatar.textContent = client.client.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
    if (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(client.profilePhoto)) {
        const photo = document.createElement('img');
        photo.src = client.profilePhoto;
        photo.alt = '';
        avatar.replaceChildren(photo);
    }
    byId('archive-label').hidden = !client.archived;
    const archiveButton = byId('archive-button');
    archiveButton.textContent = client.archived ? 'Restore' : 'Terminate';
    archiveButton.title = client.archived ? 'Move this case to Active cases' : 'Move this case to Archived';
    byId('case-headings').replaceChildren();
    byId('case-values').replaceChildren();
    fields.forEach(([label, key]) => {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = label;
        const td = document.createElement('td');
        let value = key === 'number' ? records.indexOf(client) + 1 : client[key];
        if (key === 'status') value = ProtectStore.caseStatus(client);
        if (key === 'contact' && value && !revealed) value = `\u2022\u2022\u2022\u2022 ${value.slice(-4)}`;
        if (['date', 'received', 'granted', 'start', 'end'].includes(key) && value) value = labelDate(value);
        if (!value && ['start', 'end'].includes(key)) value = client[`${key}Status`];
        td.textContent = value || '\u2014';
        byId('case-headings').append(th);
        byId('case-values').append(td);
    });
    byId('contact-number').textContent = client.contact
        ? revealed ? client.contact : `\u2022\u2022\u2022\u2022 ${client.contact.slice(-4)}` : 'Not provided';
    byId('residential-area').textContent = client.area || 'Not provided';
    byId('reveal-button').disabled = !client.contact;
    byId('reveal-button').textContent = revealed ? 'Hide contact' : 'Reveal contact \u2192';
    const history = byId('history-list');
    history.replaceChildren();
    const entries = client.history || [];
    byId('history-empty').hidden = entries.length > 0;
    entries.slice(0, 5).forEach(entry => history.append(historyEntry(entry.date, entry.title, entry.detail)));
}

function addEvent(title, record = client) {
    record.history = record.history || [];
    record.history.unshift({
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Manila' }),
        title
    });
}

if (!client) {
    document.querySelector('.client-page').replaceChildren();
    const heading = document.createElement('h1');
    heading.textContent = 'Client record not found';
    const link = document.createElement('a');
    link.href = '../record.html';
    link.textContent = 'Return to Records';
    document.querySelector('.client-page').append(heading, link);
} else {
    client.lastViewed = Date.now();
    ProtectStore.save(records);

    const overviewFields = [
        ['Name', 'client'], ['PPA Docket No. (PI / PS)', 'docket'], ['Court', 'court'],
        ['Criminal Case No.', 'criminalCase'], ['Offense', 'offense'], ['Rehab Type (OUT/IN)', 'rehab'],
        ['Complied yes or No', 'complied'], ['Start', 'start'], ['End', 'end'],
        ['Address', 'area'], ['Occupation', 'occupation'], ['Educational Attainment', 'education'],
        ['Age', 'age'], ['SEX', 'sex'], ['Mobile No.', 'contact'],
        ['Remarks', 'remarks'], ['Officer-in-Charge', 'officer'], ['Category', 'category']
    ];
    const additionalFields = fields.filter(([, key]) =>
        !['number', 'caseId'].includes(key) && !overviewFields.some(([, overviewKey]) => overviewKey === key)
    );
    const editForm = byId('edit-form');
    function appendEditField(container, [label, key]) {
        const wrapper = document.createElement('label');
        wrapper.textContent = label;
        const options = {
            complied: ['', 'Yes', 'No'],
            category: ['', 'Probation Integration', 'Probation Supervision'],
            supervision: ['Probation', 'Parole'],
            status: ['', 'Absconding probationer', 'Active Supervision', 'Under Investigation']
        };
        if (key === 'status' && client.status && !options.status.includes(client.status)) {
            options.status.push(client.status);
        }
        const input = document.createElement(options[key] ? 'select' : 'input');
        input.name = key;
        if (options[key]) {
            options[key].forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                const emptyLabels = { status: 'No status', category: 'Select Category' };
                option.textContent = value || emptyLabels[key] || '\u2014';
                input.append(option);
            });
        } else {
            input.type = ['date', 'received', 'granted', 'start', 'end'].includes(key) ? 'date' : key === 'contact' ? 'tel' : 'text';
            input.maxLength = 160;
            input.placeholder = '\u2014';
            if (key === 'age') {
                input.type = 'number';
                input.min = '0';
                input.max = '130';
            }
        }
        input.required = ['client', 'date'].includes(key);
        input.readOnly = key === 'officer';
        wrapper.append(input);
        container.append(wrapper);
    }
    overviewFields.forEach(field => appendEditField(byId('edit-fields'), field));
    additionalFields.forEach(field => appendEditField(byId('edit-additional-fields'), field));
    const editFields = [...overviewFields, ...additionalFields];
    function closeEditor() {
        editForm.hidden = true;
        byId('case-content').hidden = false;
        byId('edit-button').focus();
    }
    byId('edit-button').addEventListener('click', () => {
        editFields.forEach(([, key]) => { editForm.elements.namedItem(key).value = client[key] ?? ''; });
        const contact = editForm.elements.namedItem('contact');
        if (!revealed && client.contact) contact.value = '';
        contact.placeholder = !revealed && client.contact ? `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022 ${client.contact.slice(-4)}` : '\u2014';
        editForm.querySelector('details').open = false;
        byId('edit-error').textContent = '';
        byId('case-content').hidden = true;
        editForm.hidden = false;
        byId('edit-title').focus();
    });
    byId('cancel-edit').addEventListener('click', closeEditor);
    editForm.addEventListener('invalid', event => {
        const details = event.target.closest('details');
        if (details) details.open = true;
    }, true);
    editForm.addEventListener('submit', event => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        if (!String(values.get('client')).trim()) {
            byId('edit-error').textContent = 'Enter a client name.';
            return;
        }
        const updated = { ...client, history: [...(client.history || [])] };
        editFields.forEach(([, key]) => {
            const value = String(values.get(key)).trim();
            if (key === 'officer' || (key === 'contact' && !revealed && !value)) return;
            updated[key] = value;
            if (value && ['start', 'end'].includes(key)) updated[`${key}Status`] = '';
        });
        addEvent('Case overview updated', updated);
        if (!ProtectStore.save(records.map(record => record === client ? updated : record))) {
            byId('edit-error').textContent = 'Browser storage is unavailable. Your changes could not be saved.';
            return;
        }
        Object.assign(client, updated);
        byId('feedback').textContent = 'Changes saved for this browser tab.';
        closeEditor();
        render();
    });
    byId('reveal-button').addEventListener('click', () => { revealed = !revealed; render(); });
    byId('archive-button').addEventListener('click', () => {
        client.archived = !client.archived;
        addEvent(client.archived ? 'Case terminated' : 'Case restored');
        persist();
        render();
    });
    byId('delete-button').addEventListener('click', () => byId('confirm-dialog').showModal());
    byId('cancel-delete').addEventListener('click', () => byId('confirm-dialog').close());
    byId('confirm-delete').addEventListener('click', () => {
        const remaining = records.filter(record => record.caseId !== client.caseId);
        if (ProtectStore.save(remaining)) {
            const files = client.documents || [];
            Promise.allSettled(files.map(file => ProtectDocumentFiles.remove(file.id)))
                .then(() => { location.href = '../record.html?deleted=1'; });
        } else {
            byId('confirm-dialog').close();
            byId('feedback').textContent = 'Browser storage is unavailable. The case could not be deleted.';
        }
    });
    const tabs = document.querySelectorAll('[data-tab]');
    const fileInput = byId('document-file');
    const senderInput = byId('document-sender');
    const selection = byId('upload-selection');
    const fileList = byId('case-document-files');
    const fileSizes = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
    let selectedFile = null;
    function setCaseTab(view) {
        byId('overview-panel').hidden = view !== 'overview';
        byId('documents-panel').hidden = view !== 'documents';
        tabs.forEach(tab => {
            const selected = tab.dataset.tab === view;
            tab.classList.toggle('active', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
    }

    function openUpload() {
        const user = window.ProtectCurrentUser;
        senderInput.value = user?.user_metadata?.full_name || user?.email || '';
        setCaseTab('documents');
        byId('case-content').hidden = true;
        byId('upload-panel').hidden = false;
        byId('upload-title').focus();
    }

    function closeUpload() {
        clearDocument();
        byId('upload-panel').hidden = true;
        byId('case-content').hidden = false;
        byId('case-documents-title').focus();
    }

    tabs.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.tab === 'documents') openUpload();
            else setCaseTab('overview');
        });
    });
    byId('open-upload').addEventListener('click', openUpload);
    byId('back-to-documents').addEventListener('click', closeUpload);
    byId('cancel-upload').addEventListener('click', closeUpload);
    byId('choose-document').addEventListener('click', () => fileInput.click());

    function updateFileSelection() {
        const hasFile = Boolean(selectedFile);
        byId('upload-formats').hidden = hasFile;
        byId('choose-document').hidden = hasFile;
        byId('selected-document').hidden = !hasFile;
        byId('attach-document').hidden = !hasFile;
    }

    function clearDocument() {
        selectedFile = null;
        fileInput.value = '';
        selection.textContent = '';
        updateFileSelection();
    }

    byId('remove-document').addEventListener('click', () => {
        clearDocument();
        byId('choose-document').focus();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const extension = /\.(pdf|jpe?g|png)$/i.exec(file.name)?.[1].toUpperCase();
        if (!extension) {
            clearDocument();
            selection.textContent = 'Choose a PDF, JPG or PNG file.';
            return;
        }
        selectedFile = file;
        const type = extension === 'JPEG' ? 'JPG' : extension;
        let size = `${fileSizes.format(file.size)} B`;
        if (file.size >= 1024 ** 2) size = `${fileSizes.format(file.size / 1024 ** 2)} MB`;
        else if (file.size >= 1024) size = `${fileSizes.format(file.size / 1024)} KB`;
        byId('selected-document-name').textContent = file.name;
        byId('selected-document-details').textContent = `${type} \u00b7 ${size}`;
        selection.textContent = '';
        updateFileSelection();
        byId('remove-document').focus();
    });

    function renderDocuments() {
        const entries = client.documents || [];
        fileList.replaceChildren();
        entries.forEach(entry => {
            const item = document.createElement('li');
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'text-button';
            button.textContent = entry.name;
            button.addEventListener('click', async () => {
                try {
                    await ProtectDocumentFiles.download(entry);
                } catch {
                    byId('case-document-status').textContent = 'The file could not be downloaded.';
                }
            });
            item.append(button);
            fileList.append(item);
        });
        fileList.hidden = entries.length === 0;
        byId('case-documents-empty').hidden = entries.length > 0;
        byId('document-total').textContent = entries.length;
    }

    const uploadButton = byId('attach-document');
    uploadButton.addEventListener('click', async () => {
        if (!selectedFile || uploadButton.disabled) return;
        const sender = senderInput.value.trim();
        senderInput.value = sender;
        if (!senderInput.reportValidity()) return;
        const file = selectedFile;
        const [type, size] = byId('selected-document-details').textContent.split(' \u00b7 ');
        let id;
        const controls = [uploadButton, senderInput, byId('remove-document'), byId('cancel-upload'), byId('back-to-documents')];
        controls.forEach(control => { control.disabled = true; });
        selection.textContent = 'Uploading…';
        try {
            id = await ProtectDocumentFiles.save(file);
            const entry = {
                id, name: file.name, sender, type, size, category: 'Case note', version: 1,
                updated: new Date().toISOString(), archived: false
            };
            const currentRecords = ProtectStore.load();
            const currentCase = currentRecords.find(record => record.caseId === client.caseId);
            if (!currentCase) throw new Error('Case unavailable');
            currentCase.documents = [entry, ...(currentCase.documents || [])];
            if (!ProtectStore.save(currentRecords)) throw new Error('Case could not be saved');
            client.documents = currentCase.documents;
        } catch {
            if (id !== undefined) ProtectDocumentFiles.remove(id).catch(() => {});
            selection.textContent = 'The document could not be saved. Try uploading it again.';
            return;
        } finally {
            controls.forEach(control => { control.disabled = false; });
        }
        closeUpload();
        location.href = `../../document/document.html?file=${encodeURIComponent(id)}`;
    });
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        const latest = ProtectStore.load();
        const currentCase = latest.find(record => record.caseId === client.caseId);
        if (!currentCase) {
            location.reload();
            return;
        }
        Object.assign(client, currentCase);
        records.splice(0, records.length, ...latest.map(record => record === currentCase ? client : record));
        renderDocuments();
        render();
    });
    renderDocuments();
    render();
}
