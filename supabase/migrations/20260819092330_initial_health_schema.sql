begin;

create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum (
  'patient',
  'chw',
  'supervisor',
  'medical_officer',
  'admin'
);

create type public.risk_level as enum ('low', 'moderate', 'high', 'critical');
create type public.referral_status as enum ('pending', 'approved', 'declined', 'completed');
create type public.medication_status as enum ('active', 'paused', 'completed', 'discontinued');

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{2,32}$'),
  name text not null check (length(trim(name)) between 2 and 160),
  facility_type text not null default 'primary_health_centre',
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete restrict,
  supervisor_id uuid references public.profiles(id) on delete set null,
  role public.app_role not null default 'patient',
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  employee_code text unique,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_staff_facility_required check (
    role = 'patient' or facility_id is not null
  )
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique check (public_id ~ '^P[0-9]{3,12}$'),
  profile_id uuid unique references public.profiles(id) on delete set null,
  facility_id uuid not null references public.facilities(id) on delete restrict,
  registered_by uuid not null references public.profiles(id) on delete restrict,
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  age_years smallint check (age_years between 0 and 125),
  gender text check (gender in ('female', 'male', 'non_binary', 'other', 'unknown')),
  phone text,
  address text,
  family_history boolean not null default false,
  smoking boolean not null default false,
  alcohol boolean not null default false,
  active_lifestyle boolean not null default false,
  follow_up_date date,
  is_priority boolean not null default false,
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint patient_assignments_dates_valid check (
    ended_at is null or ended_at >= assigned_at
  )
);

create unique index patient_assignments_one_active_assignee_idx
  on public.patient_assignments (patient_id, assigned_to)
  where active;

create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  clinician_id uuid not null references public.profiles(id) on delete restrict,
  encounter_type text not null default 'clinic_visit',
  status text not null default 'completed'
    check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  clinical_notes text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  systolic smallint check (systolic between 40 and 300),
  diastolic smallint check (diastolic between 20 and 200),
  glucose_mg_dl numeric(6, 2) check (glucose_mg_dl between 10 and 1000),
  glucose_type text check (glucose_type in ('fasting', 'random', 'postprandial')),
  heart_rate smallint check (heart_rate between 20 and 250),
  weight_kg numeric(6, 2) check (weight_kg between 1 and 500),
  height_cm numeric(6, 2) check (height_cm between 20 and 260),
  bmi numeric(5, 2) check (bmi between 5 and 100),
  recorded_at timestamptz not null default now()
);

create table public.screenings (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  risk public.risk_level not null,
  symptoms text[] not null default '{}',
  input_data jsonb not null default '{}',
  result_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (patient_id, external_id)
);

create table public.medication_orders (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid references public.encounters(id) on delete set null,
  prescribed_by uuid not null references public.profiles(id) on delete restrict,
  medication_name text not null check (length(trim(medication_name)) between 2 and 160),
  dosage text not null check (length(trim(dosage)) between 1 and 80),
  frequency text not null check (length(trim(frequency)) between 1 and 120),
  instructions text,
  start_date date not null,
  end_date date,
  status public.medication_status not null default 'active',
  missed_doses integer not null default 0 check (missed_doses >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medication_orders_dates_valid check (
    end_date is null or end_date >= start_date
  ),
  unique (patient_id, external_id)
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  patient_id uuid not null references public.patients(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  destination_facility_name text not null,
  destination_clinician_name text,
  urgency text not null default 'normal'
    check (urgency in ('normal', 'urgent', 'emergency')),
  status public.referral_status not null default 'pending',
  reason text not null check (length(trim(reason)) >= 4),
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (patient_id, external_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index profiles_facility_role_idx on public.profiles (facility_id, role);
create index profiles_supervisor_id_idx on public.profiles (supervisor_id);
create index patients_facility_created_idx on public.patients (facility_id, created_at desc);
create index patients_profile_id_idx on public.patients (profile_id);
create index patient_assignments_assigned_to_idx
  on public.patient_assignments (assigned_to, patient_id)
  where active;
create index encounters_patient_occurred_idx on public.encounters (patient_id, occurred_at desc);
create index encounters_clinician_id_idx on public.encounters (clinician_id);
create index vitals_patient_recorded_idx on public.vitals (patient_id, recorded_at desc);
create index vitals_encounter_id_idx on public.vitals (encounter_id);
create index vitals_recorded_by_idx on public.vitals (recorded_by);
create index screenings_patient_created_idx on public.screenings (patient_id, created_at desc);
create index screenings_encounter_id_idx on public.screenings (encounter_id);
create index screenings_created_by_idx on public.screenings (created_by);
create index medication_orders_patient_status_idx
  on public.medication_orders (patient_id, status, created_at desc);
create index medication_orders_encounter_id_idx on public.medication_orders (encounter_id);
create index medication_orders_prescribed_by_idx on public.medication_orders (prescribed_by);
create index referrals_patient_status_idx on public.referrals (patient_id, status, created_at desc);
create index referrals_created_by_idx on public.referrals (created_by);
create index referrals_reviewed_by_idx on public.referrals (reviewed_by);
create index audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger facilities_set_updated_at
before update on public.facilities
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger patients_set_updated_at
before update on public.patients
for each row execute function private.set_updated_at();

create trigger encounters_set_updated_at
before update on public.encounters
for each row execute function private.set_updated_at();

create trigger medication_orders_set_updated_at
before update on public.medication_orders
for each row execute function private.set_updated_at();

create trigger referrals_set_updated_at
before update on public.referrals
for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'patient',
    coalesce(
      nullif(trim(new.raw_app_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'New patient'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
    and is_active;
$$;

create or replace function private.current_user_facility_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select facility_id
  from public.profiles
  where id = (select auth.uid())
    and is_active;
$$;

create or replace function private.can_access_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patients patient
    join public.profiles viewer
      on viewer.id = (select auth.uid())
     and viewer.is_active
    where patient.id = target_patient_id
      and (
        viewer.role = 'admin'
        or (viewer.role = 'patient' and patient.profile_id = viewer.id)
        or (
          viewer.role = 'medical_officer'
          and patient.facility_id = viewer.facility_id
        )
        or (
          viewer.role = 'chw'
          and (
            patient.registered_by = viewer.id
            or exists (
              select 1
              from public.patient_assignments assignment
              where assignment.patient_id = patient.id
                and assignment.assigned_to = viewer.id
                and assignment.active
            )
          )
        )
        or (
          viewer.role = 'supervisor'
          and exists (
            select 1
            from public.patient_assignments assignment
            join public.profiles team_member on team_member.id = assignment.assigned_to
            where assignment.patient_id = patient.id
              and assignment.active
              and team_member.supervisor_id = viewer.id
          )
        )
      )
  );
$$;

create or replace function private.can_edit_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'chw'
      and exists (
        select 1
        from public.patient_assignments assignment
        where assignment.patient_id = target_patient_id
          and assignment.assigned_to = (select auth.uid())
          and assignment.active
      )
    );
$$;

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (
    actor_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  values (
    (select auth.uid()),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger patients_audit
after insert or update or delete on public.patients
for each row execute function private.write_audit_log();

create trigger medication_orders_audit
after insert or update or delete on public.medication_orders
for each row execute function private.write_audit_log();

create trigger referrals_audit
after insert or update or delete on public.referrals
for each row execute function private.write_audit_log();

alter table public.facilities enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.patient_assignments enable row level security;
alter table public.encounters enable row level security;
alter table public.vitals enable row level security;
alter table public.screenings enable row level security;
alter table public.medication_orders enable row level security;
alter table public.referrals enable row level security;
alter table public.audit_logs enable row level security;

create policy facilities_select_authorized
on public.facilities
for select
to authenticated
using (
  id = (select private.current_user_facility_id())
  or (select private.current_user_role()) = 'admin'
);

create policy profiles_select_authorized
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_role()) = 'admin'
  or (
    (select private.current_user_role()) = 'medical_officer'
    and facility_id = (select private.current_user_facility_id())
  )
  or (
    (select private.current_user_role()) = 'supervisor'
    and (supervisor_id = (select auth.uid()) or id = (select auth.uid()))
  )
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy patients_select_authorized
on public.patients
for select
to authenticated
using ((select private.can_access_patient(id)));

create policy patients_insert_chw_or_admin
on public.patients
for insert
to authenticated
with check (
  registered_by = (select auth.uid())
  and facility_id = (select private.current_user_facility_id())
  and (select private.current_user_role()) in ('chw', 'admin')
);

create policy patients_update_assigned_chw_or_admin
on public.patients
for update
to authenticated
using ((select private.can_edit_patient(id)))
with check (
  (select private.can_edit_patient(id))
  and (
    (select private.current_user_role()) = 'admin'
    or facility_id = (select private.current_user_facility_id())
  )
);

create policy patients_delete_admin
on public.patients
for delete
to authenticated
using ((select private.current_user_role()) = 'admin');

create policy patient_assignments_select_authorized
on public.patient_assignments
for select
to authenticated
using ((select private.can_access_patient(patient_id)));

create policy patient_assignments_insert_authorized
on public.patient_assignments
for insert
to authenticated
with check (
  assigned_by = (select auth.uid())
  and (select private.can_access_patient(patient_id))
  and (
    (select private.current_user_role()) = 'admin'
    or (
      (select private.current_user_role()) = 'chw'
      and assigned_to = (select auth.uid())
    )
    or (
      (select private.current_user_role()) = 'supervisor'
      and exists (
        select 1
        from public.profiles team_member
        where team_member.id = assigned_to
          and team_member.supervisor_id = (select auth.uid())
          and team_member.is_active
      )
    )
  )
);

create policy patient_assignments_update_supervisor_or_admin
on public.patient_assignments
for update
to authenticated
using (
  (select private.current_user_role()) = 'admin'
  or (
    (select private.current_user_role()) = 'supervisor'
    and exists (
      select 1
      from public.profiles team_member
      where team_member.id = assigned_to
        and team_member.supervisor_id = (select auth.uid())
    )
  )
)
with check (
  (select private.current_user_role()) = 'admin'
  or (
    (select private.current_user_role()) = 'supervisor'
    and exists (
      select 1
      from public.profiles team_member
      where team_member.id = assigned_to
        and team_member.supervisor_id = (select auth.uid())
    )
  )
);

create policy patient_assignments_delete_supervisor_or_admin
on public.patient_assignments
for delete
to authenticated
using (
  (select private.current_user_role()) = 'admin'
  or (
    (select private.current_user_role()) = 'supervisor'
    and exists (
      select 1
      from public.profiles team_member
      where team_member.id = assigned_to
        and team_member.supervisor_id = (select auth.uid())
    )
  )
);

create policy encounters_select_authorized
on public.encounters
for select
to authenticated
using ((select private.can_access_patient(patient_id)));

create policy encounters_insert_clinical_staff
on public.encounters
for insert
to authenticated
with check (
  clinician_id = (select auth.uid())
  and (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('chw', 'medical_officer', 'admin')
);

create policy encounters_update_clinician_or_admin
on public.encounters
for update
to authenticated
using (
  (clinician_id = (select auth.uid()) or (select private.current_user_role()) = 'admin')
  and (select private.can_access_patient(patient_id))
)
with check (
  (clinician_id = (select auth.uid()) or (select private.current_user_role()) = 'admin')
  and (select private.can_access_patient(patient_id))
);

create policy vitals_select_authorized
on public.vitals
for select
to authenticated
using ((select private.can_access_patient(patient_id)));

create policy vitals_insert_clinical_staff
on public.vitals
for insert
to authenticated
with check (
  recorded_by = (select auth.uid())
  and (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('chw', 'medical_officer', 'admin')
);

create policy vitals_update_recorder_or_admin
on public.vitals
for update
to authenticated
using (
  (recorded_by = (select auth.uid()) or (select private.current_user_role()) = 'admin')
  and (select private.can_access_patient(patient_id))
)
with check (
  (recorded_by = (select auth.uid()) or (select private.current_user_role()) = 'admin')
  and (select private.can_access_patient(patient_id))
);

create policy screenings_select_authorized
on public.screenings
for select
to authenticated
using ((select private.can_access_patient(patient_id)));

create policy screenings_insert_clinical_staff
on public.screenings
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('chw', 'medical_officer', 'admin')
);

create policy screenings_update_creator_or_admin
on public.screenings
for update
to authenticated
using (
  (created_by = (select auth.uid()) or (select private.current_user_role()) = 'admin')
  and (select private.can_access_patient(patient_id))
)
with check (
  (created_by = (select auth.uid()) or (select private.current_user_role()) = 'admin')
  and (select private.can_access_patient(patient_id))
);

create policy medication_orders_select_authorized
on public.medication_orders
for select
to authenticated
using ((select private.can_access_patient(patient_id)));

create policy medication_orders_insert_medical_staff
on public.medication_orders
for insert
to authenticated
with check (
  prescribed_by = (select auth.uid())
  and (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('medical_officer', 'admin')
);

create policy medication_orders_update_medical_staff
on public.medication_orders
for update
to authenticated
using (
  (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('medical_officer', 'admin')
)
with check (
  (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('medical_officer', 'admin')
);

create policy referrals_select_authorized
on public.referrals
for select
to authenticated
using ((select private.can_access_patient(patient_id)));

create policy referrals_insert_clinical_staff
on public.referrals
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('chw', 'medical_officer', 'admin')
);

create policy referrals_update_medical_staff
on public.referrals
for update
to authenticated
using (
  (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('medical_officer', 'admin')
)
with check (
  (select private.can_access_patient(patient_id))
  and (select private.current_user_role()) in ('medical_officer', 'admin')
);

create policy audit_logs_select_admin_or_supervisor
on public.audit_logs
for select
to authenticated
using (
  (select private.current_user_role()) = 'admin'
  or (
    (select private.current_user_role()) = 'supervisor'
    and exists (
      select 1
      from public.profiles team_member
      where team_member.id = actor_id
        and team_member.supervisor_id = (select auth.uid())
    )
  )
);

create or replace function public.sync_medication_orders(
  target_patient_id uuid,
  orders jsonb
)
returns setof public.medication_orders
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(orders) <> 'array' then
    raise exception 'Medication orders must be a JSON array';
  end if;

  if jsonb_array_length(orders) > 100 then
    raise exception 'A patient cannot receive more than 100 orders in one request';
  end if;

  if (select private.current_user_role()) not in ('medical_officer', 'admin')
     or not (select private.can_access_patient(target_patient_id)) then
    raise exception 'Not authorized to manage medication orders';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(orders) item
    where trim(coalesce(item ->> 'id', '')) = ''
       or trim(coalesce(item ->> 'name', '')) = ''
       or trim(coalesce(item ->> 'dosage', '')) = ''
       or trim(coalesce(item ->> 'frequency', '')) = ''
       or nullif(item ->> 'startDate', '') is null
  ) then
    raise exception 'Each medication order requires id, name, dosage, frequency, and startDate';
  end if;

  update public.medication_orders current_order
  set status = 'discontinued'
  where current_order.patient_id = target_patient_id
    and current_order.status in ('active', 'paused')
    and not exists (
      select 1
      from jsonb_array_elements(orders) item
      where item ->> 'id' = current_order.external_id
    );

  insert into public.medication_orders (
    external_id,
    patient_id,
    prescribed_by,
    medication_name,
    dosage,
    frequency,
    instructions,
    start_date,
    end_date,
    status,
    missed_doses
  )
  select
    trim(item ->> 'id'),
    target_patient_id,
    (select auth.uid()),
    trim(item ->> 'name'),
    trim(item ->> 'dosage'),
    trim(item ->> 'frequency'),
    nullif(trim(item ->> 'instructions'), ''),
    (item ->> 'startDate')::date,
    nullif(item ->> 'endDate', '')::date,
    case lower(coalesce(item ->> 'status', 'active'))
      when 'paused' then 'paused'::public.medication_status
      when 'completed' then 'completed'::public.medication_status
      when 'discontinued' then 'discontinued'::public.medication_status
      else 'active'::public.medication_status
    end,
    greatest(coalesce((item ->> 'missedDoses')::integer, 0), 0)
  from jsonb_array_elements(orders) item
  on conflict (patient_id, external_id)
  do update set
    medication_name = excluded.medication_name,
    dosage = excluded.dosage,
    frequency = excluded.frequency,
    instructions = excluded.instructions,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    status = excluded.status,
    missed_doses = excluded.missed_doses;

  return query
  select medication_order.*
  from public.medication_orders medication_order
  where medication_order.patient_id = target_patient_id
    and medication_order.status <> 'discontinued'
  order by medication_order.created_at;
end;
$$;

revoke all on public.facilities,
  public.profiles,
  public.patients,
  public.patient_assignments,
  public.encounters,
  public.vitals,
  public.screenings,
  public.medication_orders,
  public.referrals,
  public.audit_logs
from anon, authenticated;

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant select on public.facilities,
  public.profiles,
  public.patients,
  public.patient_assignments,
  public.encounters,
  public.vitals,
  public.screenings,
  public.medication_orders,
  public.referrals,
  public.audit_logs
to authenticated;

grant update (full_name, phone) on public.profiles to authenticated;
grant insert, update, delete on public.patients to authenticated;
grant insert, update, delete on public.patient_assignments to authenticated;
grant insert, update on public.encounters to authenticated;
grant insert, update on public.vitals to authenticated;
grant insert, update on public.screenings to authenticated;
grant insert, update on public.medication_orders to authenticated;
grant insert, update on public.referrals to authenticated;

revoke all on function private.set_updated_at() from public;
revoke all on function private.handle_new_auth_user() from public;
revoke all on function private.current_user_role() from public;
revoke all on function private.current_user_facility_id() from public;
revoke all on function private.can_access_patient(uuid) from public;
revoke all on function private.can_edit_patient(uuid) from public;
revoke all on function private.write_audit_log() from public;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_user_facility_id() to authenticated;
grant execute on function private.can_access_patient(uuid) to authenticated;
grant execute on function private.can_edit_patient(uuid) to authenticated;

revoke all on function public.sync_medication_orders(uuid, jsonb) from public;
grant execute on function public.sync_medication_orders(uuid, jsonb) to authenticated;

insert into public.facilities (
  id,
  code,
  name,
  facility_type,
  address,
  phone
)
values (
  '00000000-0000-4000-8000-000000000001',
  'DHC-001',
  'District Community Health Centre',
  'community_health_centre',
  'District Health Campus',
  '+91 80000 00001'
)
on conflict (id) do nothing;

commit;
