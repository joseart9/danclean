import { DateTime } from "luxon";

export function getCurrentDate(timeZone: string): Date {
  const now = DateTime.now().setZone(timeZone).startOf("day");
  return now.toJSDate();
}
