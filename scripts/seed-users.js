/* global process */
/**
 * Supabase User Provisioning & First Admin Setup Script
 *
 * This utility uses the Supabase Admin API (`service_role` key) to provision
 * standard institutional accounts and configure the first Administrator.
 *
 * ==============================================================================
 * HOW TO CREATE THE FIRST ADMIN:
 * ==============================================================================
 * Method 1 (Automated CLI via Service Role Key):
 *   1. Go to your Supabase Project Dashboard -> Project Settings -> API.
 *   2. Copy the "Project URL" and the secret "service_role" key.
 *   3. Run from your local terminal:
 *      SUPABASE_URL="https://your-project.supabase.co" \
 *      SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key" \
 *      node scripts/seed-users.js
 *
 * Method 2 (Manual Supabase SQL Editor):
 *   If you already registered a user via the app signup UI (e.g. admin@gov.in),
 *   run this SQL query in the Supabase SQL Editor:
 *
 *   UPDATE public.profiles
 *   SET role = 'admin', status = 'approved', updated_at = NOW()
 *   WHERE email = 'admin@gov.in';
 *
 * Method 3 (Supabase Dashboard Table Editor):
 *   1. Navigate to Table Editor -> public.profiles.
 *   2. Find your user row.
 *   3. Set `role` to 'admin' and `status` to 'approved'. Save row.
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  console.error('Usage: SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node scripts/seed-users.js\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin.lead@healthsystem.gov',
    password: 'DemoAdmin@123!',
    full_name: 'Admin Operations',
    role: 'admin',
    status: 'approved',
    subcenter: 'District Health Office',
    phone: '+91 9820011001'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'vikram.singh@subdistrictops.org',
    password: 'DemoSupervisor@123!',
    full_name: 'Vikram Singh',
    role: 'supervisor',
    status: 'approved',
    subcenter: 'Belagavi Sub-District PHC',
    phone: '+91 9820011002'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'sunita.patil@communityhealth.org',
    password: 'DemoCHW@123!',
    full_name: 'Sunita Patil',
    role: 'chw',
    status: 'approved',
    subcenter: 'Vimanapura Subcenter',
    phone: '+91 9820011003'
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'ramesh.kumar@communityhealth.org',
    password: 'DemoCHW@123!',
    full_name: 'Ramesh Kumar',
    role: 'chw',
    status: 'approved',
    subcenter: 'Kittur Rural Subcenter',
    phone: '+91 9820011004'
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'ananya.roy@districtmed.org',
    password: 'DemoDoctor@123!',
    full_name: 'Dr. Ananya Roy (M.D.)',
    role: 'doctor',
    status: 'approved',
    subcenter: 'District Civil Hospital',
    phone: '+91 9820011005'
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'priya.sharma@patienthealth.net',
    password: 'DemoPatient@123!',
    full_name: 'Priya Sharma',
    role: 'patient',
    status: 'approved',
    subcenter: 'Vimanapura Subcenter',
    phone: '+91 9820011111'
  }
];

async function seed() {
  console.log('------------------------------------------------------------');
  console.log('🚀 CHW Toolkit: Provisioning Production Users & Profiles...');
  console.log('Target Supabase Instance:', supabaseUrl);
  console.log('------------------------------------------------------------');

  for (const user of SEED_USERS) {
    let authUserId = user.id;

    // Check if user already exists in auth.users
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users?.find(u => u.email?.toLowerCase() === user.email.toLowerCase());

    if (existing) {
      console.log(`ℹ️ User ${user.email} already exists in auth.users (ID: ${existing.id})`);
      authUserId = existing.id;
      // Ensure password is updated
      await supabase.auth.admin.updateUserById(existing.id, {
        password: user.password,
        user_metadata: { full_name: user.full_name, role: user.role }
      });
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.full_name, role: user.role },
      });

      if (error) {
        console.warn(`⚠️ Could not create auth user ${user.email}:`, error.message);
      } else {
        authUserId = data.user.id;
        console.log(`✅ Created auth user ${user.email} (ID: ${authUserId})`);
      }
    }

    // Upsert into profiles table
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authUserId,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      subcenter: user.subcenter,
      phone: user.phone,
      language_pref: 'en',
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      console.warn(`⚠️ Profile upsert warning for ${user.email}:`, profileError.message);
    } else {
      console.log(`  └─ Profile verified: [${user.role.toUpperCase()}] status: ${user.status}`);
    }
  }

  console.log('------------------------------------------------------------');
  console.log('🎉 Seed complete! First Administrator is ready:');
  console.log('   Email:    admin.lead@healthsystem.gov');
  console.log('   Password: DemoAdmin@123!');
  console.log('   Role:     admin');
  console.log('------------------------------------------------------------');
}

seed().catch(err => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});
