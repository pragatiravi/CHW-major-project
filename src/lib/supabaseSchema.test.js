import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const migrationsUrl = new URL('../../supabase/migrations/', import.meta.url);
const migrationName = readdirSync(migrationsUrl).find((name) =>
  name.endsWith('_initial_health_schema.sql'),
);
const migration = readFileSync(new URL(migrationName, migrationsUrl), 'utf8');

const exposedTables = [
  'facilities',
  'profiles',
  'patients',
  'patient_assignments',
  'encounters',
  'vitals',
  'screenings',
  'medication_orders',
  'referrals',
  'audit_logs',
];

describe('Supabase health schema security', () => {
  it('enables RLS on every exposed application table', () => {
    exposedTables.forEach((table) => {
      expect(migration).toContain(
        'alter table public.' + table + ' enable row level security;',
      );
    });
  });

  it('uses current authorization patterns and explicit API grants', () => {
    expect(migration).not.toContain('auth.role()');
    expect(migration).toContain('from anon, authenticated;');
    expect(migration).toContain('grant select on public.facilities');
    expect(migration).toContain('grant execute on function public.sync_medication_orders');
  });

  it('keeps medication writes restricted to medical staff', () => {
    expect(migration).toContain('medication_orders_insert_medical_staff');
    expect(migration).toContain("in ('medical_officer', 'admin')");
    expect(migration).toContain('security invoker');
  });
});
