# Supabase email/password setup

1. Create a project at https://supabase.com/dashboard.
2. Under Authentication > Sign In / Providers, enable Email/password. Disable new-user sign-ups for this staff-only application.
3. Under Authentication > Users > Add user > Create new user, create a test account with a password. Confirm its email for testing. Do not send the password in chat.
4. Under Authentication > URL Configuration, set Site URL to http://127.0.0.1:5500. Add http://127.0.0.1:5500/signin/reset-password.html as an allowed redirect URL.
5. Copy the Project URL and publishable key from the Connect dialog or project API settings into auth/config.js. The key should start with sb_publishable_. Never use a secret key, service_role key, database password, or Supabase account password in the code.
6. Serve the entire D:/Protect folder over HTTP. With VS Code Live Server, open the project root and serve signin/sign-in.html. Alternatively run: python -m http.server 5500 --bind 127.0.0.1 from D:/Protect.
7. Visit http://127.0.0.1:5500/signin/sign-in.html. Use the account created in step 3. Successful sign-in opens Overview.
8. Test a wrong password: an error should appear without navigation. Test Sign out in the sidebar, then open Overview directly: you should return to Sign in.
9. Test Forgot password: enter the account email, request a reset, open the email link, choose a new password, and sign in again. Configure custom SMTP under Authentication email settings for delivery to your staff. Supabase's default email sender has restrictions and is intended for testing.

Use exactly the same host and port for all pages and redirect URLs. If you use localhost instead of 127.0.0.1 or change the port, update Supabase's URLs accordingly. Configure HTTPS URLs and your own SMTP before deployment.

## What is connected

- Supabase email/password authentication, session refresh, password recovery, sign-out.
- All existing app pages redirect to Sign in when no valid user can be verified.
- One shared browser-safe configuration in auth/config.js.

## What is still demo data

Cases, documents, officials, analytics, visits, and audit events remain the existing browser-side samples. Authentication does not turn those samples into database records or enforce the displayed roles. Client page redirects are navigation controls, not database authorization. Before storing real records, create the necessary database schema and Row Level Security policies for your assigned-case/role rules. No public tables or policies were created for this sign-in task.

The sidebar's sample officer card remains part of the mockup; the email shown next to Sign out identifies the actual signed-in account.

## Verification limits

Static links, JavaScript syntax, configuration validation, and mocked sign-in flows are checked locally. Real authentication and email delivery must be tested after configuring your project. No live project credentials are included.

## References

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/getting-started/api-keys
