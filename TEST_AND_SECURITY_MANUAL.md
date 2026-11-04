# CHW Healthcare Toolkit — Test & Security Manual

## 1. Click-by-Click Supabase Auth URL Configuration

In your Supabase Dashboard for project `hpnwtjntcmxwpslpjlzi`:
1. Go to **Authentication** > **URL Configuration**.
2. **Site URL**:
   Set to:
   ```text
   https://chw-major-project.vercel.app
   ```
3. **Redirect URLs** (Add both):
   - `https://chw-major-project.vercel.app/**`
   - `http://localhost:5173/**`
4. Click **Save**.

---

## 2. SQL to Promote Your First Admin

Run this in your **Supabase Dashboard > SQL Editor**:

```sql
-- Replace with the email address you signed up with:
SELECT public.promote_user_to_admin('your-email@example.com');

-- Verification query:
SELECT id, full_name, email, role, status 
FROM public.profiles 
JOIN auth.users ON public.profiles.id = auth.users.id
WHERE auth.users.email = 'your-email@example.com';
```
*Expected Output*: `role = 'admin'` and `status = 'approved'`.

---

## 3. End-to-End Manual Test Script & SQL Checks

### Test Flow 1: Staff Registration → Pending → Blocked → Approved → Registers Patient
1. **Sign Up as a CHW**:
   - Go to `https://chw-major-project.vercel.app` (or `localhost:5173`).
   - Click **Sign In / Register** > toggle to **Register**.
   - Select **Healthcare Staff**, choose role **Community Health Worker (ASHA)**.
   - Enter Name (`Kavita Gowda`), Email (`kavita.chw@test.com`), Password (`TestPass@123!`), Mobile (`9876543210`), Village (`Kittur Subcenter`).
   - Click **Create Account**.
2. **SQL Check: Pending Status**:
   ```sql
   SELECT p.full_name, p.role, p.status, p.subcenter, u.email
   FROM public.profiles p
   JOIN auth.users u ON p.id = u.id
   WHERE u.email = 'kavita.chw@test.com';
   ```
   *Expected Output*: `role = 'chw'`, `status = 'pending'`, `subcenter = 'Kittur Subcenter'`.
3. **Login Attempt while Pending**:
   - Try to log in with `kavita.chw@test.com`.
   - *Expected Result*: Login is blocked immediately with a translated message stating the account is pending supervisor verification.
4. **Supervisor / Admin Approves Staff & Assigns Subcenter**:
   ```sql
   UPDATE public.profiles
   SET status = 'approved', subcenter = 'Kittur Primary Health Subcenter', updated_at = NOW()
   WHERE id = (SELECT id FROM auth.users WHERE email = 'kavita.chw@test.com');
   ```
5. **Login Attempt after Approval**:
   - Sign in with `kavita.chw@test.com` and `TestPass@123!`.
   - *Expected Result*: Successful sign in, lands directly on CHW Portal with verified session banner.
6. **Register a Patient**:
   - In the CHW Portal, click **Register New Patient**.
   - Register patient `Basamma Patil`, age 52, BP 142/90, Sugar 165 mg/dL.
   - Save patient.
   - Check Supabase SQL:
   ```sql
   SELECT id, custom_id, name, age, village, created_by, assigned_chw 
   FROM public.patients 
   WHERE name = 'Basamma Patil';
   ```
   *Expected Output*: 1 row returned, with `created_by` matching Kavita's UUID.

---

### Test Flow 2: Patient Registration → Immediate Access
1. Sign up with Category **Patient / Family** with email `patient.test@example.com`.
2. Check Supabase SQL:
   ```sql
   SELECT p.role, p.status FROM public.profiles p
   JOIN auth.users u ON p.id = u.id WHERE u.email = 'patient.test@example.com';
   ```
   *Expected Output*: `role = 'patient'`, `status = 'approved'`.
3. Sign in immediately works without waiting for supervisor approval.

---

### Test Flow 3: Role Spoofing Protection (Browser Console)
1. Log in as a CHW or Patient.
2. Open Browser DevTools Console and execute:
   ```javascript
   const { data, error } = await supabase
     .from('profiles')
     .update({ role: 'admin', status: 'approved' })
     .eq('id', (await supabase.auth.getUser()).data.user.id);
   console.log('Result:', { data, error });
   ```
   *Expected Output*: Error returned: `"Security Violation: Users cannot alter their own healthcare role or verification status."` (Postgres trigger `trg_enforce_profile_security` blocks it).

---

### Test Flow 4: Direct REST Call with Anon Key for Another User's Patients
1. In PowerShell:
   ```powershell
   $anonKey = "YOUR_ANON_KEY"
   $url = "https://hpnwtjntcmxwpslpjlzi.supabase.co/rest/v1/patients?select=*"
   Invoke-RestMethod -Uri $url -Headers @{ "apikey" = $anonKey; "Authorization" = "Bearer $anonKey" }
   ```
   *Expected Output*: `[]` (empty array). Anonymous callers cannot view any patient data under RLS.

---

## 4. SQL Tests for RLS Verification Per Role

Run these test statements in the Supabase SQL Editor:

```sql
-- 1. Anonymous Caller (No JWT)
SET ROLE anon;
SELECT COUNT(*) AS anon_patient_count FROM public.patients;
-- Expected: 0

-- 2. Authenticated CHW Caller
SET ROLE authenticated;
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003'; -- Sunita Patil (CHW)
SELECT COUNT(*) AS chw_own_patients FROM public.patients;
-- Expected: Only returns patients where created_by or assigned_chw = Sunita's UUID

-- 3. Authenticated Doctor Caller
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000005'; -- Dr. Ananya Roy (Doctor)
SELECT COUNT(*) AS doctor_referred_patients FROM public.patients;
-- Expected: Returns only patients who have a row in public.referrals

-- 4. Reset Session
RESET ROLE;
```
