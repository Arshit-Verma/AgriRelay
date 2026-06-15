-- AgriRelay Database Schema & Seed Data (PostgreSQL / Supabase compatible)

-- 1. Drop existing tables if they exist (for easy re-running)
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS price_trends CASCADE;
DROP TABLE IF EXISTS govt_schemes CASCADE;
DROP TABLE IF EXISTS contamination_flags CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS harvest_recommendations CASCADE;
DROP TABLE IF EXISTS mandis CASCADE;
DROP TABLE IF EXISTS officers CASCADE;

-- 2. Create tables

-- Officers Table
CREATE TABLE officers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL UNIQUE,
    district VARCHAR(100) NOT NULL,
    crops_managed TEXT[] NOT NULL
);

-- Mandis Table
CREATE TABLE mandis (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL,
    predicted_price NUMERIC(10, 2) NOT NULL,
    supply_trust_score INT NOT NULL,
    crop VARCHAR(100) NOT NULL
);

-- Harvest Recommendations Table
CREATE TABLE harvest_recommendations (
    id VARCHAR(50) PRIMARY KEY,
    crop VARCHAR(100) NOT NULL,
    zone VARCHAR(100) NOT NULL REFERENCES officers(zone) ON DELETE CASCADE,
    days_to_optimal_harvest INT NOT NULL,
    confidence INT NOT NULL
);

-- Farmers Table
CREATE TABLE farmers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    acreage NUMERIC(5, 2) NOT NULL
);

-- Contamination Flags Table
CREATE TABLE contamination_flags (
    id VARCHAR(50) PRIMARY KEY,
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
    benefit_amount VARCHAR(100) NOT NULL
);

-- Price Trends Table
CREATE TABLE price_trends (
    id SERIAL PRIMARY KEY,
    week VARCHAR(10) NOT NULL,
    onion NUMERIC(10, 2) NOT NULL,
    tomato NUMERIC(10, 2) NOT NULL,
    chilli NUMERIC(10, 2) NOT NULL
);

-- SMS Log Table (For real-time SMS outbox registry)
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) REFERENCES officers(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Sent'
);

-- 3. Seed data matching mockData.js

-- Officers
INSERT INTO officers (id, name, zone, district, crops_managed) VALUES
('officer-001', 'Ananya Patil', 'Nashik North', 'Nashik', ARRAY['Onion', 'Tomato', 'Grapes']),
('officer-002', 'Rahul Meena', 'Kota Canal Belt', 'Kota', ARRAY['Soybean', 'Wheat', 'Coriander']),
('officer-003', 'Farida Begum', 'Guntur Delta', 'Guntur', ARRAY['Chilli', 'Paddy', 'Turmeric']),
('officer-004', 'Kavya Rao', 'Kolar', 'Kolar', ARRAY['Tomato', 'Ragi', 'Beans']),
('officer-005', 'Manjunath Gowda', 'Tumkur', 'Tumakuru', ARRAY['Coconut', 'Arecanut', 'Groundnut']),
('officer-006', 'Nandini Hegde', 'Hassan', 'Hassan', ARRAY['Coffee', 'Paddy', 'Pepper']),
('officer-007', 'Suresh Kumar', 'Mandya', 'Mandya', ARRAY['Sugarcane', 'Paddy', 'Ragi']);

-- Mandis
INSERT INTO mandis (id, name, lat, lng, current_price, predicted_price, supply_trust_score, crop) VALUES
('m-001', 'Lasalgaon APMC', 20.142, 74.239, 1620, 1840, 88, 'Onion'),
('m-002', 'Pimpalgaon Baswant', 20.166, 73.987, 1480, 1715, 81, 'Tomato'),
('m-003', 'Nashik Market Yard', 19.997, 73.789, 3850, 4025, 92, 'Grapes'),
('m-004', 'Kota Krishi Upaj Mandi', 25.213, 75.864, 4340, 4210, 76, 'Soybean'),
('m-005', 'Ramganj Mandi', 24.646, 75.944, 6920, 7210, 84, 'Coriander'),
('m-006', 'Guntur Mirchi Yard', 16.306, 80.436, 13200, 14150, 73, 'Chilli'),
('m-007', 'Tenali Market Yard', 16.242, 80.64, 2180, 2325, 79, 'Paddy'),
('m-008', 'Duggirala Turmeric Yard', 16.323, 80.617, 7450, 7810, 86, 'Turmeric');

-- Harvest Recommendations
INSERT INTO harvest_recommendations (id, crop, zone, days_to_optimal_harvest, confidence) VALUES
('h-001', 'Onion', 'Nashik North', 9, 87),
('h-002', 'Tomato', 'Nashik North', 4, 82),
('h-003', 'Soybean', 'Kota Canal Belt', 16, 78),
('h-004', 'Chilli', 'Guntur Delta', 11, 91),
('h-005', 'Paddy', 'Guntur Delta', 21, 74);

-- Farmers
INSERT INTO farmers (id, name, village, phone, crop, acreage) VALUES
('f-001', 'Vilas Jadhav', 'Niphad', '+91 98765 12001', 'Onion', 3.5),
('f-002', 'Savitri More', 'Chandori', '+91 98765 12002', 'Tomato', 2.0),
('f-003', 'Ganesh Pawar', 'Ojhar', '+91 98765 12003', 'Grapes', 4.25),
('f-004', 'Meera Shinde', 'Lasalgaon', '+91 98765 12004', 'Onion', 2.75),
('f-005', 'Iqbal Shaikh', 'Palkhed', '+91 98765 12005', 'Tomato', 1.8),
('f-006', 'Harish Gurjar', 'Borkhera', '+91 98765 12006', 'Soybean', 5.0),
('f-007', 'Kamla Bai', 'Sangod', '+91 98765 12007', 'Wheat', 3.2),
('f-008', 'Prasad Reddy', 'Duggirala', '+91 98765 12008', 'Turmeric', 2.6),
('f-009', 'Lakshmi Devi', 'Tenali', '+91 98765 12009', 'Paddy', 4.8),
('f-010', 'Nagesh Rao', 'Pedakakani', '+91 98765 12010', 'Chilli', 3.9);

-- Contamination Flags
INSERT INTO contamination_flags (id, crop, location, lat, lng, severity, flag_date, batch_id) VALUES
('c-001', 'Tomato', 'Chandori cluster', 20.072, 73.918, 'medium', '2026-06-08', 'NSK-TOM-260608-A'),
('c-002', 'Onion', 'Lasalgaon east sheds', 20.139, 74.248, 'low', '2026-06-10', 'NSK-ONI-260610-C'),
('c-003', 'Chilli', 'Guntur drying yard 4', 16.309, 80.451, 'high', '2026-06-11', 'GNT-CHI-260611-B'),
('c-004', 'Paddy', 'Tenali intake point', 16.247, 80.641, 'medium', '2026-06-12', 'GNT-PAD-260612-D');

-- Govt Schemes
INSERT INTO govt_schemes (id, name, deadline, eligible_crops, benefit_amount) VALUES
('s-001', 'PM-Kisan Income Support', '2026-07-15', ARRAY['All registered crops'], '₹6,000/year'),
('s-002', 'MIDH Drip Irrigation Subsidy', '2026-08-01', ARRAY['Grapes', 'Tomato', 'Chilli'], 'Up to 55% equipment subsidy'),
('s-003', 'Onion Storage Structure Assistance', '2026-06-30', ARRAY['Onion'], '₹87,500 per unit'),
('s-004', 'RKVY Market Linkage Grant', '2026-09-10', ARRAY['Soybean', 'Coriander', 'Turmeric'], '₹25,000 per FPO member cluster'),
('s-005', 'Paddy Mechanisation Support', '2026-07-28', ARRAY['Paddy'], '40% machinery subsidy'),
('s-006', 'Spice Quality Certification Scheme', '2026-08-20', ARRAY['Chilli', 'Turmeric', 'Coriander'], '₹12,000 testing support');

-- Price Trends
INSERT INTO price_trends (week, onion, tomato, chilli) VALUES
('W1', 1320, 980, 12100),
('W2', 1410, 1120, 12650),
('W3', 1530, 1260, 13050),
('W4', 1620, 1480, 13200),
('W5', 1840, 1715, 14150);
