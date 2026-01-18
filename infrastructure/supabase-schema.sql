-- ============================================
-- Rabat Property Tracker - Supabase Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. DEVELOPERS TABLE (Fejlesztők)
-- ============================================
CREATE TABLE developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT, -- Arab név
    description TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00, -- 0-5.00
    total_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00, -- Százalék
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PROPERTIES TABLE (Ingatlanprojektek)
-- ============================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Alap információk
    title TEXT NOT NULL,
    title_ar TEXT, -- Arab cím
    description TEXT,
    description_ar TEXT,
    
    -- Lokáció
    address TEXT,
    district TEXT, -- Negyed (pl. Agdal, Hay Riad)
    city TEXT DEFAULT 'Rabat',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326), -- PostGIS pont
    
    -- Árazás
    price_min DECIMAL(15, 2), -- MAD
    price_max DECIMAL(15, 2), -- MAD
    price_per_sqm DECIMAL(10, 2), -- MAD/m²
    currency TEXT DEFAULT 'MAD',
    
    -- Projekt részletek
    developer_id UUID REFERENCES developers(id),
    property_type TEXT, -- 'apartment', 'villa', 'commercial', 'mixed'
    total_units INTEGER,
    bedrooms_min INTEGER,
    bedrooms_max INTEGER,
    area_min DECIMAL(10, 2), -- m²
    area_max DECIMAL(10, 2), -- m²
    
    -- Építési állapot
    construction_status TEXT, -- 'planning', 'approved', 'construction', 'completed'
    construction_start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    
    -- Score és értékelés
    investment_score DECIMAL(5, 2) DEFAULT 0.00, -- 0-100
    location_score DECIMAL(5, 2) DEFAULT 0.00, -- 0-40
    price_score DECIMAL(5, 2) DEFAULT 0.00, -- 0-20
    developer_score DECIMAL(5, 2) DEFAULT 0.00, -- 0-20
    infrastructure_score DECIMAL(5, 2) DEFAULT 0.00, -- 0-10
    status_score DECIMAL(5, 2) DEFAULT 0.00, -- 0-10
    
    -- Távolságok (méterben)
    distance_to_university INTEGER,
    distance_to_school INTEGER,
    distance_to_mall INTEGER,
    distance_to_beach INTEGER,
    distance_to_transport INTEGER,
    distance_to_downtown INTEGER,
    
    -- Adatforrás
    source_url TEXT,
    source_name TEXT,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Meta
    image_urls TEXT[], -- Array of képek
    amenities TEXT[], -- Array of szolgáltatások
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PROPERTY UPDATES TABLE (Változások)
-- ============================================
CREATE TABLE property_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    
    update_type TEXT NOT NULL, -- 'price_change', 'status_change', 'new_info', 'completion'
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. USER WATCHLIST (Kedvencek)
-- ============================================
CREATE TABLE user_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    
    notes TEXT, -- Felhasználó saját jegyzetei
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, property_id)
);

-- ============================================
-- 5. USER PREFERENCES (Felhasználói beállítások)
-- ============================================
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Email értesítések
    email_notifications BOOLEAN DEFAULT TRUE,
    notify_new_projects BOOLEAN DEFAULT TRUE,
    notify_price_changes BOOLEAN DEFAULT TRUE,
    notify_status_changes BOOLEAN DEFAULT TRUE,
    notify_weekly_report BOOLEAN DEFAULT TRUE,
    
    -- Szűrő preferenciák (mentett szűrők)
    min_price DECIMAL(15, 2),
    max_price DECIMAL(15, 2),
    preferred_districts TEXT[],
    preferred_property_types TEXT[],
    min_bedrooms INTEGER,
    min_investment_score DECIMAL(5, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. NEARBY PLACES (Közeli helyek cache)
-- ============================================
CREATE TABLE nearby_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name TEXT NOT NULL,
    name_ar TEXT,
    place_type TEXT NOT NULL, -- 'university', 'school', 'mall', 'transport', 'beach'
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    
    address TEXT,
    google_place_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. SEARCH LOGS (Keresési napló)
-- ============================================
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    search_query TEXT,
    results_found INTEGER DEFAULT 0,
    new_properties_added INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    status TEXT, -- 'success', 'error'
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. EMAIL QUEUE (Email küldési sor)
-- ============================================
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    recipient_email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL, -- 'new_project', 'price_alert', 'weekly_report'
    
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (Indexek)
-- ============================================

-- Properties indexek
CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_developer ON properties(developer_id);
CREATE INDEX idx_properties_status ON properties(construction_status);
CREATE INDEX idx_properties_score ON properties(investment_score DESC);
CREATE INDEX idx_properties_price ON properties(price_min, price_max);
CREATE INDEX idx_properties_created ON properties(created_at DESC);
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_active ON properties(is_active);

-- Property updates indexek
CREATE INDEX idx_property_updates_property ON property_updates(property_id);
CREATE INDEX idx_property_updates_created ON property_updates(created_at DESC);

-- User watchlist indexek
CREATE INDEX idx_watchlist_user ON user_watchlist(user_id);
CREATE INDEX idx_watchlist_property ON user_watchlist(property_id);

-- Nearby places indexek
CREATE INDEX idx_nearby_places_location ON nearby_places USING GIST(location);
CREATE INDEX idx_nearby_places_type ON nearby_places(place_type);

-- Email queue indexek
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_user ON email_queue(user_id);

-- ============================================
-- FUNCTIONS (Funkciók)
-- ============================================

-- Frissíti az updated_at mezőt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Számítja a távolságot két pont között (méterben)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL,
    lat2 DECIMAL, lon2 DECIMAL
)
RETURNS INTEGER AS $$
BEGIN
    RETURN ROUND(
        ST_Distance(
            ST_MakePoint(lon1, lat1)::geography,
            ST_MakePoint(lon2, lat2)::geography
        )
    )::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Újraszámítja az investment score-t
CREATE OR REPLACE FUNCTION recalculate_investment_score(property_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_location_score DECIMAL := 0;
    v_price_score DECIMAL := 0;
    v_developer_score DECIMAL := 0;
    v_infrastructure_score DECIMAL := 0;
    v_status_score DECIMAL := 0;
    v_total_score DECIMAL := 0;
    v_property RECORD;
BEGIN
    -- Property adatok lekérése
    SELECT * INTO v_property FROM properties WHERE id = property_id;
    
    -- 1. Location Score (max 40 pont)
    v_location_score := 0;
    
    -- Egyetem közelség (max 10)
    IF v_property.distance_to_university IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(10, 10 * (1 - v_property.distance_to_university::DECIMAL / 5000));
    END IF;
    
    -- Iskola közelség (max 10)
    IF v_property.distance_to_school IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(10, 10 * (1 - v_property.distance_to_school::DECIMAL / 3000));
    END IF;
    
    -- Tömegközlekedés (max 10)
    IF v_property.distance_to_transport IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(10, 10 * (1 - v_property.distance_to_transport::DECIMAL / 1000));
    END IF;
    
    -- Bevásárló (max 5)
    IF v_property.distance_to_mall IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(5, 5 * (1 - v_property.distance_to_mall::DECIMAL / 3000));
    END IF;
    
    -- Tengerpart (max 5)
    IF v_property.distance_to_beach IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(5, 5 * (1 - v_property.distance_to_beach::DECIMAL / 5000));
    END IF;
    
    -- 2. Price Score (max 20 pont) - TODO: környék átlagárával összevetni
    v_price_score := 15; -- Placeholder
    
    -- 3. Developer Score (max 20 pont)
    IF v_property.developer_id IS NOT NULL THEN
        SELECT 
            (rating * 2) + (on_time_delivery_rate / 5)
        INTO v_developer_score
        FROM developers
        WHERE id = v_property.developer_id;
    ELSE
        v_developer_score := 10; -- Default ha nincs fejlesztő
    END IF;
    
    -- 4. Infrastructure Score (max 10 pont)
    v_infrastructure_score := 5; -- Placeholder - jövőbeli fejlesztések alapján
    
    -- 5. Status Score (max 10 pont)
    v_status_score := CASE v_property.construction_status
        WHEN 'completed' THEN 10
        WHEN 'construction' THEN 8
        WHEN 'approved' THEN 6
        WHEN 'planning' THEN 4
        ELSE 5
    END;
    
    -- Total score
    v_total_score := v_location_score + v_price_score + v_developer_score + 
                     v_infrastructure_score + v_status_score;
    
    -- Frissítés
    UPDATE properties
    SET 
        location_score = v_location_score,
        price_score = v_price_score,
        developer_score = v_developer_score,
        infrastructure_score = v_infrastructure_score,
        status_score = v_status_score,
        investment_score = v_total_score
    WHERE id = property_id;
    
    RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS (Triggerek)
-- ============================================

-- Updated_at auto-update
CREATE TRIGGER update_developers_updated_at
    BEFORE UPDATE ON developers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- User watchlist policies
CREATE POLICY "Users can view own watchlist"
    ON user_watchlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
    ON user_watchlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
    ON user_watchlist FOR DELETE
    USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Public read access for properties, developers, nearby_places
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view properties"
    ON properties FOR SELECT
    USING (TRUE);

CREATE POLICY "Anyone can view developers"
    ON developers FOR SELECT
    USING (TRUE);

CREATE POLICY "Anyone can view nearby places"
    ON nearby_places FOR SELECT
    USING (TRUE);

-- ============================================
-- SEED DATA (Példa adatok)
-- ============================================

-- Nearby places seed (fontosabb helyek Rabatban)
INSERT INTO nearby_places (name, name_ar, place_type, latitude, longitude, location) VALUES
('Université Mohammed V', 'جامعة محمد الخامس', 'university', 33.9998, -6.8560, ST_SetSRID(ST_MakePoint(-6.8560, 33.9998), 4326)::geography),
('Institut Agronomique et Vétérinaire Hassan II', 'المعهد الوطني للبحث الزراعي', 'university', 33.8529, -6.7937, ST_SetSRID(ST_MakePoint(-6.7937, 33.8529), 4326)::geography),
('Mega Mall', 'ميغا مول', 'mall', 34.0012, -6.8343, ST_SetSRID(ST_MakePoint(-6.8343, 34.0012), 4326)::geography),
('Morocco Mall (près)', 'مغرب مول', 'mall', 33.5722, -7.6692, ST_SetSRID(ST_MakePoint(-7.6692, 33.5722), 4326)::geography),
('Gare de Rabat-Ville', 'محطة الرباط المدينة', 'transport', 34.0180, -6.8320, ST_SetSRID(ST_MakePoint(-6.8320, 34.0180), 4326)::geography),
('Rabat Beach', 'شاطئ الرباط', 'beach', 34.0380, -6.8120, ST_SetSRID(ST_MakePoint(-6.8120, 34.0380), 4326)::geography),
('Témara Beach', 'شاطئ تمارة', 'beach', 33.9280, -6.9060, ST_SetSRID(ST_MakePoint(-6.9060, 33.9280), 4326)::geography);

-- Developer seed
INSERT INTO developers (name, name_ar, website, rating, total_projects, completed_projects, on_time_delivery_rate) VALUES
('Alliances Développement Immobilier', 'أليانس للتطوير العقاري', 'https://www.alliances.ma', 4.5, 45, 38, 85.5),
('Palmeraie Développement', 'بالميري للتطوير', 'https://www.palmeraie-developpement.ma', 4.2, 32, 28, 82.0),
('Prestigia', 'بريستيجيا', 'https://www.prestigia.ma', 4.7, 28, 25, 90.0),
('Groupe Chaabi', 'مجموعة الشعبي', 'https://www.groupechaabi.com', 4.3, 55, 48, 87.5),
('Projet Promotion TGCC', 'مشروع بروموسيون تي جي سي سي', 'https://www.tgcc.ma', 4.0, 20, 17, 80.0);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE properties IS 'Ingatlanprojektek főtáblája';
COMMENT ON TABLE developers IS 'Ingatlanfejlesztők';
COMMENT ON TABLE property_updates IS 'Projekt változások naplója';
COMMENT ON TABLE user_watchlist IS 'Felhasználói kedvencek';
COMMENT ON TABLE user_preferences IS 'Felhasználói beállítások és szűrők';
COMMENT ON TABLE nearby_places IS 'Közeli fontosabb helyek cache';
COMMENT ON TABLE search_logs IS 'Automatikus keresések naplója';
COMMENT ON TABLE email_queue IS 'Email küldési sor';

-- ============================================
-- DONE!
-- ============================================
