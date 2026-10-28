/* global process */
/**
 * Supabase Admin Seed CLI Script
 * Run locally with service_role key to provision demo auth users.
 * NEVER check in or expose SUPABASE_SERVICE_ROLE_KEY in client code!
 *
 * Usage:
 * SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-users.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin.lead@healthsystem.gov',
    password: 'DemoAdmin@123!',
    full_name: 'Admin Operations',
    role: 'admin',
    status: 'approved',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'vikram.singh@subdistrictops.org',
    password: 'DemoSupervisor@123!',
    full_name: 'Vikram Singh',
    role: 'supervisor',
    status: 'approved',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'sunita.patil@communityhealth.org',
    password: 'DemoCHW@123!',
    full_name: 'Sunita Patil',
    role: 'chw',
    status: 'approved',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'ramesh.kumar@communityhealth.org',
    password: 'DemoCHW@123!',
    full_name: 'Ramesh Kumar',
    role: 'chw',
    status: 'approved',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'ananya.roy@districtmed.org',
    password: 'DemoDoctor@123!',
    full_name: 'Dr. Ananya Roy (M.D.)',
    role: 'doctor',
    status: 'approved',
  },
];

async function seed() {
  console.log('Provisioning demo auth accounts in Supabase...');

  for (const user of DEMO_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('registered')) {
        console.log(`User ${user.email} already exists.`);
      } else {
        console.warn(`Could not create user ${user.email}:`, error.message);
      }
    } else {
      console.log(`Created auth user ${user.email} (ID: ${data.user.id})`);
    }

    // Upsert profile
    const targetId = data?.user?.id || user.id;
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: targetId,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      language_pref: 'en',
    });

    if (profileError) {
      console.warn(`Profile upsert error for ${user.email}:`, profileError.message);
    } else {
      console.log(`Updated profile for ${user.full_name} (${user.role}, ${user.status})`);
    }
  }

  console.log('Seed provisioning complete.');
}

seed().catch(console.error);
