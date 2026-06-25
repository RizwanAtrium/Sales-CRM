export function etDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function zonedParts(date: Date, timeZone = "America/New_York") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const hour = value("hour");
  return { year: value("year"), month: value("month"), day: value("day"), hour: hour === 24 ? 0 : hour, minute: value("minute"), second: value("second") };
}

function offsetMinutes(date: Date, timeZone = "America/New_York") {
  const parts = zonedParts(date, timeZone);
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return (localAsUtc - date.getTime()) / 60000;
}

function etLocalToUtc(year: number, month: number, day: number, hour = 0, minute = 0, second = 0, ms = 0) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
  const offset = offsetMinutes(guess);
  return new Date(guess.getTime() - offset * 60000);
}

export function etDayRange(date = new Date()) {
  const [year, month, day] = etDateString(date).split("-").map(Number);
  const start = etLocalToUtc(year, month, day, 0, 0, 0, 0);
  const nextStart = etLocalToUtc(year, month, day + 1, 0, 0, 0, 0);
  return { start, end: new Date(nextStart.getTime() - 1), etDate: `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}` };
}

export function etMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const rawHour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function timeToMinutes(value = "11:00") {
  const [hour, minute] = value.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

export function loginPunctuality(now = new Date(), shiftStart = "11:00") {
  const diff = etMinutes(now) - timeToMinutes(shiftStart);
  if (diff < -5) return "EARLY";
  if (diff >= 30) return "LATE";
  return "ON_TIME";
}
