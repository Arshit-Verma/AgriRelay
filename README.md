# AgriRelay
Field Intelligence Platform for Agricultural Extension Officers


## Architecture:
<img width="2720" height="2320" alt="agrirelay_system_architecture" src="https://github.com/user-attachments/assets/0e8ef03b-a63e-4fb4-acc3-70a135c548c6" />

# AgriRelay 🌾
### Field Intelligence Platform for Agricultural Extension Officers

> *Where seeds meet satellites — through the people in between.*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Built at ArcNight 2026](https://img.shields.io/badge/Built%20at-ArcNight%202026-purple)](https://arcnight.in)
[![Domain: Agritech](https://img.shields.io/badge/Domain-Agritech-brightgreen)]()
[![Status: Hackathon MVP](https://img.shields.io/badge/Status-Hackathon%20MVP-orange)]()

---

## The Problem

India has 140 million farming households. Every harvest season, farmers in the same district harvest at the same time — flooding local mandis, crashing prices, and selling perishables at throwaway rates to middlemen. A farmer selling tomatoes at ₹3/kg has no idea the same produce is fetching ₹14/kg 80km away.

Existing solutions — weather apps, crop disease detectors, price dashboards — were built for a smartphone-carrying, WiFi-connected farmer. That farmer doesn't represent most of rural India.

**The gap isn't technology. It's the last mile.**

---

## Our Insight

There are **1.2 lakh Agricultural Extension Officers** across India — BSc Agriculture graduates, government-posted, technically literate, and already trusted by farming communities. They visit fields, relay government schemes, and advise on crop health.

They had no tools.

AgriRelay gives them a command center.

---

## What AgriRelay Does

AgriRelay is a field intelligence platform for Agricultural Extension Officers. It aggregates market pricing, sowing trends, and supply chain data to give officers AI-grade recommendations they can act on immediately — and relay to farmers via SMS, no smartphone required.

| Feature | Description |
|---|---|
| **Demand Forecast Engine** | Predicts supply-demand imbalances across mandis 2–3 weeks ahead using historical pricing and regional sowing data |
| **Harvest Timing Advisor** | Recommends optimal harvest windows per crop per zone to align with peak market demand — not just peak ripeness |
| **Smart Mandi Router** | Identifies the highest-value mandi within a configurable radius based on live supply/demand imbalance |
| **One-Click SMS Relay** | Officer sends pre-formatted vernacular SMS alerts to registered farmers — works on feature phones, zero data needed |
| **Contamination Audit Trail** | Officers geo-tag infected produce batches before they enter the supply chain; generates a live Supply Chain Trust Score per mandi zone |
| **Offline-First PWA** | Dashboard works without internet; syncs data when connectivity is restored |
| **Govt Scheme Feed** | Auto-pulls relevant advisories from agricultural department portals for the officer's zone |

---

## The Unique Layer: Supply Chain Trust Score

Every other agritech solution detects disease after the fact. AgriRelay prevents contaminated produce from entering the supply chain undetected.

When an officer flags an infected batch — crop type, GPS location, severity — that data propagates through the system:

- Mandis receiving supply from flagged zones receive a **depressed Trust Score**
- Aggregators and FPOs see **which zones have clean supply** and can route procurement accordingly
- The contamination dataset compounds into a **national produce quality map** that becomes more valuable every season

This is the only feature in this problem space that protects both ends of the supply chain simultaneously.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                           │
│  AgMarkNet/eNAM APIs  │  Satellite NDVI  │  Weather APIs   │
└────────────┬──────────┴────────┬─────────┴────────┬────────┘
             │                  │                   │
             ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI PREDICTION ENGINE                      │
│    Demand Forecasting  │  Harvest Timing  │  Mandi Routing  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             EXTENSION OFFICER DASHBOARD (PWA)               │
│  Zone Map  │  Recommendations  │  SMS Compose  │  Flag Tool │
└───────┬────────────────────────────────┬────────────────────┘
        │                                │
        ▼                                ▼
┌───────────────┐                ┌───────────────────────┐
│  SMS Gateway  │                │   Govt Scheme Portal  │
│ (Twilio/MSG91)│                │   Contamination Log   │
└───────┬───────┘                └───────────────────────┘
        │
        ▼
┌───────────────┐
│    FARMER     │
│  Feature phone│
│  No data req. │
└───────────────┘
```

---

## Tech Stack

**Frontend**
- React.js + Tailwind CSS
- Leaflet.js — interactive zone and mandi maps
- Recharts — price trend visualizations
- Workbox / Service Workers — offline-first PWA

**Backend**
- Python FastAPI
- PostgreSQL + PostGIS — geospatial zone queries
- Redis — caching live mandi price feeds

**Data & AI**
- AgMarkNet / eNAM APIs — live and historical mandi pricing
- NDVI satellite feeds — regional sowing trend estimation
- ARIMA / LSTM model — demand forecasting per crop per region
- Crop calendar dataset — district-wise harvest window baseline

**Infrastructure & Integrations**
- Twilio / MSG91 — SMS gateway for farmer relay
- Cloudflare Pages — frontend deployment
- Railway — backend hosting
- GitHub Actions — CI/CD

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- PostgreSQL ≥ 14 with PostGIS extension
- A Twilio or MSG91 account (for SMS)

### Clone the repo

```bash
git clone https://github.com/your-org/agrirelay.git
cd agrirelay
```

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env        # fill in your API base URL
npm run dev
```

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in DB credentials, API keys
uvicorn main:app --reload
```

### Environment variables

**Frontend `.env`**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=your_mapbox_token
```

**Backend `.env`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/agrirelay
AGMARKNET_API_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
SECRET_KEY=your_jwt_secret
```

### Database setup

```bash
cd backend
psql -U postgres -c "CREATE DATABASE agrirelay;"
psql -U postgres -d agrirelay -c "CREATE EXTENSION postgis;"
python scripts/migrate.py
python scripts/seed_demo_data.py   # loads demo zone + mandi data
```

---

## Project Structure

```
agrirelay/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/              # Leaflet zone + mandi map
│   │   │   ├── Dashboard/        # Officer main dashboard
│   │   │   ├── SMSCompose/       # Farmer SMS relay panel
│   │   │   ├── ContaminationFlag/# Batch infection reporting
│   │   │   └── RecommendationCard/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/             # API client + offline cache
│   └── public/
│       └── sw.js                 # Service worker (offline PWA)
│
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── recommendations.py
│   │   │   ├── contamination.py
│   │   │   ├── sms.py
│   │   │   └── officers.py
│   │   └── models/
│   ├── ml/
│   │   ├── demand_forecast.py    # ARIMA/LSTM price forecasting
│   │   ├── harvest_timing.py
│   │   └── mandi_router.py
│   ├── data/
│   │   ├── ingest_agmarknet.py
│   │   └── ingest_ndvi.py
│   └── scripts/
│       ├── migrate.py
│       └── seed_demo_data.py
│
└── docs/
    └── api_reference.md
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recommendations/{zone_id}` | Harvest timing + mandi routing recommendations for a zone |
| `GET` | `/api/mandis/trustscore` | Live trust scores for all mandis in radius |
| `POST` | `/api/contamination/flag` | Submit a contamination report (crop, GPS, severity) |
| `POST` | `/api/sms/send` | Trigger SMS relay to farmer group |
| `GET` | `/api/schemes/{zone_id}` | Active govt schemes relevant to zone's crops |
| `GET` | `/api/prices/forecast/{crop}/{mandi_id}` | 3-week price forecast for a crop at a mandi |

Full API reference: [`docs/api_reference.md`](docs/api_reference.md)

---

## Impact

- **1.2 lakh** extension officers already deployed across India — zero new hiring needed to scale
- **One officer** serves 500–1,000 farmers — a single deployment reaches hundreds of thousands
- **₹0 cost to the farmer** — the officer is government-salaried; farmers get the benefit for free
- **Feature phone compatible** — the SMS relay requires no smartphone, no data plan on the farmer's end
- **Compounding data** — every contamination flag makes the trust score more accurate; the system improves passively every season

---

## Built At

**ArcNight 2026** — Agritech Domain
Hosted by Microsoft Innovations Club

---

## License

MIT — see [LICENSE](LICENSE) for details.
