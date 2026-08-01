ALTER TABLE trucks ADD COLUMN monthly_salary DECIMAL DEFAULT 0;
ALTER TABLE excavators ADD COLUMN hourly_rate DECIMAL DEFAULT 0;
ALTER TABLE plants ADD COLUMN hourly_rate DECIMAL DEFAULT 0;

CREATE TABLE gold_production (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  grams DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE capital_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT CHECK (target_type IN ('worker', 'truck', 'excavator', 'plant')) NOT NULL,
  target_id UUID NOT NULL,
  amount DECIMAL NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE gold_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
