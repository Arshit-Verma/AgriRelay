import { formatShortDate } from '../utils/format';
import { KANNADA_CROP_NAMES } from './crops';

const TEMPLATES = {
  EN: {
    market: (crop, mandi, price, date) =>
      `AgriRelay Alert: ${crop} prices forecast at Rs.${price}/q at ${mandi}. Best window: before ${date}. Contact your extension officer to arrange transport.`,
    harvest: (crop, days, window) =>
      `AgriRelay Alert: Your ${crop} crop is ready to harvest in ${days} days. Optimal window: ${window}. Do not delay beyond this date.`,
    scheme: (name, benefit, deadline) =>
      `AgriRelay: Govt scheme '${name}' offers ${benefit}. Apply before ${deadline} at your nearest agri office. Bring land records.`,
  },
  KN: {
    market: (crop, mandi, price, date) =>
      `AgriRelay: ${crop} ಬೆಲೆ ₹${price}/ಕ್ವಿ. ${mandi} ಗೆ ಕಳುಹಿಸಿ. ದಿನಾಂಕ: ${date} ರೊಳಗೆ.`,
    harvest: (crop, days, window) =>
      `AgriRelay: ನಿಮ್ಮ ${crop} ಬೆಳೆ ${days} ದಿನಗಳಲ್ಲಿ ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧವಾಗುತ್ತದೆ. ಉತ್ತಮ ಸಮಯ: ${window}.`,
    scheme: (name, benefit, deadline) =>
      `AgriRelay: '${name}' ಯೋಜನೆ: ${benefit}. ${deadline} ರೊಳಗೆ ಹತ್ತಿರದ ಕೃಷಿ ಕಚೇರಿಯಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.`,
  },
};

export function buildTemplateMessage(template, lang, recommendation, scheme) {
  const messages = TEMPLATES[lang];

  if (template === 'scheme') {
    return messages.scheme(scheme.name, scheme.benefitAmount, formatShortDate(scheme.deadline));
  }

  const crop = lang === 'KN' ? KANNADA_CROP_NAMES[recommendation.crop] : recommendation.crop;

  if (template === 'harvest') {
    const window = `${formatShortDate(recommendation.windowStart)}-${formatShortDate(recommendation.windowEnd)}`;
    return messages.harvest(crop, recommendation.daysToOptimalHarvest, window);
  }

  return messages.market(crop, recommendation.targetMandi, recommendation.targetPrice, formatShortDate(recommendation.windowEnd));
}

export function buildRoutingMessage(watchlist) {
  const destinations = watchlist.map((mandi) => `${mandi.name} (${mandi.crop}) Rs.${mandi.predictedPrice}/q`).join('; ');
  return `AgriRelay Alert: Best mandis now: ${destinations}. Contact your extension officer to arrange transport.`;
}
