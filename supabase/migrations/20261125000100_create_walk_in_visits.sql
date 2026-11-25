create table public.walk_in_visits (
    id uuid primary key default gen_random_uuid(),
    created_by uuid not null default auth.uid() references auth.users(id),
    name text not null check (char_length(btrim(name)) between 1 and 120),
    purpose text not null check (char_length(btrim(purpose)) between 1 and 160),
    date date not null,
    time time without time zone not null,
    notes text not null default '' check (char_length(notes) <= 1000)
);
alter table public.walk_in_visits enable row level security;
revoke all on public.walk_in_visits from public, anon, authenticated;
grant select, insert on public.walk_in_visits to authenticated;
create policy "Staff can read permitted walk-ins" on public.walk_in_visits
    for select to authenticated using (
        (select protect_private.app_role()) = 'supervisor'
        or ((select protect_private.app_role()) in ('officer', 'administrator')
            and created_by = (select auth.uid()))
    );
create policy "Staff can submit their own walk-ins" on public.walk_in_visits
    for insert to authenticated with check (
        created_by = (select auth.uid())
        and (select protect_private.app_role()) in ('officer', 'supervisor', 'administrator')
    );
create index walk_in_visits_date_idx on public.walk_in_visits (date desc, time desc, id);
create index walk_in_visits_creator_idx on public.walk_in_visits (created_by);
