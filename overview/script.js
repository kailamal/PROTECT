const dialog = document.getElementById('details-dialog');
const date = document.getElementById('dashboard-date');
date.value = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
document.getElementById('schedule-button').addEventListener('click', () => {
    location.href = '../walk-ins/walk-in.html';
});
date.addEventListener('change', () => {
    document.getElementById('date-note').textContent = 'No appointment data loaded for the selected date. Dashboard data is not connected to Supabase yet.';
});
