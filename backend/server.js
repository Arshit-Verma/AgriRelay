import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// 1. INITIALIZE EXPRESS FIRST
const app = express();

// 2. APPLY THE ROBUST HACKATHON CORS CONFIGURATION IMMEDIATELY
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight OPTIONS handshakes globally
app.options('*', cors());

app.use(express.json());

// Cache object for OpenWeather responses to minimize API hits
const weatherCache = {};

const ZONE_CITY_MAP = {
  'Nashik North': 'Nashik',
  'Kota Canal Belt': 'Kota',
  'Guntur Delta': 'Guntur',
  'Kolar': 'Kolar',
  'Tumkur': 'Tumakuru',
  'Hassan': 'Hassan',
  'Mandya': 'Mandya'
};

// In-Memory Database for local states to bypass Supabase for now
const officersList = [
  { id: 'officer-001', name: 'Ananya Patil', zone: 'Nashik North', district: 'Nashik', cropsManaged: ['Onion', 'Tomato', 'Grapes'] },
  { id: 'officer-002', name: 'Rahul Meena', zone: 'Kota Canal Belt', district: 'Kota', cropsManaged: ['Soybean', 'Wheat', 'Coriander'] },
  { id: 'officer-003', name: 'Farida Begum', zone: 'Guntur Delta', district: 'Guntur', cropsManaged: ['Chilli', 'Paddy', 'Turmeric'] },
  { id: 'officer-004', name: 'Kavya Rao', zone: 'Kolar', district: 'Kolar', cropsManaged: ['Tomato', 'Ragi', 'Beans'] },
  { id: 'officer-005', name: 'Manjunath Gowda', zone: 'Tumkur', district: 'Tumakuru', cropsManaged: ['Coconut', 'Arecanut', 'Groundnut'] },
  { id: 'officer-006', name: 'Nandini Hegde', zone: 'Hassan', district: 'Hassan', cropsManaged: ['Coffee', 'Paddy', 'Pepper'] },
  { id: 'officer-007', name: 'Suresh Kumar', zone: 'Mandya', district: 'Mandya', cropsManaged: ['Sugarcane', 'Paddy', 'Ragi'] }
];

const farmersList = [
  { id: 'f-001', name: 'Vilas Jadhav', village: 'Niphad', phone: '+91 98765 12001', crop: 'Onion', acreage: 3.5 },
  { id: 'f-002', name: 'Savitri More', village: 'Chandori', phone: '+91 98765 12002', crop: 'Tomato', acreage: 2.0 },
  { id: 'f-003', name: 'Ganesh Pawar', village: 'Ojhar', phone: '+91 98765 12003', crop: 'Grapes', acreage: 4.25 },
  { id: 'f-004', name: 'Meera Shinde', village: 'Lasalgaon', phone: '+91 98765 12004', crop: 'Onion', acreage: 2.75 },
  { id: 'f-005', name: 'Iqbal Shaikh', village: 'Palkhed', phone: '+91 98765 12005', crop: 'Tomato', acreage: 1.8 },
  { id: 'f-006', name: 'Harish Gurjar', village: 'Borkhera', phone: '+91 98765 12006', crop: 'Soybean', acreage: 5.0 },
  { id: 'f-007', name: 'Kamla Bai', village: 'Sangod', phone: '+91 98765 12007', crop: 'Wheat', acreage: 3.2 },
  { id: 'f-008', name: 'Prasad Reddy', village: 'Duggirala', phone: '+91 98765 12008', crop: 'Turmeric', acreage: 2.6 },
  { id: 'f-009', name: 'Lakshmi Devi', village: 'Tenali', phone: '+91 98765 12009', crop: 'Paddy', acreage: 4.8 },
  { id: 'f-010', name: 'Nagesh Rao', village: 'Pedakakani', phone: '+91 98765 12010', crop: 'Chilli', acreage: 3.9 }
];

const contaminationFlagsList = [
  { id: 'c-001', crop: 'Tomato', location: 'Chandori cluster', lat: 20.072, lng: 73.918, severity: 'medium', date: '2026-06-08', batchId: 'NSK-TOM-260608-A' },
  { id: 'c-002', crop: 'Onion', location: 'Lasalgaon east sheds', lat: 20.139, lng: 74.248, severity: 'low', date: '2026-06-10', batchId: 'NSK-ONI-260610-C' },
  { id: 'c-003', crop: 'Chilli', location: 'Guntur drying yard 4', lat: 16.309, lng: 80.451, severity: 'high', date: '2026-06-11', batchId: 'GNT-CHI-260611-B' },
  { id: 'c-004', crop: 'Paddy', location: 'Tenali intake point', lat: 16.247, lng: 80.641, severity: 'medium', date: '2026-06-12', batchId: 'GNT-PAD-260612-D' }
];

const govtSchemesList = [
  { id: 's-001', name: 'PM-Kisan Income Support', deadline: '2026-07-15', eligibleCrops: ['All registered crops'], benefitAmount: '₹6,000/year' },
  { id: 's-002', name: 'MIDH Drip Irrigation Subsidy', deadline: '2026-08-01', eligibleCrops: ['Grapes', 'Tomato', 'Chilli'], benefitAmount: 'Up to 55% equipment subsidy' },
  { id: 's-003', name: 'Onion Storage Structure Assistance', deadline: '2026-06-30', eligibleCrops: ['Onion'], benefitAmount: '₹87,500 per unit' },
  { id: 's-004', name: 'RKVY Market Linkage Grant', deadline: '2026-09-10', eligibleCrops: ['Soybean', 'Coriander', 'Turmeric'], benefitAmount: '₹25,000 per FPO member cluster' },
  { id: 's-005', name: 'Paddy Mechanisation Support', deadline: '2026-07-28', eligibleCrops: ['Paddy'], benefitAmount: '40% machinery subsidy' },
  { id: 's-006', name: 'Spice Quality Certification Scheme', deadline: '2026-08-20', eligibleCrops: ['Chilli', 'Turmeric', 'Coriander'], benefitAmount: '₹12,000 testing support' }
];

const priceTrendsList = [
  { week: 'W1', onion: 1320, tomato: 980, chilli: 12100 },
  { week: 'W2', onion: 1410, tomato: 1120, chilli: 12650 },
  { week: 'W3', onion: 1530, tomato: 1260, chilli: 13050 },
  { week: 'W4', onion: 1620, tomato: 1480, chilli: 13200 },
  { week: 'W5', onion: 1840, tomato: 1715, chilli: 14150 }
];

const harvestRecommendationsList = [
  { id: 'h-001', crop: 'Onion', zone: 'Nashik North', daysToOptimalHarvest: 9, confidence: 87 },
  { id: 'h-002', crop: 'Tomato', zone: 'Nashik North', daysToOptimalHarvest: 4, confidence: 82 },
  { id: 'h-003', crop: 'Soybean', zone: 'Kota Canal Belt', daysToOptimalHarvest: 16, confidence: 78 },
  { id: 'h-004', crop: 'Chilli', zone: 'Guntur Delta', daysToOptimalHarvest: 11, confidence: 91 },
  { id: 'h-005', crop: 'Paddy', zone: 'Guntur Delta', daysToOptimalHarvest: 21, confidence: 74 }
];

const smsLogs = [];

const baseMandis = [
  { id: 'm-001', name: 'Lasalgaon APMC', lat: 20.142, lng: 74.239, currentPrice: 1620, predictedPrice: 1840, supplyTrustScore: 88, crop: 'Onion' },
  { id: 'm-002', name: 'Pimpalgaon Baswant', lat: 20.166, lng: 73.987, currentPrice: 1480, predictedPrice: 1715, supplyTrustScore: 81, crop: 'Tomato' },
  { id: 'm-003', name: 'Nashik Market Yard', lat: 19.997, lng: 73.789, currentPrice: 3850, predictedPrice: 4025, supplyTrustScore: 92, crop: 'Grapes' },
  { id: 'm-004', name: 'Kota Krishi Upaj Mandi', lat: 25.213, lng: 75.864, currentPrice: 4340, predictedPrice: 4210, supplyTrustScore: 76, crop: 'Soybean' },
  { id: 'm-005', name: 'Ramganj Mandi', lat: 24.646, lng: 75.944, currentPrice: 6920, predictedPrice: 7210, supplyTrustScore: 84, crop: 'Coriander' },
  { id: 'm-006', name: 'Guntur Mirchi Yard', lat: 16.306, lng: 80.436, currentPrice: 13200, predictedPrice: 14150, supplyTrustScore: 73, crop: 'Chilli' },
  { id: 'm-007', name: 'Tenali Market Yard', lat: 16.242, lng: 80.64, currentPrice: 2180, predictedPrice: 2325, supplyTrustScore: 79, crop: 'Paddy' },
  { id: 'm-008', name: 'Duggirala Turmeric Yard', lat: 16.323, lng: 80.617, currentPrice: 7450, predictedPrice: 7810, supplyTrustScore: 86, crop: 'Turmeric' }
];

async function getZoneWeather(zone) {
  const city = ZONE_CITY_MAP[zone] || zone;
  const now = Date.now();
  
  if (weatherCache[city] && (now - weatherCache[city].timestamp < 600000)) {
    return weatherCache[city].data;
  }

  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { q: `${city},IN`, appid: apiKey, units: 'metric' }
    });

    const weatherData = {
      temp: response.data.main.temp,
      condition: response.data.weather[0].main,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
    };

    weatherCache[city] = { timestamp: now, data: weatherData };
    return weatherData;
  } catch (error) {
    return { temp: 28, condition: 'Clear', description: 'clear sky', humidity: 60 };
  }
}

// Endpoints
app.get('/api/weather', async (req, res) => {
  const { zone } = req.query;
  if (!zone) return res.status(400).json({ error: 'Zone parameter is required' });
  const weather = await getZoneWeather(zone);
  res.json(weather);
});

app.post('/api/auth/login', (req, res) => {
  const { officerId, zone } = req.body;
  const foundOfficer = officersList.find(o => o.zone === zone);
  if (foundOfficer) {
    res.json({ ...foundOfficer, id: officerId });
  } else {
    res.json({
      id: officerId,
      name: 'Dynamic Extension Officer',
      zone: zone || 'Kolar',
      district: zone || 'Kolar',
      cropsManaged: ['Tomato', 'Onion']
    });
  }
});

app.get('/api/mandis', async (req, res) => {
  try {
    let ogdPrices = {};
    if (process.env.OGD_API_KEY) {
      try {
        const ogdResponse = await axios.get(
          `https://api.data.gov.in/resource/9ef842f6-9a05-4d7b-85d6-c39f28c245dd`,
          { params: { 'api-key': process.env.OGD_API_KEY, format: 'json', limit: 100 }, timeout: 5000 }
        );
        if (ogdResponse.data && ogdResponse.data.records) {
          ogdResponse.data.records.forEach(rec => {
            const crop = rec.commodity ? rec.commodity.toLowerCase() : '';
            const price = parseFloat(rec.modal_price);
            if (crop && price) ogdPrices[crop] = price;
          });
        }
      } catch (err) {
        console.error('OGD API Request failed:', err.message);
      }
    }

    const mandisList = baseMandis.map(m => {
      const baseCrop = m.crop.toLowerCase();
      let currentPrice = m.currentPrice;
      let predictedPrice = m.predictedPrice;

      const matchedLiveCrop = Object.keys(ogdPrices).find(k => k.includes(baseCrop) || baseCrop.includes(k));
      if (matchedLiveCrop && ogdPrices[matchedLiveCrop]) {
        currentPrice = ogdPrices[matchedLiveCrop];
        predictedPrice = Math.round(currentPrice * (m.predictedPrice / m.currentPrice));
      }
      return { ...m, currentPrice, predictedPrice };
    });

    res.json(mandisList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/farmers', (req, res) => {
  const { zone } = req.query;

  if (zone) {
    const officer = officersList.find(o => o.zone === zone);

    // If a zone is provided but no hardcoded officer is found,
    // return the full farmersList so the dashboard table populates.
    if (!officer) return res.json(farmersList);

    const filtered = farmersList.filter(f => officer.cropsManaged.includes(f.crop));
    return res.json(filtered);
  }

  res.json(farmersList);
});

app.get('/api/harvest-recommendations', async (req, res) => {
  const { zone } = req.query;

  if (!zone) return res.json(harvestRecommendationsList);

  const filtered = harvestRecommendationsList.filter(h => h.zone === zone);

  // If zone filtering produces an empty array due to mismatch,
  // bypass filter and return full list as fallback.
  if (filtered.length === 0) return res.json(harvestRecommendationsList);

  res.json(filtered);
});

app.get('/api/contamination-flags', (req, res) => {
  res.json(contaminationFlagsList);
});

app.get('/api/govt-schemes', (req, res) => {
  res.json(govtSchemesList);
});

app.get('/api/price-trends', (req, res) => {
  res.json(priceTrendsList);
});

app.post('/api/sms/send', (req, res) => {
  const { officerId, message } = req.body;
  if (!message || !officerId) return res.status(400).json({ error: 'Officer ID and message content are required' });
  const logEntry = { id: smsLogs.length + 1, officer_id: officerId, message: message, created_at: new Date().toISOString(), status: 'Sent' };
  smsLogs.push(logEntry);
  res.json({ success: true, log: logEntry });
});

app.get('/api/sms/logs', (req, res) => {
  res.json(smsLogs);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AgriRelay server running on port ${PORT}`);
});