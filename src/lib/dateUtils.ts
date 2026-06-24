/**
 * UTC Date Utility Functions
 *
 * All functions display timestamps in UTC to ensure consistency
 * across all timezones for both web and mobile users.
 *
 * DATEONLY fields (startDate, endDate, licenseExpiry) are stored as
 * plain "YYYY-MM-DD" strings with no time component — those are
 * already timezone-neutral and do NOT need these helpers.
 * Use formatUTCDate() only for full ISO timestamp display.
 */

const UTC_LOCALE = 'en-US';
const UTC_OPTS = { timeZone: 'UTC' } as const;

/**
 * Format a UTC ISO timestamp as a time string.
 * @example "2026-06-24T08:30:00.000Z" → "08:30 AM"
 */
export const formatUTCTime = (isoString: string | null | undefined): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(UTC_LOCALE, {
      ...UTC_OPTS,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

/**
 * Format a UTC ISO timestamp as a short date string.
 * @example "2026-06-24T08:30:00.000Z" → "Jun 24, 2026"
 */
export const formatUTCDate = (isoString: string | null | undefined): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(UTC_LOCALE, {
      ...UTC_OPTS,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Format a UTC ISO timestamp as a full date + time string.
 * @example "2026-06-24T08:30:00.000Z" → "Jun 24, 2026, 08:30 AM"
 */
export const formatUTCDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(UTC_LOCALE, {
      ...UTC_OPTS,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

/**
 * Safe parser for DATEONLY strings (e.g. "2026-06-24") used in
 * startDate / endDate / licenseExpiry fields. Appends T00:00Z to
 * force UTC midnight, preventing the browser from shifting the date
 * by local timezone offset. Returns a formatted date string.
 * @example "2026-06-24" → "Jun 24, 2026"
 */
export const formatDateOnly = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    // Append T00:00:00Z to parse as UTC midnight
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(UTC_LOCALE, {
      ...UTC_OPTS,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Get the current UTC date as a "YYYY-MM-DD" string.
 * Safe to use for date comparisons and DATEONLY DB fields.
 */
export const todayUTC = (): string => new Date().toISOString().split('T')[0];
