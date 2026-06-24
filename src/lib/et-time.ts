export function etDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function etMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
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
