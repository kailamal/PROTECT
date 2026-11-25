'use strict';

const byId = id => document.getElementById(id);
const form = byId('visit-form');
const dialog = byId('add-dialog');
const otherPurpose = form.elements.otherPurpose;
const list = byId('visits');
const viewAll = byId('view-all');
const previewLimit = 3;
const periods = {
    today: { length: 10, title: "Today's Walk-ins" },
    monthly: { length: 7, title: 'This Month’s Walk-ins' },
    yearly: { length: 4, title: 'This Year’s Walk-ins' }
};
let showAll = false;

function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
}

function visitCard(visit) {
    const card = document.createElement('li');
    const initials = visit.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('');
    const badge = element('span', initials.toUpperCase(), 'initials');
    badge.setAttribute('aria-hidden', 'true');
    const details = document.createElement('div');
    const date = ProtectVisits.formatDate(visit.date);
    const when = visit.time ? date + ' · ' + ProtectVisits.formatTime(visit.time) : date;
    details.append(element('strong', visit.name), element('p', visit.purpose, 'visit-meta'),
        element('p', when, 'visit-meta'));
    if (visit.notes) details.append(element('p', visit.notes, 'visit-meta visit-notes'));
    if (visit.caseId) {
        const link = element('a', 'Open case', 'case-link');
        link.href = '../record/recordnames/recordnames.html?case=' + encodeURIComponent(visit.caseId);
        details.append(link);
    }
    card.append(badge, details);
    return card;
}

function render() {
    const period = periods[document.querySelector('[name="period"]:checked').value];
    const prefix = ProtectVisits.today().slice(0, period.length);
    const visits = ProtectVisits.load().filter(visit => visit.date.startsWith(prefix));
    byId('list-title').textContent = period.title;
    byId('total').textContent = visits.length;
    byId('empty').hidden = visits.length > 0;
    viewAll.hidden = visits.length <= previewLimit;
    viewAll.firstChild.textContent = showAll ? 'Show Less ' : 'View All ';
    viewAll.setAttribute('aria-expanded', String(showAll));
    const visible = showAll ? visits : visits.slice(0, previewLimit);
    list.replaceChildren(...visible.map(visitCard));
}

document.querySelector('.periods').addEventListener('change', () => {
    showAll = false;
    render();
});
viewAll.addEventListener('click', () => {
    showAll = !showAll;
    render();
});
function updatePurpose() {
    const isOther = form.elements.purpose.value === 'Other';
    byId('other-purpose').hidden = !isOther;
    otherPurpose.disabled = !isOther;
    otherPurpose.required = isOther;
}

form.elements.purpose.addEventListener('change', updatePurpose);
byId('add-visit').addEventListener('click', () => {
    form.reset();
    updatePurpose();
    form.elements.date.value = ProtectVisits.today();
    form.elements.time.value = '09:00';
    byId('save-error').hidden = true;
    dialog.scrollTop = 0;
    dialog.showModal();
});
byId('cancel-add').addEventListener('click', () => dialog.close());
byId('home-add').addEventListener('click', () => dialog.close());

form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const visit = {
        name: data.get('name').trim(),
        purpose: (data.get('otherPurpose') ?? data.get('purpose')).trim(),
        date: data.get('date'), time: data.get('time'), notes: data.get('notes').trim()
    };
    const error = byId('save-error');
    if (!visit.name || !visit.purpose) {
        error.textContent = 'Enter a name and purpose.';
        error.hidden = false;
        return;
    }
    const submit = form.querySelector('[type="submit"]');
    if (submit.disabled) return;
    submit.disabled = true;
    error.hidden = true;
    try {
        await ProtectVisits.add(visit);
    } catch (failure) {
        error.textContent = failure.code === '42501'
            ? 'Saving to the dashboard requires an active PROTECT staff profile.'
            : 'The walk-in could not be saved to the dashboard. Check your connection and sign-in, then try again.';
        error.hidden = false;
        return;
    } finally {
        submit.disabled = false;
    }
    const today = ProtectVisits.today();
    if (visit.date === today) document.querySelector('[value="today"]').checked = true;
    else if (visit.date.startsWith(today.slice(0, 7))) document.querySelector('[value="monthly"]').checked = true;
    else document.querySelector('[value="yearly"]').checked = true;
    dialog.close();
    render();
});

ProtectVisits.watch(render, byId('walk-in-sync'));
