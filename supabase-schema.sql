-- ============================================================
-- SG INFINITY EMS — COMPLETE DATABASE SCHEMA
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE 1: profiles
-- Stores extended user info for both admin and employees.
-- Linked to Supabase Auth users via user_id (auth.users.id)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  department    TEXT,
  designation   TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  joined_at     DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: attendance_records
-- Daily attendance entry per employee.
-- clock_out_summary is stored as JSONB (array of ClockOutTask)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date                DATE NOT NULL,
  mode                TEXT NOT NULL DEFAULT 'work_from_office'
                        CHECK (mode IN ('work_from_office','work_from_home','field_work','half_day','on_leave')),
  status              TEXT NOT NULL DEFAULT 'clocked_in'
                        CHECK (status IN ('clocked_in','clocked_out','absent')),
  clock_in_time       TIMESTAMPTZ DEFAULT NOW(),
  clock_out_time      TIMESTAMPTZ,
  clock_out_summary   JSONB,  -- [{ task: string, status: 'done'|'working'|'pending' }]
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)       -- One record per employee per day
);

-- ============================================================
-- TABLE 3: leave_requests
-- Leave / WFH / early leave and other employee requests.
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('leave','work_from_home','early_leave','comp_off','other')),
  from_date    DATE NOT NULL,
  to_date      DATE NOT NULL,
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','on_hold')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: tasks
-- Tasks assigned by admin to specific employee or all employees.
-- assigned_to = NULL means the task is for ALL employees.
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assigned_to   UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL = all
  assigned_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'assigned'
                  CHECK (status IN ('assigned','working','pending','done')),
  priority      TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: notifications
-- Per-user notifications triggered by admin actions or system.
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general'
                 CHECK (type IN ('request_update','task_assigned','announcement','general')),
  is_read      BOOLEAN DEFAULT FALSE,
  related_id   UUID,  -- ID of the related request/task/announcement
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: announcements
-- Company-wide announcements created by admin.
-- Visible to all employees on their dashboard.
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- Automatically updates updated_at column on row changes.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_leave_requests
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- When a new user signs up via Supabase Auth, this trigger
-- automatically creates a row in the profiles table.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Employee'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Admin can read/write all rows.
-- Employees can only read/write their own rows.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;

-- Helper function: checks if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

-- ATTENDANCE policies
CREATE POLICY "Employees can view own attendance"
  ON attendance_records FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Employees can insert own attendance"
  ON attendance_records FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employees can update own attendance"
  ON attendance_records FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- LEAVE REQUESTS policies
CREATE POLICY "Employees can view own requests"
  ON leave_requests FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Employees can create requests"
  ON leave_requests FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can update any request"
  ON leave_requests FOR UPDATE USING (is_admin() OR user_id = auth.uid());

-- TASKS policies
CREATE POLICY "Employees can view assigned tasks"
  ON tasks FOR SELECT
  USING (assigned_to = auth.uid() OR assigned_to IS NULL OR is_admin());

CREATE POLICY "Admin can manage tasks"
  ON tasks FOR ALL USING (is_admin());

CREATE POLICY "Employees can update task status"
  ON tasks FOR UPDATE USING (assigned_to = auth.uid() OR assigned_to IS NULL);

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT WITH CHECK (TRUE);

-- ANNOUNCEMENTS policies
CREATE POLICY "All authenticated users can view active announcements"
  ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage announcements"
  ON announcements FOR ALL USING (is_admin());

-- ============================================================
-- SEED: Create the Admin Account
-- This creates the admin user in Supabase Auth.
-- After running this, the admin can log in with:
--   Email: admin1234@gmail.com
--   Password: admin@1234
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  role,
  aud,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000000',
  'admin1234@gmail.com',
  crypt('admin@1234', gen_salt('bf')),
  NOW(),
  'authenticated',
  'authenticated',
  '{"full_name": "SG Admin", "role": "admin"}',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;