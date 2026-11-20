function noReport() {
    document.getElementById('feedback').textContent = 'No analytics data is available to export. Connect case and reporting data first.';
}
document.getElementById('report-button').addEventListener('click', noReport);
document.getElementById('trend-export').addEventListener('click', noReport);
