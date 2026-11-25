'use strict';

const accountForm = document.getElementById('account-form');
const editAccount = document.getElementById('edit-account');
const accountMessage = document.getElementById('account-message');
const accountEmail = document.querySelector('[data-account-email]');
const verification = document.getElementById('account-verification');
const sendCode = document.getElementById('send-account-code');
const saveAccount = accountForm.querySelector('[type="submit"]');
const cancelEdit = document.getElementById('cancel-account-edit');
const fields = accountForm.elements;

function closeAccountEditor() {
    accountForm.reset();
    verification.hidden = true;
    fields.nonce.required = false;
    accountForm.hidden = true;
    editAccount.hidden = false;
    editAccount.setAttribute('aria-expanded', 'false');
    editAccount.focus();
}

editAccount.addEventListener('click', () => {
    fields.email.value = window.ProtectCurrentUser.email || '';
    accountMessage.textContent = '';
    accountForm.hidden = false;
    editAccount.setAttribute('aria-expanded', 'true');
    editAccount.hidden = true;
    fields.email.focus();
});

cancelEdit.addEventListener('click', () => {
    accountMessage.textContent = '';
    closeAccountEditor();
});

sendCode.addEventListener('click', async () => {
    sendCode.disabled = true;
    try {
        const { error } = await ProtectAuth.client.auth.reauthenticate();
        if (error) throw error;
        accountMessage.textContent = 'Check your current email address for a verification code.';
        fields.nonce.focus();
    } catch {
        accountMessage.textContent = 'Could not send a verification code. Wait a moment and try again.';
    } finally {
        sendCode.disabled = false;
    }
});

accountForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (saveAccount.disabled) return;
    const email = fields.email.value.trim();
    const password = fields.password.value;
    if (password !== fields.confirmation.value) {
        accountMessage.textContent = 'The new passwords do not match.';
        fields.confirmation.focus();
        return;
    }

    const changes = {};
    if (email.toLowerCase() !== window.ProtectCurrentUser.email?.toLowerCase()) changes.email = email;
    if (password) changes.password = password;
    if (!changes.email && !changes.password) {
        accountMessage.textContent = 'Enter a new email address or password to save a change.';
        return;
    }
    if (password && !verification.hidden) changes.nonce = fields.nonce.value.trim();

    saveAccount.disabled = true;
    cancelEdit.disabled = true;
    accountMessage.textContent = 'Saving changes…';
    try {
        const { data, error } = await ProtectAuth.client.auth.updateUser(changes);
        if (error) throw error;
        window.ProtectCurrentUser = data.user;
        accountEmail.textContent = data.user.email;
        const emailPending = changes.email && data.user.email?.toLowerCase() !== email.toLowerCase();
        accountMessage.textContent = emailPending
            ? (password ? 'Password updated. Follow the confirmation instructions in your email to change your sign-in address.' : 'Follow the confirmation instructions in your email to change your sign-in address.')
            : 'Account updated.';
        closeAccountEditor();
    } catch (error) {
        if (error.code === 'reauthentication_needed') {
            verification.hidden = false;
            fields.nonce.required = true;
            accountMessage.textContent = 'Send a verification code to confirm your password change.';
            sendCode.focus();
        } else {
            accountMessage.textContent = error.message || 'Could not update your account. Try again.';
        }
    } finally {
        saveAccount.disabled = false;
        cancelEdit.disabled = false;
    }
});

fields.password.addEventListener('input', () => {
    fields.nonce.required = Boolean(fields.password.value) && !verification.hidden;
});
