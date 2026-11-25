create policy "Desktop staff can read mobile walk-ins" on public.walk_in_visits
    for select to authenticated using (
        submitted_from_mobile_account
        and exists (
            select 1 from public.official_profiles
            where id = (select auth.uid())
              and role in ('officer', 'supervisor', 'administrator')
        )
    );
