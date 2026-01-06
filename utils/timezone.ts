/**
 * Timezone utilities for handling dates in Monterrey, Mexico timezone
 * Monterrey uses America/Monterrey timezone (UTC-6, with DST)
 */

const TIMEZONE = "America/Monterrey";

/**
 * Converts a local date string (YYYY-MM-DD) to UTC Date range
 * for querying the database. The database stores timestamps in UTC,
 * so we need to convert local date ranges to UTC ranges.
 *
 * @param dateString - Date string in format YYYY-MM-DD (interpreted as local time in Monterrey)
 * @returns Object with start and end Date objects in UTC
 */
export function dateStringToUTCRange(dateString: string): {
  start: Date;
  end: Date;
} {
  // Parse the date string
  const [year, month, day] = dateString.split("-").map(Number);

  // Find the UTC time that corresponds to midnight in Monterrey for this date
  // We'll test different UTC hours to find when it's midnight in Monterrey
  let offsetHours = 6; // Default to UTC-6 (standard time)

  // Test UTC times from 4 to 7 to find when it's midnight in Monterrey
  // This handles both standard time (UTC-6) and DST (UTC-5)
  for (let testHour = 4; testHour <= 7; testHour++) {
    const testUTC = new Date(Date.UTC(year, month - 1, day, testHour, 0, 0, 0));
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const monterreyTime = formatter.format(testUTC);
    const monterreyHour = parseInt(monterreyTime.split(":")[0]);

    if (monterreyHour === 0) {
      offsetHours = testHour;
      break;
    }
  }

  // Start of day in UTC = midnight in Monterrey
  const start = new Date(Date.UTC(year, month - 1, day, offsetHours, 0, 0, 0));

  // End of day = start of next day - 1ms
  const nextDay = new Date(start);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const end = new Date(nextDay.getTime() - 1);

  return { start, end };
}

/**
 * Converts a UTC date to a local date string (YYYY-MM-DD) in Monterrey timezone
 * This is useful for grouping daily sales by local date
 */
export function utcDateToLocalDateString(utcDate: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(utcDate);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  return `${year}-${month}-${day}`;
}
