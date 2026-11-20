(function () {
    'use strict';
    const scriptUrl = document.currentScript.src;
    const signInUrl = new URL('../signin/sign-in.html', scriptUrl).href;
    const profileUrl = new URL('../profile/profile.html', scriptUrl).href;
    const auth = window.ProtectAuth;
    let accountControlsReady = false;
    let signingOut = false;

    function redirect(reason) {
        const destination = new URL(signInUrl);
        if (reason) destination.searchParams.set('auth_error', reason);
        location.replace(destination.href);
    }
    function bindSignOut(button, status) {
        const label = button.textContent;
        button.addEventListener('click', async () => {
            if (signingOut) return;
            signingOut = true;
            status.textContent = '';
            button.disabled = true;
            button.textContent = 'Logging out...';
            try {
                const { error } = await auth.client.auth.signOut({ scope: 'local' });
                if (error) throw error;
                try {
                    sessionStorage.removeItem('protect-demo-records-v1');
                    sessionStorage.removeItem('protect-records-v2');
                } catch (error) { /* Browser storage is optional. */ }
                redirect();
            } catch (error) {
                status.textContent = 'Sign-out failed. Check your connection and try again.';
                signingOut = false;
                button.disabled = false;
                button.textContent = label;
            }
        });
    }

    function setupAccountControls() {
        if (accountControlsReady) return;
        accountControlsReady = true;
        const profileSignOut = document.querySelector('[data-profile-sign-out]');
        const footer = document.querySelector('.sidebar-footer');
        const account = footer?.querySelector('.officer');
        if (account) {
            const link = document.createElement('a');
            link.className = account.className;
            link.href = profileUrl;
            link.setAttribute('aria-label', 'My profile');
            if (profileSignOut) link.setAttribute('aria-current', 'page');
            link.append(...account.childNodes);
            account.replaceWith(link);
        }

        const navigation = document.querySelector('.navigation');
        if (navigation) {
            const link = document.createElement('a');
            const mobile = window.matchMedia('(max-width: 650px)');
            link.className = 'nav-link';
            link.href = profileUrl;
            link.textContent = 'My profile';
            if (profileSignOut) link.setAttribute('aria-current', 'page');
            const update = () => { link.style.display = mobile.matches ? '' : 'none'; };
            update();
            mobile.addEventListener('change', update);
            navigation.append(link);
        }

        if (profileSignOut) {
            bindSignOut(profileSignOut, document.querySelector('[data-sign-out-error]'));
        } else if (footer) {
            const status = document.createElement('p');
            status.setAttribute('role', 'alert');
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Sign out';
            button.className = 'nav-link';
            bindSignOut(button, status);
            footer.append(button, status);
        }
    }

    async function check() {
        if (!auth || auth.error || !auth.client) { redirect('configuration'); return; }
        try {
            const { data, error } = await auth.client.auth.getUser();
            if (error || !data.user) { redirect('session'); return; }
            window.ProtectCurrentUser = data.user;
            const email = data.user.email || 'Signed-in account';
            document.querySelectorAll('.officer-name, [data-account-email]').forEach(name => {
                name.textContent = email;
            });
            const avatar = document.querySelector('.avatar');
            if (avatar) avatar.textContent = email.slice(0, 2).toUpperCase();
            setupAccountControls();
            document.documentElement.classList.remove('auth-pending');
        } catch (error) { redirect('connection'); }
    }
    if (auth && auth.client) {
        auth.client.auth.onAuthStateChange(event => {
            if (event === 'SIGNED_OUT') redirect();
        });
    }
    window.addEventListener('pageshow', event => { if (event.persisted) { document.documentElement.classList.add('auth-pending'); check(); } });
    check();
})();
