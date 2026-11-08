import { pool } from './db.js';

const rowsOf = async (text, params) => (await pool.query(text, params)).rows;

const FLAG_COLUMNS = `
  id, zone, crop, location, lat, lng, severity,
  to_char(flag_date, 'YYYY-MM-DD') AS date,
  batch_id AS "batchId"
`;

const SMS_LOG_COLUMNS = `
  id, officer_id AS "officerId", zone, crop, recipients, message, sent_at AS "sentAt", status
`;

const OFFICER_COLUMNS = `
  id, name, zone, district, zone_code AS "zoneCode",
  ARRAY[center_lat, center_lng] AS center, crops_managed AS "cropsManaged"
`;

export async function getOfficerByZone(zone) {
  const [officer] = await rowsOf(`SELECT ${OFFICER_COLUMNS} FROM officers WHERE zone = $1`, [zone]);
  return officer ?? null;
}

export async function getOfficerAccount(officerId) {
  const [row] = await rowsOf(
    `SELECT ${OFFICER_COLUMNS}, password_hash AS "passwordHash" FROM officers WHERE id = $1`,
    [officerId],
  );
  if (!row) return null;

  const { passwordHash, ...officer } = row;
  return { officer, passwordHash };
}

export const getMandis = () =>
  rowsOf(
    `SELECT id, name, lat, lng, crop,
            current_price::float AS "currentPrice",
            supply_trust_score AS "baseTrustScore"
     FROM mandis ORDER BY id`,
  );

export const getFarmers = (zone) =>
  rowsOf(
    `SELECT id, zone, name, village, phone, crop, acreage::float AS acreage
     FROM farmers WHERE ($1::text IS NULL OR zone = $1) ORDER BY id`,
    [zone ?? null],
  );

export const getCropPlans = (zone) =>
  rowsOf(
    `SELECT plan.id, plan.zone, plan.crop, plan.days_to_maturity AS "daysToMaturity",
            officer.center_lat AS "centerLat", officer.center_lng AS "centerLng"
     FROM crop_plans plan JOIN officers officer ON officer.zone = plan.zone
     WHERE ($1::text IS NULL OR plan.zone = $1) ORDER BY plan.id`,
    [zone ?? null],
  );

export const getContaminationFlags = (zone) =>
  rowsOf(
    `SELECT ${FLAG_COLUMNS} FROM contamination_flags
     WHERE ($1::text IS NULL OR zone = $1) ORDER BY flag_date DESC, id`,
    [zone ?? null],
  );

export const getRecentFlagLocations = (days) =>
  rowsOf(`SELECT lat, lng, severity FROM contamination_flags WHERE flag_date >= CURRENT_DATE - $1::int`, [days]);

export async function createContaminationFlag({ zone, crop, location, severity, batchId, lat, lng }) {
  const [flag] = await rowsOf(
    `INSERT INTO contamination_flags (zone, crop, location, severity, batch_id, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${FLAG_COLUMNS}`,
    [zone, crop, location, severity, batchId, lat, lng],
  );
  return flag;
}

export const getGovtSchemes = (zone) =>
  rowsOf(
    `SELECT id, name, eligible_crops AS "eligibleCrops", benefit_amount AS "benefitAmount", details,
            to_char(deadline, 'YYYY-MM-DD') AS deadline
     FROM govt_schemes
     WHERE $1::text IS NULL OR eligible_crops && (SELECT crops_managed FROM officers WHERE zone = $1)
     ORDER BY id`,
    [zone ?? null],
  );

export const getPriceHistory = (crop) =>
  rowsOf(
    `SELECT crop, week, actual::float AS actual
     FROM price_trends WHERE ($1::text IS NULL OR crop = $1) ORDER BY crop, id`,
    [crop ?? null],
  );

export const getPriceSeasons = (crop) =>
  rowsOf(
    `SELECT season, week, price, delta, is_positive AS "isPos"
     FROM price_seasons WHERE crop = $1 ORDER BY id`,
    [crop],
  );

export const getSmsLogs = (zone) =>
  rowsOf(
    `SELECT ${SMS_LOG_COLUMNS} FROM sms_logs
     WHERE ($1::text IS NULL OR zone = $1) ORDER BY sent_at DESC`,
    [zone ?? null],
  );

export async function createSmsLog({ officerId, zone, crop, recipients, message }) {
  const [log] = await rowsOf(
    `INSERT INTO sms_logs (officer_id, zone, crop, recipients, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${SMS_LOG_COLUMNS}`,
    [officerId, zone, crop ?? null, recipients ?? 0, message],
  );
  return log;
}
