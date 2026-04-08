
ALTER TABLE public.client_projects
ADD COLUMN departure TEXT,
ADD COLUMN estimated_budget TEXT,
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;
