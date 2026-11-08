// Date-only strings are read as local dates so they never shift by a day across timezones.
const toDate = (value) => new Date(value.length === 10 ? `${value}T00:00:00` : value);

// Nov 14, 2026
export const formatDate = (value) =>
  toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Nov 14
export const formatShortDate = (value) =>
  toDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Nov 14, 8:04 AM
export const formatDateTime = (value) =>
  toDate(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
