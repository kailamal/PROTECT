const dialog = document.getElementById('details-dialog');
const date = document.getElementById('dashboard-date');
const manilaDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
});
const appointmentCount = document.getElementById('appointment-count');
const completedCount = document.getElementById('completed-count');
const progress = document.getElementById('completed-progress');
const completion = document.getElementById('appointment-completion');

date.value = manilaDate.format(new Date());

function renderAppointments() {
    const selectedDate = date.value || manilaDate.format(new Date());
    const count = ProtectStore.completedAppointmentsByDate().get(selectedDate) || 0;

    appointmentCount.textContent = count;
    completedCount.textContent = count;
    progress.max = Math.max(1, count);
    progress.value = count;
    completion.textContent = count === 0 ? 'No appointments' : `${count} completed`;
}

date.addEventListener('change', renderAppointments);
window.addEventListener('pageshow', renderAppointments);
renderAppointments();
