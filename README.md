# AgriRelay

Field intelligence platform for agricultural extension officers.

> *Where seeds meet satellites — through the people in between.*

**Status:** hackathon MVP, built at ArcNight 2026 (Agritech domain, hosted by Microsoft Innovations Club). The prices and farmers in the demo are sample data.

## The problem

Every harvest season, farmers in the same district harvest at the same time. Local mandis flood, prices crash, and perishables are sold at throwaway rates. A farmer selling tomatoes at ₹3/kg often has no idea the same produce is fetching ₹14/kg 80 km away.

Weather apps, disease detectors and price dashboards were built for a farmer with a smartphone and WiFi. That farmer doesn't represent most of rural India.

## The insight

India has about 1.2 lakh Agricultural Extension Officers. They are technically trained, government-posted and already trusted by farmers. AgriRelay gives them a command center, and they relay the advice to farmers by SMS, with no smartphone needed on the farmer's end.

## What works today

| Feature | Status |
|---|---|
| Officer sign-in with hashed passwords and login tokens | Working |
| Zone-specific dashboard for four Karnataka zones | Working |
| Price forecast for the next 3 weeks | Working, on sample price history |
| Harvest timing advice | Working, on sample crop plans |
| Best-mandi routing after transport cost | Working |
| Contamination flags and live Supply Trust Scores | Working |
| Government scheme list filtered by zone crops | Working, on sample schemes |
| Offline mode with sync on reconnect | Working |
| Kannada and English message templates | Working |
| SMS sending | **Simulated.** Messages are logged, but no SMS is sent |
| Live mandi prices from data.gov.in | Built, not yet tested against the real service |
| Real price history feed, weather or satellite inputs to the forecast | Not built |

## How the numbers are calculated

The logic is meant to be simple enough for an officer to question. The settings are at the top of [`backend/forecast.js`](backend/forecast.js) and [`backend/trustScore.js`](backend/trustScore.js).

- **Price forecast:** a straight trend line through the last 8 weeks, extended 3 weeks. The shaded range covers roughly 80% of likely outcomes, based on how far prices have strayed from the trend.
- **Harvest timing:** compares the expected price gain from waiting with the crop's spoilage from staying in the field. If waiting gains under 0.5%, it says to harvest at maturity.
- **Mandi routing:** ranks mandis trading the crop by what the farmer keeps after transport (₹0.5 per quintal per km). It looks within 200 km and skips mandis with a trust score under 40, unless nothing else is available.
- **Supply Trust Score:** each contamination flag from the last 30 days within 50 km lowers a mandi's score by 3 (low), 8 (medium) or 15 (high).

These settings are estimates and should be checked by someone with field experience.

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, Leaflet, Recharts, vite-plugin-pwa
- **Backend:** Node.js, Express, PostgreSQL (Supabase or any Postgres), bcryptjs, jsonwebtoken
- **Testing:** Node's built-in test runner

## Project structure

```
AgriRelay/
├── database.sql          Tables and demo data
├── public/               App icons
├── src/
│   ├── api/              API client and offline write queue
│   ├── components/       Layout and shared UI
│   ├── constants/        Crop colours and SMS templates
│   ├── context/          Signed-in officer and zone data
│   ├── hooks/            Data loading and sync status
│   ├── pages/            The login page and six app screens
│   └── utils/            Date formatting
└── backend/
    ├── server.js         API routes
    ├── auth.js           Login tokens
    ├── forecast.js       Forecast, harvest timing and routing
    ├── trustScore.js     Supply Trust Score
    ├── queries.js        Database queries
    ├── db.js             Database connection
    ├── setup-db.js       Loads database.sql
    ├── set-password.js   Sets officer passwords
    └── tests/            Automated tests
```

## Getting started

You need Node.js 18 or newer and a Postgres database. A free [Supabase](https://supabase.com) project works.

**1. Install**

```bash
npm install
npm --prefix backend install
```

**2. Configure the backend**

Copy `backend/.env.example` to `backend/.env` and fill in `DATABASE_URL` and `JWT_SECRET`. In Supabase, use the connection string under **Connect → Session pooler**.

**3. Create the tables and demo data**

```bash
npm --prefix backend run db:setup
```

This only runs on an empty database. To erase the AgriRelay tables and reload the demo data, run `npm --prefix backend run db:setup -- --reset`.

**4. Give officers a password**

Nobody can sign in until they have one. Run this without an ID to list the officers:

```bash
npm --prefix backend run officer:password
```

Then set a password for one of them:

```bash
npm --prefix backend run officer:password -- officer-004
```

| Officer ID | Zone |
|---|---|
| `officer-004` | Kolar |
| `officer-005` | Tumkur |
| `officer-006` | Hassan |
| `officer-007` | Mandya |

**5. Run the app**

In one terminal, start the backend:

```bash
npm --prefix backend run dev
```

In another, start the frontend, then open <http://localhost:5173>:

```bash
npm run dev
```

## Offline mode

Offline support only runs in a production build, not under `npm run dev`:

```bash
npm run build
npm run preview -- --port 5173
```

Once an officer has opened a page online, it stays available offline with its last saved data, and the top bar shows how old that data is. Contamination flags and message log entries made offline are kept on the device and sent when the connection returns. Signing out clears the saved data.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the frontend |
| `npm run build` | Builds the frontend for production |
| `npm run lint` | Checks the code style |
| `npm test` | Runs the automated tests |
| `npm --prefix backend run dev` | Starts the backend and restarts it on changes |
| `npm --prefix backend run db:setup` | Creates the tables and demo data |
| `npm --prefix backend run officer:password` | Lists officers or sets a password |

## Environment variables

**`backend/.env`**

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `JWT_SECRET` | Yes | Signs login tokens |
| `OPENWEATHER_API_KEY` | No | Real weather. Without it the top bar shows a placeholder |
| `OGD_API_KEY` | No | Live mandi prices from data.gov.in |
| `PORT` | No | Backend port, default 5000 |
| `CORS_ORIGIN` | No | Frontend address, default `http://localhost:5173` |

**`.env` in the project root (optional)**

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend address, default `http://localhost:5000` |

## API

Everything except sign-in needs an `Authorization: Bearer <token>` header. An officer's zone always comes from their token.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Sign in with `officerId` and `password` |
| `GET` | `/api/mandis` | All mandis with forecasts and trust scores |
| `GET` | `/api/farmers` | Farmers in the officer's zone |
| `GET` | `/api/harvest-recommendations` | Harvest and routing advice for the zone |
| `GET` | `/api/price-trends?crop=Tomato` | Price history, forecast and past seasons |
| `GET` | `/api/contamination-flags` | Flags in the zone |
| `POST` | `/api/contamination-flags` | Save a new flag |
| `GET` | `/api/govt-schemes` | Schemes for the zone's crops |
| `POST` | `/api/sms/send` | Record a message in the log. Sends no SMS |
| `GET` | `/api/sms/logs` | Message history for the zone |
| `GET` | `/api/weather` | Weather for the zone |

## Troubleshooting

**"Connection terminated due to connection timeout"** usually means your network blocks database ports 5432 and 6543, which is common on college and office WiFi. Try a phone hotspot or a VPN.

**The backend stops straight away** with a message about `DATABASE_URL` or `JWT_SECRET`. Add the missing value to `backend/.env`.

**"Incorrect Officer ID or password"** can also mean that officer has no password yet. See step 4.

**`npm run dev` shows an old version** after you've tried the production build. The offline service worker is still active for that address. Clear the site's data in your browser's developer tools (Application → Storage → Clear site data).

## Known limitations

- Prices, farmers and schemes are sample data. Forecasts are only as good as the price history behind them.
- The trend line follows prices only. It can't foresee a sudden supply flood, and it doesn't use weather or sowing data.
- Each crop has one price history, applied to every mandi trading it.
- Contamination locations are simulated near the zone centre, because the form doesn't capture GPS yet.
- Automated tests cover the backend logic. The screens have been tested by hand.

## License

MIT
