(function () {
'use strict';

const auth = window.ProtectAuth;
const form = document.getElementById('sign-in-form');
const status = document.getElementById('form-status');
const submit = form.querySelector('[type="submit"]');
const password = document.getElementById('password');
const email = document.getElementById('email');
const toggle = document.getElementById('toggle-password');
let busy = false;

function message(text) { status.textContent = text; }
function ready() {
    if (!auth || !auth.client || auth.error) { message(auth?.error || 'Authentication scripts did not initialize. Reload this page using Live Server.'); return false; }
    return true;
}

toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.setAttribute('aria-pressed', String(show));
});

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !ready()) return;
    if (!email.value.trim() || !email.checkValidity()) {
        message('Enter a valid email address before signing in.');
        email.focus();
        return;
    }
    if (!password.value) {
        message('Enter your password before signing in.');
        password.focus();
        return;
    }
    busy = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    message('Signing in...');
    try {
        const { data, error } = await auth.client.auth.signInWithPassword({
            email: email.value.trim(), password: password.value
        });
        if (error) {
            if (error.code === 'email_not_confirmed') message('Confirm your email address before signing in.');
            else if (error.code === 'invalid_credentials') message('Unable to sign in: Supabase rejected the email/password combination (invalid_credentials). Check the account in Authentication > Users in the same project.');
            else if (error.code === 'email_provider_disabled') message('Email/password sign-in is disabled for this Supabase project.');
            else if (error.status === 429) message('Too many attempts. Please wait before trying again.');
            else if (error.status === 401 || error.status === 403) message('Supabase rejected this request. Verify that the Project URL and publishable key belong to the same project.');
            else message(`Unable to sign in. Authentication error: ${error.code || 'request_failed'}. Please contact your administrator.`);
            return;
        }
        if (!data.session) { message('No session was returned. Please try again.'); return; }
        password.value = '';
        location.replace('../overview/overview.html');
    } catch (error) {
        message('Could not reach Supabase. Check your connection and project settings.');
    } finally {
        busy = false;
        submit.disabled = false;
        form.removeAttribute('aria-busy');
    }
});

const dialog = document.getElementById('information-dialog');
const messages = {
    privacy: ['Privacy notice', 'Access is restricted to authorized officials. Contact the office administrator for the official confidentiality and privacy policy.'],
    support: ['Account support', 'Contact your office administrator for account creation, access changes, or sign-in assistance.']
};
document.querySelectorAll('[data-dialog]').forEach(button => {
    button.addEventListener('click', async () => {
        if (button.dataset.dialog === 'reset') {
            if (busy || !ready()) return;
            if (!email.value.trim() || !email.checkValidity()) {
                message('Enter your official email address first, then select Forgot password.');
                email.focus();
                email.reportValidity();
                return;
            }
            busy = true;
            button.disabled = true;
            message('Requesting a password reset...');
            try {
                const redirectTo = new URL('reset-password.html', location.href).href;
                const { error } = await auth.client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo });
                message(error ? 'Could not request a reset. Please wait and try again, or contact your administrator.'
                    : 'If an eligible account exists, a password reset email will be sent. Check your inbox and spam folder.');
            } catch (error) {
                message('Could not reach Supabase. Check your connection.');
            } finally {
                busy = false;
                button.disabled = false;
            }
            return;
        }
        const [title, copy] = messages[button.dataset.dialog];
        document.getElementById('dialog-title').textContent = title;
        document.getElementById('dialog-copy').textContent = copy;
        dialog.showModal();
    });
});

if (auth?.error) message(auth.error);
else if (auth?.client) message('Ready to sign in. Enter your email and password.');
else message('Authentication did not initialize. Open this page using the local server and reload.');
window.PROTECT_SIGNIN_READY = true;
form.addEventListener('invalid', event => {
    message(event.target.id === 'email' ? 'Enter a valid email address, for example admin1@protect.com.' : 'Enter your password.');
}, true);
if (typeof URLSearchParams !== 'undefined') {
    const reason = new URLSearchParams(location.search).get('auth_error');
    const errors = {
        session: 'Your sign-in session could not be verified. Please sign in again. Use the same browser address for every page.',
        connection: 'The dashboard could not verify your session with Supabase. Check your connection and try again.',
        configuration: 'The dashboard could not initialize authentication. Check auth/config.js and reload.'
    };
    if (reason && errors[reason]) message(errors[reason]);
}


})();
