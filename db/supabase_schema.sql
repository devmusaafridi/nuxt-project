-- Profiles table to extend Supabase Auth
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'user', 'visitor')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger: auto-insert into profiles when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  IF user_role NOT IN ('super_admin', 'user', 'visitor') THEN
    user_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  assigned_user_id UUID REFERENCES profiles(id),
  capital_allocated DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Workers
CREATE TABLE workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  picture_url TEXT,
  cnic_picture_url TEXT,
  mobile_number TEXT,
  daily_salary DECIMAL NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Worker Attendance
CREATE TABLE worker_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('day', 'night', 'leave')) NOT NULL,
  UNIQUE(worker_id, date)
);

-- Trucks
CREATE TABLE trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  owner_name TEXT NOT NULL,
  owner_mobile_number TEXT,
  picture_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Truck Drivers (replaceable — history retained, only one is_active per truck)
CREATE TABLE truck_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  driver_name TEXT NOT NULL,
  picture_url TEXT,
  cnic_picture_url TEXT,
  mobile_number TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Truck Daily Attendance (Yes/No)
CREATE TABLE truck_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(truck_id, date)
);

-- Excavators
CREATE TABLE excavators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  owner_name TEXT NOT NULL,
  picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Excavator Drivers
CREATE TABLE excavator_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  excavator_id UUID REFERENCES excavators(id) ON DELETE CASCADE NOT NULL,
  driver_name TEXT NOT NULL,
  picture_url TEXT,
  cnic_picture_url TEXT,
  mobile_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Excavator Working Hours
CREATE TABLE excavator_working_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  excavator_id UUID REFERENCES excavators(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Plants
CREATE TABLE plants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Plant Working Hours
CREATE TABLE plant_working_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Diesel In
CREATE TABLE diesel_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  litres DECIMAL NOT NULL,
  price_per_litre DECIMAL NOT NULL,
  slip_image_url TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Diesel Out
CREATE TABLE diesel_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT CHECK (target_type IN ('truck', 'excavator', 'generator')) NOT NULL,
  target_id UUID,
  litres DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Maintenance
CREATE TABLE maintenance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('truck', 'generator', 'plant', 'excavator', 'other')) NOT NULL,
  cost DECIMAL NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Other Expenses
CREATE TABLE other_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('food', 'police', 'transport', 'miscellaneous')) NOT NULL,
  amount DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Gold Production
CREATE TABLE gold_production (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  grams DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Capital Investments
CREATE TABLE capital_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE truck_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE excavators ENABLE ROW LEVEL SECURITY;
ALTER TABLE excavator_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE excavator_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE diesel_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE diesel_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_investments ENABLE ROW LEVEL SECURITY;

-- Super Admin Policy (Can do everything)
CREATE POLICY super_admin_all ON profiles FOR ALL TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
-- Apply similar policies for other tables (simplified for brevity here, but should be exhaustive)
-- For example:
CREATE POLICY super_admin_projects ON projects FOR ALL TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- User Policy (Can access their own project data)
CREATE POLICY user_assigned_project ON projects FOR SELECT TO authenticated USING (
  assigned_user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Gold Production Privacy (Visitors cannot see it)
CREATE POLICY visitor_no_gold ON gold_production FOR SELECT TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'user')
);
