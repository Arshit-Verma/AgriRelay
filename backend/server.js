import express from 'express';
import cors from 'cors';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { createToken, requireAuth } from './auth.js';
import { applyLivePrices, buildRecommendation, buildTrend, FORECAST_DAYS, projectPrice } from './forecast.js';
import * as queries from './queries.js';
import { applyContaminationPenalties, TRUST_WINDOW_DAYS } from './trustScore.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to backend/.env (see backend/.env.example).');
  process.exit(1);
}

// 1. INITIALIZE EXPRESS FIRST
const app = express();

// 2. APPLY THE ROBUST HACKATHON CORS CONFIGURATION IMMEDIATELY
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Date'], // lets the app show how old cached data is
  credentials: true
}));

// Handle preflight OPTIONS handshakes globally
app.options('*', cors());

app.use(express.json());

// Cache object for OpenWeather responses to minimize API hits
const weatherCache = {};

const FLAG_SEVERITIES = ['low', 'medium', 'high'];
const UNIQUE_VIOLATION = '23505';

// Compared against when an officer ID is unknown, so response time doesn't reveal which IDs exist
const UNUSABLE_PASSWORD_HASH = bcrypt.hashSync('no-account-has-this-password', 10);

// Sends errors from async route handlers to the error handler at the bottom of this file
const route = (handler) => (req, res, next) => handler(req, res).catch(next);

async function getZoneWeather(zone) {
  const officer = await queries.getOfficerByZone(zone);
  const city = officer?.district || zone;
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

async function fetchLivePriceRecords() {
  if (!process.env.OGD_API_KEY) return [];

  try {
    const response = await axios.get(
      `https://api.data.gov.in/resource/9ef842f6-9a05-4d7b-85d6-c39f28c245dd`,
      { params: { 'api-key': process.env.OGD_API_KEY, format: 'json', limit: 1000, 'filters[state.keyword]': 'Karnataka' }, timeout: 5000 }
    );
    return response.data?.records ?? [];
  } catch (err) {
    console.error('OGD API Request failed:', err.message);
    return [];
  }
}

async function getTrendsByCrop() {
  const historyByCrop = {};
  (await queries.getPriceHistory()).forEach(({ crop, week, actual }) => {
    (historyByCrop[crop] ??= []).push({ week, actual });
  });
  return Object.fromEntries(Object.entries(historyByCrop).map(([crop, history]) => [crop, buildTrend(history)]));
}

const trendFor = (trends, crop) => trends[crop] ?? buildTrend([]);

async function getMandis(trends) {
  const [baseMandis, recentFlags, liveRecords] = await Promise.all([
    queries.getMandis(),
    queries.getRecentFlagLocations(TRUST_WINDOW_DAYS),
    fetchLivePriceRecords(),
  ]);

  const pricedMandis = applyLivePrices(baseMandis, liveRecords).map((mandi) => ({
    ...mandi,
    predictedPrice: projectPrice(mandi.currentPrice, trendFor(trends, mandi.crop), FORECAST_DAYS),
  }));

  return applyContaminationPenalties(pricedMandis, recentFlags);
}

// Endpoints
app.post('/api/auth/login', route(async (req, res) => {
  const { officerId, password } = req.body;
  if (typeof officerId !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Officer ID and password are required' });
  }

  const account = await queries.getOfficerAccount(officerId.trim());
  const passwordMatches = await bcrypt.compare(password, account?.passwordHash ?? UNUSABLE_PASSWORD_HASH);

  if (!account?.passwordHash || !passwordMatches) {
    return res.status(401).json({ error: 'Incorrect officer ID or password' });
  }

  res.json({ token: createToken(account.officer), officer: account.officer });
}));

// Everything below needs a signed-in officer, and zone always comes from their token.
app.use('/api', requireAuth);

app.get('/api/weather', route(async (req, res) => {
  res.json(await getZoneWeather(req.officer.zone));
}));

app.get('/api/mandis', route(async (req, res) => {
  res.json(await getMandis(await getTrendsByCrop()));
}));

app.get('/api/farmers', route(async (req, res) => {
  res.json(await queries.getFarmers(req.officer.zone));
}));

app.get('/api/harvest-recommendations', route(async (req, res) => {
  const trends = await getTrendsByCrop();
  const [plans, mandis] = await Promise.all([queries.getCropPlans(req.officer.zone), getMandis(trends)]);

  res.json(plans.map((plan) => buildRecommendation(plan, trendFor(trends, plan.crop), mandis)).filter(Boolean));
}));

app.get('/api/contamination-flags', route(async (req, res) => {
  res.json(await queries.getContaminationFlags(req.officer.zone));
}));

app.post('/api/contamination-flags', route(async (req, res) => {
  const { crop, location, severity, batchId, lat, lng } = req.body;

  if (!crop || !location || !batchId || !FLAG_SEVERITIES.includes(severity) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'crop, location, severity, batchId, lat and lng are required' });
  }

  try {
    res.status(201).json(await queries.createContaminationFlag({ ...req.body, zone: req.officer.zone }));
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) return res.status(409).json({ error: 'That batch ID has already been flagged' });
    throw err;
  }
}));

app.get('/api/govt-schemes', route(async (req, res) => {
  res.json(await queries.getGovtSchemes(req.officer.zone));
}));

app.get('/api/price-trends', route(async (req, res) => {
  const { crop } = req.query;
  const [history, seasons] = await Promise.all([queries.getPriceHistory(crop), queries.getPriceSeasons(crop)]);
  if (!crop || history.length === 0) return res.status(404).json({ error: 'Unknown crop' });
  res.json({ series: buildTrend(history).series, seasons });
}));

// Only records the message in the log. No SMS is sent until a gateway is added.
app.post('/api/sms/send', route(async (req, res) => {
  if (!req.body.message) return res.status(400).json({ error: 'Message content is required' });
  const log = await queries.createSmsLog({ ...req.body, officerId: req.officer.id, zone: req.officer.zone });
  res.json({ success: true, log });
}));

app.get('/api/sms/logs', route(async (req, res) => {
  res.json(await queries.getSmsLogs(req.officer.zone));
}));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AgriRelay server running on port ${PORT}`);
});
