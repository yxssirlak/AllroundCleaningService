create or replace function public.login_email_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from auth.users
     where lower(auth.users.email) = lower(p_email)
  );
$$;

revoke all on function public.login_email_exists(text) from public, anon, authenticated;
grant execute on function public.login_email_exists(text) to anon, authenticated;
