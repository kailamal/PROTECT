const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const code = fs.readFileSync('auth/client.js', 'utf8');
function check(config, protocol = 'http:', library = true) {
    const context = {
        window: { PROTECT_SUPABASE: config },
        location: { protocol }, URL
    };
    if (library) context.window.supabase = { createClient: () => ({ auth: {} }) };
    vm.runInNewContext(code, context);
    return context.window.ProtectAuth;
}
assert(check({}).error.includes('incomplete'));
assert(check({url:'https://demo.supabase.co',publishableKey:'sb_secret_no'}).error.includes('publishable'));
assert(check({},'file:').error.includes('HTTP'));
assert(check({url:'https://demo.supabase.co',publishableKey:'sb_publishable_example'},'http:',false).error.includes('could not load'));
assert(check({url:'https://demo.supabase.co',publishableKey:'sb_publishable_example'}).client);

async function loginTest(result, throws = false) {
    const listeners = {};
    function element(id) {
        return {
            value: id === 'email' ? ' user@example.com ' : 'test-password', disabled: false,
            addEventListener: (event, fn) => { listeners[`${id}:${event}`] = fn; },
            checkValidity: () => true, focus() {}, setAttribute() {}, removeAttribute() {}, querySelector: () => elements.submit
        };
    }
    const elements = {};
    ['sign-in-form','form-status','submit','password','email','toggle-password','information-dialog'].forEach(id => elements[id] = element(id));
    let credentials;
    let destination;
    const context = {
        window: { ProtectAuth: { error: '', client: { auth: {
            signInWithPassword: async input => { credentials = input; if (throws) throw Error('network'); return result; }
        } } } },
        document: { getElementById: id => elements[id], querySelectorAll: () => [] },
        location: { replace: value => { destination = value; } }
    };
    vm.runInNewContext(fs.readFileSync('signin/script.js','utf8'), context);
    await listeners['sign-in-form:submit']({preventDefault(){}});
    assert.equal(credentials.email, 'user@example.com');
    assert.equal(elements.submit.disabled, false);
    return { destination, status: elements['form-status'].textContent, password: elements.password.value };
}
(async () => {
    const success = await loginTest({data:{session:{access_token:'mock'}},error:null});
    assert.equal(success.destination,'../overview/overview.html');
    assert.equal(success.password,'');
    const denied = await loginTest({data:{},error:{code:'invalid_credentials',status:400}});
    assert(!denied.destination);
    assert(denied.status.includes('Unable to sign in'));
    const offline = await loginTest(null,true);
    assert(offline.status.includes('Could not reach'));
    console.log('Passed: config validation, unsafe key rejection, successful sign-in, invalid credentials, and network failure.');
})().catch(error => { console.error(error); process.exitCode=1; });
