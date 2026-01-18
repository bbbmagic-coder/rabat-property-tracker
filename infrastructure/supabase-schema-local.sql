-- ============================================
-- Rabat Property Tracker - Local Schema
-- (Without Supabase Auth - uses simple users table)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- USERS TABLE (simple local auth)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REST OF THE SCHEMA (same as Supabase version)
-- ============================================

-- DEVELOPERS TABLE
CREATE TABLE developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTIES TABLE
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,
    address TEXT,
    district TEXT,
    city TEXT DEFAULT 'Rabat',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOGRAPHY(POINT, 4326),
    price_min DECIMAL(15, 2),
    price_max DECIMAL(15, 2),
    price_per_sqm DECIMAL(10, 2),
    currency TEXT DEFAULT 'MAD',
    developer_id UUID REFERENCES developers(id),
    property_type TEXT,
    total_units INTEGER,
    bedrooms_min INTEGER,
    bedrooms_max INTEGER,
    area_min DECIMAL(10, 2),
    area_max DECIMAL(10, 2),
    construction_status TEXT,
    construction_start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    investment_score DECIMAL(5, 2) DEFAULT 0.00,
    location_score DECIMAL(5, 2) DEFAULT 0.00,
    price_score DECIMAL(5, 2) DEFAULT 0.00,
    developer_score DECIMAL(5, 2) DEFAULT 0.00,
    infrastructure_score DECIMAL(5, 2) DEFAULT 0.00,
    status_score DECIMAL(5, 2) DEFAULT 0.00,
    distance_to_university INTEGER,
    distance_to_school INTEGER,
    distance_to_mall INTEGER,
    distance_to_beach INTEGER,
    distance_to_transport INTEGER,
    distance_to_downtown INTEGER,
    source_url TEXT,
    source_name TEXT,
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    image_urls TEXT[],
    amenities TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTY UPDATES TABLE
CREATE TABLE property_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER WATCHLIST
CREATE TABLE user_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- USER PREFERENCES
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    notify_new_projects BOOLEAN DEFAULT TRUE,
    notify_price_changes BOOLEAN DEFAULT TRUE,
    notify_status_changes BOOLEAN DEFAULT TRUE,
    notify_weekly_report BOOLEAN DEFAULT TRUE,
    min_price DECIMAL(15, 2),
    max_price DECIMAL(15, 2),
    preferred_districts TEXT[],
    preferred_property_types TEXT[],
    min_bedrooms INTEGER,
    min_investment_score DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEARBY PLACES
CREATE TABLE nearby_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    place_type TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    google_place_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEARCH LOGS
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_query TEXT,
    results_found INTEGER DEFAULT 0,
    new_properties_added INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMAIL QUEUE
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_properties_location ON properties USING GIST(location);
CREATE INDEX idx_properties_developer ON properties(developer_id);
CREATE INDEX idx_properties_status ON properties(construction_status);
CREATE INDEX idx_properties_score ON properties(investment_score DESC);
CREATE INDEX idx_properties_price ON properties(price_min, price_max);
CREATE INDEX idx_properties_created ON properties(created_at DESC);
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_active ON properties(is_active);

CREATE INDEX idx_property_updates_property ON property_updates(property_id);
CREATE INDEX idx_property_updates_created ON property_updates(created_at DESC);

CREATE INDEX idx_watchlist_user ON user_watchlist(user_id);
CREATE INDEX idx_watchlist_property ON user_watchlist(property_id);

CREATE INDEX idx_nearby_places_location ON nearby_places USING GIST(location);
CREATE INDEX idx_nearby_places_type ON nearby_places(place_type);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_user ON email_queue(user_id);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    SELECT * INTO v_property FROM properties WHERE id = property_id;
    
    -- Location Score (max 40)
    v_location_score := 0;
    
    IF v_property.distance_to_university IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(10, 10 * (1 - v_property.distance_to_university::DECIMAL / 5000));
    END IF;
    
    IF v_property.distance_to_school IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(10, 10 * (1 - v_property.distance_to_school::DECIMAL / 3000));
    END IF;
    
    IF v_property.distance_to_transport IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(10, 10 * (1 - v_property.distance_to_transport::DECIMAL / 1000));
    END IF;
    
    IF v_property.distance_to_mall IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(5, 5 * (1 - v_property.distance_to_mall::DECIMAL / 3000));
    END IF;
    
    IF v_property.distance_to_beach IS NOT NULL THEN
        v_location_score := v_location_score + LEAST(5, 5 * (1 - v_property.distance_to_beach::DECIMAL / 5000));
    END IF;
    
    -- Price Score (max 20)
    v_price_score := 15;
    
    -- Developer Score (max 20)
    IF v_property.developer_id IS NOT NULL THEN
        SELECT 
            (rating * 2) + (on_time_delivery_rate / 5)
        INTO v_developer_score
        FROM developers
        WHERE id = v_property.developer_id;
    ELSE
        v_developer_score := 10;
    END IF;
    
    -- Infrastructure Score (max 10)
    v_infrastructure_score := 5;
    
    -- Status Score (max 10)
    v_status_score := CASE v_property.construction_status
        WHEN 'completed' THEN 10
        WHEN 'construction' THEN 8
        WHEN 'approved' THEN 6
        WHEN 'planning' THEN 4
        ELSE 5
    END;
    
    v_total_score := v_location_score + v_price_score + v_developer_score + 
                     v_infrastructure_score + v_status_score;
    
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
-- TRIGGERS
-- ============================================

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

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO nearby_places (name, name_ar, place_type, latitude, longitude, location) VALUES
('Université Mohammed V', 'جامعة محمد الخامس', 'university', 33.9998, -6.8560, ST_SetSRID(ST_MakePoint(-6.8560, 33.9998), 4326)::geography),
('Institut Agronomique et Vétérinaire Hassan II', 'المعهد الوطني للبحث الزراعي', 'university', 33.8529, -6.7937, ST_SetSRID(ST_MakePoint(-6.7937, 33.8529), 4326)::geography),
('Mega Mall', 'ميغا مول', 'mall', 34.0012, -6.8343, ST_SetSRID(ST_MakePoint(-6.8343, 34.0012), 4326)::geography),
('Morocco Mall (près)', 'مغرب مول', 'mall', 33.5722, -7.6692, ST_SetSRID(ST_MakePoint(-7.6692, 33.5722), 4326)::geography),
('Gare de Rabat-Ville', 'محطة الرباط المدينة', 'transport', 34.0180, -6.8320, ST_SetSRID(ST_MakePoint(-6.8320, 34.0180), 4326)::geography),
('Rabat Beach', 'شاطئ الرباط', 'beach', 34.0380, -6.8120, ST_SetSRID(ST_MakePoint(-6.8120, 34.0380), 4326)::geography),
('Témara Beach', 'شاطئ تمارة', 'beach', 33.9280, -6.9060, ST_SetSRID(ST_MakePoint(-6.9060, 33.9280), 4326)::geography);

INSERT INTO developers (name, name_ar, website, rating, total_projects, completed_projects, on_time_delivery_rate) VALUES
('Alliances Développement Immobilier', 'أليانس للتطوير العقاري', 'https://www.alliances.ma', 4.5, 45, 38, 85.5),
('Palmeraie Développement', 'بالميري للتطوير', 'https://www.palmeraie-developpement.ma', 4.2, 32, 28, 82.0),
('Prestigia', 'بريستيجيا', 'https://www.prestigia.ma', 4.7, 28, 25, 90.0),
('Groupe Chaabi', 'مجموعة الشعبي', 'https://www.groupechaabi.com', 4.3, 55, 48, 87.5),
('Projet Promotion TGCC', 'مشروع بروموسيون تي جي سي سي', 'https://www.tgcc.ma', 4.0, 20, 17, 80.0);
