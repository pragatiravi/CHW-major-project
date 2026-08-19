import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serverSecretKey = process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const demoPassword = process.env.SUPABASE_DEMO_PASSWORD;

if (!supabaseUrl || !serverSecretKey || !publishableKey || !demoPassword) {
  throw new Error('Supabase verification credentials are incomplete.');
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

const admin = createClient(supabaseUrl, serverSecretKey, clientOptions);
const tables = [
  'facilities',
  'profiles',
  'patients',
  'patient_assignments',
  'vitals',
  'screenings',
  'medication_orders',
  'referrals',
  'audit_logs',
];

for (const table of tables) {
  const { count, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(table + ': ' + error.message);
  }

  console.log(table.toUpperCase() + '_COUNT=' + count);
}

const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (users.error) {
  throw users.error;
}
console.log('AUTH_USER_COUNT=' + users.data.users.length);

const anonymous = createClient(supabaseUrl, publishableKey, clientOptions);
const anonymousResult = await anonymous
  .from('patients')
  .select('id', { count: 'exact', head: true });
console.log('ANON_PATIENT_ACCESS_BLOCKED=' + Boolean(anonymousResult.error));

const medicalOfficer = createClient(supabaseUrl, publishableKey, clientOptions);
const login = await medicalOfficer.auth.signInWithPassword({
  email: 'ananya.roy@districtmed.org',
  password: demoPassword,
});

if (login.error) {
  throw new Error('Medical officer login: ' + login.error.message);
}

const patientResult = await medicalOfficer
  .from('patients')
  .select('id', { count: 'exact', head: true });
if (patientResult.error) {
  throw new Error('Medical officer patients: ' + patientResult.error.message);
}

const orderResult = await medicalOfficer
  .from('medication_orders')
  .select('id', { count: 'exact', head: true });
if (orderResult.error) {
  throw new Error('Medical officer medication orders: ' + orderResult.error.message);
}

console.log('MEDICAL_OFFICER_PATIENT_COUNT=' + patientResult.count);
console.log('MEDICAL_OFFICER_ORDER_COUNT=' + orderResult.count);
await medicalOfficer.auth.signOut();

console.log('Supabase verification completed successfully.');
