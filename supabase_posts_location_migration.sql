-- 1. Create Location Tables if not exists
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS public.provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    UNIQUE(name, country_id)
);

CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
    UNIQUE(name, province_id)
);

CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    UNIQUE(name, city_id)
);

-- 2. Populate Baseline Location Data
INSERT INTO public.countries (name, code) VALUES ('Pakistan', 'PK') ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    pak_id UUID;
    punjab_id UUID;
    rwp_id UUID;
BEGIN
    SELECT id INTO pak_id FROM public.countries WHERE name = 'Pakistan';
    
    INSERT INTO public.provinces (name, country_id) VALUES ('Punjab', pak_id) 
    ON CONFLICT (name, country_id) DO NOTHING;
    SELECT id INTO punjab_id FROM public.provinces WHERE name = 'Punjab' AND country_id = pak_id;

    INSERT INTO public.cities (name, province_id) VALUES ('Rawalpindi', punjab_id) 
    ON CONFLICT (name, province_id) DO NOTHING;
    SELECT id INTO rwp_id FROM public.cities WHERE name = 'Rawalpindi' AND province_id = punjab_id;

    INSERT INTO public.areas (name, city_id, latitude, longitude) VALUES 
        ('Dhoke Hassu', rwp_id, 33.6288, 73.0315),
        ('Dhoke Khabba', rwp_id, 33.6190, 73.0720),
        ('Satellite Town', rwp_id, 33.6391, 73.0735)
    ON CONFLICT (name, city_id) DO NOTHING;
END $$;

-- 3. Extend profiles table with location foreign keys if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 4. Enable RLS on location tables and allow public reads
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read countries" ON public.countries;
CREATE POLICY "Allow public read countries" ON public.countries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read provinces" ON public.provinces;
CREATE POLICY "Allow public read provinces" ON public.provinces FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read cities" ON public.cities;
CREATE POLICY "Allow public read cities" ON public.cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read areas" ON public.areas;
CREATE POLICY "Allow public read areas" ON public.areas FOR SELECT USING (true);

-- 5. Extend posts table with normalized area_id foreign key
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL;
