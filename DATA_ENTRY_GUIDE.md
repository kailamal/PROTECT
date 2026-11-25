# Adding real data to P.R.O.T.E.C.T

## Current state

Supabase email/password authentication is wired into the website. The dashboard pages do not yet query database tables. All preloaded sample rows and figures have been removed. Zero cards mean no data is loaded into the page, not a verified count from your Supabase project.

Records > New record and the client edit form currently use browser-tab storage only. They are not Supabase inserts. Documents has no real upload form yet. Access & audit has no server-side administration yet. Adding rows in Supabase will not automatically populate these pages until database queries are implemented.

No remote database rows, Supabase users, or stored files were deleted by this cleanup. The obsolete local seeded-record cache is discarded. New browser-entered records use a separate cache key.

## Step 1: Set up accounts and permission rules first

1. Sign in to the Supabase Dashboard and select this application's project.
2. Open Authentication > Users and create the staff accounts that need access.
3. Decide who may see each case: assigned officer, supervisor, and administrator have different responsibilities. The system administrator role shown in the UI is account administration, not automatic case access.
4. Plan an officials/profile table linked to each Authentication user ID, with their display name, role, and active status.
5. Role changes must be restricted to an authorized server endpoint or project administrator. Never allow every signed-in user to change their own role. Do not use user-editable user_metadata to authorize access.

## Step 2: Create the application tables

1. Open Database > Table Editor > New table for each required entity.
2. Keep Row Level Security enabled on every exposed application table.
3. Use a primary key for each row and relationships to link dependent data. Recommended entities:

| Entity | Data to store | Used by |
| --- | --- | --- |
| officials | Auth user ID, name, role, active status | Access & audit, assigned officers |
| cases | Case ID, client name, assigned officer, supervision, status, dates, contact/location fields | Records, client details, Analytics |
| appointments | Linked case, date/time, purpose, arrival/completion status | Overview |
| documents | Linked case, document title/category, private storage path, version, timestamps | Documents and client Documents tab |
| follow_ups | Linked case/appointment, assigned officer, review status, review notes | Overview attention list |
| access_requests | Requesting user, requested access, reason, decision, reviewer | Access & audit |
| audit_events | Actor, action, timestamp, reference, result | Access & audit and Overview activity |

4. Configure foreign keys, required fields, unique case identifiers, and sensible defaults before importing data.
5. Add RLS policies that match the assigned-officer and supervisor rules. Authentication alone must not allow access to every case. Users should not be able to insert, rewrite, or delete authoritative audit events directly.
6. Test policies using separate staff accounts before importing confidential case data. SQL Editor and privileged Table Editor actions can bypass the restrictions your browser users face.

This is a setup plan, not an already installed schema. The exact column names and policies must be matched to the frontend integration before the pages can read or write them.

## Step 3: Enter case records

1. Create or import staff/profile rows first so cases can be assigned to existing officials.
2. In Table Editor, open the cases table and choose Insert > Insert row, or import a CSV with matching columns.
3. Enter the client name, unique case identifier, supervision type, assigned official, status, and relevant dates.
4. Save the row and verify its assigned official.
5. After the frontend is connected, Records > New record will insert into this table, and clicking the client name will load the matching case by its identifier.

For now, Records > New record creates only a temporary browser record. Do not treat that as a cloud save.

## Step 4: Add documents

1. Open Storage and create a private bucket named case-documents. Leave Public disabled.
2. Configure storage policies so users can access only the documents belonging to cases they are authorized to access.
3. Upload a file into an appropriate case folder using the Supabase Dashboard.
4. Insert a documents metadata row linked to the case: title, category, version, storage path, and update date.
5. Once integrated, the case page will upload files and insert metadata together; Documents will query the metadata and request authorized signed URLs for previews.

Uploading a file alone does not create its metadata row. Creating metadata alone does not upload a file.

## Step 5: Add visits and follow-ups

1. In the appointments table, insert the linked case, scheduled date/time, purpose, and status.
2. Use explicit statuses such as scheduled, checked_in, completed, and missed; frontend and database must use the same values.
3. For a missed appointment requiring attention, create a linked follow_ups row with its officer, reason, and review status.

## Step 6: Populate Overview

Do not manually enter summary card totals. They should be computed from real rows:

- Appointments today and upcoming visits: appointments for the selected office-local date.
- New intakes: cases created in the selected period.
- Documents received: documents added in the period.
- Needs attention: open follow-ups and overdue work.
- Recent activity: server-recorded audit events.
- Reports due: requires a reporting schedule/task source; no report scheduling table or form currently exists.

The Overview queries still need to be implemented.

## Step 7: Populate Analytics

1. Enter and maintain actual case statuses and supervision types.
2. Calculate active caseload, compliant cases, pending reviews, follow-ups, and supervision totals from cases, using only the rows the viewer is authorized to report on.
3. Define the compliance denominator and eligible statuses consistently before publishing reports.
4. For a historical trend, retain dated status history or scheduled aggregate snapshots. Today's case statuses cannot reliably reconstruct previous months.
5. Implement aggregate queries and export them without client personal details.

Do not type analytics totals manually. Analytics has no connected data source yet, so its export controls currently explain that no data is available.

## Step 8: Populate Access & audit

1. Authentication > Users creates the login account.
2. A linked officials/profile row supplies the application's display name, assigned role, and status.
3. Requests need an actual request form plus a restricted server-side review endpoint. The on-screen Manage and Review controls are not real account administration yet.
4. Write audit events on the server when real actions occur. Database triggers can capture writes; record access and exports need explicit trusted logging. A browser-generated event is not a trustworthy audit record.
5. Grant read access to the audit trail only to the intended roles, and prevent browser updates/deletes.

## Integration order

Connect officials and cases first, then client details, document storage, appointments/follow-ups, Overview, Analytics, and finally privileged account administration/auditing. After each integration, create a row through the app, confirm it exists in Supabase, reload the page, and verify it persists. Test with an unassigned account to confirm access is denied.

## Official references

- Tables and imports: https://supabase.com/docs/guides/database/tables
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Private storage buckets: https://supabase.com/docs/guides/storage/buckets/creating-buckets
