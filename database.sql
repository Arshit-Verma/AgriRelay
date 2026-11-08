-- AgriRelay Database Schema & Seed Data (PostgreSQL / Supabase compatible)
--
-- Run this with `npm run db:setup` from backend/.
-- It erases every AgriRelay table first, so that command refuses to run on a database
-- that already has tables in it unless you pass --reset.

-- 1. Drop existing tables if they exist (for easy re-running)
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS price_seasons CASCADE;
DROP TABLE IF EXISTS price_trends CASCADE;
DROP TABLE IF EXISTS govt_schemes CASCADE;
DROP TABLE IF EXISTS contamination_flags CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS crop_plans CASCADE;
DROP TABLE IF EXISTS mandis CASCADE;
DROP TABLE IF EXISTS officers CASCADE;

-- 2. Create tables

-- Officers Table (one officer per zone)
CREATE TABLE officers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL UNIQUE,
    district VARCHAR(100) NOT NULL,
    zone_code VARCHAR(10) NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    crops_managed TEXT[] NOT NULL,
    password_hash TEXT -- set with "npm run officer:password"; empty means this officer can't sign in yet
);

-- Mandis Table
CREATE TABLE mandis (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL,
    supply_trust_score INT NOT NULL, -- before penalties from recent contamination flags
    crop VARCHAR(100) NOT NULL
);

-- Crop Plans Table (what each zone grows and when it will be ready; harvest advice is calculated from this)
CREATE TABLE crop_plans (
    id VARCHAR(50) PRIMARY KEY,
    crop VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL REFERENCES officers(zone) ON DELETE CASCADE,
    days_to_maturity INT NOT NULL
);

-- Farmers Table
CREATE TABLE farmers (
    id VARCHAR(50) PRIMARY KEY,
    zone VARCHAR(100) NOT NULL REFERENCES officers(zone) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    acreage NUMERIC(5, 2) NOT NULL
);

-- Contamination Flags Table
CREATE TABLE contamination_flags (
    id VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    zone VARCHAR(100) NOT NULL REFERENCES officers(zone) ON DELETE CASCADE,
    crop VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    flag_date DATE NOT NULL DEFAULT CURRENT_DATE,
    batch_id VARCHAR(50) NOT NULL UNIQUE
);

-- Government Schemes Table
CREATE TABLE govt_schemes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    deadline DATE NOT NULL,
    eligible_crops TEXT[] NOT NULL,
    benefit_amount VARCHAR(100) NOT NULL,
    details TEXT NOT NULL
);

-- Price Trends Table (actual weekly prices for each crop; forecasts are calculated from this)
CREATE TABLE price_trends (
    id SERIAL PRIMARY KEY,
    crop VARCHAR(100) NOT NULL,
    week VARCHAR(10) NOT NULL,
    actual NUMERIC(10, 2) NOT NULL,
    UNIQUE (crop, week)
);

-- Price Seasons Table (how past seasons turned out for each crop)
CREATE TABLE price_seasons (
    id SERIAL PRIMARY KEY,
    crop VARCHAR(100) NOT NULL,
    season VARCHAR(20) NOT NULL,
    week VARCHAR(10) NOT NULL,
    price VARCHAR(20) NOT NULL,
    delta VARCHAR(30) NOT NULL,
    is_positive BOOLEAN NOT NULL
);

-- SMS Log Table (a record of relayed messages; no SMS gateway is connected yet)
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    zone VARCHAR(100) NOT NULL REFERENCES officers(zone) ON DELETE CASCADE,
    crop VARCHAR(100),
    recipients INT NOT NULL DEFAULT 0,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'Sent'
);

-- Block Supabase's public Data API. The backend connects directly as the table owner, so it is unaffected.
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandis ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contamination_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE govt_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- 3. Seed data. Dates are relative to the day this runs so the demo starts out current.

-- Officers
INSERT INTO officers (id, name, zone, district, zone_code, center_lat, center_lng, crops_managed) VALUES
('officer-004', 'Kavya Rao', 'Kolar', 'Kolar', 'KLR', 13.1369, 78.1294, ARRAY['Tomato', 'Onion', 'Maize']),
('officer-005', 'Manjunath Gowda', 'Tumkur', 'Tumakuru', 'TMK', 13.3379, 77.101, ARRAY['Onion', 'Maize']),
('officer-006', 'Nandini Hegde', 'Hassan', 'Hassan', 'HSN', 13.0072, 76.0962, ARRAY['Maize', 'Tomato']),
('officer-007', 'Suresh Kumar', 'Mandya', 'Mandya', 'MDY', 12.5218, 76.8951, ARRAY['Tomato', 'Maize']);

-- Mandis
INSERT INTO mandis (id, name, lat, lng, current_price, supply_trust_score, crop) VALUES
('m-001', 'Bangalore APMC', 12.9716, 77.5946, 310, 82, 'Tomato'),
('m-002', 'Kolar Mandi', 13.1369, 78.1294, 140, 54, 'Tomato'),
('m-003', 'Tumkur APMC', 13.3379, 77.101, 420, 76, 'Onion'),
('m-004', 'Hassan Mandi', 13.0072, 76.0962, 190, 74, 'Maize'),
('m-005', 'Mandya APMC', 12.5218, 76.8951, 280, 78, 'Tomato'),
('m-006', 'Chikkaballapur', 13.4355, 77.7315, 380, 44, 'Onion'),
('m-007', 'Ramanagara', 12.7157, 77.2819, 210, 100, 'Maize'),
('m-008', 'Mysuru APMC', 12.2958, 76.6394, 295, 68, 'Tomato');

-- Crop Plans
INSERT INTO crop_plans (id, crop, zone, days_to_maturity) VALUES
('h-001', 'Tomato', 'Kolar', 6),
('h-002', 'Onion', 'Kolar', 14),
('h-003', 'Maize', 'Kolar', 21),
('h-004', 'Onion', 'Tumkur', 9),
('h-005', 'Maize', 'Tumkur', 16),
('h-006', 'Maize', 'Hassan', 12),
('h-007', 'Tomato', 'Hassan', 5),
('h-008', 'Tomato', 'Mandya', 7),
('h-009', 'Maize', 'Mandya', 18);

-- Farmers
INSERT INTO farmers (id, zone, name, village, phone, crop, acreage) VALUES
('f-001', 'Kolar', 'Raju Gowda', 'Mulbagal', '98XX XX4821', 'Tomato', 3.2),
('f-002', 'Kolar', 'Lakshmi Devi', 'Srinivaspur', '97XX XX1193', 'Tomato', 2.1),
('f-003', 'Kolar', 'Venkatesh K', 'Bangarpet', '99XX XX8874', 'Onion', 4.5),
('f-004', 'Kolar', 'Muniraj S', 'KGF Block', '98XX XX2256', 'Tomato', 1.8),
('f-005', 'Kolar', 'Savitha Bai', 'Malur', '96XX XX5532', 'Maize', 5),
('f-006', 'Kolar', 'Hanumaiah T', 'Kolar', '97XX XX9910', 'Tomato', 2.7),
('f-007', 'Kolar', 'Parvathi N', 'Gudibanda', '98XX XX3341', 'Onion', 3.3),
('f-008', 'Kolar', 'Basavaraju M', 'Chintamani', '99XX XX7762', 'Maize', 6.1),
('f-009', 'Kolar', 'Kamala R', 'Sidlaghatta', '97XX XX4453', 'Tomato', 1.5),
('f-010', 'Kolar', 'Thimma Reddy', 'Bagepalli', '98XX XX8821', 'Onion', 4),
('f-011', 'Tumkur', 'Shivanna B', 'Sira', '98XX XX6120', 'Onion', 3.6),
('f-012', 'Tumkur', 'Gowramma H', 'Tiptur', '97XX XX2047', 'Maize', 2.8),
('f-013', 'Tumkur', 'Narasimha Murthy', 'Gubbi', '99XX XX5316', 'Onion', 4.2),
('f-014', 'Tumkur', 'Rangamma K', 'Koratagere', '96XX XX7781', 'Maize', 1.9),
('f-015', 'Tumkur', 'Ramesh Naik', 'Madhugiri', '98XX XX1439', 'Onion', 5.1),
('f-016', 'Tumkur', 'Sharada V', 'Kunigal', '97XX XX9052', 'Maize', 3),
('f-017', 'Hassan', 'Puttaswamy G', 'Arsikere', '98XX XX3370', 'Maize', 4.4),
('f-018', 'Hassan', 'Jayamma R', 'Belur', '97XX XX6604', 'Tomato', 1.7),
('f-019', 'Hassan', 'Mahadevappa S', 'Holenarsipur', '99XX XX2198', 'Maize', 5.5),
('f-020', 'Hassan', 'Roopa D', 'Channarayapatna', '96XX XX4083', 'Tomato', 2.3),
('f-021', 'Hassan', 'Chandregowda M', 'Alur', '98XX XX7715', 'Maize', 3.8),
('f-022', 'Hassan', 'Nagaratna P', 'Sakleshpur', '97XX XX5529', 'Tomato', 1.4),
('f-023', 'Mandya', 'Boregowda T', 'Maddur', '98XX XX8246', 'Tomato', 2.9),
('f-024', 'Mandya', 'Sumitra L', 'Malavalli', '97XX XX3168', 'Maize', 3.4),
('f-025', 'Mandya', 'Kempegowda N', 'Srirangapatna', '99XX XX6491', 'Tomato', 2.2),
('f-026', 'Mandya', 'Yashoda C', 'Pandavapura', '96XX XX1875', 'Maize', 4.7),
('f-027', 'Mandya', 'Siddaraju A', 'Nagamangala', '98XX XX9303', 'Tomato', 3.1),
('f-028', 'Mandya', 'Mangala K', 'KR Pet', '97XX XX7420', 'Maize', 2.5);

-- Contamination Flags
INSERT INTO contamination_flags (id, zone, crop, location, lat, lng, severity, flag_date, batch_id) VALUES
('c-001', 'Kolar', 'Tomato', 'Mulbagal Cluster', 13.1642, 78.3946, 'high', CURRENT_DATE - 6, 'KLR-TOM-' || to_char(CURRENT_DATE - 6, 'YYMMDD') || '-A'),
('c-002', 'Kolar', 'Tomato', 'Kolar Gold Fields Yard', 12.9592, 78.2719, 'medium', CURRENT_DATE - 5, 'KLR-TOM-' || to_char(CURRENT_DATE - 5, 'YYMMDD') || '-B'),
('c-003', 'Kolar', 'Onion', 'Srinivaspur Storage', 13.3378, 78.2146, 'low', CURRENT_DATE - 4, 'KLR-ONI-' || to_char(CURRENT_DATE - 4, 'YYMMDD') || '-C'),
('c-004', 'Tumkur', 'Onion', 'Sira Storage Sheds', 13.7414, 76.9046, 'medium', CURRENT_DATE - 8, 'TMK-ONI-' || to_char(CURRENT_DATE - 8, 'YYMMDD') || '-A'),
('c-005', 'Tumkur', 'Maize', 'Gubbi Drying Yard', 13.312, 76.94, 'low', CURRENT_DATE - 7, 'TMK-MAI-' || to_char(CURRENT_DATE - 7, 'YYMMDD') || '-B'),
('c-006', 'Hassan', 'Maize', 'Arsikere Intake Point', 13.3142, 76.2566, 'low', CURRENT_DATE - 9, 'HSN-MAI-' || to_char(CURRENT_DATE - 9, 'YYMMDD') || '-A'),
('c-007', 'Mandya', 'Tomato', 'Maddur Collection Centre', 12.5846, 77.0442, 'high', CURRENT_DATE - 5, 'MDY-TOM-' || to_char(CURRENT_DATE - 5, 'YYMMDD') || '-A'),
('c-008', 'Mandya', 'Maize', 'Malavalli Yard', 12.3859, 77.0607, 'medium', CURRENT_DATE - 4, 'MDY-MAI-' || to_char(CURRENT_DATE - 4, 'YYMMDD') || '-B');

-- Govt Schemes
INSERT INTO govt_schemes (id, name, deadline, eligible_crops, benefit_amount, details) VALUES
('s-001', 'PM-Kisan Income Support Scheme', CURRENT_DATE + 31, ARRAY['Tomato', 'Onion', 'Maize', 'All Registered Crops'], '₹6,000 / year direct benefit', 'Direct financial assistance paid in three equal installments to all landholding farmer families.'),
('s-002', 'MIDH Micro-Irrigation Drip Subsidy', CURRENT_DATE + 48, ARRAY['Tomato', 'Onion'], 'Up to 55% equipment funding support', 'Mission for Integrated Development of Horticulture. Covers customized drip lines, micro-sprinklers, and localized pumps.'),
('s-003', 'National Onion Storage Infrastructure Grant', CURRENT_DATE + 16, ARRAY['Onion'], '₹87,500 subsidy per unit structure', 'Assistance for creating scientific low-cost ventilated storage structures to avoid post-harvest moisture decay.'),
('s-004', 'RKVY Agri-Market Infrastructure Linkage Support', CURRENT_DATE + 88, ARRAY['Maize', 'Tomato'], '₹25,000 per local FPO cluster node', 'Rashtriya Krishi Vikas Yojana. Grants allocated toward community sorting belts and digital weighing terminals.');

-- Price Trends
INSERT INTO price_trends (crop, week, actual) VALUES
('Tomato', 'W1', 290),
('Tomato', 'W2', 310),
('Tomato', 'W3', 295),
('Tomato', 'W4', 330),
('Tomato', 'W5', 305),
('Tomato', 'W6', 340),
('Tomato', 'W7', 360),
('Tomato', 'W8', 380),
('Onion', 'W1', 380),
('Onion', 'W2', 395),
('Onion', 'W3', 410),
('Onion', 'W4', 390),
('Onion', 'W5', 405),
('Onion', 'W6', 420),
('Onion', 'W7', 430),
('Onion', 'W8', 425),
('Maize', 'W1', 180),
('Maize', 'W2', 185),
('Maize', 'W3', 190),
('Maize', 'W4', 188),
('Maize', 'W5', 195),
('Maize', 'W6', 200),
('Maize', 'W7', 205),
('Maize', 'W8', 210);

-- Price Seasons
INSERT INTO price_seasons (crop, season, week, price, delta, is_positive) VALUES
('Tomato', 'Kharif ''25', 'W9', '₹480/q', '+12% above avg', true),
('Tomato', 'Rabi ''25', 'W7', '₹290/q', '-18% below avg', false),
('Tomato', 'Kharif ''24', 'W10', '₹510/q', '+19% above avg', true),
('Onion', 'Kharif ''25', 'W8', '₹440/q', '+8%', true),
('Onion', 'Rabi ''25', 'W6', '₹310/q', '-22%', false),
('Onion', 'Kharif ''24', 'W9', '₹460/q', '+11%', true),
('Maize', 'Kharif ''25', 'W9', '₹225/q', '+7%', true),
('Maize', 'Rabi ''25', 'W8', '₹178/q', '-14%', false),
('Maize', 'Kharif ''24', 'W10', '₹238/q', '+9%', true);

-- SMS Logs
INSERT INTO sms_logs (officer_id, zone, crop, recipients, message, sent_at, status) VALUES
('officer-004', 'Kolar', 'Tomato', 8, 'AgriRelay Alert: Tomato prices forecast at Rs.520/q at Bangalore APMC. Best window: within 8 days.', NOW() - INTERVAL '2 hours', 'Delivered'),
('officer-004', 'Kolar', 'Onion', 3, 'AgriRelay Alert: Your Onion crop is ready to harvest in 14 days. Do not delay beyond the optimal window.', NOW() - INTERVAL '16 hours', 'Delivered'),
('officer-004', 'Kolar', 'Maize', 5, 'AgriRelay: Govt scheme ''MIDH Drip Irrigation'' offers 55% subsidy. Apply at your nearest agri office.', NOW() - INTERVAL '50 hours', 'Delivered'),
('officer-005', 'Tumkur', 'Onion', 3, 'AgriRelay Alert: Onion prices forecast at Rs.490/q at Tumkur APMC. Contact your extension officer to arrange transport.', NOW() - INTERVAL '5 hours', 'Delivered'),
('officer-006', 'Hassan', 'Maize', 3, 'AgriRelay Alert: Maize prices forecast at Rs.240/q at Hassan Mandi. Contact your extension officer to arrange transport.', NOW() - INTERVAL '9 hours', 'Delivered'),
('officer-007', 'Mandya', 'Tomato', 3, 'AgriRelay Alert: Tomato prices forecast at Rs.520/q at Bangalore APMC. Contact your extension officer to arrange transport.', NOW() - INTERVAL '20 hours', 'Delivered');
