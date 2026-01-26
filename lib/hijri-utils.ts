import { DateObject } from 'react-multi-date-picker';
import arabic from 'react-date-object/calendars/arabic';
import arabic_ar from 'react-date-object/locales/arabic_ar';

/**
 * Format a Hijri date value for display.
 * Handles both new timestamp format and legacy human-readable format.
 *
 * @param value - Either a Unix timestamp (as string) or legacy "D Month YYYY AH" format
 * @returns Formatted string like "12 ربیع الاول 1446 AH"
 */
export const formatHijriForDisplay = (value: string | null | undefined): string => {
  if (!value) return '';

  // New format: timestamp (numeric string)
  if (/^\d+$/.test(value)) {
    const dateObj = new DateObject({
      date: Number(value),
      calendar: arabic,
      locale: arabic_ar,
    });
    return `${dateObj.day} ${dateObj.month.name} ${dateObj.year} AH`;
  }

  // Legacy format - return as-is (already human-readable)
  return value;
};

/**
 * Check if a value is in the new timestamp format
 */
export const isTimestampFormat = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return /^\d+$/.test(value);
};

/**
 * Create a DateObject from a stored value (handles both formats)
 * Returns undefined if value is empty or cannot be parsed
 */
export const createHijriDateObject = (
  value: string | null | undefined
): DateObject | undefined => {
  if (!value) return undefined;

  // New format: timestamp
  if (/^\d+$/.test(value)) {
    return new DateObject({
      date: Number(value),
      calendar: arabic,
      locale: arabic_ar,
    });
  }

  // Legacy format - cannot reliably parse back to DateObject
  // Return undefined so the picker shows empty (user must reselect)
  return undefined;
};

/**
 * Convert a DateObject to timestamp string for storage
 */
export const dateObjectToTimestamp = (date: DateObject): string => {
  return String(date.toUnix() * 1000);
};
