alter table public.official_profiles drop constraint official_profiles_role_check;
alter table public.official_profiles add constraint official_profiles_role_check
    check (role in ('officer','supervisor','administrator','mobile_walk_ins'));

alter table public.walk_in_visits add column submitted_from_mobile_account boolean not null
    default coalesce(protect_private.app_role() = 'mobile_walk_ins', false);

alter policy "Staff can read permitted walk-ins" on public.walk_in_visits using (
    (select protect_private.app_role()) = 'supervisor'
    or ((select protect_private.app_role()) in ('officer','administrator')
        and (submitted_from_mobile_account or created_by = (select auth.uid())))
    or ((select protect_private.app_role()) = 'mobile_walk_ins' and created_by = (select auth.uid()))
);
alter policy "Staff can submit their own walk-ins" on public.walk_in_visits with check (
    created_by = (select auth.uid())
    and (select protect_private.app_role()) in ('officer','supervisor','administrator','mobile_walk_ins')
    and submitted_from_mobile_account = ((select protect_private.app_role()) = 'mobile_walk_ins')
);
