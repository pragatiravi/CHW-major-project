begin;

-- Event triggers invoke this function internally; API roles never need direct access.
revoke all on function public.rls_auto_enable()
from public, anon, authenticated, service_role;

commit;
