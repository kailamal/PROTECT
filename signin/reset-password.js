'use strict';

const auth = window.ProtectAuth;
const status = document.getElementById('reset-status');
const submit = document.getElementById('reset-submit');
const form = document.getElementById('reset-form');
let recoveryReady = false;

if (auth.error) {
    status.textContent = auth.error;
} else {
    // The recovery event verifies that this URL established a recovery session.
    auth.client.auth.onAuthStateChange(event => {
        if (event === 'PASSWORD_RECOVERY') {
            recoveryReady = true;
            submit.disabled = false;
            status.textContent = 'Choose a password of at least 12 characters.';
            history.replaceState(null, '', location.pathname);
        }
    });
    status.textContent = 'Checking your reset link. If it has expired, request a new one from Sign in.';
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!recoveryReady || submit.disabled) return;
    const password = document.getElementById('new-password').value;
    const confirmation = document.getElementById('confirm-password').value;
    if (password !== confirmation) {
        status.textContent = 'The passwords do not match.';
        return;
    }
    submit.disabled = true;
    status.textContent = 'Updating your password...';
    try {
        const { error } = await auth.client.auth.updateUser({ password });
        if (error) {
            status.textContent = 'Could not update the password. Use a different password that meets your office requirements, or request a new reset link.';
            submit.disabled = false;
            return;
        }
        recoveryReady = false;
        form.reset();
        await auth.client.auth.signOut({ scope: 'local' });
        status.textContent = 'Password updated. Return to Sign in to use your new password.';
    } catch (error) {
        status.textContent = 'Connection failed. Please try again.';
        submit.disabled = false;
    }
});
